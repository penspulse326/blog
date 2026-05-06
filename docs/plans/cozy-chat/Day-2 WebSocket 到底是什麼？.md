---
title: 'Day 2 - WebSocket 到底是什麼？'
description: '介紹 WebSocket 協定的基本概念與運作原理'
date: 2025-09-03 00:00:00
keywords: [WebSocket, 網路協定, 即時通訊, 雙向通訊]
tags: ['Cozy Chat', 'WebSocket', '網路基礎']
slug: cozy-chat-day2
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17568642750002ow1fn.png)

前陣子在學習 NestJS 時，在 [Exception filters](https://docs.nestjs.com/exception-filters#arguments-host) 的章節有看到 `host` 這個參數，型別限制了 3 種值：`http`、`rpc`、`ws`，才知道 WebSocket 也是一種協定，而不是單指特定的函式或套件：

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1756861964000nasaq9.png)

## 網路模型

雖然我的網路概論也只是及格邊緣 QQ 但這邊先簡單科普一點的小知識！

教科書上通常會介紹 [OSI 7 層模型](https://www.cloudflare.com/zh-tw/learning/ddos/glossary/open-systems-interconnection-model-osi/)，在實務上大多會簡化成 TCP/IP 4 層模型。這些模型是在描述電腦網路通訊中收發資料時會經過的程序～我們只要記得這個流程的其中幾層：

1. 實體層：網卡收發訊號
2. 傳輸層：處理端到端的傳輸協定，例如決定採用 TCP、UDP 哪種協定、資料如何分段與重組
3. 應用層：處理應用程式之間的溝通協定，例如 HTTP、FTP、SMTP 等

---

## 那個 Socket 到底是哪個 Socket

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/17568643950008l3d5z.png)

### Socket

Socket 是系統層級的 API，封裝了 TCP/UDP 傳輸協定，也管理連線狀態、資料緩衝區等，讓應用程式可以透過這個 API 來建立傳輸層和應用層之間的邏輯。

一般網站開發不太會碰到這個 API，大多會使用應用層相關的協定，如 HTTP、WebSocket，這些協定的相關函式庫或套件都已經封裝好底層邏輯。但如果是嵌入式系統、即時通訊、自訂協定等需要更好的效能優化與資源調度，就會需要操作到 Socket API。

### WebSocket

WebSocket 是應用程式可以使用的應用層協定。一般網站服務大多是走 HTTP 協定，它的機制就像是問答機器，這個機器只有在我們問它問題時（request），它才會給予回應（response），它不會「主動」向我們說話。

WebSocket 協定會建立一個持續連線，就像打電話，只要對方接聽了，就會保持在雙向接通的狀態，雙方隨時可以主動說話和聽到對方的聲音，直到其中一方掛斷電話，所以在 WebSocket 協定中，伺服器是可以「主動」推送資料給我們的，例如系統提示、全體廣播。

### Socket.IO

WebSocket 只有最基礎的連線建立和資料收發，所以例外錯誤、斷線重連等功能必須要自行實作。Socket.IO 將這些常見功能實作並封裝起來，變成開箱即用的大禮包！

---

## 什麼時候需要 WebSocket

網站功能大多能靠 HTTP 協定這種無狀態的請求來完成資料收發，所以 WebSocket 通常不是標配，除非有「非常需要讓使用者能立刻收到回饋」的功能，例如線上遊戲、聊天室、串流服務等等。

### 輪詢

通知小鈴噹、天氣變化這類需要定時更新，但又不需要即時呈現資料變化的功能，通常會用 HTTP 協定，每幾秒或幾分鐘就發出一次請求，讓使用者有默默更新的體感。這樣的機制也被稱為輪詢（polling）。

長輪詢（long polling）則是會在伺服器有新資料時才回應，否則會保持連線等待一段時間或是等到 timeout 之後再回應，收到回應後才會發出下一次的請求。所以長輪詢的程式碼，在前端一樣是等待回應，但伺服器這端會經過額外的判斷。與一般輪詢相比可以減少請求頻率，但在資料量較大、資料更新更頻繁的情況下表現不一定更好。

### 評估

HTTP 的請求與回應因為無狀態的特性，一來一往都要重新解析封包，但裡面大部分的標頭資訊（header）都是重複的，如果在短時間內頻繁請求可能會產生延遲。

WebSocket 在建立連線後就不會使用 HTTP 標頭，而是更輕量的 WebSocket frame，封包的解析壓力小很多，有更短的延遲，但成本就會體現在伺服器管理變得複雜，硬體負載也更高。

可以想像是在滑手機，接藍牙耳機一定會比有線耳機更耗電，這就是維持雙向連線狀態的代價。

所以「即時性」就和「請求的收發頻率」有關，在決定要採用 HTTP 輪詢還是 WebSocket 之前，要先評估這些功能對即時性的需求程度，看看是否真的需要立刻收發資料。

---

## 本日小結

| 特性     | HTTP                   | WebSocket          |
| -------- | ---------------------- | ------------------ |
| 連線方式 | 請求/回應              | 雙向持久連線       |
| 主動推送 | 不支援                 | 支援               |
| 消耗成本 | 每次請求需重新解析標頭 | 長時間佔用機器     |
| 適用情境 | 網站服務               | 聊天室、遊戲、串流 |

---

## 參考資料

- [什麼是 OSI 模型？](https://www.cloudflare.com/zh-tw/learning/ddos/glossary/open-systems-interconnection-model-osi/)
- [Http、Socket、WebSocket之间联系与区别](https://www.cnblogs.com/aspirant/p/11334957.html '发布于 2019-08-11 14:34')
- [網頁通訊系列：Polling, Long Polling, Websocket, Server Sent Event, WebRTC](https://medium.com/@wutamy77/%E7%B6%B2%E9%A0%81%E9%80%9A%E8%A8%8A%E7%B3%BB%E5%88%97-pooling-websocket-server-sent-event-webrtc-49892c580b5f)
