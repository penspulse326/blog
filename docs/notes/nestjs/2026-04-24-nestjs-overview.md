---
title: '[概念] 預備知識'
description: 'NestJS 的預備知識'
date: 2026-04-24 17:55:00
keywords: [程式語言, 後端框架, 設計模式, 物件導向, 依賴注入, JavaScript, TypeScript, NestJS, OOP, DI]
tags: ['筆記', 'NestJS']
slug: nestjs-overview
---

## 前言

我在使用 Express 做了幾個小專案後比較有感的幾個點：

1. 幾乎沒有固定的範式

   > 雖然學 Java 通常不會一開始就學 Spring，同樣是先學習怎麼用比較原始的內建函式庫和基本套件把服務做出來，了解語言特性與後端服務的樣貌。
   >
   > 但專案一旦擴大，就很看開發者本身的架構經驗，所以有沒有範式還是差蠻多的，至少學好範式可以養成比較有組織性的撰寫習慣，雖然寫起來冗長但我認為是必要的 trade-off。

2. 套件整合：
   > Fastify 和 NestJS 整合許多常用的套件，更新框架的版本時，其依賴套件就會連帶更新，在 Express 就要自己一個一個調了。**更新經常要承擔壞掉的風險**是 JS 生態圈的通病，所以有一個整合好且長期維護的框架會省去很多麻煩。

我主要透過線上課程學習 NestJS，因此這邊的練習多以課程內容為主。當然，NestJS 的中文資源，一定會想到那位 XD

所以筆記彙整的內容如有雷同，來源皆參考這位大大的 [NestJS 帶你飛](https://ithelp.ithome.com.tw/users/20119338/ironman/3880) 以及他於 HiSKIO 開立的線上課程。

---

## 專案架構

NestJS 採用大量的設計模式 (Design Pattern)，建立好專案後，`/src` 預設有根模組 (root module) `AppModule` 的部分元件。

基本上就是將 MVC 架構拆分：

1. module：組織各個功能的元件，包含 controller、service 等
2. controller：處理請求的出入口，用來呼叫 service
3. service：處理業務邏輯，不直接操作資料模型

model 層再依據專案需求分出：

- entity：映射資料表的資料模型
- repository：操作 entity 進行資料庫的 I/O 程序

---

## 進入點

在 `main.ts` 會透過 `NestFactory.create` 傳入根模組來啟動整個應用程式：

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

NestJS 底層採用 Express/Fastify 這兩個 HTTP 框架，預設以 Express 啟動，要用 Fastify 的話可以傳入 [`NestFastifyApplication`](https://docs.nestjs.com/techniques/mvc#fastify) 這個泛型。

---

## 裝飾器語法

從根模組開始會看到以 `@` 開頭的裝飾器 (decorator) 語法，如 `@Module`、`@Controller` 等，在 NestJS 裡面會大量使用。

裝飾器是 TS 的實驗性功能，是**一種函式**，用來改寫裝飾器後面的程式碼，例如類別、函式、參數等都可以被裝飾器修改。

---

## 依賴注入

任何掛上 `@Injectable` 裝飾器的類別，都會變成**依賴注入 (Dependency Injection)** 的對象。

依賴注入是將實例化 (new) 的過程改為在外部完成後，**做為某個類別的建構函式的參數**，而不是在類別中手動實例化：

```ts
// 在 class 裡面實例化另外一個 class
class A {
  private readonly b: B = new B();
}

// 依賴注入：在建構函式的參數中傳入 class 實例
class A {
  constructor(private readonly b: B) {}
}
```

DI 主要的目的：

- 省去手動實例化的過程
- 降低類別間的耦合度
- 更容易測試

實例化會在控制反轉容器 (IoC Container) 裡面完成，確保每個掛上 `@Injectable` 的類別都**只會被實例化一次**，形成單例模式 (Singleton)，並統一管理實例的生命週期與作用域。

應用程式啟動時會從根模組解析所有類別的依賴關係，進行一系列的實例化，後面會再討論實例化順序。

:::info
在建構函式的參數通常會對實例標記 `private readonly`。  
`private` 限制存取的作用域，`readonly` 防止實例的來源被修改或是被重新賦值。
:::

---

## 元件

NestJS 的架構主要圍繞在 9 大元件的交互：

- Controller
- Provider
- Module
- Middleware
- Exception filter
- Pipe
- Guard
- Interceptor
- Custom decorator

是使用 NestJS 時必須優先知道的功能。

元件可以透過 CLI 快速生成一個有初始架構的程式碼：

```bash
nest generate <COMPONENT> <COMPONENT_NAME>
```

---

## 小結

- 裝飾器：一種用來修改參數、函式、類別等等的函式
- 依賴注入：實例化後才透過參數傳入，而不在一般業務流程或是建構函式中手動實例化
- DI 容器：在 NestJS 中用來存放有標記 `@Injectable` 類別的實例

使用 NestJS 需要的預備知識很多，光是元件就被分類成好幾種。但學習這種架構也會更了解 OOP 和設計模式的應用，很多語言也都有提供這種架構的框架。

---

## 參考資料

- [NestJS 帶你飛](https://ithelp.ithome.com.tw/users/20119338/ironman/3880)
- [NestJS 框架實戰指南｜無痛打造易維護的後端應用](https://hiskio.com/courses/1141?srsltid=AfmBOoqmFWqc2-ar_Sa5lb7OuQWw1mpWvS-L2RSy_oVFRPr9J6n4Krbk)
- [[學習筆記] 依賴注入(DI)](https://ithelp.ithome.com.tw/articles/10211847)
- [單例模式](https://zh.wikipedia.org/zh-tw/%E5%8D%95%E4%BE%8B%E6%A8%A1%E5%BC%8F)
