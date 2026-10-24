![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790806921000wefevz.webp)

相信 AI 用久之後，大家也會對每次回復的起手式感到厭煩吧？

- 完美！
- 你說得對！
- 抱歉，這是我的疏失！
- 這是一個很好的問題！

諸如此類的廢話 XD

後續回復往往也是一長串，不論中文或英文的易讀性，光是這一大堆字就讓人很難抓重點，所以用了一段時間後，大家大多會做個人化設定，來調整 AI 的回復方式。

所以繼續做下去之前要裝些 skill！

---

## i-have-adhd

[GitHub 連結](https://github.com/ayghri/i-have-adhd.git)

這是前陣子同事分享的，聽起來很惡搞，但還真的蠻好用 XD

開場白、恭維、不名所以的冗長描述都會被砍乾淨，取而代之的是條列式的簡述，還有預估執行時間。

來看看同一個請求的效果：

> 評估目前測試案例是否需要改善

before:

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790773196000d1nikq.webp)

after:

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790772588000a6m4jo.webp)

第一版的回復其實沒有特別長，還好心畫了 flow chart，看來 Gemini 還算平易近人。

我自己用 Claude 的經驗就是瘋狂堆規格，到最後我都懶得看了 XD

啟動 `/i-have-adhd` 之後描述就精簡很多！

不過這**不代表寫出來的程式或文件會像這些對話一樣精簡有效**，這部分還是得另外控制，請斟酌服用。

---

## 測試策略

我一開始要求以 TDD 的模式開發，目前功能也都確實能動，但這不代表它制定的測試方向是對的，況且我都沒全部對照過 XD

所以上面對話除了示範 skill 的效果，也是順便重新釐清測試的方向。

過去我沒什麼寫測試的經驗，也是今年教召時帶了一本測試的書去看，才知道一點毛皮。

到了新公司，前輩在 review 我的時候曾說：

> 你現在寫的這些單元測試，我們以前都做過，我們當時的想法就跟你一樣，你也知道測試金字塔吧。可是你有想過，為什麼要單獨測一個 component 嗎？你不覺得去測它們實際互動起來的效果是更有效益的嗎？

那時我才了解測試金字塔只是一個通俗概念，它對講求資料正確性的後端 CRUD 適用，但**測試獎杯**也許更適合前端。

所以我也要求 Agent 重新檢視測試方向，把一些測爽的案例刪掉，根據產品的實際狀況來定義 key feature，也要加強邊界防護，不能只測 happy path。

參考資料：[This.Web](https://www.thisweb.dev/articles/frontend-testing-guide)

---

## 小結

1. 利用 skill 讓 AI 更省話
2. 測試的策略不是只有測試金字塔，根據前端、後端或是專案現況來制定策略也很重要
