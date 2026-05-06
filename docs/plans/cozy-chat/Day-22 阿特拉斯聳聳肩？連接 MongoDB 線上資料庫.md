---
title: 'Day 22 - 阿特拉斯聳聳肩？連接 MongoDB 線上資料庫'
description: 'Cozy Chat 專案第 22 天：阿特拉斯聳聳肩？連接 MongoDB 線上資料庫'
date: '2025-09-23 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day22'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758641062000i1wndf.png)

先前已經將前後端都部署到 Vercel 和 Render 上了，接下來只要把資料庫也改為官方的雲端資料庫 MongoDB Atlas，整個應用程式就算是可以上線使用了！

## 建立 Cluster

創好 MongoDB Atlas 的帳號後會先經過 Create Organization 的步驟，但其實沒什麼好填的（？）

和其他雲端服務一樣會有存取限制的選項，因為是純屬個人練習的專案，我覺得不限制 IP 也無所謂：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758591683000gz9abx.png)

如果不小心打開也沒關係，後續可以到儀表板新增白名單，點選 **ALLOW ACCESS FROM ANYWHERE**：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17586253890004uvxta.png)

這樣就會建立一個全開的 IP 了：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758625542000cpcya5.png)

MongoDB Atlas 只支援 IP 白名單，所以沒辦法使用 PaaS 提供的網址，如果是自架機器的話就可以設定機器 IP 進去。

:::danger
如果 side project 有提供給他人使用的話，也務必向大家聲明**本專案僅為練習成果展示，請勿提供個人真實資訊**。
:::

再來要建立一個 Project，別緊張，步驟也是超簡單......幾乎不需要填什麼東西就建起來了 XD

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17585922610000twvjn.png)

最後就可以建立 Cluster（運行 MongoDB 的本體程序）！

**Quick setup** 的地方我取消了 `Preload sample dataset`，打勾的話會先灌進一些預設的 collection：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758592527000dj4q5r.png)
建好之後儀表板的 Overview 可以看到 Cluster0（沒改名字）：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758607248000cqx6eh.png)

---

## 連線指南

按下 Connect 會彈出連線指南，第一步要先建立資料庫的使用者，這裡也有說明「第一個使用者會被賦予管理權限」：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758607450000mh14cw.png)

連接方式選 Drivers（使用官方提供的 SDK，也就是我們先前有安裝過的 `npm install mongodb`），如果採用其他的 ORM/ODM 也是選這個選項：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/175860761600049w2ii.png)

因為最關鍵的資訊是那串 URI！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17586078740003ymsnm.png)

將本機程式中的 `.env` 替換成這個 URI 就可以向 Cluster0 發起連線，官方也有附上所有語言環境的連線示範程式碼和文件，不用怕變成孤兒 XD

通常這樣就可以正常連線了！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17586095790004299lu.png)

雖然 IP 全開好像很危險，但其實是可以後續再手動新增更細緻的使用者帳號，這邊就不多作介紹了（？）

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758626035000yzj4jm.png)

---

## 本機環境測試

測試本機的實際操作流程：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758611075000597wee.png)

寫入成功的話在儀表板會看到 Cluster0 的流量變化：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758611157000cel473.png)

點擊 **Browse Collections** 會進到和一般 DB GUI 差不多的畫面，可以下語法查詢資料，或是手動編輯資料。剛剛在本機網頁的操作，例如聊天訊息、配對資訊、聊天室等也都可以看得到：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758611197000ge0a3z.png)

---

## 線上環境測試

最後當然要來測試線上環境能不能正常運行囉！

後端的啟動程序要先換上 Vercel 專案的 URL：

```ts
async function bootstrap() {
  const url =
    process.env.ENV === 'production'
      ? 'https://cozy-chat-web.vercel.app'
      : 'http://localhost:3000';

  try {
    await connectToDB();

    setupSocketServer(
      new Server(server, {
        cors: {
          credentials: true,
          methods: ['GET', 'POST'],
          origin: url,
        },
      })
    );
```

到 Render 新增後端專案的環境變數，本機有使用到的變數都要填上去：

1. MongoDB URI
2. ENV（改成 `production`，否則 CORS 的設定最後還是會導向到 `'http://localhost:3000'`）
3. PORT

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758621448000a9470t.png)

確定部署成功後，Render 專案的 URL：`https://**.onrender.com` 也要一併更新給前端。

先在根目錄新增 `next.config.ts`：

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
};

export default nextConfig;
```

然後替換掉 Socket.IO 連線時的 URL：

```ts
function connectSocket() {
  socket.connect({
    url: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080',
    query: {
      roomId,
    },
  });
```

最後到 Vercel 設定剛剛新增好的環境變數 `NEXT_PUBLIC_SOCKET_URL`：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758620401000nuiamy.png)

等待 Vercel 部署完成後應該就可以正常聊天啦！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758621780000ij2uil.png)

---

## 本日小結

由於 MongoDB Atlas 的儀錶板，整體介面算是好理解，所以線上環境的轉移就簡單很多，只要環境變數都有正確給到就沒問題了！

目前的成品大概是這樣，可以開一個分頁 + 一個無痕分頁來測試，請大家手下留情不要把它打掛 XD

網站連結：[https://cozy-chat-penspulse.vercel.app/](https://cozy-chat-penspulse.vercel.app/)

---

## 參考資料

- [Manage Organization Users](https://www.mongodb.com/docs/atlas/access/manage-org-users/#manage-organization-users 'Permalink to this heading')
