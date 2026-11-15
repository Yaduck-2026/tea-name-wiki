# raw｜來源封存層

這裡保存匯入時取得的來源版本，AI 不修改封存檔。raw/manifest.json 記錄路徑、來源 ID、取得型態與 SHA-256；新版本另存，舊版本保持不變。

- articles/：實際取得的文章、PDF 或使用者提供的原始資料。
- social/：實際取得的社群資料；未取得不建立假貼文。
- references/：只有連結與既有 metadata 的紀錄，不是原文。

目前八個外部來源只保存 reference-only 定位紀錄；沒有其全文或 PDF。articles/user-update-policy-v1.md 保存使用者先前訊息，為專案需求來源，非茶知識來源。此次未重新對外讀取茶資料。

Markdown 摘要放 wiki/sources/，不要寫入本層冒充原文。不要為了讓檢查通過而改舊 hash。若封存有誤，新增更正紀錄及新版本，保留歷史。

raw 不自動發布到網站；公開 GitHub 前也需另做檔案範圍審查。原件預設不提交，來源紀錄是否可公開亦需檢查。
