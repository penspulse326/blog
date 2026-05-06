---
title: 'Day 1 - 前言'
description: '介紹 Cozy Chat 專案的背景與目標'
date: 2025-09-02 00:00:00
keywords: [WebSocket, 聊天室, 即時通訊, 專案開發]
tags: ['Cozy Chat', '專案規劃', '即時通訊']
slug: cozy-chat-day1
---

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1756704469000wh6xmh.png)

大家多少都聽過或是用過網路聊天室、交友軟體之類的吧？像是台灣人一定知道的 PTT，或是 Skout、BeeTalk、Tinder 等等族繁不及備載。

這次要挑戰我大學時期蠻流行的匿名一對一聊天網站「[WooTalk 吾聊](https://wootalk.today/)」，當時 Dcard 也正紅，但是礙於每天只能抽一張卡又不保證對方會接受的無奈感（？），這個神秘的網站就在我們宿舍間成為流行......。

我轉職為前端工程師剛滿一年，但除了產品介面的維護之外，還有很多常見的商務功能在工作上一直沒機會碰到，所以想藉由這次鐵人賽，讓自己好好消化一些知識， 並以「廢也要廢得完整」的精神，實踐一套簡單的產品架構，也記錄我的學習過程。

這 30 天的內容大概會這樣進行：

概念探索：

1. 介紹 WebSocket
2. 介紹 Socket.IO
3. 實作簡易聊天室

專案規劃：

1. 分析 WooTalk 之功能流程
2. 技術選型分析
3. 設計資料規格

實作：

1. 建置 monorepo 架構
2. 實作前端
3. 實作後端
4. 單元測試
5. 部署專案

這次的 side project 我也盡量捏在 80/20 法則的範圍內，完全未知的部分是：

1. WebSocket
2. 測試

這些需要爬文研究與 AI 輔助來完建立基礎知識。其他則是我已經略知一二的技術，因此這次挑戰還算是有把握完成，剩下的就在開發過程中慢慢摸索吧！

整體的先備知識大概有：

1. 一點點的 TypeScript
2. 一點點的 React 和 Next
3. 一點點的 Express
4. 一點點的網路概論

真的，就只有一點點......

![gh](https://raw.githubusercontent.com/penspulse326/blog/images/1756743290000t6o8lj.png)

「在開發過程中慢慢摸索」才是隕石開發的醍醐味^O^

專案成果可以參考我的 [GitHub](https://github.com/penspulse326/cozy-chat)，隨鐵人賽進度持續更新。
