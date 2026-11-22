---
id: "log"
kind: "log"
title: "TeaWIKI 操作紀錄"
summary: "依時間追加 ingest、query、lint 與更正的紀錄。"
status: "published"
updated: "2026-11-22"
sources: []
related: ["index"]
provenance: "operation-log"
---

# TeaWIKI 操作紀錄

本紀錄內文只追加。updated 可隨追加更新；歷史段落不改寫，錯誤另追加更正。

## [2026-11-15] migration | JSON v1 轉 Markdown Wiki

- 執行依據：使用者確認 Karpathy 模式遷移方案。
- 內容：6 篇概念、1 個茶名示例、1 份觀察限制、8 頁來源摘要；保留 ID 與既有引用。
- [舊版 hashes](../docs/legacy/json-v1/original-hashes.json)用於確認原資料未變。
- 本輪只整理既有資料，未重新取得八份外部原文；raw/references 為定位紀錄，不是全文。不可當成新完成的八次 ingest。
- 入口：[索引](index.md)、[總覽](overview.md)。

## [2026-11-15] ingest | 使用者的手動更新指示

- 原始資料：[使用者訊息](../raw/articles/user-update-policy-v1.md)，為專案需求而非茶事實來源。
- 建立[來源摘要](sources/user-update-policy.md)與[更新政策](syntheses/manual-update-policy.md)，同步[總覽](overview.md)、[索引](index.md)及 [AGENTS.md](../AGENTS.md)。
- 原始訊息封存後以 SHA-256 記錄；錯字保留原件，摘要只解釋意思。
- 結論：手動觸發新研究，站內查詢不連外；本地匯入示範不代表已完成新茶文章全文匯入。

## [2026-11-15] query | 品種與茶類的示範問題

- 性質：依已確認遷移方案做一次 query 回存示範，不是使用者實際提問。
- 已讀：[索引](index.md)、[青心烏龍](cultivars/qingxin-oolong.md)、[六大茶類](tea-types/six-tea-types.md)；答案引用既有來源頁。
- 成果：[問答示範](syntheses/qingxin-vs-tea-type.md)，為兩篇知識補回連結並更新索引。
- 限制：使用現有整理，不重新讀取外部原文，不推斷實際商品。

## [2026-11-15] lint | 遷移後結構與知識一致性

- 實際執行 npm run index、npm run check、npm run query -- 青心烏龍。
- check：22 頁、9 筆封存、0 errors、8 warnings。提醒為外部原文未封存，未隱藏。
- 已修復：在[總覽](overview.md)補上[社群觀察](syntheses/social-observation-2026-11-15.md)的閱讀入口，移除孤立頁警告。
- 隔離副本負向測試可拒絕原件改動及失效連結；未修改原工作區封存。
- [健康檢查詳情](../docs/wiki-health-review.md)區分工具與內容判斷；[遷移報告](../docs/migration-v2.md)列已完成及缺口。
- 尚未做：外部原文重查、新茶原件匯入、網站與部署。不自動開始新搜尋。

## [2026-11-16] maintenance | 本機管理介面與公開閱讀版本

- 依使用者要求製作管理網頁：原件上傳／下載、待整理工作、Markdown 編輯／預覽、版本還原、衝突檢查、健康檢查與日誌。
- 編輯及上傳先在暫存副本驗證，再保存到正式資料夾；原件不開放修改，測試檔僅存在隔離測試副本。
- 實際完成 npm test（10／10）及 Chrome 互動驗證（10 類、0 執行期例外）；建置 16 頁公開內容及唯讀管理展示。
- [操作說明](../docs/admin-guide.md)、[測試報告](../docs/admin-test-report.md)、[GitHub 發布準備](../docs/github-publishing.md)。
- 尚未上傳 Repository 或執行遠端部署，未查找新茶資料；現有八筆來源原文未封存的限制維持。

## [2026-11-16] maintenance | 本人登入管理，公開訪客唯讀

- 依使用者要求補上管理密碼設定、登入、登出及伺服器端工作階段驗證；不再僅憑開首頁取得管理權。
- 密碼由本人在本機初次設定，AI 未代設；設定檔與工作階段不公開。上傳、編輯、還原、原件與管理資料均需登入。
- 自動測試 11／11、Chrome 13 類互動通過；測試密碼只用在隔離副本。公開版無寫入 API。
- [權限設計](../docs/access-control.md)、[操作說明](../docs/admin-guide.md)。GitHub 實際 owner／協作者權限仍待上架時確認。
- 新版服務重啟後，實測未登入管理讀取及寫入回應 401，公開預覽仍可閱讀；正式密碼尚待本人設定。

## [2026-11-22] maintenance | 使用者訊息原件退役

- 退役檔案：raw/articles/user-update-policy-v1.md（2026-11-15 ingest 時封存）。使用者表示不再使用，原件也已不在本機。
- raw/manifest.json 該紀錄加註 retired（日期、原因），路徑與 SHA-256 不變；未刪除紀錄、未重算 hash。
- 修改[來源摘要](sources/user-update-policy.md)：originalAvailable 改為 false、移除原件連結並說明退役；摘要、[更新政策](syntheses/manual-update-policy.md)與總覽內容不變。
- 本紀錄上方 2026-11-15 ingest 條目的原件連結保留原樣，不改寫歷史；該連結已無法開啟。
- 限制：原始訊息全文已無法重讀，日後只能依來源摘要理解當時的指示。check 嚴格模式 0 errors。
