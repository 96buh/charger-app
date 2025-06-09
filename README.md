# 手機充電異常檢測

```text
.
├─ apps/
│　└─ charger/
│　　　├─ app/
│　　　├─ assets/
│　　　├─ component/
│　　　└─ ...
├─ pacakges/
│　└─ mybattery/
│　　　├─ ios/
│　　　└─ android/
└─ pacakge.json

```

`package`是一個調用[BatteryManager](https://developer.android.com/reference/android/os/BatteryManager)的 module
`apps/charger`是 React Native app 的程式碼，要執行程式要在`apps/charger/`裡面執行，安裝 package 也一樣。

## Run

先到`apps/charger/`安裝依賴項

```bash
npm i
```

因為有使用 native module，所以**不能使用 expo go 測試**要執行 development build 才能測試

```bash
# 需要安裝android studio
npx expo run:android
# 需要安裝xcode(mac only)
npx expo run:ios
```

# 常用 git 指令

- `git log`: 看 commit 紀錄
- `git status`
- `git add <filename>`
- `git commit -m "commmit message"`
- `git checkout -b "new-branch-name"`: 創建新分支
- `git checkout "branch-name"`: 切換分支
- `git branch`: 看目前在哪個分支
- `git fetch`: 將 remote 最新的 commit 下載到本地
- `git push [remote-name] [branch]`: 把 commit push 到 remote 的特定分支
