![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791371338000eh65sk.webp)

目前已經從單純的酒譜查詢，慢慢迭代了一點社群功能，我還沒有要讓它失控，所以先不做留言系統。

但有另外我想嘗試的東西是通知小鈴鐺！

---

## 通知

就是來強化虛榮心 (?) 的功能，通知使用者有人追蹤、按讚這樣 XD

那要透過什麼機制通知？

1. `每次進入新頁面就打 API`：使用者不換頁就收不到通知
2. `WebSocket`：有點浪費機器，這不是即時聊天或是線上遊戲那麼重要的功能
3. `定時打 API`：我認為是這個情境的最佳解，也是所謂的輪詢 (Polling)

我相信大家一開始直覺想到的也是 3 吧......吧？

Agent 也提供了更細緻的做法，**介面只對是否「未讀」做輪詢**，實際點開通知鈴鐺的時候才去查詢並回傳通知列表。

這種 Lazy Loading 的機制有以下好處：

1. 未讀的查詢比較輕量，網路負擔較輕
2. 使用者可能很長時間都**不會點開通知鈴鐺**，所以不需要在背景持續去拿完整資料

來看看 Agent 實作的如何：

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/17912955230000f4ho8.webp)

看起來好像蠻不錯！輪詢也有正常在跑，但 RWD......總是會爆的 XD

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791295862000r7eb0r.webp)

那就修吧不然要怎麼辦 XDDD

---

## 防止洗版

退追又追回來，還是反覆取消按讚的狂讚士，這種奇怪行為相信大家多少都有耳聞。

![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1791325518000da5m4i.webp)

當然要修啦！不然 DB 一下就爆了 XDDD

這部分就需要在 `insert` 前進行檢查：

```ts
async createNotification(params: CreateNotificationParams): Promise<void> {
    // Don't notify self
    if (params.actorId === params.userId) {
      return;
    }

    const whereCondition = params.recipeId
      ? and(
          eq(schema.notifications.userId, params.userId),
          eq(schema.notifications.actorId, params.actorId),
          eq(schema.notifications.type, params.type),
          eq(schema.notifications.recipeId, params.recipeId),
        )
      : and(
          eq(schema.notifications.userId, params.userId),
          eq(schema.notifications.actorId, params.actorId),
          eq(schema.notifications.type, params.type),
          isNull(schema.notifications.recipeId),
        );

    const [existing] = await this.db
      .select()
      .from(schema.notifications)
      .where(whereCondition)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(1);

    if (existing) {
      // 1. If previous notification is unread, bump its createdAt without creating a duplicate
      if (!existing.isRead) {
        await this.db
          .update(schema.notifications)
          .set({ createdAt: new Date() })
          .where(eq(schema.notifications.id, existing.id));
        return;
      }

      // 2. If already read, suppress rapid re-notifying within 5-minute cooldown window
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (existing.createdAt > fiveMinutesAgo) {
        return;
      }
    }

    await this.db.insert(schema.notifications).values({
      actorId: params.actorId,
      recipeId: params.recipeId || null,
      type: params.type,
      userId: params.userId,
    });
  }
```

如果查詢條件全部符合，代表使用者持續做了同個操作，那麼就進行兩個判斷：

1. 使用者未讀：不會再產生新通知，只更新 `createdAt`
2. 使用者已讀：5 分鐘內不會再產生新通知

現在暫時 (?) 不會再被惡搞啦！

---

## 小結

1. 頻率不高但又要定期拿資料就可以考慮輪詢 (Polling)
2. 使用者不會馬上需要看到的內容，可以用輕量查詢 + Lazy Loading 的方式處理，**不需要一開始就去拿完整資料**
3. 有新的設計也要一併檢查 RWD 的狀況
4. 設定冷卻條件，防止同樣的資料頻繁寫入 DB
