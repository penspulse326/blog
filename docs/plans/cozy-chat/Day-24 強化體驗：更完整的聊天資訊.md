---
title: 'Day 24 - 強化體驗：更完整的聊天資訊'
description: 'Cozy Chat 專案第 24 天：強化體驗：更完整的聊天資訊'
date: '2025-09-25 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day24'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758747609000tr886q.png)

這次的鐵人賽感覺一直在後端打滾，但其實我是一名前端工程師，~~所以應該多洗一點前端的主題~~，致力於打造更好的操作體驗，也是我當初的選擇走這一行的原因！

## 訊息時間

在交友軟體中時間相關的 UI，與其說是強化體驗，不如說是強化焦慮 XD（~~懂的就懂~~）

目前聊天訊息中的時間顯示比較陽春，還沒加工過，只會顯示 `YYYY/MM/DD`：

```tsx
<Text size="xs">
  {new Date(createdAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })}
</Text>
```

我想增加這些顯示：

1. 剛剛
2. N 分鐘前
3. HH:mm
4. N 天前

時間計算是非常普及的需求，像是打卡、會計、金融交易等等，所以每個語言幾乎都有標準化的時間函式庫可以用，沒錯......接下來要安裝那個好東西：[Day.js](https://day.js.org/)！

整體的邏輯也不難，只要列舉條件即可，不過天數的計算我不是使用 `'day'` 而是 `'hour'`，因為 `'day'` 算的是日期的相減，但時數比較符合我的需求：

```ts
import dayjs from 'dayjs';

export function formatMessageTime(date: string | number | Date) {
  const messageTime = dayjs(date);
  const now = dayjs();

  const diffMinutes = now.diff(messageTime, 'minute');

  if (diffMinutes < 1) {
    return '剛剛';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分鐘前`;
  }

  const diffHours = now.diff(messageTime, 'hour');

  if (diffHours < 24) {
    return messageTime.format('HH:mm');
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} 天前`;
}
```

塞一些假資料到畫面上看看顯示格式：

```tsx
// 測試「剛剛」(1 分鐘內)
const justNow = new Date();

// 測試「X分鐘前」(1 小時內)
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5分鐘前

// 測試「HH:mm」(今天內)
const todayMorning = new Date();
todayMorning.setHours(1, 30, 0); // 設定為今天早上 01:30

// 測試「X天前」
const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 上個月
const lastYear = new Date(2024, 0, 1); // 2024年1月1日

<Text size="xs">{formatMessageTime(justNow)}</Text>
<Text size="xs">{formatMessageTime(fiveMinutesAgo)}</Text>
<Text size="xs">{formatMessageTime(todayMorning)}</Text>
<Text size="xs">{formatMessageTime(lastMonth)}</Text>
<Text size="xs">{formatMessageTime(lastYear)}</Text>
```

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758739663000e32rxf.png)

看起來沒什麼問題，但實際操作的時候......過了多久都還是顯示「剛剛」：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758737696000lx3q4m.png)

元件從接收到時間資料後，內部並沒有狀態變化，所以在畫面的時間顯示也就不會持續刷新。

這時只要加入 `useState` 與 `useEffect`，先計算好時間再放到畫面上就可以了：

```ts
const [formattedTime, setFormattedTime] = useState<string>(formatMessageTime(createdAt));

useEffect(() => {
  const interval = setInterval(() => {
    setFormattedTime(formatMessageTime(createdAt));
  }, 1000 * 60);

  return () => clearInterval(interval);
}, [createdAt]);
```

好耶！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758742495000wf3zr6.png)

---

## 來源裝置

在開始配對的邏輯中，目前裝置還是寫死的：

```ts
function startMatch() {
  socket.emit(MATCH_EVENT.START, 'PC');
}
```

偵測的方法也很粗暴簡單，只要偵測 `window` 物件的硬體屬性是不是符合觸控設備即可：

```ts
export function getDeviceType() {
  const isMobile = window.matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;

  return isMobile ? 'MB' : 'PC';
}
```

用 `navigator.userAgent` 來判斷其實也可以，但就是要塞入一堆瀏覽器的字串，也因為[瀏覽器政策](https://privacysandbox.google.com/protections/user-agent?hl=zh-tw)的關係越來越少使用，而改用新的表頭[User-Agent Client Hints](https://web.dev/articles/migrate-to-ua-ch?hl=zh-tw)。

雖然在本機可以用瀏覽器的 DevTools 模擬非電腦的裝置，讓配對資訊顯示 `'行動裝置'`，不過線上使用的情況才是我們想知道的，所以部署成功後用真的手機~~自言自語~~測試看看吧！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758746972000tbzoho.png)

---

## 本日小結

雖然這種小細節，在程式邏輯上或許不是非常複雜的功能，不過往往會默默地影響到使用體驗，有時候一個產品的評價或是歡迎程度，就體現在這些小地方的打磨上，這也是我始終對前端念念不忘（？）的原因。

---

## 參考資料

- [Day.js](https://day.js.org/)
- [什麼是使用者代理程式縮減？](https://privacysandbox.google.com/protections/user-agent?hl=zh-tw)
- [User-Agent Client Hints](https://web.dev/articles/migrate-to-ua-ch?hl=zh-tw)
