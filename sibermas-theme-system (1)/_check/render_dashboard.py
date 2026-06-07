#!/usr/bin/env python3
# Reference-grade SIBERMAS dashboard (TeamHub-style) rendered per theme.
# Same rich layout, themed via theme-config tokens + per-theme fonts.
# Outputs: dashboard-<slug>.png (5), dashboard.pdf (5 pages), dashboard-overview.png
import json, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(__file__); ROOT = os.path.dirname(HERE)
themes = json.load(open(os.path.join(HERE, "themes.json")))

FD="/usr/share/fonts/dejavu-serif-fonts/"; FS="/usr/share/fonts/dejavu-sans-fonts/"; FM="/usr/share/fonts/dejavu-sans-mono-fonts/"
SERIF_B=FD+"DejaVuSerif-Bold.ttf"; SANS=FS+"DejaVuSans.ttf"; SANS_B=FS+"DejaVuSans-Bold.ttf"
COND=FS+"DejaVuSansCondensed.ttf"; COND_B=FS+"DejaVuSansCondensed-Bold.ttf"
MONO=FM+"DejaVuSansMono.ttf"; MONO_B=FM+"DejaVuSansMono-Bold.ttf"
NOTO="/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf"
if not os.path.exists(NOTO): NOTO=SANS
FP={"akademik":{"h":SERIF_B,"b":SANS,"m":MONO},"nusantara":{"h":NOTO,"b":NOTO,"m":MONO},
    "minimal":{"h":SANS_B,"b":SANS,"m":MONO},"sustainability":{"h":COND_B,"b":COND,"m":MONO},
    "professional":{"h":MONO_B,"b":SANS,"m":MONO}}

SC=2; q=lambda v:int(round(v*SC))
def hx(c):
    c=c.lstrip("#")
    if len(c)==3:c="".join(x*2 for x in c)
    return tuple(int(c[i:i+2],16) for i in (0,2,4))

img=None; d=None
def ff(p,s): return ImageFont.truetype(p,int(s*SC))
def tw(s,p,sz): return d.textlength(s,font=ff(p,sz))/SC
def T(x,y,s,p,sz,fill,anchor="la"): d.text((q(x),q(y)),s,font=ff(p,sz),fill=fill,anchor=anchor)
def rrect(box,r,fill=None,outline=None,width=1):
    d.rounded_rectangle([q(box[0]),q(box[1]),q(box[2]),q(box[3])],radius=q(r),fill=fill,outline=outline,width=max(1,int(width*SC)))
def composite(layer):
    global img,d; img=Image.alpha_composite(img,layer); d=ImageDraw.Draw(img)
def card(box,r,fill,outline=None,shadow=True,dy=6,blur=12,alpha=38):
    if shadow:
        sh=Image.new("RGBA",img.size,(0,0,0,0))
        ImageDraw.Draw(sh).rounded_rectangle([q(box[0]),q(box[1]+dy),q(box[2]),q(box[3]+dy)],radius=q(r),fill=(0,0,0,alpha))
        composite(sh.filter(ImageFilter.GaussianBlur(int(blur*SC*0.5))))
    rrect(box,r,fill=fill,outline=outline,width=1)
def btn(x,y,label,fill,txt,p,sz,r,h=30,pad=14,outline=None):
    w=tw(label,p,sz)+pad*2; rrect((x,y,x+w,y+h),r,fill=fill,outline=outline,width=1)
    d.text((q(x+w/2),q(y+h/2)),label,font=ff(p,sz),fill=txt,anchor="mm"); return x+w
def badge(x,y,label,fill,txt,p,sz=9.5,h=20,pad=10):
    w=tw(label,p,sz)+pad*2; rrect((x,y,x+w,y+h),h/2,fill=fill)
    d.text((q(x+w/2),q(y+h/2)),label,font=ff(p,sz),fill=txt,anchor="mm"); return x+w
def pbar(x,y,w,frac,track,fill,h=7):
    rrect((x,y,x+w,y+h),h/2,fill=track)
    if frac>0: rrect((x,y,x+w*frac,y+h),h/2,fill=fill)
def donut(cx,cy,r,th,segs,track):
    box=[q(cx-r),q(cy-r),q(cx+r),q(cy+r)]
    d.arc(box,0,360,fill=track,width=q(th)); a=-90.0
    for frac,col in segs:
        d.arc(box,a,a+frac*360,fill=col,width=q(th)); a+=frac*360
def sparkline(x,y,w,h,vals,col):
    mn,mx=min(vals),max(vals); rng=(mx-mn) or 1; n=len(vals)
    pts=[(q(x+i/(n-1)*w),q(y+h-(v-mn)/rng*h)) for i,v in enumerate(vals)]
    d.line(pts,fill=col,width=max(1,int(2*SC)),joint="curve")
def barchart(x,y,w,h,vals,cols):
    n=len(vals); gap=w/n; bw=gap*0.5; mx=max(vals) or 1
    for i,v in enumerate(vals):
        bx=x+i*gap+(gap-bw)/2; bh=h*v/mx
        rrect((bx,y+h-bh,bx+bw,y+h),4,fill=cols[i%len(cols)])
def avatar(x,y,dia,initials,bg,fg,p):
    d.ellipse([q(x),q(y),q(x+dia),q(y+dia)],fill=bg)
    d.text((q(x+dia/2),q(y+dia/2)),initials,font=ff(p,dia*0.4),fill=fg,anchor="mm")

W=1000; Hd=664

def render_one(t):
    global img,d
    v=t["vars"]; fp=FP[t["slug"]]
    page=hx(v["--profile-page"]); text=hx(v["--profile-text"]); muted=hx(v["--profile-muted"])
    surf=hx(v["--profile-surface"]); strong=hx(v["--profile-surface-strong"]); border=hx(v["--profile-border"])
    soft=hx(v["--profile-soft"]); softt=hx(v["--profile-soft-text"]); primary=hx(v["--profile-primary"])
    accent=hx(v["--profile-accent"]); inp=hx(v["--profile-input"])
    warn=hx(v["--profile-warning"]); warnt=hx(v["--profile-warning-text"]) ; dang=hx(v["--profile-danger"]); dangt=hx(v["--profile-danger-text"])
    is_dark=t["slug"]=="professional"
    white=(255,255,255); ptxt=(11,18,32) if is_dark else white
    img=Image.new("RGBA",(W*SC,Hd*SC),page+(255,)); d=ImageDraw.Draw(img)

    # ---------------- sidebar ----------------
    SBW=196
    rrect((0,0,SBW,Hd),0,fill=surf)
    d.line([(q(SBW),0),(q(SBW),q(Hd))],fill=border,width=max(1,int(SC)))
    rrect((24,26,48,50),7,fill=primary)
    T(58,30,"SIBERMAS",fp["h"],15,text)
    T(26,70,"MENU",fp["b"],8.5,muted)
    nav=[("Dashboard",True),("Mahasiswa",False),("Lokasi KKN",False),("Jadwal",False),("Laporan",False),("Pengaturan",False)]
    ny=88
    for name,active in nav:
        if active:
            rrect((16,ny-5,SBW-16,ny+24),9,fill=soft)
            rrect((16,ny-5,20,ny+24),2,fill=primary)
            rrect((30,ny+1,48,ny+19),6,fill=primary); T(58,ny+2,name,fp["b"],11.5,softt)
        else:
            rrect((30,ny+1,48,ny+19),6,fill=strong); T(58,ny+2,name,fp["b"],11.5,muted)
        ny+=40
    # upgrade card bottom
    card((16,Hd-150,SBW-16,Hd-24),12,strong,border,shadow=False)
    T(30,Hd-136,"SIBERMAS Pro",fp["h"],12,text)
    T(30,Hd-116,"Modul lanjutan &",fp["b"],9.5,muted)
    T(30,Hd-102,"laporan otomatis.",fp["b"],9.5,muted)
    btn(30,Hd-78,"Upgrade",primary,ptxt,fp["b"],10,8,h=26)

    # ---------------- topbar ----------------
    cx0=SBW+24; cx1=W-24
    T(cx0,24,"Beranda KKN",fp["h"],20,text)
    T(cx0,52,"Dashboard  /  Ringkasan",fp["b"],10,muted)
    # search
    sx0=cx0+250; sx1=cx1-180
    rrect((sx0,22,sx1,52),9,fill=inp if is_dark else strong,outline=border,width=1)
    d.ellipse([q(sx0+14),q(31),q(sx0+26),q(43)],outline=muted,width=max(1,int(1.4*SC)))
    T(sx0+36,37,"Cari mahasiswa, desa, laporan…",fp["b"],10.5,muted,anchor="lm")
    # bell + avatar
    rrect((cx1-150,24,cx1-124,50),8,fill=strong,outline=border,width=1)
    avatar(cx1-110,22,32,"AT",soft,softt,fp["b"])
    T(cx1-72,28,"Akun Tholib",fp["b"],10.5,text); T(cx1-72,42,"Koordinator",fp["b"],9,muted)

    # ---------------- stat cards ----------------
    sy=78; cw=(cx1-cx0-3*16)/4
    stats=[("Mahasiswa","128","+8%",True,[4,6,5,8,7,9,11]),
           ("Desa Lokasi","32","+2",True,[2,3,3,4,4,5,5]),
           ("Laporan Masuk","94%","+5%",True,[6,5,7,6,8,8,9]),
           ("Kegiatan","17","-3%",False,[8,7,7,6,6,5,5])]
    xx=cx0
    for lab,num,delta,up,spark in stats:
        card((xx,sy,xx+cw,sy+98),12,surf,border,dy=5,blur=10,alpha=30)
        T(xx+16,sy+14,lab,fp["b"],10,muted)
        T(xx+16,sy+30,num,fp["h"],22,text)
        dc=softt if up else dangt
        T(xx+16,sy+64,("▲ " if up else "▼ ")+delta,fp["b"],9.5,dc)
        sparkline(xx+cw-78,sy+58,60,26,spark,primary if up else dangt)
        xx+=cw+16

    # ---------------- charts row ----------------
    ry=sy+98+18; rh=180
    # donut card
    dcx0=cx0; dcx1=cx0+288
    card((dcx0,ry,dcx1,ry+rh),12,surf,border,dy=5,blur=10,alpha=30)
    T(dcx0+16,ry+14,"Status Mahasiswa",fp["h"],13,text)
    cxc=dcx0+78; cyc=ry+108
    donut(cxc,cyc,52,16,[(0.62,primary),(0.26,accent),(0.12,muted)],strong)
    T(cxc,cyc-8,"128",fp["h"],18,text,anchor="mm"); T(cxc,cyc+14,"total",fp["b"],9,muted,anchor="mm")
    leg=[("Aktif","62%",primary),("Review","26%",accent),("Nonaktif","12%",muted)]
    lyy=ry+58
    for name,pct,col in leg:
        rrect((dcx0+158,lyy+2,dcx0+168,lyy+12),3,fill=col)
        T(dcx0+178,lyy,name,fp["b"],10.5,text); T(dcx1-16,lyy,pct,fp["b"],10.5,muted,anchor="ra")
        lyy+=34
    # bar chart card
    bcx0=dcx1+18
    card((bcx0,ry,cx1,ry+rh),12,surf,border,dy=5,blur=10,alpha=30)
    T(bcx0+16,ry+14,"Laporan per Bulan",fp["h"],13,text)
    badge(cx1-92,ry+12,"Tahun ini",strong,muted,fp["b"])
    barchart(bcx0+20,ry+50,cx1-bcx0-40,108,[5,7,6,9,7,11,8,12,9,10,8,13],[primary,accent])

    # ---------------- table card ----------------
    ty=ry+rh+18
    card((cx0,ty,cx1,Hd-24),12,surf,border,dy=5,blur=10,alpha=30)
    T(cx0+16,ty+14,"Aktivitas Mahasiswa",fp["h"],13,text)
    T(cx1-16,ty+16,"Lihat semua ›",fp["b"],10,softt,anchor="ra")
    cols=[("NAMA",cx0+58),("DESA",cx0+300),("STATUS",cx0+440),("PROGRES",cx0+560)]
    hy=ty+44
    for c,cxp in cols: T(cxp,hy,c,fp["b"],9,muted)
    d.line([(q(cx0+16),q(hy+18)),(q(cx1-16),q(hy+18))],fill=border,width=max(1,int(SC)))
    rows=[("AT","Akun Tholib","Sukamaju","Aktif",soft,softt,0.9),
          ("SA","Siti Aisyah","Mekarsari","Review",warn,warnt,0.6),
          ("BS","Budi Santoso","Cibadak","Aktif",soft,softt,0.75),
          ("RW","Rina Wati","Sumberejo","Ditolak",dang,dangt,0.2),
          ("DC","Dani Cahya","Mulyasari","Aktif",soft,softt,0.55)]
    rcy=hy+30
    for ini,name,desa,st,bg,btxt,frac in rows:
        avatar(cx0+18,rcy-2,28,ini,strong,text,fp["b"])
        T(cx0+58,rcy,name,fp["b"],11,text)
        T(cx0+300,rcy,desa,fp["b"],11,muted)
        badge(cx0+440,rcy-2,st,bg,btxt,fp["b"],sz=9.5,h=20,pad=9)
        pbar(cx0+560,rcy+5,cx1-cx0-580,frac,strong,primary,h=7)
        T(cx1-16,rcy,str(int(frac*100))+"%",fp["b"],9.5,muted,anchor="ra")
        rcy+=34
    return img.convert("RGB")

order=[t["slug"] for t in themes]
byslug={t["slug"]:t for t in themes}
pages=[render_one(byslug[s]) for s in order]
for s,pg in zip(order,pages):
    pg.save(os.path.join(ROOT,f"dashboard-{s}.png"),"PNG")
pages[0].save(os.path.join(ROOT,"dashboard.pdf"),"PDF",save_all=True,append_images=pages[1:],resolution=150)

# overview: stack with captions
cap=58
ov=Image.new("RGB",(W*SC,(Hd+cap)*len(pages)*SC),(245,247,249))
od=ImageDraw.Draw(ov)
yy=0
for s,pg in zip(order,pages):
    t=byslug[s]
    fams=" + ".join(g.split(":")[0] for g in t["fonts"]["google"])
    od.text((q(24),q(yy+18)),t["label"]+"  —  "+fams,font=ff(SANS_B,15),fill=(20,24,30))
    ov.paste(pg,(0,q(yy+cap)))
    yy+=cap+Hd
ov.save(os.path.join(ROOT,"dashboard-overview.png"),"PNG")
print("done", ov.size, "pages:", len(pages))
