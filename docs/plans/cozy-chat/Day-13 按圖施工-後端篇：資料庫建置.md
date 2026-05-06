---
title: 'Day 13 - 按圖施工-後端篇：資料庫建置'
description: 'Cozy Chat 專案第 13 天：按圖施工-後端篇：資料庫建置'
date: '2025-09-14 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day13'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1757852722000rlr76q.png)

終於來到後端服務的重頭戲，目前會先以本機 DB 來開發為主，等有一定的完成度再接上雲端的 MongoDB Atlas。

## Docker 容器

利用 Docker 來啟動本機 DB 可以省下一些安裝 DB 應用程式的麻煩，不需要的時候也可以一鍵移除相關檔案。

在 `apps/server` 專案目錄中新增 `docker-compose.yml`:

```yml
services:
  mongodb:
    image: mongo:latest
    container_name: cozy-chat-db
    ports:
      - '27017:27017'
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME:-root}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-password}
    restart: always

volumes:
  mongodb_data:
```

DB 的帳號密碼這類的機敏資料，都會從 `.env` 或其他方式讀取，不會寫在原始碼中讓大家看光光：

```
PORT=8080

MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=1234
MONGODB_URI=mongodb://root:1234@localhost:27017
DB_NAME=cozychat
```

切換到 `apps/server` 後啟動容器看看：

```bash
docker-compose up -d
```

從 Docker Desktop 來看是正常運行的，那麼 MongoDB 的本機設定就算完成了......對，就是這麼簡單（？）

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1753252851000s9pwcw.png)

---

## 連線設定

操作 MongoDB 會通常會 Mongoose 這套 ODM，不過我自己實測後，總覺得跟 TS 配合不是很好，reddit 上有些開發者提到用原生的 MongoDB Driver 搭配 Zod 就可以產生資料型別與驗證，效果也蠻不錯，因此我決定試試看。

參照官方的教學，新增 `src/config/db.ts`，加入連線和斷線的邏輯：

```ts
import { MongoClient } from 'mongodb';

import type { Db } from 'mongodb';

let client: MongoClient;
let db: Db;

async function connectToDB() {
  try {
    client = new MongoClient(process.env.MONGODB_URI ?? 'mongodb://root:1234@localhost:27017');
    db = client.db(process.env.DB_NAME ?? 'cozychat');
    await client.connect();
    console.log('DB 連線成功');
  } catch (error) {
    console.error('DB 連線錯誤：', error);
    throw error;
  }
}

async function disconnectFromDB() {
  await client.close();
  console.log('DB 已斷開連線');
}

export { connectToDB, db, disconnectFromDB };
```

在 `index.ts` 的啟動步驟也要調整，因為 DB 連線是非同步，通常會確定 DB 接通後才進行 Server 啟動：

```ts
// index.ts
async function bootstrap() {
  try {
    await connectToDB();
    new SocketServer(new Server(server));

    server.listen(port, () => {
      console.log(`Server 啟動成功: *:${port}`);
    });
  } catch (error) {
    console.error('Server 啟動失敗:', error);
    await disconnectFromDB();
    process.exit(1);
  }
}
await bootstrap();
```

:::warning
DB 連線有問題的話，整個後端服務其實也差不多掛了......所以在 `catch` 使用終止程序的語法 `process.exit(1);` 直接停機吧！
:::

確認終端的 log 有連線進來的資訊就算是設定完連線了：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1753253808000mng8mf.png)

---

## 定義資料

接下來可以依照先前的規劃來定義每個 collection 的相關操作，在 MVC 架構中，這些直接操作資料庫的邏輯會歸類在 model 層。

新增 `src/models/user.model.ts` 並實作 `createUser`：

```ts
const userDtoSchema = z.object({
  id: z.string(),
  created_at: z.date(),
  device: z.enum(['APP', 'MB', 'PC']),
  last_active_at: z.date(),
  room_id: z.string().optional(),
  status: z.enum(['ACTIVE', 'LEFT']),
});

type UserDto = z.infer<typeof userDtoSchema>;

const createUserDtoSchema = userDtoSchema.omit({
  id: true,
  room_id: true,
});

type CreateUserDto = z.infer<typeof CreateUserSchema>;

type UserEntity = Omit<UserDto, 'id'> & { _id: ObjectId };

async function createUser(dto: CreateUserDto): Promise<UserDto | null> {
  const users = db.collection<OptionalId<UserEntity>>('users');

  try {
    const candidate = createUserDtoSchema.parse(dto);

    const result = await users.insertOne(candidate);
    console.log('新增 User 成功');

    if (result.acknowledged) {
      return {
        ...candidate,
        id: newObjectId.toString(),
      };
    }

    return null;
  } catch (error: unknown) {
    console.error('新增 User 失敗', error);

    return null;
  }
}
```

Zod 提供 `omit`、`pick` 等常用來控制物件屬性的語法，可以減少很多重複的 schema 撰寫，而且還可以透過 `z.infer` 把定義好的 schema 產出型別！

其他 model 和 CRUD 也是照類似的方式做出來，這邊就不放來洗版了～～

特別留意：

- 從 collection 取出來的資料，自動生成的 id 是 `{ _id: ObjectId }`，所以不能直接把 `UserDto` 拿來用，這裡我就重新做成 `type UserEntity`。

- `createUser` 是新增一筆資料，這時候還不會有 id，但流程上會造成讀寫 collection 時有型別檢查的問題，可以在泛型中加入 `OptionalId`：`db.collection<OptionalId<UserEntity>>('users')`。或是在 `insertOne` 時顯式生成 `new ObjectId()`

---

## 共用型別

剛剛定義 schema 時有產生型別，這些都可以放到共用庫！這也是最初採用 monorepo 架構的原因之一，也可以讓 model 和整個專案的程式碼更簡潔集中。

`device` 的定義是 `'PC'`、`MB`、`APP` 其中一個值，這種固定的資料通常也會做成常數型別，Zod 的 `z.infer` 也支援導出：

```ts
// 常數
export const Device = z.enum(['APP', 'MB', 'PC']);
export const UserStatus = z.enum(['ACTIVE', 'LEFT']);

// 導出型別
export type Device = z.infer<typeof Device>;
export type UserStatus = z.infer<typeof UserStatus>;

// zod schema
const userDtoSchema = z.object({
  id: z.string(),
  room_id: z.string(),
  device: Device,
  status: UserStatus,
  last_active_at: z.date(),
  created_at: z.date(),
});
```

共用庫的東西都需要經過 build 產生出編譯檔，才可以在子專案使用。新增 dev 指令，透過 `--watch` 來隨時重新編譯：

```json
"scripts": {
    "build": "tsc -p tsconfig.build.json",
    "dev": "tsc -p tsconfig.build.json --watch",
```

也可以整合到根目錄，確保啟動任何子專案時會**同時啟動共用庫**並即時編譯，達到熱重載的效果，這裡會需要 `npm-run-all` 這個套件來達到並行執行專案：

```json
"scripts": {
		"web:dev:app": "pnpm --filter @apps/web dev",
    "web:dev": "npm-run-all --parallel lib:dev web:dev:app",
		"server:dev:app": "pnpm --filter @apps/server dev",
    "server:dev": "npm-run-all --parallel lib:dev server:dev:app",
```

---

## 讀寫測試

最後來試試看新增一筆資料吧：

```ts
async function addFakeData() {
  const currentTime = new Date();
  const newUser = await userModel.createUser({
    device: 'APP',
    status: 'ACTIVE',
    last_active_at: currentTime,
    created_at: currentTime,
  });

  console.log('hello user', newUser);
}
```

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17535468710008d2q1d.png)

---

## 本日小結

有 AI 輔助之後，產生 Docker 設定檔與指令操作變得簡單很多，不過還是要了解 Docker 的運作原理，否則遇到一些 CI/CD 的問題會很頭痛 XD

---

## 參考資料

- https://www.mongodb.com/resources/products/compatibilities/using-typescript-with-mongodb-tutorial
- [TypeScript, Zod, and MongoDB: A Guide to Data Access Layer without ORM](https://dev.to/zzdjk6/typescript-zod-and-mongodb-a-guide-to-orm-free-data-access-layers-2ah5)
