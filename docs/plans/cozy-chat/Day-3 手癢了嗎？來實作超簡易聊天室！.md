---
title: 'Day 3 - 手癢了嗎？來實作超簡易聊天室！'
description: '使用 Express 和 WebSocket 實作一個簡單的聊天室應用'
date: 2025-09-04 00:00:00
keywords: [Express, WebSocket, 聊天室, 即時通訊, 實作]
tags: ['Cozy Chat', 'Express', 'WebSocket', '實作']
slug: cozy-chat-day3
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1756925016000ref0ss.png)

說了這麼多，已經忍不住要開始動手做做看了吧！接下來後端都會使用 Express 進行示範，可搭配 Stackblitz 的範例服用：[連結](https://stackblitz.com/edit/stackblitz-starters-rysrqwoi?file=index.js)。

## 環境建置

Stackblitz 建立的 Express 範例已經寫好一個 HTTP 伺服器：

```js
// 在指定的 port 啟動 HTTP 伺服器
app.listen(80, () => {
  console.log('🔌 HTTP 伺服器運行在 http://localhost:80');
});
```

WebSocket 在瀏覽器環境屬於 Web API，可以直接呼叫，但在其他語言環境並不是內建的，需要安裝對應的套件，在 Node.js 的環境下要安裝 [ws](https://www.npmjs.com/package/ws)。

---

## 後端連線

[Day-2](https://ithelp.ithome.com.tw/articles/10377268) 有提到 **WebSocket 是一種應用層協定**，而不同的協定需要不同的 port 來運行。在建構函式 `WebSocketServer` 帶入指定的 port 號就可以啟動：

```js
const wss = new WebSocketServer({ port: 2603 }, () => {
  console.log('🔌 WebSocket 伺服器運行在: ws://localhost:2603');
});
```

使用 Stackblitz 的話會看到 IDE 左邊的插頭圖示會標示數字 2，代表目前佔用了 2 個 port：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1756889507000em5lms.png)

---

## 事件監聽

前端會用 `addEventListener` 來偵測元素是否觸發某些事件，並執行對應函式：

```js
const btn = querySelector('.btn');

btn.addEventListener('click', () => {
  console.log('btn 被點擊了');
});
```

後端則是用 `EventEmitter` 這個類別（class）來建構 `Process` 物件來監聽。ws 套件所提供的 `WebSocketServer` 也是繼承自這個類別。這點也可以從定義檔 [@types/ws](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/ws/index.d.ts) 中看到：

```ts
// WebSocketServer
declare class Server<
  T extends typeof WebSocket = typeof WebSocket,
  U extends typeof IncomingMessage = typeof IncomingMessage,
> extends EventEmitter {
  /* 略 */
}
```

ws 的方法和 jQuery 雷同，呼叫 `.on` 加上事件名稱就可以監聽：

```js
wss.on('connection', (client) => {
  console.log('✅ 新的 Client 連線已建立');
});
```

~~jQuery 再戰十年！~~

`wss.on` 建立的是後端伺服器本身的事件監聽，`connection` 事件代表後端在接收到前端連線「成功」時要做的事。callback 帶的參數 `client` 是被事件捕捉到的前端連線。

---

## 前端連線

在前端建立 WebSocket 連線的方法也很簡單，因為是 Web API，所以不用安裝或載入任何東西，直接呼叫建構函式 `WebSocket` 即可：

```html
<script>
  const ws = new WebSocket('ws://localhost:2603');
</script>
```

可以看到 URL 是以 `ws://` 作為開頭，而不是 `http://`。

目前的邏輯代表有任何使用者到達首頁時就會發出連線，連線成功的話後端會依照 `connection` 事件定義的 callback 印出這段 log：`✅ 新的 Client 連線已建立`：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1756889723000naavkc.png)

---

## 從後端發送資料

後端可以寫好預設訊息，在 `connection` 事件中呼叫 `client.send` 來對連線成功的使用者打招呼：

```js
wss.on('connection', (client) => {
  const helloMessage = {
    content: '歡迎來到聊天室',
    date: new Date(),
  };

  client.send(JSON.stringify(helloMessage)); // 新的 client 連上時就傳送 helloMessage
});
```

ws 套件預期資料必須是 string 或是 Buffer，原因是我們先前提到 WebSocket 協定的封包不是走 HTTP 標頭，而是 WebSocket frame，資料類型的 frame 僅支援 text frame 和 binary frame。

所以把 `helloMessage` 這個物件傳送出去會失敗，必須先透過 `JSON.stringify` 轉成 string，而 string 就會被 ws 編碼成 text frame。

前端則是用 `.onmessage` 事件來處理後端發出的 `.send`，資料會在 `event.data` 裡面，前端的 WebSocket API 會自動處理 frame 的內容，text frame 會轉成 string，binary frame 會轉成 Blob 或 ArrayBuffer。

:::warning
注意 Buffer 是 Node.js 環境才有的格式。
:::

記得用 `JSON.parse` 解碼剛剛被轉換成 string 的 `helloMessage`：

```html
<script>
  ws.onmessage = (event) => {
    // 還原資料
    const message = JSON.parse(event.data);
    const chatBox = document.getElementById('chat-box');

    // 將收到的新訊息同步更新到畫面上
    chatBox.innerHTML += `<li>${message.content} - ${message.date}</li>`;
  };
</script>
```

成功的話就可以在畫面上看到預設訊息囉：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1756926969000mr4q9g.png)

後續只要後端有執行 `.send`，都會觸發前端的 `.onmessage`，持續更新 `innerHTML` 來顯示最新訊息。

---

## 從前端發送資料

前端傳輸資料的方法也是呼叫 `.send`。這邊可以設計一個按鈕的 `click` 事件，把輸入框的內文送出，資料一樣要先透過 `JSON.stringify` 轉換：

```js
const inputMessage = document.getElementById('input-message');
const btnSend = document.getElementById('btn-send');

btnSend.addEventListener('click', () => {
  const content = inputMessage.value;

  if (!content) {
    return;
  }

  const data = {
    content,
    date: new Date(),
  };

  ws.send(JSON.stringify(data));
  inputMessage.value = '';
});
```

後端需要在 `connection` 事件中定義接收資料的事件監聽，事件名稱固定為 `message`：

```js
client.on('message', (data) => {
  const message = JSON.parse(data.toString());

  // 廣播給連線中的所有 client
  wss.clients.forEach((c) => {
    c.send(JSON.stringify(message));
  });
});
```

ws 套件的行為跟瀏覽器不太一樣，**接收資料時統一會轉換成 `Buffer`**，所以後端收到的 `data` 不能直接拿來用，需要額外處理。確定原始資料一定會是 string 的情況下的話就可以用 `.toString()` 解碼。

最後透過 `WebSocketServer` 的屬性 `.clients` 取出連線中的所有實例並推送新的聊天訊息，就能達到廣播的效果，讓聊天室的每個人都能接收到。

可以多開視窗來模擬多位使用者的操作，後端的終端也可以看到陸續建立連線的 log。在各自的視窗輸入訊息，也都能即時同步收到：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1756923080000cfh9g3.png)

---

## 本日小結

目前只有示範基本的收發事件，不過 WebSocket 的[固定事件](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#events)就只有 4 種：

- `open` - 連線建立
- `message` - 處理 `.send`
- `close` - 連線關閉
- `error` - 發生錯誤

需要留意的是前後端的方法與格式差異。在傳輸資料時，各自的 API 都會把原始資料轉換成對應的 frame，但接收資料時後端最終會取出 Buffer：

| 終端     | Client                        | Server           |
| -------- | ----------------------------- | ---------------- |
| API 來源 | 瀏覽器原生                    | ws 或其他函式庫  |
| 傳輸格式 | string \| Blob \| ArrayBuffer | string \| Buffer |
| 接收格式 | string \| Blob \| ArrayBuffer | Buffer           |

雖然還是有提到一點 TypeScript，但如果能看到型別的原始定義，個人認為對兩端的差異會更清楚。後續正式製作專案時也都會以 TypeScript 為主唷！

---

## 參考資料

- [【 Node.js 學習筆記】Event Emitter](https://medium.com/@LumiousPan/%E5%AD%B8%E7%BF%92%E7%AD%86%E8%A8%98-node-event-emitter-b159b7ce95c0)
- [Why is received websocket data coming out as a buffer?](https://stackoverflow.com/questions/69485407/why-is-received-websocket-data-coming-out-as-a-buffer)
- [DefinitelyTyped/types/ws/index.d.ts](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/ws/index.d.ts)
- [用 Express 建立一個簡易 WebSocket 聊天室](https://israynotarray.com/nodejs/20230504/3177278058/)
- [MDN WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket#events)
