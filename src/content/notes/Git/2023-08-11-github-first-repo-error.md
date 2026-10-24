---
title: "Github 初次上傳就失敗"
description: "初次上傳 Github 專案時會碰到的問題"
date: 2023-08-11 16:47:47
keywords: [git, github, token]
tags: ["踩坑", "Git"]
slug: github-first-repo-error
---

這幾天在部署 Github Pages 時遇到了一些問題，  
我覺得好像又可以從頭開始釐清流程了，希望對上傳 repo 時遇到認證問題的人有幫助。

我有錄製一部懶人包，歡迎參考～
[影片連結](https://www.youtube.com/watch?v=xAUhXfAi1Hc)

## 1. 建立 repo：

無論你在電腦裡已經有透過 git init 產生了有 git 版控的檔案，  
或是想直接 Github 網站建立 repo 開始，  
最後都會經過 "**把電腦裡的檔案上傳到 Github**" 這一關，  
所以一切就從 Github 網站建立 repo 開始吧！

登入 Github 後在右上角按 + 後選 New repository 建立。

![建立新專案](https://drive.google.com/uc?export=view&id=1lN4Kd94-lpvrUrpVNMF7qXoZWhAXTaw2)

## 2. 在操作終端機之前：

在輸入好專案名稱跟一些內容摘要之後，  
最下面可以選擇一些和專案初始化有關的設定，  
如果在此時有勾選 **Add a README file** 會產生另一個做法。

![Add a README file](https://drive.google.com/uc?export=view&id=12TMy7lC-S5NLSPU6MkgplWp4jUeloL_Z)

### 有勾選 **Add a README file** 的狀況：

Github 會直接給你 push 過一次的乾淨專案的頁面，  
裡面只有剛剛勾選要加入的 README.md 這個檔案（它把 README.md push 上去了），  
按右上角的 Code 選 HTTPS ，將這個網址複製下來，

![複製 code](https://drive.google.com/uc?export=view&id=1vsbDJY6VvZXFSJ8W1atInB5rxbHIV1JL)

然後在終端機切換到桌面或是任何你方便 cd 過去的地方，  
或是可以直接在桌面或資料夾空白處右鍵開啟終端機省去 cd 切換目錄的步驟，  
輸入 git clone 在後面加上剛剛複製的網址，  
這時 Github 新增一個資料夾，名稱是 repo 的名字，  
這個資料夾就與剛剛新建的 repo 連動了，  
把要上傳的檔案通通丟到這個資料夾即可。

```bash
    git clone https:xxx...
```

### 沒勾選 **Add a README file** 的狀況：

Github 會給你一串 git 指令要你在終端機複製貼上執行：

![密密麻麻的 git command](https://drive.google.com/uc?export=view&id=1NnBieHCh9xFGAvpENCG-OuIgN03h36Qw)

方法 1 的意思是需要你建立一個乾淨的資料夾，在終端機 cd 到此資料夾然後輸入這堆指令連動，  
方法 2 的意思是直接在終端機切換到要上傳的資料夾再輸入指令進行連動，  
無論用哪個方法都要記得確認終端機上目前所在的路徑是不是你要的資料夾，  
連動後的資料夾裡面會有一個隱藏資料夾 .git 還有 README.md，  
看到這兩個東西就算是連動成功。

## 3. 上傳三部曲：

以上兩種狀況最後都會讓電腦端的資料夾和遠端的 repo 連動，  
最後將要新增或修改好的檔案丟到資料夾後，  
終端機先輸入 git status，確認 git 是否有偵測到所有修改過的檔案。

輸入 git add . 將檔案加入這次的提交。  
然後輸入 git commit -m "提交留言"，  
提交留言的內容通常會寫大致修改了什麼功能，最好別寫太長，  
寫一些關鍵字讓以後的自己知道進度在哪即可（引號不能省略）

如果是懶人也可以把 -m 改為 -am，這個 a 就代表前面的 git add 了，可以少打一行指令。  
最後輸入 git push 就完成了，如果這裡系統提示 push 需要指向到遠端 repo 的 origin 原始分支，  
複製它建議給你的指令進行　 push 即可。

```bash
    git status // 檢查資料夾的變動
    git add . // 加入所有變動
    git commit -m "first commit" // 提交
    git push // 把提交內容 push 到遠端 repo
```

---

## 所以 password 到底是什麼 ？

如果您在 repo 建立的初期或是 push 時一直因為 Github 的使用者認證卡關，  
那麼這就是我寫此文的原因 XD

Github 已經不能再透過自己的帳號密碼去認證了，  
此時電腦裡的認證已經到期或是第一次使用 Github，  
就會遇到要再輸入一次 username 和 password 的情況，  
這時 password 要輸入的就不再是你原本登入 Github 的密碼了！  
如果您使用的是 vs code 開發工具，現在會跳出一個不太明顯的小視窗，  
提示要輸入 github token。

這時要登入 Github 網站 > 右上角頭像 > Setting > 左邊選項的最下面選 **Developer Settings**

左邊的 Personal access tokens 選擇 Tokens(classic) 後，  
右邊選 Generate new token(classic) 進到建立 token 的頁面。

下面的表單可以選擇此 token 能用於什麼驗證，  
把 repo 打勾後到最下面就可以產生 token。

![repo 要打勾](https://drive.google.com/uc?export=view&id=1iBrodhA0pq-eKxgv2NZx-33HVSH52YVs)

產生好後頁面上有一串像亂碼的東西就是剛剛建立的 token，  
也就是在終端機被 Github 要求輸入 password 時要打的東西，  
複製貼上送出後就完成 push 了！

![不用擔心這 token 我早就刪掉了](https://drive.google.com/uc?export=view&id=11uqWt_bewP3iNeJ7CF5t7DVdcNOeXzEE)

在我第一次遇到這個問題時，我以為這個 token 就是萬用的，  
所以建立 token 的畫面沒有勾選 repo，之後當然也 push 失敗，  
頓時對世界感到一片灰暗...只好回去默默地更新自己的 SSH 憑證，  
不過大概閱讀每個頁面的資訊就會發現問題了，不用自己嚇自己 XD

---

## 參考資料

[Github Token 取得](https://shengyu7697.github.io/github-personal-access-token/)
