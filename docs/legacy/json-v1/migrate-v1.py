"""One-time local migration. Never re-run over an existing Wiki."""
import hashlib
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
STAMP = '2026-11-15'
CAPTURED = '2026-11-15T23:17:47+08:00'
WIKI = ROOT / 'wiki'
if (WIKI / 'index.md').exists():
    raise SystemExit('Wiki already exists; refuse to overwrite maintained Markdown.')

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8', newline='\n') as stream:
        stream.write(value)

def fm(meta):
    return '---\n' + ''.join(k + ': ' + json.dumps(v, ensure_ascii=False) + '\n' for k, v in meta.items()) + '---\n\n'

def rel(current, target):
    return os.path.relpath(target, current.parent).replace('\\', '/')

archive = ROOT / 'docs/legacy/json-v1'
for name in ['AGENTS.md', 'README.md', 'docs/content-guide.md', 'docs/ai-prompts.md']:
    src = ROOT / name
    target = archive / name.replace('/', '--')
    write(target, src.read_text(encoding='utf-8'))

old_files = sorted((ROOT/'content').rglob('*.json')) + [ROOT/'sources/registry.json']
write(archive/'original-hashes.json', json.dumps([
    {'path': p.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
    for p in old_files], ensure_ascii=False, indent=2)+'\n')
sources = json.loads((ROOT/'sources/registry.json').read_text(encoding='utf-8'))
entries = [json.loads(p.read_text(encoding='utf-8')) for p in old_files if p.parent.name!='sources']
mapping = {}
for e in entries:
    folder = e['categoryId'] if e['kind']=='wiki' else ('tea-names' if e['kind']=='tea-name' else 'syntheses')
    mapping[e['id']] = WIKI/folder/(e['id']+'.md')
source_paths = {s['id']: WIKI/'sources'/(s['id']+'.md') for s in sources}
manifest = []

def seal(path, source_id, record_type, available):
    manifest.append({'path': path.relative_to(ROOT).as_posix(), 'sourceId': source_id,
        'recordType': record_type, 'originalAvailable': available,
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})

for s in sources:
    raw = ROOT/'raw/references'/(s['id']+'-v1.md')
    write(raw, '# 來源定位紀錄：'+s['title']+'\n\n'
        '此檔只保存舊版來源目錄的既有資料，不是文章原文或網頁快照。\n'
        '本次只做本地遷移，未重新連線或重新閱讀外部來源。\n\n'
        f'紀錄建立時間：{CAPTURED}\n\n'
        '```json\n'+json.dumps(s, ensure_ascii=False, indent=2)+'\n```\n')
    seal(raw,s['id'],'reference-only',False)
    target = source_paths[s['id']]
    related = [e['id'] for e in entries if s['id'] in e['sourceIds']]
    meta = {'id': s['id'], 'kind':'source', 'title':s['title'], 'summary':'既有來源的用途與限制；原文尚未封存。',
        'status':'published','updated':STAMP,'sourceType':s['type'], 'url':s['url'],
        'originalAvailable':False,'rawRefs':[raw.relative_to(ROOT).as_posix()], 'sources':[], 'related':related,
        'provenance':'legacy-reference'}
    body = '# '+s['title']+'\n\n## 來源資訊\n\n'
    body += f'- 作者／機構：{s["author"]}\n- [外部原始連結]({s["url"]})\n'
    body += f'- 舊紀錄查閱時間：{s["accessedAt"]}（本輪未重查）。\n'
    body += f'- [來源定位紀錄]({rel(target,raw)})：不是全文，不能用它代替閱讀原文。\n\n'
    body += '## 既有查證使用範圍\n\n'+'\n'.join('- '+x for x in s['supports'])+'\n\n'
    body += '## 限制與待確認\n\n'+'\n'.join('- '+x for x in s['limitations'])+'\n\n'
    body += '## 已連結知識\n\n'+'\n'.join(f'- [{by["title"]}]({rel(target,mapping[by["id"]])})' for by in entries if by['id'] in related)+'\n'
    write(target,fm(meta)+body)

for e in entries:
    target=mapping[e['id']]
    kind={'wiki':'concept','tea-name':'tea-name','digest':'synthesis'}[e['kind']]
    meta={'id':e['id'],'kind':kind,'title':e['title'],'summary':e['summary'], 'status':e['status'],
        'updated':e['updated'],'sources':e['sourceIds'],'related':e['relatedIds'],'provenance':'legacy-migration'}
    for field in ['categoryId','aliases','exampleType','evidenceLevel','observation']:
        if field in e: meta[field]=e[field]
    body='# '+e['title']+'\n\n'+e['summary']+'\n\n'
    if e['kind']=='tea-name':
        body+='> 組合教學示例，不是已找到的同名商品；詞語查證不等於產地履歷驗證。\n\n'
        body+='## 完整茶名\n\n'+e['originalName']+'\n\n## 逐詞拆解\n\n'
        for t in e['terms']:
            body+='### '+t['text']+'｜'+t['role']+'\n\n'+t['explanation']+'\n\n'
            if t['entryId']: body+=f'[延伸閱讀]({rel(target,mapping[t["entryId"]])})\n\n'
            body+='依據：'+ '、'.join(f'[{s}]({rel(target,source_paths[s])})' for s in t['sourceIds'])+'。\n\n'
        body+='## 白話翻譯\n\n'+e['plainLanguage']+'\n\n## 示範限制\n\n'+'\n'.join('- '+x for x in e['limitations'])+'\n\n'
    else:
        for section in e['sections']:
            body+='## '+section['heading']+'\n\n'+'\n\n'.join(section['paragraphs'])+'\n\n'
            if section['bullets']: body+='\n'.join('- '+x for x in section['bullets'])+'\n\n'
            if section['sourceIds']: body+='依據：'+'、'.join(f'[{s}]({rel(target,source_paths[s])})' for s in section['sourceIds'])+'。\n\n'
    if e['kind']=='digest':
        body+='## 研究紀錄\n\n'+f'[實際搜尋與限制]({rel(target,ROOT/e["observation"]["researchFile"])})\n\n'
    body+='## 相關條目\n\n'
    body+='\n'.join(f'- [{i}]({rel(target,mapping[i])})' for i in e['relatedIds']) if e['relatedIds'] else '目前無其他直接關聯條目。'
    body+='\n\n## 知識來源\n\n'
    body+='\n'.join(f'- [{s}]({rel(target,source_paths[s])})' for s in e['sourceIds']) if e['sourceIds'] else '本頁僅記錄研究限制，未取得合格社群貼文，沒有茶知識查證結論。'
    body+='\n\n## 維護註記\n\n自既有 JSON 遷移，原日期及引用保留；本次未重新查證外部原文。\n'
    write(target,fm(meta)+body)

raw_user=ROOT/'raw/articles/user-update-policy-v1.md'
write(raw_user,'# 使用者的更新政策原始訊息\n\n'
    f'收錄時間：{CAPTURED}\n來源：本次協作對話中使用者已提供的訊息。\n'
    '來源類型：專案需求，不是茶知識事實證據。下段保留原字詞及錯字。\n\n'
    '> 另外不用自動跟新，我手動說要搜尋時，再依據我的規則進行茶照並整理更新到我的TeaWIKI\n')
seal(raw_user,'user-update-policy','user-message',True)
write(ROOT/'raw/manifest.json',json.dumps({'version':1,'records':manifest},ensure_ascii=False,indent=2)+'\n')
print(f'Migrated {len(entries)} content pages and {len(sources)} source summaries; sealed {len(manifest)} raw records.')
