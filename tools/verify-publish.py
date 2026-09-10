#!/usr/bin/env python3
"""发布后自动复查（推完必查）

背景：本站的发版链路有三处反复出问题的环节——
  1. `enrich_questions.py --push` 的分享页推送会**虚报成功**（日志打 ✓，远端实际 404）；
  2. 编辑端/自动发布可能把云端 published.json **砍回旧版**（题数变少而发布守卫不拦）；
  3. 本地 git 对象库易碎，导致提交看似成功但远端没落盘。
本脚本把「推完之后到底成没成」变成一条命令，默认只读不改。

用法：
  python tools/verify-publish.py                # 复查（默认：最近 20 个 ID 的分享页）
  python tools/verify-publish.py --last 72      # 复查最近 72 个 ID
  python tools/verify-publish.py --fix-share    # 发现分享页缺失时，自动重新生成并用 git 双推补齐
  python tools/verify-publish.py --offline      # 只做本地自检（不联网）

退出码：0 = 全部通过；1 = 发现问题（并打印可执行的修复命令）。
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCAL_DATA = os.path.join(ROOT, 'data', 'published.json')
SITE = 'https://it-interview.is-a.dev'
RAW = 'https://raw.githubusercontent.com/succedd/workbuddy_it-interview/{br}/q/{qid}.html'
REPO = 'https://github.com/succedd/workbuddy_it-interview.git'


def load_local():
    with open(LOCAL_DATA, encoding='utf-8') as f:
        return json.load(f)


def http(url, method='GET', timeout=40):
    req = urllib.request.Request(url, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b''
    except Exception as e:
        return 0, str(e).encode()


def main():
    args = sys.argv[1:]
    offline = '--offline' in args
    fix_share = '--fix-share' in args
    last = 20
    if '--last' in args:
        last = int(args[args.index('--last') + 1])

    problems = []
    notes = []

    # ---------- 1. 本地自检 ----------
    local = load_local()
    lq = local['questions']
    lids = [q['id'] for q in lq]
    lmax = max(lids)
    dup = len(lids) - len(set(lids))
    from collections import Counter
    titles = Counter((q.get('title') or '').strip() for q in lq)
    dup_titles = [t for t, c in titles.items() if c > 1]
    no_src = [q['id'] for q in lq if not (q.get('source') or '').startswith('http')]
    short_ans = [q['id'] for q in lq if len((q.get('answer') or '').strip()) < 80]

    print(f'[本地] 题数 {len(lq)} | max id {lmax} | 重复 id {dup} | 重复标题 {len(dup_titles)}')
    if dup:
        problems.append(f'本地存在重复 id：{dup} 个')
    if dup_titles:
        problems.append(f'本地存在重复标题：{len(dup_titles)} 组，例：{dup_titles[0][:40]}')
    if no_src:
        notes.append(f'本地 {len(no_src)} 题无有效来源（历史存量，非本次问题）')
    if short_ans:
        notes.append(f'本地 {len(short_ans)} 题答案过短（<80 字）：{short_ans[:8]}')

    # ---------- 2. 线上数据一致性 ----------
    newest = list(range(max(1, lmax - last + 1), lmax + 1))
    if not offline:
        st, body = http(f'{SITE}/data/published.json')
        if st != 200:
            problems.append(f'线上 published.json 不可达（HTTP {st}）')
        else:
            remote = json.loads(body.decode('utf-8'))
            rq = remote['questions']
            rids = {q['id'] for q in rq}
            missing = [i for i in lids if i not in rids]
            print(f'[线上] 题数 {len(rq)} | version {remote.get("version")}')
            if len(rq) < len(lq):
                problems.append(
                    f'⚠️ 线上题数({len(rq)}) < 本地({len(lq)})——疑似被编辑端/自动发布砍回旧版，'
                    f'需重推全量 published.json')
            if missing:
                problems.append(f'线上缺少本地 {len(missing)} 个 id（前 10：{missing[:10]}）')
            else:
                print('[线上] 本地题目 id 全部在线 ✓')

    # ---------- 3. 分享页（三处：线上 + raw main + raw release）----------
    if not offline:
        miss_online, miss_raw = [], []
        for qid in newest:
            st, _ = http(f'{SITE}/q/{qid}.html')
            if st != 200:
                miss_online.append(qid)
            stm, _ = http(RAW.format(br='main', qid=qid))
            stx, _ = http(RAW.format(br='release', qid=qid))
            if stm != 200 or stx != 200:
                miss_raw.append((qid, stm, stx))
        if miss_online:
            problems.append(f'线上分享页缺失 {len(miss_online)} 个（前 10：{miss_online[:10]}）')
        else:
            print(f'[分享页] 线上最近 {len(newest)} 个全部 200 ✓')
        if miss_raw:
            problems.append(f'raw 分支分享页缺失 {len(miss_raw)} 个（前 5：{miss_raw[:5]}）')
        else:
            print(f'[分享页] raw main+release 最近 {len(newest)} 个全部 200 ✓')

        # ---------- 4. sitemap ----------
        st, body = http(f'{SITE}/sitemap.xml')
        if st == 200:
            n = body.decode('utf-8', 'ignore').count('<loc>')
            print(f'[sitemap] {n} 条')
            if n < len(lq):
                problems.append(f'sitemap 条数({n}) < 题数({len(lq)})——可能有分享页未收录')
        else:
            problems.append(f'sitemap 不可达（HTTP {st}）')

    # ---------- 5. 自动补齐分享页（可选）----------
    if fix_share and problems:
        if '--offline' in args:
            print('[fix-share] 离线模式下跳过补齐')
        elif not any('分享页' in p for p in problems):
            print('[fix-share] 未发现分享页缺失，跳过')
        else:
            print('[fix-share] 重新生成分享页并用 git 双推补齐…')
            node = os.environ.get('NODE_BIN', 'node')
            subprocess.run([node, os.path.join(ROOT, 'tools', 'gen-share-pages.js')],
                           cwd=ROOT, check=False)
            tmp = os.path.join(ROOT, '.verify-tmp')
            for br in ('main', 'release'):
                subprocess.run(['git', 'clone', '-q', '--branch', br, '--depth', '1', REPO,
                                f'{tmp}-{br}'], cwd=ROOT, check=False)
                for qid in newest:
                    src = os.path.join(ROOT, 'q', f'{qid}.html')
                    dst = os.path.join(f'{tmp}-{br}', 'q', f'{qid}.html')
                    if os.path.exists(src):
                        subprocess.run(['cp', src, dst], check=False)
                subprocess.run(['cp', os.path.join(ROOT, 'sitemap.xml'), f'{tmp}-{br}/'],
                               check=False)
                subprocess.run(['git', 'add', '-A'], cwd=f'{tmp}-{br}', check=False)
                subprocess.run(['git', 'commit', '-q', '-m',
                                'chore(share): verify-publish 自动补齐分享页与 sitemap'],
                               cwd=f'{tmp}-{br}', check=False)
                subprocess.run(['git', 'push', 'origin', f'HEAD:{br}'], cwd=f'{tmp}-{br}',
                               check=False)
                print(f'  -> {br} 已尝试补齐')

    # ---------- 汇总 ----------
    print()
    if notes:
        for n in notes:
            print(f'  · {n}')
    if problems:
        print('❌ 复查未通过：')
        for p in problems:
            print(f'  - {p}')
        print('\n修复建议：')
        print('  1) 数据缺失/被砍：cd 到仓库根，设 GH_PUBLISH_TOKEN 后重跑')
        print('     python tools/enrich_questions.py tools/batches/<最新批次>.json --push')
        print('  2) 分享页缺失：python tools/verify-publish.py --fix-share')
        return 1
    print('✅ 复查全部通过')
    return 0


if __name__ == '__main__':
    sys.exit(main())
