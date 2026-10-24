在 React 環境使用 RTK 需要兩個 package：

```tsx
npm install @reduxjs/toolkit
npm install react-redux
```

建立全域狀態需要做三件事：

1. 建立 slice
2. 建立 store
3. 載入 store

基本上很像濃縮 useContext 和 useReducer，會有一些熟悉的名詞不斷出現（？  
只是要稍微熟悉一下 RTK 的語法。

---

## slice

slice 就像 createContext，要定義一塊資料集，包含：

- 資料的名稱（name）
- 資料的內容（initailState）
- 操作資料的方法（reducers）

```tsx
import { createSlice } from "@reduxjs/toolkit";

const searchLogSlice = createSlice({
  name: "searchLog",
  initialState: {
    list: [] as LogType[],
  },
  reducers: {
    addSearchLog: (state, action) => {
      state.list.push(action.payload);
    },
    clearLog: (state) => {
      state.list = [];
    },
  },
});

export const { addSearchLog, clearLog } = searchLogSlice.actions;
export default searchLogSlice.reducer;

export type LogType = {
  name: string;
  id: number;
  timestamp: string;
};
```

reducers 裡面定義的方法也和 useReducer 的操作一樣，  
這些方法都自帶兩個參數：

1. state 可以取出這個 slice 目前的狀態，它的初始值就是 initialState
2. action 代表方法被觸發時帶入的資訊，action.payload 可以取得帶入的參數

slice 要 export 兩個東西：

- 把 reducers 裡面定義從 `slice.actions` 丟出
- 把整個 `slice.reducer` 輸出（沒有 s）

---

## store

store 要把所有 slice 集合在這裡，然後輸出到整個 app 的環境內使用，  
因此可以把 slice 想成小的 context，store 像大的 context 把它們打包。

```tsx
import { configureStore } from "@reduxjs/toolkit";
import searchLogReducer from "./features/searchLogSlice";

export const store = configureStore({
  reducer: {
    searchLog: searchLogReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
```

在 `configureStore` 帶入的物件裡面宣告 reducer 這個物件之後，  
就可以把 slice 裡面輸出的 reducer 在這邊載入。

稍後要存取整個 store 時需要聲明型別才能取出，
所以這邊直接輸出 `export type RootState = ReturnType<typeof store.getState>`

---

## 使用

store 通常在 app 的上層載入，方式也與 context 很像，
在 Provider 元件帶入 store 變數就可以了：

```tsx
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Provider } from "react-redux";
import { store } from "./store/index.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
        <App /> {" "}
  </Provider>,
);
```

接著在子元件要存取 store 時，要 import 這些：

```tsx
import { useDispatch, useSelector } from "react-redux";
import { addSearchLog, clearLog } from "./store/features/searchLogSlice";
import { RootState } from "./store";
```

### useSelector

useSelector 可以取出某個 slice 的狀態，這時 state 被強制要求聲明型別，帶上 RootState 即可：

```tsx
const logList = useSelector((state: RootState) => state.searchLog.list);
```

### useDispatch

我們在 slice 的 reducers 定義的那些方法不能直接呼叫執行，  
要包在 dispatch 裡面呼叫：

```tsx
const dispatch = useDispatch();
const handleSearch = () => {
  const data = {
    name: "妙蛙種子",
    id: 1,
    timestamp: new Date().getTime(),
  };

  dispatch(addSearchLog(data));
};
```

在 `addSearchLog(data)` 帶入的參數就是用 `action.payload` 取出來的。
