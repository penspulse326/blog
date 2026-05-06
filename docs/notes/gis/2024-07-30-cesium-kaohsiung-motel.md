---
title: '用 Cesium 製作旅館地圖'
description: '使用 Cesium 建立簡單的圖台系統'
date: 2024-07-30 00:00:00
keywords: [JavaScript, 程式語言, API, GIS, Cesium, 圖台]
tags: ['實作', 'JavaScript', 'GIS']
slug: cesium-kaohsiung-motel
---

GIS 是個很冷門的題材，但要建構一個完整的 GIS 系統，  
其背後的演算法很複雜， 如果不是公司專案因素，我會碰到 GIS 的機會，  
大概只有某天突然想起「**口罩地圖**」然後很想看那是怎麼實作的時候吧 XD

## 環境建立

Cesium 是我過去在公司的專案上用到的一套 GIS 工具，  
有人的地方就有江湖，有 JS 的地方就有 React，所以...它也有 React 的封裝版，  
叫做 **Resium**，但這邊先示範原生的 CDN 為主：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <!-- Include the CesiumJS JavaScript and CSS files -->
    <script src="https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/Cesium.js"></script>
    <link
      href="https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium/Widgets/widgets.css"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="cesiumContainer"></div>
  </body>
  <script type="module">
    const viewer = new Cesium.Viewer('cesiumContainer');
  </script>
</html>
```

---

## GIS 的要素

除了建構工具的選擇外，GIS 不外乎就是下面的要素：

- 座標
- 事件
- 圖層

也就是說我們只要有這些資訊，就能做到簡單的互動地圖了！

---

## 座標

要在地圖上準確定義出某個東西的座標，要用什麼當作參考呢？  
就是**經緯度**！因此在串接資料時，只要資料來源裡面是有經緯度的，  
那就一定能在地圖上標示出來。

以 [高雄城市資料平台 高雄市一般旅館資料](https://api.kcg.gov.tw/ServiceList/Detail/8ed53368-e292-4e2a-80a7-434cf497220c)為例，將 JSON 檔下載下來後，  
甚至能直接看到中文命名的屬性：

```JSON
{
  // 略...
  "經度Lng": "120.2956306",
  "緯度Lat": "22.6270351964"
}
```

接下來可以透過這些座標資料在地圖上生成圖示。

目前起始畫面是從外太空看向整個地球的，所以我希望改變起始位置，  
一樣需要用到高雄的經緯度 `(120.3119, 22.6208)` ，控制畫面移動的東西是 [camera](https://cesium.com/learn/cesiumjs/ref-doc/Camera.html)：

```js
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(120.3119, 22.6208, 10000),
});
```

高雄城市資料平台有給 JSON 格式的資料，所以直接 fetch 它即可：

```js
fetch('https://api.kcg.gov.tw/api/service/Get/8ed53368-e292-4e2a-80a7-434cf497220c').then((response) => {
  response.json().then((res) => {
    res.data.forEach((item) => {
      addBillboard(item);
    });
  });
});

// 產生圖示的函式
function addBillboard(data) {
  console.log(data);
}
```

確認資料能夠接上之後，就可以來實作 `addBillboard` 這個函式，  
Cesium 可以生成不同類型的實例並顯示在畫面上，這邊要示範的是 [`Billboard`](https://cesium.com/learn/cesiumjs/ref-doc/Billboard.html)：

```js
const pinBuilder = new Cesium.PinBuilder();

function addBillboard(data) {
  viewer.entities.add({
    name: data['旅宿名稱'],
    id: data.seq,
    position: Cesium.Cartesian3.fromDegrees(data['經度Lng'], data['緯度Lat']),
    billboard: {
      image: pinBuilder.fromText('摩鐵', Cesium.Color.PINK, 100),
      width: 64,
      height: 64,
    },
  });
}
```

官方的文件不是很好閱讀，不過直接看它們的 demo 會發現，  
程式碼架構其實很簡單，所以依樣畫葫蘆抄下來就好。  
`billboard`本身可以自定義圖案，這邊我是用 Cesium 內建的 `pinBuilder`。

Cesium 預設點擊到實例是可以查看資訊的，直接點選剛剛生成的 `billboard`，  
會彈出剛剛賦予它的 `name`：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/2023/1722249144000jzycib.png)

目前畫面上的資料量很多，一般會使用聚合的方式，讓這些圖示聚集起來，  
等到要放大的時候才會全部顯示。

聚合的功能要從 [`DataSource`](https://cesium.com/learn/cesiumjs/ref-doc/CustomDataSource.html) 裡面載入，所以要改寫一下 `billboard` 的生成方式。  
這些 class 生成實例的過程會回傳實例本身，因此要用變數存起來，  
這樣後續才能用一些內建函式把這個實例移除。

在 Cesium 裡面，比較大量的資料集是可以用 `DataSource` 做管理的，  
這邊也稍微改寫一下參數，讓函式看起來比較有通用性：

```js
const motelDataSource = new Cesium.CustomDataSource("motelData");

viewer.dataSources.add(motelDataSource);

function addBillboard(data, dataSource) {
  dataSource.entities.add({
  // 略...
}
```

確定改用 `DataSource` 生成資料且有正常載入後，就可以啟動聚合事件，  
聚合啟動後必須設定它聚合起來會變成什麼（可以是 `point`、`billboard` 等），  
以及要顯示什麼文字（`label`），不然畫面上圖示都會因為聚合事件消失。

這邊我希望它聚合起來一樣是 `billboard`，  
而內建的 `pinBuilder` 可以內嵌指定文字，所以就不另外設定 `label` 了：

```js
function initDataSource(dataSource) {
  dataSource.clustering.enabled = true;
  dataSource.clustering.pixelRange = 50; // 大概要聚合幾 pixel 內的物件
  dataSource.clustering.minimumClusterSize = 2; // 最小聚合數量

  dataSource.clustering.clusterEvent.addEventListener((clusteredEntities, cluster) => {
    cluster.label.show = false; // label 預設會顯示 這邊我關掉

    cluster.billboard.show = true; // billboard 預設不顯示 要開起來
    cluster.billboard.width = 100;
    cluster.billboard.height = 100;
    cluster.billboard.image = pinBuilder.fromText(`${clusteredEntities.length} 間`, Cesium.Color.BLACK, 100);
  });
}
```

---

## 事件

Cesium 是以 canvas 的方式掛在畫面上的，所以如果它沒有內建一些互動事件的話，  
那就頭大啦......當然 Cesium 是有的，別擔心，就是 [ScreenSpaceEventHandler](https://cesium.com/learn/cesiumjs/ref-doc/ScreenSpaceEventHandler.html)：

```js
// 設定事件
const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

handler.setInputAction((movement) => {
  console.log(movement);
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

啟用 `setInputAction` 並指定事件類型為 `LEFT_CLICK`，  
現在在畫面上隨便點擊都能看到 console 帶出的資料：

```js
{position: wt}
  position: wt
    x: 753.8210172653198
    y: 348.2755460739136
  [[Prototype]]: Object
  [[Prototype]]: Object
```

Cesium 可以用 [`Scene`](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html) 下面的 `pick` 方法，去辨識點擊的位置，  
如果 `pick` 到的東西是 Cesium 裡面的一個物件，那麼可以用 [`defined`](https://cesium.com/learn/cesiumjs/ref-doc/global.html)方法指向它的實例：

```js
handler.setInputAction((movement) => {
  const pickedObject = viewer.scene.pick(movement.position);

  if (Cesium.defined(pickedObject.id)) {
    console.log(pickedObject.id);
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

現在已經能看到點擊的 `billboard` 資料了，  
如果是與後端協作的話，通常會在點擊到 `billboard` 時取出我們先前賦予它的 `id`，  
再跟後端拿更詳細的資料，這邊我們直接把 JSON 的資料直接定義到 `billboard` 裡面就可以了，  
所以要稍微改寫一下 `addBillboard`：

```js
function addBillboard(data, dataSource) {
  dataSource.entities.add({
    name: data['旅宿名稱'],
    id: data.seq,
    address: data['地址'],
    phone: data['電話'],
    website: data['網址'],
    email: data['電子郵件'],
    position: Cesium.Cartesian3.fromDegrees(data['經度Lng'], data['緯度Lat']),
    billboard: {
      image: pinBuilder.fromText('摩鐵', Cesium.Color.PINK, 100),
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      width: 64,
      height: 64,
    },
  });
}
// 旅館的資料大概有這些
// {
//   "seq": 390,
//   "序號": "390",
//   "類別": "旅館",
//   "星等": "",
//   "旅宿名稱": "麗馨麗登精品商旅",
//   "縣市": "高雄市",
//   "鄉鎮": "鳳山區",
//   "地址": "830高雄市鳳山區曹公路77號",
//   "電話": "07-7462128",
//   "傳真": "07-7462129",
//   "房間數": "20",
//   "電子郵件": "leesing.hotel@gmail.com",
//   "網址": "http://www.leesing-hotel.com",
//   "郵遞區號": "830",
//   "經度Lng": "120.357025599",
//   "緯度Lat": "22.6295505022"
// }
```

`Entity` 給我們很大的彈性可以自訂屬性，但這麼做也是比較危險的，  
有可能會複寫到原型鍊的東西，所以一般只會存 id，然後再拿這個 id 去索引資料。

現在稍微調整一下版面，就可以把資料塞到畫面上啦：

```js
handler.setInputAction((movement) => {
  const pickedObject = viewer.scene.pick(movement.position);

  if (Cesium.defined(pickedObject.id)) {
    const infoBox = document.querySelector('.infoBox');
    const { name, address, phone, website, email } = pickedObject.id;

    infoBox.innerHTML = /* HTML */ `
      <div class="infoBox-content">
        <h2>${name}</h2>
        <p>地址：${address}</p>
        <p>電話：${phone}</p>
        ${website ? `<p>網站：<a href="${website}">${website}</a></p>` : ''}
        ${email ? `<p>電子信箱：<a href="mailto:${email}">${email}</a></p>` : ''}
      </div>
    `;
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

Cesium 預設點擊物件會彈出 infoBox 並有一個綠色鎖定框，  
這個事件是可以關掉的，通常初始化時會帶入 options 去關掉：

```js
const viewer = new Cesium.Viewer('cesiumContainer', {
  infoBox: false,
  selectionIndicator: false,
});
```

~~這樣高雄瑟瑟網已經完成得差不多啦！~~

---

## 圖層

GIS 系統裡面很多東西可以透過圖層的方式疊加或混合渲染，  
包含模型、地形、等高線等等，類似 Photoshop 的圖層功能，  
是可以開開關關的，包含前面我們生成的 `Billboard`。

Cesium 透過 `ImageryProvider` 管理畫面的**底圖**，  
網路上有很多地圖服務 API 是有提供底圖可以串接的，但大多要先申請 API Key，  
這裡我們使用免費的「[台灣通用電子地圖](https://maps.nlsc.gov.tw/S09SOA/homePage.action?Language=ZH)」即可（~~讓大家知道政府有在做事~~）。

GIS 有國際規範，所以看不懂下圖這些密密麻麻的代號沒關係，  
GPT 會告訴你解答（？），我們只需要擷取到這些資訊即可：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/2023/1722267426000age58o.png)

`ImageryProvider` 有好幾種，第三方網路服務的底圖要使用 [WebMapServiceImageryProvider](https://cesium.com/learn/cesiumjs/ref-doc/WebMapServiceImageryProvider.html)：

```js
const taiwanMap = new Cesium.WebMapTileServiceImageryProvider({
  url: 'https://wmts.nlsc.gov.tw/wmts',
  style: 'default',
  format: 'image/jpeg',
  tileMatrixSetID: 'EPSG:3857',
  maximumLevel: 19,
  layer: 'EMAP',
});

viewer.imageryLayers.addImageryProvider(taiwanMap);
```

可以發現剛剛看到的規格，Cesium 都有指定要填寫，  
因此我們只要填格子就好，Cesium 會自動去解析 url 裡面的 xml 資料。

如果有留意過 Google Map 的介面，應該會發現網頁版或 App 版都會有這個按鈕，  
裡面就是開關圖層的邏輯：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/2023/1722268260000qoo0pn.png)

我們也可以實作一個按鈕來達到開關圖層的效果，  
圖層有 `show` 這個屬性控制顯示與否，但是必須先把剛剛 `addImageryProvider` 的結果存起來，  
`addImageryProvider` 會返回一個 `Layer` 物件，裡面才有 `show`：

```js
const taiwanMapLayer = viewer.imageryLayers.addImageryProvider(taiwanMap);

btnToggleMap.addEventListener('click', () => {
  const isShow = taiwanMapLayer.show;
  const text = isShow ? '關閉台灣 E-map' : '開啟台灣 E-map';

  taiwanMapLayer.show = !isShow;
  btnToggleMap.textContent = text;
});
```

到目前為止算是大功告成，已經完成一個簡單的圖台系統囉～

完整程式碼可參考：[CodePen 連結](https://codepen.io/shin9626/pen/xxogOKw)

---

## 參考資料

- [CesiumJS](https://cesium.com/learn/cesiumjs/ref-doc/index.html)
