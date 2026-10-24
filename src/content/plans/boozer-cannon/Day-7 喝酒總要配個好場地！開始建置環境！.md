![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789924750000xpmuon.webp)

在進到本機環境實作之前，也別忘記把先前在對話中弄好的材料下載下來，包含：

1. 使用者故事
2. DBML
3. HTML

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789648334000gxbr6t.webp)

再來就要想想技術選型了！

---

## 技術選型

這次還是想用 Monorepo 把前後端包在一個 repo 來進行，不過前後端我想選跟去年不一樣的！

| 分類        | 技術       |
| ----------- | ---------- |
| 前端        | Nuxt       |
| 後端        | NestJS     |
| 資料庫      | PostgreSQL |
| UI Library  | Bootstrap  |
| ORM         | Drizzle    |
| Test Runner | Vitest     |

去年的鐵人賽談到時 [技術選型](https://ithelp.ithome.com.tw/articles/10378604) 時，我有分析一般團隊的選型考量，以及我的個人考量如何影響選型，但今年我走娛樂路線 XDDD

選這些沒有什麼好棒棒的理由，反正求職市場看起來有夠凍，選什麼都一樣（欸），每天看 threads 都會覺得我已經被 AI 取代一萬六千三百五十四次了呢。

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789923290000blhh2g.webp)

因此只是單純選一些我有興趣的 NestJS 和 Drizzle，或是我個人認知負擔比較小、去年年底連續兩個專案都用到的 Nuxt。

UI 部分則是因為兩年多前的轉職培訓開始，就被 Tailwind 荼毒了，想要懷舊一下，左思右想的答案是可以再戰 N 年的 Bootstrap，好像也沒有不行。

---

## Agent，啟動！

接下來就是泡泡麵的時候了......才怪，通常建環境的階段，除了下載與安裝套件有時候會卡很久，Agent 也要反覆確認上下文才會給予回應。

先手動裝好主要框架再讓 Agent 去做剩下的部分，搞不好更快。但既然要懶人到底，那就先準備好 prompt 吧！

```
建立一個 Monorepo 專案，以 PNPM Workspace 管理。

技術選型如下：

- 前端: Nuxt
- 後端: NestJS
- 資料庫: PostgreSQL
- UI Library: Bootstrap
- ORM: Drizzle
- Test Runner: Vitest

資料庫使用 docker compose 建立即可。

安裝前先閱讀 skill，設置好基本的環境工具，再來安裝我指定的技術工具，記得每個步驟都做 commit 並遵守 commit conventions。

框架的安裝指令要遵循官方提供的最新安裝建議。
```

結果只能說慘不忍睹，泡麵已經泡爛了 XDDD

由於對話卡住沒有回應，我只好離開 session，把 commit 退回到最開始，自己安裝看看，找出哪裡有問題。

主要原因是新版的 PNPM 現在不允許 `install` 階段時執行 build 腳本，Nuxt 安裝時會啟動的 `esbuild` 沒辦法跑。所以我只好手動安裝一次 Nuxt，看一下報錯後有什麼提示，跟著做就解決了。

```
│  [ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.28.2

│

│  Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

---

## 小結

1. 有時不是 AI 太笨，使用較新技術就容易遇到新 bug，看能不能找到解法或是 workaround，不行的話就乖乖調整選型
2. Agent 太久沒有回應，可以**終止請求，問一下卡在哪裡**，別真的癡癡地等到咖啡涼掉了泡麵也爛掉
