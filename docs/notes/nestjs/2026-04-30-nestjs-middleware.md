---
title: '[元件] Middleware'
description: 'NestJS 的 Middleware 概念'
date: 2026-04-30 19:33:00
keywords: [程式語言, 後端框架, 設計模式, 物件導向, 依賴注入, JavaScript, TypeScript, NestJS, OOP, DI]
tags: ['筆記', 'NestJS']
slug: nestjs-middleware
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17780355150001d7sqw.png)

功能同 Express 的 middleware，可以存取請求物件、回應物件，並透過 `next` 繼續運行流程。

本篇主要介紹 class middleware（functional middleware 同 Express 就不多介紹）。

## class middleware

`use` 是元件實際會執行的內容。

CLI 產生的初始架構中 `req` 與 `res` 是 `any`，要自行替換成專案目前使用的底層 HTTP 框架（Express 或 Fastify）的型別：

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const resource = req.originalUrl;

    console.log(`這是 ${method} ${resource} 觸發的 TestLoggerMiddleware`);

    next();
  }
}
```

### 部分套用

middleware 需要在 module 元件中設定好哪些路由的請求會觸發。

在 `forRoutes` 填入要匹配的路由：

```ts
@Module({
  imports: [TestModule],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TestLoggerMiddleware).forRoutes('/test');
  }
}
```

:::info
根據 middleware 的功能來決定要在哪個 module 底下套用即可。全域性質的功能通常都統整在根模組。
:::

也可以直接指定某個 controller 下面的所有路由：

```ts
consumer.apply(TestLoggerMiddleware).forRoutes(TestController);
```

可以傳入多個 middleware，會依照順序執行：

```ts
consumer.apply(TestLoggerMiddleware, SayHelloMiddleware).forRoutes('/test');
```

### 全域套用

`forRoutes` 傳入 `'*'` 匹配全部的路由，讓所有請求都執行：

```ts
consumer.apply(TestLoggerMiddleware).forRoutes('*');
```

或是在啟動程序中透過 `app.use` 傳入 middleware，但這個做法**僅限 functional middleware**：

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(TestLoggerMiddleware);
  await app.listen(process.env.PORT ?? 3000);
}
```

---

## 限制路由

`forRoutes` 可以設定更嚴格的匹配規則，例如請求必須是 `GET` 方法才執行：

```ts
consumer.apply(TestLoggerMiddleware).forRoutes(
  {
    path: '/test',
    method: RequestMethod.GET,
  },
  {
    path: '/qq',
    method: RequestMethod.GET,
  },
);
```

也可以串上 `exclude` 排除特定路由：

```ts
consumer
  .apply(TestLoggerMiddleware)
  .exclude({
    path: '/qq',
    method: RequestMethod.GET,
  })
  .forRoutes('/test');
```

---

## 小結

middleware 僅能存取基本的請求、回應物件，適合處理與**業務邏輯無關**的底層需求：

- 日誌記錄 (Logging)： 記錄所有進入伺服器的 HTTP 請求基本資訊
- 請求預處理： 例如解析 Cookie、處理特定的 Header 或執行 `body-parser`
- 跨域處理 (CORS)： 設定請求來源許可

---

## 參考資料

- [Middleware](https://docs.nestjs.com/middleware)
