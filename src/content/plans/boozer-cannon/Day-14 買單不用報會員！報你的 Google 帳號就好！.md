![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790560219000478ob1.webp)

只剩 Google 登入註冊的功能了！不過要先到 GCP 設定 OAuth 才能進行下去。

現在 AI 可以直接列出這些設定步驟，以往這些繁瑣複雜的雲端服務，操作起來再也不會這麼頭痛啦！

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790413592000pkvstr.webp)

---

## 白名單

做 OAuth 唯一有點小麻煩的地方就是白名單 (white list)。

用第三方服務來整合自己的應用程式時，通常需要申請審核，通過才能讓**任何人**來透過第三方服務來玩我們做好的應用程式：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790414329000gdrlcn.webp)

但正式網址或品牌 logo 目前還沒有，所以也沒辦法送審，只能先用測試名單，把自己的 Google 帳號加進去：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790414523000hgybhk.webp)

不過如果是單純的 Google 登入功能，只跟 Google 拿 `email`、`name`、`picture` 等基本資訊，沒有要存取其他服務，其實是**所有人都可以登入的**，不用特別加名單！

最後再建立憑證設定，把本機前端 `http://localhost:3000` 加到允許的網域：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790414842000v11bxh.webp)

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790414959000n6am7l.webp)

設定完成後會跳出 client id，有些操作會有警告提示，建議看完才做下一步，不要急著按確定哩 XD

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790415340000f50lgb.webp)

---

## Environment Variables

剛剛拿到的 client id 要用在前後端的 `.env`。

前端：

```
NUXT_PUBLIC_GOOGLE_CLIENT_ID=
```

後端：

```
GOOGLE_CLIENT_ID=
JWT_SECRET=
```

串接過 API 的話應該還記得，在網站登入成功時會拿到一組 token (授權碼)，讓使用者後續的請求都帶上這組 token，先驗證 token 的合法性才決定是否執行請求。

但要怎麼證明前端的請求帶過來的授權碼是**從我自己的後端程式合法簽發**出來的？

目前常用的 JWT 是透過雜湊演算法算出來的一組字串，計算因子由 `header`、`payload` 與 `signature` 組成，上面用到的變數 `JWT_SECRET` 就是 `signature` 這個因子。

token 可以被解出 `header`、`payload` 這些明文 (plaintext) 資料，但比較難解出 `signature`，所以 `signature` 設得越複雜，被逆向出來的機率就越低。Agent 建議隨機生成一個 Base64 字串來做 `JWT_SECRET`。

---

## 測試可行性

這邊先讓 Agent 快速做出一個表單，暫時不管其他設定，看看能不能正常地登入登出吧！

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790500364000s2k79w.webp)

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790500478000p3ka1v.webp)

看起來成功了！

整個登入授權的流程大致如下：

1. 前端載入 Google 提供的 SDK (`https://accounts.google.com/gsi/client`)
2. 使用者按下登入時呼叫 SDK，跳出 Google 登入框
3. 登入成功時 Google 產生一個簽發好的憑證，並呼叫我們傳入的 callback 函式把憑證傳回來
4. 前端把接到的憑證傳給後端
5. 後端把憑證傳給 Google (`https://oauth2.googleapis.com/tokeninfo?id_token=`) 來確認是否為真的憑證
6. 憑證檢查完後就去 DB 查詢該使用者的資訊，並產生一組 token，一起回傳給前端

後端當然不能傻傻地接前端給的資訊啦，所以即使 Google 在前端簽發過憑證，進到後端還是要再驗一次。

---

## 小結

1. 在專案還沒正式發佈前，只能使用**測試名單**允許的 Google 帳號來登入測試，但如果是純登入，**不存取任何 Google 服務，所有人都可以登入**
2. **別相信任何前端或其他外部服務**注入的資料，後端是整個應用程式的最後防線，無論如何都要有驗證機制
