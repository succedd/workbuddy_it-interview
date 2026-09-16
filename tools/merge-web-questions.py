# -*- coding: utf-8 -*-
"""合并 web 抓取批次到 data/published.json（判重 + 岗位映射 + 紧凑单行）"""
import io, json, re, sys, time, collections

sys.path.insert(0, 'tools')
import webq_batch1, webq_batch2, webq_batch3, webq_batch4

SRC = 'data/published.json'
now_ms = int(time.time() * 1000)

d = json.load(io.open(SRC, encoding='utf-8'))
qs = d['questions']
pos_list = d['positions']
pos_by_name = {p['name']: p['id'] for p in pos_list}

def norm2(t):
    return re.sub(r'[^\w]', '', (t or '').lower())

exist_norm = {norm2(q['title']): q['id'] for q in qs}
next_id = max(q['id'] for q in qs) + 1
print('max existing id =', next_id - 1, '| existing =', len(qs))

# 每分类缺省岗位兜底（与题面 pos 并集）
CAT_FALLBACK = {
    28: ['Java开发工程师', '数据库工程师', '后端开发工程师'],
    33: ['Java开发工程师', '后端开发工程师', '后端架构师'],
    49: ['网络工程师', '后端开发工程师'],
    50: ['网络工程师', '后端开发工程师'],
    52: ['网络工程师', '后端开发工程师'],
    53: ['后端开发工程师', '渗透测试工程师'],
    54: ['后端开发工程师', 'Go后端工程师'],
    4:  ['系统运维工程师', '后端开发工程师'],
    12: ['Java开发工程师', 'Java后端工程师'],
    85: ['Java后端工程师', '后端架构师'],
    81: ['Java开发工程师', 'Java后端工程师'],
    126: ['后端开发工程师', 'Java后端工程师'],
    127: ['大数据开发工程师', '后端架构师'],
    128: ['后端开发工程师', 'Java后端工程师'],
    59: ['前端开发工程师', 'Web全栈工程师'],
    63: ['前端开发工程师', '前端架构师'],
    64: ['前端开发工程师', '前端架构师'],
    187: ['AI应用开发工程师', '算法工程师'],
    194: ['AI Agent开发工程师', 'AI应用开发工程师'],
}

added, skipped = [], []
for batch in (webq_batch1, webq_batch2, webq_batch3, webq_batch4):
    for item in batch.QUESTIONS:
        n = norm2(item['title'])
        if n in exist_norm:
            skipped.append((item['title'], exist_norm[n]))
            continue
        names, ids, seen = [], [], set()
        for name in list(dict.fromkeys(item['pos'] + CAT_FALLBACK.get(item['cat'], []))):
            pid = pos_by_name.get(name)
            if pid and pid not in seen:
                seen.add(pid); ids.append(pid); names.append(name)
        q = {
            'id': next_id, 'categoryId': item['cat'],
            'title': item['title'], 'body': item['body'], 'answer': item['answer'],
            'difficulty': item['diff'], 'type': '简答题',
            'positionIds': ids, 'positionNames': names,
            'years': item['years'],
            'tags': item['tags'],
            'source': 'web', 'aiScore': 92, 'status': 'published',
            'views': 0, 'favorites': 0, 'relatedIds': [], 'remark': '',
            'createdAt': now_ms, 'updatedAt': now_ms,
        }
        qs.append(q); exist_norm[n] = next_id
        added.append((next_id, item['cat'], item['title']))
        next_id += 1

print('added =', len(added), '| skipped(dup) =', len(skipped))
for t, qid in skipped: print('  DUP:', t, '-> existing id', qid)

# 存量修复：positionIds 与 positionNames 错位的题，按 ids 严格重建 names（去重保持顺序）
id_to_name = {p['id']: p['name'] for p in pos_list}
fixed_pos = 0
for q in qs:
    ids = q.get('positionIds') or []
    rebuilt, seenp = [], set()
    for pid in ids:
        if pid in id_to_name and pid not in seenp:
            seenp.add(pid); rebuilt.append(id_to_name[pid])
    if q.get('positionNames') != rebuilt:
        q['positionNames'] = rebuilt; fixed_pos += 1
print('存量 pos 修复题数 =', fixed_pos)

# 数据体检
cats = {c['id']: c['name'] for c in d['categories']}
dup_titles = [t for t, c in collections.Counter(norm2(q['title']) for q in qs).items() if c > 1]
short_ans = [q['id'] for q in qs if len(q.get('answer', '')) < 50]
no_pos = [q['id'] for q in qs if not q.get('positionIds')]
mismatch = [q['id'] for q in qs if len(q.get('positionIds', [])) != len(q.get('positionNames', []))
            or any(id_to_name.get(pid) != nm for pid, nm in zip(q.get('positionIds', []), q.get('positionNames', [])))]
bad_cat = [q['id'] for q in qs if q['categoryId'] not in cats]
print('体检: 重复标题=%d 答案过短=%d 无岗位=%d pos不一致=%d 无效分类=%d' % (
    len(dup_titles), len(short_ans), len(no_pos), len(mismatch), len(bad_cat)))
for lst, tag in ((dup_titles, 'dup'), (short_ans, 'short'), (no_pos, 'nopos'), (mismatch, 'mism'), (bad_cat, 'badcat')):
    if lst: print(f'  !! {tag}:', lst[:20])

if '--apply' in sys.argv:
    d['version'] = d.get('version', 0) + 1
    d['publishedAt'] = now_ms
    out = json.dumps(d, ensure_ascii=False, separators=(',', ':'))
    io.open(SRC, 'w', encoding='utf-8', newline='').write(out)
    print('APPLIED: version=%d total=%d bytes=%d' % (d['version'], len(qs), len(out.encode('utf-8'))))
else:
    print('DRY RUN — 加 --apply 写入')
