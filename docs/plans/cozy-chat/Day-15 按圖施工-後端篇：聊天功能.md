---
title: 'Day 15 - 按圖施工-後端篇：聊天功能'
description: 'Cozy Chat 專案第 15 天：按圖施工-後端篇：聊天功能'
date: '2025-09-16 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day15'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17579245990002be3bb.png)

接下來只剩聊天功能了！這部分的功能相對單純，但讀訊息的流程會稍微複雜一點。

## 發送訊息

我將發送訊息設計成兩段邏輯：

1. `createChatMessage`：對應 model 的 `chatMessageModel.createChatMessage`
2. `sendChatMessage`：呼叫 `userModel.findUserById` 取得 `user.device`，再進行新增訊息

這樣設計的目的是為了讓 `createChatMessage` 的職責單純一點，只負責準備 DTO 並建立新資料，`sendChatMessage` 才將查詢使用者的流程包進來。

`chat-message.service.ts`：

```ts
async function createChatMessage(data: SocketChatMessage, device: Device): Promise<ChatMessageDto> {
  const currentTime = new Date();
  const dto = {
    content: data.content,
    created_at: currentTime,
    device,
    room_id: String(data.roomId),
    user_id: String(data.userId),
  };

  const result = await chatMessageModel.createChatMessage(dto);

  if (result === null) {
    throw new Error('建立聊天訊息失敗');
  }

  return result;
}

async function sendChatMessage(data: SocketChatMessage): Promise<ChatMessageDto> {
  const user = await userModel.findUserById(data.userId);

  if (!user) {
    throw new Error(`找不到使用者: ${data.userId}`);
  }

  const result = await createChatMessage(data, user.device);

  return result;
}
```

在 WooTalk 的機制中，使用者的裝置不會轉移（因為是匿名聊天），配對資訊只會暫存在應用程式的載體裡面，像是瀏覽器的 `localStorage`。

所以同個使用者不會一下從手機發送訊息，一下從電腦。 `device` 這個資訊在「配對成功時寫入到資料庫一次」後就不會有更改。

所以 `device` 要不要存到 `chat_messages` 裡面，我覺得見仁見智～不存的話，就要讓前端在發送訊息時把 `device` 的資訊一起送回來，後端就可以跳過 `userModel.findUserById`，減少查詢消耗。

測試送出訊息的邏輯：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1753781594000gojvlx.png)

## 讀取全部訊息

原文 `在沒有離開配對時重新整理後需要讀取全部訊息`，這句話包含了幾個流程：

1. 前端在啟動連線時帶入 `localStorage` 存的 `roomId`
2. 後端在 `connection` 事件時檢查是否有帶 `roomId`
3. 檢查到有帶的話去查詢對應的聊天紀錄和使用者的狀態
4. 將聊天紀錄回傳給前端

再濃縮一下，以資料讀寫的角度來看，後端要做的只有：

1. 查詢聊天資料
2. 檢查使用者狀態

Socket.IO 允許前端在連線時帶入資料：

```ts
// 前端
const socket = io({
  query: {
    roomId: '6892ca6348ae04ade3e2158a',
  },
});

// 後端
io.on('connection', (client: Socket) => {
  const roomId = client.handshake.query.roomId;

  if (typeof roomId === 'string'
        && roomId !== ''
        && roomId !== 'null') {
    void handleCheckUser(client.id, roomId);
  }
```

要留意執行 `handleCheckUser` 之前的判斷，透過 `socket.handshake.query` 拿出來的會是字串，從定義提示也可以看到：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17579218190009dmksv.png)

所以 `null` 實際上會轉成 `'null'`，這個值也要過濾掉。

`handleCheckUser` 的流程是先確定前端給的 `roomId` 在資料庫裡面有對應資料才把使用者重新 `.join` 到聊天室。

如果 `roomId` 對應資料不存在，要 `emit` 重連失敗的事件 `MATCH_EVENT.RECONNECT_FAIL`，讓前端可以接著清掉 `localStorage`。

房間的另外一位使用者已經離開配對，也要 `emit` 這個事件 `MATCH_EVENT.LEAVE`：

```ts
async function handleCheckUser(socketId: string, roomId: string) {
  try {
    await chatRoomService.findChatRoomById(roomId);
  } catch (error) {
    console.error('handleCheckUser error', error);
    io.to(socketId).emit(MATCH_EVENT.RECONNECT_FAIL);

    return;
  }

  await io.of('/').sockets.get(socketId)?.join(roomId);

  const isLeft = await userService.checkUserStatus(roomId);

  if (isLeft) {
    io.of('/').sockets.get(socketId)?.emit(MATCH_EVENT.LEAVE);
  }
}
```

`checkUserStatus` 的內容比較單純，判斷是否有任一使用者已經離開：

```ts
// user.service.ts
async function checkUserStatus(roomId: string): Promise<boolean> {
  try {
    const users = await findUsersByRoomId(roomId);

    return users.some((user) => user.status === userStatusSchema.enum.LEFT);
  } catch (_error) {
    return false;
  }
}
```

連得回來就表示該使用者還沒離開配對，所以不會有兩位使用者都是 `'LEFT'` 的狀態。

房間重新建立後就可以讀取訊息：

```ts
async function handleChatLoad(roomId: string) {
  const chatMessages = await chatMessageService.findChatMessagesByRoomId(roomId);

  io.to(roomId).emit(CHAT_EVENT.LOAD, chatMessages);
}
```

我希望離開配對的提示要出現在聊天紀錄的最後，所以 `handleChatLoad` 的執行會放在宣告 `isLeft` 之前：

```ts
await io.of('/').sockets.get(socketId)?.join(roomId);

// 放在這
await handleChatLoad(roomId);

const isLeft = await userService.checkUserStatus(roomId);

if (isLeft) {
  io.of('/').sockets.get(socketId)?.emit(MATCH_EVENT.LEAVE);
}
```

調整 `index.html` 對應的事件，看看重新整理的對話紀錄是否還在：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1754466852000d4xsab.png)

---

## 反正規化

先前規劃資料庫時我用了一點反正規化的概念，讓 `users` 和 `chat_rooms` 可以透過彼此的 id 互相查詢，因為 MongoDB 並沒有 join 的語法，如果兩邊都能存到 id 的話查詢會方便一點。NoSQL 的設計在某種程度上也是希望避開 join。

但在關聯式資料庫中要小心，當 A/B 兩個 table 互相參照時，無論先建立哪邊的資料，都會因為外鍵約束檢查導致建立失敗，所以必須讓其中一個 table 的外鍵可以是空值（nullable）。

如果做了反正規化，也一定要小心**資料一致性**的問題，假設 A-1 本來與 B-1 互相參照，改成 A-1 與 B-2 後，B-1 也要記得更新，斷掉與 A-1 的參照或是重新建立與另外一筆資料的參照。

所以反正規化大多用比較少變動的資料，像是這個匿名聊天室的機制，`users` 與 `chat_rooms` 幾乎是不會更動的。

我在 `user.service.ts` 的 `createMatchedUsers` 中也是這麼做：

1. 新增兩個 `user`（不帶 `room_id`）
2. 新增 `chat_room`（帶剛剛新增的兩個 `user`的 id）
3. 更新 `user` 的 `room_id`

---

## 本日小結

到目前為止算是對 service 和 model 的設計概念有初步了解，後端的核心邏輯也差不多完成～在 `index.html` 有成功驗證過流程，接下來要把這邊的前端邏輯遷移到 Next 專案上！

後端最重要的工作不外乎就是確保資料的一致性以及資料輸入輸出的驗證，也控制了大部分的業務邏輯，所以比較沒有前端想寫什麼就寫什麼的奔放，對程序與資料安全要多多留意。

---

## 參考資料

- [什麼是資料庫反正規化？優缺點是什麼？](https://www.explainthis.io/zh-hant/swe/database-denormalization)
