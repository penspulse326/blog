![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790995061000d5g4dq.webp)

設計規則定調後，就要把一些功能頁面拆出來啦！總不可能什麼功能都是點下去再跳出 modal 吧？

---

## Modal 的影響

用 Canvas 功能做的 prototype 大多都會變這樣，如果沒有特別指示跳轉，相關的功能大多會用 modal 實現。

Modal 也會讓**使用者的流程會被打斷**。而在一個小框框裡面要看那麼多資訊或填表單還蠻痛苦的，但也不確定這些東西拆了之後體驗會變得如何，所以再度請出 `impeccable` 這個 skill：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790989231000hui7gt.webp)

（為了確認 Gemini 不是在吹捧附和我，我又再問了一次確定不是附和嗎 XDDD

而且也抓到一個好像哪裡怪怪，卻又說不出來的點：

> 用行動裝置輸入資料時，會出現小鍵盤，吃掉可視範圍

其他操作上的問題也解釋得蠻合理，那就差不多可以來全面實作新頁面！

---

## 驗收成果

來看看做好的結果如何：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790992634000wt38uf.webp)

唉我什麼都不想說 XDDD

不太確定是抽獎失敗，還是我忘了讓 Agent 用 `/impeccable` 的標準來實作，所以我退回所有 commit，再重做一次。

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790993500000jb94tf.webp)

不理解為什麼到處都是新增酒譜的按鈕，這東西又不是 CTA，所以修掉是必然的 XD

其他頁面的呈現我覺得還 OK，倒是沒有什麼凸槌的設計：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790993767000dsikc5.webp)

剩下都是一些零星的問題，從一開始的 prototype 就存在：

1. 導覽列爆版
2. 酒譜的資訊設計，要滑到中段才看得到酒的名稱，前面被不太重要的濃度估算佔滿
3. 有些地方只寫英文，有些地方又突然中英文同時顯示
4. 表單某些欄位的寬度太窄，沒辦法看完整資訊

到這裡我才感覺到模型之間可能還是有點差異，Gemini 一發入魂的機率有點低，要調校的東西還是蠻多的 QQ

---

## 小結

1. modal 不是所有場景都適用的設計，會**打斷使用者的操作**，**內容**如果較多，盡量不要放在 modal
2. 不要期待 Agent 的成功率，能符合六七成就不錯了！如果你跟我一樣**不想做太多前置作業調校 Agent，又不想用貴貴的模型，那只能乖乖地事後修改** XD
