---
title: 'Day 19 - 單元測試-後端篇：起手式'
description: 'Cozy Chat 專案第 19 天：單元測試-後端篇：起手式'
date: '2025-09-20 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day19'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758380127000paslve.png)

不論是手動去操作產品，或是寫單元測試、腳本來測試，做出來的東西都需要被經過「驗證」，才算是做完了。在比較嚴格的委託中，乙方也會被要求專案必須通過一定程度的測試覆蓋率。

我沒有學過測試，所以接下來的內容不一定會很精準或是實用，僅以我 AI 大哥以及 Udemy 的某堂課吸收到的知識，統整我的實作過程，還請見諒！

## 單元測試的起點

測試大多會從兩個地方開始下手：

1. 核心業務邏輯：如 service、model、event handler 等主導核心功能的流程
2. 常用的輔助函式：如格式化、數值轉換等，這些函式的功能單一，輸入輸出明確，最容易寫測試

所以單元測試的重點和目的在於：

1. `被測試的函式可以獨立運作`：檢驗程式碼的耦合度，預防改 A 壞 B，或是突發狀況時容易追蹤
2. `可預期的輸入輸出`：防止隱式行為或是誤用外部依賴後產生的錯誤輸出

接下來我選擇從 `user.service.ts` 開始進行。

---

## 環境設置

先前的模板是安裝了 Vitest，語法和 Jest 和差不多，它們都是可以單獨運行的 Test Runner，做好設定就可以正常跑起來。測試是軟體工程的共通語言，所以大部分語言的測試也都是類似的語法和模式！

在實作之前需要先進行一些套用需要到整個測試模組的設定，例如準備被替換的外部依賴：

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

import userModel from '@/models/user.model';
import userService from '@/services/user.service';

// 模擬 user model
vi.mock('@/models/user.model', () => ({
  default: {
    createUser: vi.fn(),
  },
}));
```

`vi.mock` 用來模擬外部依賴，後續有用到其他要被模擬的東西可以在這裡加上去。 `default` 代表 `export default`。

---

## 測試區塊

接下來要先從 `createUser` 這個方法開始實作。

`describe` 會建立一個測試區塊（test suite），`describe` 會搭配 `beforeEach`、`afterAll` 之類的 hook，讓每個案例在執行前後會附帶執行 hook。

hook 最常用來清除模擬資料或是共用狀態，因為被模擬的資料會受到 Test Runner 控制，例如偵測執行次數、改變模擬結果等等，這些都會影響下一個測試的執行，所以一般會透過 hook 做清理。

內層的 `describe` 用來建立每個要被測試的函式，裡面的 `it` 則是該函式的各種案例，`describe` 與 `it`（同 `test`）的第 1 個參數都是描述案例用的字串：

```ts
describe('User Service', () => {
  // 在每個測試前重置所有 mock
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    // case 1: 成功建立 user
    it('應該使用正確的資料建立使用者', async () => {});
  });
});
```

---

## AAA 模式

每個測試案例大多會以 AAA 來進行：

1. Arrange（準備）: 設定測試資料
2. Act（執行）: 呼叫要測試的函數
3. Assert（驗證）: 檢查結果是否符合預期

測試的語法都很語義化，不太需要硬背，但第一次寫可能要跟 AI 一起 pair programming 才會比較快理解整個測試流程以及常用語法：

```ts
it('應該使用正確的資料建立使用者', async () => {
  // Arrange
  const mockUserData = {
    device: 'APP' as Device,
    socketId: 'socket123',
  };
  const mockInsertResult = {
    createdAt: ANY_DATE,
    device: 'APP' as Device,
    id: 'mockUserId1',
    lastActiveAt: ANY_DATE,
    socketId: 'socket123',
    status: 'ACTIVE' as UserStatus,
  };
  vi.mocked(userModel.createUser).mockResolvedValue(mockInsertResult);

  // Act
  const actual = await userService.createUser(mockUserData);

  // Assert
  expect(actual).toBe(mockInsertResult);
  expect(userModel.createUser).toHaveBeenCalledTimes(1);

  const calledWith = vi.mocked(userModel.createUser).mock.calls[0][0];
  expect(calledWith).toEqual(
    expect.objectContaining({
      createdAt: expect.any(Date),
      device: 'APP',
      lastActiveAt: expect.any(Date),
      status: 'ACTIVE',
    }),
  );
});
```

試試看測試的結果吧！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1755245486000bksps9.png)

---

## Arrange

準備階段可以看到一些常數或斷言的資料，以剛剛的範例來看：

`ANY_DATE` 是在外層的 test suite 定義的，並且使用斷言 `expect.any(Date)` ：

```ts
describe('User Service', () => {
  const ANY_DATE = expect.any(Date);
```

在 `it` 內宣告也可以通過，因為這個斷言本身是在驗證 `createUser` 回傳的結果 `actual`，時間相關的格式是否為 `Date` 物件。

直接宣告成一個純值 `const ANY_DATE = new Date()` 不行嗎？

這邊要特別注意，我們斷言出來的時間常數 `ANY_DATE` 是用來 mock 這個方法 `userModel.createUser` 的回傳值 ：

```ts
const mockInsertResult = {
  createdAt: ANY_DATE,
  device: 'APP' as any,
  id: 'mockUserId1',
  lastActiveAt: ANY_DATE,
  socketId: 'socket123',
  status: 'ACTIVE' as any,
};
vi.mocked(userModel.createUser).mockResolvedValue(mockInsertResult);
```

而 `userService.createUser` 原始的邏輯就會生成一個時間 `new Date()`，**所以 `actaul` 的時間絕對和 mock 資料時先宣告出來的時間不同**，最後測試失敗：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758356729000mmwvqv.png)

如果一定要固定時間的話，可以搭配 hook 和 `vi` 方法設定定值：

```ts
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2023-01-01'));
});

it('應該使用正確的資料建立使用者', async () => {
  const expectedDate = new Date('2023-01-01');
```

在假資料中也經常使用 `as any` 斷言，但因為是假的，不一定符合參數中的型別，所以會透過 `as` 斷言來處理，如果有已經存在的型別也可以不使用 `any`，如：`device: 'APP' as Device`。

---

## Act

這裡比較單純，執行要測試的函式，結果的命名慣例是 `actual`：

```ts
const actual = await userService.createUser(mockUserData);
```

某些情境下可能會多次執行，會對後面的斷言產生一點影響，稍後也會說明！

---

## Assert

```ts
expect(actual).toBe(mockInsertResult);
expect(userModel.createUser).toHaveBeenCalledTimes(1);

const calledWith = vi.mocked(userModel.createUser).mock.calls[0][0];
expect(calledWith).toEqual(
  expect.objectContaining({
    createdAt: ANY_DATE,
    device: 'APP',
    lastActiveAt: ANY_DATE,
    status: 'ACTIVE',
  }),
);
```

驗證階段就是 `expect` 斷言登場的地方，主要有：

1. 執行結果 `actual` 是否符合預期，通常用 `toBe`（純值） 或 `toEqual`（物件）
2. 透過 `toHaveBeenCalledTimes` 驗證外部依賴被呼叫幾次
3. 透過 `mock.calls` 驗證外部依賴被呼叫時傳入的內容是否符合預期，第一個索引代表 `第幾次呼叫`，第二個索引代表 `第幾個參數`

---

## AI 輔助列舉案例

在撰寫錯誤案例時通常不需要列舉所有的資料組合格式，先補足常見的邊界條件就好，例如最大值、異常值、錯誤處理。

因為測試的模式很固定，所以讓 AI 自己分析完原始邏輯後，自動產出的準確度通常不錯，可以完成到六七成。

但是 AI 本身絕對不會比我們更了解功能需求，所以它列舉的案例不一定全部都是我們想要的，千萬別想 AI 產完就交差了 XDDD **親自看過** AI 的產出結果才是比較負責任的態度。

而且產出很多時候不一定有一致性，像是我收到的結果中就摻雜了 Zod 的 schema 驗證函式，但目前在做的是 service 層的測試，不應該去模擬 model 層裡面的實作，只模擬輸入輸出：

```ts
// 模擬 Zod 驗證
vi.mock('@packages/lib', () => ({
  CreateChatMessageSchema: {
    parse: vi.fn().mockImplementation((data: unknown) => data),
  },
}));
```

---

## 本日小結

今天統整了測試的起手式，後端跟前端比起來其實沒什麼事前準備（~~爆雷~~），因為都是單純的資料吞吐，只要盡可能列舉出影響到輸出結果或是程序崩潰的邊界條件就好。

最重要的觀念還是「單元測試的目的」，所以準備好執行環境的隔離，只 mock 該 mock 的東西，測試才會穩定且有意義。

---

## 參考資料

- [Unit Testing for Typescript & NodeJs Developers with Jest](https://www.udemy.com/share/103Vk43@LQ6IzbAxh8--6quIrQ_snb0ZfhpL1mVIPivMP1JJI5lqcyDkbqllVJDoxInxPEzH/)（無葉佩，單純說明我的測試是從這裡學的）
- [[UT] What's unit test ? 在前端要測什麼 ?!](https://hsien-w-wei.medium.com/ut-whats-unit-test-%E5%9C%A8%E5%89%8D%E7%AB%AF%E6%98%AF%E8%A6%81%E6%B8%AC%E4%BB%80%E9%BA%BC-a11efc529204)
