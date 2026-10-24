![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790028568000tfhpn9.webp)

雖然 Agent 表示任務完成，姑且是建好了：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789657194000m22vfy.webp)

但是男人的嘴都沒人要信了，你敢 100% 相信 AI 嗎 XD

所以我想針對兩點檢查：

1. 是否裝了預期外的套件
2. 框架做了大型改版，可能有新的設定

---

## 清理套件

UI 的選型上我返璞歸真選了 Bootstrap，但 AI 果然還是裝了 Bootstrap 的 JS 邏輯 `@popperjs/core`，還設了 plugin......

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17896573860007ie7vj.webp)

我只要元件架構跟設計系統而已，所以移除！

另外 Agent 也裝了 `sass-embedded`，我沒用過這東西，查了一下是比 `sass` 更快的編譯套件，所以就不清掉了！

> 前端框架和一般後端支援的 template 概念差不多，不同的是前端框架大多有設計自己的 UI 生命週期，所以通常會用這些方法來控制 UI，比較少把那些自帶原生 JS 的 UI 整合進來。

---

## 品質工具

NestJS 在我短短兩個月沒碰的期間，居然把 ESLint 換成 Oxlint 了！

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789658146000hbh20y.webp)

不過 Oxlint 主要還是針對 JS/TS 邏輯的偵測，對我這強迫症需要的 `Perfectionist` 還沒有類似的 rules，所以就讓它留在 NestJS 裡面吧，整體的檢查還是交給 ESLint。

和去年使用 Express 的狀況不同，NestJS 本身就有自己的一套設定，所以 `tsconfig` 的部分我暫時不會動。

---

## 失控的 commit

基礎建設看起來做得差不多，但我看了 Git Graph 後哭笑不得，AI 寫出來的 commit message 跟我認知的 conventions 有點落差：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789659068000e4iiv6.webp)

只好請它重新修正。這種小地方可不能失智，AI 要加油啊 T_T

好男人總是先怪自己（？），所以我不怪 AI 做錯事，只怪我自己 harness 做得太爛。

---

## 小結

1. 環境建置完成後，檢查是否有不需要的套件或是設定檔要進行清理
2. 別怪 AI 笨，都是男人的嘴在那邊模糊帶過
