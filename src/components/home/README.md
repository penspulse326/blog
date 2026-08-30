# Home 首頁功能元件群說明文件 (SPEC)

## 📌 元件定位與架構

本資料夾底下的元件專門服務「首頁 (Index)」頁面。將原本堆疊於頁面中的各功能區塊模組化，包含主視覺、三欄功能導覽、個人簡介、經歷與技能卡片。

```
pages/index.astro (首頁)
  ├── hero-section.astro (首頁主視覺，整合背景 Waves 動畫)
  ├── feature-cards.astro (文章/筆記/計畫 三欄導覽卡片)
  └── about-section.astro (個人介紹與技能區塊)
        ├── profile-card.astro (個人簡介大卡片，含 Avatar 背景)
        ├── experience-card.astro (經歷列表卡片)
        └── tech-stack-card.astro (使用技術卡片)
```

---

## 🛠️ 與 Layout / Pages 的協同運作

1. **`hero-section.astro` (主視覺區塊)**
   - 封裝首頁標題及 `psp-waves.astro` 動畫特效。
2. **`feature-cards.astro` (三欄導覽卡片)**
   - 支援透過 Props 傳入自定義項目，預設引導至 `/posts`、`/notes`、`/plans`。
3. **`about-section.astro` (關於我區塊)**
   - 採用 12 欄響應式網格整合 `profile-card`、`experience-card` 與 `tech-stack-card`。
