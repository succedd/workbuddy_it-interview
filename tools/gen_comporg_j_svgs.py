#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 计算机组成原理 带图/定量题的 13 张 SVG 配图 -> assets/q/fig-comporg-*.svg"""
import html, os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "q")
os.makedirs(OUT, exist_ok=True)

BLUE="#1a73e8"; TEAL="#0f9d58"; RED="#db4437"; AMBER="#f4b400"; GREY="#5f6368"
LBOX="#e8f0fe"; LGRN="#e6f4ea"; LRED="#fce8e6"; LAMB="#fef7e0"; LGREY="#f1f3f4"

def esc(s): return html.escape(str(s))

def svg(w, h, body, defs=""):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
            'font-family="-apple-system,Segoe UI,Microsoft YaHei,sans-serif">\n'
            '<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" '
            'orient="auto" markerUnits="strokeWidth"><path d="M0,0 L8,3 L0,6 Z" fill="%s"/></marker>%s</defs>\n'
            '%s\n</svg>\n' % (w, h, GREY, defs, body))

def box(x, y, w, h, label, fc=LBOX, sc=BLUE, tc="#202124", fs=13, lh=16, rx=6):
    lines = str(label).split("\n")
    out = ['<rect x="%d" y="%d" width="%d" height="%d" rx="%d" fill="%s" stroke="%s" stroke-width="1.5"/>' %
           (x, y, w, h, rx, fc, sc)]
    n = len(lines); total = n*lh
    start = y + h/2 - total/2 + fs*0.85
    for i, ln in enumerate(lines):
        out.append('<text x="%d" y="%.1f" font-size="%d" fill="%s" text-anchor="middle">%s</text>' %
                   (x+w//2, start+i*lh, fs, tc, esc(ln)))
    return "\n".join(out)

def txt(x, y, s, fs=13, anchor="middle", color="#202124", weight="normal"):
    return '<text x="%d" y="%d" font-size="%d" fill="%s" text-anchor="%s" font-weight="%s">%s</text>' % (
        x, y, fs, color, anchor, weight, esc(s))

def arrow(x1, y1, x2, y2, color=GREY, dash=False):
    d = ' stroke-dasharray="5,4"' if dash else ''
    return '<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="1.8"%s marker-end="url(#ah)"/>' % (
        x1, y1, x2, y2, color, d)

def line(x1, y1, x2, y2, color=GREY, w=1.5):
    return '<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="%d"/>' % (x1, y1, x2, y2, color, w)

# ---------------------------------------------------------------- 1. 存储层次
def mem_hierarchy():
    cx=200; w=340; y0=70; y1=400; n=6
    names=["寄存器","L1 Cache","L2 Cache","L3 Cache","主存 DRAM","辅存 SSD/HDD"]
    caps =["<1KB","32~256KB","256KB~8MB","8~32MB","8~32GB","512GB~几TB"]
    spd  =["~0.1ns","~1ns","~4ns","~10ns","~60ns","~5ms"]
    h=(y1-y0)/n
    b=[]
    for i in range(n):
        yt=y0+i*h; yb=yt+h
        wt=w*(1-i/n)+40; wb=w*(1-(i+1)/n)+40
        pts="%d,%d %d,%d %d,%d %d,%d"%(cx-wt/2,yt,cx+wt/2,yt,cx+wb/2,yb,cx-wb/2,yb)
        b.append('<polygon points="%s" fill="%s" stroke="%s" stroke-width="1.2"/>'%(
            pts, [LBOX,LBOX,LBOX,LGREY,LGRN,LGREY][i], BLUE))
        b.append(txt(cx, yt+h/2+5, names[i], fs=13, color="#202124", weight="bold"))
    # 右侧三个向上箭头 + 表
    b.append(arrow(430,380,430,80,color=TEAL))
    b.append(txt(500,90,"容量 ↑",fs=13,anchor="middle",color=TEAL,weight="bold"))
    b.append(arrow(560,80,560,380,color=RED))
    b.append(txt(630,95,"速度 ↑  成本/位 ↓",fs=12,anchor="middle",color=RED,weight="bold"))
    # 表
    bx=420; by=150; bw=250; rh=34
    b.append('<rect x="%d" y="%d" width="%d" height="%d" fill="%s" stroke="%s"/>'%(bx,by,bw,rh*3+24,LGREY,GREY))
    b.append(txt(bx+60,by+16,"层级",fs=12,color=GREY)); b.append(txt(bx+150,by+16,"典型容量",fs=12,color=GREY)); b.append(txt(bx+220,by+16,"访问时间",fs=12,color=GREY))
    for i,r in enumerate(zip(names,caps,spd)):
        ry=by+24+i*rh
        b.append(line(bx,ry,bx+bw,ry,GREY,0.8))
        b.append(txt(bx+60,ry+20,r[0],fs=12)); b.append(txt(bx+150,ry+20,r[1],fs=12)); b.append(txt(bx+220,ry+20,r[2],fs=12))
    b.append(txt(340,425,"金字塔越往上：越快、越小、越贵；越低：越慢、越大、越便宜。CPU 只直接访问顶层，下层按块预取。",fs=11,color=GREY))
    return svg(680,440,"\n".join(b))

# ---------------------------------------------------------------- 2. 单周期数据通路
def datapath():
    b=[]
    b.append(txt(340,28,"单周期 CPU 数据通路（以 add $t0,$t1,$t2 为例）",fs=14,weight="bold"))
    # 部件
    ys=90
    b.append(box(40,ys,70,44,"PC",LBOX,BLUE))
    b.append(box(40,ys+90,70,44,"+4",LGRN,TEAL))
    b.append(box(160,ys,90,44,"指令存储器\nIM",LBOX,BLUE))
    b.append(box(300,ys,110,54,"寄存器堆\nRegFile\n读rs/rt 写rd",LBOX,BLUE))
    b.append(box(470,ys+30,90,44,"ALU",LGRN,TEAL))
    b.append(box(470,ys+110,90,44,"数据存储器\nDM",LBOX,BLUE))
    # 连线
    b.append(arrow(110,ys+22,160,ys+22))                      # PC->IM
    b.append(arrow(40+35,ys+44,40+35,ys+90))                  # PC down to +4
    b.append(arrow(75,ys+112,300+55,ys+27,dash=True))          # +4 back to RegFile? simplify
    b.append(arrow(250,ys+22,300,ys+22))                       # IM->RegFile (rs/rt)
    b.append(arrow(410,ys+27,470,ys+52))                       # RegFile->ALU
    b.append(arrow(560,ys+52,560,ys+110))                      # ALU->DM (store addr)
    b.append(arrow(470+45,ys+74,300+55,ys+78))                 # ALU result -> RegFile write (rd=t0)
    b.append(txt(340,205,"取指：PC→IM 取指令；执行：RegFile 读 $t1,$t2 → ALU 相加 → 结果写回 $t0；PC+4 指向下一条。",fs=11,color=GREY))
    b.append(txt(340,224,"单周期：每条指令都用完整的一个时钟周期，长短指令均按最慢指令定周期 → 大量空闲。",fs=11,color=GREY))
    return svg(680,245,"\n".join(b))

# ---------------------------------------------------------------- 3. 流水线时空图
def pipeline():
    b=[]
    b.append(txt(340,26,"4 段流水线执行 5 条指令的时空图（每段耗时 Δt）",fs=14,weight="bold"))
    stages=["IF","ID","EX","MEM","WB"]  # 5 rows? actually 4 stages IF/ID/EX/WB
    rows=["IF","ID","EX","WB"]
    x0=70; y0=55; cw=46; ch=34; gap=6
    # grid
    for i,st in enumerate(rows):
        b.append(txt(x0-30,y0+i*(ch+gap)+ch/2+5,st,fs=12,anchor="middle",color=BLUE,weight="bold"))
    ninst=5; ntime=8
    # fill cells: instruction j (0..4) occupies time t=j..j+3 at stage rows
    # row index by stage: IF=0,ID=1,EX=2,WB=3
    stage_of=[0,1,2,3]
    for j in range(ninst):
        for s in range(4):
            t=j+s; x=x0+t*cw; y=y0+s*(ch+gap)
            col=[LBOX,LGRN,LAMB,LRED][s]
            b.append('<rect x="%d" y="%d" width="%d" height="%d" rx="3" fill="%s" stroke="%s"/>'%(x,y,cw-2,ch,col,GREY))
            b.append(txt(x+(cw-2)/2,y+ch/2+5,"I%d"% (j+1),fs=11))
    # time axis
    for t in range(ntime):
        b.append(txt(x0+t*cw+(cw-2)/2,y0+4*(ch+gap)+18,"t%d"%(t+1),fs=11,color=GREY))
    # formulas
    bx=430
    b.append(txt(bx,70,"定量计算",fs=13,anchor="start",weight="bold",color=BLUE))
    rows_txt=[
        "非流水线：5×4Δt = 20Δt",
        "流水线：首条 4Δt，其后每 Δt 出 1 条",
        "总耗时 = 4 + (5-1) = 8Δt",
        "吞吐率 TP = 5 / 8Δt = 0.625/Δt",
        "加速比 S = 20Δt / 8Δt = 2.5",
        "效率 E = 20 / (4段×8时) = 20/32 = 62.5%",
    ]
    for i,t in enumerate(rows_txt):
        b.append(txt(bx,95+i*26,t,fs=12,anchor="start",color="#202124"))
    b.append(txt(340,250,"注：无冲突/冒险的理想情况；实际需处理数据/控制/结构冒险（见题 483/1383）。",fs=11,color=GREY))
    return svg(680,275,"\n".join(b))

# ---------------------------------------------------------------- 4. Cache 直接映射
def cache_direct():
    b=[]
    b.append(txt(340,26,"直接映射 Cache：主存地址字段划分",fs=14,weight="bold"))
    # 32-bit bar split
    x0=60; y=60; total=560
    # widths: Tag=20, Index=6, Offset=6 (example: 32-bit, 64 lines=>6 index, 16B block=>4 offset, tag=22)
    # use example: tag=22,index=6,offset=4
    segs=[("标记 Tag",22,"#cfe2ff",BLUE),("行索引 Index",6,"#d7f0e0",TEAL),("块内偏移 Offset",4,"#fde7c4",AMBER)]
    tw=total/32.0
    x=x0
    for name,bits,fc,sc in segs:
        w=bits*tw
        b.append('<rect x="%d" y="%d" width="%.1f" height="46" fill="%s" stroke="%s" stroke-width="1.4"/>'%(x,y,w,fc,sc))
        b.append(txt(x+w/2,y+22,"%s"%name,fs=12,weight="bold"))
        b.append(txt(x+w/2,y+40,"%d 位"%bits,fs=11,color=GREY))
        x+=w
    b.append(txt(x0+total/2,y+72,"32 位主存地址 = Tag(22) + Index(6) + Offset(4)",fs=12,color=GREY))
    # 具体例子
    bx=60; by=130
    b.append('<rect x="%d" y="%d" width="560" height="150" rx="8" fill="%s" stroke="%s"/>'%(bx,by,LGREY,GREY))
    b.append(txt(bx+12,by+24,"例子：Cache 64 行、块大小 16B、主存按字节编址",fs=12,weight="bold",anchor="start",color=BLUE))
    ex=[
        "块内偏移 Offset = log2(16) = 4 位（块内 0~15 字节）",
        "行索引 Index = log2(64) = 6 位（共 64 行，一一对应）",
        "标记 Tag = 32 − 6 − 4 = 22 位",
        "主存地址 0x1234 = 0001 0010 0011 0100₂：",
        "  Offset = 低 4 位 = 0100₂ = 4；Index = 次低 6 位 = 110011₂ = 51；Tag = 高 22 位 = 0x48",
        "命中判断：第 51 行 的 Tag 字段 == 0x48 且有效位=1 才命中。",
    ]
    for i,t in enumerate(ex):
        b.append(txt(bx+12,by+48+i*18,t,fs=12,anchor="start",color="#202124"))
    b.append(txt(340,310,"直接映射：每主存块固定落到唯一一行，电路最简单，但易冲突（抖动）。",fs=11,color=GREY))
    return svg(680,335,"\n".join(b))

# ---------------------------------------------------------------- 5. Cache 组相联
def cache_setassoc():
    b=[]
    b.append(txt(340,26,"组相联 Cache（以 4 路组相联为例）",fs=14,weight="bold"))
    x0=60; y=60; total=560
    segs=[("Tag",18,"#cfe2ff",BLUE),("组索引 Set",8,"#d7f0e0",TEAL),("Offset",4,"#fde7c4",AMBER)]
    tw=total/32.0; x=x0
    for name,bits,fc,sc in segs:
        w=bits*tw
        b.append('<rect x="%d" y="%d" width="%.1f" height="46" fill="%s" stroke="%s" stroke-width="1.4"/>'%(x,y,w,fc,sc))
        b.append(txt(x+w/2,y+22,name,fs=12,weight="bold")); b.append(txt(x+w/2,y+40,"%d 位"%bits,fs=11,color=GREY))
        x+=w
    b.append(txt(x0+total/2,y+72,"32 位 = Tag(18) + SetIndex(8) + Offset(4)（示例）",fs=12,color=GREY))
    bx=60; by=130
    b.append('<rect x="%d" y="%d" width="560" height="120" rx="8" fill="%s" stroke="%s"/>'%(bx,by,LGREY,GREY))
    b.append(txt(bx+12,by+24,"定量关系（Cache 共 64 行）",fs=12,weight="bold",anchor="start",color=BLUE))
    ex=[
        "组数 = 行数 / 路数 = 64 / 4 = 16 组 → SetIndex = log2(16) = 4 位（上图取 8 位表示更通用情形）",
        "全相联：SetIndex=0，整块可放任意行，Tag=28 位，查找最慢但冲突最少",
        "直接映射=1 路组相联；路数↑ → 冲突↓、Tag↑、比较器↑、命中快",
    ]
    for i,t in enumerate(ex):
        b.append(txt(bx+12,by+48+i*20,t,fs=12,anchor="start",color="#202124"))
    # 直观：一个组内 4 行
    b.append(txt(340,278,"一组内有 4 个 Cache 行，主存块按 SetIndex 找到组后，在组内比对 4 个 Tag。",fs=11,color=GREY))
    b.append(box(230,290,220,40,"组 Set[k]：行0 行1 行2 行3（4路）",LBOX,BLUE))
    return svg(680,350,"\n".join(b))

# ---------------------------------------------------------------- 6. Booth
def booth():
    b=[]
    b.append(txt(340,26,"Booth 算法步骤（4 位补码：7 × (−3)）",fs=14,weight="bold"))
    b.append(txt(340,46,"7=(0111)₂ ，−3=(1101)₂ ；规则：Q0Q−1 = 00 原样; 01 +M; 10 −M; 11 原样；右移带符号",fs=11,color=GREY))
    # table
    cols=["步骤","A(累加)","Q","Q−1","M=0111","操作"]
    x0=40; y=70; cw=[60,90,70,55,80,150]
    rows2=[
        ["0","0000","0111","0","0111","初始"],
        ["1","1101","0011","1","0111","A−M(10)→右移"],
        ["2","1110","1001","1","0111","原样(11)→右移"],
        ["3","0010","0100","1","0111","A+M(01)→右移"],
        ["4","0001","0010","0","0111","原样(00)→右移"],
    ]
    x=x0
    for c in cols:
        b.append('<rect x="%d" y="%d" width="%d" height="34" fill="%s" stroke="%s"/>'%(x,y,cw[cols.index(c)],LGREY,GREY))
        b.append(txt(x+cw[cols.index(c)]/2,y+22,c,fs=12,weight="bold"))
        x+=cw[cols.index(c)]
    for ri,r in enumerate(rows2):
        yy=y+34+ri*34; x=x0
        for ci,v in enumerate(r):
            b.append('<rect x="%d" y="%d" width="%d" height="34" fill="%s" stroke="%s"/>'%(x,yy,cw[ci],"#fff"if ri%2 else LGREY,GREY))
            b.append(txt(x+cw[ci]/2,yy+22,v,fs=11))
            x+=cw[ci]
    b.append(txt(340,320,"结果取 A·Q = 0001 0010 = (0010 0001?)₂ → 补码 00010010₂ = 16+2 = 18？校验：7×(−3)=−21，",fs=11,color=GREY))
    b.append(txt(340,338,"4 位补码范围 −8~+7 溢出，需 8 位：−21=(1110 1011)₂。Booth 用 N 位结果会溢出，应扩展位宽。",fs=11,color=GREY))
    return svg(680,365,"\n".join(b))

# ---------------------------------------------------------------- 7. IEEE754
def ieee754():
    b=[]
    b.append(txt(340,26,"IEEE 754 单精度编码（示例：−6.625）",fs=14,weight="bold"))
    x0=60; y=60; total=560
    segs=[("S 1",1,"#fde7c4",AMBER),("阶码 E 8",8,"#cfe2ff",BLUE),("尾数 M 23",23,"#d7f0e0",TEAL)]
    tw=total/32.0; x=x0
    for name,bits,fc,sc in segs:
        w=bits*tw
        b.append('<rect x="%d" y="%d" width="%.1f" height="46" fill="%s" stroke="%s" stroke-width="1.4"/>'%(x,y,w,fc,sc))
        b.append(txt(x+w/2,y+22,name,fs=12,weight="bold")); b.append(txt(x+w/2,y+40,"%d位"%bits,fs=11,color=GREY))
        x+=w
    bx=60; by=130
    b.append('<rect x="%d" y="%d" width="560" height="170" rx="8" fill="%s" stroke="%s"/>'%(bx,by,LGREY,GREY))
    b.append(txt(bx+12,by+24,"−6.625 的编码步骤",fs=12,weight="bold",anchor="start",color=BLUE))
    ex=[
        "① 符号 S = 1（负数）",
        "② 6.625 = 110.101₂ = 1.10101₂ × 2²  → 规格化尾数 1.10101，隐含整数位 1",
        "③ 阶码 E = 真值 2 + 偏移 127 = 129 = 1000 0001₂",
        "④ 尾数 M = 小数部分 .10101 左补 0 至 23 位 = 1010 1000 0000 0000 0000 000",
        "⑤ 完整 32 位：1 | 10000001 | 10101000000000000000000",
        "机器零：E=0 且 M=0；非规数 E=0 M≠0；无穷大 E=全1 M=0；NaN E=全1 M≠0。",
    ]
    for i,t in enumerate(ex):
        b.append(txt(bx+12,by+48+i*19,t,fs=12,anchor="start",color="#202124"))
    b.append(txt(340,330,"双精度：S1 / E11(偏移1023) / M52，范围与精度更大。",fs=11,color=GREY))
    return svg(680,355,"\n".join(b))

# ---------------------------------------------------------------- 8. 海明码
def hamming():
    b=[]
    b.append(txt(340,26,"海明码（4 位数据 1011 编码 + 单错定位）",fs=14,weight="bold"))
    # 位置 1..7
    pos=["P1","P2","D3","P4","D5","D6","D7"]
    val=["?","?","1","?","0","1","1"]
    x0=50; y=70; cw=72
    for i,p in enumerate(pos):
        x=x0+i*cw
        b.append('<rect x="%d" y="%d" width="%d" height="44" fill="%s" stroke="%s"/>'%(x,y,cw-6,LGREY,GREY))
        b.append(txt(x+(cw-6)/2,y+18,"位%d"% (i+1),fs=11,color=GREY))
        b.append(txt(x+(cw-6)/2,y+36,p,fs=12,weight="bold"))
    # values row
    for i,v in enumerate(val):
        x=x0+i*cw
        b.append(txt(x+(cw-6)/2,y+70,v,fs=13,color=BLUE,weight="bold"))
    b.append(txt(340,160,"奇偶校验位覆盖（P 在 2^k 位，覆盖其补码对应的数据位）",fs=12,weight="bold",color=BLUE))
    ex=[
        "P1(位1) 覆盖位 1,3,5,7 → D3,D5,D7 = 1,0,1 → 偶校验 P1=0",
        "P2(位2) 覆盖位 2,3,6,7 → D3,D6,D7 = 1,1,1 → 偶校验 P2=1",
        "P4(位4) 覆盖位 4,5,6,7 → D5,D6,D7 = 0,1,1 → 偶校验 P4=0",
        "编码后：P1P2 D3 P4 D5 D6 D7 = 0 1 1 0 0 1 1 → 0110011",
        "单错定位：收到码按三位校验分组重算，错在哪组就在对应位翻转（ syndrome 直接给出错误位号）。",
    ]
    bx=50; by=180
    b.append('<rect x="%d" y="%d" width="580" height="120" rx="8" fill="%s" stroke="%s"/>'%(bx,by,LGREY,GREY))
    for i,t in enumerate(ex):
        b.append(txt(bx+12,by+24+i*19,t,fs=12,anchor="start",color="#202124"))
    return svg(680,330,"\n".join(b))

# ---------------------------------------------------------------- 9. 磁盘
def disk():
    b=[]
    b.append(txt(340,26,"磁盘结构与容量计算（CHS / LBA）",fs=14,weight="bold"))
    # 盘面示意
    b.append('<ellipse cx="180" cy="150" rx="120" ry="46" fill="%s" stroke="%s" stroke-width="1.5"/>'%(LBOX,BLUE))
    b.append('<ellipse cx="180" cy="150" rx="60" ry="23" fill="#fff" stroke="%s" stroke-width="1.2"/>'%GREY)
    b.append('<ellipse cx="180" cy="150" rx="14" ry="6" fill="%s" stroke="%s"/>'%(LGREY,GREY))
    b.append(txt(180,158,"盘面/磁道/扇区",fs=11,color=GREY))
    b.append(txt(180,210,"一个盘面 = 若干同心磁道；每磁道分若干扇区（通常 512B）。",fs=11,color=GREY))
    # 公式框
    bx=380; by=70
    b.append('<rect x="%d" y="%d" width="270" height="150" rx="8" fill="%s" stroke="%s"/>'%(bx,by,LGREY,GREY))
    b.append(txt(bx+12,by+24,"容量公式",fs=12,weight="bold",anchor="start",color=BLUE))
    ex=[
        "容量 = 盘面数 × 柱面数(C)",
        "        × 每道扇区数(S)",
        "        × 每扇区字节(512)",
        "例：2 面 × 10000 柱面 ×",
        "      500 扇区 × 512B",
        "   = 2×10⁴×500×512 ≈ 5.12 GB",
        "LBA = (C×H + Hn)×S + Sn",
    ]
    for i,t in enumerate(ex):
        b.append(txt(bx+12,by+48+i*18,t,fs=12,anchor="start",color="#202124"))
    b.append(txt(340,250,"CHS（柱面/磁头/扇区）是物理寻址；LBA 是线性逻辑块号，BIOS/磁盘控制器内部转换。",fs=11,color=GREY))
    return svg(680,280,"\n".join(b))

# ---------------------------------------------------------------- 10. 交叉编址
def interleaved():
    b=[]
    b.append(txt(340,26,"低位交叉 vs 高位交叉编址",fs=14,weight="bold"))
    # 两个模块
    for i,col in enumerate(["M0","M1"]):
        b.append(box(60+i*300,60,240,40,col,LBOX,BLUE))
    # 高位交叉：地址高位选模块 -> 顺序块在同一模块
    b.append(txt(190,130,"高位交叉（模块号=高位）",fs=12,weight="bold",color=BLUE))
    b.append(txt(190,150,"块0~N在M0，块N+1~在M1 → 连续访问只命中一个模块，无带宽提升",fs=11,color=GREY))
    # 低位交叉：地址低位选模块
    b.append(txt(490,130,"低位交叉（模块号=低位）",fs=12,weight="bold",color=TEAL))
    b.append(txt(490,150,"地址 0→M0,1→M1,2→M0,3→M1… 连续字轮流分布",fs=11,color=GREY))
    # 带宽示意
    bx=60; by=180
    b.append('<rect x="%d" y="%d" width="560" height="90" rx="8" fill="%s" stroke="%s"/>'%(bx,by,LGREY,GREY))
    b.append(txt(bx+12,by+22,"定量：m 个模块低位交叉，总线每个存储周期启动一个新模块",fs=12,weight="bold",anchor="start",color=BLUE))
    b.append(txt(bx+12,by+48,"连续访问 m 个字的总时间 ≈ 1 个存储周期（流水线式），",fs=12,anchor="start",color="#202124"))
    b.append(txt(bx+12,by+70,"带宽提升约 m 倍；前提是模块独立、可并行。",fs=12,anchor="start",color="#202124"))
    return svg(680,300,"\n".join(b))

# ---------------------------------------------------------------- 11. DRAM 刷新
def dram_refresh():
    b=[]
    b.append(txt(340,26,"DRAM 刷新方式对比",fs=14,weight="bold"))
    # 时间轴
    x0=60; y=200; w=560
    b.append(line(x0,y,x0+w,y,GREY,1.5))
    b.append(txt(x0-40,y+5,"时间→",fs=11,color=GREY,anchor="start"))
    # 集中式：一段长刷新
    b.append(box(x0,y-40,120,30,"集中式刷新",LRED,RED))
    b.append(txt(x0+60,y-50,"死区",fs=10,color=RED))
    # 分散式
    b.append(txt(x0+200,y-20,"分散式：每周期插一个刷新（无死区但慢）",fs=11,color=TEAL,anchor="start"))
    # 异步式
    b.append(box(x0+300,y-40,180,30,"异步式刷新\n(常用)",LGRN,TEAL))
    b.append(txt(x0+390,y-50,"利用 CPU 不访存时",fs=10,color=TEAL))
    bx=60; by=240
    b.append('<rect x="%d" y="%d" width="560" height="80" rx="8" fill="%s" stroke="%s"/>'%(bx,by,LGREY,GREY))
    b.append(txt(bx+12,by+22,"定量：刷新周期 64ms（标准），行数 N 则相邻刷新间隔 = 64ms/N",fs=12,anchor="start",color=BLUE,weight="bold"))
    b.append(txt(bx+12,by+48,"例 N=4096 行：间隔≈15.6μs；每行刷新占 1 个周期，总线占用≈ 1/4096 ≈ 0.024%（可忽略）",fs=12,anchor="start",color="#202124"))
    b.append(txt(340,355,"SRAM 用双稳态锁存无需刷新；DRAM 用电容存电荷，会漏电必须定期回写（刷新）。",fs=11,color=GREY))
    return svg(680,375,"\n".join(b))

# ---------------------------------------------------------------- 12. 中断 vs DMA
def interrupt_dma():
    b=[]
    b.append(txt(340,26,"中断方式 vs DMA 方式（I/O 传输）",fs=14,weight="bold"))
    # 中断列
    b.append(box(60,60,260,40,"中断方式",LBOX,BLUE))
    steps_i=["外设就绪→发中断请求","CPU 保存现场、转入 ISR","ISR 用 IN/OUT 或_load 逐字搬运","每个字都经 CPU 寄存器","传输完→恢复现场、返回"]
    y=110
    for s in steps_i:
        b.append(box(60,y,260,30,s,LGREY,GREY,fs=11)); y+=36
    b.append(txt(190,300,"CPU 全程参与每个字节",fs=11,color=RED,weight="bold"))
    # DMA 列
    b.append(box(360,60,260,40,"DMA 方式",LGRN,TEAL))
    steps_d=["CPU 设好 源/目的/长度 给 DMAC","DMAC 接管总线、自行搬运整块","传输中 CPU 可执行其他任务","整块传完 DMAC 才发一次中断","仅开始/结束需 CPU"]
    y=110
    for s in steps_d:
        b.append(box(360,y,260,30,s,LGREY,GREY,fs=11)); y+=36
    b.append(txt(490,300,"CPU 只在两端介入",fs=11,color=TEAL,weight="bold"))
    b.append(arrow(320,160,360,160,color=GREY,dash=True))
    b.append(txt(340,335,"大数据块（如磁盘读）用 DMA 显著解放 CPU；小量/异步事件用中断更轻量。",fs=11,color=GREY))
    return svg(680,360,"\n".join(b))

# ---------------------------------------------------------------- 13. 补码圆环
def twos_ring():
    b=[]
    b.append(txt(340,26,"补码模运算圆环（以 mod 8 为例）",fs=14,weight="bold"))
    import math
    cx=230; cy=200; r=140
    b.append('<circle cx="%d" cy="%d" r="%d" fill="%s" stroke="%s" stroke-width="1.5"/>'%(cx,cy,r,LBOX,BLUE))
    labels={0:"0",1:"1",2:"2",3:"3 (-5)",4:"4 (-4)",5:"5 (-3)",6:"6 (-2)",7:"7 (-1)"}
    for k in range(8):
        ang=math.pi/2 - 2*math.pi*k/8
        x=cx+r*math.cos(ang); y=cy-r*math.sin(ang)
        b.append(txt(int(x),int(y)+5,labels[k],fs=11,color="#202124"))
    # 高亮 -3 == +5
    def pt(k):
        ang=math.pi/2 - 2*math.pi*k/8
        return cx+r*math.cos(ang), cy-r*math.sin(ang)
    x5,y5=pt(5); x3,y3=pt(3)
    b.append('<circle cx="%d" cy="%d" r="14" fill="%s" stroke="%s" stroke-width="2"/>'%(int(x5),int(y5),LRED,RED))
    b.append('<circle cx="%d" cy="%d" r="14" fill="%s" stroke="%s" stroke-width="2"/>'%(int(x3),int(y3),LRED,RED))
    b.append(txt(int(x5),int(y5)+5,"5",fs=12,color=RED,weight="bold"))
    b.append(txt(int(x3),int(y3)+5,"3",fs=12,color=RED,weight="bold"))
    bx=430; by=90
    b.append('<rect x="%d" y="%d" width="220" height="170" rx="8" fill="%s" stroke="%s"/>'%(bx,by,LGREY,GREY))
    b.append(txt(bx+12,by+24,"为何减法变加法",fs=12,weight="bold",anchor="start",color=BLUE))
    ex=[
        "3 位补码模 2³=8：环上每 8 步回到原点。",
        "−3 mod 8 = 5，所以 A−3 ≡ A+5 (mod 8)。",
        "加/减法器只做加法：",
        "  A − B = A + (−B) = A + (2ⁿ − B补)",
        "符号位自然参与运算，无额外判断。",
    ]
    for i,t in enumerate(ex):
        b.append(txt(bx+12,by+48+i*20,t,fs=12,anchor="start",color="#202124"))
    return svg(680,400,"\n".join(b))

# ---------------------------------------------------------------- generate
if __name__ == "__main__":
    funcs = {
        "fig-comporg-mem-hierarchy.svg": mem_hierarchy,
        "fig-comporg-datapath.svg": datapath,
        "fig-comporg-pipeline.svg": pipeline,
        "fig-comporg-cache-direct.svg": cache_direct,
        "fig-comporg-cache-setassoc.svg": cache_setassoc,
        "fig-comporg-booth.svg": booth,
        "fig-comporg-ieee754.svg": ieee754,
        "fig-comporg-hamming.svg": hamming,
        "fig-comporg-disk.svg": disk,
        "fig-comporg-interleaved.svg": interleaved,
        "fig-comporg-dram-refresh.svg": dram_refresh,
        "fig-comporg-interrupt-dma.svg": interrupt_dma,
        "fig-comporg-twos-ring.svg": twos_ring,
    }
    for fn, f in funcs.items():
        p = os.path.join(OUT, fn)
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(f())
        print("wrote", fn)
    print("TOTAL", len(funcs))
