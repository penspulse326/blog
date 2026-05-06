---
title: 'Day 23 - 獻上一首給愛麗絲！使用排程自動清理資料'
description: 'Cozy Chat 專案第 23 天：獻上一首給愛麗絲！使用排程自動清理資料'
date: '2025-09-24 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day23'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758706257000cupymj.png)

大家有追垃圾車的經驗嗎？無論是《少女的祈禱》還是《給愛麗絲》，我們聽到垃圾車的鈴聲，身體就會自己動起來 XD（並沒有）

這種在某個特定的時間段自動執行例行事項的概念，也在程式語言中存在，就是所謂的排程任務（Cron Job）。

## 基本設定

安裝 `node-cron` 這個套件後，在啟動程序 `bootstrap` 中寫入一個 1 分鐘執行 1 次的排程來測試看看：

```ts
async function bootstrap() {
  cron.schedule('*/1 * * * *', () => {
    console.log('執行測試排程:', new Date().toISOString());
  });
}
await bootstrap();
```

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758652599000y23sxz.png)

就這樣？對......所以理論上可以用 `setInterval` 做到類似的事：

```ts
setInterval(() => {
  console.log('執行測試排程:', new Date().toISOString());
}, 60 * 1000);
```

為什麼說類似呢？因為 `setInterval` 是依靠系統時間來計算的，但排程的時間設定是採用日曆時間的 `cron 表達式`，**最小單位為 1 分鐘**，會讓排程任務在整點觸發，從剛剛的結果也可以看到 log 上的時間，都是在 0 秒時進行的。

---

## 清理資料

服務運行得越久，資料庫也會逐漸膨脹，比較關鍵的資料通常還是會人工調閱之後，再評估要不要洗掉或是其他處置，但其他不重要的資料，就真的可以設定排程，定期拿去垃圾車蛋雕了 XD

接下來就來實作清理資料的排程！

---

## 移除不活躍的使用者

原始的構想是要砍了 90 天內沒有上線使用的使用者，不過測試時間可以先改短一點~~不然我懶得灌假資料~~，本機用 Docker 建起來的 MongoDB 應該有不少資料可以砍 XD

這裡我只列出主要的業務邏輯 service：

```ts
async function removeInactiveUsers(): Promise<void> {
  const users = await userModel.findAllUsers();

  if (users === null) {
    throw new Error(`查詢使用者失敗`);
  }

  const inactiveUserIds = users
    .filter((user) => {
      const lastActiveTime = new Date(user.lastActiveAt).getTime();
      const currentTime = Date.now();
      const inactiveThreshold = 5 * 60 * 1000; // 5 分鐘
      return currentTime - lastActiveTime > inactiveThreshold;
    })
    .map((user) => user.id);

  if (inactiveUserIds.length === 0) {
    return;
  }

  const result = await userModel.removeMany(inactiveUserIds);

  if (!result) {
    throw new Error(`移除不活躍使用者失敗: ${inactiveUserIds.join(', ')}`);
  }
}
```

然後新增 `src/jobs/remove-inactive-user.ts`，排程是蠻重要的程序，最好寫個註解標記一下，週期也可以設短一點，我同樣先設定 1 分鐘測試看看：

```ts
// 移除不活躍的使用者
export function setupRemoveInactiveUserJob() {
  cron.schedule('*/1 * * * *', async () => {
    console.log('執行移除不活躍使用者:', new Date().toISOString());

    try {
      await userService.removeInactiveUsers();
    } catch (error) {
      console.error('移除不活躍使用者失敗:', error);
    }
  });
}
```

排程任務通常會有好幾個要跑，這種類似的方法集合，我習慣統一執行或匯出，所以同目錄下再新增一個 `index.ts`：

```ts
import cron from 'node-cron';

import { setupRemoveInactiveUserJob } from './remove-inactive-user';

export function setupCronJobs() {
  cron.schedule('*/10 * * * *', () => {
    console.log('測試排程:', new Date().toISOString());
  });

  setupRemoveInactiveUserJob();
}
```

現在可以啟動本機伺服器來試試看：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758683248000x1gduy.png)

可以看到第一次的排程有執行到刪除，這時本機的使用者應該都清空了，後面就沒有刪除成功的 log，到此就完成第一個清理資料的排程設計啦！

---

## 移除聊天室

剛剛 service 的設計，邏輯上看起來沒什麼問題，但實際上會造成與使用者關聯的 collection 一些查詢的困擾，~~雖然你也可以說是我資料設計得很爛~~。

```ts
export const chatRoomDtoSchema = z.object({
  createdAt: z.date(),
  id: z.string(),
  users: z.array(z.string()),
});
```

像是 `chat_rooms` 的資料格式會用陣列存 `userId`，陣列長度固定為 2，但是要先搜尋陣列中的使用者是否被移除或是標記為 `LEFT`，並且最後要判斷是否兩個使用者都是此狀況，光用想的就很繁瑣 XD

所以流程需要調整！

在剛剛實作的 `removeInactiveUsers` 中先過濾出不活躍的使用者清單，再透過 DTO 中的 `roomId` 去找到對應的聊天室資料，並將該使用者從 `users` 這個陣列中移除。

這樣就只要經過長度檢查的判斷並**移除 `users` 長度低於 2 的聊天室**。

在 `chat-room.service.ts` 加入新的業務邏輯 `removeUserFromChatRoom`：

```ts
async function removeUserFromChatRoom(roomId: string, userId: string): Promise<ChatRoomDto> {
  const result = await chatRoomModel.removeUserFromChatRoom(roomId, userId);

  if (result === null) {
    throw new Error(`從聊天室移除使用者失敗: ${userId}`);
  }

  return result;
}
```

在 `removeInactiveUsers` 中呼叫這個方法，多開幾個聊天室後就可以去泡咖啡了（？），再回來看看排程有沒有正常執行：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17586935590007s69ei.png)

最後再實作移除聊天室的邏輯：

```ts
async function removeEmptyChatRooms(): Promise<void> {
  const chatRooms = await chatRoomModel.findAllChatRooms();

  if (chatRooms === null) {
    throw new Error('查詢聊天室失敗');
  }

  const emptyChatRoomIds = chatRooms.filter((room) => room.users.length < 2).map((room) => room.id);

  if (emptyChatRoomIds.length === 0) {
    return;
  }

  const result = await chatRoomModel.removeMany(emptyChatRoomIds);

  if (!result) {
    throw new Error(`刪除聊天室失敗: ${emptyChatRoomIds.join(', ')}`);
  }
}
```

新增排程來觀察是否有生效！

```ts
export function setupCronJobs() {
  cron.schedule('*/10 * * * *', () => {
    console.log('測試排程:', new Date().toISOString());
  });

  // 移除不活躍的使用者
  setupRemoveInactiveUsers();

  // 移除空的聊天室
  setupRemoveEmptyRoomsJob();
}
```

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758695489000haskm7.png)

---

## 移除聊天訊息

一個聊天室的訊息可能會有上千上萬筆，只要你敢聊......所以這裡要注意，剛剛在移除使用者和聊天室雖然都是用 `findAll` 去撈全部的資料再過濾出目標。

但是聊天訊息的量體可能會很大了！所以我想把移除聊天訊息的工作掛在移除聊天室的流程，在 `chat-message.service.ts` 新增：

```ts
async function removeManyByRoomIds(roomIds: string[]): Promise<void> {
  const result = await chatMessageModel.removeManyByRoomIds(roomIds);

  if (!result) {
    throw new Error(`刪除聊天室訊息失敗: ${roomIds.join(', ')}`);
  }
}
```

在 `removeEmptyChatRooms` 中利用過濾好的 `emptyChatRoomIds` 找到該聊天室的訊息並批量刪除：

```ts
async function removeEmptyChatRooms(): Promise<void> {
  // 略

  // 移除聊天室中的所有訊息
  await chatMessageService.removeManyByRoomIds(emptyChatRoomIds);

  // 移除聊天室
  const result = await chatRoomModel.removeMany(emptyChatRoomIds);

  if (!result) {
    throw new Error(`刪除聊天室失敗: ${emptyChatRoomIds.join(', ')}`);
  }
}
```

最後啟動伺服器觀察排程執行：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758701833000rjdtnx.png)

在本機做完，當然也要測試一下線上的環境！Render 的終端如果也有執行排程，就算成功了：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17587028260001ekgck.png)

---

## 協調排程

剛剛設定的排程週期確認沒問題後可以先改為每天 1 次、半夜 3 點執行，避免服務過載，~~畢竟是免費仔~~。

移除使用者和移除聊天室都會操作到聊天室的 collection，但排程是會並行啟動的，設在同一個時間會造成衝突（race condition）。

這可能會導致聊天室對 `users` 陣列長度的檢查先執行了，爾後移除使用者時才去更新對應聊天室的 `users`，造成這筆資料沒有被檢查到，所以移除聊天室的任務可以推遲 1 分鐘：

```ts
export function setupRemoveInactiveUsers() {
  cron.schedule('0 3 * * *', async () => {
```

```ts
export function setupRemoveEmptyRooms() {
  cron.schedule('1 3 * * *', async () => {
```

或是整合成一個比較長的排程，透過非同步的方式來保證資料操作的順序：

```ts
export function setupRemoveExpiredDocuments() {
  cron.schedule('0 3 * * *', async () => {
    console.log('排程：移除不活躍使用者:', new Date().toISOString());

    try {
      await userService.removeInactiveUsers();
    } catch (error) {
      console.error('移除不活躍使用者失敗:', error);
    }

    console.log('排程：移除空聊天室:', new Date().toISOString());

    try {
      await chatRoomService.removeEmptyChatRooms();
    } catch (error) {
      console.error('移除空聊天室失敗:', error);
    }
  });
}
```

---

## 保持喚醒

PaaS 雖然部署方便，不過天下沒有白吃的午餐！大部分的服務都有冷啟動的機制，如果一定時間沒有接收到外部請求，服務就會暫時停止，直到再次收到的時候才會進行喚醒。

這也是為什麼過一段時間之後想要開起來 demo 給別人看時，會特別慢或是直接跳 500 ~~大翻車~~的原因！而這樣會導致我們剛剛寫的所有排程任務都失效，因為這是在 Node.js 主程式內部執行的程序，並不算是外部請求。

從 Render 的終端也可以看到，只要進行過冷啟動或重新部署，中間的代號也會更換：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758704511000u15i9x.png)

這時候又有免費午餐（？）可以吃了，線上也有免費的排程服務可以定時發出請求！這裡我使用 [cron-job.org](https://cron-job.org/en/)。

先回到啟動點新增一個路由 `/health`：

```ts
app.get('/health', () => {
  console.log('健康檢查');
  return 'OK';
});
```

然後將 Render 的 URL 加上這個路由，填入 cron-job.org 的表單：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758705359000cvcpz2.png)

（~~熟悉的 MUI~~）

正式啟動排程之前也可以先按 TEST RUN，如果成功的話，排程就沒什麼問題了！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758705278000071ioa.png)

---

## 本日小結

今天嘗試了一些基礎的排程設定，我覺得算是程式中蠻好玩的一環，畢竟自動清垃圾對我這種有點潔癖的人是很舒服的（？）。

而目前正紅的 n8n 也是類似的概念，自訂各種服務的排程事件，形成自動化的工作流！

不過清理資料的排程在操作上要非常小心，像是剛剛說到的 race condition，或是資料量體過大導致 I/O 失敗等等，雖然這些問題在資料庫程式中都有對應的解決方案，或是把機器規格升級升爆，但仍然需要注意排程的設計，否則輕則程序崩潰，重則一邊復原備份一邊跪下來跟客戶謝罪 XD

---

## 參考資料

- [Cron 是什麼？定時任務的語法怎麼寫？](https://kucw.io/blog/cron/)
- [Demo 的時候機子睡著好尷尬怎麼辦？用 UptimeRobot 或 cron-job.org 來幫你吧！](https://israynotarray.com/other/20230518/2131851751/)
