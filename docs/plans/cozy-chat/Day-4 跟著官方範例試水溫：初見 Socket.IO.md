---
title: 'Day 4 - 跟著官方範例試水溫：初見 Socket.IO'
description: 'Cozy Chat 專案第 4 天：跟著官方範例試水溫：初見 Socket.IO'
date: '2025-09-05 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day4'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17570642610004dxnea.png)
先前有提到 Socket.IO 封裝了 WebSocket 並加入一些實用的功能。接下來會跟著[官方範例](https://socket.io/get-started/chat)實作簡易聊天室，並補充一些知識。

完整範例：[Stackblitz 連結](https://stackblitz.com/edit/stackblitz-starters-p9arorzu?file=index.html)

## 升級機制

WebSocket 在連線時，底層仍然是透過 HTTP 請求連線，確定連線成功並且另一端的機器也支援 WebSocket 後，才會升級為以 `ws://` 開頭的協定。

Socket.IO 初次連線會先使用 HTTP 輪詢，之後嘗試進行協定升級。若有任一邊不支援則會持續使用輪詢模式。Socket.IO 也會視連線狀況，將協定自動降級成 HTTP 協定。

---

## 環境建置

Socket.IO 雖然好用，代價就是前後端都必須使用這個套件才能建立連線！

安裝完之後照官方範例先新增 `index.js` 與 `index.html` 內容：

```js
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
```

```html
<body>
  <ul id="messages"></ul>
  <form id="form" action="">
    <input id="input" autocomplete="off" />
    <button>Send</button>
  </form>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
  </script>
</body>
```

---

## 連線設定

從 `index.js` 可以看到和先前使用 ws 套件的步驟不太一樣。通常是透過 `const app = express()` 直接建立 server 實例，只要執行 `app.listen` 就可以啟動 HTTP 伺服器。

但官方範例是導入 Node.js 原生的 http 模組 `const http = require('http')`，原因是範例想在同個 server 實例上共用 Socket.IO，所以需要 `http.createServer` 這樣手動建立 server 實例，再個別將 Express 與 Socket.IO 進行綁定。

啟動應用程式之後也可以看到只佔用了一個 port：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1750217688000pdrzeo.png)

所以 Socket.IO 其實也可以綁定到別的 server 實例，不過需要額外加入一些 CORS 的設定才能處理連線。

目前是由 Express 的 router 導向到靜態頁面，所以前端只需要呼叫 `io`，不需要指定 URL 就可以對 host 發出連線請求：

```html
<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
</script>
```

打開 DevTools 會看到 `<host>/socket.io/?EIO=......` 之類的請求通過，表示已經成功連線了！後端的終端也會看到這個 log `'a user connected'`。

如果 Socket.IO 綁定到不同實例，前端在連線時就要帶入不同的 URL：

```js
const socket = io('http://localhost:1234');
```

### Stackblitz 的小坑點

Stackblitz 的環境有一些連線限制，如果前端不是像先前使用 Web API 的方式去建立 WebSocket 連線，就無法進行協定升級。如果直接在 `const socket = io(...)` 中指定 URL 也會被 Stackblitz 彈出視窗提醒「必須升級會員」才可以存取沙盒環境中的 localhost。

這種情況下會自動退回到輪詢模式，query string 也可以看到 `transport=polling`：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1750226097000urn8sf.png)

在自己電腦上開發就沒有這個問題了，初次連接中如果有成功升級協定，URL 就會從 `http://` 變成 `ws://`：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1750226193000fogmmt.png)

因為共用同個實例，所以 `server.listen(...)` 啟動後 Express 也會正常運作，所以前端才能到達 `index.html` 這個畫面。

---

## 事件監聽

語法和事件名稱與 ws 套件幾乎相同，因為它們都是繼承 Node.js 的 `EventEmitter` 來實作。

後端一樣要在 `connection` 事件中定義其他事件：

```js
io.on('connection', (socket) => {
  console.log('a user connected');

  // 監聽 'chat message' 事件
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); // 將新訊息廣播給所有 client
  });
});
```

事件名稱可以自訂，只要確保前後端都有監聽到同名的事件即可，以下是官方提供的前端程式碼：

```js
<script>
  const socket = io();

  const messages = document.getElementById('messages');
  const form = document.getElementById('form');
  const input = document.getElementById('input');

  form.addEventListener('submit',(e) => {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
    }
  });

  // 監聽名稱為 'chat message' 的事件
  socket.on('chat message',(msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
  });
</script>
```

原本的 `.send` 換成了 `.emit`，但功能是類似的！而 `.emit` 可以帶入自訂的事件名稱，這代表可以自己在任意時機呼叫 `.emit` 來觸發其他事件，這樣的靈活性也是 Socket.IO 的設計哲學。

後端廣播也變得更簡單粗暴，只要透過 `io.emit` 就可以直接通知所有連線中的 client！

:::info
原生的 WebSocket 也可以自訂事件名稱，但必須由固定事件 `'message'` 來觸發，實作上會比較麻煩。
:::

Socket.IO 傳輸資料的格式和 ws 套件也雷同，但是做了序列化的處理，可以直接傳物件，而不用再手動進行 `JSON.stringify` / `JSON.parse`，變得方便許多！

到這邊為止應該可以正常發送訊息了，~~除非官方在騙~~：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1757059863000bwtjom.png)

---

## 本日小結

目前只有大致介紹 Socket.IO 的機制，後面會持續實作並探索其他功能，今天就當作熱身，補充一點小知識！

Socket.IO 了提供各種常見功能，並且可以執行任意事件與物件的傳輸，減少了很多 WebSocket 環境中需要自己手刻的部分，可以專注在端對端的交互邏輯。

| API          | Socket.IO                | WebSocket      |
| ------------ | ------------------------ | -------------- |
| 監聽         | .on                      | .on            |
| 傳輸資料     | .emit                    | .send          |
| 自定義事件   | 可以                     | 可以但麻煩     |
| 傳輸格式限制 | 彈性最好，可以直接傳物件 | 需要自行序列化 |

---

## 參考資料

- [Get started](https://socket.io/get-started/chat)
- [協定升級機制](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Guides/Protocol_upgrade_mechanism)
