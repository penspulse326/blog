![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790377837000yb905l.webp)

終於要來刻功能了！我要求以 **TDD** 的方式開發，雖然我自己的 skill 裡面有限制「一個方法最多不超過 50 行」，不過這**不代表程式碼越少就越好讀**，主要還是**語意是否明確**。

如果太多不直覺的做法，後續檢查起來會很辛苦，用 TDD 就可以先初步降低這個問題，建立好基本的測試架構後也可以回頭來看看到底有沒有測對東西。

---

## Model

Agent 的實作計劃中並沒有分離 model 或是 repository，因為 Drizzle 的使用定位比較接近 query builder，再抽象一層貧血模型的意義不大。

支援 TypeScript 的 query builder 大多也具備型別推導的功能，所以不太需要去封裝 data mapping class，較複雜的查詢也可以抽成函式，類似 composable / hook 的概念。

實際在 service 裡面的邏輯看起來就像 SQL，單元測試也是簡單到不行 XD

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790245605000www7fe.webp)

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790245631000tc3sko.webp)

---

## DTO

去年的鐵人賽我使用 Zod 作為 DTO 的工具，那 NestJS......當然也可以使用了，前後端都是 TypeScript 時，我認為 Zod 比 class validator 更適合。

自訂 pipe 來載入 Zod 的方法：

```ts
import type { ZodSchema } from "zod";

import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        errors: result.error.flatten(),
        message: "Validation failed",
      });
    }
    return result.data;
  }
}
```

在 controller 使用時也非常簡單，就像一般的 pipe，把寫好的 Zod schema 傳入，就會進到 `transform` 執行了：

```ts
@Get(':id')
  async getRecipe(@Param('id', new ZodValidationPipe(recipeIdSchema)) id: string) {
  return await this.recipesService.findOne(id);
}
```

但回頭檢查一下 Agent 寫的 DTO：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790246692000hd1bz8.webp)

我就問誰要用一個幾乎都是 optional 的資料！這樣串接起來還得想辦法過濾，不累嗎？

`Api**` 其實也是不必要的前綴，直接輸出 DTO 就好，所以這裡還是得重構。

到此酒譜查詢的第一支 API 算是完成啦！

---

## 小結

1. **跳脫習以為常的架構**，配合工具的特性來嘗試新的做法，也是很好的學習
2. 如果沒有特殊需求，型別的定義盡可能減少 optional，才能讓後續的串接更單純
3. Zod 萬歲
