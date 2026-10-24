前端框架通常也會負責路由管理，如果是要做大型元件的切換（換頁），  
就會用到路由管理來重新導向網址，但還是會維持 SPA 的特色：  
「**不會重新整理頁面**」！  
這樣的功能可以稱為**前端路由**。

## HashRouter / BrowserRouter

官方推薦 BrowserRouter 來引進路由系統，  
但是一般練習、交作業等等，會把 React 專案打包成靜態頁面，  
再上傳這包靜態檔案變成 Github Page，這時要用 HashRouter。

BrowserRouter 需要直接運行 React 才能做到元件切換，  
所以有專用伺服器在跑 React App 的狀況下會使用 BrowerRouter 做管理。

---

## Route

Route 可以設定指向的路徑和要渲染的元件，但是外層要先用 Routes 包起來：

```jsx
const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Homepage />} />
    </Routes>
  </HashRouter>
);
```

基本的路由結構大概會長這樣，Route 元件裡面可以再包一個 Route 形成**巢狀路由**，  
這樣的結構也比較貼近我們一般在網址列看到的結構：

```jsx
const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="about" element={<About />} />
        <Route path="products" element={<Posts />} />
        <Route path="contact" element={<Contact />} />
      </Route>
    </Routes>
  </HashRouter>
);
```

---

## Outlet

通常一個網站的 Navbar、Footer 還有一些通用元件是每頁都會固定出現的，  
所以我們會再設計一個 Layout 元件把這些固定元件包起來，  
然後再當中插入 Outlet 這個元件：

```jsx
const Layout = () => (
  <>
    <Navbar></Navbar>
    <Outlet></Outlet>
    <Footer></Footer>
  </>
);
```

這個 Layout 元件會放在巢狀路由的頂層，  
表示裡面要匹配的所有頁面不用更動 Layout 裡面的東西，  
而剛剛插入的 Outlet 元件就會依照匹配到的路徑做更換，變成 About、Contact 等：

```jsx
const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="about" element={<About />} />
        <Route path="products" element={<Posts />} />
        <Route path="contact" element={<Contact />} />
      </Route>
    </Routes>
  </HashRouter>
);
```

這時連上網站只會顯示 Layout 裡面的 Navbar 和 Footer，沒有其他內容，  
因為沒有匹配到下面任何路徑，但一般會希望這個路徑 "/" 預設要顯示首頁。

在巢狀路由的第一項新增一個 Route，path 屬性不用打而是改成 index，  
這樣 "/" 就會顯示 Home 元件了：

```jsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />} />
  </Route>
</Routes>
```

當然超過兩層以上的路由也是很常見的，所以不只有 Layout 會需要加入 Outlet 元件。

---

## Link

Link 類似 a 標籤，但是 a 標籤會跳轉頁面，Link 則是幫我們做到元件切換，  
雖然網址列有改變但不會重新刷新頁面：

```jsx
<Link to="about">關於我</Link>
```

一般帶資料可以用 query string 或 params 的方式， 在 React-Router 可以直接用 props 帶東西，  
這時可以在 Link 裡面使用 state：

```jsx
<Link to="comments" state={data}>
  留言
</Link>
```

上面的 Link 點擊後會切換到 comments 這個 path 匹配的元件，  
在元件裡面用 useLocation 可以把剛剛夾帶的 state 拿出：

```jsx
const location = useLocation();
console.log(location.state);
```

---

## NavLink

作用和 Link 差不多，但是 NavLink 有自帶一些 props，可以用表達式解構出來，  
最常用的是 isActive，這個參數用來表示目前的網址是否匹配到 to 寫的路徑，  
解構在 className、inline style 或 children 都很好用，  
這邊示範匹配成功就套用 "active" 這個 className：

```jsx
<NavLink to="login" className={({ isActive }) => (isActive ? "active" : "")}>
  登入
</NavLink>
```

---

## Dynamic Route

上面介紹的路由方式大部分都是寫好就可以做到元件切換了，  
但透過 `/:id`、`/comments?name=vincent` 產生的有隨機性、不是固定路徑的動態路由，  
在 React-Router 也有對應的方式可以捕捉。

## param

假設我們寫好 Route 要利用 id 去渲染：

```jsx
<Route path="comments" element={<CommentList />}>
  <Route path=":id" element={<Comment />} />
</Route>
```

進到 Comment 這個元件後要用 useParams 來捕捉我們寫在網址上的`:id`：

```jsx
const Comment = () => {
  const { id } = useParams();

  return <span>留言 id: {id}</span>;
};
```

## query string

`/comments?name=vincent` 這段 query string 的值則是要用 useSearchParams 來取得：

```jsx
const { name } = useSearchParams();
console.log(name); // vincent
```

---

## useNavigate

在動態路由裡面我們有可能打了 API 之後，資料庫告訴我們此 id 不存在，  
或是登入狀態過期了需要重新導向頁面等等，面對此類錯誤處理的情況可以使用 useNavigate，  
把目前的畫面轉跳，另外 navigate 也是能帶 state 過去的：

```jsx
const navigate = useNavigate();

if (!id) navigate("/error", { state: message });
```

一樣用 useLocation 就可以取出 state 囉。

---

## 參考資料

- [React-Router Tutorial](https://reactrouter.com/en/main/start/tutorial)
- [Wei Wei 的 React-Router 教學](https://youtu.be/gV07Tqi0i_o?si=zTTQ2h-ON3XhtDS-)

---

關聯主題：[[主題索引/React]]
