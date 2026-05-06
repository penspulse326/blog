---
title: 'Day 8 - 為什麼不選我 QAQ 利用 82 法則完成技術選型！'
description: 'Cozy Chat 專案第 8 天：為什麼不選我 QAQ 利用 82 法則完成技術選型！'
date: '2025-09-09 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day8'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17574267810008439ra.png)

如果是個人研究、純屬玩玩，那麼開心就好！

一旦專案的定位變成**長期營運**、**系統開發**等，那麼技術選型要考量的面向就很多！例如：

- 團隊中有人熟悉此技術嗎
- 招募相關人員的難度
- 該技術更新與維護頻率

諸如此類，什麼問題都可以拿出來吵（欸）。

以從業人員的角度來考量，我偏好以 82 法則的方式去進行，也就是：

- 8 成：自己熟悉的技術
- 2 成：待研究和評估的內容

剩下的時間花在討論專案的需求與可行性！

## 前端

### 框架

| 前端框架            | 熟悉度 |
| ------------------- | ------ |
| React               | ★★★★☆  |
| Vue                 | ★★★★☆  |
| JavaScript          | ★★★☆☆  |
| ~~再戰十年~~ jQuery | ★★☆☆☆  |

我本身是前端工程師，因此跟網頁相關的選型，我的意見一定特別多 XD  
但即使是 vibe coding，無論如何**盡量不要選一個完全沒有碰過的技術**，除非目的就是研究該技術。我很懷念大學玩 jQuery 的時光，但可惜我已經被 React 跟 Vue 寵壞了，所以下次一定（？

### 進階框架

接下來要評估網站要走 SPA 或 SSR：

|          | SPA  | SSR  |
| -------- | ---- | ---- |
| 環境建置 | 普通 | 簡單 |
| SEO      | 差   | 好   |
| 資源要求 | 低   | 高   |

純聊天室的功能不需要 SEO，但後續可能會加入**尋人啟事**的功能，加上我懶得寫路由表，所以會以 SSR 框架為主。而我有實際使用 Next 拿來開發過小專案，Nuxt 完全沒碰過，因此勝出者就是......
![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1751705376000eronfj.png)

（？？？

雖然 SSR 框架是基於原本的 SPA 框架擴充出來的，也透過各種架構上的規範（conventions）提升開發體驗，但代價是多了一些認知負擔，還有 hydration、build 等等隱性的坑。而且不是 SSG 純靜態頁面的話，必須要有一台機器運行它，增加了維運成本，這也是一般專案如果沒有 SEO 需求就不會特別選用 SSR 框架的原因之一。

### UI

SSR 框架的盛行讓 Tailwind 為基底的 UI 庫如雨後春筍般冒出，因為它們最終都會編譯出容量及小的靜態 CSS 檔，讓整體載入效率更好。同樣是靜態檔案，萬年不敗的 Bootstrap 則常被調侃過時了~~「老東西，你的技術最沒用啦」~~（JOJO 梗）。

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1757427595000b35cig.png)

從自學時期到正職工作這幾年，我都沒有真的持續使用一套 UI 庫，只有在臨時救火會碰到，大部分情況都是手刻。在 React 環境中我比較常用 styled-components 這類 CSS in JS 的技術。

後來我悟透一個道理：

> 「**換個專案換個 UI**」

除非是要負責長期維護，否則換了專案或工作後，通常設計系統也會不太一樣，只有手刻功力與元件設計的觀念才是能夠帶著走的，而這些觀念也適用於如何快速上手各式 UI 庫。

結論：我抱持開篇說到的 `玩玩也不錯` 的心態，這次選擇沒有玩過的 [Mantine](https://mantine.dev/)！

---

## 後端

|          | Express      | NestJS |
| -------- | ------------ | ------ |
| 環境建置 | 簡單         | 簡單   |
| 認知負擔 | 低           | 中~高  |
| 備註     | 手動設定較多 |        |

後端不是我擅長的領域，也沒有實際開發過專案，所以我的評估條件比較單純，就是在 `短期專案內可以盡快得到解法就好，不需要 survey 太多`。

我很猶豫要用 Express 還是 NestJS，因為 NestJS 建置環境實在太香，只是我個人只有學到基本的架構，可以寫個待辦清單出來而已，不過查了一下發現 NestJS 的 WebSocket 元件也不難。

前面示範都是用 Express，它的麻煩在於因為是輕量框架，很多設定要手動處理......但這些問題已不存在，我先前在研究如何將 Express 整合 TypeScript 時找到了這篇[文章](https://medium.com/@gabrieldrouin/node-js-2025-guide-how-to-setup-express-js-with-typescript-eslint-and-prettier-b342cd21c30d)，也照著它的步驟建立好模板，我要做的事大概就是把程式碼搬過來而已 XD

為了維持這個系列文章的一致性，最後的勝出選手是：Express！

~~「Express 根本就不能算是一個框架」by 某位同事~~

### 不使用 SSR 框架做全端開發的原因

其實也沒有什麼 OK 或不 OK 的點，直接用 Next 做好前後端的也是大有人在～
我則是想挑戰看自己一步一步把前後端分離的專案建置起來的過程。

每種類型的專案都有各自適合或個人偏好的作法，沒有什麼絕對正確或是完美無缺的解決方案，這也是我覺得軟體開發好玩的地方！

---

## 本日小結

目前的選型我只以網頁前後端進行初步評估，部署有 PaaS 可以解決，所以先不考慮自架我認為也是可以接受的，畢竟我們的首要目標是 MVP，而不是**試圖解決一個不存在、不需要被解決的問題**！

---

## 參考資料

- [Node.js 2025 Guide: How to Set Up Express.js with TypeScript, ESLint, and Prettier](https://medium.com/@gabrieldrouin/node-js-2025-guide-how-to-setup-express-js-with-typescript-eslint-and-prettier-b342cd21c30d)
