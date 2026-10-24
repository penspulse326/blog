![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17910831640007qtnzq.webp)

把一些零星的設計問題處理掉之後，來把心目中的好酒分享出去吧！

---

## 實作分享功能

用 `navigator.share` 就能叫出裝置的原生分享功能，但這邊我就不綁定特定平台的行為了，單純把網址跟罐頭訊息複製起來就好。

電腦端我想讓它按下去後複製即可，不要透過 `navigator.share`，不然會無法順利複製：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791033710000t5yg4y.webp)

酷酷的縮圖用 `useSeoMeta`，把圖片網址加入 `ogImage`：

```ts
useSeoMeta({
  description: () => recipe.value?.desc || "專業調酒配方與物理稀釋 ABV 結構分析。",
  ogDescription: () => recipe.value?.desc || "專業調酒配方與物理稀釋 ABV 結構分析。",
  ogImage: ogImageUrl,
  ogTitle: () => (recipe.value ? `${recipe.value.nameZh} | Boozer Cannon` : "調酒酒譜"),
  ogType: "article",
  ogUrl: () => requestUrl.href,
  title: () => (recipe.value ? `${recipe.value.nameZh} | Boozer Cannon` : "酒譜詳情"),
  twitterCard: "summary_large_image",
  twitterDescription: () => recipe.value?.desc || "專業調酒配方與物理稀釋 ABV 結構分析。",
  twitterImage: ogImageUrl,
  twitterTitle: () => (recipe.value ? `${recipe.value.nameZh} | Boozer Cannon` : "調酒酒譜"),
});
```

讓我比較意外的是酒譜的資料一開始是用 `onMounted` 去抓的，而不是利用 SSR 環境的 fetch 功能，還真的是阿娘威......就不能再更用心一點通靈嗎 XD

`useSeoMeta` 會在 server 端先執行，因此生成的 HTML 會包含 `useSeoMeta` 注入好的 meta 標籤。server 端如果沒有先 `await` 酒譜資料的請求，`useSeoMeta` 就沒辦法動態地替換 meta 標籤，只看看到固定圖片和資料，就是上面的三元判斷寫死的那些字串。

---

## 公開本機服務

現在專案沒有做任何部署，這樣就不知道分享功能到底有沒有真的完成。

這時可以使用 **ngrok**！讓本機服務透過 ngrok 來轉址，就不用再另外開機器部署了。

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791034565000hd45h7.webp)

啟動 `endpoint` 的指令要把 port `80` 改為 Nuxt 應用程式正在運行的 `3000`，接著就會收到可以存取的 URL 啦！

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17910349440006yq33k.webp)

但是點進去只會發現：

```
Blocked request. This host ("doing-routine-blaming.ngrok-free.dev") is not allowed.
To allow this host, add "doing-routine-blaming.ngrok-free.dev" to `server.allowedHosts` in vite.config.js.
```

去 `nuxt.config.ts` 把 ngrok 的網域補到白名單：

```ts
vite: {
  plugins: [tailwindcss()],
  server: {
    allowedHosts: ['.ngrok-free.dev'],
  },
},
```

成功！

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17910351060003wcgfm.webp)

因為有公開網址，手機也可以拿來測一下分享功能：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791036083000n5jzql.webp)

ngrok 也有提供防護措施，不過這部分我也不熟，所以還是**盡快關掉**本機的轉址功能，總之現在知道酷酷的縮圖看得到就好 XD

---

## 小結

1. `navigator.share` 可以呼叫裝置原生的分享功能
2. 非得在沒有部署的情況下測試一些外部存取的效果，可以**使用 ngrok 把本機服務公開**，但最好**測試完就趕快關掉**
