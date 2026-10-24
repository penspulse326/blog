CSS 動畫雖然提供了很多效果，但是涉及到一些元素選取，動態調整的部分，
還是得仰賴 JavaScript 來操作，GSAP 正是一個好用的動畫套件！

常見的滾動視差、跑馬燈輪播、文字特效不在話下，
還有導入時間軸的概念，可以輕鬆安排多個動畫效果的接續！

本篇範例： https://codepen.io/shin9626/pen/BavXvEE

## 基本功能 to / from / fromTo

和 C3.js 很像吧！直接透過 gsap 物件本身就能去呼叫方法，參數可以是字串（"CSS 選擇器"），
也可以是透過 querySelector 取得的 DOM 元素。

to 與 from 很直觀，to 是令元素變為某個狀態，from 是令元素從某個狀態回到原本的狀態。
fromTo 則是將兩者合在一起，讓起點與終點的控制更靈活。

```js
gsap.to(".orange_1", {
  x: 100,
  duration: 1,
});

gsap.from(".orange_2", {
  x: 100,
  duration: 1,
});

gsap.fromTo(
  ".orange_3",
  {
    y: 100,
  },
  {
    y: 0,
    duration: 1,
    ease: "none",
    yoyo: true,
    yoyoEase: "sine.out",
    repeat: -1,
  },
);
```

---

## 物件中的屬性作用

### transform

由上面範例可以看到動畫效果是由參數裡面的物件決定的。
x, y 與 xPercent, yPercent 的單位分別是 px 與 %，到這邊我們就能大概推測出，
這些動畫運行的方式，其實就是透過 **transform** 發生改變的，
所以 to, from 這些基本功能不會強制改變 DOM 元素本身所在的空間與定位，
也就是說 css position 並沒有被改變。

### 時間魔術師

要完成會來回播放的動畫，必須使用 formTo 達成，
其中要特別注意 duration, ease, repeat 這些與行程相關的屬性，  
要寫在 formTo 的第三個參數，也就是 to 的地方，才會有作用哦！  
動畫的來回主要是依靠 **yoyoEase: true** 與 **repeat: -1** 產生來回的效果。

曲線模擬器： https://gsap.com/resources/getting-started/Easing

---

## 時間軸 timeline

如果有多個動畫需要接續播放，這使可以使用 timeline 物件：

```js
const timeline = gsap.timeline();
```

用法與上面的基本功能一樣，在後面接續函式即可，這時候動畫會接續播放：

```js
timeline.to(".wrapper2 .orange_1", { xPercent: 100, duration: 1 };
timeline.from(".wrapper2 .orange_2", { xPercent: 200, duration: 1 }));
timeline.fromTo(
  ".wrapper2 .orange_3",
  { xPercent: 300 },
  { xPercent: 0, duration: 1, yoyoEase: true, repeat: -1 }
);
```

因為 timeline 物件執行完會回傳一樣的 timeline 物件，所以也可以把函式串接在一起。

```js
timeline
  .to(".wrapper2 .orange_1", { xPercent: 100, duration: 1 })
  .from(".wrapper2 .orange_2", { xPercent: 200, duration: 1 })
  .fromTo(
    ".wrapper2 .orange_3",
    { xPercent: 300 },
    { xPercent: 0, duration: 1, yoyoEase: true, repeat: -1 },
  );
```

---

## 滾動視差 ScrollTrigger

滾動視差是 GSAP 的額外功能，使用 CDN 的話要額外載入 ScrollTrigger.min.js 這支程式，
npm 或是直接從官網下載 js 檔的就要去資料夾引入這支程式。

引入後要透過註冊函式 registerPlugin 把 ScrollTrigger 丟進去才能正式啟用。
~~（就是這麼囉嗦）~~

```js
gsap.registerPlugin(ScrollTrigger);
```

ScrollTrigger 是依靠 timeline 驅動的，在建立 timeline 物件時需要帶入一個物件參數，
裡面是滾動視差的基本設定：

```js
const triggerTL_1 = gsap.timeline({
  scrollTrigger: {
    trigger: ".scroll_1", // 觸發元素
    pin: true, // 是否要啟用固定畫面 通常要 true
    markers: true, // 在畫面上顯示動畫的起點與終點
    scrub: true, // true 綁定動畫進度到進度條，改為數字 0.5 可以解決一些平滑問題
  },
});
```

再用這個物件去呼叫函式就可以執行對應的動畫了！

```js
triggerTL_1
  .to(".scroll1 .scroll-box2", {
    xPercent: "-100",
  })
  .to(".scroll1 .scroll-box3", {
    xPercent: "-200",
  });
```

根據屬性變化可以做出很多視差效果，如透過 XY 軸的不等長移動，或是 duration 的改變，
來製造層層疊加的效果，這部分就比較吃個人空間感的概念，
需要多試幾次才能測出比較平滑的變化。

```js
const triggerTL_2 = gsap.timeline({
  scrollTrigger: {
    trigger: ".scroll2",
    pin: true,
    markers: true,
    scrub: true,
  },
});

triggerTL_2
  .to(".scroll2 .scroll-box2", {
    yPercent: "-50",
  })
  .to(".scroll2 .scroll-box3", {
    yPercent: "-125",
  });
```

---

## 參考資料

- [GSAP實作滾動視差與動畫](https://sleet-berry-8a9.notion.site/GSAP-ddc5d9cf73b94b6fa16bd0d6a637482b)
- [Easing](https://gsap.com/resources/getting-started/Easing/)

---

關聯主題：[[JavaScript 套件]]
