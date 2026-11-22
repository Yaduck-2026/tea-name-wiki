# Tasks

## 1. 檢查器支援退役原件

- [x] 1.1 在 `scripts/check.mjs` 讀取 manifest 的 `retired` 欄位：驗證 `date` 為 YYYY-MM-DD、`reason` 為非空字串；已退役且檔案不存在時不列錯誤，檔案存在時照樣核對 hash。驗證：以隔離副本執行 check，格式錯誤列錯誤、合法退役不列錯誤
- [x] 1.2 內文連結檢查：指向已退役原件的連結只在 kind 為 log 的頁面允許，其他頁面列「連結指向已退役原件」錯誤。驗證：隔離副本中來源頁保留原件連結時 check 失敗
- [x] 1.3 來源頁與 manifest 比對改用 `record.originalAvailable && !record.retired`；rawRefs 全部已退役的來源頁不顯示「原文未封存」提醒。驗證：退役後來源頁仍為 true 時 check 失敗，改 false 後通過且警告數不增加
- [x] 1.4 在 `tests/admin.test.mjs` 新增退役情境測試（缺檔不報錯、hash 不符報錯、一般頁連結報錯、log 連結允許、originalAvailable 不一致報錯）。驗證：`npm test` 全部通過

## 2. 退役 user-update-policy 原件

- [x] 2.1 在 `raw/manifest.json` 的 `raw/articles/user-update-policy-v1.md` 紀錄加上 `retired`（2026-11-22，原因：使用者表示不再使用，原件已不在本機），path 與 sha256 不變。驗證：`git diff` 只新增 retired 欄位
- [x] 2.2 修改 `wiki/sources/user-update-policy.md`：`originalAvailable` 改 false、移除原件連結、說明原件已退役與日期，摘要與影響頁不變，更新 `updated`。驗證：check 對該頁無錯誤
- [x] 2.3 在 `wiki/log.md` 追加 2026-11-22 的原件退役紀錄（退役檔案、原因、修改頁、限制），不改寫 2026-11-15 的舊紀錄。驗證：`git diff` 中 log 只有新增行與 frontmatter 的 updated
- [x] 2.4 執行 `npm run check` 與 `node scripts/check.mjs --public`。驗證：兩者皆 0 errors，嚴格模式警告維持 8 則

## 3. 規則與開發紀錄改版

- [x] 3.1 AGENTS.md：開頭閱讀清單移除 docs/progress.md；§2 移除「每次討論同步 progress 與外層討論檔」；§3 新增原件退役規則（manifest 標記 retired、保留 hash、來源頁 originalAvailable 改 false 並移除連結、log 舊連結保留）。驗證：AGENTS.md 不含 progress 與 OpenSpec 字樣
- [x] 3.2 docs/content-guide.md：新增資料流程移除「更新 progress 與討論」；原件段落加入退役規則，並把 originalAvailable 的禁令改為「未標記退役時不可改 false」。驗證：內容與 AGENTS.md §3 一致
- [x] 3.3 docs/progress.md 開頭加上停止更新說明（2026-11-22 起，開發紀錄見 openspec/changes），其餘內容不變；README 將「製作進度」標為歷史紀錄。驗證：`git diff` 中 progress 只有開頭新增段落
- [x] 3.4 openspec/config.yaml 的 context 補充：開發紀錄以 change 保存，Wiki 內容操作記在 wiki/log.md。驗證：`openspec validate --all --strict` 通過

## 4. 整體驗證

- [x] 4.1 執行 `npm test`、`npm run check`、`node scripts/check.mjs --public`、`npm run build`。驗證：測試全過、兩種檢查 0 errors、建置 16 頁且輸出不含 user-update-policy

## Workflow follow-up

- 使用者審閱實作結果後，封存此 change（`/opsx:archive`），讓 development-records 與 admin-console 的變更併入主規格。
- 封存後 commit 並 push；知識頁不變，但線上 AGENTS.md 需手動執行 workflow 才會更新。
