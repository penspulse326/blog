---
title: 'Day 25 - 強化體驗：為什麼已讀不回 QAQ'
description: 'Cozy Chat 專案第 25 天：強化體驗：為什麼已讀不回 QAQ'
date: '2025-09-26 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day25'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17588745020001wmw1t.png)

你以為看到對方幾分鐘、幾小時前的訊息就夠焦慮了嗎？

不......還有更焦慮的，就是曾經困擾廣大網友們的「已讀」^O^

## 功能分析

經過之前的 MVP 實作，我們可以知道，即時聊天的流程其實和一般 RESTful API 是差不多的。

假設目前要做一個靜態留言板：

1. 前端的使用者留言，觸發新增留言的 API
2. 後端接收到請求，將留言新增到資料庫
3. 前端接收 API 回應後再打 GET 刷新留言（或是回應有帶資料，可以直接刷新）
4. 前端將新留言更新到畫面上（但是其他人仍然要重整頁面才會看到新訊息）

聊天室的邏輯只是把 API 換成了 Socket.IO 的事件，而後端的回應從一對一變成廣播，其他前端也不再需要重整，所以已讀功能的實作，實際上還算單純！

後端會在聊天訊息新增 `isRead` 這個欄位，再逐步加上 model、service、socket 事件的收發。

前端可以用 `IntersectionObserver` 這個 Web API 來偵測訊息元件在畫面上的可見程度，來判斷是否已讀。

---

## 後端

在 `chat-message.service.ts` 新增方法：

```ts
async function markAsRead(messageId: string): Promise<ChatMessageDto> {
  const updatedMessage = await chatMessageModel.updateChatMessage(messageId, {
    isRead: true,
  });

  if (!updatedMessage) {
    throw new Error('更新聊天訊息失敗');
  }

  return updatedMessage;
}
```

這邊沒有做特別的檢查是因為前端也會先檢查「是不是別人的訊息」才決定是否觸發這個事件（~~除非前端不是我自己寫的~~）。比較嚴謹的做法也可以考慮進行檢查，只有該聊天室的人以及 `userId` 不等於該則訊息才可以改寫資料。

新增事件 `CHAT_EVENT.READ` 的對應行為 `handleChatRead`。更新已讀狀態成功的話（沒有被 `Error` 中斷）就會對聊天室 `emit` 這個事件 `CHAT_EVENT.READ`並帶上更新後的聊天訊息：

```ts
// createChatHandler
async function handleChatRead(messageId: string) {
  const updatedMessage = await chatMessageService.markAsRead(messageId);

  io.to(updatedMessage.roomId).emit(CHAT_EVENT.READ, updatedMessage);
}

// socket
client.on(CHAT_EVENT.READ, (messageId: string) => {
  void chatHandlers.handleChatRead(messageId);
});
```

當然，不要忘記為這些新的函式做單元測試！這邊就不列出每個模組的詳細測試內容了 XD

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758857875000gnntvr.png)

經過測試後已經有基本的運作保障，接下來進行前端的實作！

---

## 前端

在 `useMatch` 新增 `CHAT_EVENT.READ` 的監聽，這個功能和後端是對應的，後端有 `emit` 也有 `on`，那麼前端一定也有，一端的 `emit` 會對應到一端的 `on`：

```ts
// useMatch
function readMessage(messageId: string) {
  socket.emit(CHAT_EVENT.READ, messageId);
}

function handleMessageRead(data: unknown) {
  const updatedMessage = data as ChatMessageDto;

  setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)));
}

function setupSocketEvents() {
  socket.on(MATCH_EVENT.SUCCESS, handleMatchSuccess);
  socket.on(MATCH_EVENT.LEAVE, handleMatchLeave);
  socket.on(CHAT_EVENT.SEND, handleMessageReceive);
  socket.on(CHAT_EVENT.LOAD, handleMessagesLoad);
  socket.on(CHAT_EVENT.READ, handleMessageRead);
}
```

執行 `setMessages` 的時候只要更新同一則訊息即可。

把 `readMessage` 一路傳到 `ChatMessageCard`，先調整好型別和 JSX：

```tsx
interface MessageContentProps {
  data: ChatMessageDto;
  isUser: boolean;
  onRead: (id: string) => void;
}

{
  isUser ? <Text size="xs"> {isRead ? '已讀' : '未讀'}</Text> : <Text size="xs">{DeviceEnum[device]}</Text>;
}
```

接下來就是重頭戲了！

偵測已讀要先捕捉到 DOM 才能掛上監聽，所以這會是一個 `useEffect`，如果不是自己的訊息就可以掛上 `IntersectionObserver` 並傳入要觸發的 callback：

```ts
useEffect(() => {
  if (!messageRef.current || isUser || isRead) {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        onRead(id);
        observer.disconnect();
      }
    },
    { threshold: 0.8 },
  );

  observer.observe(messageRef.current);

  return () => observer.disconnect();
}, [id, isRead, isUser, onRead]);
```

`entry` 代表偵測的結果，主要用來偵測指定元素與 viewport、特定容器的交集狀態。

在這個 callback 中拿了 `entry.isIntersecting` 判斷元素的可視狀態，`threshold` 代表只要 80% 的部分都在 viewport 裡面就算是有交集，就可以執行已讀 `onRead`。建立偵測器的實例後就可以將指定元素傳入 `observer.observe`，開始進行監聽。

只要瀏覽器不在這個分頁或是縮小了，這個 API 會判定為不可視，`isIntersecting` 會是 `false`，所以不用擔心掛機也被當成已讀！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758865510000fmwkp2.png)

~~當然你也可以等對方氣到亂打字再已讀 XD~~

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17588658170003ww6cq.png)

Mantine 也有提供這個 Web API 的 hook，可以嘗試替換掉原本的邏輯，好用一直用（？）：

```ts
const { ref, entry } = useIntersection({
  threshold: 0.8,
});

useEffect(() => {
  if (!entry?.isIntersecting || isUser || isRead) {
    return;
  }

  onRead(id);
}, [id, isRead, isUser, onRead, entry]);
```

---

## 本日小結

實作完之後發現已讀功能比我想像中簡單，只要清楚 socket 事件與資料進出的流程，邏輯算是不難串，前端再設計 socket 事件與改變訊息狀態的觸發時機。而這個時機就由 `IntersectionObserver` 來決定，偵測到新的訊息進到可視範圍，就將更新訊息的請求發出。

:::warning  
溫馨提醒：不要在乎有沒有已讀或什麼時候已讀，閒閒沒事就快去忙自己的事！~~比起已讀不回我比較痛恨不讀不回。~~
:::

---

## 參考資料

- [use-intersection](https://mantine.dev/hooks/use-intersection/)
- [超好用的 Web API - Intersection Observer](https://jim1105.coderbridge.io/2022/07/30/intersection-observer/)
