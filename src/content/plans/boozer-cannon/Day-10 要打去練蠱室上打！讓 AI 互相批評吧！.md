![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790201287000o2qi2p.webp)

拆好的 component 數量不多，但要一支一支檢查還是稍嫌麻煩，而且沒人想看一堆不經思考就寫出來的 code 吧！

這時候就可以使用 AI 互搏術，重開一個對話再檢查一次 UI 架構，如果可以換模型的話就更好了，讓不同廠商的 AI 互相指責、血流成河（？）。

---

## 換個模型換個腦袋

Antigravity CLI 可以把模型換成 Claude，果然馬上就生成一堆批評指教 XDDD

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790085377000md75vl.webp)

也要檢查換個模型後有沒有好好地 commit：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790085696000dhb4re.webp)

自我審查的條件也可以作成 skill，許多已經導入 Agent 做自動化開發的專案，都會設定類似的 workflow，把功能完成的同時也將程式架構整理到一個程度。

---

## 適時人為介入

如果計畫範圍縮限在**遷移 prototype**，那結果大概就真的只是照搬過來，Agent 基本上是一個口令一個動作的，這時候就需要再次介入！

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790079185000eqtk2f.webp)

上圖是昨天分好的 component，有些是每頁固定的爬版，像 header、footer 等，那麼就該**建立一個 default layout 來管理這些固定的元素**。

使用者故事的內容也還沒有全部實作，所以實際完成應該會有好幾個頁面檔案，這部分倒是通靈的還不錯，我不用再下 prompt 來拆頁面：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790086528000gpl4eg.webp)

---

## 新觀念新架構

上面實作完後有拆出比較多東西：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790088626000ienfvi.webp)

不過 hero、footer 是純靜態的區塊，不包含任何資料流的互動，不應該放在 `/containers`。

而 Dan 哥 (Dan Abramov) 提出的 `Container / Presentational`，雖然仍受用，不過我想試試看別的組織 component 的方式：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790089800000sllu27.webp)

Agent 給的建議我覺得還不錯，所以試試看它照這個方式來拆。

UI 的遷移差不多告個段落，接下來就從後端開發功能了！

---

## 小結

- **開新對話或使用不同模型**來檢驗前一次的產出，快速剔除一些無效的內容，讓後續人為介入時可以更有效率
- Container / Presentational 是我一直以來信奉的前端教條，但**了解背後的設計脈絡**更重要，所以有時也要刻意去實踐其他做法，才知道這些設計理念的差異，找出適合自己的開發模式
