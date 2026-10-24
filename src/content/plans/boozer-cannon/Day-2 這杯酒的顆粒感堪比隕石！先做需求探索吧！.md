![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789509329000nku0kt.webp)

**經典調酒**是由國際調酒協會定義的酒譜，我們在不同酒吧喝到的馬丁尼，味道不會差太多，因為大家都是看這些標準酒譜來混合材料。

不過氣味與層次的差異，除了調酒師本身的調製風格不同，也會受到材料來源的影響，每個廠牌的釀造材料與環境都是精心設計過的，所以一樣都是琴酒，不同廠牌會帶出不一樣的風味。

因此我想做的查詢器也不單只是把材料列出來，材料本身的廠牌我也希望可以讓使用者自行新增！

（題外話：我喝過最噁心的琴酒是有胡椒味的 Kyoto Pepper......）

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789508619000b70sgy.webp)

---

## 誰來接隕石

這時核心的使用者故事就出來啦！

才怪！

但這也是大部分專案的常態，預算沒那麼多，產品設計、專案管理、開發維運等等的專業人才往往東缺西缺，僅有的人力就得把這顆模糊的隕石接下來，接著就是數不清的連鎖效應。

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789474542000afc8m8.webp)

AI 現在能做的事很多，不論需求怎樣模糊，我們還是可以和 AI 來回詰問與回顧，做到**簡單的需求探索**和收斂，而且能夠產出純前端的 prototype，初期規劃的阻力已經低很多。

（注意，是「簡單的」需求探索，如果專案比較複雜，最好還是和專業的研究團隊協作）

---

## 先把隕石變小顆再接

1. 我使用的 AI 工具：Gemini

選擇 `Canvas`：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789202366000ck047g.webp)

2. 提示詞：

```
我想要做一個酒譜查詢的網站，會有以下功能：

1. 使用者可以新增酒譜
2. 酒譜中的每種材料可以再標示材料的品牌
3. 新增酒譜可以上傳照片
4. 使用者可以收藏酒譜或按讚酒譜

產生前端操作畫面
```

> 我遇到的坑：在記事本專案中不能執行這個 prompt，不然只會收到：「**我只是個文本模型，無法完成這些要求**」之類的裝死回覆。我最後是在一般的對話執行。

3. 驗收成果：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789202666000uv2ly9.webp)

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17892026740001t5fwt.webp)

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17892027560005l9r85.webp)

老實說可用程度還真的相當不錯，我要求的：

1. 展示酒譜
2. 收藏功能
3. 新增 / 查看酒譜

實際產出： [Canvas](https://share.gemini.google/egjh5cidxyFX)

操作流程沒什麼問題，表單也通靈出一些我沒想過的欄位。這樣我就亂下一堆 prompt 等著收割整包專案就好啦，初期幹嘛這麼縝密？

---

## 觀念釐清

1. AI 通靈出來的東西，往往會**附帶一些我們不需要的東西**，如果不在初期剔除，後面長歪了之後，想改 code 還是重做，總是會浪費一點時間，而**時間才是最公平與珍貴的資產**

2. 試想你搶到供不應求的頂級顯示卡，但是店家多送你 20 顆處理器，當下的心情絕對不是賺到，而是：

> 「靠北，我要怎麼處理這堆用不到的零件？」
