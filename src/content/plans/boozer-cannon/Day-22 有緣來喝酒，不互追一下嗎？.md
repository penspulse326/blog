![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791239388000l4i0ni.webp)

主要的酒譜查詢功能差不多做完，以 MVP 來說算是告個段落，但我還是想要多點互動性，所以要對個人頁面做點加強！

---

## 個人資料

現在個人資料只有拿 Google 帳號的名稱和大頭照，相當簡陋 XD

這應該要可以改，所以需要新增編輯個人頁面的表單，包含：

1. 暱稱
2. 大頭貼
3. 自我介紹
4. 個人連結

基本上就是參考 threads 那樣 (?)，實際呈現：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791205316000ievh3i.webp)

不過編輯完之後整體版面是蠻怪的 XD

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791205437000hkenpd.webp)

每次有新的設計就要記得用 `/impaccable` 看一下，~~不然要自己一條一條列出來也是頗累~~：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791205680000sgisly.webp)

照 skill 的建議調整再加上我自己微調，看起來就正常一點了：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791206974000tn97gk.webp)

個人連結的 icons 和 label 用 mapping 的方式就可以呈現：

```ts
{
  domains: ['instagram.com', 'instagr.am'],
  icon: 'fa-brands fa-instagram text-pink-400',
  label: 'Instagram',
}
```

table 的部分我不想搞得太複雜，用 JSONB 存這些個人連結就好：

```ts
export const users = pgTable("users", {
  links: jsonb("links").$type<Array<{ url: string }>>().default([]).notNull(),
  // ...
});
```

個人資料通常都是在註冊的時候順便做的，所以**也要記得初次登入的引導使用者去改資料**：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791208628000anrtxm.webp)

---

## 追蹤功能

除了按讚，我覺得追蹤也是社群互動蠻重要的功能！

不過現在才注意這塊資訊很雜亂，不知道追蹤的部分要怎麼放進去 XD

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791208057000mk4cjf.webp)

所以再次調整版面！

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17912079580001txnhn.webp)

這樣看起來就好多了，~~也越來越像其他平台~~：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17912104140001huizu.webp)

也可以看到粉絲清單：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791211447000ae03x2.webp)

關閉按鈕做在那裡我認為蠻容易誤觸，所以我決定向其他平台 (?) 學習，乾脆大膽地把按鈕拿掉！

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791211392000b4nv07.webp)

名單較長的情況下也沒有爆版，到這邊就算是完成了！

---

## 小結

1. 新增功能時也要思考是否需要**對原本的流程加入引導提示**
2. 盡可能減少同頁面出現的**重複資訊**，讓**資訊架構維持乾淨**，體驗才會流暢
