![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791151926000y12wvi.webp)

酒譜除了記載配方，當然也要有美美的~~網美照~~成品照，所以要來串圖床了！

---

## Cloudinary

這是 2 年多前我還在 [火箭隊培訓營](https://www.facebook.com/profile.php?id=100039975056467) 製作我的轉職專題時就有用過的圖床服務，免費的額度給得多，串接也簡單，打到指定的 `endpoint` 並加上參數就可以串起來。

圖片上傳需要這些資訊：

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

在左側導覽就可以找到：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791103517000rko5bv.webp)

建立 API Key 時身份要選 `Master Admin`，否則沒有上傳權限：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791105685000i5qzck.webp)

Agent 幫我規劃的機制是：

1. 在前端 submit 時去呼叫後端進行一次 `signature` 的簽核
2. 把簽核的結果回傳給前端
3. 前端正式把圖片 `POST` 給 Cloudinary
4. Cloudinary 回傳圖片 URL 給前端
5. 前端把 URL 傳給後端，完成酒譜的新增 / 更新

我記得之前做專題時簽核是在 Next.js 的 server 層做的，但現在統一讓後端來做，所以上面要用到的 `.env` **只要填入後端**。

**任何 secret 與 key 都不要暴露在前端**，當時可以用 Next.js 做是因為可以靠它本身的 server 層去打，**一般的 CSR 環境請不要這麼做**。

因為圖床還有以前專題的圖，為了區隔開來，我創了新資料夾：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791103952000o9s5vp.webp)

剩下的就交給 Agent XD

不過寫法也沒有什麼特別的，就是前端抽 composable 來做上傳圖片，後端抽 service 來做圖片的簽核與刪除。

比較大的變動是 table 多了一個欄位 `image_public_id`，因為在 Cloudinary 操作圖片需要它的 `public_id`，雖然從 URL 解出來也是可以，但寫進去可能是最簡單暴力的 XD

原本我是想把換圖片或其他網路問題產生的孤兒圖片，在 DB 開 table 來記，然後跑 cron job 來定期清理這些圖，不過 Agent 表示太嚴謹 (?)，除非要讓使用者在 submit 前就可以傳圖，否則等流量或圖片服務真的很多再這麼做就好。

---

## 實測上傳

接下來就新增酒譜來試試看吧：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791106364000nwcjn4.webp)

等右下角的圖片上傳走完後，就會跳轉到酒譜的頁面，檢查圖片來源也確實是 Cloudinary：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17911065020001e1yvu.webp)

Cloudinary 的後台也有這張圖，成功！

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/179110582900018rj8o.webp)

接下來測試在編輯酒譜時換圖：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791106632000rxqhyl.webp)

換圖成功！後台的舊圖也有成功刪除：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17911066840004lolmq.webp)

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791106729000syxic9.webp)

可別到這裡就以為刪除酒譜一定沒問題就不用測哦！

**完整的 UAT** 是什麼按鈕都要給它點一遍測測看的：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/179110691700004jnci.webp)

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791106943000mexo3p.webp)

大功告成！

---

## 上傳限制

免費的空間給再多也還是有限，所以要限制上傳圖片的大小：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791109015000ag990g.webp)

Cloudinary 有佛心壓縮服務，只要在上傳時帶上 `transformation` 參數：

```ts
transformation = "f_auto,q_auto,w_1200,c_limit";
```

1. `f_auto`：依使用者瀏覽器自動轉成 WebP 或 AVIF
2. `q_auto`：以人眼無法分辨的演算法壓縮畫質
3. `w_1200, c_limit`：將圖片寬度上限限制在 1200px，超過會等比縮放

~~客家~~省錢精神要在對的時刻發揮到極致！

---

## 小結

1. **請勿把任何外部服務的 key 或 secret 暴露到前端**
2. 不要因為功能類似就**偷懶不測**，搞不好 Agent 就真的沒把某個按鈕的功能做好
3. 限制圖片上傳大小，不然空間會爆
