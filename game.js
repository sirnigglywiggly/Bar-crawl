/* Birthday Quest · world map game. The route itself comes from /api/route. */
/* ================= THE ROUTE (edit here) ================= */
const STOPS=window.ROUTE.stops;
{const cb=document.getElementById('cBoss');if(cb)cb.textContent=STOPS[STOPS.length-1].n;} /* served by /api/route only to the host, or to everyone on quest day */
/* What the hero says when you tap him */
const SAY_LINE="I AM NOT ZOHRAN MAMDANI";
/* ========================================================= */

const gmaps=s=>"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(s.n+", "+s.a+", Brooklyn, NY");
const q=s=>encodeURIComponent(s.n+", "+s.a+", Brooklyn, NY");
document.getElementById('full').href="https://www.google.com/maps/dir/?api=1&travelmode=walking&origin="+q(STOPS[0])+"&destination="+q(STOPS[6])+"&waypoints="+STOPS.slice(1,6).map(q).join("%7C");

/* ---------- storage (best effort) ---------- */
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};

/* ---------- sound ---------- */
let AC=null,muted=store.get('bq_mute',false);
function ensureAudio(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();}catch(e){}}
function beep(notes){if(muted||!AC)return;try{let t=AC.currentTime+0.01;for(const [f,d] of notes){const o=AC.createOscillator(),g=AC.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.05,t);g.gain.exponentialRampToValueAtTime(0.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+0.02);t+=d*0.9;}}catch(e){}}
const SFX={go:[[523,.05],[659,.05],[784,.08]],coin:[[784,.07],[1047,.07],[1568,.22]],honk:[[294,.1],[294,.2]],party:[[523,.06],[659,.06],[784,.06],[1047,.06],[1319,.06],[1568,.25]],win:[[523,.12],[659,.12],[784,.12],[1047,.3],[784,.1],[1047,.45]]};
const muteBtn=document.getElementById('mute');
const paintMute=()=>muteBtn.textContent=muted?'🔇 SFX OFF':'🔊 SFX ON';paintMute();
muteBtn.onclick=()=>{muted=!muted;store.set('bq_mute',muted);paintMute();ensureAudio();beep(SFX.go);};

/* ---------- hero sprite (original character) ---------- */
let riderShades=false;
const RC={tire:'#d9dbe8',hub:'#8f94ad',frame:'#ff7a1a',seat:'#15121f',bar:'#cfd3e0',skin:'#c98b5e',skinD:'#a86f47',hair:'#2a1a10',stache:'#2a1a10',eye:'#111',jacket:'#2f3a63',jacketD:'#1f2747',jeans:'#2f3a63',jeansD:'#1f2747',shoe:'#7a4a26',shirt:'#ffffff',tie:'#e23b4e',hat:'#ff4fa3',dot:'#ffe14d'};
const RIM=(()=>{const a=[];for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++){const d=Math.hypot(x,y);if(d>3.5&&d<=4.5)a.push([x,y]);}return a;})();
function drawRider(g,ox,oy,ph,flip){
  const P=(x,y,c)=>{g.fillStyle=c;g.fillRect(Math.round(ox+(flip?-x-1:x)),Math.round(oy+y),1,1);};
  const L=(x0,y0,x1,y1,c)=>{x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let e=dx+dy;for(let n=0;n<200;n++){P(x0,y0,c);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}};
  const hip={x:-2,y:-12},crank={x:0,y:-4};
  const pedal=a=>({x:crank.x+Math.round(3*Math.cos(a)),y:crank.y+Math.round(3*Math.sin(a))});
  const leg=(a,c,sh)=>{const p=pedal(a);const k={x:(hip.x+p.x)/2+3,y:(hip.y+p.y)/2-1};L(hip.x,hip.y,k.x,k.y,c);L(k.x,k.y,p.x,p.y,c);P(p.x,p.y,sh);P(p.x+1,p.y,sh);};
  leg(ph+Math.PI,RC.jeansD,'#bfc3d6');
  for(const cx of [-6,6]){for(const [x,y] of RIM)P(cx+x,-4+y,RC.tire);P(cx,-4,RC.hub);for(let k=0;k<3;k++){const a=ph+k*2.094;P(cx+Math.round(2.4*Math.cos(a)),-4+Math.round(2.4*Math.sin(a)),RC.hub);}}
  L(0,-4,-2,-10,RC.frame);L(-2,-10,4,-10,RC.frame);L(4,-10,0,-4,RC.frame);L(0,-4,-6,-4,RC.frame);L(-2,-10,-6,-4,RC.frame);L(4,-10,6,-4,RC.frame);L(4,-10,4,-12,RC.frame);
  P(4,-12,RC.bar);P(5,-12,RC.bar);
  P(-4,-11,RC.seat);P(-3,-11,RC.seat);P(-2,-11,RC.seat);
  const rows=[[-13,-3,0],[-14,-3,0],[-15,-2,1],[-16,-2,1],[-17,-1,2],[-18,-1,2]];
  for(const [y,a,b] of rows){for(let x=a;x<=b;x++)P(x,y,x===a?RC.jacketD:RC.jacket);}
  P(1,-18,RC.shirt);P(2,-18,RC.shirt);P(2,-17,RC.tie);P(1,-16,RC.tie);P(1,-15,RC.tie);P(1,-14,RC.jacketD);
  for(let y=-24;y<=-19;y++)for(let x=0;x<=4;x++)P(x,y,RC.skin);
  for(let x=0;x<=3;x++)P(x,-24,RC.hair);for(let y=-23;y<=-21;y++)P(0,y,RC.hair);
  P(1,-22,RC.skinD);P(3,-22,RC.eye);P(5,-21,RC.skin);
  if(riderShades){for(let x=1;x<=5;x++)P(x,-22,'#000');P(2,-21,'#000');P(4,-21,'#000');P(3,-23,'#ff4fa3');}
  for(let x=1;x<=6;x++)P(x,-20,RC.stache);P(7,-21,RC.stache);
  for(let x=0;x<=4;x++)P(x,-25,RC.hat);for(let x=1;x<=3;x++)P(x,-26,RC.hat);P(2,-27,RC.hat);P(3,-27,RC.hat);P(2,-28,RC.hat);
  P(1,-25,RC.dot);P(3,-26,RC.dot);
  P(2,-29,RC.dot);P(3,-29,RC.dot);P(2,-30,RC.dot);P(3,-30,RC.dot);
  L(1,-17,4,-13,RC.jacketD);P(3,-13,RC.shirt);P(4,-13,RC.skin);
  const p=pedal(ph);L(crank.x,crank.y,p.x,p.y,'#8f94ad');
  leg(ph,RC.jeans,RC.shoe);
}

/* ---------- tiny pixel font ---------- */
const F={'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],'6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111'],'+':['000','010','111','010','000']};
function ptext(g,str,x,y,c){g.fillStyle=c;let cx=x;for(const ch of str){const gl=F[ch];if(gl)for(let r=0;r<5;r++)for(let k=0;k<3;k++)if(gl[r][k]==='1')g.fillRect(cx+k,y+r,1,1);cx+=4;}}

/* ---------- world layout from real coordinates ---------- */
const W=480,H=160;
const lons=STOPS.map(s=>s.lon),lats=STOPS.map(s=>s.lat);
const lonMin=Math.min(...lons),lonMax=Math.max(...lons),latMin=Math.min(...lats),latMax=Math.max(...lats);
STOPS.forEach(s=>{s.x=Math.round(44+(s.lon-lonMin)/(lonMax-lonMin)*396);s.y=Math.round(36+(latMax-s.lat)/(latMax-latMin)*96);s.gy=s.y+8;s.ax=s.x+(s.boss?22:17);});
// path: L-shaped segments that never cut through a building
const pts=[{x:STOPS[0].ax,y:STOPS[0].gy}];
for(let i=1;i<STOPS.length;i++){const A=STOPS[i-1],B=STOPS[i];pts.push(B.gy<A.gy?{x:B.ax,y:A.gy}:{x:A.ax,y:B.gy});pts.push({x:B.ax,y:B.gy});}
const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.abs(pts[i].x-pts[i-1].x)+Math.abs(pts[i].y-pts[i-1].y));
const nodeArc=STOPS.map((_,i)=>cum[i*2]);
function posAt(d){for(let i=1;i<pts.length;i++){if(d<=cum[i]||i===pts.length-1){const seg=cum[i]-cum[i-1]||1,f=Math.max(0,Math.min(1,(d-cum[i-1])/seg));return{x:pts[i-1].x+(pts[i].x-pts[i-1].x)*f,y:pts[i-1].y+(pts[i].y-pts[i-1].y)*f};}}return pts[0];}

/* ---------- static background ---------- */
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const bg=document.createElement('canvas');bg.width=W;bg.height=H;
const ROOFS=[],PARKS=[];
function distToPath(x,y){let m=1e9;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];const cx=Math.max(Math.min(a.x,b.x),Math.min(Math.max(a.x,b.x),x)),cy=Math.max(Math.min(a.y,b.y),Math.min(Math.max(a.y,b.y),y));m=Math.min(m,Math.hypot(x-cx,y-cy));}return m;}
function distToNodes(x,y){return Math.min(...STOPS.map(st=>Math.min(Math.hypot(st.x-x,st.y-8-y),Math.hypot(st.ax-x,st.gy-10-y))));}
let COURT=null,FIELD=null;
(function buildBG(){
  const g=bg.getContext('2d'),r=rng(42);
  g.fillStyle='#262040';g.fillRect(0,0,W,H);
  const roofs=['#4a3570','#3d4a7a','#5a3d4f','#2f5560','#46406e'];
  for(let bx=30;bx<W;bx+=26)for(let by=2;by<H-14;by+=22){
    const x=bx+2,y=by+2,w=22,h=18;
    if(r()<0.12){PARKS.push({x,y,w,h});g.fillStyle='#2f6b45';g.fillRect(x,y,w,h);for(let k=0;k<5;k++){const tx=x+1+Math.floor(r()*(w-4)),ty=y+1+Math.floor(r()*(h-4));g.fillStyle='#1f4d2f';g.fillRect(tx,ty,3,3);g.fillStyle='#4f9a5f';g.fillRect(tx+1,ty,1,1);}continue;}
    ROOFS.push({x,y,w,h});g.fillStyle=roofs[Math.floor(r()*roofs.length)];g.fillRect(x,y,w,h);
    g.fillStyle='rgba(255,255,255,.10)';g.fillRect(x,y,w,1);g.fillRect(x,y,1,h);
    g.fillStyle='rgba(0,0,0,.30)';g.fillRect(x,y+h-1,w,1);g.fillRect(x+w-1,y,1,h);
    if(r()<0.5){const tx=x+2+Math.floor(r()*(w-8)),ty=y+2+Math.floor(r()*(h-8));g.fillStyle='#5e3b20';g.fillRect(tx,ty,5,5);g.fillStyle='#8a5a33';g.fillRect(tx+1,ty+1,3,3);g.fillStyle='#b07a48';g.fillRect(tx+2,ty+2,1,1);}
    for(let k=0;k<2;k++){g.fillStyle='#8f94ad';g.fillRect(x+2+Math.floor(r()*(w-5)),y+2+Math.floor(r()*(h-5)),2,2);}
    for(let k=0;k<3;k++){if(r()<0.6){g.fillStyle='#ffd75e';g.fillRect(x+1+Math.floor(r()*(w-3)),y+1+Math.floor(r()*(h-3)),1,1);}}
  }
  // basketball court + ball field in parks
  const pk=PARKS.filter(p=>distToNodes(p.x+11,p.y+9)>20);
  if(pk[0]){const p=pk[0];COURT=p;g.fillStyle='#c8743a';g.fillRect(p.x,p.y,p.w,p.h);g.fillStyle='#f4e4c8';g.fillRect(p.x+1,p.y+1,p.w-2,1);g.fillRect(p.x+1,p.y+p.h-2,p.w-2,1);g.fillRect(p.x+1,p.y+1,1,p.h-2);g.fillRect(p.x+p.w-2,p.y+1,1,p.h-2);g.fillRect(p.x+Math.floor(p.w/2),p.y+1,1,p.h-2);
    for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1],[-1,1],[1,-1]])g.fillRect(p.x+Math.floor(p.w/2)+dx,p.y+Math.floor(p.h/2)+dy,1,1);
    g.fillStyle='#ff7a1a';g.fillRect(p.x+2,p.y+Math.floor(p.h/2)-1,2,2);g.fillRect(p.x+p.w-4,p.y+Math.floor(p.h/2)-1,2,2);}
  if(pk[1]){const p=pk[1];FIELD=p;g.fillStyle='#3f8f4f';g.fillRect(p.x,p.y,p.w,p.h);const cx=p.x+Math.floor(p.w/2),cy=p.y+p.h-6;g.fillStyle='#b5835a';
    for(let yy=-6;yy<=6;yy++)for(let xx=-6;xx<=6;xx++)if(Math.abs(xx)+Math.abs(yy)<=6)g.fillRect(cx+xx,cy+yy-2,1,1);
    g.fillStyle='#3f8f4f';for(let yy=-3;yy<=3;yy++)for(let xx=-3;xx<=3;xx++)if(Math.abs(xx)+Math.abs(yy)<=3)g.fillRect(cx+xx,cy+yy-2,1,1);
    g.fillStyle='#fff';[[0,4],[6,-2],[0,-8],[-6,-2]].forEach(([a,b2])=>g.fillRect(cx+a,cy+b2,1,1));g.fillStyle='#b5835a';g.fillRect(cx,cy-3,1,1);}
  // subway entrances by the L stops (Lorimer, Montrose, Jefferson)
  [2,3,6].forEach(i=>{const st=STOPS[i],x=st.x-17,y=st.y+4;g.fillStyle='#0d0b1a';g.fillRect(x-1,y-1,10,8);g.fillStyle='#2b2b38';g.fillRect(x,y,8,6);g.fillStyle='#6c6590';for(let k=1;k<6;k+=2)g.fillRect(x+1,y+k,6,1);g.fillStyle='#2f7a45';g.fillRect(x,y,1,6);g.fillRect(x+7,y,1,6);});
  // East River + bridge
  g.fillStyle='#16407a';g.fillRect(0,0,26,H);g.fillStyle='#0e2b55';g.fillRect(26,0,2,H);
  g.fillStyle='#7f8aa6';g.fillRect(0,58,38,4);g.fillStyle='#5b6582';g.fillRect(0,62,38,1);
  for(const tx of [6,18]){g.fillStyle='#a9b3cc';g.fillRect(tx,52,2,14);}
  g.fillStyle='#4b6b3a';g.fillRect(5,132,16,6);g.fillRect(7,131,12,8);g.fillStyle='#8f94ad';g.fillRect(10,124,6,8);g.fillStyle='#6c7088';g.fillRect(10,131,6,1);
  g.fillStyle='#d9dbe8';for(let x=0;x<38;x+=3)g.fillRect(x,59,1,1);
  // L train track
  g.fillStyle='#3a3358';g.fillRect(0,H-12,W,6);g.fillStyle='#6c6590';g.fillRect(0,H-11,W,1);g.fillRect(0,H-8,W,1);
  g.fillStyle='#55506e';for(let x=0;x<W;x+=4)g.fillRect(x,H-11,1,4);
  // walking path
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];g.fillStyle='#4a3f6b';g.fillRect(Math.min(a.x,b.x)-3,Math.min(a.y,b.y)-3,Math.abs(b.x-a.x)+6,Math.abs(b.y-a.y)+6);}
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],len=Math.abs(b.x-a.x)+Math.abs(b.y-a.y);for(let d=0;d<=len;d+=4){const f=len?d/len:0,x=Math.round(a.x+(b.x-a.x)*f),y=Math.round(a.y+(b.y-a.y)*f);g.fillStyle='#1a1430';g.fillRect(x-1,y-1,3,3);g.fillStyle='#f2d49b';g.fillRect(x,y,2,2);}}
})();

/* ---------- NYC & Americana props ---------- */
const CORNERS=[];for(let i=0;i<17;i++)for(let j=0;j<7;j++){const x=56+26*i,y=24+22*j;if(x<W-4&&y<H-16&&distToPath(x,y)>7&&distToNodes(x,y)>22)CORNERS.push({x,y});}
const pick=(arr,n,off)=>{const out=[];for(let k=0;k<n;k++){const it=arr[Math.floor((k+off)*arr.length/n)%arr.length];if(it)out.push(it);}return out;};
const STEAM=pick(CORNERS,3,0.2),CARTS=pick(CORNERS,2,0.55),CAT=pick(CORNERS,1,0.8)[0];
const FLAGS=pick(ROOFS.filter(r=>distToNodes(r.x+11,r.y+9)>26&&distToPath(r.x+11,r.y+9)>10),5,0.1);
const PIG=PARKS.filter(p=>distToNodes(p.x+11,p.y+9)>20)[2]||PARKS[0];
const TAXI=[];[23,67,111].forEach((y,k)=>{for(let n=0;n<3;n++)TAXI.push({h:true,y:y+(n%2?0:1),x:(n*170+k*60)%W,v:(k%2?-1:1)*(22+n*6)});});
[134,264,394].forEach((x,k)=>TAXI.push({h:false,x,y:(k*50)%H,v:(k%2?1:-1)*18}));
const LAND=W-24;function taxiX(c,t){return 24+(((c.x+t*c.v)%LAND)+LAND)%LAND;}
function drawTaxi(g,x,y,hz,dir){x=Math.round(x);y=Math.round(y);g.fillStyle='#0d0b1a';
  if(hz){g.fillRect(x-1,y-1,10,6);g.fillStyle='#ffd21f';g.fillRect(x,y,8,4);g.fillStyle='#2a3550';g.fillRect(x+2,y+1,4,2);g.fillStyle='#fff';g.fillRect(x+4,y,1,1);g.fillStyle='#111';g.fillRect(x+1,y+3,1,1);g.fillRect(x+3,y+3,1,1);g.fillRect(x+5,y+3,1,1);g.fillStyle='#fff7c0';g.fillRect(dir>0?x+7:x,y+1,1,2);}
  else{g.fillRect(x-1,y-1,6,10);g.fillStyle='#ffd21f';g.fillRect(x,y,4,8);g.fillStyle='#2a3550';g.fillRect(x+1,y+2,2,4);g.fillStyle='#fff';g.fillRect(x+1,y+4,1,1);g.fillStyle='#fff7c0';g.fillRect(x+1,dir>0?y+7:y,2,1);}}
function drawUSFlag(g,x,y,t,k){g.fillStyle='#d9dbe8';g.fillRect(x,y,1,9);
  for(let cx=0;cx<7;cx++){const off=Math.round(Math.sin(t*4+cx*0.9+k));for(let cy=0;cy<5;cy++){g.fillStyle=(cx<3&&cy<3)?((cx+cy)%2?'#ffffff':'#2a4fb8'):(cy%2?'#ffffff':'#e23b4e');g.fillRect(x+1+cx,y+cy+off,1,1);}}}
function drawProps(g,t){
  // flags on rooftops
  FLAGS.forEach((r,k)=>drawUSFlag(g,r.x+3+(k*5)%10,r.y+2,t,k));
  // manhole steam stacks
  STEAM.forEach((p,k)=>{g.fillStyle='#ff7a1a';g.fillRect(p.x-1,p.y-4,3,5);g.fillStyle='#fff';g.fillRect(p.x-1,p.y-3,3,1);g.fillRect(p.x-1,p.y-1,3,1);
    for(let q=0;q<4;q++){const ph=((t*0.6+q*0.25+k*0.13)%1),rr=1+Math.floor(ph*3),yy=p.y-6-ph*14;g.globalAlpha=0.55*(1-ph);g.fillStyle='#e8e8f0';g.fillRect(Math.round(p.x-rr+Math.sin(t+q)*2),Math.round(yy-rr),rr*2+1,rr*2);}g.globalAlpha=1;});
  // hot dog carts
  CARTS.forEach((p,k)=>{const x=p.x-4,y=p.y-3;g.fillStyle='#0d0b1a';g.fillRect(x-1,y-5,11,10);for(let c=0;c<9;c++){g.fillStyle=(c%2)?'#ffd21f':'#2a6fdb';g.fillRect(x+c,y-4,1,2);}g.fillStyle='#d9dbe8';g.fillRect(x+4,y-2,1,2);g.fillStyle='#c0c4d0';g.fillRect(x+1,y,7,3);g.fillStyle='#e23b4e';g.fillRect(x+2,y+1,3,1);g.fillStyle='#f2b35a';g.fillRect(x+2,y,3,1);g.fillStyle='#111';g.fillRect(x+1,y+3,2,1);g.fillRect(x+6,y+3,2,1);
    if(Math.floor(t*3+k)%2){g.fillStyle='rgba(255,255,255,.6)';g.fillRect(x+3,y-7,1,1);}});
  // bodega cat
  if(CAT){const x=CAT.x-2,y=CAT.y-2;g.fillStyle='#0d0b1a';g.fillRect(x-1,y-2,6,5);g.fillStyle='#f29a3a';g.fillRect(x,y,4,2);g.fillRect(x,y-1,2,1);g.fillStyle='#ffd9a0';g.fillRect(x,y-1,1,1);g.fillStyle='#f29a3a';g.fillRect(x+4,y-(Math.floor(t*2)%2),1,2);}
  // pigeons
  if(PIG){for(let k=0;k<7;k++){const fly=(t%9)>7||t<pigeonFlyUntil;const a=k*0.9+t*(fly?3:0.3);const x=PIG.x+11+Math.cos(a)*(fly?9:6+k%3),y=PIG.y+9+Math.sin(a)*(fly?6:4)-(fly?3:0);g.fillStyle='#9aa0b4';g.fillRect(Math.round(x),Math.round(y),2,1);g.fillStyle='#5a5f73';g.fillRect(Math.round(x)+(fly&&Math.floor(t*12+k)%2?0:1),Math.round(y)-1,1,1);}}
  // taxis
  TAXI.forEach(c=>{if(c.h){const x=taxiX(c,t);if(x>=30)drawTaxi(g,x,c.y,true,Math.sign(c.v));}else{const y=((c.y+t*c.v)%(H+20)+H+20)%(H+20)-10;if(y<H-18)drawTaxi(g,c.x,y,false,Math.sign(c.v));}});
  // pizza rat (scurries along a street every ~14s)
  const pr=(t%14)/14;if(pr<0.55){const x=W+10-pr/0.55*(W+30),y=89+1;g.fillStyle='#7d7f8f';g.fillRect(Math.round(x),y,4,2);g.fillStyle='#e8a0b0';g.fillRect(Math.round(x)+4,y+1,3,1);g.fillStyle='#ffcf5a';g.fillRect(Math.round(x)-3,y-2,3,1);g.fillRect(Math.round(x)-2,y-1,2,1);g.fillStyle='#e23b4e';g.fillRect(Math.round(x)-2,y-2,1,1);g.fillStyle='#111';g.fillRect(Math.round(x),y+(Math.floor(t*14)%2),1,1);}
  // Lady Liberty-style statue in the river
  const sx=13,sy=124;g.fillStyle='#0d0b1a';g.fillRect(sx-4,sy-21,10,21);g.fillStyle='#5fb59a';g.fillRect(sx-3,sy-14,7,14);g.fillRect(sx-2,sy-17,4,3);g.fillStyle='#4a9a82';g.fillRect(sx-3,sy-6,7,1);g.fillRect(sx-3,sy-10,1,8);
  g.fillStyle='#5fb59a';g.fillRect(sx-1,sy-18,3,1);g.fillRect(sx-2,sy-19,1,1);g.fillRect(sx+2,sy-19,1,1);g.fillRect(sx,sy-20,1,1);g.fillRect(sx+3,sy-20,1,7);g.fillStyle='#d9c37a';g.fillRect(sx-3,sy-11,2,3);
  g.fillStyle=(Math.floor(t*8)%2)?'#ffe14d':'#ffb02e';g.fillRect(sx+3,sy-22,1,2);g.fillStyle='#ff7a1a';g.fillRect(sx+2,sy-21,3,1);
  // bald eagle flyover (~every 18s)
  const ep=(t%18)/18;if(ep<0.4){const x=-20+ep/0.4*(W+40),y=18+Math.sin(ep*40)*3,up=Math.floor(t*6)%2;g.fillStyle='#5a3a22';g.fillRect(Math.round(x),Math.round(y),7,2);g.fillRect(Math.round(x)+2,Math.round(y)+(up?-3:2),3,up?3:2);g.fillRect(Math.round(x)-2,Math.round(y)+1,2,1);g.fillStyle='#fff';g.fillRect(Math.round(x)+7,Math.round(y)-1,2,2);g.fillRect(Math.round(x)-3,Math.round(y)+1,1,1);g.fillStyle='#ffd21f';g.fillRect(Math.round(x)+9,Math.round(y),1,1);}
}
let nextFW=1.5;
function fireworks(t){if(t<nextFW)return;nextFW=t+(party?0.35:1.6+Math.random()*1.8);const x=10+Math.random()*(W-20),y=8+Math.random()*30,cols=['#e23b4e','#ffffff','#2a6fdb','#ffe14d'];const c1=cols[Math.floor(Math.random()*4)],c2=cols[Math.floor(Math.random()*4)];for(let k=0;k<26;k++){const a=k/26*Math.PI*2,v=18+Math.random()*14;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:18,life:0.8+Math.random()*0.4,c:k%2?c1:c2});}}

/* ---------- EASTER EGGS ---------- */
let pigeonFlyUntil=0,party=false;
const EGGS=['rider','express','taxi','cat','cart','steam','statue','pigeons','rat','eagle','court','field','party'];
let foundSet=new Set(store.get('bq_eggs',[]));
function paintEggs(){const el=document.getElementById('eggs');if(el)el.textContent='🥚 SECRETS '+foundSet.size+'/'+EGGS.length;}
function found(n){if(!foundSet.has(n)){foundSet.add(n);store.set('bq_eggs',[...foundSet]);paintEggs();if(foundSet.size===EGGS.length)setTimeout(()=>{const rp=posAt(d);say('ALL SECRETS FOUND! YOU ARE A LEGEND',rp.x,rp.y-31);for(let k=0;k<6;k++)burst(40+Math.random()*(W-80),10+Math.random()*40);beep(SFX.win);},2700);}}
function burst(x,y){const cols=['#e23b4e','#ffffff','#2a6fdb','#ffe14d','#ff4fa3'];const c1=cols[Math.floor(Math.random()*5)],c2=cols[Math.floor(Math.random()*5)];for(let k=0;k<26;k++){const a=k/26*Math.PI*2,v=18+Math.random()*14;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:18,life:0.8+Math.random()*0.4,c:k%2?c1:c2});}}
function sparkle(x,y,c){for(let k=0;k<16;k++)parts.push({x,y,vx:(Math.random()-.5)*60,vy:-10-Math.random()*40,g:40,life:0.9,c});}
function togglePartyMode(){party=!party;riderShades=party;document.body.classList.toggle('party',party);ensureAudio();beep(SFX.party);const rp=posAt(d);say(party?'PARTY MODE: ON':'PARTY MODE: OFF',rp.x,rp.y-31);if(party){for(let k=0;k<5;k++)burst(30+Math.random()*(W-60),10+Math.random()*40);found('party');}}
function eggTap(wx,wy){
  const t=performance.now()/1000,near=(x,y,r)=>Math.hypot(x-wx,y-wy)<(r||7);ensureAudio();
  for(const i of [2,3,6]){const st=STOPS[i],ex=st.x-13,ey=st.y+7;if(near(ex,ey,7)){
    found('express');
    if(!moving&&cur<6){const nx=cur+1;beep([[523,.06],[784,.06],[1047,.06],[1568,.15]]);sparkle(ex,ey-4,'#3ddc84');d=nodeArc[nx];target=d;dest=nx;follow=true;if(typeof trail!=='undefined'){trail.length=0;snapFollowers=true;}arrive(nx);const np=posAt(d);say('EXPRESS TRAIN! SKIPPED THE WALK',np.x,np.y-31);}
    else say('STAND CLEAR OF THE CLOSING DOORS',ex,ey-6);return true;}}
  for(const c of TAXI){let cx,cy;if(c.h){cx=taxiX(c,t)+4;cy=c.y+2;if(cx<34)continue;}else{cy=((c.y+t*c.v)%(H+20)+H+20)%(H+20)-10+4;cx=c.x+2;}
    if(near(cx,cy,6)){beep(SFX.honk);say("HEY! I'M WALKIN' HERE!",cx,cy-5);found('taxi');return true;}}
  if(CAT&&near(CAT.x,CAT.y-1,6)){say('MEOW. BUY SOMETHING OR LEAVE.',CAT.x,CAT.y-5);for(let k=0;k<8;k++)parts.push({x:CAT.x,y:CAT.y-4,vx:(Math.random()-.5)*20,vy:-12-Math.random()*12,g:0,life:1.1,c:'#ff4fa3'});beep([[1319,.05],[1175,.12]]);found('cat');return true;}
  for(const p of CARTS){if(near(p.x,p.y-4,7)){say('TWO DOGS, EVERYTHING ON IT. $4.',p.x,p.y-9);beep([[440,.06],[660,.1]]);found('cart');return true;}}
  for(const p of STEAM){if(near(p.x,p.y-6,7)){say('PSSSHHH... IS THAT SAFE?',p.x,p.y-12);for(let k=0;k<10;k++)parts.push({x:p.x,y:p.y-6,vx:(Math.random()-.5)*20,vy:-25-Math.random()*20,g:0,life:1,c:'#e8e8f0'});found('steam');return true;}}
  if(near(13,112,10)){say('GIVE ME YOUR THIRSTY MASSES',14,100);sparkle(16,102,'#ffe14d');beep([[523,.1],[659,.1],[784,.2]]);found('statue');return true;}
  if(PIG&&near(PIG.x+11,PIG.y+9,11)){pigeonFlyUntil=t+2.5;say('COO! COO!',PIG.x+11,PIG.y);beep([[700,.04],[600,.04],[700,.04]]);found('pigeons');return true;}
  const pr=(t%14)/14;if(pr<0.55){const rx=W+10-pr/0.55*(W+30);if(near(rx,90,7)){say('THIS SLICE IS MINE.',rx,84);beep([[1568,.04],[1760,.04]]);found('rat');return true;}}
  const ep=(t%18)/18;if(ep<0.4){const ex=-20+ep/0.4*(W+40)+3,ey=18+Math.sin(ep*40)*3;if(near(ex,ey,9)){say('FREEDOM!!!',ex,ey+12);burst(ex,ey);burst(ex+20,ey+10);beep(SFX.win);found('eagle');return true;}}
  if(COURT&&near(COURT.x+11,COURT.y+9,11)){say('SWISH! NOTHING BUT NET',COURT.x+11,COURT.y);sparkle(COURT.x+11,COURT.y+9,'#ff7a1a');beep([[880,.05],[1320,.15]]);found('court');return true;}
  if(FIELD&&near(FIELD.x+11,FIELD.y+9,11)){say('HOME RUN! THE CROWD GOES WILD',FIELD.x+11,FIELD.y);burst(FIELD.x+11,FIELD.y-6);beep(SFX.win);found('field');return true;}
  return false;
}
/* live tracker: where should the crew be right now? */
function nyMinutes(){try{const p={};new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date()).forEach(x=>p[x.type]=+x.value);return(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute)-Date.UTC(2026,10,28,19,0))/60000;}catch(e){return null;}}
const SCHED=[0,45,90,150,210,255,300];
function paintLive(){const el=document.getElementById('live');if(!el)return;const m=nyMinutes();if(m===null){el.hidden=true;return;}el.hidden=false;
  if(m<0){const dd=Math.floor(-m/1440),hh=Math.floor((-m%1440)/60),mm=Math.floor(-m%60);el.textContent='⏳ QUEST STARTS IN '+(dd?dd+'D ':'')+hh+'H '+mm+'M';}
  else if(m<540){let i=0;for(let k=0;k<SCHED.length;k++)if(m>=SCHED[k])i=k;el.textContent='● LIVE · YOU SHOULD BE AT: '+STOPS[i].n;el.classList.add('on');}
  else{el.textContent='★ QUEST COMPLETE · SEE YOU NEXT YEAR';}}
console.log('%c BIRTHDAY QUEST ','font:bold 18px monospace;color:#000;background:#ffe14d;padding:4px','\nYou found the console. Try the classic cheat code on the map: up up down down left right left right B A');

/* ---------- state ---------- */
let cur=Math.max(0,Math.min(6,store.get('bq_cur',0)));
let maxR=Math.max(cur,Math.min(6,store.get('bq_max',0)));
let d=nodeArc[cur],target=d,dest=cur,moving=false,facing=1,ph=0;
let camX=0,follow=true,viewW=W,s=3,offX=0,dpr=1;
const parts=[];let bubbleUntil=0,bubble=null;
function say(txt,wx,wy){bubble={txt,wx,wy};bubbleUntil=performance.now()+2600;}
function drawBubble(c,txt,x,y,k){
  c.save();c.font=Math.round(8*k)+'px "Press Start 2P", monospace';c.textBaseline='middle';
  const pad=7*k,tw=c.measureText(txt).width,bw=tw+pad*2,bh=24*k;
  let bx=Math.max(4*k,Math.min(c.canvas.width-bw-4*k,x-bw/2)),by=Math.max(4*k,y-bh-10*k);
  c.fillStyle='#000';c.fillRect(bx-3*k,by-3*k,bw+6*k,bh+6*k);
  c.fillStyle='#fff';c.fillRect(bx,by,bw,bh);
  const tx=Math.max(bx+6*k,Math.min(bx+bw-12*k,x-3*k));
  c.fillStyle='#000';c.fillRect(tx-2*k,by+bh,10*k,5*k);c.fillRect(tx,by+bh+5*k,6*k,4*k);
  c.fillStyle='#fff';c.fillRect(tx,by+bh,6*k,3*k);c.fillRect(tx+1*k,by+bh+3*k,3*k,3*k);
  c.fillStyle='#000';c.fillText(txt,bx+pad,by+bh/2+1*k);c.restore();
}

const fb=document.createElement('canvas');fb.width=W;fb.height=H;const f=fb.getContext('2d');
const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),stage=document.getElementById('stage');
function resize(){dpr=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(stage.clientWidth*dpr);cv.height=Math.round(stage.clientHeight*dpr);s=cv.height/H;viewW=cv.width/s;camX=clampCam(posAt(d).x-viewW/2);}
const clampCam=x=>viewW>=W?0:Math.max(0,Math.min(W-viewW,x));
addEventListener('resize',resize);

/* ---------- drawing ---------- */
function drawFlag(g,x,top,i,t){
  g.fillStyle='#cfd3e0';g.fillRect(x,top,1,12);
  g.fillStyle='#0d0b1a';g.fillRect(x+1,top-1,9,9);
  g.fillStyle=i<=maxR?'#ffe14d':STOPS[i].col;g.fillRect(x+1,top,8,7);
  ptext(g,String(i+1),x+4,top+1,'#000');
}
function drawBar(g,i,t){
  const st=STOPS[i],w=18,h=16,bx=st.x-9,by=st.y-h;
  g.fillStyle='#0d0b1a';g.fillRect(bx-1,by-1,w+2,h+2);
  g.fillStyle='#4a3b78';g.fillRect(bx,by,w,h);
  g.fillStyle='#3a2d62';for(let y=by+5;y<by+h;y+=3)g.fillRect(bx,y,w,1);
  g.fillStyle=st.col;g.fillRect(bx,by,w,3);
  g.fillStyle='rgba(255,255,255,.4)';for(let k=0;k<w;k+=4)g.fillRect(bx+k,by+2,2,1);
  g.fillStyle=(Math.floor(t*3+i)%3)?st.col:'#2a2142';g.fillRect(bx+5,by+4,8,1);
  const lit=Math.sin(t*2+i*1.7)>-0.7;g.fillStyle=lit?'#ffd75e':'#6a5a2a';g.fillRect(bx+2,by+7,4,3);g.fillRect(bx+12,by+7,4,3);
  g.fillStyle=i===cur&&!moving?'#ffe9a8':'#1a1430';g.fillRect(bx+7,by+h-7,4,7);
  drawFlag(g,bx-10,by-10,i,t);
}
function drawCastle(g,i,t){
  const st=STOPS[i],w=28,h=22,bx=st.x-14,by=st.y-h;
  for(let k=0;k<3;k++){const a=-Math.PI/2+Math.sin(t*1.4+k*2.1)*0.75;g.globalAlpha=0.35;g.fillStyle=['#ff4fa3','#18d6c0','#ffe14d'][k];for(let rr=6;rr<34;rr++)g.fillRect(Math.round(st.x+Math.cos(a)*rr),Math.round(by+Math.sin(a)*rr),1,1);g.globalAlpha=1;}
  g.fillStyle='#0d0b1a';g.fillRect(bx-1,by-3,w+2,h+3);g.fillRect(bx-4,by-11,9,h+11);g.fillRect(bx+w-5,by-11,9,h+11);
  g.fillStyle='#5a3fa6';g.fillRect(bx,by,w,h);
  for(let x=bx;x<bx+w;x+=4){g.fillRect(x,by-2,2,2);}
  g.fillStyle='#4a3290';for(let y=by+3;y<by+h;y+=4)g.fillRect(bx,y,w,1);
  for(const tx of [bx-3,bx+w-4]){g.fillStyle='#6d52c0';g.fillRect(tx,by-6,7,h+6);g.fillStyle='#ff4fa3';g.fillRect(tx,by-8,7,2);g.fillRect(tx+1,by-9,5,1);g.fillRect(tx+3,by-10,1,1);}
  const dc=['#ff4fa3','#18d6c0','#ffe14d','#8a6bff','#7bd34a'];
  [[bx+5,by+4],[bx+w-9,by+4],[bx+5,by+11],[bx+w-9,by+11]].forEach(([x,y],k)=>{g.fillStyle=dc[(Math.floor(t*5)+k)%dc.length];g.fillRect(x,y,4,4);});
  g.fillStyle='#0d0b1a';g.fillRect(st.x-4,by+h-10,8,10);g.fillRect(st.x-3,by+h-11,6,1);
  g.fillStyle=dc[Math.floor(t*4)%dc.length];g.fillRect(st.x-2,by+h-8,4,8);
  g.fillStyle='#ffe14d';g.fillRect(bx+11,by+1,6,1);
  drawFlag(g,bx-14,by-14,i,t);
}
function render(t){
  f.drawImage(bg,0,0);
  f.fillStyle='#5f8fd6';for(let k=0;k<18;k++){const x=2+(k*7)%22,y=Math.floor((k*37+t*8)%H);f.fillRect(x,y,3,1);}
  const tx=Math.round(((t*45)%(W+160))-80);
  f.fillStyle='#c7cbd6';f.fillRect(tx,H-14,34,6);f.fillStyle='#9aa0b4';f.fillRect(tx,H-9,34,1);
  f.fillStyle='#ffd75e';for(let x=tx+3;x<tx+31;x+=5)f.fillRect(x,H-13,3,2);
  f.fillStyle='#e14b4b';f.fillRect(tx+33,H-14,2,6);
  drawProps(f,t);fireworks(t);
  if(party){for(let i=1;i<pts.length;i++){const a=pts[i-1],b2=pts[i],len=Math.abs(b2.x-a.x)+Math.abs(b2.y-a.y);for(let q=0;q<=len;q+=4){const fr=len?q/len:0;f.fillStyle='hsl('+Math.floor((cum[i-1]+q)*3+t*300)%360+',100%,60%)';f.fillRect(Math.round(a.x+(b2.x-a.x)*fr),Math.round(a.y+(b2.y-a.y)*fr),2,2);}}}
  STOPS.forEach((st,i)=>st.boss?drawCastle(f,i,t):drawBar(f,i,t));
  if(!moving&&cur<6){const n=STOPS[cur+1],top=n.boss?n.y-22-14:n.y-16-10,ax=(n.boss?n.x-12:n.x-8),ay=top-9+(Math.floor(t*4)%2);
    f.fillStyle='#000';f.fillRect(ax-1,ay-1,7,5);f.fillStyle='#ffe14d';f.fillRect(ax,ay,5,1);f.fillRect(ax+1,ay+1,3,1);f.fillRect(ax+2,ay+2,1,1);}
  if(typeof drawFollowers==='function')drawFollowers(f);
  const rp=posAt(d);
  f.fillStyle='rgba(0,0,0,.4)';f.fillRect(Math.round(rp.x)-10,Math.round(rp.y)+1,20,1);
  drawRider(f,Math.round(rp.x),Math.round(rp.y)-(moving&&Math.floor(ph*1.5)%2?1:0)-(typeof hopFor==='function'?hopFor('rider'):0),ph,facing<0);
  if(typeof drawDrinkAnims==='function')drawDrinkAnims(f);
  for(let k=parts.length-1;k>=0;k--){const p=parts[k];p.life-=1/60;p.x+=p.vx/60;p.y+=p.vy/60;p.vy+=p.g/60;
    if(p.life<=0){parts.splice(k,1);continue;}
    if(p.txt)ptext(f,p.txt,Math.round(p.x),Math.round(p.y),(Math.floor(p.life*10)%2)?'#ffe14d':'#fff');else{f.fillStyle=p.c;f.fillRect(Math.round(p.x),Math.round(p.y),1,1);}}
  ctx.imageSmoothingEnabled=false;ctx.fillStyle='#0b0a18';ctx.fillRect(0,0,cv.width,cv.height);
  if(viewW>=W){offX=Math.round((cv.width-W*s)/2);ctx.drawImage(fb,0,0,W,H,offX,0,W*s,H*s);}
  else{offX=0;ctx.drawImage(fb,camX,0,viewW,H,0,0,cv.width,cv.height);}
  ctx.font=Math.round(7*dpr)+'px "Press Start 2P", monospace';ctx.textBaseline='top';
  [["WILLIAMSBURG",72,4],["BUSHWICK",300,4]].forEach(([txt,wx,wy])=>{const sx=(wx-(viewW>=W?0:camX))*s+offX,sy=wy*s;const tw=ctx.measureText(txt).width;ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(sx-4*dpr,sy-3*dpr,tw+8*dpr,13*dpr);ctx.fillStyle='#ffe14d';ctx.fillText(txt,sx,sy);});
  if(typeof drawNames==='function')drawNames();
  if(bubble&&performance.now()<bubbleUntil){drawBubble(ctx,bubble.txt,(bubble.wx-(viewW>=W?0:camX))*s+offX,bubble.wy*s,dpr);}
  ctx.save();const rx=(13-(viewW>=W?0:camX))*s+offX;ctx.translate(rx,H*s*0.62);ctx.rotate(-Math.PI/2);ctx.fillStyle='rgba(200,220,255,.75)';ctx.fillText('EAST RIVER',0,-3*dpr);ctx.restore();
}

/* ---------- logic ---------- */
function update(dt){
  if(typeof updateFollowers==='function')updateFollowers(dt);
  if(moving){
    const before=posAt(d),dir=Math.sign(target-d),step=Math.min(Math.abs(target-d),75*dt);
    d+=dir*step;ph+=step*0.45;
    const after=posAt(d);if(Math.abs(after.x-before.x)>0.01)facing=after.x>before.x?1:-1;
    if(Math.abs(target-d)<0.001){d=target;moving=false;arrive(dest);}
  }
  if(follow){const tx=clampCam(posAt(d).x-viewW/2);camX+=(tx-camX)*Math.min(1,dt*5);}
}
function goTo(i){
  i=Math.max(0,Math.min(6,i));ensureAudio();follow=true;
  if(i===cur&&!moving){show(i);return;}
  dest=i;target=nodeArc[i];moving=true;beep(SFX.go);
  document.getElementById('dTag').textContent='▶ RIDING TO STAGE 1-'+(i+1)+'…';
}
const GUIDE=window.ROUTE.guide;
function arrive(i){
  cur=i;maxR=Math.max(maxR,i);store.set('bq_cur',cur);store.set('bq_max',maxR);
  const rp=posAt(d);
  if(STOPS[i].boss&&window.BQMusic)BQMusic.stinger('clear');
  if(STOPS[i].boss){if(!store.get('bq_clear',false)){store.set('bq_clear',true);setTimeout(()=>{$('clear').hidden=false;},1400);}beep(SFX.win);for(let k=0;k<70;k++)parts.push({x:rp.x,y:rp.y-20,vx:(Math.random()-.5)*90,vy:-30-Math.random()*70,g:80,life:1.6+Math.random(),c:['#ff4fa3','#ffe14d','#18d6c0','#fff','#8a6bff'][k%5]});}
  else{beep(SFX.coin);parts.push({txt:'+1',x:rp.x-3,y:rp.y-40,vx:0,vy:-14,g:0,life:1.1});for(let k=0;k<14;k++)parts.push({x:rp.x,y:rp.y-26,vx:(Math.random()-.5)*50,vy:-20-Math.random()*40,g:90,life:0.9,c:STOPS[i].col});}
  show(i);
  setTimeout(()=>{const rp=posAt(d);if(!moving&&cur===i)say('🎩 '+GUIDE[i],rp.x,rp.y-36);},STOPS[i].boss?1500:1300);
}
const $=id=>document.getElementById(id);
function show(i){
  const st=STOPS[i];
  $('dTag').textContent=st.boss?'★ FINAL STAGE · 7/7 ★':'STAGE 1-'+(i+1)+' · '+(i+1)+'/7';
  $('dName').textContent=st.n;$('dTime').textContent=st.t;$('dAddr').textContent=st.a.toUpperCase();
  $('dNote').textContent=st.note.toUpperCase();$('dLeg').textContent=st.leg;
  $('dir').href=gmaps(st);$('prev').disabled=i===0;
  $('next').disabled=false;$('next').textContent=i===6?'★ CLEAR ★':'NEXT ▶';$('next').title=i===6?'Reset the game and start over':'';
  if(window.BQMusic&&!window.MAP_LOCKED)BQMusic.play(i>=5?'boss':'shuffle');
  if(typeof paintDrinkUI==='function'){$('drinkBox').hidden=true;paintDrinkUI();}
  $('hW').textContent='1-'+(i+1);$('hT').textContent=st.t;$('hD').textContent='🍺×'+Math.min(maxR+1,6);
  renderList();
}
function renderList(){
  const ol=$('list');ol.innerHTML='';
  STOPS.forEach((st,i)=>{const li=document.createElement('li'),b=document.createElement('button');
    b.type='button';b.className='row'+(i===cur?' cur':'');
    b.innerHTML='<span class="num" style="background:'+(i<=maxR?'#ffe14d':st.col)+'">'+(i+1)+'</span><span>'+(st.boss?'👑 ':'')+st.n+(i<=maxR?' ✓':'')+'</span><span class="t">'+st.t+'</span>';
    b.onclick=()=>{goTo(i);stage.scrollIntoView({behavior:'smooth',block:'center'});};li.appendChild(b);ol.appendChild(li);});
}
$('prev').onclick=()=>goTo((moving?dest:cur)-1);
$('next').onclick=()=>{if(!moving&&cur===6){resetGame(true);return;}goTo((moving?dest:cur)+1);};
function resetGame(fx){if(typeof trail!=='undefined'){trail.length=0;snapFollowers=true;}store.set('bq_clear',false);$('clear').hidden=true;maxR=0;store.set('bq_max',0);d=nodeArc[0];target=d;dest=0;moving=false;cur=0;store.set('bq_cur',0);follow=true;show(0);
  if(fx){const rp=posAt(d);ensureAudio();beep([[1568,.06],[1047,.06],[784,.06],[523,.06],[784,.06],[1047,.2]]);sparkle(rp.x,rp.y-15,'#ffe14d');sparkle(rp.x,rp.y-15,'#ff4fa3');say('NEW GAME! PRESS NEXT TO START',rp.x,rp.y-31);stage.scrollIntoView({behavior:'smooth',block:'center'});}}
$('reset').onclick=()=>resetGame(true);
const KONAMI=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];let kpos=0;
addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;kpos=(k===KONAMI[kpos])?kpos+1:(k===KONAMI[0]?1:0);if(kpos===KONAMI.length){kpos=0;togglePartyMode();}});
let hudTaps=[];$('hD').parentElement.addEventListener('click',()=>{const n=performance.now();hudTaps=hudTaps.filter(x=>n-x<2500);hudTaps.push(n);if(hudTaps.length>=5){hudTaps=[];togglePartyMode();}});
$('clearBtn').onclick=()=>{$('clear').hidden=true;};
addEventListener('keydown',e=>{if(e.key==='ArrowRight')goTo((moving?dest:cur)+1);if(e.key==='ArrowLeft')goTo((moving?dest:cur)-1);});

/* drag to pan, tap a flag/building to travel */
let down=null;
cv.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,cam:camX,drag:false};cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-down.x;if(Math.abs(dx)>6)down.drag=true;if(down.drag&&viewW<W){follow=false;camX=clampCam(down.cam-dx/(s/dpr));}});
cv.addEventListener('pointerup',e=>{if(!down)return;const wasDrag=down.drag;down=null;if(wasDrag)return;
  const rect=cv.getBoundingClientRect(),cx=(e.clientX-rect.left)*dpr,cy=(e.clientY-rect.top)*dpr;
  const wx=viewW>=W?(cx-offX)/s:camX+cx/s,wy=cy/s;
  if(eggTap(wx,wy))return;
  const rp=posAt(d);if(Math.abs(rp.x-wx)<14&&wy<rp.y+3&&wy>rp.y-32){say(SAY_LINE,rp.x,rp.y-31);found('rider');ensureAudio();beep([[660,.05],[880,.05],[660,.05],[990,.08]]);return;}
  let best=-1,bd=1e9;STOPS.forEach((st,i)=>{const dd=Math.min(Math.hypot(st.x-wx,st.y-10-wy),Math.hypot(st.ax-wx,st.gy-12-wy));if(dd<bd){bd=dd;best=i;}});
  if(bd<22)goTo(best);});
cv.addEventListener('pointercancel',()=>down=null);

/* ---------- live party on the map ---------- */
let PARTY=[],refreshed=false;const trail=[];let snapFollowers=true;const FOLS=new Map();
(function(){const m=location.search.match(/[?&]host=([^&]+)/);if(m){try{localStorage.setItem('bq_admin',decodeURIComponent(m[1]));}catch(e){}}})();
function updateFollowers(dt){
  const rp=posAt(d),last=trail[trail.length-1];
  if(!last||Math.hypot(rp.x-last.x,rp.y-last.y)>=1){trail.push({x:rp.x,y:rp.y});if(trail.length>3000)trail.splice(0,1000);}
  PARTY.forEach((pl,k)=>{let f=FOLS.get(pl.id);if(!f){f={x:0,y:0,ph:0,flip:false,mv:false,init:false};FOLS.set(pl.id,f);}
    const idx=trail.length-1-(k+1)*13;let tx,ty;
    if(idx>=0){tx=trail[idx].x;ty=trail[idx].y;}else{tx=rp.x+(k%2?1:-1)*(13+Math.floor(k/2)*8);ty=rp.y+1+(k%3)*2;}
    tx=Math.max(30,Math.min(W-6,tx));
    if(!f.init||snapFollowers){f.x=tx;f.y=ty;f.init=true;}
    const dx=tx-f.x,dy=ty-f.y,dist=Math.hypot(dx,dy),step=Math.min(dist,95*dt);
    if(dist>0.2){f.x+=dx/dist*step;f.y+=dy/dist*step;f.ph+=step*0.22;if(Math.abs(dx)>0.05)f.flip=dx<0;f.mv=true;}else f.mv=false;});
  snapFollowers=false;}
const DANIM=[];
function drawGlass2x(g,type,cx,bottom){const s=GLASS[type]||GLASS.other,w=s[0].length*2,h=s.length*2,x=Math.round(cx-w/2),y=Math.round(bottom-h);
  g.fillStyle='rgba(0,0,0,.6)';g.fillRect(x-2,y-2,w+4,h+4);s.forEach((row,r)=>{for(let c=0;c<row.length;c++){const k=row[c];if(k!=='.'){g.fillStyle=GLASS_COL[k];g.fillRect(x+c*2,y+r*2,2,2);}}});}
function hopFor(pid){const now=performance.now()/1000;let h=0;for(const a of DANIM){const e=now-a.t0;if(a.pid===pid&&e<1.4)h=Math.max(h,Math.round(Math.abs(Math.sin(e*9))*6*(1-e/1.4)));}return h;}
function animPos(pid){if(pid==='rider'){const rp=posAt(d);return{x:rp.x+1,y:rp.y-31};}const f=FOLS.get(pid);if(!f||!f.init)return null;const pl=PARTY.find(p=>p.id===pid);return{x:f.x,y:f.y-((pl&&pl.h.length===384)?26:22)};}
function startDrinkAnim(dr){const pos=animPos(dr.pid);DANIM.push({pid:dr.pid,type:dr.type,t0:performance.now()/1000});
  if(pos){sparkle(pos.x,pos.y,'#ffe14d');sparkle(pos.x,pos.y,'#3ddc84');const who=dr.pid==='rider'?'THE MAYOR':((PARTY.find(p=>p.id===dr.pid)||{}).n||'');
    const t=$('drinkToast');t.textContent='🥂 +1 '+(DRINK_NAMES[dr.type]||'DRINK')+(dr.label?': '+dr.label:'')+(who?' · '+who:'');t.hidden=false;t.classList.remove('pop');void t.offsetWidth;t.classList.add('pop');
    clearTimeout(window._dtoast);window._dtoast=setTimeout(()=>{t.hidden=true;},2800);
    follow=false;camX=clampCam(pos.x-viewW/2);clearTimeout(window._dfollow);window._dfollow=setTimeout(()=>{follow=true;},2600);}
  if(typeof beep==='function'){ensureAudio();beep([[784,.06],[988,.06],[1319,.06],[1568,.2]]);}}
function drawDrinkAnims(g){const now=performance.now()/1000;for(let k=DANIM.length-1;k>=0;k--){const a=DANIM[k],e=now-a.t0;if(e>2.4){DANIM.splice(k,1);continue;}
  const pos=animPos(a.pid);if(!pos)continue;const rise=Math.min(e,0.5)*12,bottom=pos.y-7-rise;
  const sp=GLASS[a.type]||GLASS.other,gw=sp[0].length*2,gh=sp.length*2;let cx=pos.x,bt=bottom;
  if(bt-gh<3){ /* tight spot at the top edge: a smaller glass, still straight above this player's head */
    const sw=sp[0].length,sh=sp.length,b1=Math.max(sh+2,pos.y-7-Math.min(e,0.5)*4);drawGlass(g,a.type,Math.round(pos.x-sw/2),Math.round(b1-sh));
    ptext(g,'+1',Math.round(pos.x+sw/2+2),Math.round(b1-sh),(Math.floor(e*8)%2)?'#ffe14d':'#fff');continue;}
  drawGlass2x(g,a.type,cx,bt);ptext(g,'+1',Math.round(cx+gw/2+3),Math.round(bt-gh+1),(Math.floor(e*8)%2)?'#ffe14d':'#fff');}}
function drawFollowers(g){PARTY.forEach(pl=>{const f=FOLS.get(pl.id);if(f&&f.init)drawWalker(g,f.x,f.y-hopFor(pl.id),pl,f.ph,f.flip,f.mv||hopFor(pl.id)>0);});}
function drawNames(){ctx.save();ctx.font=Math.round(5*dpr)+'px "Press Start 2P", monospace';ctx.textBaseline='top';ctx.textAlign='center';
  {const rp=posAt(d),sx=(rp.x-(viewW>=W?0:camX))*s+offX,sy=(rp.y-37)*s,t='🎩 THE MAYOR',tw=ctx.measureText(t).width;ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(sx-tw/2-3*dpr,sy-2*dpr,tw+6*dpr,9*dpr);ctx.fillStyle='#ffe14d';ctx.fillText(t,sx,sy);}
  ctx.restore();if(!PARTY.length)return;ctx.save();ctx.font=Math.round(5*dpr)+'px "Press Start 2P", monospace';ctx.textBaseline='top';ctx.textAlign='center';
  PARTY.forEach(pl=>{const f=FOLS.get(pl.id);if(!f||!f.init)return;const sx=(f.x-(viewW>=W?0:camX))*s+offX,sy=(f.y-(pl.h.length===384?31:27))*s;if(sx<-60||sx>cv.width+60)return;
    const tw=ctx.measureText(pl.n).width;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(sx-tw/2-3*dpr,sy-2*dpr,tw+6*dpr,9*dpr);ctx.fillStyle='#fff';ctx.fillText(pl.n,sx,sy);});ctx.restore();}
function renderParty(){
  const n=PARTY.length+1,own=Party.owned(),admin=!!Party.admin()&&(window.HOST_MODE||!Party.live);
  $('pCount').textContent=n;$('cPlayers').textContent=n;
  $('cNames').textContent=['THE MAYOR (CITY GUIDE)'].concat(PARTY.map(p=>p.n)).join(', ');
  $('hostRow').hidden=!(admin||window.HOST_MODE||!Party.live);
  const st=$('pStatus');st.textContent=Party.live?'● LIVE · NEW PLAYERS SHOW UP HERE AUTOMATICALLY':'OFFLINE MODE · PLAYERS ARE ONLY SAVED ON THIS PHONE UNTIL THE PARTY DATABASE IS SET UP';st.classList.toggle('on',Party.live);
  const mine=PARTY.some(p=>own[p.id]);$('pJoin').textContent=mine?'+ ADD SOMEONE ELSE':'+ JOIN THE PARTY';
  const ol=$('pList');ol.textContent='';
  {const li=document.createElement('li'),row=document.createElement('div');row.className='prow2';
    const c=document.createElement('canvas');c.width=26;c.height=33;drawRider(c.getContext('2d'),12,32,0.6,false);c.style.height='50px';
    const md=(Party.drinks||[]).filter(x=>x.pid==='rider').length,nm=document.createElement('span');nm.textContent='1. THE MAYOR · CITY GUIDE'+(md?'  🍹×'+md:'');
    const tag=document.createElement('span');tag.className='t';tag.textContent='🎩 GUIDE';row.append(c,nm,tag);li.appendChild(row);ol.appendChild(li);}
  if(!PARTY.length){const li=document.createElement('li');li.className='small';li.textContent='NO ONE HAS JOINED YET. SEND THE INVITE LINK TO THE GROUP!';ol.appendChild(li);}
  PARTY.forEach((pl,i)=>{const li=document.createElement('li'),row=document.createElement('div');row.className='prow2';
    const c=document.createElement('canvas');c.width=26;c.height=27;drawWalker(c.getContext('2d'),13,26,pl,0,false,false);
    const dn=(Party.drinks||[]).filter(x=>x.pid===pl.id).length;
    const nm=document.createElement('span');nm.textContent=(i+2)+'. '+pl.n+(own[pl.id]?' (YOU)':'')+(dn?'  🍹×'+dn:'');
    const ctl=document.createElement('span');ctl.className='pctl';
    if(own[pl.id]){const e=document.createElement('a');e.href='join.html?id='+encodeURIComponent(pl.id);e.textContent='EDIT';ctl.appendChild(e);}
    if(own[pl.id]||admin){const x=document.createElement('button');x.type='button';x.textContent='✕';x.setAttribute('aria-label','Remove '+pl.n);
      x.onclick=async()=>{if(x.dataset.sure!=='1'){x.dataset.sure='1';x.textContent='SURE?';setTimeout(()=>{x.dataset.sure='';x.textContent='✕';},2500);return;}
        try{await Party.remove(pl.id);await refreshParty();}catch(err){x.textContent='ERROR';}};ctl.appendChild(x);}
    row.append(c,nm,ctl);li.appendChild(row);ol.appendChild(li);});}
const SEEN_DRINKS=new Set();let drinkType='';
function myPids(){const own=Party.owned();const ids=PARTY.filter(p=>own[p.id]).map(p=>({id:p.id,n:p.n}));if(window.HOST_MODE)ids.unshift({id:'rider',n:'THE MAYOR (CITY GUIDE)'});return ids;}
function paintDrinkUI(){const can=!window.MAP_LOCKED&&myPids().length>0;$('drinkBtn').hidden=!can||!$('drinkBox').hidden;
  const mine=new Set(myPids().map(x=>x.id)),total=(Party.drinks||[]).filter(x=>mine.has(x.pid)).length;if(mine.size)$('hD').textContent='🍹×'+total;}
function openDrinkBox(){const who=$('dWho');who.textContent='';myPids().forEach(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.n;who.appendChild(o);});
  drinkType='';[...$('dTypes').children].forEach(b=>b.classList.remove('on'));$('dLabel').value='';$('dTitle').textContent='LOG A DRINK · '+STOPS[cur].n;
  $('dMsg').textContent='LOG EVERY DRINK. MORE THAN ONE PER BAR IS FINE!';paintDrinkLog();$('drinkBox').hidden=false;$('drinkBtn').hidden=true;}
function paintDrinkLog(){const ul=$('dLog');ul.textContent='';const names={rider:'THE MAYOR'};PARTY.forEach(p=>names[p.id]=p.n);
  (Party.drinks||[]).filter(x=>x.stop===cur).slice(-8).forEach(x=>{const li=document.createElement('li');li.textContent='• '+(names[x.pid]||'?')+': '+(DRINK_NAMES[x.type]||'DRINK')+(x.label?' ('+x.label+')':'');ul.appendChild(li);});
  if(!ul.children.length){const li=document.createElement('li');li.textContent='NO DRINKS LOGGED HERE YET.';ul.appendChild(li);}}
async function refreshParty(){
  const prev=new Set(PARTY.map(p=>p.id));await Party.load();
  await Party.loadDrinks();
  const newDrinks=(Party.drinks||[]).filter(x=>!SEEN_DRINKS.has(x.id));newDrinks.forEach(x=>SEEN_DRINKS.add(x.id));
  const newbies=Party.players.filter(p=>!prev.has(p.id));PARTY=Party.players;renderParty();paintDrinkUI();
  if(refreshed)newDrinks.filter(x=>!x._mine).slice(-3).forEach((x,k)=>setTimeout(()=>startDrinkAnim(x),k*900));
  if(refreshed&&newbies.length){const rp=posAt(d);say(newbies[newbies.length-1].n+' JOINED THE PARTY!',rp.x,rp.y-31);sparkle(rp.x,rp.y-15,'#ffe14d');beep(SFX.coin);}
  if(!refreshed&&/[?&]joined=/.test(location.search)){const own=Party.owned(),me=PARTY.filter(p=>own[p.id]).pop();if(me){const rp=posAt(d);say('WELCOME, '+me.n+'!',rp.x,rp.y-31);setTimeout(()=>{for(let k=0;k<4;k++)burst(40+Math.random()*(W-80),10+Math.random()*40);},300);}}
  refreshed=true;}
$('pShare').onclick=async()=>{const txt=new URL('index.html',location.href).href;
  try{await navigator.clipboard.writeText(txt);$('pShare').textContent='✓ LINK COPIED';setTimeout(()=>$('pShare').textContent='🔗 COPY INVITE LINK',2000);}
  catch(e){const inp=$('pLink');inp.hidden=false;inp.value=txt;inp.select();$('pShare').textContent='COPY THE LINK BELOW';}};
$('pResetWorld').onclick=async()=>{const b=$('pResetWorld');
  if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='TAP AGAIN TO WIPE THE WHOLE PARTY';setTimeout(()=>{b.dataset.sure='';b.textContent='☠ RESET WORLD (REMOVE EVERYONE)';},3000);return;}
  b.dataset.sure='';b.textContent='RESETTING…';
  try{await Party.resetAll();FOLS.clear();trail.length=0;snapFollowers=true;await refreshParty();resetGame(true);b.textContent='✓ WORLD RESET';}
  catch(e){b.textContent=e.message==='host-only'?'HOST KEY NEEDED (SEE PARTY_ADMIN_KEY)':'RESET FAILED, TRY AGAIN';}
  setTimeout(()=>{b.textContent='☠ RESET WORLD (REMOVE EVERYONE)';},3000);};
$('drinkBtn').onclick=openDrinkBox;
$('dCancel').onclick=()=>{$('drinkBox').hidden=true;paintDrinkUI();};
[...$('dTypes').children].forEach(b=>b.onclick=()=>{drinkType=b.dataset.t;[...$('dTypes').children].forEach(x=>x.classList.toggle('on',x===b));});
$('dGo').onclick=async()=>{if(!drinkType){$('dMsg').textContent='PICK WHAT KIND OF DRINK FIRST!';return;}
  const pid=$('dWho').value;$('dGo').disabled=true;
  try{const dr=await Party.addDrink(pid,cur,drinkType,$('dLabel').value.trim());dr._mine=true;SEEN_DRINKS.add(dr.id);Party.drinks.push(dr);
    $('drinkBox').hidden=true;paintDrinkUI();renderParty();stage.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>startDrinkAnim(dr),350);}
  catch(e){$('dMsg').textContent=e.message==='that-is-plenty'?'THAT IS PLENTY FOR ONE NIGHT. WATER TIME? 💧':e.message==='host-only'?'ONLY THE HOST CAN LOG FOR THE MAYOR.':"COULDN'T SAVE THAT. TRY AGAIN.";}
  $('dGo').disabled=false;};
function paintReveal(){const b=$('pReveal'),msg=$('revealMsg');if(!b)return;const rv=!!(window.ROUTE&&window.ROUTE.revealed);
  b.textContent=rv?'🙈 HIDE SPAWN & BOSS AGAIN':'📣 REVEAL SPAWN & BOSS TO EVERYONE';msg.hidden=false;
  msg.textContent=rv?'REVEALED: EVERYONE CAN SEE THE SPAWN POINT, THE BOSS AND THE MAP.':'HIDDEN: FRIENDS SEE "??? TO BE ANNOUNCED" UNTIL YOU REVEAL (OR 7 PM SAT, AUTOMATICALLY).';}
$('pReveal').onclick=async()=>{const b=$('pReveal'),want=!(window.ROUTE&&window.ROUTE.revealed);
  if(want&&b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='TAP AGAIN: REVEAL TO EVERYONE?';setTimeout(()=>{b.dataset.sure='';paintReveal();},3000);return;}
  b.dataset.sure='';b.textContent='…';
  try{const r=await fetch('/api/route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({admin:Party.admin(),reveal:want})});const j=await r.json();if(!r.ok)throw new Error(j.error);
    window.ROUTE.revealed=j.revealed;paintReveal();if(j.revealed){for(let k=0;k<5;k++)burst(40+Math.random()*(W-80),10+Math.random()*40);beep(SFX.win);}}
  catch(e){b.textContent=e.message==='host-only'?'HOST WORD NEEDED':'FAILED, TRY AGAIN';setTimeout(paintReveal,2500);}};
paintReveal();
refreshParty();setInterval(()=>{if(Party.live)refreshParty();},15000);
resize();show(cur);paintEggs();paintLive();setInterval(paintLive,30000);
let last=performance.now()/1000;
function loop(ms){const t=ms/1000,dt=Math.min(.05,t-last);last=t;update(dt);render(t);requestAnimationFrame(loop);}
requestAnimationFrame(loop);
