---
title: 'Guard'
description: 'NestJS 的 Guard 概念'
date: 2025-05-02 19:33:00
keywords: [程式語言, 後端框架, 設計模式, 物件導向, 依賴注入, JavaScript, TypeScript, NestJS, OOP, DI]
tags: ['筆記', 'NestJS']
slug: nestjs-middleware
---

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1776849917000caugg4.png)

guard 會在 interceptor 前執行，通常會使用上下文來進行條件判斷，不符條件的請求就會被擋下。

## 架構

`canActivate` 是元件實際會執行的內容。

同 interceptor，可以透過 `ExecutionContext` 取得執行環境的上下文。

回傳值可以是 `Promise` 或 `Observable`，所以 guard 的程序可以是非同步的，程序會鎖在這裡，直到 NestJS 處理這些回傳值，取得 `boolean`，才會決定是否進行這個請求：

```ts
@Injectable()
export class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
```

利用 `context` 取得的資料進行條件判斷：

```ts
@Injectable()
export class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const auth = request.headers.authorization;
    const mockToken = 'Bearer TEST';

    return auth === mockToken;
  }
}
```

### 部分套用

使用 `@UseGuards` 套用在 handler 或是整個 controller：

```ts
@Get('/:id')
@UseGuards(TestAuthGuard)
testId(@Param('id') id: string) {
	return `test ${id}`;
}
```

```ts
@UseGuards(TestAuthGuard)
@Controller('test')
export class TestController {
  //...
}
```

### 全域套用

在根模組進行注入：

```ts
import { APP_INTERCEPTOR } from '@nest/core';

@Module({
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TestAuthGuard,
    },
  ],
})
export class AppModule {}
```

或是在啟動程序裡面呼叫 `useGlobalGuards` 並傳入實例：

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 建立實例
  app.useGlobalGuards(new TestAuthGuard());
  await app.listen(process.env.PORT ?? 3000);
}
```

---

## 小結

其他元件都可以透過拋出 exception 的方式中斷請求，但中斷的原因是依元件的職責而有所不同。

Guard 的主要職責是過濾權限的問題，例如 token、RBAC 等驗證。

---

## 參考資料

- [Guard](https://docs.nestjs.com/guards)
