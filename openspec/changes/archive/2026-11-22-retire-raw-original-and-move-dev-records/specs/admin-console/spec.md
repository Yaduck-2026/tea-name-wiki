# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
