當前流行的 Tailwind 與行之有年的 Bootstrap 類似，  
可以在 html class 寫上各種封裝好的樣式，減少手刻 CSS 的負擔，  

但不像 Bootstrap 有蠻多成套的元件可以直接拿來用，  
取而代之的是更容易客製化~~花式手刻~~的特性，  

網路上有很多寫好的 Tailwind 元件可以摳來用 ^_^  
這邊不講宗教戰爭，直接看看怎麼安裝吧～～

## CLI

沒什麼特殊需求的話建議用 CLI 的方式做出環境直接開刻就好：

```bash
npm install -D tailwindcss
npx tailwindcss init
```

**tailwind.config.js**可以在 content 設定要抓取的檔案路徑，  
要注意**所有使用到 tailwind 功能的檔案都要寫到 content 裡面抓取**，  
否則可能會有某個頁面載入 css 時會沒有樣式！  

因為 tailwind 是根據抓取到的檔案裡面，有用到的功能就從它的工具包抽出來，  
再編譯到最後的 css 檔裡面，並不會整個工具包都拿進來一起編譯，  
所以要是有某個頁面沒抓取到，那一頁才用到的 class 或其他功能就不會被編譯到。

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: { extend: {} },
  plugins: [],
};
```

因為這個編譯特性，可以發現編譯出來的 css 檔是非常小的。

建立 input.css 把 Tailwind 的功能抓進來用：

```CSS
@tailwind base;
@tailwind components;
@tailwind utilities;
```

用 CLI 指令去指向 input.css 以及輸出的檔案，  
加入參數 --watch 監聽就不用一直重新輸入指令編譯：

```bash
npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
```

最後 html 檔記得載入剛剛用 CLI 編譯出來的 output.css  
不然就做白工啦～～～

---

## PostCSS

官方示範預設你有裝 PostCSS-CLI，而且 npm script 的指令，  
也是~~隨意~~預設你完全知道 PostCSS 編譯指令所寫的，  
所以要記得順便裝 CLI 跟~~**召喚GPT**~~查一下編譯指令。

```bash
npm install -D tailwindcss postcss postcss-cli autoprefixer
npx tailwindcss init
```

安裝完後照慣例設定 postcss.config.js，此時 tailwind 就像是 PostCSS 的插件一起載入即可：

```js title="postcss.config.js"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

接下來的步驟和上面 Tailwind CLI 的方式一樣，設定 **tailwind.config.js** 要解析的檔案，  
然後在 css 檔裡面載入 tailwind 的工具包。

最後編譯的部分改成用 PostCSS CLI 就可以了，指令會有點不一樣，但一樣可以啟用監聽模式：

```bash
npx postcss ./src/style/input.css -o ./src/style/output.css -w
```

---

## CDN

CDN 在過去有很多限制，但經過開發團隊~~變魔術~~努力後，常見的功能都可以使用了。  
載入後 class 都能直接寫：

```html
<script src="https://cdn.tailwindcss.com"></script>
<div class="w-10 h-10 bg-black"></div>
```

但開始寫之前我會建議像前面的方法一樣，npm 安裝 tailwind 再下 init 產生 **tailwind.config.js**，  
因為 VS code 的 Tailwind 提示插件要讀取到這個檔案才會運作，  
如果單純載入 CDN 就沒提示可以看了...會變得很不方便 QQ

以前無法自定義主題，現在可以了：

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          superRed: "red",
        },
      },
    },
  };
</script>
<div class="w-10 h-10 bg-superRed"></div>
```

layer 的功能也能使用了，可以輕鬆 @apply 組合 class：

```html
<style type="text/tailwindcss">
  @layer components {
    .blue-box {
      @apply rounded-sm bg-blue-400 w-10 h-10;
    }
  }
</style>
<div class="blue-box"></div>
```

插件也能載入，可以看到官方示範的是在 CDN 的 url 上寫 query string 載入插件：

```html
<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp"></script>
<div class="prose">
  <!-- ... -->
</div>
```

不過因為是 CDN 所以還是有祖傳通病：無法離線使用。

---

## 參考資料

- [Get started with Tailwind CSS](https://tailwindcss.com/docs/installation)

---

關聯主題：[[Tailwind]], [[PostCSS - 已發佈]]
