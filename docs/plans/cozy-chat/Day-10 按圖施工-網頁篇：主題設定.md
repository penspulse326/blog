---
title: 'Day 10 - 按圖施工-網頁篇：主題設定'
description: 'Cozy Chat 專案第 10 天：按圖施工-網頁篇：主題設定'
date: '2025-09-11 00:00:00'
keywords: ['Cozy Chat', '即時通訊', 'WebSocket', '專案實作']
tags: ['Cozy Chat', '專案開發', '即時通訊']
slug: 'cozy-chat-day10'
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17575591610004vrldg.png)

~~灌水了四天後~~終於來到實作階段了！這次選用的也是我沒使用過的 UI 庫，又回到學習新東西的新鮮感了 XD

## 建置環境

React 的 UI 庫大多有附上 Next 的[建置指南](https://mantine.dev/guides/next/)，跟著操作應該都沒問題（~~除非文件騙你~~）！

現在是 monorepo 架構，因此要安裝子專案的套件時，要記得用 `--filter <project>` 指向到該專案，或是切換到對應目錄下安裝。

接著將文件示範的程式碼貼上，大部分的 UI 庫也都是類似的做法，在根元件用 provider 包住 `children`：

```tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
```

接著在 `Home` 加入 Mantine 的按鈕試試看：

```tsx
export default function Home() {
  return (
    <div>
      <TestLibComponent />
      <Button>Click me</Button>
    </div>
  );
}
```

Mantine 的導入就完成啦！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752204687000zwfnkv.png)

---

## 主題色系

我希望網站風格是綠色系，想呈現放鬆柔軟的感覺，意象也比較符合 Cozy Chat 這個主題名稱！

我之前會用 [Coolors](https://coolors.co/) 隨機抽顏色，但這樣有點難定位出一組滿意的顏色，所以最後是在 [Color Hunt](https://colorhunt.co/) 找到喜歡的色系，畢竟術業有專攻！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752299681000aij0cf.png)

接著就可以把顏色帶到程式碼裡，可以使用 Mantine 提供的色階產生器 `generateColors` 產出色階陣列：

```ts
'use client';

import { generateColors } from '@mantine/colors-generator';
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'moss-green',
  colors: {
    'soft-lime': generateColors('#DDEB9D'),
    'moss-green': generateColors('#A0C878'),
    'deep-teal': generateColors('#27667B'),
    'navy-steel': generateColors('#143D60'),
  },
});
```

將 `theme` 傳入 provider 後將色階 0~9 的按鈕渲染出來看看：

```tsx
// RootLayout
<MantineProvider theme={theme}>{children}</MantineProvider>

// 產生按鈕
<div
  style={{
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  }}
>
  {Array.from({ length: BLOB_COUNT }, (_, index) => (
      <Button key={index} color={`moss-green.${index}`}>
        moss-green.{index}
      </Button>
    )))
  }
</div>
```

Mantine 的部分元件只要不指定顏色，預設會帶入剛剛在 `theme` 定義的 `primaryColor`，所以目前會呈現 `moss-green` 這個顏色：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752303369000q8057e.png)

元件會以第 6 階作為顏色的預設值，但剛剛丟進去的顏色並不是每種都落在第 6 階，會經過明暗度計算公式進行偏移，像是 `navy-steel` 要到第 9 階才是原本傳入的顏色。

偏移會盡量符合視覺舒適度，`moss-green` 的原始顏色 `A0C878` 落在第 3 階 `moss-green.3`，看起來的確是有點亮！如果要維持以原始顏色作為主色，要在 `theme` 中指定主色呼叫時的色階：

```ts
export const theme = createTheme({
  primaryColor: 'moss-green',
  primaryShade: 3, // 以第 3 階為主
  // 略
});
```

---

## 基本結構

Mantine 提供 `AppShell` 這個好用的元件，正如其名，是一般常見的儀表板佈局：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/175258851800091drsl.png)

:::warning  
注意這個元件的範例中有用到 `useDisclosure` 這個 hook，因此檔案開頭記得加上 `'use client'` 才不會跑出 hydrate 失敗的報錯。在剛剛的 `theme.ts` 也有用到這個標記。
:::

接著微調 `AppShell` 各個子元件的 props 就可以完成差不多的效果了！

如果不排斥在元件上寫很多 props，可以看 [style props](https://mantine.dev/styles/style/) 這一頁方便查表。

有樣式分離強迫症（？）的話，Mantine 也支援很多方式來客製化樣式，除了 CSS in JS 外，CSS Module 也是官方推薦的方式，最主要的原因是 Mantine 從 7.x 版本開始將底層實作從 Emotion 轉移到 CSS Module。

---

## 導覽列

先調整 `AppShell` 的 `navbar.collapsed`，這是用來控制側邊選單 `AppShell.Navbar` 的狀態，因為 `breakpoint: 'sm'` 的關係，選單會從 `768px` 開始固定在畫面上，因此讓它在桌面版也綁定 `opened` 這個狀態即可：

```tsx
<AppShell
  navbar={{
    width: 280,
    breakpoint: 'sm',
    collapsed: {
      mobile: !opened,
      desktop: !opened,
    },
  }}
  padding="md"
>
```

這時選單就能透過 `Burger` 來控制了，但 `AppShell.Navbar` 的行為會把 `AppShell.Main` 往右推，`AppShell.Header` 則是固定在畫面上緣不動，所以原本的 `Burger` 會被蓋住：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752591267000y52qba.png)

這邊有幾種可能的解決方案：

1. 查查看是否有提供控制佈局的 prop
2. 在 `AppShell.Navbar` 新增一個 `Burger` 來關掉選單
3. 自訂 `transform` 屬性並綁定 `opened` 狀態來控制 `Burger` 位置

上面的截圖已經暴雷了，我一開始是採取方案 2，也就是在選單內部也增加一個按鈕的暴力解 XD

關於方案 1，官方還真的有提供一個 prop，`layout="alt"`，可以改變 `Header`/`Footer` 的佈局，讓 `Burger` 可以被向右推，但實測發現這個效果在低於 `768px` 時就不生效了 QQ

這是因為 `AppShell` 的 `navbar.breakpoint` 導致讓 `AppShell.Navbar` 在 `sm` 斷點觸發 `mobile` 的佈局，只要設為 0 就不會觸發了：

```tsx
<AppShell
  navbar={{
    breakpoint: 0, // 設為 0
    // 略
  }}
>
```

調整 `AppShell.Navbar` 的內容：

```tsx
<AppShell.Navbar p="md">
  <Flex justify="space-between" align="center">
    <div>Cozy Chat</div>
  </Flex>
</AppShell.Navbar>
```

`AppShell.Navbar` 原本預設在 `mobile` 佈局會是滿版的，必須設定 `max-width` 來控制，但剛剛將 `breakpoint` 設為 0 之後永遠不會被觸發，那麼這個寬度就會維持在 `AppShell` 上寫好的 280px：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752592483000n48nbb.png)

導覽列到這邊差不多能運作啦！

如果到這邊開始覺得 UI 庫很麻煩的話，你不孤單......我以前也是這樣想的，所以一直沒有去研究，但這就是用現成工具要付出的一點心智負擔 XD

---

## 內容佈局

很多 UI 庫除了提供 RWD 設定，通常也提供各種容器，像是使用 flex 把容器內部 xy 軸置中的 `Center`，垂直排列的 `Stack` 等。

`AppShell.Main` 的組成很單純，組合這些容器後再把聊天首頁的一些元素放進去，就有基本架構了：

```tsx
<AppShell.Main p={0} bg="radial-gradient(circle, #DDEB9D 0%, #A0C878 75%, #27667B 150%)">
  <Stack justify="center" align="center" mx="auto" maw={480} mih="100dvh">
    <Stack align="center" gap="lg">
      <Title c="deep-teal.9" fz={{ base: 56, md: 96 }}>
        Cozy Chat
      </Title>
      <Title order={2} c="deep-teal.9" fz={32}>
        放輕鬆，隨便聊
      </Title>
      <Button
        px={12}
        mt={32}
        h={{ base: 64, md: 80 }}
        radius="lg"
        color="deep-teal.9"
        fz={{ base: 36, md: 44 }}
        fw={400}
      >
        開始聊天
      </Button>
    </Stack>
  </Stack>
</AppShell.Main>
```

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752650366000zrj4x7.png)

---

## 字體

Next 專案建立好之後預設範例是 Roboto，可以換成 Noto Sans TC：

```tsx
import { Noto_Sans_TC } from 'next/font/google';

const notoSansTC = Noto_Sans_TC({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
});

// lang 換成 zh-hant
<html lang="zh-hant" {...mantineHtmlProps} className={notoSansTC.className}>
```

設定完會發現字體沒有載入，是顯示作業系統的預設字體：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752652112000d151ry.png)

原因是 Mantine 的 provider 會注入全域樣式，所以 `theme` 這裡也要載入字體：

```ts
export const theme = createTheme({
  // 指定字體
  fontFamily: 'Noto Sans TC, sans-serif',
});
```

字體最終會在 `theme` 處理，所以我個人認為統一在這邊 `import` 字體會更好，也能直接透過變數取出 Next 編譯注入的名稱，防止手滑打錯字體名稱：

```ts
export const theme = createTheme({
  fontFamily: `${notoSansTC.style.fontFamily}, sans-serif`,
});
```

如果看膩了 Noto，也可以試試 LINE 最近佛心推出的 LINE Seed！

下載好的字體可以用 CSS 的 `@font-face` 或是 Next 的 `localFont` 載入：

```ts
import localFont from 'next/font/local';

const lineSeedTW = localFont({
  src: [
    {
      path: '../public/fonts/line_seed_tw_th.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/line_seed_tw_rg.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/line_seed_tw_bd.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
});

export const theme = createTheme({
  fontFamily: `${lineSeedTW.style.fontFamily}, sans-serif`,
});
```

官方文件雖然說字體放在 public 資料夾也可以，但沒跟你說路徑要怎麼設 XDDD

這件事也在 [GitHub Issues](https://github.com/vercel/next.js/issues/76573) 跟 [reddit](https://www.reddit.com/r/nextjs/comments/1emdnlr/trying_to_install_local_font_but_it_cant_be_found/) 被吐槽過（~~所以 Next 文件一天到晚被嘴可不是民間傳說~~）。

好久沒有用其他中文字體了！

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1757557343000gqaeyf.png)

---

## 主視覺

雖然只是練習，但連 Logo 都沒有就太粗糙啦！

我在 Canva 上找了一些免費範本微調後輸出圖片，但免費會員只能輸出有背景的 PNG 檔，需要自己去背：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1752655970000pbfjbf.png)

:::info  
初期還抓不太到網站整體的設計風格時，我會選一些簡單的線條、色塊組成圖案，能夠呈現基本概念和方便套顏色就好。
:::

---

## 本日小結

今天主要以環境建置、主題設定、首頁排版為主，雖然沒有繁重的邏輯，但是步驟稍微繁瑣一點，這就是使用 UI 庫的代價 XD

透過這些設定也可以了解，在選用 UI 庫時不外乎要注意：

1. 設計系統：如何設定 RWD、容器、斷點、主題等
2. 客製化：如何調整元件樣式
3. 文件：官方文件是否容易查找，如 API、框架整合等
4. 元件類型：是否提供開發所需要的元件

---

## 參考資料

- [Color Hunt](https://colorhunt.co/)
- [Usage with Next.js](https://mantine.dev/guides/next/)
- [Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)
