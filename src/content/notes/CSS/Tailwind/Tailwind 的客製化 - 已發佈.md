設定檔 **tailwind.config.js** 可以寫入一些客製化設定，
斷點、主題顏色、集成元件等等的都可以寫在裡面。

## extend

extend 裡面所寫的自定義屬性，也就是如其名的功能「**延伸**」，
是基於 Tailwind 原本就有的屬性去增加新的值，所以需要有前綴詞：

```js title="tailwind.config.js"
module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      backgroundImage: {
        banner: "url('../images/banner.png')",
      },
      colors: {
        primary: "#891818",
        secondary: "#F75000",
      },
    },
  },
  plugins: [],
};
```

如 colors 新增的顏色，在 class 裡面可以直接後綴在任何需要顏色的屬性，
如文字顏色、背景顏色、框線顏色等等...

backgroundImage 裡面指定 url，
這時 class 就能讓 bg 吃到 banner 這張背景圖。

```html
<section class="p-10 bg-banner">
  <div class="bg-primary">
    <p class="text-secondary font-robo italic">this is text</p>
  </div>
</section>
```

能夠自定義的 class 片段可以在 Tailwind 官網查到，格式寫法大部分都如同這篇的示範～

---

## 全域樣式

如果不寫在 extend 裡面，代表的是全域的自定義樣式，意義上和 extend 不太一樣，
所以如果寫到 Tailwind 原本就有封裝的屬性，就會覆蓋過去，要特別注意這點。

```js
module.exports = {
	content: ["./src/**/*.{html,js}"],
	theme: {
		colors: {
			blue: "#1fb6ff",
	},
	fontFamily: {
		sans: ["Graphik", "sans-serif"],
		serif: ["Merriweather", "serif"],
	},
};
```

上面是稍微修改一下官方示範的部分，
原本的 utility 就有 blue 這個顏色，所以這邊再定義一個 blue 的顏色就會覆蓋掉原本的，
Tailwind 也很聰明，此時 blue-100 這樣後綴的數字都是基於覆蓋過後的顏色計算出來的，
所以不用一個一個去重新定義色階的顏色哦！
（除非你不喜歡它線性計算後的顏色）

---

## 參考資料

- [Theme Configuration](https://tailwindcss.tw/docs/theme#extending-the-default-theme)
- [Configuration](https://tailwindcss.tw/docs/configuration)

---

關聯主題：[[Tailwind]]
