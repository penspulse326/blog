---
title: 'Day 5 - 剛好遇見你！實作一對一配對機制！'
description: 'Cozy Chat 專案第 5 天：剛好遇見你！實作一對一配對機制！'
date: '2025-09-06 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day5'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1757164512000zqagql.png)

昨天我們已經了解 Socket.IO 的基本事件流程，今天要運用 Socket.IO 的房間機制，實作一對一聊天配對的功能！完整範例：[連結](https://stackblitz.com/edit/stackblitz-starters-na3vanlj?file=index.js)

## 事前準備

在實作**完全沒有碰過**、或是比較**繁瑣的功能**時，我習慣先梳理一下整個步驟流程，不用太鉅細靡遺，只要事先有抓到概念就好，我個人覺得這樣會比猛尻一頓然後 trial and error 不斷輪迴，心情會更好一點。

實際在程式碼中順流程時也常會運用「函式填空法」，先不去想裡面的細節、變數、計算邏輯等等，只填上函式名稱和運作順序，這就是一種 pseudo code。

以前在修演算法時，老師除了解釋每種演算法的數學原理之外，解題時也會帶我們跑過流程，其中最重要的步驟就是寫 pseudo code！

> 第一次上機考的時候，我自信滿滿，想說課本的題目我都背好了，結果考試當天光是建環境就耗費半節課，因為時間也不夠，課本沒有的題目我就埋頭亂寫，想當然這些分數都沒有拿到 QQ

---

## 撰寫 pseudo code

在開始寫 pseudo code 之前，先來盤點流程，昨天的範例大致流程為：

1. 將 Socket.IO 的 server 實例 `io` 綁定到 HTTP 伺服器並啟動
2. 定義 `io` 的 `'connection'` 事件
3. 在 `'connection'` 事件中定義 `'chat message'` 事件，只要收到來自前端的同名事件，就 `io.emit`，全體廣播新訊息

接下來的實作，從步驟 `3.` 開始需要改變一些機制：

1. 廣播不再是全體，而是一對一
2. 需要有一個等待配對的空間來管理連線中的使用者

因此流程需要調整，這裡可以先寫 pseudo code 順順看：

```js
// 等待池
const waitingPool = [];

io.on('connection', (socket) => {
  // 步驟 1. 產生使用者 ID
  const newUserId = '';

  // 步驟 2. 如果等待池有其他使用者就進行配對，沒有就加入等待池
  if (waitingPool.length > 0) {
    // 步驟 3. 取出等待池的某位使用者 ID

    // 步驟 4. 產生一個唯一值作為房間 ID
    const roomId = '';

    // 步驟 5. 將房間 ID 帶回前端儲存
    // 步驟 6. 利用房間 ID 來監聽訊息傳送
  } else {
    waitingPool.push(newSocketId);
  }
});
```

我用註解標記執行的步驟，如果明確知道要存取什麼變數可以先寫上，不知道先空著也沒關係。

目前看下來邏輯不會太龐大對吧！

但我過往的經驗是，如果沒有先想過再寫，容易寫到一半就卡住，必須重新釐清流程。或是發現漏掉一些步驟想跑去補起來，再跳回來原本的段落時已經忘記這段是要寫什麼了 QQ

---

## 房間機制

Socket.IO 提供的實例或方法都支援用房間機制隔離出專屬的通道，因此將上面的 pseudo code 轉換成真實的程式碼時，應該會比較直覺。

### 步驟 1. 產生使用者 ID

`connection` 事件觸發時，Socket.IO 會為這個連線生成一個亂數 ID，我們「暫時」使用這個 ID 即可：

```js
io.on("connection", (socket) => {
  const newUserId = socket.id;
  console.log("新的使用者連線:", newUserId);
}
```

:::warning
正式開發中，通常會生成一個 UUID 代表使用者，不會接拿 `socket.id` 來使用。
:::

### 步驟 2. 進行配對

- 如果等待池不是空的，就進行配對
- 如果等待池是空的，不進行配對，將 ID 放入等待池

配對邏輯也可以定義成事件，這樣對於前後端比較好控制什麼時候要觸發配對的邏輯，例如前端就可以用點擊按鈕或是其他 DOM 操作來觸發，而不是把初始化流程和配對邏輯串成一大段程式碼：

```js
socket.on('match:start', () => {
  if (waitingPool.length > 0) {
    // 待補
  } else {
    waitingPool.push(newUserId);
  }
});
```

### 步驟 3. 取出等待池的某位使用者 ID

不排序的情況下，陣列的索引越小，代表越早被加入到等待池，所以應該用 `shift` 取出在首位的元素。使用 `pop` 會取出最晚加入的人，導致越早加入反而越晚被配對到，最終絕對會引起民怨「欸我先來的欸！」，~~到時候投訴電話接不完~~：

```js
const peerUserId = waitingPool.shift();
```

### 步驟 4. 產生一個唯一值作為房間 ID

組合兩位使用者的 ID 即可當作房間 ID，再分別對兩個連線呼叫 `.join` 並帶上房間 ID，就會建立出專屬的通訊通道：

```js
const roomId = `room-${peerUserId}-${newUserId}`;

socket.join(roomId); // join 正在請求配對的使用者
io.sockets.sockets.get(peerUserId).join(roomId); // join 從等待池取出的某位使用者
```

`io.sockets.sockets` 可以寫成 `io.of('/').sockets`，後面的 `sockets` 表示這個路徑的所有 socket 連線實例。

`io.sockets` 是 Socket.IO 預設的命名空間（namespace），等同於 `io.of('/')`，在前後端都沒有指定路徑時會進到這裡。

如果想改成其他命名空間也是可以的，但連線的 URL 要修改：

```js
// 後端
const lobby = io.of('/lobby'); // 啟用 'lobby' 這個命名空間 URL 並取出實例

lobby.on('connection', (socket) => {
  // 略
});

// 前端
const socket = io('/lobby'); // 加上命名空間 URL
```

### 步驟 5. 將房間 ID 送回前端儲存

配對成功後就可以發送事件 `'match:success'`，將房間 ID 送回前端。**配對到的兩個人都要被通知到**。可以用 `.to` 指定某個房間 ID 或使用者 ID 後再呼叫 `.emit`。

我順便帶上配對成功的使用者 ID，讓前端可以拿來顯示目前和誰配對成功：

```js
// 通知剛剛連線進來的使用者
socket.emit('match:success', { roomId, peerId: peerSocketId });

// 通知從等待池拉出來的使用者
io.to(peerSocketId).emit('match:success', { roomId, peerId: newSocketId });
```

### 步驟 6. 利用房間 ID 來監聽訊息傳送

定義 `'chat:message'` 事件，只要收到新訊息，就對整個房間廣播訊息：

```js
// 傳送訊息到特定房間
socket.on('chat:message', ({ roomId, message }) => {
  io.to(roomId).emit('chat:message', message);
});
```

到目前為止已經實現了大部分的後端邏輯，再補上一些 log 可以讓整個配對流程更好觀測，完整程式碼：

```js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const waitingPool = [];

io.on('connection', (socket) => {
  const newUserId = socket.id;
  console.log('新的使用者連線:', newUserId);

  // 使用者請求配對
  socket.on('match:start', () => {
    if (waitingPool.length > 0) {
      const peerUserId = waitingPool.shift();
      const roomId = `room-${peerUserId}-${newUserId}`;

      socket.join(roomId);
      io.sockets.sockets.get(peerUserId)?.join(roomId);

      // 通知雙方配對成功，附帶 roomId
      socket.emit('match:success', { roomId, peerId: peerUserId });
      io.to(peerUserId).emit('match:success', {
        roomId,
        peerId: newUserId,
      });
      console.log(`配對成功: ${peerUserId} <-> ${newUserId} 房間 ID: ${roomId}`);
    } else {
      waitingPool.push(newUserId); // 尚無人等待，加入 pool
      console.log(`使用者 ${newUserId} 加入等待池`);
    }
  });

  // 傳送訊息到特定房間
  socket.on('chat:message', ({ roomId, message }) => {
    io.to(roomId).emit('chat:message', message);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
```

---

## 前端互動

前端的邏輯幾乎沒什麼改動，只需要在昨天的範例補上剛剛在後端設計好的事件，以及對應的邏輯即可，完整程式碼：

```html
<script>
  const socket = io();
  let currentRoomId = null; // 紀錄房間 ID

  const messages = document.getElementById('messages');
  const form = document.getElementById('form');
  const input = document.getElementById('input');

  socket.emit('match:start'); // 通知後端進行配對

  // 監聽配對成功事件
  socket.on('match:success', ({ roomId, peerId }) => {
    currentRoomId = roomId;
    const item = document.createElement('li');
    item.textContent = `配對成功，已與使用者 ${peerId} 建立連線`;
    messages.appendChild(item);
  });

  // 監聽 DOM 事件
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (input.value && currentRoomId) {
      socket.emit('chat:message', {
        roomId: currentRoomId,
        message: input.value,
      });
      input.value = '';
    }
  });

  // 接收訊息
  socket.on('chat:message', (msg) => {
    // 略
  });
</script>
```

實際運行結果：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1757167627000st35we.png)

---

## 本日小結

可以想像如果只用 WebSocket 的話，光是管理監聽事件，可能就是一個燒腦的過程，更不用說要把房間機制也實作出來～～

當然這個範例只做了最基本的核心邏輯，實務上還有錯誤處理、重連等等的相關機制需要設計好，才算是一套完整的流程。後續的開發也會實作到唷！

---

## 參考資料

- [Rooms](https://socket.io/docs/v4/rooms/)
- [如何撰寫虛擬碼 (Pseudocode)](https://opensourcedoc.com/blog/how-to-write-pseudocode/)
