---
title: 'Day 11 - 按圖施工-網頁篇：元件組合'
description: 'Cozy Chat 專案第 11 天：按圖施工-網頁篇：元件組合'
date: '2025-09-12 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day11'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1757647396000qrdxuy.png)

接下來要實作聊天功能的元件！切版部分就不會提太多細節，會以元件的設計思路為主～

## 佈局分析

回想一下 WooTalk 的聊天功能，內容大概由 3 個元件組成：

1. 包裝全部訊息的盒子，長度隨訊息量延展
2. 一則訊息
3. 操作區塊：包含離開配對、輸入框、送出按鈕

可以明顯看出 `一則訊息` 一定是從 `props` 傳入然後顯示訊息內文，絕對不可能在一則訊息裡面透過打 API 的方式拿到訊息 XD

這樣的元件也被稱作 **Presentational Component**（展示層），不涉及複雜的業務邏輯，單純接收資料。

負責存取 API、重組資料、管理共用狀態的元件，則稱作 **Container Component**（邏輯層），可能小至一個表單，大到整個頁面，都可以是一個 container（或稱 ｍodule）。

在 Next 中這個觀念會更明顯，不論是過去的 Page Router 還是現在的 App Router，只要談到拿資料，就會想到 ISR、SSR、SSG，這些預渲染的機制都必須在 page 元件執行拿資料的邏輯。

那麼，在不確定什麼元件怎麼分類時該怎麼做？像是 `包裝全部訊息的盒子` 就很難說是哪種元件，這時我會先把主要的業務邏輯放到頂層的容器，例如 page 元件處理即可，這樣至少能預防在較末端的元件把 API 打爆的狀況。

---

## 一則訊息

展示層的元件最容易設計！`props` 可以照著先前規劃好的資料架構來定義。

訊息會根據是否由使用者發出，來決定排版要靠左還是靠右，所以這個元件要做的判斷是 `排列位置`。`是否由使用者發出` 這個判斷我認為應該要在上層完成，減少展示層的邏輯：

```tsx
export type ChatMessageData = {
  id: string;
  user_id: string;
  device: keyof typeof Device;
  message: string;
  created_at: string;
};

interface ChatMessageCardProps {
  data: ChatMessageData;
  isUser: boolean;
}

export default function ChatMessageCard({ data, isUser }: ChatMessageCardProps) {
  const { device, message, created_at } = data;
  const justify = isUser ? 'end' : 'start';

  return (
    <Flex justify={justify} align="end">
      <Flex p="xs" maw={360} bdrs="md" bg={alpha('var(--mantine-color-soft-lime-0)', 0.5)}>
        <Text
          style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        >
          {message}
        </Text>
      </Flex>
      <Stack gap={0} mx="8" mb="4" ta={isUser ? 'right' : 'left'} style={{ order: isUser ? -1 : 1 }}>
        <Text size="xs">{Device[device]}</Text>
        <Text size="xs">{created_at}</Text>
      </Stack>
    </Flex>
  );
}
```

### CSS Module

如果覺得 style props 多到干擾閱讀，這是正常的......就如同 MUI 的 `sx` 或是 Tailwind 大量的 utility class，雖然好寫但要付出一點代價 QQ

官方推薦的分離方式是使用 CSS Module，但這個方法一開始得反覆去查 Mantine 的 CSS 變數，所以我想不是大型專案的話，倒不一定要做很乾淨的樣式分離，我有強迫症所以我做了 XDDD

但如果善用科技（？），那麼用 style props 快速寫完後，再讓工讀生分離樣式就可以啦：

```tsx
import styles from './styles.module.css';

export default function ChatMessageCard({ data, isUser }: ChatMessageCardProps) {
  const { device, message, created_at } = data;
  const justify = isUser ? styles.wrapperEnd : styles.wrapperStart;

  return (
    <Flex className={`${styles.wrapper} ${justify}`}>
      <Flex className={styles.messageBox} bg={alpha('var(--mantine-color-soft-lime-0)', 0.5)}>
        <Text className={styles.messageText}>{message}</Text>
      </Flex>
      <Stack className={`${styles.infoStack} ${isUser ? styles.infoStackRight : styles.infoStackLeft}`}>
        <Text size="xs">{Device[device]}</Text>
        <Text size="xs">{created_at}</Text>
      </Stack>
    </Flex>
  );
}
```

至於有沒有比較好讀就見仁見智，畢竟這是前端長年以來的宗教戰爭了（？）

---

## 訊息盒

先不考慮跨元件狀態管理的話，訊息盒也偏向展示層，大部分的資料要透過外部控制。

配對的狀態不是單純的已配對與未配對，至少還會有一個**等待配對**，因此 `matchStatus` 就不能只用 `boolean` 來處理：

```tsx
interface ChatBoxProps {
  userId: string | null;
  messages: ChatMessage[];
  matchStatus: MatchStatus;
}

export default function ChatBox({ userId, messages, matchStatus }: ChatBoxProps) {
  return (
    <Stack className={styles.chatBoxWrapper} bg={alpha('var(--mantine-color-moss-green-2)', 0.4)}>
      {matchStatus === 'waiting' ? (
        <Text>配對中...</Text>
      ) : (
        <>
          <Text>配對成功！</Text>
          <Text className={styles.chatBoxTextMb}>開始聊天吧！</Text>

          <Stack className={styles.messagesContainer}>
            {messages.map((message: ChatMessage) => (
              <ChatMessageCard key={message._id} data={message} isUser={message.user_id === userId} />
            ))}
          </Stack>
        </>
      )}
      {matchStatus === 'left' && <Text>對方已離開</Text>}
    </Stack>
  );
}
```

設計好訊息盒的架構後，上層的 `page.tsx` 可以試著做出對應的邏輯和假資料。

在 `handleStartMatch` 中可以加入 `setTimeout` 來模擬等待配對的效果：

```tsx
export default function Home() {
  const [opened, { toggle }] = useDisclosure();
  const [matchStatus, setMatchStatus] = useState<matchStatus>('standby');
	const [messages, setMessages] = useState<ChatMessageData[]>([
	  // 假資料
	]);

  async function handleStartMatch() {
    setMatchStatus('waiting');

    await new Promise((resolve) =>
      setTimeout(() => {
        setMatchStatus('matched');
        resolve(true);
      }, 5000)
    );
  }

  function handleLeaveMatch() {
    setMatchStatus('standby');
  }

	function handleSendMessage(message: string) {
    setMessages([
      ...messages,
      {
        id: (messages.length + 1).toString(),
        user_id: '123',
        device: 'PC',
        message,
        created_at: new Date().toISOString(),
      },
    ]);
  }
```

---

## 輸入框

輸入框的邏輯也不多，送出訊息可以由按下 `enter` 或是按下 `送出` 按鈕觸發，加上輸入防呆就大致完成了。

這裡我加上了清空訊息的按鈕 `rightSection`，這是官方文件有示範的用法：

```tsx
interface ChatActionBar {
  matchStatus: matchStatus;
  onSendMessage: (message: string) => void;
  onLeaveMatch: () => void;
}

export default function ChatActionBar({ matchStatus, onSendMessage, onLeaveMatch }: MessageInputProps) {
  const [message, setMessage] = useState('');

  function handleSendMessage() {
    if (message.trim() === '') {
      return;
    }

    onSendMessage(message);
    setMessage('');
  }

  function handleClearMessage() {
    setMessage('');
  }

  if (matchStatus === 'standby') {
    return null;
  }

  return (
    <Flex className={styles.wrapper}>
      <Button variant="subtle" onClick={onLeaveMatch} classNames={{ root: styles.leaveButtonRoot }}>
        離開
      </Button>
      <Input
        disabled={matchStatus !== 'matched'}
        rightSection={<Input.ClearButton onClick={handleClearMessage} disabled={message.trim() === ''} />}
        rightSectionPointerEvents="auto"
        rightSectionWidth="auto"
        classNames={{
          wrapper: styles.inputWrapper,
          input: styles.inputInput,
        }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage();
          }
        }}
      />
      <Button
        disabled={matchStatus !== 'matched'}
        classNames={{ root: styles.sendButtonRoot }}
        onClick={handleSendMessage}
      >
        送出
      </Button>
    </Flex>
  );
}
```

---

## 滾動軸

在測試配對成功後的狀態時，聊天訊息會不斷向下新增會出現 Y 軸，這是合理的現象，不過瀏覽器預設的 scrollbar 除了不好看，scrollbar 出現也會造成畫面一瞬間的推擠，我覺得多少會對使用體驗造成一點影響，像 WooTalk 一進去網站就是固定有 Y 軸的。

這時候可以用到 `ScrollArea` 這個元件來製造可以滾動的容器：

```tsx
<AppShell.Main className={styles.appShellMain}>
  <ScrollArea type="auto" scrollbarSize={8} className={styles.scrollArea}>
    <Stack mx="auto" maw={480} className={styles.outerStack}>
      <Stack className={styles.innerStack}>
        <Image
          src="/logo-full.png"
          alt="Cozy Chat"
          width={256}
          height={256}
        />
```

看起來好多了～也不會因為突然出現的 Y 軸造成畫面推擠！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752765680000hx4ooj.png)

還有一個相當影響使用體驗的問題：每次輸入新的訊息時容器高度會不斷改變，但 scrollbar thumb 並不會自動移動到底部。

通常呼叫 `scrollTo` 即可滾動，但如果是在特定區塊內才有 scrollbar 的話，要先用 `useRef` 綁定該區塊的 DOM 才能呼叫 `scrollTo`。

剛剛加入的 `ScrollArea` 有提供 `viewportRef` 給我們綁定，所以就直接拿來用吧：

```tsx
// 綁定 DOM
const viewport = useRef<HTMLDivElement>(null);

// JSX
<ScrollArea
  type="auto"
  scrollbarSize={8}
  className={styles.scrollArea}
  viewportRef={viewport}
>
```

接著就可以使用 `viewport` 來執行滾動，配合 `useEffect` 就可以在配對狀態變更或是新增訊息時，滾動到容器底部：

```tsx
// 封裝成函式
function handleScrollToBottom() {
  viewport.current?.scrollTo({
    top: viewport.current.scrollHeight,
    behavior: 'smooth',
  });
}

useEffect(() => {
  handleScrollToBottom();
}, [matchStatus, messages]);
```

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1753091086000c26a67.png)

:::info  
用 `useRef` 操作 DOM 時，一定是在相關的狀態更新後，DOM 重新渲染結束才去操作，所以會搭配 `useEffect`。在比較複雜的容器中要留意狀態更新的問題，不然會變成先操作了 DOM 結果又被刷掉的狀況，這時候可能會懷疑人生 XD
:::

---

## 背景特效

在初期製作我通常不管特效，會先以完成整體佈局為主，這樣比較好交付進度跟抓到整體元件架構。

但現在這個畫面的組成只有漸層，看起來很單調...這時就可以發動一點前端魔法，我參考的是這位大大的文章：[網頁的流動背景怎麼做？讓你的網站背景不再死版](https://www.thisweb.dev/post/smooth-liquid-bg)！

原始程式碼不會太複雜，但直接叫 AI 改應該會出錯，因為這不是單純從 class component 轉成 function component，還附帶一些操作 DOM 的行為，所以描述得不夠詳細的話 AI 的產出會有點問題。

這邊也稍微講解我的改寫思路，如果改不動，其實把原始碼照搬過來也可以......小心不要用 `useState` 把 DOM 實例刷掉就好 XD

### 改寫邏輯

1. 動畫邏輯主要是更新元素位置，並且靠 `requestAnimationFrame` 來達到順暢的重繪，如果用 `useState` 來控制元素位置，會造成一點延遲，我們只需要用到 `useRef` 初始化 DOM 就可以
2. class 建構函式改用 `useEffect` 來初始化
3. 容器也需要 `useRef` 來存這些泡泡的實例並觸發 `requestAnimationFrame`
4. 泡泡本身也要暴露方法，讓容器可以在觸發 `requestAnimationFrame` 的過程操作這些暴露的方法，來更新泡泡的 DOM
5. 在 `useEffect` 中加入 clean up，來清理已經註冊過的動畫

```tsx
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import styles from './style.module.css';

const MIN_SPEED = 0.5;
const MAX_SPEED = 2;
const BLOB_COUNT = 8;

const randomNumber = (min: number, max: number): number => Math.random() * (max - min) + min;

type BlobStateType = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  initialX: number;
  initialY: number;
};

type BlobRefType = {
  initBlob: () => void;
  updateBlobPosition: () => void;
};

const Blob = forwardRef<BlobRefType>((_, ref) => {
  const blobRef = useRef<HTMLDivElement>(null);
  const blobStateRef = useRef<BlobStateType | null>(null);

  function initBlob() {
    if (!blobRef.current) {
      return;
    }

    blobRef.current.classList.add(styles.blob);
    const boundingRect = blobRef.current.getBoundingClientRect();
    const size = boundingRect.width;

    // 隨機初始位置
    const initialX = randomNumber(0, window.innerWidth - size);
    const initialY = randomNumber(0, window.innerHeight - size);

    // 初始化 DOM 位置
    blobRef.current.style.top = `${initialY}px`;
    blobRef.current.style.left = `${initialX}px`;

    // 速度
    const vx = randomNumber(MIN_SPEED, MAX_SPEED) * (Math.random() > 0.5 ? 1 : -1);
    const vy = randomNumber(MIN_SPEED, MAX_SPEED) * (Math.random() > 0.5 ? 1 : -1);

    blobStateRef.current = {
      x: initialX,
      y: initialY,
      vx,
      vy,
      size,
      initialX,
      initialY,
    };
  }

  function updateBlobPosition() {
    if (!blobStateRef.current || !blobRef.current) {
      return;
    }

    const state = blobStateRef.current;

    // 更新位置
    state.x += state.vx;
    state.y += state.vy;

    // 邊界檢測與反彈 - 優化後的邏輯
    if (state.x >= window.innerWidth - state.size || state.x <= 0) {
      state.vx *= -1;
      state.x = Math.max(0, Math.min(state.x, window.innerWidth - state.size));
    }
    if (state.y >= window.innerHeight - state.size || state.y <= 0) {
      state.vy *= -1;
      state.y = Math.max(0, Math.min(state.y, window.innerHeight - state.size));
    }

    // 直接更新 DOM，避免重新渲染
    blobRef.current.style.transform = `translate(${state.x - state.initialX}px, ${state.y - state.initialY}px)`;
  }

  // 暴露內部方法
  useImperativeHandle(ref, () => ({
    initBlob,
    updateBlobPosition,
  }));

  // 初始化泡泡位置
  useEffect(() => {
    initBlob();
  }, [blobRef.current]);

  return <div ref={blobRef} />;
});

Blob.displayName = 'Blob';

export default function Blobs() {
  const blobRefs = useRef<(BlobRefType | null)[]>(Array.from({ length: BLOB_COUNT }, () => null));
  const animationRef = useRef<number | null>(null);
  const isRunning = useRef(false);

  // 初始化動畫
  useEffect(() => {
    isRunning.current = true;

    function update() {
      if (!isRunning.current) {
        return;
      }

      blobRefs.current.forEach((blob) => {
        blob?.updateBlobPosition();
      });

      animationRef.current = requestAnimationFrame(update);
    }

    animationRef.current = requestAnimationFrame(update);

    return () => {
      isRunning.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // window size 改變時重新初始化所有泡泡位置
  useEffect(() => {
    function handleResize() {
      blobRefs.current.forEach((blob) => {
        if (blob) {
          blob.initBlob();
        }
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.blobs}>
      {Array.from({ length: BLOB_COUNT }, (_, index) => (
        <Blob
          key={index}
          ref={(el) => {
            blobRefs.current[index] = el;
          }}
        />
      ))}
    </div>
  );
}
```

雖然我的註解很像廢話，不過我覺得 side effect 容易出現一些隱性的 bug，所以我習慣稍微註解一下每個 effect 在做什麼。

### 替換 CSS 變數

原文的 CSS 變數可以換成 `theme.ts` 定義的顏色，Mantine 會為這些顏色生成全域的 CSS 變數：

```css
.blobs {
  --cr-1: color-mix(in srgb, var(--mantine-color-moss-green-6), var(--mantine-color-deep-teal-4) 20%);
  --cr-2: color-mix(in srgb, var(--mantine-color-moss-green-6), var(--mantine-color-deep-teal-4) 40%);
  --cr-3: color-mix(in srgb, var(--mantine-color-moss-green-6), var(--mantine-color-deep-teal-4) 60%);
  --cr-4: color-mix(in srgb, var(--mantine-color-moss-green-6), var(--mantine-color-deep-teal-4) 80%);

  position: fixed;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  filter: blur(120px);
}

.blob {
  width: max(240px, 50vw);
  aspect-ratio: 1;
  border-radius: 50%;
  position: absolute;
  top: 0;
  left: 0;
}

.blob:nth-of-type(1) {
  background: var(--mantine-color-cyan-1);
}

.blob:nth-of-type(2) {
  background: var(--mantine-color-yellow-1);
}

.blob:nth-of-type(3) {
  background: var(--mantine-color-cyan-3);
}

.blob:nth-of-type(4) {
  background: var(--mantine-color-yellow-3);
}

.blob:nth-of-type(5) {
  background: var(--cr-3);
}

.blob:nth-of-type(6) {
  background: var(--cr-1);
}

.blob:nth-of-type(7) {
  background: var(--cr-2);
}

.blob:nth-of-type(8) {
  background: var(--cr-4);
}
```

泡泡的數量和樣式可以改成傳參數、動態生成，做成更彈性的擴充，但目前先能用就好 XD

將 `filter: blur(1px)` 數值調低可以看到銳利的泡泡，方便觀察運動軌跡！

背景先前是用漸層填充，但沒有設透明度所以看不到泡泡。直接調背景的 alpha 值會疊到這些泡泡的顏色上，少了一點跳色的感覺，所以我改用 `backdropFilter: blur`，整體呼吸感（？）也比較好：

```tsx
<AppShell.Main
  p={0}
  bg="soft-lime.2"
  style={{
    backdropFilter: 'blur(1px)',
    overflow: 'hidden',
  }}
>
  <Blobs />
  {/* 略 */}
</AppShell.Main>
```

我不是在 `Blob` 的 JSX 中透過 `className` 注入樣式，而是在 `initBlob` 中加入：`blobRef.current.classList.add(styles.blob)`，因為我發現泡泡位置的初始化會稍微晚一點才執行，如果這時候已經注入樣式的話，會先帶入裡面設定的位置，讓泡泡停在左上角一下下：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752728831000qn0i8n.png)

將顏色調整到滿意後就完成囉！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752742265000iomf1r.png)

---

## 本日小結

今天的內容其實花了好幾天撰寫，因為要持續對 Mantine 元件和排版試錯，也嘗試了以前沒寫過的特效，所以花了蠻多時間 XD

重點在於元件分離的邏輯，是否符合 Container/Presentational Pattern，因為它代表了樹狀的資料流模式，也反映出 DOM Tree 的觀念。

真實的配對邏輯就等後端完成後再進行實作吧！

:::info
上面的元件有很多方法是 `handle` 開頭，這是事件驅動相關的邏輯常用的命名慣例，代表某個事件被觸發時的實際要做出的回應邏輯（event handler）。
:::

---

## 參考資料

- [網頁的流動背景怎麼做？讓你的網站背景不再死版](https://www.thisweb.dev/post/smooth-liquid-bg)
- [requestAnimationFrame](https://developer.mozilla.org/zh-TW/docs/Web/API/Window/requestAnimationFrame)
- [Container/Presentational Pattern](https://www.patterns.dev/react/presentational-container-pattern/)
- [onClick 還是 handleClick？淺談 React 事件處理的命名慣例](https://notes.boshkuo.com/docs/React/event-handler-naming-convention)
