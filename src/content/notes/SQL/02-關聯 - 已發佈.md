---
title: 關聯
date: 2024-11-04 19:57:45
description: "了解關聯的意義"
keywords: [程式語言, SQL, 資料庫, database, 關聯, sql relationship]
slug: sql-relationship
---

關聯就是指各個資料表的組合關係，  
假設電商網站的一張訂單資訊，可以推測內容是組合了客戶名單、商品清單兩種資料。

## Primary Key

每筆資料的區分方式，因此它必須是不重複的唯一值，  
通常會選擇 id 或是 uuid 作為主鍵。

```sql
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(100)
);
```

如果沒有特別指定格式，可以設定自動遞增，  
新增資料時就不需再自己填寫 id，會從數字 1 開始建立：

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100)
);

INSERT INTO
  users
VALUES
  ('John'),
  ('Nick');

SELECT
  *
FROM
  users;

/*
  查詢結果
  John 的 id 為 1
  Nick 的 id 為 2
*/
```

---

## Foreign Key

指定某個欄位為外鍵時，表示該欄位的值必須是來自某一個 table 的內容，  
一個 table 可以有多個外鍵：

```sql
-- 建立性別 table genders
CREATE TABLE genders (
  id INT PRIMARY KEY,
  name VARCHAR(10)
);

-- 新增性別資料
INSERT INTO
  genders(id, name)
VALUES
  (1, '男'),
  (2, '女');

-- 建立使用者 table
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    gender_id INT,
    FOREIGN KEY (gender_id) REFERENCES genders(id)
  );

-- 新增性別資料
INSERT INTO
  users(name, gender_id)
VALUES
  ('Vic', 1),
  ('Lisa', 2);
```

:::warning
因為外鍵是參考（REFERENCES）其他 table 的資料來的，  
所以被參考的 table 必須先建立好。
:::

---

## INNER JOIN

可以查詢多個 table 組合後的結果，因為有超過 1 張以上的表，  
所以在 SELECT 時要前綴 table 的名稱才能索引到指定的欄位：

```sql
SELECT
  users.name AS "名字",
  genders.name AS "性別"
FROM
  users
  JOIN genders ON users.gender_id = genders.id;
```

利用 JOIN 合併兩張表的內容後，可以在 SELECT 撈出 genders 的 name，  
Vic 與 Lisa 的性別會顯示男與女，而不是原本的 1, 2。

INNER JOIN 取的是交集，左右兩邊有任一個 NULL 值的話就不會匹配，  
該筆資料就不會被撈出。

---

## LEFT JOIN, RIGHT JOIN, FULL JOIN

如果交集欄位是 NULL 會保留左邊的集合，右邊是 NULL，  
反之則是 RIGHT JOIN 的規則。

FULL JOIN 則取聯集，所以撈出時會看到組合結果的兩邊可能都會有 NULL。

---

## ALTER TABLE ADD COLUMN

插入新的欄位：

```sql
ALTER TABLE
  users
ADD
  COLUMN job_grade_id INT,
ADD
  FOREIGN KEY (job_grade_id) REFERENCES job_grades(id);
```

---

## ALTER TABLE DROP COLUMN

刪除欄位：

```sql
ALTER TABLE
  users
DROP
  COLUMN job_grade_id INT;
```
