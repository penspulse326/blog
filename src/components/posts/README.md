# Posts 相關文章元件群說明文件 (SPEC)

## 📌 元件定位與架構

本資料夾底下的元件專門服務「文章 (Posts)」與「文章列表」頁面。包含側邊欄整合、近期文章導覽、標籤雲、文章卡片、標籤頁標頭、以及文章摘要截斷功能。

```
posts/[...slug].astro (文章內容頁) 或 posts/[page].astro (文章列表頁)
  ├── posts-sidebar.astro (側邊欄容器)
  │     ├── posts-recent-list.astro (近期文章清單 UI)
  │     └── posts-tag-cloud.astro (標籤雲按鈕 Flex UI)
  │
  ├── post-card.astro (單篇文章清單卡片)
  │     └── post-excerpt.astro (Astro 列表中的摘要，Web Component 截斷器)
  │
  └── tag-header.astro (標籤頁首標題與統計)
```

---

## 🛠️ 與 Layout / Pages 的協同運作

1. **與文章頁面 (Pages) 的配合**
   - 在 `/posts/index.astro` 或 `/posts/[page].astro` 等列表頁中，利用 [posts-sidebar.astro](file:///Users/vincent/dev/blog/src/components/posts/posts-sidebar.astro) 來展示側邊欄，將從 `src/utils/posts.ts` 內撈取出的 `recentPosts` 與 `tagCloud` 資料傳遞下去渲染。
   - 列表頁中使用 [post-card.astro](file:///Users/vincent/dev/blog/src/components/posts/post-card.astro) 呈現每篇文章的卡片結構。
   - 標籤頁中使用 [tag-header.astro](file:///Users/vincent/dev/blog/src/components/posts/tag-header.astro) 呈現當前標籤與文章筆數。
2. **運行邏輯說明**
   - **客戶端純文字大綱截斷 (`<post-excerpt>`)**：
     - `<post-excerpt>` 內部包裹著整篇文章的渲染內容 (`<Content />`)。
     - 元件載入至 DOM 時，`connectedCallback()` 會透過 `document.createTreeWalker` 遍歷 DOM 尋找 `<!-- truncate -->` 註解。
     - 找到註解後，將其後方的所有 HTML 兄弟元素隱藏，再取剩餘部分的 `innerText` 純文字輸出，最後以純文字節點取代整個 DOM 內容。
     - 此做法保證了只在 client-side 執行一次，避免了以前重複加載時重複執行兩次的效能問題。
