![gh](https://raw.githubusercontent.com/penspulse326/penspulse326.github.io/images/1790490424000txyr6m.webp)

不論有沒有切出 model 或 repository 等 pattern，後端 CRUD 的寫法大多比較固定，頂多差在部分複雜查詢、演算法等，前端就比較奔放一點 (?)。

不過關鍵知識還是要搞懂！

---

## Transaction

使用者新增酒譜的流程大概會經過這些步驟：

1. 使用者送出表單
2. 表單資料傳送到後端
3. 後端程式把表單資料整理成 DB 要的格式
4. 寫入 DB
5. 回傳成功訊息至後端再到前端

transaction 的概念類似 `try & catch`，在 `BEGIN` (transaction 啟動) 之後，後續的 SQL 只要其中一個操作發生錯誤，就會執行 `ROLLBACK`，這次所有操作都會還原，避免**新增到一半的殘缺資料**、**畫面顯示了不存在的資料**等等的問題：

```sql
BEGIN; -- BEGIN TRANSACTION;

INSERT INTO recipes (id, name, base_spirit) VALUES ('123', '琴蕾', 'gin');
INSERT INTO recipe_ingredients (recipe_id, name, amount) VALUES ('123', '琴酒', 45);
INSERT INTO recipe_flavors (recipe_id, flavor_id) VALUES ('123', 'sour');

-- 如果一切正常，確認寫入（正式生效）
COMMIT;

-- 如果執行途中報錯，就要下：
-- 放棄剛才所有操作，全部還原
-- ROLLBACK;
```

如果 SQL 操作只有一個 (Atomic)，就不需要特別做 transaction，因為一個操作不是成功就是失敗，不會有殘留資料的問題。

---

## Premature Optimization

不過 **transaction 是 DB 應用程式本身的功能**，它只保證 DB 的功能。

網路傳輸不穩或前後端對接的流程的問題導致的異常錯誤，還是會讓使用者看到一些錯誤提示。

那這個問題需不需要現在處理呢？我個人覺得還好，畢竟 MVP 都還沒一個影子咧！Agent 也建議先不做跟核心功能無關的設計，因為暫時不需要 (YAGNI, You Aren't Gonna Need It)。

我想使用 TDD 的方式來開發也是因為如此。訂好使用情境 (scenario) 與輸入輸出的格式後，先用最簡單直覺的程式碼完成業務邏輯就好，雖然可能會看起來笨笨的、有點義大利麵條，但認知負擔會比較低，等到必要的時候再抽象。

---

## 小結

1. transaction 是用來防止**連續的 SQL 操作中任一步驟錯誤導致資料殘留**的問題，只要操作錯誤就會觸發還原 (rollback)
2. 必要的時候才抽象，**不要試圖解決不存在的問題**
