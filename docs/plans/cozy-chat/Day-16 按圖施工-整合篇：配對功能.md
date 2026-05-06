---
title: 'Day 16 - 按圖施工-整合篇：配對功能'
description: 'Cozy Chat 專案第 16 天：按圖施工-整合篇：配對功能'
date: '2025-09-17 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day16'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758077395000i37za7.png)

終於來到 MVP 的最後一關！

接下來要整合實作好的後端功能，把在 `index.html` 確認過的事件流程搬過來。

:::warning  
`index.html` 是透過 CDN 載入 Socket.IO 套件，換到前端專案要安裝 `socket.io-client` 。
:::

## custom hook

配對狀態原本是放在首頁 `page.tsx`，要先做初步分離，做好業務邏輯的切割。

本身不是元件但是有狀態管理功能，就代表這可以設計成一個 custom hook！ 並且可以將 Socket.IO 的事件整合進來。

先釐清這個 hook 的條件限制：

1. socket client 實例必須持久化，不能因為 re-render 就被刷新（用 ref 存起來）
2. 使用者的操作會觸發 `matchStatus` 的狀態變化
3. 使用者會在「按下開始聊天」後才建立連線

當中的核心邏輯就是：

> 使用者的操作改變 `matchStatus` 並觸發對應的事件。

所以......是 `useEffect` 登場的時候了，基本架構大概是：

```ts
function useMatch() {
  const socketRef = useRef<Socket | null>(null);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('standby');

  function connectSocket() {
    // socket 宣告後就會啟動連線
    socketRef.current = io('http://localhost:8080');

    // 連線後即觸發配對請求
    socketRef.current.on('connect', () => {
      startMatch();
    });
  }

  function startMatch() {
    socketRef.current?.emit(MATCH_EVENT.START, 'PC');
  }

  useEffect(() => {
    switch (matchStatus) {
      case 'waiting':
        connect();
        break;

      default:
        break;
    }
  }, [matchStatus]);

  return { matchStatus, setMatchStatus };
}
```

如果先前沒有在後端的 `index.html` 試驗過整個連線流程，寫起來多少還是蠻抽象的！照著剛剛梳理出來的項目，應該不會就寫得太卡！

`matchStatus` 最後會有這些，先列出來方便釐清：

```ts
export type MatchStatus = 'standby' | 'waiting' | 'matched' | 'error' | 'left' | 'quit' | 'reloading';
```

## 連線設定

先替換 `page.tsx` 的 `setMatchStatus`，試試看能不能連線。

接著會發現後端完全沒有連線後的 log，前端這裡則是顯示了幾個 error：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17545468370007w21xo.png)

這是因為後端沒有任何跨域設定，而且很常使用的 `cors` 套件，只對 HTTP 協定生效，Socket.IO 的部分要自行設定：

```ts
async function bootstrap() {
  const url =
    process.env.ENV === 'production'
      ? 'https://cozychat.com'
      : 'http://localhost:3000';

  try {
    await connectToDB();

    createSocketServer(
      new Server(server, {
        cors: {
          credentials: true,
          methods: ['GET', 'POST'],
          origin: url,
        },
      })
    );
```

調整好之後前端應該能正常連線了！

接下來的做法都與後端的 Socket.IO 事件實作類似，在初始化時掛上各個事件的監聽和對應的行為。但是要留意每個事件在前後端的差異，要以 `emit` 發出還是以 `on` 接收。

---

## 配對成功

可以先用 `console.log` 看看配對成功後接收到的資料是否有預期的 `roomId` 與 `userId`，再存入 `localStorage`：

```ts
function connectSocket() {
  // 略

  // 連線
  socketRef.current.on(MATCH_EVENT.SUCCESS, (data: MatchSuccessData) => {
    console.log(data);
    handleMatchSuccess(data);
  });
}

function handleMatchSuccess(data: MatchSuccessData) {
  localStorage.setItem('roomId', data.roomId);
  localStorage.setItem('userId', data.userId);
  setMatchStatus('matched');
}
```

狀態轉移到 `'matched'` 後只有 UI 呈現會變動，所以 `useEffect` 還不用偵測這個狀態。

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1754553355000n3ul7d.png)

---

## 取消配對

使用者按下離開按鈕時包含了「取消配對」和「離開配對」的情境，因此前端要判斷目前是基於哪種情境按下離開。

我新增 `'quit'` 這個狀態，離開按鈕按下時執行 `setMatchStatus('quit')`，再配合 `useEffect` 和 `switch` 分流處理。

```ts
useEffect(() => {
  switch (matchStatus) {
    case 'waiting':
      connectSocket();
      break;
    // 新增 'quit'
    case 'quit':
      quitMatch();
      break;
    default:
      break;
  }
}, [matchStatus]);
```

只要 `roomId` 和 `userId` 任一值為空，就當作是「未配對」，並執行取消配對的事件，最後再將 `matchStatus` 轉移到 `'standby'`：

```ts
function quitMatch() {
  const roomId = localStorage.getItem('roomId');
  const userId = localStorage.getItem('userId');

  if (!roomId || !userId) {
    cancelMatch();
    return;
  }
}

function cancelMatch() {
  socketRef.current?.emit(MATCH_EVENT.CANCEL);
  setMatchStatus('standby');
}

function disconnectSocket() {
  socketRef.current?.disconnect();
  socketRef.current = null;
}
```

在 `useEffect` 新增 `'standby'` 的判斷，進行斷線 `disconnectSocket`。

取消配對是由前端 `emit` 出 `MATCH_EVENT.CANCEL` 事件後自行斷線，後端只需要在 `disconnect` 事件中從 `waitingPool` 移除該 client 就算取消配對了：

```ts
// 後端
client.on('disconnect', () => {
  removeUserFromPool(client.id);
  console.log('使用者斷開連線:', client.id);
});
```

---

## 離開配對

前端 `emit` 出 `MATCH_EVENT.LEAVE` 事件後，要移除 `localStorage` 存的資料再轉移狀態：

```tsx
function leaveMatch(userId: string) {
  localStorage.removeItem('roomId');
  localStorage.removeItem('userId');
  socketRef.current?.emit(MATCH_EVENT.LEAVE, userId);
  setMatchStatus('standby');
}

function quitMatch() {
  const roomId = localStorage.getItem('roomId');
  const userId = localStorage.getItem('userId');

  if (!roomId || !userId) {
    cancelMatch();
    return;
  }

  leaveMatch(userId);
}
```

後端接收到 `MATCH_EVENT.LEAVE` 事件後，會再對房間發起同名的事件，這是之前寫好的：

```ts
// 後端邏輯
function notifyMatchLeave(roomId: string) {
  io.to(roomId).emit(MATCH_EVENT.LEAVE);
}
```

前端除了 `emit`，也要 `on` 這個事件來進行狀態轉移，如果怕混淆的話多命名一個新的事件也可以。這邊新增狀態 `'left'`，表示房間內其中一個人離開了：

```ts
socketRef.current.on(MATCH_EVENT.LEAVE, () => {
  setMatchStatus('left');
});
```

在前端顯示對應的訊息：

```tsx
// ChatBox.tsx
{
  matchStatus === 'left' && <Text>對方已離開</Text>;
}
```

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/175498286000099oq6q.png)

---

## 本日小結

後端比較單純，都是針對各個事件進行 I/O。前端這邊要負責比較多判斷，要明確地劃分出使用者的每個操作所觸發的狀態轉移。

架構上當然可以再優化，例如 socket client 全域只有一個實例，所以可以考慮抽象成 context，`matchStatus` 需要跨元件使用，也有機會被抽到 context。

個人認為開發上要盡量維持 KISS 的原則，現在的元件架構跟資料流是扁平的，並沒有 props drilling 或是狀態管理的問題。所以不需要過早優化（~~絕對不是因為不會用 `useContext`~~）。
但是抽出來也沒什麼不對，因為這些 hook 也有語意化的作用，設置也不算複雜。

「預防可能會發生的問題」與「不要解決不存在的問題」之間的平衡點，自己有衡量的標準就好 XD
