---
title: 'Day 14 - 按圖施工-後端篇：配對功能'
description: 'Cozy Chat 專案第 14 天：按圖施工-後端篇：配對功能'
date: '2025-09-15 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day14'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1757903543000132cuj.png)

知道如何定義資料之後，就可以將 Socket.IO 的事件和資料庫做串接了！

MVP 程度的功能需要有：

1. 配對成功
2. 收發訊息
3. 取消配對（在等待配對途中按下離開）
4. 離開配對（在已經配對的狀態下按下離開）
5. 在沒有離開配對時重新整理後需要讀取全部訊息

先從配對的機制開始實作吧！

## 配對成功

配對成功需要操作 `user.model.ts` 與 `chat-room.model.ts`，這時如果回去看配對成功的事件：

```ts
async function handleMatchSuccess(newUserId: string, peerUserId: string) {
  // 略
}
```

在這裡把邏輯全部寫完會變得冗長，這點稍後也會示範。所以通常會透過 service 來操作 model，以及封裝一些組合、計算等業務邏輯，這就是 SOLID 原則中的單一職責原則（SRP）！

model 的內容也是比照昨天的模式，封裝資料庫的操作與 Zod 的 schema 驗證，所以接下來就不特別列出來。

### 操作資料

話雖如此，還是可以先寫完再拆分邏輯，倒不需要在一開始就一次拆到位，具體步驟較為抽象的時候還是先以邏輯接通為主，俗話說「過早的優化是萬惡的根源」！

先在 `handleMatchSuccess` 中新增操作 model 的邏輯：

```ts
async function handleMatchSuccess(newUserId: string, peerUserId: string) {
  const users = [newUserId, peerUserId];
  const roomId = `room-${newUserId}-${peerUserId}`;
  const currentTime = new Date();

  // 新增使用者
  const newUsers: UserDto[] = users.map((userId) => ({
    created_at: currentTime,

    // 這裡怪怪的
    device: 'PC',
    last_active_at: currentTime,
    room_id: roomId,
    status: UserStatus.enum.ACTIVE,
  }));

  const newUser = await userModel.createUser(users[0]);
  const peerUser = await userModel.createUser(users[1]);

  // 新增房間
  const room = await chatRoomModel.createChatRoom({
    users: [newUser.id, peerUser.id],
    created_at: currentTime,
  });

  // 加入房間
  await io.of('/').sockets.get(newUserId)?.join(room.id);
  await io.of('/').sockets.get(peerUserId)?.join(roomId);

  // 通知使用者
  io.to(roomId).emit(MATCH_EVENT.SUCCESS, {
    userIds: [newUser.id, peerUser.id],
    roomId,
  });
}
```

寫到一半就會發現已經有個地方怪怪的啦！

使用者開始配對時，還需要索取他的裝置資訊，所以 `waitingPool` 的內容也要修改，不能只有存 `socket.id`：

```ts
type WaitingUser = {
  device: Device;
  socketId: string;
};

const waitingPool: WaitingUser[] = [];

client.on(CHAT_EVENT.MATCH_START, (device: Device) => {
  void handleMatchStart({ device, socketId: socket.id });
});
```

開兩個無痕視窗測試看看配對邏輯是否正常：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1753691901000nuviqa.png)

### 分離 service

新增 `user.service.ts`：

```ts
async function createUser(user: WaitingUser): Promise<UserDto> {
  const currentTime = new Date();
  const dto = {
    created_at: currentTime,
    device: user.device,
    last_active_at: currentTime,
    status: userStatusSchema.enum.ACTIVE,
  };

  const result = await userModel.createUser(dto);

  if (result === null) {
    throw new Error('建立使用者失敗');
  }

  return result;
}

async function createMatchedUsers(newUser: WaitingUser, peerUser: WaitingUser): Promise<UserDto[]> {
  // 1. 建立 user
  const [newUserResult, peerUserResult] = await Promise.all([createUser(newUser), createUser(peerUser)]);

  // 2. 建立 chat room
  const newChatRoom = await chatRoomService.createChatRoom([newUserResult.id, peerUserResult.id]);

  // 3. 批量更新 user 的 room_id
  const userIds = [newUserResult.id, peerUserResult.id];
  const updatedUsers = await userModel.updateManyUserRoomId(userIds, newChatRoom.id);

  if (!updatedUsers) {
    throw new Error(`批量更新使用者聊天室失敗: ${userIds.join(', ')}`);
  }

  return updatedUsers;
}
```

`createUser` 和原本的邏輯差不多，就是組合 `currentTime` 後將資料送給 model。

`createMatchedUsers` 則是整合 `userModel` 與 `chatRoomModel` 的相關操作，先去呼叫 `chatRoomService` 來建立聊天室，再將 id 寫入回到屬於這個聊天室的兩個 user。

:::info  
透過 service 來呼叫其他 service，以達到協調多個 model 操作的目的，也是 service 層的工作。
:::

`chat-room.service.ts`：

```ts
async function createChatRoom(userIds: string[]): Promise<ChatRoomDto> {
  const currentTime = new Date();
  const dto = {
    created_at: currentTime,
    users: userIds,
  };

  const result = await chatRoomModel.createChatRoom(dto);

  if (result === null) {
    throw new Error('建立聊天室失敗');
  }

  return result;
}
```

傳遞給 model 層的 `dto` 會經過 `currentTime`、`userIds` 等新資料的組合，這些邏輯通常也都是在 service 層進行。

分離之後事件也變得簡潔很多，這部分也仰賴一點命名習慣 XD

重新整理過的 `handleMatchSuccess`：

```ts
async function handleMatchSuccess(newUser: WaitingUser, peerUser: WaitingUser) {
  const matchedUsers = await userService.createMatchedUsers(newUser, peerUser);
  const roomId = matchedUsers[0].room_id?.toString() ?? '';

  // 將兩個使用者的 socketId 與 userId 對應起來
  const userSocketMap = [
    { socketId: newUser.socketId, userId: matchedUsers[0].id },
    { socketId: peerUser.socketId, userId: matchedUsers[1].id },
  ];

  await Promise.all(userSocketMap.map((user) => notifyMatchSuccess(user.socketId, user.userId, roomId)));
}

async function notifyMatchSuccess(clientId: string, userId: string, roomId: string) {
  await io.of('/').sockets.get(clientId)?.join(roomId);

  io.to(clientId).emit(MATCH_EVENT.SUCCESS, {
    roomId,
    userId,
  });
}
```

要留意 `matchedUsers` 完成之後，要透過原本的 `socketId` 才能通知到畫面上正在操作的使用者！

---

## 取消配對

取消配對不會讀寫資料庫，只要將特定的 client 從 `waitingPool` 移除，這段邏輯先前在 `addUserToPool` 有實作，可以分離出來，並針對不同事件情境做廣播：

```ts
client.on(MATCH_EVENT.CANCEL, () => {
  handleMatchCancel(client.id);
});

function addUserToPool(newUser: WaitingUser) {
  waitingUsers.push(newUser);
}

function removeUserFromPool(socketId: string) {
  const index = waitingPool.findIndex((user) => user.socketId === socketId);

  if (index === -1) {
    return false;
  }

  waitingPool.splice(index, 1);
  return true;
}

function handleMatchCancel(socketId: string) {
  const hasRemoved = waitingPool.removeUserFromPool(socketId);

  if (hasRemoved) {
    console.log('waitingPool', waitingPool.getPoolUsers());
    io.of('/').sockets.get(socketId)?.emit(MATCH_EVENT.CANCEL);
  }
}
```

在前端新增觸發取消配對 `MATCH_EVENT.CANCEL` 事件的按鈕，看看有沒有收到對應的廣播吧！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1754319031000c3hqt9.png)

---

## 離開配對

要在已配對的狀態下離開，前端必須在觸發事件時傳入 `user_id`，才能去 collection 中更新對應的資料。

這個功能明顯和取消配對不同，需要操作資料庫，所以在一開始應該會有流程判斷上的分歧，因此要再設計一個 `match:leave` 事件：

```ts
// 傳入 userId
client.on(MATCH_EVENT.LEAVE, (userId: string) => {
  handleMatchLeave(userId);
});

async function handleMatchLeave(userId: string) {
  const updatedUser = await userService.updateUserStatus(userId, userStatusSchema.enum.LEFT);

  if (updatedUser.room_id) {
    notifyMatchLeave(updatedUser.room_id.toString());
  }
}

function notifyMatchLeave(roomId: string) {
  io.to(roomId).emit(MATCH_EVENT.LEAVE);
}
```

`user.service.ts`：

```ts
async function findUserById(userId: string): Promise<UserDto> {
  const result = await userModel.findUserById(userId);

  if (result === null) {
    throw new Error(`找不到使用者: ${userId}`);
  }

  return result;
}

async function updateUserStatus(userId: string, status: UserStatus): Promise<UserDto> {
  const user = await findUserById(userId);

  if (!user.room_id) {
    throw new Error(`使用者沒有聊天室: ${userId}`);
  }

  const result = await userModel.updateUserStatus(userId, status);

  if (result === null) {
    throw new Error(`更新使用者狀態失敗: ${userId}`);
  }

  return result;
}
```

這時前面做過的反正規化就伏筆回收（？），因為 `user` 存了 `room_id`，執行 `updateUserStatus` 更新使用者的配對狀態後，就可以拿 `room_id` 對房間廣播「對方~~無情~~離開配對了」！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1754364563000sfexs8.png)

---

## 本日小結

NestJS 都把架構分好好的，只要照它的規則去寫，通常不會寫出太過分的東西（？）。但在 Express 中我從來沒有寫過 service，基本上就真的是 MVC 三層寫到底，model 層會有一大包 XD

所以一邊做我也一邊爬文，更確切地說是在 Cursor 中跟不同模型問答，~~看看誰家的模型在胡說八道~~ 。

---

## 參考資料

- [初學者入門：什麼是「服務」？從軟體設計談起](https://realnewbie.com/basic-concent/beginner-guide-what-is-a-service-in-software-design)
