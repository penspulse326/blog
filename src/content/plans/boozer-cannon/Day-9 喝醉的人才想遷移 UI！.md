![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790116731000dvq3yt.webp)

Agent 是有能力一次完成很多改動的，所以像昨天犯了 commit 規則沒講清楚的錯，一定要在實作前確實說明清楚！

專案開發大多有規定發佈流程，例如 Git Flow。但我自己很少在小專案做嚴格的環境分離和上版規則，branch 大多只會有 `main` 和 `feature` ，比較接近 TBD (參考資料：[淺談開發流程 — Git Flow 到 Trunk-Based Development 的團隊經驗雜談](https://medium.com/@shanpigliao/%E6%B7%BA%E8%AB%87%E9%96%8B%E7%99%BC%E6%B5%81%E7%A8%8B-git-flow-%E5%88%B0-trunk-based-development-%E7%9A%84%E5%9C%98%E9%9A%8A%E7%B6%93%E9%A9%97%E9%9B%9C%E8%AB%87-a956a379987)
)的概念。

不過無論怎麼交付，都要**清楚自己提交的內容與品質**，才是**負責任的開發**！

---

## 重現 UI

要把 prototype 轉移到目前的專案，當然不是複製貼上就好啦，因為 prototype 用到的技術跟專案也不一樣，實作過程中多少會有落差。

先讓 Agent 梳理計劃，把每個 commit 要做的事規劃出來：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789994492000fsa4xx.webp)

至於它自己會不會遵守自己許下的承諾，那就不一定了（~~男人的嘴~~）。

目前頁面設計也不複雜，先遷移成功再考慮拆 component。

> 我今年四月在做 DC Bot 遠端控制 Agent 時，從 Google Stitch 的 skill 學到了「接力棒模式」，所以我也讓 Agent 把實作計劃寫成一份交接文件，防止 session 意外中斷或是我想分階段實作時，Agent 可以參考並接續做完。

來看看泡完泡麵後發生什麼事吧：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790026562000samjmm.webp)

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17899992050006s0spw.webp)

只能說一言難盡 XDDD

---

## 又回到最初的起點

四處都是肉眼可見的怪異，反覆調整之後還是沒有很喜歡。

原因是 Bootstrap 預設的設計系統需要花點時間客製，才比較容易還原出原本的樣子，當然也不是不能手刻 SCSS 把 prototype 的樣式全部還原過來，但老實說我不想再花時間調校下去。

所以，**對 UI 設計的能力沒把握時，盡量不要去遷移原本的設計系統和 UI 工具**，不然只會得到這個感想：

> 「我覺得第一版最好耶！」

這時沒有任何乙方會被你氣到了，只能氣自己「靠北又浪費一堆 token 跟時間」。

改回 Tailwind 之後就沒什麼落差了，拆分出來的 component 看起來也還有模有樣，明天再來好好稽查一下有沒有亂寫的東西：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790079185000eqtk2f.webp)

---

## 小結

- 希望用指定的設計系統來做 UI 時，最好在 AI 生成 prototype 前就想好這件事，「從零開始」生成和「完成後再做技術遷移」的**效果是有落差的**
- 讓 Agent 把自己的計劃生成文件作為參考，在後續反覆修改或想重做時會比較順利，**前提是你覺得這個計劃是對的**
- **清楚自己提交的內容與品質**，才是**負責任的開發**
