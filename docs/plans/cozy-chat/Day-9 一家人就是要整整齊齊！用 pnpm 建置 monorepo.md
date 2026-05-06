---
title: 'Day 9 - 一家人就是要整整齊齊！用 pnpm 建置 monorepo'
description: 'Cozy Chat 專案第 9 天：一家人就是要整整齊齊！用 pnpm 建置 monorepo'
date: '2025-09-10 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day9'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1757490531000yoqf26.png)

這個專案我想把前後端都放在同個 repo，原因是：

1. 共用 TypeScript 型別
2. 共用依賴套件
3. 共用工具函式
4. 專案設定一致性
5. 不要讓自己的 GitHub 一直洗 repo 數量（？）

這時可以利用 monorepo 的概念集中管理！

雖然通常會先想到的工具是 Nx，不過設定稍微複雜，我自己也沒碰過，所以使用比較簡單的 pnpm 就可以滿足我的需求了。

## 建立專案

Next 專案使用 [Automatic installation](https://nextjs.org/docs/app/getting-started/installation#automatic-installation) 提供的指令建立即可。Express 部分則是複製我之前建立好的[模板](https://github.com/penspulse326/express-ts-template)複製下來。

目前的專案會有前後端兩包：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752031702000ch3ykl.png)

接下來可以切換到前後端專案的目錄，試試看能否各自運行：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752030838000yglrng.png)

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17520309080006dqp0n.png)

---

## 設定 workspace

在根目錄新增 `pnpm-workspace.yaml`：

```
packages:
  - "apps/*"
  - "packages/*"
```

pnpm 會讀取此設定，將 `apps/` 資料夾識別成工作區（workspace），規模較大的專案還會設置 `packages/` 等多個工作區，最後建起來的資料夾大概就像 Nx 那麼多（~~早知如此何不用 Nx~~）。

修改前後端專案 `package.json` 的 `name`：

- 前端：`"name": "@apps/web"`
- 後端：`"name": "@apps/server"`

加上 `@apps/` 這個前綴後，就會被辨識為工作區下的子專案。接下來將前後端的資料夾都搬到 `apps/`，然後在根目錄執行 `pnpm install`，就可以套用 `pnpm-workspace.yaml` 的設定。

在根目錄執行以下指令啟動後端專案：

```bash
pnpm --filter @apps/server dev
```

`--filter` 這個參數是用來指向工作區的子專案，如果指令敲下去能運行起來就算是成功囉！

這些指令也可以整合到根目錄的 `package.json`：

```json
{
  "scripts": {
    "web:dev": "pnpm --filter @apps/web dev",
    "web:build": "pnpm --filter @apps/web build",
    "server:dev": "pnpm --filter @apps/server dev",
    "server:build": "pnpm --filter @apps/server build"
  }
}
```

---

## 遷移共同項目

pnpm 沒有 Nx 內建的 CLI 系統可以建置任意框架專案並自動調整設定。很多東西需要自己手動處理，沒有模板可以參考的話一步一步做起來會很累。

但是，現代問題就用現代科技解決！我們可以使用 AI Agent 完成自動化建置，Cursor、Claude Code 等等，只要能操作到電腦檔案的 AI 都可以。

### 建立任務提示

要讓 AI 自己工作，就要將任務分類、具體流程、注意事項、驗收標準這些規格寫好......聽起來有沒有很像在發包作業？AI 就是我們的承包小弟啦（~~而且還可以壓榨它~~）！

像這樣透過自然語言提示 AI 執行特定任務的文件，也稱作**提示工程（Prompt Engineering）**。在大量導入 AI 的專案中，通常有資料夾存放這些提示文件，讓 AI 可以預先載入這些提示文件作為上下文，在之後的產出都能夠依照提示進行實作與規則檢查。

在根目錄新增 `docs/monorepo-start.prompt`：

```
# 建置 monorepo 指南

## 專案環境
- Language: TypeScript
- Package Management: pnpm
- Sub Projects:
  - Web: Next.js
  - Server: Express
- Test Framework: Vitest

## 任務流程

1. 將共通依賴項目與依賴項目的設定檔從 /apps 與 /packages 下的子專案移動到根目錄的 package.json
2. 更新根目錄與子專案的 package.json
3. 子專案需要保留原本的 TypeScript 與 ESLint 設定檔
4. 在根目錄建立 TypeScript 與 ESLint 的共同設定
5. 建立共用庫 packages/lib 並測試函式與型別能在子專案中使用
6. Prettier 設定只需要在根目錄建立

## 最終驗證
- 確認根目錄的 pnpm install 成功執行
- 確認子專案可以獨立執行：
  - pnpm lint
  - pnpm build
- 確認 git hook 可以正確執行
```

可以使用 markdown 格式撰寫，看上述內容應該會發現內容不多，只是描述會以條列式為主。只要明確地描述專案環境、流程項目、期望結果，產出就具備一定的準確度。

我有先在 `packages/lib` 新增一些型別和函式提供測試，其他設定我想讓 AI 在測試的過程中自動建好，所以寫得比較模糊。

這些提示還可以寫得更細緻，包含要比對、盤點哪些遷移項目等，像是 Vitest、Husky、commitlint 這些可以共通使用的套件。但目前我的方向是快速產出，看看 AI 產出的效果如何再做一點手動修正就好。

### 驗收成果

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752048189000ai6ape.png)

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752108844000c7gdwt.png)

我這次嘗試用使用免錢的 Gemini CLI 進行。任務結束後 Gemini 還有 97% 的上下文空間，所以理論上可以執行更久的長任務。但...免錢的最貴，除了執行到一半會從 Gemini Pro 切回 Gemini Flash 外，一定時間內能消耗的額度也是有限制的。可參考[配額與限制](https://cloud.google.com/gemini/docs/quotas?hl=zh-tw)

記得要輸入 `Ctrl + Y` 開啟 YOLO 模式，否則執行到一些檔案讀寫與終端指令時，Gemini 會停下來等我們同意。

手動建置 monorepo 時本來就會有一些問題需要排除，因此交給 AI 來做也不太能奢求它一次成功，尤其是當它宣稱自己有任務成功時更要小心 XDDD 我反覆燒了 Cursor 和 Gemini CLI 的額度，也調整過提示，試了幾次後的效果也是如此。

最容易遇到的問題大概是 `tsconfig` 或 `eslint.config` 路徑解析不正確，導致不管怎麼寫都會有紅字，可以留意 IDE 有沒有出現提示：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1753374313000pq0l0c.png)

有時候是 IDE 安裝的檢查器插件的問題，重開 IDE 之後紅字就會消失。有興趣的話也可以下指令 `Restart TS Server` 或 `Restart ESLint Server` 看看是誰在搞鬼！

最後也別忘記自己手動執行 lint、build 測試看看。

---

## 部署

在本機端能夠運行，但到了雲端伺服器上就壞掉，可不算是做完了......所以建置初期都會確定可以部署成功才進行開發。完整的 monorepo 其實還需要設定一些 CI/CD 的腳本，不過現階段先上傳到 PaaS 上保證可以快速驗證功能就好。

### 前端

大部分的 PaaS 都支援一鍵部署前端專案，Next 專案可以直接找它爹 Vercel，我甚至都還不用手動指定 Next 專案的目錄，它就已經找到了：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752133566000tsbu49.png)

完成！簡單、快速、且毫無波瀾......

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752133681000ouc486.png)

才怪！Vercel 會提示找不到 `packages/lib` 的東西，要調整 `Build Command`，指示它必須先 build 共用庫才能接著 build 專案：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752167400000yzvkwv.png)

### 後端

聊天室功能需要維持一定時間的 WebSocket 連線，serverless 型的 Vercel 就不太適合，所以我選擇 Render。

Render 和 Vercel 一樣都可以指向特定資料夾做部署，不過實際行為會有點差異，例如在 Render 中必須自己加入 `pnpm install`，而 Vercel 不能讀取我在根目錄設定的指令，所以每個 PaaS 的部署規則還是要實際測試看看！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752170223000ltdz1j.png)

我的 Express 專案在 `package.json` 有這段指令 `"start": "node --env-file .env dist/index.js"`，要把 `.env` 的載入刪除，否則在 Render 部署時會報錯，表示找不到這個檔案，調整好就運行成功囉！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752170788000s3d80q.png)

---

## monorepo 的必要性

正如開頭所說，我只是想試試看怎麼整合一些共用的程式碼，所以建了 monorepo 架構。

有一些開發團隊在嘗試之後，因為一些協作管理、部署整合等等的問題，最後轉回一般分散管理的模式。就我在 reddit 爬文看到的風向，很多心得都是：「沒事別搞這套」XDDD

所以這些協作方案的選擇也沒有什麼對錯，主要是團隊文化、領導者、規範強度、安全措施等面向都有解決方案可以支撐，大家講好就好。

---

## 本日小結

以上是我反覆試錯了半天摸索出來的成果！

monorepo 比較多非功能性的問題，pnpm 本身有時也會因為版本更新導致檔案連結的問題，或是和依賴項目的整合問題，產生一些怪怪的報錯。

所以我的心得是：不用太強求要把提示文件處理得很完美，建構出基本的架構再接著修就好，因為你可以看到，做出這包東西後，在部署又會踩到新的坑 XDDD

---

## 參考資料

- [How can I automatically accept suggestions in Gemini CLI without accepting every time? ](https://stackoverflow.com/questions/79682468/how-can-i-automatically-accept-suggestions-in-gemini-cli-without-accepting-every)
- [該用 Monorepo 嗎？比較 Monolith vs Multi-Repo vs Monorepo](https://www.cythilya.tw/2023/01/28/monolith-vs-multi-repo-vs-mono-repo/)
- [配額與限制](https://cloud.google.com/gemini/docs/quotas?hl=zh-tw)
- [Can I deploy socket.io on vercel?](https://www.reddit.com/r/nextjs/comments/1ktg2do/can_i_deploy_socketio_on_vercel/)
