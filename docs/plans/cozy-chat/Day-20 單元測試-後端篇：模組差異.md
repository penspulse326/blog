---
title: 'Day 20 - 單元測試-後端篇：模組差異'
description: 'Cozy Chat 專案第 20 天：單元測試-後端篇：模組差異'
date: '2025-09-21 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day20'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1758443691000cme5c3.png)

做完 service 的測試後，接下來要對 model 與 socket 這些同樣重要的業務邏輯做測試，雖然測試的寫法很固定，但當中也會有和 service 不一樣的地方唷！

---

## model

model 層的測試會需要 mock 比較多東西：

1. `getCollection`：是我後來封裝的方法，作用一樣是取出對應的 collection
2. `mockCollection`：把有用到的 collection 方法都包進去
3. `mockFindCursor`：cursor 是 MongoDB 的 `find` 方法的回傳值
4. `mockCurrentDate`：和 service 的測試不同，model 內部不會有產時間的邏輯，所以這裡可以直接定值
5. `consoleErrorSpy`：model 層如果操作失敗，目前是透過 `console.error` 報錯，透過 spy 可以阻斷這個實例的行為，並置換掉方法，這樣在測試錯誤案例時才不會噴一堆訊息干擾測試

```ts
vi.mock('@/config/db', () => ({
  getCollection: vi.fn(),
}));

describe('User Model', () => {
  const mockCollection = {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    insertOne: vi.fn(),
    updateMany: vi.fn(),
  };

  const mockFindCursor = {
    toArray: vi.fn(),
  };

  // 統一使用固定值來測試
  const mockCurrentDate = new Date();

  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCollection).mockReturnValue(
      mockCollection as unknown as ReturnType<typeof getCollection>
    );
    mockCollection.find.mockReturnValue(mockFindCursor);

    // 監聽 console 的 error 方法並透過 mockImplementation 置換
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });
```

成功的案例都大同小異，來看看異常處理的案例：

```ts
describe('createUser', () => {
  it('當資料庫操作失敗時應返回 null', async () => {
    // arrange
    const mockUser = {
      createdAt: mockCurrentDate,
      device: 'APP' as Device,
      lastActiveAt: mockCurrentDate,
      status: 'ACTIVE' as UserStatus,
    };

    mockCollection.insertOne.mockRejectedValue(new Error('DB Error'));

    // act
    const actual = await userModel.createUser(mockUser);

    // assert
    expect(actual).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining(mockUser));
  });
});
```

這裡假設 MongoDB 的 `insertOne` 操作失敗，回傳了 `Error` 實例，`userModel.createUser` 的原始邏輯中，會觸發 `catch` 並執行 `console.error`，所以 `consoleErrorSpy` 應該會偵測到呼叫，所以可以斷言 `expect(consoleErrorSpy).toHaveBeenCalled()`

---

## socket

先前已經盡量縮端每個事件流程，讓每個函式的規模固定在 10~20 行內。但還是很難想像這部分的程式碼，要從什麼階段開始測試吧？光是環境設置就頭昏眼花 XD

這就是程式碼品質的一種警訊！

單元測試本身的架構與測試目的都是很明確的，照理來說不會太難寫，如果很難寫，可能是：

1. 不熟怎麼寫測試
2. 原始架構不太好

### 重構

前面雖然自我感覺良好地覺得「奇怪！程式碼明明就很少啊！」，但重新盤點的話，就會發現 `setupSocketServer` 裡面耦合了 `等待配對的使用者資料` 和相關的方法，這應該算是比較容易看出來的部分～

不同類型的事件也可以分別封裝，所以最後主邏輯只會剩下 `掛上 client 端的監聽`：

```ts
export function setupSocketServer(io: Server) {
  const waitingPool = createWaitingPool();
  const chatHandlers = createChatHandlers(io);
  const matchHandlers = createMatchHandlers(io, waitingPool);
  const userHandlers = createUserHandlers(io, chatHandlers);

  io.on('connection', (client: Socket) => {
    const roomId = client.handshake.query.roomId;

    if (typeof roomId === 'string' && roomId !== '' && roomId !== 'null') {
      void userHandlers.handleCheckUser(client.id, roomId);
    }

    client.on(MATCH_EVENT.START, (device: Device) => {
      void matchHandlers.handleMatchStart({ device, socketId: client.id });
    });

    client.on(MATCH_EVENT.CANCEL, () => {
      matchHandlers.handleMatchCancel(client.id);
    });

    client.on(MATCH_EVENT.LEAVE, (userId: string) => {
      void matchHandlers.handleMatchLeave(userId);
    });

    client.on(CHAT_EVENT.SEND, (data: SocketChatMessage) => {
      void chatHandlers.handleChatSend(data);
    });

    client.on('disconnect', () => {
      waitingPool.removeUserFromPool(client.id);
      console.log('使用者斷開連線:', client.id);
    });
  });
}
```

這樣測試就比較好分層處理囉！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1755764243000iz1ztf.png)

### test suite

環境設置會 mock 好幾個外部依賴，但我們不會用到完整的物件，所以需要用 `let` 宣告並加上 `Partial<T>`，在 test suite 的準備階段可以通過型別檢查，然後在 `beforeEach` 中去斷言成原本的型別。

```ts
vi.mock('@/socket/handlers/chat', () => ({
  createChatHandlers: vi.fn(),
}));

vi.mock('@/socket/handlers/match', () => ({
  createMatchHandlers: vi.fn(),
}));

vi.mock('@/socket/handlers/user', () => ({
  createUserHandlers: vi.fn(),
}));

vi.mock('@/socket/waiting-pool', () => ({
  createWaitingPool: vi.fn(),
}));

interface MatchHandlers {
  handleMatchCancel: (socketId: string) => void;
  handleMatchLeave: (userId: string) => Promise<void>;
  handleMatchStart: (newUser: any) => Promise<void>;
  notifyMatchLeave: (roomId: string) => void;
  notifyMatchSuccess: (clientId: string, userId: string, roomId: string) => Promise<void>;
}

interface MockServer extends Partial<Server> {
  connectionCallback?: (socket: Socket) => void;
}

describe('Socket Server', () => {
  let mockIo: MockServer;
  let mockSocket: Partial<Socket>;
  let mockState: Partial<WaitingPool>;
  let mockChatHandlers: Partial<ChatHandlers>;
  let mockMatchHandlers: Partial<MatchHandlers>;
  let mockUserHandlers: Partial<UserHandlers>;

  beforeEach(() => {
    mockSocket = {
      handshake: {
        address: '',
        auth: {},
        headers: {},
        issued: 0,
        query: {},
        secure: false,
        time: new Date().toString(),
        url: '',
        xdomain: false,
      },
      id: 'socket1',
      on: vi.fn(),
    };

    mockState = {
      removeWaitingUser: vi.fn(),
    };

    mockChatHandlers = {
      handleChatSend: vi.fn(),
    };

    mockMatchHandlers = {
      handleMatchCancel: vi.fn(),
      handleMatchLeave: vi.fn(),
      handleMatchStart: vi.fn(),
    };

    mockUserHandlers = {
      handleCheckUser: vi.fn(),
    };

    mockIo = {
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'connection') {
          mockIo.connectionCallback = callback;
        }
        return mockIo as Server;
      }),
    };

    vi.mocked(waitingPoolModule.createWaitingPool).mockReturnValue(mockState as WaitingPool);
    vi.mocked(chatHandlersModule.createChatHandlers).mockReturnValue(mockChatHandlers as ChatHandlers);
    vi.mocked(matchHandlersModule.createMatchHandlers).mockReturnValue(mockMatchHandlers as MatchHandlers);
    vi.mocked(userHandlersModule.createUserHandlers).mockReturnValue(mockUserHandlers as UserHandlers);

    vi.clearAllMocks();
  });
});
```

handler 的型別是在分離之後各自宣告出來，提供測試使用的：

```ts
export type MatchHandlers = ReturnType<typeof createMatchHandlers>;
```

雖然 `mockSocket` 只有用到 `query` 而已，但是要砍到只剩 `query` 的話，泛型會寫得很長，所以我就乾脆都寫出來了（？）我覺得測試不應該花太多時間去想泛型怎麼寫。

因為主邏輯變得很簡短，準備階段也幾乎 mock 掉需要的東西，所以測試案例沒有 arrange 的部分：

```ts
it('應該建立 socket 伺服器並設置連接處理程序', () => {
  setupSocketServer(mockIo as Server);

  expect(waitingPoolModule.createWaitingPool).toHaveBeenCalled();
  expect(chatHandlersModule.createChatHandlers).toHaveBeenCalledWith(mockIo);
  expect(matchHandlersModule.createMatchHandlers).toHaveBeenCalledWith(mockIo, mockState);
  expect(userHandlersModule.createUserHandlers).toHaveBeenCalledWith(mockIo, mockChatHandlers);
  expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
});
```

### handler

分離出來的 handler，要準備的是 socket server 的 mock，以及會呼叫到的 service 或其他 handler：

```ts
vi.mock('@/services/chat-room.service', () => ({
  default: {
    findChatRoomById: vi.fn(),
  },
}));

vi.mock('@/services/user.service', () => ({
  default: {
    checkUserStatus: vi.fn(),
  },
}));

describe('User Handlers', () => {
  let mockIo: Partial<Server>;
  let mockSocket: Partial<Socket>;
  let mockSocketsMap: Map<string, Socket>;
  let mockChatHandlers: Partial<ChatHandlers>;

  const mockCurrentTime = new Date();

  beforeEach(() => {
    mockSocket = {
      emit: vi.fn(),
      join: vi.fn().mockResolvedValue(undefined),
    };

    mockSocketsMap = new Map();
    mockSocketsMap.set('socket1', mockSocket as Socket);

    mockIo = {
      emit: vi.fn(),
      of: vi.fn().mockReturnValue({
        sockets: {
          get: vi.fn((id: string) => mockSocketsMap.get(id)),
        },
      }),
      to: vi.fn().mockReturnThis(),
    };

    mockChatHandlers = {
      handleChatLoad: vi.fn(),
      handleChatSend: vi.fn(),
    };

    vi.clearAllMocks();
  });
```

雖然這段準備還算好懂，但也蠻長的對吧？可以想像如果沒有分離出來，原本那一大包的東西不知道要寫多長的 mock 跟 hook，就算硬要寫可能也會再多塞一層 `describe`，我相信沒有人會承認這是一個乾淨有效的測試 XDDD

測試案例就依照原本的執行內容，變成單純的 AAA 模式囉：

```ts
describe('handleCheckUser', () => {
  it('當聊天室存在時，應該加入房間並載入聊天訊息', async () => {
    // arrange
    const userHandlers = createUserHandlers(mockIo as Server, mockChatHandlers as ChatHandlers);
    const socketId = 'socket1';
    const roomId = 'room123';

    vi.mocked(chatRoomService.findChatRoomById).mockResolvedValue({
      createdAt: mockCurrentTime,
      id: 'room123',
      users: ['user1', 'user2'],
    });

    vi.mocked(userService.checkUserStatus).mockResolvedValue(false);

    // act
    await userHandlers.handleCheckUser(socketId, roomId);

    // assert
    expect(chatRoomService.findChatRoomById).toHaveBeenCalledWith(roomId);
    expect(mockSocket.join).toHaveBeenCalledWith(roomId);
    expect(mockChatHandlers.handleChatLoad).toHaveBeenCalledWith(roomId);
    expect(userService.checkUserStatus).toHaveBeenCalledWith(roomId);
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
```

---

## function or class

NestJS 或是其他常見的後端語言，這些 server 常用的邏輯大多也採用 class，除了它們本身就是 class based 的語言之外，架構也比較好讀，TypeScript 也針對 class 的建構函式做了語法糖，所以依賴注入又變得更好寫，裝飾器也越來越常被使用。

不過在 ES6 之前，JavaScript 沒有 class 語法，保留狀態的方式就是靠 function 的閉包（closure），所以全部用 function 來寫也不會太抽象，照個人偏好選擇架構就好！

---

## 測試報告

撰寫測試時可以運行 `npx vitest`，Vitest 預設運行模式是 watch 模式，可以隨時觀察測試結果：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1755596958000ko1fin.png)

寫完大部分的測試後就可以用這個指令 `npx vitest run --coverage` 產生測試報告：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1755597044000zuv5qr.png)

後端的單元測試到這邊就差不多做完了！雖然還有部分的檔案沒有寫到單元測試，例如程式的啟動點 `index.ts`、資料庫連接，不過最基本的業務邏輯都已經有一定的覆蓋率，我覺得可以先放過自己（~~只是懶~~）XD

---

## 本日小結

今天的測試主要了解 model 層、socket 事件在測試上的差異，因為它們牽涉到比較多第三方套件的操作，所以要 mock 比較多東西，也包含了型別斷言。

其他的部分其實大同小異，照著 AAA 去寫就好，寫得不順就可以去思考是不是原始的邏輯應該要重構了～
