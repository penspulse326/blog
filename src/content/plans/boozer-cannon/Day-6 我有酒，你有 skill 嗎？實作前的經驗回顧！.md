![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1789868765000t8ka0c.webp)

有了使用者故事、前端介面和 DBML 這些材料，差不多可以實驗看看可行性了。

實作前還需要一點小魔法，讓 Agent 產出更穩定，就是「給予它基本的約束」，最簡單的方式就是 skill。不過 AI 現在的強度越來越高，我個人覺得不一定要裝太多 skill，可以先嘗試把自己的開發觀念提取成 skill，再看看需不需要其他好用的 skill。

至少初期在嘗試時可以先做到：

> 讓 AI 的做事風格和方向不要和自己差太多。

試想你一早來就把同事寫的 code 嫌棄得要死，午休一起吃飯的時候不會有任何一點尷尬嗎 XD

我個人做的 skill 目前有兩份：

1. 程式開發通用規範
2. Node.js 專案初始設定

詳細可參考：[GitHub 連結](https://github.com/penspulse326/my-skills)

---

## 程式通用開發規範

除了濃縮一些比較通用的開發規則，也整合了過去一年我在使用 Agent 時遇到的一些雷，例如：

1. 隨處可見的註解，而且全英文、繁中、簡中有時還會混雜出現 XD
2. 花費時間在修復不重要的 lint，這些通常可以自動化修復
3. 在你說出「我覺得不行」後，後續改動時常常會忘記清掉之前做錯的程式碼

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17898678420004ulm4x.webp)

前陣子在台中的 Claude Meetup 活動，龍哥（高見龍）也有提到：

> 多告訴 Agent 要做什麼，減少「不要做什麼」相關的 prompt。（Pink Elephant）

所以後來我也把「嚴禁...」之類的描述都移除了，現在這版精簡了不少。

---

## Node.js 專案初始設定

主要是把一些 lint 工具和 Git hook 串好，其他是我個人開發習慣的設定，例如 TypeScript 設定 `@`、幫 Tailwind 的 classname 排序等等，這個 skill 還沒有用過很多次，持續更新中！

這些大概是我去年在研究 Monorepo 時的痛點。我當時沒有學 Nx，是用 PNPM Workspace 來管理，反覆實驗的過程中要不斷告訴 Agent 裝哪些套件、怎麼設定，後來大多 Agent 都引進了 `AGENT.md` 和 skill 的概念後，這些繁瑣的基礎建設就變得比較簡單！

---

題外話：

雖然我的 skill 內文是中文，但如果可以，我自己覺得英文會好一點。我一開始提出構想時，Agent 產出來的中文，老實說真的不像人類會講的話，也不是我們平常開發溝通的術語，一來一回的過程，這些文本不知道會變怎樣。

---

## 小結

1.  把 AI 當成你的小分身，用 skill 約束基本的方向，讓它和你的行為趨近一致
2.  多指示 AI 要做的事，**減少禁止事項**的描述
3.  常用的流程和設定也可以整理成 skill
