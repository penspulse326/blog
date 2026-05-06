---
title: '[元件] Custom Decorator'
description: 'NestJS 的 Custom Decorator 概念'
date: 2026-05-03 19:33:00
keywords: [程式語言, 後端框架, 設計模式, 物件導向, 依賴注入, JavaScript, TypeScript, NestJS, OOP, DI]
tags: ['筆記', 'NestJS']
slug: nestjs-custom-decorator
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17780355150001d7sqw.png)

自訂裝飾器本身會在 class 定義時執行，主要用來設定 metadata 或建立參數解析邏輯。而這些結果會在請求流程中，例如 guard、pipe 被使用。

## Metadata 裝飾器

透過 CLI 產生的 decorator 預設是 metadata 裝飾器：

```ts
import { SetMetadata } from '@nestjs/common';

export const TestMetadata = (...args: string[]) => SetMetadata('test', args);
```

一般是掛在 handler，或是掛在 controller 來套用到全部的路由上：

```ts
@Get()
@UseGuards(TestAuthGuard)
@TestMetadata('test', 'test2')
test() {
  return 'test';
}
```

```ts
@Controller('test')
@TestMetadata('test', 'test2')
```

metadata 在能注入 `Reflector` 且擁有 `ExecutionContext` 的元件都能使用，一般多用在 guard 或 interceptor。

在建構函式中注入 `Reflector` 後就可以在 `context.getHandler` 取得 metadata：

```ts
@Injectable()
export class TestAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const handler = context.getHandler();
    const handlerMeta = this.reflector.get<string[]>('test', handler);
    console.log('handlerMeta', handlerMeta);

    return true;
  }
}
```

:::info
如果是掛在 controller 上，要改由 `context.getClass` 來取得 metadata。
:::

---

## Param 裝飾器

`createParamDecorator` 的參數是一個工廠函式，由我們來決定怎麼處理工廠函式的參數，`data: string` 代表要傳入裝飾器的資料類型：

```ts
export const TestParams = createParamDecorator((data: string, context: ExecutionContext) => {});
```

下面示範從請求物件取出資料，並與 `data` 結合：

```ts
export const TestParams = createParamDecorator((data: string, context: ExecutionContext) => {
  const ctx = context.switchToHttp();
  const request = ctx.getRequest<Request>();
  const id = request.params.id;
  const name = data || 'default name';

  return { id, name };
});
```

`return` 的內容 `{ id, name }` 會在 `handler` 中透過被 `@TestParams` 修飾的參數來接收，就像 `@Query` 或 `@Param` 的用法：

```ts
@Controller('test')
export class TestController {
  @Get('/:id')
  testId(@TestParams('窩愛尼') data: { id: string; name: string }) {
    const message = `test params: ${data.id} and name: ${data.name}`;

    return message;
  }
}
```

所以 `data` 的型別要與剛剛在 `createParamDecorator` 在工廠函式定義的 `return { id, name }` 相同。

假設請求的網址是 `/test/123`，`message` 會是 `'test params: 123 and name: 窩愛尼'`。

---

## 裝飾器組合

常用的裝飾器可以透過 `applyDecorators` 組合，讓程式碼更乾淨。

組合後的裝飾器所接收的參數，可以在工廠函式的參數 `...args`：

```ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { TestAuthGuard } from 'src/test-auth/test-auth.guard';
import { TestMetadata } from './test.decorator';

export const TestComposition = (...args: string[]) => applyDecorators(UseGuards(TestAuthGuard), TestMetadata(...args));
```

```ts
@Get()
@TestComposition('Here is metadata from TestComposition')
test() {
  return 'test';
}
```

傳入的 metadata `'Here is metadata from TestComposition'` 透過 `TestMetadata` 可以在 `Reflector` 查看。

---

## 小結

由於裝飾器本身能夠取得 `ExecutionContext`，所以通常會搭配 guard 或 interceptor 在請求進入主要邏輯之前協同處理。

---

## 參考資料

- [Custom decorator](https://docs.nestjs.com/custom-decorators)
