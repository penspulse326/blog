---
title: 'Day 12 - 按圖施工-後端篇：修改範例'
description: 'Cozy Chat 專案第 12 天：按圖施工-後端篇：修改範例'
date: '2025-09-13 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day12'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17577740130000kk4z6.png)

基本的配對邏輯在先前已經有 [Stackblitz 的範例](https://stackblitz.com/edit/stackblitz-starters-na3vanlj?file=index.js)
了，來先試著搬過來！範例中的命名會取得比較簡短好懂，但接下來會有比較多交互行為，命名就不能太隨意，所以重構的過程中也會一併調整。

## 遷移原始碼

搬過來之後除了要重新安裝依賴項目之外，也要 TS 環境下的設定：

1. 先前在建立 monorepo 架構時有在定義 `tsconfig.base.json` 的輸出為 `"module": "ESNext"`，所以 CommonJS 定義的 `require` 要改成 ESM 定義的 `import`

2. 根據 ESLint 的報錯逐步修正程式碼或重新調整 ESLint 規則

3. `__dirname` 在 ESM 環境中是不能讀取的，雖然 TS 檢查不會報錯，但實際運行時會跳出`ReferenceError: __dirname is not defined`，因此要透過 `path` 和 `url` 重組路徑

遷移的過程有可能會遇到 TS 或 ESLint 的檢查不靈敏問題，也是建議直接 `Reload Window` ！

最後確認 `index.html` 能在指定的 port 中渲染出來就算初步遷移完成囉：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1753167796000gut2we.png)

---

## 建立架構

目前的程式碼不多，但這是還沒有加入重組資料和操作資料庫的狀況。可以想像要完整運作的話，最好還是先把各個事件的區塊初步分離好：

```ts
io.on('connection', (socket) => {
  const newUserId = client.id;
  console.log('新的用戶連線:', newUserId);

  // 使用者請求配對
  socket.on('match:start', async () => {});

  // 傳送訊息到特定房間
  socket.on('chat:send', async () => {});
});
```

先把各事件的 callback 清空，這樣建立連線後要進行的流程就比較容易梳理！

大部分的事件都是在 client 與 server 連線成功後，在 `connection` 事件裡面啟動監聽的，因此這段邏輯分離出來後，程式的啟動點就不會有一大包的程式碼，而 `io` 的實例就可以當作參數傳入分離好的邏輯，形成依賴注入（Dependency Injection）的概念。

這邊就會有點小小的分歧，有些人喜歡用 class，有些人喜歡 function......我沒有什麼特別的見解，單純想試試看只用 function 怎麼寫 XD

```ts
export function setupSocketServer(io: Server) {
  const waitingPool: string[] = [];

  io.on('connection', (client: Socket) => {
    const newUserId = client.id;
    console.log('新的用戶連線:', newUserId);

    // 配對
    client.on('match:start', () => {
      handleMatchStart(client);
    });

    // 送出訊息
    client.on('chat:send', ({ message, roomId }) => {
      handleChatSend(message, roomId);
    });
  });

  function handleMatchStart(client: Socket) {}

  function handleChatSend(message: string, roomId: string) {}
}
```

---

## 送出訊息

這部分還蠻簡單的，基本上沒有什麼變化，透過 `roomId` 指向房間後發出訊息：

```ts
function handleChatSend(message: string, roomId: string) {
  io.to(roomId).emit(CHAT_EVENT.SEND_MESSAGE, message);
}
```

事件名稱改為用物件的 key 來代替，除了防止打錯字，可以用 IDE 提示是最主要的原因，之後也可以給前端共用！

```ts
export const CHAT_EVENT = {
  SEND: 'chat:send',
  LOAD: 'chat:load',
};

export const MATCH_EVENT = {
  MATCH_START: 'match:start',
  MATCH_SUCCESS: 'match:success',
  MATCH_CANCEL: 'match:cancel',
  MATCH_FAIL: 'match:fail',
};
```

---

## 配對成功

原先處理配對的其實有點長，裡面至少做了：

1. 判斷等待池中是否有可配對的使用者
2. 配對成功後加入房間的邏輯

甚至還沒加上進入等待池之後的事件！因此先初步拆分成兩部分：

```ts
// 處理配對請求
async function handleMatchStart(client: Socket) {
  const newUserId = client.id;

  // 無人等待時加入等待池

  // 配對成功
  await handleMatchSuccess(client, newUserId, peerUserId);
}

// 處理配對成功後的流程
async function handleMatchSuccess(client: Socket, newUserId: string, peerUserId: string) {}
```

仔細研讀上下文的話，會發現 client 事件需要存取到的都是 `client.id` 而不是實例本身，所以是可以不用傳入整個實例的！

```ts
client.on(CHAT_EVENT.MATCH_START, () => {
  // 改為傳入 client.id
  handleMatchStart(client.id);
});

async function handleMatchStart(client: Socket) {
  // 移除 client 的傳入
  await handleMatchSuccess(newUserId, peerUserId);
}
```

`handleMatchSuccess` 改用和尋找 `peerUserId` 的方式一樣的操作，透過 `io` 來找 `newUserId` 的實例！

通知的邏輯原本是對兩位使用者 `emit`，推送配對對象的 id，可以簡化為用 `io` 對指定房間 `emit`，前端只要將 `userIds` 排除掉自己的 id 就知道對方 id：

```ts
async function handleMatchSuccess(newUserId: string, peerUserId: string) {
  const roomId = `room-${peerUserId}-${newUserId}`;

  await io.of('/').sockets.get(newUserId)?.join(roomId); // 改為使用 io 去找到 newUserId 的 client 實例
  await io.of('/').sockets.get(peerUserId)?.join(roomId);

  // 通知雙方配對成功，附帶 roomId
  io.to(roomId).emit('match:success', {
    userIds: [newUserId, peerUserId],
    roomId,
  });

  console.log(`配對成功: ${peerUserId} <-> ${newUserId} 房間 ID: ${roomId}`);
}
```

---

## 配對逾時

在 `handleMatchStart` 判斷等待池時還少了逾時的機制，可以用 `setTimeout` 來檢查使用者加入等待池後是否一直等不到配對：

```ts
function addUserToPool(newUserId: string) {
  waitingPool.push(newUserId);
  console.log(`找不到等待中的使用者，${newUserId} 加入等待池`);

  setTimeout(() => {
    if (waitingPool.includes(newUserId)) {
      waitingPool = waitingPool.filter((userId) => userId !== newUserId);

      console.log(`${newUserId} 等待超時，從等待池移除`);
      io.of('/').sockets.get(newUserId)?.emit(CHAT_EVENT.MATCH_FAIL);
    }
  }, 3000);
}
```

有一個邊界條件要注意，使用者可能在等待期間中斷 Socket.IO 連線，例如：`手滑按到重新整理`、`不小心關掉瀏覽器或分頁` 等等，因此邏輯上可能會出現 `等待池有這個 id 但 io 實例中找不到以這個 id 連線的使用者`！

這邊透過 `?.` 來簡化掉：`io.of('/').sockets.get(newUserId)?.`！

因為無論如何 `newUserId` 都會先被移除，因此 `emit` 最後只會成功發送給還沒關掉畫面的使用者。

調整一下 `index.html` 的事件，出現 `配對失敗` 就算是成功囉！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1753240936000n8mav6.png)

---

## 本日小結

主要邏輯目前都初步分離，邏輯複雜度與可讀性也還 OK，後續接入資料庫之後可以再考慮要不要往下拆分！
