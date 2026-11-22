# Markdown Wiki 內容指南

現行規則為 AGENTS.md。本指南及 templates/*.md 適用 raw／Wiki 架構；舊 JSON 模板已停用。Wiki 是唯一內容主檔，不能同步手動維護 JSON 與 Markdown。

## Frontmatter

每頁最前面使用兩行 --- 包住 metadata。每一行採 key: JSON值，例如：

```yaml
---
id: "qingxin-oolong"
kind: "concept"
title: "青心烏龍"
summary: "先認識品種，再看做成什麼茶。"
status: "draft"
updated: null
categoryId: "cultivars"
aliases: []
sources: []
related: []
provenance: "new-ingest"
---
```

這是可被 YAML 工具閱讀的受限格式。字串加雙引號，陣列／物件用 JSON 寫法，布林及 null 不加引號；不使用多行 YAML、縮排清單或自訂標籤。本地解析器只接受此子集。

| 欄位 | 規則 |
| --- | --- |
| id | 等於檔名，小寫英文數字與連字號，以字母開始，全 Wiki 唯一 |
| kind | concept、tea-name、source、synthesis、overview、index、log |
| title／summary | 繁體中文標題與一句摘要，供索引閱讀 |
| status | draft、review、published；最後一種僅代表可供建置，不是已上線 |
| updated | 公開頁填實際修改日 YYYY-MM-DD，草稿可 null |
| sources | 本頁引用的 source 頁 ID，且內文有對應相對連結 |
| related | 既有相關頁 ID，不自我引用或重複，公開頁只連公開頁 |
| provenance | new-ingest、legacy-migration、legacy-reference、wiki-query 等能如實說明來歷的字串 |

正文用標準 Markdown，相對連結要連到存在檔案。不依賴特定編輯器的雙中括號語法。段落可讀的引用不能只存在 frontmatter。

## 內容種類與模板

| 類型 | 模板／位置 | 額外資訊 |
| --- | --- | --- |
| 概念 | concept.md → wiki/六大分類/ | categoryId 必填；aliases 為別名陣列 |
| 茶名 | tea-name.md → wiki/tea-names/ | exampleType 為 illustrative 或 source-based |
| 來源摘要 | source.md → wiki/sources/ | sourceType、url、originalAvailable、rawRefs |
| 比較／問答／近期話題 | synthesis.md → wiki/syntheses/ | synthesisType 可標 comparison、query-demo、weekly-observation、project-policy |

所有模板保持 draft，填完才能複核。索引、總覽、操作紀錄使用各自 kind，不是一般茶知識文章。

## 白話寫作與茶名

專有名詞第一次出現採「名詞 → 白話解釋 → 具體例子」。概念至少三節、至少一個例子；情境若是假設就說清楚。比喻不取代定義；品種、茶類與製程分開說。

茶名正文順序：完整名稱、逐詞角色與白話解釋、翻譯、限制、關聯與來源。季節為標籤，不加第七主分類。每詞附依據；組合示例不是實際商品，角色核對也不是產銷履歷認證。

## 原件與來源摘要

raw/ 保存版本，不改寫封存。rawRefs 是相對專案根目錄的 raw 檔案路徑，必須在 raw/manifest.json 中。originalAvailable 表示目前能否取得原件：實際保存原始文件或使用者原訊息才 true；連結紀錄及已退役的原件必須 false。

來源摘要的 sourceType 為 official、social、research、professional、user-message 或 user-document。外部來源 url 必填原始頁面；本地使用者訊息或上傳資料可 null，但要連到本地原件（已退役者除外）。rawRefs 本地可閱讀，網站建置不直接公開。

source 頁正文記作者、查閱／發布日期、外部原文、用途、差異與限制。社群補平台、帳號、原貼文與身分確認情形。基礎知識不必硬加無關社群帳號。

八筆遷移來源只有舊 metadata，不是已保存原文。原查閱時間照留，不因遷移重設成新查證時間。新版本另存；manifest 可追加新紀錄，不改舊 hash。

不再使用的原件以「退役」處理，不刪紀錄：manifest 該筆保留 path 與 sha256，加上 `"retired": {"date": "YYYY-MM-DD", "reason": "..."}`；來源頁 originalAvailable 改 false、移除原件連結並在正文說明退役日期與原因；log 追加退役紀錄，舊紀錄中的原件連結保留。check 對已退役原件的缺檔不列錯誤，檔案若仍在照樣核對 hash；除 log 外的頁面連到已退役原件會列錯誤。

## 近期觀察

weekly-observation 使用 synthesis，加入 evidenceLevel 與 observation。沿用既有觀察資料時原樣保留：

- evidenceLevel：verified-topic 或 insufficient-data。
- observation：timezone、start、end、researchedAt、platforms、keywords、includedPostCount、independentAccountCount、comparisonBasis、researchFile、limitations。
- 帶 +08:00 的時間，start/end 相差七天；發布時間須在含首尾的區間，無法確認的邊界日不納入。
- 社群查找只在手動授權時執行。缺互動資料為 null，不把未取得當零；不同平台不混加成不明分數。
- verified-topic 要有合格社群原貼文與查證來源，不代表已證明熱門排名。
- insufficient-data 可只保留觀察紀錄，無合格貼文就不虛構帳號與茶知識結論。

每篇文末分社群與查證來源。舊觀察不得改成新一期，更新另建新頁。

## index 與 log

index 列出每個 Wiki 頁的一句摘要，包含來源與操作頁；本地 npm run index 可重整索引，不會研究新內容。新增／改變頁面摘要或分類後重整。

log 本文只追加：日期、migration／ingest／query／lint／correction、涉及來源、修改／讀取頁、結果與限制。範例必須明寫 demo，不能當成真的使用者問答；實際命令未跑前不先記成功。

## 新增資料流程

先讀 index → 保存來源版本 → 整理 source 摘要 → 找既有頁整合 → 記錄矛盾與限制 → 補連結 → 更新 overview（需要時）、index、log → 執行 check。

結構通過不等於事實查證。後續網站建置只讀 Wiki，排除 draft、raw、research 與舊 JSON。

## 管理介面與公開副本

本機管理介面可建立來源草稿及編輯 Markdown，provenance 使用 admin-upload 或 admin-editor。原件保存在 raw，工作與版本在 .local，兩者不能當作已完成查證。PDF 僅封存，沒有 OCR。

保存時自動重整 index 並追加 log；管理者仍需核對正文來源及例子。index／log 可連到內部草稿，但不輸出到公開站。公開站另排除專案政策、示範問答和使用者訊息來源。

公開 Repository 不包含本地原件時，check --public 會保留缺檔提醒；未在 manifest 標記退役時，不能將 originalAvailable 改成 false 或重算 hash 掩蓋資料遺失。實際在場的原件仍驗證 hash。管理者需另備份 raw 和 .local。

## 圖片

圖片存 assets/images/，出處資料在 assets/image-credits.json：id、path、creator、sourceUrl、license、licenseUrl、accessedAt、alt、illustrative。無使用依據的社群圖不重用；原創或生成圖明示示意，不當實物證據。
