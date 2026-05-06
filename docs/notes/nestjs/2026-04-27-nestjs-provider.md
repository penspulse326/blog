---
title: '[元件] Provider'
description: 'NestJS 的 Provider 概念'
date: 2026-04-27 17:55:00
keywords: [程式語言, 後端框架, 設計模式, 物件導向, 依賴注入, JavaScript, TypeScript, NestJS, OOP, DI]
tags: ['筆記', 'NestJS']
slug: nestjs-provider
---

## token

元件的實例化的過程會透過控制反轉容器 (IoC Container) 管理。

在單個 module 中實例化的順序是：

1. provider
2. controller
3. module

註冊到容器之後， 可以透過 token 名稱取得 provider 實例。

下面是宣告 token 名稱的幾種方式：

### useClass

在 module metadata 寫的 `providers` 預設是 `useClass`，例如 `TodoService` 這個類別定義會直接當成 token 名稱，因此 `useClass` 大多會直接縮寫：

```ts
@Module({
  //...
  // 預設的 token 就是 useClass 格式，可以縮寫成這樣
  providers: [TodoService],
})
export class TodoModule {}

@Module({
  //...
  // 完整的格式
  providers: [
    {
      provide: TodoService, // token 名稱
      useClass: TodoService, // token 回傳值
    },
  ],
})
export class TodoModule {}
```

---

### useValue

用字串設定 token 名稱並指定一個任意型別的回傳值：

```ts
{
  provide: 'TEST_USE_VALUE',
  useValue: '這是用 useValue 註冊的 provider',
}
```

使用裝飾器 `@Inject` 並傳入 token 名稱，被 `@Inject` 修飾的參數 `testUseValue` 就是這個 provider 實例：

```ts
@Controller()
export class AppController {
  constructor(
    // 在裝飾器傳入 token 名稱
    @Inject('TEST_USE_VALUE') private readonly testUseValue: string,
  ) {}

  @Get('test-use-value')
  getTestUseValue() {
    return this.testUseValue;
  }
}
```

---

### useFactory

用 callback 的方式產生回傳值。

`inject` 可以直接存取到其他 provider，然後在 callback 中呼叫這個 provider 的方法：

```ts
{
  provide: 'TEST_USE_FACTORY',
  inject: [AppService],
  useFactory: (appService: AppService) => {
    const result = appService.getHello();

    return `這是用 useFactory 註冊的 provider，這是從 AppService 拿到的資料 ${result}`;
  },
},
```

同樣使用裝飾器 `@Inject`：

```ts
@Controller()
export class AppController {
  constructor(@Inject('TEST_USE_FACTORY') private readonly testUseFactory: string) {}

  @Get('test-use-factory')
  getTestUseFactory() {
    return this.testUseFactory;
  }
}
```

也支援非同步 callback：

```ts
{
  provide: 'TEST_ASYNC_USE_FACTORY',
  inject: [AppService],
  useFactory: async (appService: AppService) => {
    const timeLimit = 1000;
    const result: string = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(appService.getHello());
      }, timeLimit);
    });

    return `這是用 async useFactory 註冊的 provider，這是從 AppService 拿到的資料 ${result}，耗時 ${timeLimit} 毫秒`;
  },
},
```

---

### useExisting

自訂一個 token 名稱來存取已經存在的 provider 實例：

```ts
{
  provide: 'TEST_USE_EXISTING',
  useExisting: AppService,
},
```

```ts
@Controller()
export class AppController {
  constructor(
    // 實際上這個 provider 就是 AppService
    @Inject('TEST_USE_EXISTING') private readonly testUseExisting: AppService,
  ) {}

  @Get('test-use-existing')
  getTestUseExisting() {
    return this.testUseExisting.getHello();
  }
}
```

---

## 變數管理

provider 的格式由 `Provider` 這個型別規定，因此可以用來宣告出物件資料再填入 module 的 `exports`：

```ts
const testUseValueProvider: Provider = {
  provide: 'TEST_USE_VALUE',
  useValue: '這是用 useValue 註冊的 provider',
};

@Module({
  providers: [testUseValueProvider],
  exports: [testUseValueProvider],
})
export class CustomModule {}
```

---

## 可選注入

依賴注入是在建構函式裡面**以參數的方式傳入實例**，使用 `@Optional` 表示該依賴是可選的，這樣注入時如果找不到相關的 provider 實例，也還是能順利啟動。

但是和標記 `?` 的參數一樣，沒有傳入就會變 `undefined`：

```ts
@Controller()
export class AppController {
  constructor(
    @Optional()
    @Inject('TEST_USE_EXISTING')
    private readonly testUseExisting: AppService,
  ) {}

  @Get('test-use-existing')
  getTestUseExisting() {
    if (!testUseExisting) {
      return '實例不存在';
    }

    return this.testUseExisting.getHello();
  }
}
```

---

## 小結

除了 controller 以外，大部分的邏輯元件都可以被歸類為 provider，只要留意匯入匯出。

到 provider 之後應該會對整個依賴注入和應用程式的基礎機制有點概念了！

---

## 參考資料

- [Custom providers](https://docs.nestjs.com/fundamentals/custom-providers#custom-providers-1)
