在安裝階段有設置一個 input.css 檔，該檔案所載入的正是 Tailwind 的核心功能：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

要編輯這些功能會用到 **@layer** 語法，以下示範。

## base

還記得 SASS 7-1 patterns 裡面會分出一個資料夾叫做「base」嗎？
它們的意義是相似的，在 Tailwind 裡面 base 也掌管部分的全局樣式。

首先是此處必有 reset，Tailwind 採用 **modern-normalize** 的規範，
modern-normalize 正如其名是從 normalize 延伸出來，移除一些過時樣式，
而 [Preflight](https://tailwindcss.tw/docs/preflight)是 Tailwind 加工 modern-normalize 設計出來的基礎樣式。

因為功能性的標籤已經在 reset 階段移除所有屬性了，所以通常也會在 base 重新定義標籤。

既然都導入 Tailwind 了，應該會覺得這時候重新寫個 font-size: 48px 之類的原生 CSS，
看起來好像笨笨的......沒錯，Tailwind 提供 **@apply** 語法，可以直接寫入 utility class：

```css
@layer base {
  h1 {
    @apply text-4xl font-bold;
  }
  h2 {
    @apply text-2xl font-bold;
  }
  a {
    @apply text-cyan-700 !important;
  }
}
```

額外提醒 !important 要寫在 @apply 後面才會強制作用（但我從來沒用過 important 去蓋樣式）。

---

## components

網頁上有重複的元件時（個人覺得用到三次以上就有一定的重複性了），
可以在 components 封裝起來，語法如下：

```css
@layer components {
  .btn {
    @apply py-2 px-4 font-semibold rounded-lg shadow-md;
  }
}
```

在切割元件時我們也會希望遵守 OOCSS 的概念，
結構性質（形狀、間距等）的屬性可以與外觀性質（顏色、字體粗細等）做分離，
所以上面的按鈕範例並沒有把顏色相關的 class 一起封裝進去。
後續使用時可以 class 補上顏色，重複使用 btn 同時也能做出各種顏色的按鈕，提高重用性。

開頭強調**重複的元件**是因為官方並不推薦無止境地封裝自己的樣式，
首先要封裝就必須想 class 命名，這時候就會陷入手刻地獄的回憶了QQ
所以若非得已的話盡量在重複性比較高的情況下去封裝 components。

---

## utilities

Tailwind 已經將很多常用的屬性封裝好了，但還是會有落網之魚，
像是官方示範的 content-visibility，或是它們沒有提供的組合模式，就可以自己在 utilities 封裝：

```css
@layer utilities {
  .content-auto {
    content-visibility: auto;
  }
}
```

封裝的時候也要記得 Atomic CSS 的原則，
一個 class 僅代表一個屬性，盡量不要同時寫入很多屬性，
不然這樣跟手刻就沒兩樣了 XD

---

## 參考資料

- [Theme Configuration](https://tailwindcss.tw/docs/theme#extending-the-default-theme)
- [Configuration](https://tailwindcss.tw/docs/configuration)
- [@layer base/components/utilities](https://medium.com/@jelly771001/tailwind-layer-base-components-utilities-28c1e0652b7d)

---

關聯主題：[[Tailwind]]
