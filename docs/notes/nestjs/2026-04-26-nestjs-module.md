---
title: '[元件] Module'
description: 'NestJS 的 Module 概念'
date: 2026-04-26 17:55:00
keywords: [程式語言, 後端框架, 設計模式, 物件導向, 依賴注入, JavaScript, TypeScript, NestJS, OOP, DI]
tags: ['筆記', 'NestJS']
slug: nestjs-module
---

## 作用域的限制

module 生成後可以自己填入 metadata：

- `controllers`：註冊 controller 元件
- `providers`：註冊可以被注入的 service、repository 等元件
- `exports`：將 provider 匯出，供其他 module 使用
- `imports`：匯入其他 module，匯入後就能使用其他 module 中 `exports` 裡列出的 provider

```ts
@Module({
  controllers: [TodoController],
  providers: [TodoService],
  exports: [TodoService],
  imports: [UserModule],
})
export class TodoModule {}
```

module 會規範好作用域，`controllers` 和 `providers` 只能填入該模組下的元件，否則會因為無法找到正確的依賴而報錯。

### imports / exports

module 中以 `@Injectable` 標記的元件，如 service 或是自訂的 provider，使用 `exports` 匯出後在其他模組就可以用 `imports` 匯入：

```ts
// 將 CopyService 填入 CopyModule 的 exports
@Module({
  //...
  exports: [CopyService],
})
export class CopyModule {}

// 在 TodoModule 的 imports 載入 CopyModule
@Module({
  //...
  imports: [CopyModule],
})
export class TodoModule {}
```

如果有一邊忘了做匯入或匯出，會產生注入失敗的報錯：

```ts
// 這個 import 匯入類別的定義
import { CopyService } from 'src/copy/copy.service';

// NestJS 用 CopyService 這個標記去尋找依賴注入容器中的實例時會報錯
@Controller('todos')
export class TodoController {
  constructor(private readonly copyService: CopyService) {}

  @Get('copy')
  getCopy() {
    return this.copyService.getCopy();
  }
}
```

---

## 常用模組

經常一起呼叫的模組，可以包成常用模組 (common module) 一起匯出：

```ts
@Module({
  imports: [TodoModule, CopyModule],
  exports: [TodoModule, CopyModule],
})
export class CommonModule {}
```

---

## 全域模組

在 `@Module` 前加入 `@Global()`，就會被標記成全域模組：

```ts
@Global()
@Module({
  imports: [TodoModule, CopyModule],
  exports: [TodoModule, CopyModule],
})
export class CommonModule {}
```

在根模組匯入後，其他模組使用時不用再次 `imports`：

```ts
// 在根模組匯入
@Module({
  controllers: [AppController, TodoController],
  providers: [AppService],
  imports: [TestModule, CommonModule],
})
export class AppModule {}
```

```ts
import { Module } from '@nestjs/common';
import { TestController } from './test.controller';

@Module({
  controllers: [TestController],
  // 不用寫 imports
})
export class TestModule {}
```

成功呼叫：

```ts
import { Controller, Get } from '@nestjs/common';
import { TodoService } from 'src/todo/todo.service';

@Controller('test')
export class TestController {
  constructor(private readonly todoService: TodoService) {}

  @Get()
  getTest() {
    return this.todoService.getTodos();
  }
}
```

---

## 小結

module 用來限制該資料夾下所有元件的作用域，由 `imports` 和 `exports` 來決定 module 可以存取的元件。

---

## 參考資料

- [Modules](https://docs.nestjs.com/modules)
