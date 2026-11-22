# GitHub 上傳與 Pages 發布準備

## 已確認的遠端倉庫

使用者提供：https://github.com/Yaduck-2026/tea-name-wiki.git 。瀏覽入口：[Yaduck-2026/tea-name-wiki](https://github.com/Yaduck-2026/tea-name-wiki)。2026-11-16 使用者截圖顯示個人公開倉庫已建立、當時尚無檔案；這是使用者畫面確認，工具尚未完成遠端讀取、寫入或 Pages 驗收。

本機仍未找到可用 Git／gh，也沒有已授權的 GitHub 寫入工具。因此準備外層 github-upload 的兩批純原始碼資料夾，可使用目前已登入的 GitHub 網頁上傳：先將 01-project **裡面的全部內容**拖到倉庫的 uploading an existing file，提交後再從 Add file → Upload files 上傳 02-docs **裡面的 docs 資料夾**。不要上傳 01-project／02-docs 這兩層包裝，也不要把 zip 當成網站原始碼。

完成後 Repository 根目錄應看見 AGENTS.md、package.json、wiki、scripts、docs 及 .github；再到 Settings → Pages 選 GitHub Actions，Actions → Test and publish TeaWIKI → Run workflow。正式網站網址須等部署成功後取得，不把預期網址當驗證結果。

以下「尚未建立 Repository」等段落保留為此前準備時的紀錄；目前以本節為準：倉庫已由使用者建立，上傳與部署未完成。

## 一鍵接續發布（本機工作區）

使用者已安裝 GitHub CLI 並完成瀏覽器帳號授權，但 Git 尚未安裝。工作區外層新增 publish-teawiki.cmd／ps1，可在正常 Windows 環境執行：呼叫官方可攜工具安裝器、核對本人帳號及公開倉庫管理權、必要時補 workflow 授權、clone 現有倉庫至獨立目錄、套用已審查 zip、執行測試／公開檢查／建置、一般 push（不 force）、設定 Pages workflow、手動發布並等候遠端成功，再檢查首頁、admin/ 與 public-data.json 回應 200。只在全部完成後寫入外層 .tools/publish-result.json。

發布腳本不邀請協作者、不部署本機 API，也不建立自動內容研究排程。憑證由 gh 管理，不寫入專案。clone 目錄保留，出錯即停止，不刪除遠端或覆寫提交歷史；它會更新倉庫中與 zip 同名的專案檔案，其他檔案不主動移除。

2026-11-16 僅完成 PowerShell 語法解析；受工具網路限制，這份發布腳本尚未完成實際遠端執行。gh 帳號檢查收到禁止 socket 連線錯誤，不能據此斷定權杖過期或要求本人重登。當前仍不得宣稱已部署。

## 本次上架進度｜2026-11-16

使用者已要求協助上架，預設使用個人帳號的公開 `tea-name-wiki` Repository。目前查得 GitHub 外掛尚未安裝／連線，本機也沒有可用的 Git 或 GitHub CLI，因此還不能建立遠端、上傳或啟動 Pages。已請使用者透過 ChatGPT 完成 GitHub 連線，不在對話中索取密碼或權杖。

可先使用外層 `tea-name-wiki-github.zip` 作為上傳候選封裝；它只包含本專案，排除 `.local`、原件、環境檔及產生的 `dist`，保留隱藏的 workflow、gitignore、gitattributes。壓縮檔不是已上線網站，也不能將 zip 本身上傳就完成部署。正式發布需解開後將專案內的檔案放在 Repository 根目錄。

連線後依序建立／確認個人 Repository、上傳檔案、設定 Pages 使用 GitHub Actions、手動執行 workflow，再以實際執行結果查驗閱讀站及唯讀展示頁。只有取得成功結果後才補上正式 Repository 與網站網址。

### 封裝實測結果

- 2026-11-16 封裝 105 個檔案，zip 完整性檢查通過，包含 `.github/workflows/pages.yml`、`.gitignore` 及 `.gitattributes`。
- 在解壓後的隔離副本實跑管理測試：11／11 通過；公開副本結構檢查：22 頁、9 個封存紀錄，0 errors、9 warnings。
- 提醒包括既有八份外部原文未封存，以及依預期未打包的一份本機使用者原件；沒有修改 manifest 掩蓋缺檔。
- 同一副本成功建置 16 頁公開內容及唯讀管理展示；測試不讀取正式本機密碼，也不寫入正式 Wiki。
- 常見 GitHub／模型權杖與私鑰格式掃描無命中；此掃描不等於能識別所有敏感資料。
- 以上為本機封裝驗證，GitHub 遠端測試與網站驗收尚未執行。

目前尚未建立 Repository 或部署；本文件與 workflow 是準備成果，不是已發布證明。

## 上傳範圍

以 tea-name-wiki/ 為 Repository 根目錄，不包含外層其他主題草稿。

- 包含：AGENTS.md、wiki、config、site、scripts、tests、package.json、文件、來源定位紀錄與 manifest、歷史資料及 workflow。
- 不包含：raw/articles、raw/social、.local、dist、環境檔及秘密資料；.gitignore 已設定。
- 新來源的名稱、摘要、來源網址及 manifest metadata 仍可能在倉庫，提交前需自行審閱；不能只依賴 .gitignore 判斷所有資訊都適合公開。
- 自己電腦的 raw 原件與版本備份另行保留，公開倉庫不是完整私有備份。

## 建立與發布

1. 登入 GitHub，建立公開 Repository，將上述專案完整上傳並保留 .github/workflows/pages.yml。
2. Repository 的 Settings → Pages，將發布來源選為 GitHub Actions。
3. 推送到 main 分支即自動執行；需要重新部署或排錯時，也可在 Actions → Test and publish TeaWIKI → Run workflow 手動執行。
4. 工作流程先測試與檢查，再建置 dist，最後部署 Pages。
5. 等 GitHub 顯示成功，再以實際回傳網址開啟公開首頁及 admin/ 展示頁。

workflow 在推送到 main 或手動執行時運作，不做新茶搜尋，也不設週期更新。之後本機修改 Wiki，只要把可公開變更推送到 main，網站就會自動更新；測試、檢查或建置任一步失敗時不會部署，線上維持上一版。（2026-11-22 起，此前只能手動執行。）

一般專案站可能使用帳號網域加 Repository 子路徑；本專案資產及資料使用相對路徑，不寫死帳號。正式網址以 GitHub 的實際部署結果為準。

## 發布的是什麼

- 根目錄：公開茶知識閱讀站。
- admin/：同款管理介面的唯讀展示；上傳／保存功能停用，明確說明需在本機開啟。
- 本機 npm run admin：真實可寫的管理後台，不會被 GitHub Pages 執行。

## 本人管理權限

- 使用個人帳號擁有的 Repository，不新增其他寫入協作者；一般訪客可以閱讀公開檔案，但不能直接修改原倉庫。
- workflow 由推送 main 或手動執行觸發，兩種方式都驗證執行者等於 repository_owner。組織倉庫的 owner 是組織名稱，不能直接套用此條件，若改用組織需另指定允許的使用者。
- 本機管理頁需密碼登入；.local/admin-auth.json、原件、版本與工作階段不部署。前端程式碼不能放密碼或 GitHub 權杖。
- 此時尚未建立遠端 Repository，因此沒有宣稱已檢查 GitHub 實際協作者、授權或帳號安全設定。

官方參考：[GitHub Pages 的靜態託管說明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[自訂發布工作流程](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

此環境目前未找到 Git／GitHub CLI，尚未確認 GitHub 連線。若請 AI 代上傳，需在正式發布階段使用可用帳號連線；不要把密碼或權杖寫進檔案。

## 啟動檔位置更正｜2026-11-16

使用者回報找不到後，實際確認舊外層發布檔不存在，已補建並逐一核對。目前請使用 tea-name-wiki/publish-teawiki.cmd（或外層同名轉接檔），其腳本為 tea-name-wiki/.local/publishing/publish.ps1；不依賴舊外層安裝器。Git 安裝、私有 clone 與成功結果均在 .local/publishing。已檢查檔案存在且腳本語法通過，遠端尚未實測成功。

## 憑證設定錯誤已修正｜2026-11-16

首次執行在 helper 的內嵌引號發生參數拆分錯誤（exit 129），已改用 PATH 中的 gh。實際 Git 寫入／讀回設定成功；公開封裝經 Git 提交及 clone 後，hash 檢查及網站建置通過。沿用原啟動檔重跑即可。遠端部署尚未驗收成功。
