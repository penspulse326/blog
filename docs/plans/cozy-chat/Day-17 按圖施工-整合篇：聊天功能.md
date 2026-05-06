---
title: 'Day 17 - 按圖施工-整合篇：聊天功能'
description: 'Cozy Chat 專案第 17 天：按圖施工-整合篇：聊天功能'
date: '2025-09-18 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day17'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758129486000q34cql.png)

聊天功能來了！這部分開發完成後，本機端就差不多可以運行所有的核心功能了。

---

## 收發訊息

一樣讓 `on` 和 `emit` 驅動這個事件 `CHAT_EVENT.SEND`：

```ts
function connectSocket() {
  // 收訊息
  socketRef.current.on(CHAT_EVENT.SEND, (data: ChatMessage) => {
    setMessages((prev) => [...prev, data]);
  });
}

// 發訊息
function sendMessage(content: string) {
  socketRef.current?.emit(CHAT_EVENT.SEND, {
    roomId: localStorage.getItem('roomId'),
    userId: localStorage.getItem('userId'),
    content,
  });
}
```

`ChatBox` 的設計是從 `props` 傳入 `userId`，所以需要在它上層的 `page.tsx` 拿到：

```ts
export default function Home() {
  const userId = localStorage.getItem('userId');
```

接著試試看發送訊息，就會得到 Next 精美的報錯：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1755144960000hg8fe8.png)

這是因為即使在檔案開頭標記 `'use client'`，程式碼還是會在 hydration 階段執行一次，而 server 端是無法存取 `localStorage` 的，因此這段變數宣告會失敗。

如果要執行這段邏輯，則需要用 `useState` 或 `useEffect` 這些 hook 來延後 `localStorage` 存取的時間。

Mantine 很好心地設計了 `useLocalStorage` 這個 hook，直接整合到 `useMatch` 吧：

```ts
const [userId, setUserId, removeUserId] = useLocalStorage<string | null>({
  key: 'userId',
  defaultValue: null,
});

const [roomId, setRoomId, removeRoomId] = useLocalStorage<string | null>({
  key: 'roomId',
  defaultValue: null,
});
```

成功！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1755151100000at6xe7.png)

記得在離開配對時清空 `messages`，否則重新配對時，會跑出之前的訊息：

```ts
function emitMatchLeave(userId: string) {
  socketRef.current?.emit(MATCH_EVENT.LEAVE, userId);
  removeUserId();
  removeRoomId();
  setMessages([]); // 清空 messages
  setMatchStatus('standby');
}
```

---

## 保持配對狀態

這邊需要新增一個狀態 `'reloading'`，搭配 `useEffect`，在剛載入網站時檢查使用者的瀏覽器是否存有 `roomId`，有就將狀態轉移到 `reloading`，再繼續觸發下一個 effect：

```ts
useEffect(() => {
  if (roomId && matchStatus === 'standby') {
    setMatchStatus('reloading');
  }
}, [roomId]);

useEffect(() => {
  switch (matchStatus) {
    case 'standby':
      disconnectSocket();
      break;
    case 'waiting':
      connectSocket();
      break;
    case 'reloading':
      connectSocket();
      break;
    case 'quit':
      quitMatch();
      break;
    default:
      break;
  }
}, [matchStatus]);
```

所以現在除了按下 「開始聊天」之外，`'reloading'` 狀態也會執行 `connectSocket` 來建立連線。

`connect` 事件要加入對 `roomId` 進行判斷，有值代表使用者並沒有按過「離開」，狀態就可以從 `reloading` 轉移到 `'matched'`，讓「開始聊天」按鈕隱藏並重新呈現聊天介面：

```ts
function connectSocket() {
  socketRef.current = io('http://localhost:8080', {
    // 建立連線時帶入 roomId
    query: {
      roomId,
    },
  });

  socketRef.current.on('connect', () => {
    if (!roomId) {
      startMatch();
    } else {
      // 有 roomId 時就將狀態轉移到 'matched'
      setMatchStatus('matched');
    }
  });
}
```

監聽 `CHAT_EVENT.LOAD` 事件，並更新 `messages`：

```ts
socket.on(CHAT_EVENT.LOAD, (data: ChatMessageDto[]) => {
  setMessages(data);
});
```

大功告成！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1755164760000k0li46.png)

## 加入音效

雖然核心功能到這邊已經差不多，但是使用上還少了一點回饋......那就是酷酷的音效！

在試過 YouTube 和幾個素材網站後，最後我找到了[効果音ラボ](https://soundeffect-lab.info/)這個網站，標題也直接載明是免費自由使用，我們可以安心載下來：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758092811000vtlht2.png)

接下來要決定在什麼地方觸發這個音效：

1. `ChatBox`（聊天訊息容器）
2. `useMatch`
3. `page.tsx`

最後我選擇在 `useMatch`，因為播放音效算是一種 side effect，由 `useMatch` 這個核心邏輯的源頭來管理比較直覺。

`page.tsx` 都是 `ChatBox` 以管理、顯示畫面為主的邏輯，在沒有設計任何 custom hook 的時候我的確會考慮掛在這些元件上面。

新增一個 `ref` 和 `useEffect`，在初次渲染時從 `/public/new-msg-hint.mp3` 把音效檔讀進來：

```ts
const newMsgAudioRef = useRef<HTMLAudioElement | null>(null);

useEffect(() => {
  newMsgAudioRef.current = new Audio('/new-msg-hint.mp3');
  newMsgAudioRef.current.volume = 0.8; // 調整初始音量，預設為 1.0

  return () => {
    if (newMsgAudioRef.current) {
      newMsgAudioRef.current.pause();
      newMsgAudioRef.current = null;
    }
  };
}, []);
```

在 `handleMessageReceive` 加入播放邏輯。

由於使用者自己發送訊息時，`emit` 出去後，後端會再對整個房間 `emit` 新訊息回來，讓前端更新 `messages`。所以播放前要先做判斷，把自己的訊息排除掉，收到對方的訊息才會有音效：

```ts
function handleMessageReceive(newMessage: ChatMessageDto) {
  setMessages((prev) => [...prev, newMessage]);

  if (message.user_id !== userId && newMsgAudioRef.current) {
    newMsgAudioRef.current.currentTime = 0;
    newMsgAudioRef.current.play().catch(() => {});
  }
}
```

在測試的時候可能會收到這個警告：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/175810000400092drtq.png)

這是正常的，因為要防止使用者在關注其他分頁時，被這個分頁的自動播放機制嚇到，所以在使用者在完全沒有跟頁面互動過的情況下，[瀏覽器會禁止這些行為](https://developer.chrome.google.cn/blog/autoplay?hl=zh-tw#web_audio)，不管我們有沒有設定自動播放。

在收到多則新訊息的時候，有可能會播不出來，因為上一段音效還沒結束播放，所以播放前要設定 `newMsgAudioRef.current.currentTime = 0` 重置播放時間！

---

## 本日小結

到聊天功能又再增加了 `matchStatus` 的狀態，我覺得目前的規模還在可控範圍，但如果是比較複雜、多個狀態與 socket 交互，開發前還是要做一次釐清比較好，KISS 指的是讓程式碼變簡單而不是偷懶跳過系統分析 XD

---

## 參考資料

- [効果音ラボ](https://soundeffect-lab.info/)
- [Chrome 自動播放政策](https://developer.chrome.google.cn/blog/autoplay?hl=zh-tw#web_audio)
