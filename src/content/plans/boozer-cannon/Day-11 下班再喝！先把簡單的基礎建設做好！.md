![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790290181000307ji4.webp)

開始實作後端之前，看看 Agent 產出的計劃如何：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790168845000sj6v2k.webp)

大概有遵守之前的要求，也有規劃要提交的 commit，那就來執行看看！

---

## ORM 設定

ORM 的設定不管哪一套都大同小異，通常會有：

1. Driver: 安裝該程式語言對應的資料庫 driver，例如 Node.js 就要 `npm i pg` (PostgreSQL)
2. Connection: ORM 與資料庫的連線設定
3. Schema: 資料模型
4. Migration: 將**程式碼**描述的資料模型轉換成真正的 SQL 語法
5. Seed: 填充初始資料

### Connection

把資料庫連線做成 provider，並設成 `@Global()`，讓之後其他模組操作時都可以引用到這個單例實例。這個做法算是 NestJS 的慣例。

```ts
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema.js";

export const DRIZZLE = Symbol("DRIZZLE");
export type DrizzleDB = NodePgDatabase<typeof schema>;

export const drizzleProvider = {
  provide: DRIZZLE,
  useFactory: (): DrizzleDB => {
    const connectionString =
      process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/boozer_cannon";
    const pool = new pg.Pool({
      connectionString,
    });
    return drizzle(pool, { schema });
  },
};
```

```ts
import { Global, Module } from "@nestjs/common";

import { DRIZZLE, drizzleProvider } from "./drizzle.provider.js";

@Global()
@Module({
  exports: [DRIZZLE],
  providers: [drizzleProvider],
})
export class DrizzleModule {}
```

### Schema

Drizzle 的 function 看起來跟 SQL 差不多，沒什麼抽象的障礙：

```ts
export const users = pgTable("users", {
  avatarUrl: varchar("avatar_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Migration

這是我去年重新接觸後端時，一時之間想不起來是在幹嘛的步驟 XD

到目前為止資料模型都是用**程式碼**寫出來的，要在 DB 建資料、洗資料、欄位變更等，就必須要寫 SQL 語法。

所以 ORM 通常會提供轉換成 SQL 的指令，Drizzle 就提供了自己的 CLI `drizzle-kit`，Agent 也幫我們產好對應的 script，直接用即可：

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "node --experimental-strip-types src/db/seed.ts",
  "db:studio": "drizzle-kit studio"
}
```

| 步驟          | 動作階段           | 執行指令                            |
| ------------- | ------------------ | ----------------------------------- |
| **1. 擴充**   | 定義領域模型       | 修改 `apps/server/src/db/schema.ts` |
| **2. 產生**   | 產生 Migration SQL | `pnpm db:generate`                  |
| **3. 遷移**   | 套用結構至資料庫   | `pnpm db:migrate`                   |
| **4. 檢查**   | 開啟視覺化管理 GUI | `pnpm db:studio`                    |
| **5. 灌資料** | 執行種子腳本       | `pnpm db:seed`                      |

要注意的是執行 `pnpm db:migrate` **不需要事先啟動 NestJS**，而是讀取 `drizzle.config.ts` 裡面的連線設定，直接對運行中的 DB 執行 SQL。

### Seed

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790172368000inyvh7.webp)

除了定義開發用的假資料，資料當然還要「灌」進去，所以 `seed.ts` 下面都是 DB 相關的寫入操作。

`"db:seed": "node --experimental-strip-types src/db/seed.ts"` 這個指令用了 Node.js 24 版的實驗性功能 Type Stripping。

這個功能可以讓 Node.js 不透過額外設定就能直接執行 `.ts` 檔，全部的型別宣告會在執行時移除，當成 `.js` 檔執行。

---

## GUI

以前要看 DB 通常會依賴一些 GUI，例如 DBeaver、TablePlus 等，但現在有些 ORM 也提供自己的 GUI，如果沒有什麼複雜的需求，拿來看看資料就夠用哩。

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17901729860009kut2k.webp)

看起來 Seed 的步驟有正確做好，這次 Agent 終於沒在鬧了......。

相較於前端，後端的程序比較固定，意圖也明確，所以我自己體感 Agent 在後端開發初期比較少凸槌，但後期就不知道了 XDDD

---

## 小結

- 思考資料庫作為一個 **應用程式**是怎麼運作的，就會理解建立資料庫的每個步驟
- 有些 ORM 自帶 CLI 與 GUI，已夠輕量使用
