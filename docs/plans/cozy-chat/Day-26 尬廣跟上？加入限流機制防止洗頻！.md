---
title: 'Day 26 - 尬廣跟上？加入限流機制防止洗頻！'
description: 'Cozy Chat 專案第 26 天：尬廣跟上？加入限流機制防止洗頻！'
date: '2025-09-27 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day26'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17589877640003x0877.png)

~~蛤啦？說話啊？啞吧哦？沒廣了哦哈哈洗洗睡吧 Zz~~

在介面操作上，任何會去戳 API 的行為，都應該留意需不需要限流，這也常被做為經典考古題：**Debounce & Throttle**（防抖與節流）！

沒有這些限流機制的話，我們這些免費仔的流量可能在 demo 的途中就不小心撞到上限，慘遭停機 QQ

如果不是免費仔，又沒有設定計費上限，那就會收到一張讓你笑著哭的帳單啦！

所以至少我們在 side project 的實作上，可以試著做做看一些基礎防護～

## 功能分析

聊天室比較注重發送訊息的即時回饋感，如果前端每一次送出訊息時都要卡，操作體驗可能會稍微不順，所以主要的限流邏輯我打算在後端實作。

流程：

1. 前端發送訊息
2. 後端接收訊息後先進行計時檢查
3. 計時檢查通過就允許發送訊息，檢查不通過再向前端發起限流警告事件
4. 前端收到限流警告後設定狀態轉移
5. 子元件收到狀態轉移後顯示警告給使用者，並卡住輸入框

---

## 後端

新增存放計時器的容器 `timerMap` 與檢查的方法 `checkMessageRate`：

```ts
// createChatHandler
export type ChatTimer = {
  count: number;
  isBlocked: boolean;
  startTime: number;
};

const timerMap = new Map<string, ChatTimer>();

function checkMessageRate(userId: string, roomId: string) {
  if (!timer) {
    timerMap.set(userId, {
      count: 1,
      isBlocked: false,
      startTime: Date.now(),
    });

    return true;
  }

  if (timer.isBlocked) {
    return false;
  }

  const timeDiff = Date.now() - timer.startTime;

  // 超過 2 秒就重置
  if (timeDiff >= 2000) {
    timer.count = 1;
    timer.startTime = Date.now();
    return true;
  }

  // 2 秒內發了 5 則訊息就限流
  if (timeDiff < 2000 && timer.count >= 5) {
    timer.isBlocked = true;
    io.to(roomId).emit(CHAT_EVENT.BLOCK, { error: 'Too many messages', userId });

    // 限流 10 秒後解除
    setTimeout(() => {
      timerMap.delete(userId);
      io.to(roomId).emit(CHAT_EVENT.UNBLOCK, { userId });
    }, 10000);

    return false;
  }

  // 在 2 秒內但不到 5 則訊息，則計數加 1 次
  timer.count++;

  return true;
}

async function handleChatSend(data: SocketChatMessage) {
  // 先檢查使用者的發送狀況
  if (!checkMessageRate(data.userId, data.roomId)) {
    console.log('isBlocked', data.userId);
    return;
  }

  const newChatMessage = await chatMessageService.sendChatMessage(data);

  io.to(data.roomId).emit(CHAT_EVENT.SEND, newChatMessage);
}
```

最主要的判斷點是：

1. 每次訊息間隔超過 2 秒 => 超過則重置計時與計次
2. 2 秒內達 5 則訊息 => 到達則開始限流
3. 計數加 1 次

因為是一對一聊天室，我設定的限流條件 2 秒 5 次算是比較寬鬆，只用來防止一些極端狀況，例如貓皇踩鍵盤、口袋裡的手機、只會打哈哈一直打哈哈的哈哈人等等。

要留意的是先前在撰寫單元測試時我將幾個主要功能的事件重構成各個 handler：

```ts
export function setupSocketServer(io: Server) {
  const waitingPool = createWaitingPool();
  const chatHandlers = createChatHandlers(io);
  const matchHandlers = createMatchHandlers(io, waitingPool);
  const userHandlers = createUserHandlers(io, chatHandlers);

  io.on('connection', (client: Socket) => {
```

所以在 `chatHandlers` 中只能拿到 `io` 實例，並不能存取到 `client`，不過這也比較符合我想要的模式，讓使用者的資訊和 socket 實例本身解耦。

發送訊息時也會帶上 `userId` 和 `roomId`，所以事件處理也是簡單粗暴 XD 透過 `io.to(roomId)` 指向聊天室並帶上 `userId`， 讓前端收到時比對要對哪位使用者發出警告即可：

```ts
//　限流
io.to(roomId).emit(CHAT_EVENT.BLOCK, { error: 'Too many messages', userId });

// 解除限流
io.to(roomId).emit(CHAT_EVENT.UNBLOCK, { userId });
```

成功的話前端就可以先試著洗頻，看後端的 log 有沒有顯示觸發限流：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758985018000v965p6.png)

蛤後端的邏輯就這樣而已嗎？對......只是限流要經過的判斷稍微多一點，所以寫的過程不一定會很順利，我自己一開始就漏掉最基本的 `if(isBlocked)`，結果在前端測試的時候發現被限流還是能傳訊息 XDDD

所以說先寫測試還是有好處的（？

---

## 前端

如前面所說，前端這邊就不特別對介面操作設定時間限制。

新增限流狀態和對應事件：

```ts
const [isBlocked, setIsBlocked] = useState(false);

function handleMessageBlock(data: unknown) {
  const blockData = data as { error: string; userId: string };

  console.log(blockData.error);

  if (blockData.userId === userId) {
    setIsBlocked(true);
  }
}

function handleMessageUnblock(data: unknown) {
  const unblockData = data as { userId: string };
  if (unblockData.userId === userId) {
    setIsBlocked(false);
  }
}
```

前端也是因為單元測試的關係，將建立 socket 實例的管理分離到 `useSocket` 了，所以外部設計的事件所接收到的 `data` 要斷言型別。

不過這其實應該要在定義 `useSocket` 的時候將每個事件名稱和 `data` 都列舉出來，因為這些事件都是我們自己設計的，本來就應該嚴格限制這些參數的型別：

```ts
export interface SocketInstance {
  connect: (options?: UseSocketOptions) => void;
  disconnect: () => void; // emit 和 on 的 event 和 data 應該指定集合

  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => void;

  isConnected: () => boolean;
}
```

~~看到了吧交給 AI 寫然後自己還懶得檢查就會變這樣。~~

狀態轉移會在 `handleMessageBlock` 和 `handleMessageUnblock` 裡面處理，所以只要把 `isBlocked` 暴露出去就好。

在 `page.tsx` 接收到之後，除了傳遞給訊息盒與輸入框，`useEffect` 也要將 `isBlocked` 加入依賴項目，後續在訊息盒新增警告提示而增加容器高度的時候，才會觸發滾動，否則~~洗頻仔~~使用者會因為沒有看到警告提示而感到茫然：

```tsx
  const {
    matchStatus,
    setMatchStatus,
    messages,
    sendMessage,
    readMessage,
    isBlocked, // 限流狀態
  } = useMatch();

  useEffect(() => {
    handleScrollToBottom();
  }, [matchStatus, messages, isBlocked]);

  <ChatBox
    userId={userId}
    messages={messages}
    matchStatus={matchStatus}
    isBlocked={isBlocked}
    onRead={readMessage}
  />

<ChatActionBar
  matchStatus={matchStatus}
  isBlocked={isBlocked}
  onLeave={() => setMatchStatus('quit')}
  onSend={sendMessage}
/>
```

在訊息盒中使用條件渲染新增警告提示：

```tsx
{
  isBlocked && <Text className={styles.chatBoxAlert}>短時間內發送訊息過多，請稍後再試</Text>;
}
```

輸入框也在 `disabled` 中新增對 `isBlocked` 的判斷：

```tsx
<Input
  value={message}
  disabled={matchStatus !== 'matched' || isBlocked}
  onChange={(e) => setMessage(e.target.value)}
/>
<Button
  disabled={matchStatus !== 'matched' || isBlocked}
  onClick={handleSendMessage}
  classNames={{ root: styles.sendButtonRoot }}
>
  送出
</Button>
```

最後來實測警告提示與輸入框的狀態吧！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758984621000vp2k73.png)

收到警告後 10 秒應該會解除限流，這段期間請做一個深呼吸，然後發誓不要再洗頻，~~不然人家真的會被嚇跑~~：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758984654000ylghv3.png)

---

## 本日小結

今天的限流功能，概念上比較偏向節流，是 `限制一段時間內操作的執行次數`。

防抖是 `在連續操作結束後一定段時間內沒有再操作，則執行一次操作`，例如手 1 秒抖 6 下，按了 6 次送出，只會在抖完的 N 秒後去打 1 次 API。所以防抖會限制使用者在每一次的操作中保持一定時間的間隔，

另外還有一種容易混淆的概念是**狀態鎖**，像是在執行報表匯出的時候，這類 API 的請求都會比較晚收到回應，所以前端需要設一個 `isLoading` 或 `isFetching` 之類的狀態綁定，在按鈕的 `disabled`，防止後端伺服器和資料庫被報表計算刷到崩潰。

| 方法     | 防抖                         | 節流                         | 狀態鎖                             |
| -------- | ---------------------------- | ---------------------------- | ---------------------------------- |
| 概念     | 一段時間沒有再操作則執行一次 | 限制一段時間內操作的執行次數 | 防止重複操作的併發                 |
| 限制時間 | 自訂                         | 自訂                         | 自訂，但通常會等收到回應才解除狀態 |

---

## 參考資料

- [從動圖輕鬆解題：防抖與節流](https://www.webdong.dev/zh-tw/post/learn-debounce-and-throttle/#%E7%AF%80%E6%B5%81-throttle)
