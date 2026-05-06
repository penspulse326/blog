---
title: 'React 簡易互動地圖'
description: '用 React 製作簡易台灣互動地圖'
date: 2023-12-10 21:33:41
keywords: [程式語言, JavaScript, React, JSX, Hooks, SVG]
tags: ['實作', 'React']
slug: react-taiwan-map
---

前陣子結束了今年六角 F2E 的活動，  
不過我們志在參加，不在得獎，有入圍真的是萬幸！  
~~（還好沒有砸火箭隊的招牌）~~

![入圍名單](https://raw.githubusercontent.com/penspulse326/blog/images/2023/1713373269000uw3de8.png)

獻醜一下我們的[開票地圖](https://penspulse326.github.io/F2E2023-2/)，要感謝 UI 同學幫我們畫香香的設計稿，  
也願意配合需求幫忙修改稿件，彼此都學到很多東西呢^\_^

這篇筆記記錄一下製作地圖時的思路，我在技術選用上沒有用到 D3.js...  
完全是土法煉鋼的，~~所以要讓各位看官失望啦這篇不是什麼頂天教學

## 功能概要

- 每個縣市的區塊 hover 換色
- 游標旁邊會顯示該縣市名

## SVG 地圖

我對 SVG 的標籤系統並不熟悉，所以不會特別解釋每個標籤的功能，  
僅以不會影響程式運行為主，大家可以去微調一些數值看看～  
台灣地圖的 SVG 檔在網路上有很多現成的，或是可以參考[此篇教學](https://www.letswrite.tw/d3-vue-taiwan-map/)製作 SVG 檔。

拿到 SVG 檔後大概會看到這樣的結構：

```html
<svg width="718" height="929" viewBox="0 0 718 929" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g clip-path="url(#clip0_336_34015)">
	<path id="高雄市" d="M531.176...以下省略" fill="#CEBDAD" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </g>
  <defs>
    <clipPath id="clip0_336_34015"><rect width="718" height="929" fill="white">
	</clipPath>
  </defs>
</svg>
```

path 這個標籤會出現很多次，它代表每個縣市的形狀，等等會用 map 的方式批次渲染。

id 這個屬性可以透過這兩種方式加上去：

- 可以在 Adobe Illustrator 裡面編輯圖層名稱生成。
- 丟到瀏覽器用 F12 逐個查看 path 是哪個縣市，再用 VS Code 等文字編輯器手動寫上 id。

其他屬性如 `fill="#CEBDAD" stroke="white"` 是控制圖案樣式的屬性 ，  
考量到會有個別控制每個 path 的情況，所以選用這種 inline-style 的方式寫樣式，  
如果 SVG 是用 AI 做的，輸出時記得把樣式設定改為**內嵌樣式**才會變成這個寫法。

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/2023/1713373384000dq9opg.png)

---

## 抽取 SVG 屬性

得到 SVG 圖檔後，可以發現每個 path 的差異只有 id 跟 d，  
d 值是用來描述形狀中的每個錨點座標與斜率～簡單地說就是直接決定輪廓的數值，  
因此我們要把這些值抽取出來：

```js
[
  {
    id: '高雄市',
    d: 'M319......',
  },
];
```

現在有 SVG 的容器，也有陣列資料，接下來要做什麼，心裡是不是有答案了呢^O^

---

## 製作 Map 元件

因為 SVG 的主體是標籤，所以我們可以直接在 JSX 裡面拼裝它。

首先先製作一個 TaiwanMap 元件，然後把 SVG 外層 return 出來，  
接下來就像平常一樣用 map 做重複渲染就可以了：

```jsx
import paths from './paths';

function TaiwanMap() {
  return (
    <svg width="506" height="727" viewBox="0 0 506 727" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 這邊開始做重複渲染*/}
      {paths.map(({ id, d }) => (
        <path id={id} d={d} fill="grey" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
```

注意的是 stroke-width 這些用 dash 命名的屬性，  
在 JSX 要記得改寫為小駝峰 strokeWidth，順利的話應該就可以看到整個台灣地圖啦！

目前結構比較冗長，所以可以把固定的 props 包起來，這樣標籤會比較乾淨：

```jsx
const svgProps = {
  width: '506',
  height: '727',
  viewBox: '0 0 506 727',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
};

const pathProps = {
  stroke: 'white',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
```

---

## Hover 換色效果

hover 可以利用 React 的 onMouseEnter 與 onMouseLeave 這兩個事件來做判斷，  
事件可以綁定在 path 上，這樣等等要取得 id 也比較容易。

設定一個狀態變數 isHover 用來管理 hover 事件，  
接下來就可以在 TaiwanMap 的 callback 裡面寫一些判斷：

```jsx
function TaiwanMap() {
  const [isHover, setIsHover] = useState(false);

  // hover 觸發
  const handleMouseEnter = () => {
    setIsHover(true);
  };
  // hover 結束
  const handleMouseEnter = () => {
    setIsHover(false);
  };

  const svgProps = {
    width: '506',
    height: '727',
    viewBox: '0 0 506 727',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  const pathProps = {
    stroke: 'white',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <svg {...svgProps}>
      {paths.map(({ id, d }) => {
        let fill = isHover ? 'tomato' : 'grey';
        return (
          <path
            key={id}
            id={id}
            d={d}
            fill={fill}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...pathProps}
          />
        );
      })}
    </svg>
  );
}
```

嗯...hover 是成功觸發了，顏色也有改變，可是整張地圖的顏色都改變了耶？  
因為我們還沒有做關於 hover 到哪個縣市的判斷，所以需要再設定一個狀態變數，  
在進到 handleMouseEnter 裡面後用 event 這個參數來捕捉是誰觸發事件的：

```jsx
const [hoverCity, setHoverCity] = useState('');

const handleMouseEnter = (e) => {
  setIsHover(true);
  setHoverCity(e.currentTarget.id); // 這邊的 id 就是 path 裡面的 id
};

const handleMouseLeave = (e) => {
  setIsHover(false);
  setHoverCity('');
};
```

下面 map 裡面的判斷也要改寫：

```jsx
return (
  <svg {...svgProps}>
    {paths.map(({ id, d }) => {
      // hoverCity 只有在 hover 事件觸發才會做狀態變更，所以直接就可以了
      const fill = id === hoverCity ? 'tomato' : 'grey';

      return (
        <path
          key={id}
          id={id}
          d={d}
          fill={fill}
          {...pathProps}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      );
    })}
  </svg>
);
```

這樣基本的 hover 效果就完成了！

不過 hoverCity 這個狀態變數我希望它也能顯示在畫面上的其他地方，  
所以它往上移到父元件，讓下面的元件一起共用這個狀態變數，而命名也要重新改一下。

---

## 游標旁顯示縣市名稱

接下來要設計一個 tag，會依據目前 hover 到的縣市顯示對應的文字，  
這個文字是外部資料，它要從參數上接過來。

tag 會一直跟著游標，所以畫面需要不斷重新渲染，  
因此新增一個狀態變數來更新游標的座標。

React 的事件裡面沒有偵測滑鼠的，所以要用原生的事件"mousemove"，  
因為只需要在 tag 剛被渲染出來時掛上這個監聽事件一次就好，  
所以放在 useEffect 做初始化即可：

```jsx
const Tag = ({ name }) => {
  // 初始座標微調，用 (0, 0) 的話可初次渲染時會在不正確的位置被看到
  const [position, setPosition] = useState({ x: -1000, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      const newPosition = {
        x: event.pageX + 10,
        y: event.pageY - 20,
      };
      setPosition(newPosition);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const styles = {
    position: 'absolute',
    top: position.y,
    left: position.x,
    padding: '4px 8px',
    border: '1px solid black',
    background: 'white',
  };

  return <span style={styles}>{name}</span>;
};
```

剛剛監聽的 mousemove 會不斷觸發並使用 setPosition 更新座標，  
所以要重新幫 span 寫入座標就必須使用 inline-style，  
或是 styled-components 這類 CSS-in-JS 工具來動態修改樣式，  
用 Tailwind 這類後編譯的工具來改樣式是不行的哦！
（可以想想看差別在哪裡）

要特別注意的是 `setPosition(newPosition)`，  
沒有直接賦值 X, Y 座標，而是做了 +10 與 -20，除了美觀問題，  
更重要的是如果直接寫入這個座標，span 就會生成在 mouse 所在的座標，  
這時會造成 onMouse 系列的事件全部爆炸，因為 span 蓋到了其他元素的位置......  
如果完全不修改就會看到這個 span 不斷瞬間移動囉^O^

回到 TaiwanMap 元件裡面稍微修改 return 的結構，  
利用短路讓 Tag 元件可以在 hover 觸發時顯示，並且把目前 hover 到的縣市名字傳進去：

```jsx
 return (
    <>
      {isHover && <Tag name={targetCity} />}
      <svg {...svgProps}>)
```

到此，一個簡易的互動地圖就完成囉！

圖表串接的話我是透過 useContext 來管理篩選到的縣市，  
再去整理好的 JSON 檔撈資料，就不多做示範了～～

---

## 參考資料

- [讓我們來做個互動天氣地圖吧](https://creativecoding.in/2020/03/28/%E8%AE%93%E6%88%91%E5%80%91%E4%BE%86%E5%81%9A%E5%80%8B%E4%BA%92%E5%8B%95%E5%A4%A9%E6%B0%A3%E5%9C%B0%E5%9C%96%E5%90%A7%EF%BC%81%EF%BC%88%E7%9B%B4%E6%92%AD%E7%AD%86%E8%A8%98%EF%BC%89/)
- [# D3.js、Vue 畫一個台灣地圖](https://www.letswrite.tw/d3-vue-taiwan-map/)
