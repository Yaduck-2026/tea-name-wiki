# admin-console Specification

## Purpose

定義本機管理介面（npm run admin）：上傳原件、編輯 Wiki、版本保存與回復、整理工作及檢查模式。使用方式見 docs/admin-guide.md，測試結果見 docs/admin-test-report.md。

## Requirements

### Requirement: 只在本機提供服務

npm run admin SHALL 啟動只監聽 127.0.0.1 的管理服務。系統 MUST NOT 改為公開監聽，也 MUST NOT 將本地寫檔 API 部署到 GitHub Pages。管理介面 MUST NOT 包含模型聊天或自動研究。

#### Scenario: 啟動管理服務

- **WHEN** 執行 npm run admin
- **THEN** 服務只在 127.0.0.1 上可連線

### Requirement: 上傳原件

管理者 SHALL 可手動上傳 MD、TXT、PDF、CSV、JSON 檔案，單檔最多 10 MB。上傳 SHALL 建立不可修改的原件、source 草稿與待整理工作。來源的 sourceType 可為 user-document，url 可為 null；這種來源可公開的是經複核的摘要，不是原件。

#### Scenario: 上傳合法檔案

- **WHEN** 管理者上傳一份 5 MB 的 PDF
- **THEN** 系統保存原件 bytes 與 SHA-256、建立 source 草稿及一筆待整理工作

#### Scenario: 拒絕不合法的檔案

- **WHEN** 管理者上傳超過 10 MB、格式不允許、重複或內容與副檔名不符的檔案
- **THEN** 上傳被拒絕，且沒有留下任何新的原件、草稿或工作

### Requirement: 上傳不等於 ingest 完成

系統 MUST NOT 捏造摘要、查證結果或 AI 完成狀態。系統沒有模型或 OCR 整理功能，上傳後須由管理者或協作 AI 閱讀原件並整合知識。

#### Scenario: 上傳 PDF 後

- **WHEN** 一份 PDF 上傳完成
- **THEN** source 草稿標示尚未複核、未擷取文字，不出現任何自動產生的摘要

### Requirement: 可編輯範圍

管理者 SHALL 可編輯概念、茶名、綜合整理及來源摘要頁。來源原件 MUST NOT 可被修改或刪除；index 與 log MUST NOT 開放任意覆寫。

#### Scenario: 嘗試覆寫 log

- **WHEN** 透過管理 API 嘗試直接覆寫 wiki/log.md
- **THEN** 請求被拒絕，log 內容不變

### Requirement: 交易式保存與版本保留

每次保存 SHALL 先在暫存副本完成修改並通過檢查，再依序提交，並將舊版保存在 .local/history。系統 SHALL 檢查版本衝突。保存失敗時 MUST NOT 留下改了一半的 Wiki。

#### Scenario: 版本衝突

- **WHEN** 管理者保存的頁面已在讀取後被其他操作修改
- **THEN** 保存被拒絕並提示衝突，正式檔案不變

#### Scenario: 檢查未通過

- **WHEN** 修改後的暫存副本有失效連結等檢查錯誤
- **THEN** 保存被拒絕，正式 Wiki 保持原狀

#### Scenario: 還原舊版

- **WHEN** 管理者選擇還原某頁的舊版本
- **THEN** 該頁恢復為舊版內容，原件不受影響

### Requirement: 公開狀態需明確複核

將頁面設為公開狀態時，管理者 MUST 明確勾選內容已複核。公開狀態不代表外部事實保證。

#### Scenario: 未勾選複核

- **WHEN** 管理者將頁面設為 published 但沒有勾選內容複核
- **THEN** 保存被拒絕，原條目保持不變

### Requirement: 自動補連結的限制

勾選來源及相關條目時，系統 SHALL 可補上相對連結，但 MUST NOT 自動補造事實段落。

#### Scenario: 勾選來源

- **WHEN** 管理者在編輯頁勾選一個來源
- **THEN** 系統只在「知識來源」段落補上該來源的相對連結

### Requirement: 完成整理工作的條件

一筆整理工作 SHALL 只有在其來源及至少一篇引用該來源的知識頁皆可公開時，才能標記為完成。

#### Scenario: 尚無引用頁

- **WHEN** 管理者嘗試完成一筆來源尚未被任何可公開知識頁引用的工作
- **THEN** 系統拒絕標記完成

### Requirement: 本地資料隔離

管理工作、版本備份及測試成果 SHALL 存放在 .local/，MUST NOT 提交至 GitHub。原件下載 SHALL 由本地服務依 source ID 與 manifest 核對後提供，MUST NOT 接受任意檔案路徑。

#### Scenario: 以路徑讀取檔案

- **WHEN** 請求以 ../ 等路徑嘗試讀取原件或其他檔案
- **THEN** 請求被拒絕

### Requirement: 檢查模式

本地嚴格檢查 SHALL 將遺失的原件列為錯誤，但 manifest 已標記退役的原件除外。check --public 為可攜模式，對被忽略的 raw/articles、raw/social 原件缺失只列提醒，存在的原件仍 MUST 核對 hash。管理服務 SHALL 使用可攜模式，且 MUST NOT 隱藏缺檔問題。

#### Scenario: 嚴格模式缺原件

- **WHEN** manifest 記錄的原件不存在、且該紀錄沒有標記退役時執行 npm run check
- **THEN** 檢查列出錯誤並以非零代碼結束

#### Scenario: 已退役原件不存在

- **WHEN** manifest 中標記退役的原件不存在時執行 npm run check
- **THEN** 不因此列出錯誤，該紀錄的路徑與 SHA-256 仍保留在 manifest

#### Scenario: 已退役原件仍存在

- **WHEN** 標記退役的原件檔案仍在本機
- **THEN** 檢查照樣核對 hash，內容不符時列為錯誤

### Requirement: 測試與實際結果

管理流程變動時 SHALL 同步更新 API 與失敗回復測試；可行時 SHALL 執行真實瀏覽器的上傳及保存測試。系統 MUST NOT 以假的成功提示代替實際檔案結果。

#### Scenario: 保存成功提示

- **WHEN** 介面顯示保存成功
- **THEN** 對應檔案確實已寫入，重新讀取可得到新內容

### Requirement: 已退役原件的連結

除 wiki/log.md 的歷史紀錄外，Wiki 頁 MUST NOT 連到已退役的原件；連到已退役原件的來源頁 SHALL 將 originalAvailable 設為 false。

#### Scenario: log 保留舊連結

- **WHEN** wiki/log.md 的舊紀錄連到已退役的原件
- **THEN** 檢查不列錯誤

#### Scenario: 一般頁面連到已退役原件

- **WHEN** 來源頁或知識頁內文連到已退役的原件
- **THEN** 檢查列出錯誤

#### Scenario: 來源頁狀態不一致

- **WHEN** 來源頁的 rawRefs 全部已退役，但 originalAvailable 仍為 true
- **THEN** 檢查列出 manifest 與來源資訊不一致的錯誤
