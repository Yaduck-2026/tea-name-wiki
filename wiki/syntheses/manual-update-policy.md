---
id: "manual-update-policy"
kind: "synthesis"
title: "TeaWIKI 什麼時候更新？"
summary: "對話中手動觸發研究；網站搜尋不會啟動連外查找。"
status: "published"
updated: "2026-11-15"
sources: ["user-update-policy"]
related: ["overview", "user-update-policy"]
provenance: "user-message-ingest"
synthesisType: "project-policy"
---

# TeaWIKI 什麼時候更新？

## 先說白話

你說要搜尋，AI 才去找資料；你只是打開網站或查站內文章，不會偷偷啟動新研究。

依據：[使用者的更新指示](../sources/user-update-policy.md)。

## 兩個例子

- 「搜尋近一週茶知識，整理進 TeaWIKI」：研究任務，依規則查找及查證，再匯入 Wiki。
- 網站搜尋框輸入「青心烏龍」：只找現有文章，不連外，也不呼叫模型。

這是將原指示套用到專案的操作示例，不是新增背景服務。

## 與匯入、問答的關係

提供一份資料並要求整理時，可以匯入該份資料。一般問答先讀 Wiki；沒有足夠資料就指出缺口，不自行搜尋。若要把問答變成新頁面，需明確要求存回。

操作細節依 [AGENTS.md](../../AGENTS.md)；這些是本專案的執行約定。

## 相關條目

- [Wiki 總覽](../overview.md)。

## 知識來源

- [使用者的手動更新指示](../sources/user-update-policy.md)（專案需求來源）。
