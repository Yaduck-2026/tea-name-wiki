# Design

## Context

動機見 proposal.md。現況：

- `raw/manifest.json` 每筆紀錄有 `path`、`sourceId`、`recordType`、`originalAvailable`、`sha256`。`scripts/check.mjs` 在嚴格模式下，manifest 有紀錄但檔案不存在就列錯誤；`--public` 只對 `raw/articles`、`raw/social` 放寬。
- check 也要求來源頁的 `originalAvailable` 與每個 rawRef 對應紀錄的 `originalAvailable` 完全相同。
- 內文連結指向不存在的檔案就列錯誤，不分頁面種類。目前錯誤來自 `wiki/log.md` 第 27 行與 `wiki/sources/user-update-policy.md` 的原件連結，以及 manifest 缺檔。
- 規則限制：raw 封存不改寫、不重算 hash；log 只能追加。content-guide 明文禁止「把 originalAvailable 改成 false 掩蓋資料遺失」。
- 管理服務透過子程序執行 check.mjs 取得結果；原件下載在 `originalAvailable` 為 false 時已會拒絕。

## Goals / Non-Goals

**Goals:**

- 讓「刻意不再保留的原件」成為有紀錄、可檢查的狀態，和「意外遺失」分開。
- 嚴格檢查在不改寫 log、不改 hash 的前提下回到 0 errors。
- 開發紀錄的位置改為 OpenSpec，舊 progress 凍結。

**Non-Goals:**

- 不提供管理介面的「退役原件」按鈕；退役仍是手動維護操作。
- 不刪除 manifest 紀錄，也不刪除來源頁或綜合頁。
- 不處理同一來源頁同時有已退役與未退役 rawRefs 的混合情況（目前沒有這種資料）。

## Decisions

**1. 在原 manifest 紀錄加 `retired` 欄位，而不是另加一筆紀錄或刪除紀錄。**
格式：`"retired": { "date": "2026-11-22", "reason": "..." }`。原本的 `path`、`sha256`、`originalAvailable` 不動，保留「曾經封存過什麼」的歷史。
- 另加一筆退役紀錄：check 會把同一路徑視為重複而失敗，而且要另外設計紀錄間的關聯。
- 刪除紀錄：失去 hash 歷史，違反「不掩蓋修改」的規則。

**2. 來源頁的 `originalAvailable` 表示「目前可取得」；檢查時的預期值為 `record.originalAvailable && !record.retired`。**
這樣退役後來源頁設 false 是正確狀態，原件下載也會自動拒絕，管理服務不需改。content-guide 的禁令同時改寫成：只有在 manifest 明確標記退役時才可設 false，不能用來掩蓋遺失。

**3. 只有 kind 為 log 的頁面可以保留指向已退役原件的連結。**
log 只能追加，舊紀錄的連結無法修改；其他頁面可以修改，所以要求移除連結，避免讀者點到不存在的檔案。
- 替代方案：所有頁面都放寬。這會讓來源頁長期掛著失效連結，不採用。

**4. rawRefs 全部已退役的來源頁不顯示「原文未封存」提醒。**
這是刻意的狀態，不是待補的缺口；若照樣提醒，嚴格檢查會多一則誤導的警告。

**5. 開發紀錄改由 OpenSpec change 保存；progress.md 加停止更新說明後凍結。**
AGENTS.md 只移除 progress 相關規定、不指向 OpenSpec（使用者要求）；指引改寫在 openspec/config.yaml 的 context、README 與 progress 開頭。

## Risks / Trade-offs

- [管理介面首頁的「尚未封存原文」計數依 `originalAvailable` 計算，會從 8 變成 9，把已退役的來源也算進去] → 本次不改前端（不在需求範圍）；若需要區分，另開 change 在 state API 帶出退役資訊。
- [手動編輯 manifest 可能打錯欄位] → check 驗證 `retired.date` 為 YYYY-MM-DD、`retired.reason` 為非空字串，格式不符列錯誤。
- [新的 AI 對話只讀 AGENTS.md，可能不知道要用 OpenSpec] → OpenSpec 在 `.claude/` 的 opsx 指令與技能、config.yaml 及 README 都有說明；AGENTS.md 依使用者要求不提及。

## Migration Plan

1. 先改 check.mjs 與測試，確認既有資料下的結果只差在預期的錯誤。
2. 再改 manifest、來源頁並追加 log，跑嚴格與公開兩種檢查，預期 0 errors。
3. 規則文件同步後 commit。公開知識頁不受影響（user-message 來源不輸出）；建置會一併輸出 AGENTS.md，需手動重新部署才會更新線上版本。
回復方式：git revert 該次 commit 即可，manifest 的 hash 從未改動。
