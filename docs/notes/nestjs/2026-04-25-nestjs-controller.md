---
title: '[元件] Controller'
description: 'NestJS 的 Controller 概念'
date: 2026-04-25 17:55:00
keywords: [程式語言, 後端框架, 設計模式, 物件導向, 依賴注入, JavaScript, TypeScript, NestJS, OOP, DI]
tags: ['筆記', 'NestJS']
slug: nestjs-controller
---

## 路由

應用程式啟動時會建立一個路由表，路由名稱透過 `@Controller` 傳入元數據 (metadata），並將這個元數據註冊到路由表，如：

```ts
@Controller('todos')
export class TodoController {}
```

`'todos'` 就會被註冊成可以存取的端點，可以透過 `http://localhost/todos` 這樣的網址發送請求。

:::info
`@Controller` 也會被註冊到 IoC Container 裡面。
:::

---

## 請求

須使用 HTTP method 裝飾器，才會將對應方法 (handler) 註冊到路由表，如：

```ts
@Controller('todos')
export class TodoController {
  @Get()
  getTodos() {
    return [];
  }
}
```

此時對 `/todos` 發送 GET 請求，執行 `getTodos` 成功的話會並得到 `[]`。

---

## 子路由

在 `@Get` 傳入字串會生成子路由的端點，如 `@Get('sub')`表示 `/todos/sub` ：

```ts
@Controller('todos')
export class TodoController {
  @Get()
  getTodos() {
    return [];
  }

  @Get('sub')
  getTodo() {
    return '這是子路由';
  }
}
```

---

## 通用路由

透過 `*`、`+`、`?` 等匹配特定條件的路徑，如：

```ts
// 這樣可以匹配 todos/bulk/goooooooood
@Get('bulk/goo*d')
getGood() {
  return '這是 /bulk 下面的通用路由 goo*d';
}
```

---

## 裝飾器

`handler` 的參數可以用裝飾器來解析資料，如：

- `@Param`
- `@Query`
- `@Body`
- `@Header`

還有其他裝飾器，網路請求可以帶的物件資料都有對應的裝飾器可以解析。

### @Param

```ts
// 解析 /todos/:id
@Get(':id')
getTodo(@Param() param: { id: string }) {
  return `這是 id 為 ${param.id} 的子路由`;
}

// 更簡短的寫法，在裝飾器中指定 key
@Get(':id')
getTodo(@Param('id') id: string) {
  return `這是 id 為 ${id} 的子路由`;
}
```

### @Query

```ts
// 解析 /todos?limit=3&offset=3
@Get()
getTodos(
  @Query('limit') limit?: string,
  @Query('offset') offset?: string
) {
  if (!limit) {
    return this.todos;
  }

  if (!offset) {
    offset = '0';
  }

  const limitNum = parseInt(limit);
  const offsetNum = parseInt(offset);

  return this.todos.slice(offsetNum, offsetNum + limitNum);
}
```

### @Body

```ts
// 解析 request body
@Post()
createTodo(@Body() data: { content: string }) {
  const newTodo = {
    id: this.todos.length + 1,
    content: data.content,
  };

  this.todos.push(newTodo);

  return newTodo;
}
```

### @HttpCode

除了 POST 請求會回應 `201` 之外，其他方法預設都會回應 `200`，如果要自訂回傳的狀態碼，可以使用 `@HttpCode` 裝飾器，並傳入內建常數 `HttpStatus`：

```ts
// 請求成功時使用 NO_CONTENT 映射出來的 204 作為狀態碼
@Get()
@HttpCode(HttpStatus.NO_CONTENT)
getTodos() {
  return [];
}
```

`HttpStatus` 裡面是用 `enum` 型別宣告的狀態碼映射值。

---

## 回應

controller 有 3 種方式處理回應：

1. 標準模式
2. RxJS 模式
3. 函式庫模式

### 標準模式

標準模式支援同步和非同步，也是官方推薦的方式：

```ts
@Get()
getData() {
  return [];
}

// 被 setTimeout 延遲，會晚一點收到回應
@Get()
async getAsyncData() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([]), 1000);
  })
}
```

### RxJS 模式

回傳一個 Observable 物件 `of`，NestJS 會訂閱這個物件的狀態，`of` 後面可以鏈式串上各種 RxJS 組織資料的方法，整個鏈式的任務結束後會將最後形成的資料送出。

對外部來說，這個仍然是一個非同步的呼叫，在 RxJS 的任務走完到送出回應之前，都是 pending 的狀態。

```ts
import { catchError, map, of } from 'rxjs';

// 使用 RxJS 的鏈式方法重新組織資料
@Get('data/rxjs')
getRxjsData() {
  return of(this.todos).pipe(
    map((todos) =>
      todos.map((todo) => ({
        ...todo,
        status: 'active',
      })),
    ),
    catchError((err) => {
      console.error('Error occurred:', err);
      return of([]);
    }),
  );
}
```

### 函式庫模式

從底層的 API 來控制回應內容，需要在 handler 裡面加入裝飾器標記，如 `@Request`、`@Response`、`@Next`，對應到 Express 的 `req`、`res`、`next`，加上標記後就如使用 Express 一樣：

```ts
@Get('data/lib')
getLibraryData(@Res() res: Response) {
  res.status(200).send('這是從 library 來的資料');
}
```

通常會在以下情境使用函式庫模式：

1. 串流任務 (streaming)
2. 某些套件只支援 Express 的回應物件
3. 完全控制回應程序的設定與資料

因為會繞過 NestJS 的設定與元件流程，所以回應內容與格式要自行調整。

---

## 小結

controller 的功能與一般 MVC 架構類似，只是大部分的操作都需要用裝飾器取代，但只要記得 `裝飾器是一種函式`，給出對應的參數就能得到相應的操作，減少反覆宣告、賦值等等的程式碼。

---

## 參考資料

- [Controllers](https://docs.nestjs.com/controllers)
- [of](https://www.learnrxjs.io/learn-rxjs/operators/creation/of)
