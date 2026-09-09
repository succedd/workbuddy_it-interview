# -*- coding: utf-8 -*-
"""合并同名重复岗位「公有云售后技术支持」(96/97/98/99 → 保留 142)"""
import io, json, sys, time

SRC = 'data/published.json'
KEEP, DROP = 142, (96, 97, 98, 99)

d = json.load(io.open(SRC, encoding='utf-8'))
qs = d['questions']
id_to_name = {p['id']: p['name'] for p in d['positions']}

before_pos = len(d['positions'])
d['positions'] = [p for p in d['positions'] if p['id'] not in DROP]
print('positions: %d -> %d' % (before_pos, len(d['positions'])))

touched, deduped = 0, 0
for q in qs:
    ids = q.get('positionIds') or []
    if not any(x in DROP for x in ids):
        continue
    new_ids, seen = [], set()
    for x in ids:
        y = KEEP if x in DROP else x
        if y not in seen:
            seen.add(y); new_ids.append(y)
    if len(new_ids) < len(seen | set()):
        pass
    if len(new_ids) < len([x for x in ids if True]) - ids.count(KEEP) * 0:
        pass
    if len(set(ids)) != len(new_ids):
        deduped += 1
    q['positionIds'] = new_ids
    q['positionNames'] = [id_to_name[i] for i in new_ids if i in id_to_name]
    touched += 1

print('修正题数:', touched, '| 其中触发去重(同题既引旧id又引142):', deduped)

# 体检：引用悬空 + names 一致
valid = {p['id'] for p in d['positions']}
dangling = [q['id'] for q in qs if any(i not in valid for i in q.get('positionIds', []))]
mismatch = [q['id'] for q in qs if len(q.get('positionIds', [])) != len(q.get('positionNames', []))
            or any(id_to_name.get(pid) != nm for pid, nm in zip(q.get('positionIds', []), q.get('positionNames', [])))]
names_dup = [q['id'] for q in qs if len(q.get('positionNames', [])) != len(set(q.get('positionNames', [])))]
print('体检: 悬空岗位引用=%d pos不一致=%d names重复=%d' % (len(dangling), len(mismatch), len(names_dup)))
if dangling[:10]: print('  dangling:', dangling[:10])

if '--apply' in sys.argv:
    d['version'] = d.get('version', 0) + 1
    d['publishedAt'] = int(time.time() * 1000)
    out = json.dumps(d, ensure_ascii=False, separators=(',', ':'))
    io.open(SRC, 'w', encoding='utf-8', newline='').write(out)
    print('APPLIED: version=%d questions=%d positions=%d bytes=%d' % (
        d['version'], len(qs), len(d['positions']), len(out.encode('utf-8'))))
else:
    print('DRY RUN — 加 --apply 写入')
