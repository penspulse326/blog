---
title: 使用 pnpm 建立 Vue 的 Monorepo
date: 2025-05-23 01:02:54
description: 使用 pnpm 建立 Vue 的 Monorepo
tags: ['筆記', 'pnpm', 'monorepo', 'vue']
keywords: ['pnpm', 'monorepo', 'vue']
slug: create-pnpm-monorepo-for-vue
---

最近想整理 GitHub 上面一些 repo，像是活動或課程作業的相關產出，應該都可以集合成一包大專案？剛好也想研究 Monorepo，發現 pnpm 本身就提供類似的管理模式。

## 環境建置

建立資料夾後先進行初始化：

```bash
pnpm init
```

新增 `pnpm-workspace.yaml`：

```bash
packages:
  - "apps/*"
```

把之前的專案都搬到 `apps` 這個資料夾底下作為 Monorepo 的子專案，並修改子專案的`package.json`，將 `name` 加上 `@apps/` 這個前綴：

```json
{
  "name": "@apps/week-1", // 從 "week-1" 改為 "@apps/week-1"
  "version": "0.0.0",
  "private": true,
  "type": "module"
  // 略...
}
```

pnpm 會將有這個前綴的資料夾，對應 `pnpm-workspace.yaml` 的設定，將其識別為一個工作區 (workspace)。

在根目錄執行 `pnpm install` 來測試子專案 `package.json` 的依賴套件能不能正常安裝。

確認子專案有出現 `node_modules` 之後，就可以執行：

```bash
pnpm --filter @apps/week-1 dev
```

參數 `--filter` 指向工作區 `@apps/week-1`，並且運行這個工作區 `package.json` 腳本中的 `dev`，跟**切換到這個目錄底下後執行** `pnpm dev` 是一樣的意思。

如果能正常啟動的話，專案初步的搬遷已經成功了！

---

## 腳本

剛剛的指令加到根目錄的腳本，就不用再打一長串的指令或是手動切換資料夾來啟動專案：

```json
{
  "scripts": {
    "week1:dev": "pnpm --filter @apps/week-1 dev",
    "week1:build": "pnpm --filter @apps/week-1 build",
    "week1:preview": "pnpm --filter @apps/week-1 preview"
  }
}
```

在根目錄執行剛剛自訂的腳本來啟動子專案：

```bash
pnpm week1:dev
```

---

## 共用設定

根目錄安裝的依賴套件可以作用在全部的工作區，所以像 Husky、commitlint、Prettier、ESLint 等等這些品質管理工具，都可以搬到根目錄做安裝與設定，讓子專案開發時可以直接共用。

這次搬是 `六角學院 2024 Vue 前端新手營` 的作業，所以包含 Vue 本體都可以搬到根目錄：

```json
{
  "name": "2024-vue-camp",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  // 把依賴項目搬到根目錄
  "dependencies": {
    "vue": "^3.4.29"
  },
  "devDependencies": {
    "@rushstack/eslint-patch": "^1.8.0",
    "@tsconfig/node20": "^20.1.4",
    "@types/node": "^20.14.5",
    "@vitejs/plugin-vue": "^5.0.5",
    "@vue/eslint-config-prettier": "^9.0.0",
    "@vue/eslint-config-typescript": "^13.0.0",
    "@vue/tsconfig": "^0.5.1",
    "eslint": "^8.57.0",
    "eslint-plugin-vue": "^9.23.0",
    "npm-run-all2": "^6.2.0",
    "prettier": "^3.2.5",
    "typescript": "~5.4.0",
    "vite": "^5.3.1",
    "vue-tsc": "^2.0.21"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

---

### 新增共用依賴

未來要在根目錄安裝新的套件時，需要帶上 `-W` 這個參數，來標註這是要在根目錄安裝的共用依賴項目，例如：

```bash
pnpm add axios -W
```

---

### ESLint

子專案**不一定全部都是同一套前端框架**，框架之間也有不同的最佳設定，所以建議子專案的設定可以留著：

```js
/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: false,
  extends: ['../../.eslintrc.cjs'],
  rules: {
    // 各種規則
  },
};
```

將 `root` 設為 `false`，讓 ESLint 可以向上層目錄解析，`extends` 填上根目錄的 `.eslintrc.cjs`，這樣就能繼承根目錄的設定，並自行加入、重寫規則。

在子專案寫一個不符合規則的寫法，看看會不會收到提示：

```ts
// 宣告一個沒有被用到的變數
const testRef = ref();
```

看到明顯的黃波浪，確認是 ESLint 的警告就算成功了：

```
'testRef' is assigned a value but never used. eslint(@typescript-eslint/no-unused-vars)
```

---

### TypeScript

透過 Vite 建立的 Vue 3 專案會有 3 個 TypeScript 設定檔：

1. `tsconfig.app.json`
2. `tsconfig.node.json`
3. `tsconfig.json`，將上面兩個設定檔加入參照

這些設定檔預設會從官方提供的現成設定 `@vue/tsconfig` 和 `@tsconfig/node20` 繼承，上面有提到專案可能包含其他不同框架，因此需要的 TypeScript 設定也不同，會牽涉到建構、打包的問題，所以根目錄我認為只放撰寫 lint 相關的設定會比較安全。

在根目錄新增共用設定 `tsconfig.base.json`：

```json
{
  "compilerOptions": {
    // 只放入 lint 相關的規則
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

修改子專案的 `tsconfig.app.json` 和 `tsconfig.node.json` 的 `extends`，使它們包含根目錄的共用設定：

```json
{
  "extends": ["@vue/tsconfig/tsconfig.dom.json", "../../tsconfig.base.json"]
  // 以下略
}
```

在子專案寫一個沒有指定參數型別的函式，測試是否有成功繼承到根目錄的設定：

```ts
function greet(name) {
  return 'Hello ' + name;
}
```

這個規則會違反 `noImplicitAny`（不允許隱式的 any），所以會收到提示：

`Parameter 'name' implicitly has an 'any' type.ts(7006)`

目前無法知道這個提示生效的原因，是基於 `@vue/tsconfig` 或 `@tsconfig/node20` 還是根目錄的 `tsconfig.base.json`。

`extends` 會照陣列順序來解析，所以順序比較後面的 `"../../tsconfig.base.json"`，如果有同名屬性的規則，應該要覆蓋過去，因此可以把 `noImplicitAny` 設為 `false` 來測試是不是有成功覆蓋。

確認設為 `false` 後如果沒有紅波浪的提示，TypeScript 的部分就算是設定完成了，測完要記得改回 `true`！

---

## 共用元件庫

同時經營多個產品線的話，通常會有一套共用的設計系統延伸到各個專案來維持品牌風格。

不論是純手刻，或是基於其他現成的元件庫做再封裝，都可以做成一個共用庫，達成更好的開發一致性，也更好配合 design token 的改動。

在根目錄建立資料夾 `/packages`，並在裡面建立一個 Vue 3 專案，`package.json` 中 Vue 相關的依賴套件都可以移除。

將 `name` 改為帶有 `@packages/` 的前綴，也要重新設定專案進入點：

```json
{
  "name": "@packages/shared-ui", // 加入前綴
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "src/main.ts" // 設定為 main.ts
}
```

在 `pnpm-workspace.yaml` 加入剛剛建立的 `/packages` 資料夾路徑：

```yml
packages:
  - 'apps/*'
  - 'packages/*'
```

修改完後要在根目錄執行 `pnpm install`，讓目前的環境重新識別到 `/packages`。

隨意新增兩個元件，並在 `main.ts` 導出：

```ts
import SharedButton from './components/SharedButton.vue';
import SharedBadge from './components/SharedBadge.vue';
import type { App } from 'vue';

export { SharedButton, SharedBadge };

export default {
  install(app: App) {
    app.component('SharedButton', SharedButton);
    app.component('SharedBadge', SharedBadge);
  },
};
```

切換到子專案安裝這個共用元件庫，安裝時要加入參數 `--workspace`，表示這個套件要**從本機工作區拉取**，而不是從 npm 的伺服器去找：

```bash
pnpm add @packages/shared-ui --workspace
```

在子專案的頁面使用共用元件：

```vue
<script setup lang="ts">
import { SharedButton, SharedBadge } from '@packages/shared-ui';
</script>

<template>
  <SharedButton>test btn</SharedButton>
  <SharedBadge label="test badge" />
</template>
```

IDE 沒有任何提示，子專案也能順利啟動的話就成功一半了。

嘗試直接修改共用元件的元件原始檔的樣式，如果熱重載有生效，那就成功啦！

---

### 打包

雖然這樣就可以部署了，不過為了支援 Tree-Shaking，共用庫通常會進行打包，導出一個整理乾淨的檔案，就像我們平常在使用 npm 抓下來的套件一樣。

首先要在共用庫裡面安裝 `vite-plugin-dts`，讓 Vue SFC 可以在打包時自動生成型別定義：

```bash
pnpm add -D vite-plugin-dts
```

新增 `vite.config.ts` 的打包設定：

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      outDir: 'dist',
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'shared-ui',
      fileName: 'shared-ui',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
```

`package.json` 的進入點 `main` 要改為打包後的 js 檔 `"main": "./dist/shared-ui.js"`，並加入 `exports`，讓其他子專案使用時可以識別共用庫打包後導出的檔案放在哪裡：

```json
{
  "name": "@packages/shared-ui",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/shared-ui.js",
  // 加入以下設定
  "exports": {
    ".": {
      "import": "./dist/shared-ui.js",
      "types": "./dist/main.d.ts"
    }
  },
  // 將需要導出的內容控制在 dist 資料夾內
  "files": ["dist"]
  // 以下略
}
```

`main` 和 `exports` 都是用來指定 Node.js 解析時的進入點，而 `exports` 的優先級更高。

`import` 用來指定 ESM 的進入點，`types` 指定型別的解析檔位置。

:::info
想要指定 CommonJS 的進入點，可以加上 `"require": "./dist/shared-ui.cjs"`，但就必須修改 `vite.config.ts`，讓打包也可以導出 `.cjs` 格式。
:::

設定好之後執行 `pnpm build` 會生成 `dist` 資料夾，並且包含 `vite.config.ts` 中指定的檔案。

**重新啟動子專案會發現元件的樣式不見了！**

因為還沒打包前，子專案是透過共用庫的進入點 `main.ts` 直接取出 Vue SFC，而打包後會變 `.js` 檔，不會自動內聯樣式，所以要修改打包設定，導出 `.css` 檔：

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'shared-ui',
      fileName: 'shared-ui',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
        // 加入 css 檔導出名稱與位置
        assetFileNames: 'assets/shared-ui.[ext]',
      },
    },
    // 導出單一 css 檔
    cssCodeSplit: false,
  },
  // 以下略
});
```

並在子專案的進入點導入 ：

```ts
import { createApp } from 'vue';
import App from './App.vue';

// 加入 css 檔
import '@packages/shared-ui/dist/assets/shared-ui.css';

createApp(App).mount('#app');
```

但會收到無法識別 css 檔路徑的報錯，需要要調整子專案的 `vite.config.ts`：

```ts
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/2024-vue-camp/week-1/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // 加入這行
      '@packages': resolve(__dirname, '../../packages'),
    },
  },
});
```

這樣就算是可以成功載入打包後的元件了。

:::info
元件打包後生成的 `.js` 檔可以透過 Node.js 自動解析模組，而 `.css` 檔則是普通的靜態資源，所以載入時必須寫出完整路徑，或是像上面的示範，在建構工具中寫入解析路徑的規則。
:::

:::warning
載入打包後的元件就不支援熱重載了，必須重新打包共用庫，子專案才能看到最新版的元件。所以通常會設定同時啟動共用庫與子專案的 `dev` 腳本並且加上 `--watch` 的參數，讓熱重載運作。
:::

---

## 部署

前端框架的專案無論如何都會經過打包階段，而 Vite 建起來的 Vue 專案已經很好心地安裝好這個套件 `npm-run-all2`，帶入參數 `--parallel` 就可以同時運行多個腳本。

在根目錄加入整個專案的打包腳本，但要留意共用庫通常會被其他子專案導入，所以**必須先執行完共用庫的** `build`，才能執行子專案的 `build`，否則會找不到相關的依賴：

```json
{
  "scripts": {
    "shared-ui:build": "pnpm --filter @packages/shared-ui build",
    // 先 build 共用庫 shared-ui 再執行其他腳本
    "build": "pnpm shared-ui:build && npm-run-all2 --parallel week1:build week2:build week3:build final:build"
    // 其他腳本
  }
}
```

確認沒有報錯後，就可以進行 GitHub Pages 的部署了！

也建議養成好習慣，先在本機打包或是透過 Husky 設定 Git Hook 觸發打包腳本，確保程式碼推送到 GitHub 之前，是可以正常完成打包任務的。

部署前要記得調整 `vite.config.ts` 生成的 base url，加上根目錄的 repo 名稱 `/2024-vue-camp/` 做前綴：

```ts
// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/2024-vue-camp/week-1/' : '/',
  // 以下略
});
```

---

### CI/CD

Vite 官網有提供 `workflows` 的[腳本](https://vite.dev/guide/static-deploy#github-pages)，只要專案在指定分支有收到新的推送，就會觸發 GitHub Actions 執行對應分支的 workflow，生成 GitHug Pages。

改寫一下官方的腳本：

```yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

# 設置 GitHub Pages 部署所需的權限
permissions:
  contents: read
  pages: write
  id-token: write

# 允許一個並行部署
concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  # 先構建共用元件庫
  build-shared-ui:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Setup PNPM
        uses: pnpm/action-setup@v2
        with:
          version: 8
          run_install: false

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install

      - name: Build shared-ui
        run: pnpm shared-ui:build

      # 將共用元件庫的構建結果保存為 artifact
      - name: Upload shared-ui artifact
        uses: actions/upload-artifact@v4
        with:
          name: shared-ui-dist
          path: packages/shared-ui/dist
          retention-days: 1

  # 為每個應用構建單獨的構建作業
  build:
    needs: build-shared-ui
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [week-1, week-2, week-3, final]

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Setup PNPM
        uses: pnpm/action-setup@v2
        with:
          version: 8
          run_install: false

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install

      # 下載共用元件庫的構建結果
      - name: Download shared-ui artifact
        uses: actions/download-artifact@v4
        with:
          name: shared-ui-dist
          path: packages/shared-ui/dist

      - name: Build
        run: |
          cd apps/${{ matrix.app }}
          pnpm build

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.app }}-dist
          path: apps/${{ matrix.app }}/dist
          retention-days: 1

  # 合併所有構建結果並部署
  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts

      - name: Prepare deployment structure
        run: |
          mkdir -p final_dist
          cp index.html final_dist/
          for app_dir in week-1 week-2 week-3 final; do
            mkdir -p final_dist/$app_dir
            cp -r artifacts/$app_dir-dist/* final_dist/$app_dir/
          done

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'final_dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

改寫的方向主要有：

1. 安裝 pnpm
2. 設定 pnpm 的暫存位置
3. 將 deploy 任務重新拆成 build 和 deploy
4. 共用庫與子專案的任務拆開
5. 使用 `matrix` 來指定所有需要打包的子專案
6. 使用 `actions/download-artifact@v4` 和 `actions/upload-artifact@v4` 來傳遞各個任務打包好的靜態檔案

設定檔看起來繁瑣，不過大致讀過後就發現，這些腳本還算是人類能讀懂的英文，但在這個時代當然不會自己一行一行寫腳本，你懂的 XD

---

## 導航頁面

部署完後在這個 GitHub Pages 的網址加上 `/week-1` 會導向到子專案，但根目錄本身沒有任何頁面，所以輸入這個 repo 的首頁 `/` 會導向 404，可以加上 `index.html` 進行導覽：

```html
<!doctype html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>六角學院 2024 Vue 前端新手營</title>
    <style>
      {/* 樣式略 */}
    </style>
  </head>
  <body>
    <h1>六角學院 2024 Vue 前端新手營作業</h1>
    <ul>
      <li>
        <a href="./week-1/">第一週作業</a>
      </li>
      <li>
        <a href="./week-2/">第二週作業</a>
      </li>
      <li>
        <a href="./week-3/">第三週作業</a>
      </li>
      <li>
        <a href="./final/">最終作業</a>
      </li>
    </ul>
  </body>
</html>
```

最後也提供我部署好的專案供參考：
https://github.com/penspulse326/2024-vue-camp

---

## 參考資料

- [Monorepo？來聊聊另一種專案管理架構吧！使用 Vite+ pnpm 建立 Vue3 Monorepo](https://israynotarray.com/other/20240413/3177435894/)
- [pnpm 管理專案 - monorepo](https://tzulinchang.medium.com/pnpm-%E7%AE%A1%E7%90%86%E5%B0%88%E6%A1%88-monorepo-96babcd1f1a6)
