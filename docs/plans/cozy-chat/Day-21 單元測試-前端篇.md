---
title: 'Day 21 - 單元測試-前端篇'
description: 'Cozy Chat 專案第 21 天：單元測試-前端篇'
date: '2025-09-22 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day21'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17584995960003lwcw9.png)

前端的單元測試大多是透過 `props` 和內部狀態的變化來測試不同狀況的元件，不過事前準備稍微多一點！

## 環境設定

Next 對於 [Vitest 的設定說明](https://nextjs.org/docs/app/guides/testing/vitest) 有點簡略，至少我照著做是失敗的 XD 不確定是不是 pnpm 的問題，我在製作測試的範例時會一直提示 `toBeInTheDocument` 這個方法不存在。

但是沒關係，Mantine 的官網非常貼心，附上了[整合指南](https://mantine.dev/guides/vitest/)，照做就沒問題。

Mantine 設計的 hook 或元件會操作到 `window` 物件，所以需要事前做全域的 mock。`'next/font/local'` 則是因為我是使用下載好的字體檔案，所以需要手動 mock，如果是使用 Noto TC、Roboto 等 `next/font` 包好的內建字體就不用 mock：

```ts
import '@testing-library/jest-dom/vitest';

import { vi } from 'vitest';

vi.mock('next/font/local', () => ({
  default: vi.fn(() => ({
    style: {
      fontFamily: '__localFont_abc123',
    },
    className: '__localFont_abc123',
  })),
}));

const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);
window.HTMLElement.prototype.scrollIntoView = () => {};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;
```

其他是一般前端開發也會做的設定：

1. `userEvent`：需要安裝 `@testing-library/user-event` 並使用 `userEvent` 來模擬使用者的操作

2. `render`：做元件測試時， `render` 也要改為使用測試庫的方法，因為我們並不需要真的透過原本的 `render` 進行瀏覽器畫面的重繪。在 Mantine 的架構下需要重新包裝 `render` 方法，否則會報錯 `MantineProvider` 未定義

```tsx
import { MantineProvider } from '@mantine/core';
import { RenderResult, render as testingLibraryRender } from '@testing-library/react';
import { theme } from '../theme';

export function render(ui: React.ReactNode): RenderResult {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={theme} env="test">
        {children}
      </MantineProvider>
    ),
  });
}
```

最後可以統一匯出給其他測試檔使用：

```ts
import userEvent from '@testing-library/user-event';

export * from '@testing-library/react';
export { render } from './render';
export { userEvent };
```

---

## UI 元件

UI 元件的單元測試需要用 `screen` 來帶出實際渲染出來的 DOM，配合 `expect` 斷言就可以知道是否有成功跑出對應的元件內容：

```tsx
describe('ChatMessageCard', () => {
  const mockChatMessage: ChatMessageDto = {
    id: '1',
    roomId: 'room1',
    userId: 'user1',
    content: 'Hello, this is a test message!',
    createdAt: new Date('2023-10-27T10:00:00Z'),
    device: 'MB',
  };

  it('應該正確渲染訊息內容、裝置和時間 (作為使用者)', () => {
    // act
    render(<ChatMessageCard data={mockChatMessage} isUser={true} />);

    // assert
    expect(
      screen.getByText('Hello, this is a test message!')
    ).toBeInTheDocument();
    expect(screen.getByText('行動裝置')).toBeInTheDocument();
    expect(screen.getByText('2023/10/27')).toBeInTheDocument();
  });
```

`props` 的變化就可以直接在 `render` 中帶入：

```ts
it('當 device 不合法時，應能正常渲染而不顯示裝置資訊', () => {
  // arrange
  const mockInvalidMessage = {
    ...mockChatMessage,
    id: '3',
    device: 'non-existent-device' as Device,
  };

  // act
  render(<ChatMessageCard data={mockInvalidMessage} isUser={true} />);

  // assert
  expect(
    screen.getByText('Hello, this is a test message!')
  ).toBeInTheDocument();
  expect(screen.queryByText('網站')).not.toBeInTheDocument();
  expect(screen.queryByText('行動裝置')).not.toBeInTheDocument();
});
```

因為元件整體沒有什麼複雜的組合或是動態樣式，所以我就不特別測樣式和快照（~~我絕對不會說是因為我不會寫~~）。

---

## custom hook

先前設計的 `useMatch` 是前端的核心業務邏輯，所以這邊才是測試的重頭戲！

我覺得目前的架構還不用做太多拆分，雖然有一百多行的邏輯，但大概有 1/3 是資料準備與分流事件的 effect，其他也都是很簡短的狀態轉移，所以應該不用做太多抽象，最後我只將 socket 實例拆成 `useSocket`：

```ts
import { useRef } from 'react';
import { Socket, io } from 'socket.io-client';

interface UseSocketOptions {
  url: string;
  query?: Record<string, unknown>;
}

export interface SocketInstance {
  connect: (options?: UseSocketOptions) => void;
  disconnect: () => void;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (data: unknown) => void) => void;
  isConnected: () => boolean;
}

export default function useSocket(): SocketInstance {
  const socketRef = useRef<Socket | null>(null);

  function connect(options?: UseSocketOptions) {
    if (!options) return;

    socketRef.current = io(options.url, {
      query: options.query || {},
    });
  }

  function disconnect() {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }

  function emit(event: string, data?: unknown) {
    socketRef.current?.emit(event, data);
  }

  function on(event: string, handler: (data: unknown) => void) {
    socketRef.current?.on(event, handler);
  }

  function isConnected() {
    return socketRef.current?.connected ?? false;
  }

  return {
    connect,
    disconnect,
    emit,
    on,
    isConnected,
  };
}
```

不拆的話會摻雜很多跟配對無關的連線測試案例，這也代表原本的 `useMatch` 確實需要減少耦合。

---

## useSocket

這邊只要將 `socket.io-client` 套件提供的實例 mock 好，就算完成準備了！

和 hook 有關的邏輯可以用 `renderHook` 來模擬執行結果：

```ts
const mockSocketInstance = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => {
  const mockIo = vi.fn(() => mockSocketInstance);
  return {
    io: mockIo,
  };
});

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該提供正確的 API', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current).toEqual({
      connect: expect.any(Function),
      disconnect: expect.any(Function),
      emit: expect.any(Function),
      on: expect.any(Function),
      isConnected: expect.any(Function),
    });
  });
```

如果有操作 hook 或是狀態更新等，需要使用 `@testing-library/react` 的 `act`，`act` 會阻斷程式碼的進程，直到全部的狀態操作都完成後，才會往下進行 `expect` 斷言：

```ts
describe('connect', () => {
it('應該使用正確的參數建立 socket 連線', () => {
  // arrange
  const { result } = renderHook(() => useSocket());

  // act
  act(() => {
    result.current.connect({
      url: 'http://localhost:8080',
      query: { roomId: 'room123' },
    });
  });

  // assert
  expect(vi.mocked(io)).toHaveBeenCalledWith('http://localhost:8080', {
    query: { roomId: 'room123' },
  });
});
```

目前操作的狀態比較少，不加 `act` 其實也可以通過測試，但遇到併發渲染（concurrent rendering）或是非同步的問題，這邊的測試應該會死給你看 XD，所以 `act` 也是確保測試的穩定性。

---

## useMatch

### 狀態轉移

將 socket 的方法 mock 好就可以測試 `matchStatus` 的轉移以及對應的事件或行為：

```ts
const mockSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  isConnected: vi.fn(() => false),
};

vi.mock('../useSocket', () => ({
  default: () => mockSocket,
}));
```

```ts
describe('狀態轉移', () => {
  it('設置為 waiting 時應該建立 socket 連線', () => {
    const { result } = renderHook(() => useMatch());

    act(() => {
      result.current.setMatchStatus('waiting');
    });

    expect(mockSocket.connect).toHaveBeenCalledWith({
      url: 'http://localhost:8080',
      query: { roomId: null },
    });
  });
```

因為每個測試案例都會透過 `renderHook` 重新製作一個獨立的值，所以要測試對應的狀態就要先進行一次 `act`，先把狀態轉到想要測試的那個值：

```ts
describe('Socket 事件處理', () => {
  it('處理配對成功事件時應該更新狀態', () => {
    const { result } = renderHook(() => useMatch());

    act(() => {
      result.current.setMatchStatus('waiting');
    });

    // 模擬配對成功事件
    const matchSuccessHandler = mockSocket.on.mock.calls
      .find(call => call[0] === 'match:success')?.[1];

    act(() => {
      matchSuccessHandler?.({ roomId: 'room123', userId: 'user456' });
    });

    expect(result.current.matchStatus).toBe('matched');
  });
```

所以一個測試案例裡面不一定只會有一個 `act`！

### 播放音效

和 `console`，多媒體元素的實例也會用 spy 來阻斷和模擬：

```ts
beforeAll(() => {
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
```

在收到訊息的案例中可以斷言音效會被播放 1 次：

```ts
it('處理收到訊息時應該更新訊息列表並播放音效', () => {
  const { result } = renderHook(() => useMatch());

  act(() => {
    result.current.setMatchStatus('waiting');
  });

  // 模擬配對成功
  const matchSuccessHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'match:success')?.[1];

  act(() => {
    matchSuccessHandler?.({ roomId: 'room123', userId: 'user456' });
  });

  const newMessage = {
    id: '1',
    roomId: 'room123',
    userId: 'anotherUser', // 來自其他使用者的訊息
    content: '測試訊息',
    createdAt: new Date(),
    device: 'PC',
  };

  // 模擬收到訊息事件
  const messageReceiveHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'chat:send')?.[1];

  act(() => {
    messageReceiveHandler?.(newMessage);
  });

  expect(result.current.messages).toContain(newMessage);

  // 播放 1 次
  expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
});
```

### useLocalStorage

`useMatch` 中有用到 Mantine 提供的 `useLocalStorage` 來操作瀏覽器的 `localStorage`，要不要 mock 它我覺得見仁見智，它本身邏輯算是單純，所以我認為用原始的 hook 也沒什麼問題。

反而是測試環境中要 mock 好瀏覽器環境才能操作的 `localStorage`，否則測試途中 `useLocalStorage` 會存取不了：

```ts
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useMatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });
```

這邊存取的 `localStorage` 就會是剛剛 mock 好的東西：

```ts
describe('重新載入', () => {
  it('當 localStorage 有 roomId 時應該設為 reloading 狀態', () => {
    localStorage.setItem('roomId', 'room123');

    const { result } = renderHook(() => useMatch());

    expect(result.current.matchStatus).toBe('reloading');
    expect(localStorage.getItem).toHaveBeenCalledWith('roomId');
  });
});
```

---

## 本日小結

業務邏輯的單元測試需要去驗證輸入輸出、計算邏輯的錯誤案例會不會如預期發生，所以需要考慮比較多邊界條件，畢竟原始資料壞掉可不是小事！

前端會需要事先準備好一些 Web API、前端框架的模擬方法，如果剛好該框架的官方文件也不是寫得很詳細，就會有種被搞到的感覺 XDDD

UI 元件的單元測試不太需要寫很多錯誤案例的原因，是因為 UI 元件通常已經被外部的狀態決定好怎麼顯示，除非內部有一些複雜的邏輯需要被檢驗。

咦......那 `page.tsx` 怎麼沒有被測到？因為~~我懶~~ page 元件是用來組合所有元件的，我個人覺得比較適合在整合測試中進行，也比較有意義！

---

## 參考資料

- [Testing with Vitest](https://mantine.dev/guides/vitest/)
- [[UT] What's unit test ? 在前端要測什麼 ?!](https://hsien-w-wei.medium.com/ut-whats-unit-test-%E5%9C%A8%E5%89%8D%E7%AB%AF%E6%98%AF%E8%A6%81%E6%B8%AC%E4%BB%80%E9%BA%BC-a11efc529204)
- [前端單元測試](https://www.youtube.com/playlist?list=PLsKJIR9go2Rne6kzKftZxeQHH9HvR0RdV)
