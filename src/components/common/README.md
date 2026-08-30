# Common 公用與工具元件群說明文件 (SPEC)

## 📌 元件定位與架構

本資料夾存放全站共用的基礎排版元件（如頁尾、文章標頭、分頁、返回按鈕）、全域工具元件（如圖片點擊放大）以及跨模組的社群留言系統。

```
layouts/default-layout.astro ──> footer.astro (全站頁尾)
layouts/article-layout.astro ──> image-zoom.astro (圖片放大燈箱 Web Component)
pages/*/[...slug].astro      ──> giscus-comment.astro (Giscus 留言區)
                             ──> article-header.astro (文章/筆記/計畫 標頭與中繼資料)
                             ──> back-button.astro (智能返回按鈕)
pages/posts/*                ──> pagination.astro (分頁導覽元件)
```

---

## 🛠️ 與 Layout / Pages 的協同運作

1. **`footer.astro` (頁尾)**
   - 被全域引入於 [default-layout.astro](file:///Users/vincent/dev/blog/src/layouts/default-layout.astro)，提供版權宣告與聯絡信箱，通常在頁面底部顯示。
2. **`image-zoom.astro` (圖片放大燈箱)**
   - 被加載於 [article-layout.astro](file:///Users/vincent/dev/blog/src/layouts/article-layout.astro) 中，作為所有 Markdown 閱讀頁面的通用附屬工具。
3. **`giscus-comment.astro` (Giscus 留言系統)**
   - 被加載於 `/notes/[...slug].astro`、`/plans/[...slug].astro` 以及 `/posts/[...slug].astro` 文章內容頁的最底部。
4. **`article-header.astro` (文章標頭與中繼資訊)**
   - 整合 `h1` 標題、發布日期 `<time>`、文章標籤標籤與選擇性的返回上一頁按鈕。
5. **`back-button.astro` (返回按鈕)**
   - 封裝樣式（`compact` 與 `regular` 變體），支援同網域 `history.back()` 智慧返回。
6. **`pagination.astro` (通用分頁元件)**
   - 封裝上一頁、下一頁與數字分頁頁籤按鈕，支援動態 `baseUrl` 與目前頁面狀態樣式。
