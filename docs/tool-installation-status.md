# 發布工具檢查與安裝｜2026-11-16

## 實際檢查

| 項目 | 結果 |
| --- | --- |
| Node.js | 已存在，可執行專案 |
| Codex CLI | 已存在，支援 plugin add |
| Git | PATH 與常見安裝位置均未找到 |
| GitHub CLI（gh） | PATH 與常見安裝位置均未找到 |
| Windows winget | 有命令入口，但執行回報檔案無法存取 |
| GitHub 外掛 | 最近一次查詢為未安裝；是可選路線，不是 Git＋gh 發布的必要條件 |
| GitHub 登入 | 缺少可用連線／gh，尚未驗證帳號授權 |

目前環境 USERPROFILE 存在，但 HOME／CODEX_HOME 未設定；先前 codex 外掛安裝實際回報無法解析使用者目錄。本輪沒有改寫全域設定或冒稱已修復。

## 已做的安裝嘗試

- 查詢 GitHub 官方 release API：Unable to connect to the remote server。
- 執行 winget --version：The file cannot be accessed by the system。
- 已製作外層 install-github-tools.ps1 及 install-github-tools.cmd，PowerShell 語法解析通過。
- 已實際執行安裝腳本，下載階段回報 Unable to connect to the remote server，未完成安裝。
- 目前沒有建立 Repository 或部署網站。

## 可執行的一鍵安裝檔

在原始工作區外層雙擊 install-github-tools.cmd。它由官方 Git for Windows／GitHub CLI release 下載 x64 可攜版本，驗證 release API 的 SHA-256 digest，再解壓至外層 .tools；缺少 digest 或下載失敗就停止，不安裝。已有工具則沿用，已完成的工具路徑記錄於 .tools/installed-tools.json，方便後續 AI 查找。

腳本不變更系統 PATH，不新增 Copilot，不上傳資料；PATH 僅作用於該次程序。最後由本人完成 GitHub 瀏覽器授權（包含上傳 workflow 所需 scope），設定 Git 憑證並查詢帳號名稱。權杖交由 GitHub CLI 管理，不傳入聊天或專案。

這兩個安裝檔在工作區外層，不是網站原始碼；外層 .tools 也不會被 tea-name-wiki 的上傳封裝納入。公開副本使用者可自行從官方來源安裝工具，不需這些外層檔案。

參考：[Git for Windows](https://git-scm.com/install/windows)、[GitHub CLI 官方 Windows 安裝文件](https://github.com/cli/cli/blob/trunk/docs/install_windows.md)。
