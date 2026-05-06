---
title: '[元件] Exception Filter'
description: 'NestJS 的 Exception Filter 概念'
date: 2026-04-28 17:55:00
keywords: [程式語言, 後端框架, 設計模式, 物件導向, 依賴注入, JavaScript, TypeScript, NestJS, OOP, DI]
tags: ['筆記', 'NestJS']
slug: nestjs-exception-filter
---

NestJS 的全域例外處理只會捕捉 `HttpException` 或它的子類別，所以接下來要先介紹這個 exception 的幾種用法。

## 標準 exception

`throw` 一個 `HttpException` 實例，建構函式傳入自訂訊息和狀態碼：

```ts
@Get('test-standard-exception')
getStandardException() {
  throw new HttpException('這是標準的 exception', HttpStatus.BAD_REQUEST);
}
```

```json
{
  "statusCode": 400,
  "message": "這是標準的 exception"
}
```

自訂訊息也可以傳入物件，覆蓋預設回應格式：

```ts
@Get('test-standard-exception')
getStandardException() {
  const customExceptionObj = {
    code: HttpStatus.BAD_REQUEST,
    msg: '這是自訂格式的標準 exception',
  };

  throw new HttpException(customExceptionObj, HttpStatus.BAD_REQUEST);
}
```

```json
{
  "code": 400,
  "msg": "這是自訂格式的標準 exception"
}
```

---

## 內建 exception

NestJS 有根據狀態碼的語意封裝好的 exception，例如 `UnauthorizedException`：

```ts
@Get('test-built-in-exception')
getBuiltInException() {
  throw new UnauthorizedException('這是內建的 unauthorized exception');
}
```

自動產生的回應物件多了 `error` 這個欄位描述這個 exception：

```json
{
  "message": "這是內建的 unauthorized exception",
  "error": "Unauthorized",
  "statusCode": 401
}
```

一樣可以自訂格式：

```ts
@Get('test-built-in-exception')
getBuiltInException() {
  const customBody = {
    code: HttpStatus.UNAUTHORIZED,
    msg: '這是自訂格式的 unauthorized exception',
  };

  throw new UnauthorizedException(customBody);
}
```

```json
{
  "code": 401,
  "msg": "這是自訂格式的 unauthorized exception"
}
```

---

## 自訂 exception

需要統一格式時也可以繼承 `HttpException` 再自定義類別：

```ts
export class CustomException extends HttpException {
  constructor() {
    super('自訂 exception 的錯誤', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
```

```ts
@Get('test-custom-exception')
getCustomException() {
  throw new CustomException();
}
```

---

## filter

不是 `HttpException` 的 error，需要另外設計 filter 元件才能自行處理，否則錯誤發生時一律回傳 `Internal server error`：

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

CLI 產生的初始架構是一個帶有 `@Catch` 裝飾器的類別：

```ts
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';

@Catch()
export class MyHttpFilter<T> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {}
}
```

例如要做一個捕捉 `HttpException` 的 filter，就會在 `@Catch` 傳入 `HttpException`，並拓展泛型 T，讓 `exception: T` 可以合法存取 `HttpException`：

```ts
@Catch(HttpException)
export class MyHttpFilter<T extends HttpException> implements ExceptionFilter {
  catch(exception: T, host: ArgumentsHost) {}
}
```

`@Catch()` 本質上是 `try&catch`，所以各種類型的 error 都可以接收：

```ts
// 同時處理多個 HttpException 類型的 exception
@Catch(
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException
)

// JavaScript 的錯誤
@Catch(ReferenceError)

// 全部的錯誤都捕捉，此時 exception: unknown
@Catch()
```

### ArgumentsHost

`host` 定義了一些方法來存取不同網路架構的介面 (interface)：

```ts
catch(exception: T, host: ArgumentsHost) {
  console.log(host.getType()); // 'http' | 'rpc' | 'ws'
  const httpCtx: HttpArgumentsHost = host.switchToHttp();

  // 指定為 Express 的 Response
  const response = httpCtx.getResponse<Response>();
  const message = exception.getResponse();
  const statusCode = exception.getStatus();

  const responseBody = {
    code: statusCode,
    message: message,
    timestamp: new Date().toISOString(),
  };

  // 同 Express 的 router，接上 .json 拋出回應
  response.status(statusCode).json(responseBody);
}
```

`ArgumentsHost` 的定義包含各網路架構，像 `HttpArgumentsHost` 就是標準的 HTTP 物件：

```ts
export interface HttpArgumentsHost {
  /**
   * Returns the in-flight `request` object.
   */
  getRequest<T = any>(): T;
  /**
   * Returns the in-flight `response` object.
   */
  getResponse<T = any>(): T;
  getNext<T = any>(): T;
}
```

:::info
`ctx.getResponse` 是取得 HTTP 物件。  
`exception.getResponse` 是取得 exception 的回應內容（來自 `throw` 一個 exception 時傳入建構函式的參數）。
:::

---

### 部分套用

使用 `@UseFilter` 掛在 controller 的 handler 上就可以套用指定的 filter：

```ts
@UseFilters(MyHttpFilter)
@Get('test-my-http-filter')
getHttpFilterException() {
  throw new UnprocessableEntityException('這是自訂 filter 的 422 錯誤');
}
```

掛在 `@Controller` 會套用到所有 handler：

```ts
@UseFilters(MyHttpFilter)
@Controller()
export class AppController {
  //...
}
```

---

### 全域套用

在根模組進行注入，有多個自訂 filter 需要套用時仍然共用 `APP_FILTER` 這個 token。

如果多個 filter 都可以捕捉到同類型的錯誤，會依照這裡的陣列順序套用：

```ts
import { APP_FILTER } from '@nest/core';

@Module({
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: MyHttpFilter,
    },
    {
      provide: APP_FILTER,
      useClass: BadRequestFilter,
    },
  ],
})
export class AppModule {}
```

或是在啟動程序裡面呼叫 `useGlobalFilters` 並傳入 filter 實例：

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 建立實例
  app.useGlobalFilters(new MyHttpFilter());
  await app.listen(process.env.PORT ?? 3000);
}
```

---

### 格式修正

目前的套用方式會得到這樣的回應：

```json
{
  "code": 422,
  "message": {
    "message": "這是自訂 filter 的 422 錯誤",
    "error": "Unprocessable Entity",
    "statusCode": 422
  },
  "timestamp": "2025-05-05T04:05:51.714Z"
}
```

外層的 `message` 不是單純的字串，而是內建 exception 的回應物件，因此需要調整 `exception.getResponse()` 的內容：

```ts
const message = (() => {
  const res = exception.getResponse();

  if (typeof res === 'string') {
    return res;
  }

  // 暫時斷言型別
  return (res as { message: string }).message;
})();
```

這樣 `throw` exception 時傳入建構函式的字串會作為 `message` 的值輸出，如果傳入物件就取出物件裡面的 `message`：

```ts
@Get('test-http-filter')
getHttpFilterException() {
  // 傳入字串
  throw new UnprocessableEntityException('這是自訂格式的 422 錯誤');
}
```

```json
{
  "code": 422,
  "message": "這是自訂格式的 422 錯誤",
  "timestamp": "2025-05-05T07:05:36.365Z"
}
```

不傳任何東西時會自動帶入內建 exception 的回應物件，所以也適用上面的斷言：

```ts
@Get('test-http-filter')
getHttpFilterException() {
  // 不傳任何東西
  throw new UnprocessableEntityException();
}
```

此時就會內建 422 的 `message`：

```json
{
  "code": 422,
  "message": "Unprocessable Entity",
  "timestamp": "2025-05-05T07:00:13.501Z"
}
```

---

## 小結

內建 exception 只要訂好回應格式，已經能應付大多情境。

接入外部服務或是 `ValidationPipe` 產生的報錯，也需要自訂統一格式的話，就會需要自己實作 filter。

---

## 參考資料

- [Exception filters](https://docs.nestjs.com/exception-filters)
