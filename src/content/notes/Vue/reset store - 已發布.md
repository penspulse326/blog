在 Option API 的環境中，可以使用 `$reset` 來將 store 的狀態重置到初始值。  
但在 Composition API 中 store 的實例就沒有這個方法了，  
這個問題在 [GitHub Issues](https://github.com/vuejs/pinia/discussions/1012) 上也有被討論到，在留言中看到有大大想出了好方法！

## Plugin

大大的[文章](https://dev.to/the_one/pinia-how-to-reset-stores-created-with-functionsetup-syntax-1b74)中示範的方法也很簡短。  
Pinia 設計了 `plugin` 的方式，讓我們可以對 store 掛載自定義的靜態屬性。

在 `createPinia` 時可以存取 pinia app 的實例並使用 `.use` 將我們寫好的方法掛載上去，  
之後**所有的 store** 就會在實例化時把指定要掛載的方法或屬性一起加入：

```js
// 自定義的 plugin
export default function resetStorePlugin({ store }: { store: Store }) {
  const initialState = cloneDeep(store.$state); // lodash 的 cloneDeep
  store.$reset = () => store.$patch(cloneDeep(initialState));
}

// 在 main.ts 中進行掛載
const pinia = createPinia();
pinia.use(resetStorePlugin);
```

之後就可以在任意能夠存取 store 的地方一如往常呼叫 `$reset`，例如在按鈕事件中：

```jsx
<script setup lang="ts">
import { useMyStore } from '@/store'

const store = useMyStore();
</script>

<template>
  <p>{{ store.count }}</>
  <button type="button" @click="store.count++">+</button>
  <button type="button"@click="store.count--">-</button>
  <button type="button"@click="store.$reset()">Reset</button>
</template>
```

---

## 重置所有 store

目前我手上的專案有這個需求，所以研究了一下怎麼存取已經存在的 store 實例。

官方有提供 `getActivePinia` 這個 API，但需要存取裡面的私有屬性 `_s`，  
才能拿到 store 的實例集合。

所以另外設計了一個 plugin，讓 store 實例化時被參照到 `trackedStores` 這個 `Set` 裡面，  
`resetAllStores` 來遍歷 `trackedStores` 中所有 store，執行前面掛載好的 `$reset`：

```ts
// 記錄所有實例化的 store
const trackedStores = new Set<Store>();

export function trackStorePlugin({ store }: { store: Store }) {
  trackedStores.add(store);
}

export function getAllTrackedStores() {
  return Array.from(trackedStores);
}

// 重置所有 store 為初始狀態
export function resetAllStores() {
  const stores = getAllTrackedStores();

  for (const store of stores) {
    store.$reset?.();
  }
}
```

掛載到 Pinia 實例上：

```ts
const pinia = createPinia();
pinia.use(resetStorePlugin);
pinia.use(trackStorePlugin);
```

:::info
plugin 除了掛載到 Pinia 實例上來提供所有 store 存取，也可以針對個別的 store 進行掛載，  
只要留意設計函式時必須符合 `PiniaPluginContext` 這個型別。
:::

---

## 優化

當全域的 plugin 變多時，可以統一整理好再使用 `.use` 掛載，  
不過要記得調整 plugin 的函式參數，完整的程式碼如下：

```ts
import { cloneDeep } from "lodash-es";

import type { PiniaPluginContext, Store } from "pinia";

// 掛載 $reset 方法到 store 上
export function resetStorePlugin(store: Store) {
  const initialState = cloneDeep(store.$state);
  store.$reset = () => store.$patch(cloneDeep(initialState));
}

// 記錄所有實例化的 store
const trackedStores = new Set<Store>();

export function trackStorePlugin(store: Store) {
  trackedStores.add(store);
}

export function getAllTrackedStores() {
  return Array.from(trackedStores);
}

// 重置所有 store 為初始狀態
export function resetAllStores() {
  const stores = getAllTrackedStores();

  for (const store of stores) {
    store.$reset?.();
  }
}

// 在 pinia 實例化時，一次性掛載全域的 plugin
export function customPiniaPlugins({ store }: PiniaPluginContext) {
  resetStorePlugin(store);
  trackStorePlugin(store);
}

// 在 main.ts 掛載
const pinia = createPinia();
pinia.use(customPiniaPlugins);
```

---

## 參考資料

- [Pinia: How to reset stores created with function/setup syntax](https://dev.to/the_one/pinia-how-to-reset-stores-created-with-functionsetup-syntax-1b74)
- [Plugins](https://pinia.vuejs.org/core-concepts/plugins.html#Plugins)
