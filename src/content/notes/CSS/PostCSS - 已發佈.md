PostCSS 是一個 CSS 工具，有許多加工 CSS 內容的功能插件，
雖然經常被翻成「後處理器」，但根據選用插件的不同，
它也能做到像 SASS 一樣的「預處理器」功能！

PostCSS 的任務可以透過 CLI 或 webpack 編譯完成。

## CLI

安裝 PostCSS 與 CLI，這邊以 autoprefixer 這個插件為例順便安裝進去。

```bash
npm install -D postcss postcss-cli autoprefixer
```

成套的框架系統有的會包進 PostCSS（像 Next.js），但目前我們是手動建環境來了解運作過程，
所以我們要自己在根目錄新增 postcss.config.js 這個檔案，
然後依照下面的格式把剛剛安裝的 autoprefixer 載入進來。

```js title="postcss.config.js "
module.exports = {
  plugins: {
    autoprefixer: {},
  },
};
```

接下來新增要加工的 css 檔案，然後透過剛剛安裝的 postcss-cli，去設定檔案路徑：

```bash
npx postcss ./src/style.css -o ./src/all.css -w
```

如果確定檔案名稱和路徑不會改動的話，可以把這個指令寫到 package.json，
這樣下次繼續開發時就不用再打這個冗長的路徑，用 npm run watch 就可以啟動編譯：

```json title="package.json"
"scripts": {
	"test": "echo \"Error: no test specified\" && exit 1",
	"watch": "postcss ./src/style.css -o ./src/all.css -w"
},
```

HTML 檔要記得引入**加工完的 CSS 檔**，不然就做白工啦～～

```html
<link rel="stylesheet" href="./src/all.css" />
```

這邊示範有安裝 autoprefix 插件的狀況下編譯的結果：

![autoprefix 展示](https://drive.google.com/uc?export=view&id=1kr4ButmRolfrHlejFOIvVnSgbdmxCLB7)

這裡使用了 ::selection 這個偽元素功能，經過 autoprefix 判斷後在 FireFox 瀏覽器有可能不支援， 所以幫忙加上了 -moz- 的前綴！

---

## Webpack

利用 webpack 打包就不需要 postCSS 的 CLI 編譯了，
但反過來說這次要換 webpack-CLI 編譯。
因為 **postcss-preset-env** 這個套件已經集成一些 postCSS 的插件，
所以 webpack 官方推薦安裝這個，不用再另外安裝 autoprefixer。

```bash
npm install -D webpack webpack-cli postcss
```

webpack 是依靠各種 loader 的功能解析檔案的，這邊把所有 loader 都安裝：

```bash
npm install -D css-loader postcss-loader postcss-preset-env
```

要注意 webpack 預設會載入一個 js 檔作為進入點，所以我們要自己新增一個 js 檔讓它進入，
而最後編譯完成都會變成一支 bundle.js 檔給我們使用。

如果是練習原生 JS 的東西，應該不希望 css 檔也被整合進去，
所以需要另外一個插件 mini-css-extract-plugin ：

```bash
npm install -D mini-css-extract-plugin
```

大費周章安裝完所有東西後，在根目錄新增 webpack.config.js，
把示範裡面的 code 都摳過來~~（沒辦法 webpack 設定就是長這麼醜）~~

```js title="webpack.config.js"
module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "postcss-preset-env",
                    {
                      // Options
                    },
                  ],
                ],
              },
            },
          },
        ],
      },
    ],
  },
};
```

**style-loader** 是在最後輸出成 bundle.js 時把 css 檔也抓進來編譯，
最後在 html 載入時也會一起載入原本寫好的樣式，
但在這邊我們不需要～～（而且剛剛注意剛剛並沒有安裝這個 loader 哦！）
所以要把 **style-loader** 替換成我們剛剛安裝的插件 mini-css-extract-plugin，
順便設定一下 webpack 的輸入輸出路徑和模式：

```js
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "development", // mode 選 development 即可
  entry: "./src/main.js", // 輸入點是必填的不然 webpack 沒辦法啟動編譯
  output: {
    // 輸出路徑設定
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader, // 把 style-loader 替換掉
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "postcss-preset-env",
                    {
                      // Options
                    },
                  ],
                ],
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "all.css", // 輸出的 css 檔名，這個也會在上面設定的 dist 資料夾出現
    }),
  ],
};
```

設定完之後直接敲 webpack 的 CLI 就會編譯了，跟其他 CLI 一樣，webpack 也可以監聽，
這邊就不示範直接編譯：

```bash
npx webpack
```

去 dist 資料夾找到剛剛編譯完成的 all.css，內容已經被 autoprefixer 修改過：

```css
/*!****************************************************************************************************************************************************************************************************************************************************************!*\

!*** css ./node_modules/.pnpm/css-loader@6.8.1_webpack@5.88.2/node_modules/css-loader/dist/cjs.js!./node_modules/.pnpm/postcss-loader@7.3.3_postcss@8.4.31_webpack@5.88.2/node_modules/postcss-loader/dist/cjs.js??ruleSet[1].rules[0].use[2]!./src/style.css ***!

\****************************************************************************************************************************************************************************************************************************************************************/

h1::-moz-selection {
  color: red;
}

h1::selection {
  color: red;
}
```

---

## 參考資料

- [PostCSS教學](https://youtu.be/EdiqfOKHBb8?si=Wq8OtsNSJ87Mh1cy)
- [Webpack - PostCSS 與 autoprefixer CSS 瀏覽器相容性](https://medium.com/%E5%89%8D%E7%AB%AF%E5%B0%8F%E7%A9%BA%E9%96%93/webpack-postcss-%E8%88%87-autoprefixer-css-%E7%80%8F%E8%A6%BD%E5%99%A8%E7%9B%B8%E5%AE%B9%E6%80%A7-6320900d47cc)

---

關聯主題：[[CSS]], [[Tailwind 的安裝 - 已發佈]]
