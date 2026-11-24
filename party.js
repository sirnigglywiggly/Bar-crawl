/* ===== PARTY: players + 8-bit avatars (all generated on-device) ===== */
const PAL=['#0d0b1a','#2a1a10','#5a3a22','#8a5a33','#c98b5e','#f2c9a0','#ffffff','#9aa0b4','#e23b4e','#ff7a1a','#ffe14d','#3ddc84','#18c3ad','#2a6fdb','#8a6bff','#ff4fa3','#3e5a8c','#c9b27c','#3a3a48','#5b2f8a','#1f6b45','#7a1f2b','#efe3c2','#a1622e'];
const PAL_RGB=PAL.map(h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);
const HEAD_MASK=new Set([0,1,8,9,10,19,90,91,98,99]);
function nearestPal(r,g,b,allowed){let best=0,bd=1e9;for(const i of (allowed||[...PAL.keys()])){const c=PAL_RGB[i];const d=(r-c[0])**2*0.3+(g-c[1])**2*0.59+(b-c[2])**2*0.11;if(d<bd){bd=d;best=i;}}return best;}
function prng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function randomLook(seed){
  const r=prng(seed),skin=2+Math.floor(r()*4),hair=[0,1,1,10,8,9,14,15,7][Math.floor(r()*9)],style=Math.floor(r()*4);
  const g=Array(100).fill(-1),S=(x,y,c)=>{if(x>=0&&x<10&&y>=0&&y<10)g[y*10+x]=c;};
  for(let y=2;y<=8;y++)for(let x=1;x<=8;x++)S(x,y,skin);S(4,9,skin);S(5,9,skin);
  if(style===0||style===1){for(let x=2;x<=7;x++)S(x,0,hair);for(let x=1;x<=8;x++){S(x,1,hair);S(x,2,hair);}}
  if(style===1){for(let y=2;y<=8;y++){S(0,y,hair);S(9,y,hair);S(1,y,hair);S(8,y,hair);}}
  if(style===2){for(let y=0;y<=2;y++){S(4,y,hair);S(5,y,hair);}}
  if(style===3){const cap=[8,13,11,10][Math.floor(r()*4)];for(let x=2;x<=7;x++){S(x,0,cap);S(x,1,cap);}for(let x=1;x<=9;x++)S(x,2,cap);}
  S(3,5,0);S(6,5,0);if(r()<0.22)for(let x=2;x<=7;x++)S(x,5,0);
  if(r()<0.25)for(let x=3;x<=6;x++)S(x,6,1);
  const m=r()<0.5?8:1;S(4,7,m);S(5,7,m);
  return{h:g.map(v=>v<0?'x':v.toString(16)).join(''),s:[8,9,10,11,12,13,14,15][Math.floor(r()*8)],p:[0,13,1,7][Math.floor(r()*4)]};
}
function photoLook(file){return new Promise((res,rej)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('bad image'));};
  img.onload=()=>{try{
    const w=img.naturalWidth,h=img.naturalHeight,side=Math.min(w,h)*0.62,sx=(w-side)/2,sy=h>w*1.1?h*0.1:(h-side)/2;
    const m=document.createElement('canvas');m.width=m.height=40;const mg=m.getContext('2d');mg.imageSmoothingQuality='high';mg.drawImage(img,sx,sy,side,side,0,0,40,40);
    const c=document.createElement('canvas');c.width=c.height=10;const g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(m,0,0,40,40,0,0,10,10);
    const d=g.getImageData(0,0,10,10).data;let head='';
    for(let i=0;i<100;i++){if(HEAD_MASK.has(i)){head+='x';continue;}const k=(v)=>Math.max(0,Math.min(255,(v-128)*1.3+128));head+=nearestPal(k(d[i*4]),k(d[i*4+1]),k(d[i*4+2])).toString(16);}
    const b=document.createElement('canvas');b.width=b.height=1;const bg=b.getContext('2d');const by=Math.min(h-1,sy+side*1.05);bg.drawImage(img,sx,by,side,Math.max(1,Math.min(side*0.4,h-by)),0,0,1,1);const sd=bg.getImageData(0,0,1,1).data;
    const shirt=nearestPal(sd[0],sd[1],sd[2],[0,6,7,8,9,10,11,12,13,14,15]);
    URL.revokeObjectURL(url);res({h:head,s:shirt===0?13:shirt,p:0});
  }catch(e){URL.revokeObjectURL(url);rej(e);}};
  img.src=url;});}
function headCanvas(pl){if(pl._hc&&pl._hk===pl.h)return pl._hc;const c=document.createElement('canvas');c.width=c.height=10;const g=c.getContext('2d');
  for(let i=0;i<100;i++){const ch=pl.h[i];if(ch==='x'||ch===undefined)continue;g.fillStyle=PAL[parseInt(ch,16)]||PAL[4];g.fillRect(i%10,Math.floor(i/10),1,1);}
  Object.defineProperty(pl,'_hc',{value:c,writable:true,enumerable:false,configurable:true});Object.defineProperty(pl,'_hk',{value:pl.h,writable:true,enumerable:false,configurable:true});return c;}
/* Full-body sprites (16x24, from Claude): two frames, legs swap for the walk */
function spriteFrames(pl){if(pl._sf&&pl._sk===pl.h)return pl._sf;const mk=(swap)=>{const c=document.createElement('canvas');c.width=16;c.height=24;const g=c.getContext('2d');
    for(let y=0;y<24;y++)for(let x=0;x<16;x++){const sx=(swap&&y>=18)?15-x:x,ch=pl.h[y*16+sx];if(!ch||ch==='x')continue;const i=parseInt(ch,36);if(PAL[i]){g.fillStyle=PAL[i];g.fillRect(x,y,1,1);}}return c;};
  const f=[mk(false),mk(true)];Object.defineProperty(pl,'_sf',{value:f,writable:true,enumerable:false,configurable:true});Object.defineProperty(pl,'_sk',{value:pl.h,writable:true,enumerable:false,configurable:true});return f;}
function drawWalker(g,ox,oy,pl,ph,flip,moving){
  if(pl.h&&pl.h.length===384){ox=Math.round(ox);oy=Math.round(oy);const fr=moving?(Math.floor(ph)%2):0,img=spriteFrames(pl)[fr],bob=moving&&fr?-1:0;
    g.fillStyle='rgba(0,0,0,.35)';g.fillRect(ox-5,oy,10,1);
    if(flip){g.save();g.translate(ox+8,oy-24+bob);g.scale(-1,1);g.drawImage(img,0,0);g.restore();}else g.drawImage(img,ox-8,oy-24+bob);return;}
  ox=Math.round(ox);oy=Math.round(oy);
  const fr=moving?(Math.floor(ph)%2):0,sc=pl.h[44],skin=(sc&&sc!=='x')?PAL[parseInt(sc,16)]:PAL[4];
  const P=(x,y,c)=>{g.fillStyle=c;g.fillRect(ox+(flip?-x-1:x),oy+y,1,1);};
  const pants=PAL[pl.p]||PAL[0],shirt=PAL[pl.s]||PAL[13];
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(ox-4,oy,8,1);
  const legs=fr?[[-3,-2],[1,2]]:[[-2,-1],[0,1]];
  for(let y=-5;y<=-2;y++)for(const [a,b] of legs){P(a,y,pants);P(b,y,pants);}
  for(const [a,b] of legs){P(a,-1,'#0d0b1a');P(b,-1,'#0d0b1a');}
  for(let y=-11;y<=-6;y++)for(let x=-3;x<=2;x++)P(x,y,shirt);
  const ay=fr?1:0;for(let y=-10;y<=-7;y++){P(-4,y+ay,shirt);P(3,y-ay,shirt);}P(-4,-6+ay,skin);P(3,-6-ay,skin);
  const hc=headCanvas(pl);
  if(flip){g.save();g.translate(ox+5,oy-21);g.scale(-1,1);g.drawImage(hc,0,0);g.restore();}else g.drawImage(hc,ox-5,oy-21);
}

function cleanParty(a){if(!Array.isArray(a))return null;return a.filter(p=>p&&typeof p.h==='string'&&/^([0-9a-nx]{100}|[0-9a-nx]{384})$/.test(p.h)).slice(0,30).map(p=>({id:String(p.id||'').replace(/[^0-9a-z]/g,'').slice(0,16),n:String(p.n||'PLAYER').toUpperCase().slice(0,10),h:p.h,s:(+p.s|0)&15,p:(+p.p|0)&15}));}
/* Claude-designed avatar: shrink the photo, send it to /api/avatar, get a pixel look back. */
function photoToJpegBase64(file,max){return new Promise((res,rej)=>{const url=URL.createObjectURL(file),img=new Image();
  img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('bad image'));};
  img.onload=()=>{const k=Math.min(1,(max||512)/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');
    c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',0.85).split(',')[1]);};img.src=url;});}
async function claudeLook(b64){const r=await fetch('/api/avatar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:b64,type:'image/jpeg'})});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.look){const e=new Error(j.error||('HTTP '+r.status));e.detail=(j.detail||'')+(j.error?'':(r.status===504?' (vercel time limit)':' (status '+r.status+')'));e.code=j.error||('HTTP '+r.status);throw e;}
  const L=cleanParty([{id:'',n:'X',h:j.look.h,s:j.look.s,p:j.look.p}]);if(!L||!L.length)throw new Error('ai-bad-output');return{h:L[0].h,s:L[0].s,p:L[0].p};}
/* Shared party list: /api/party on Vercel (Redis). Falls back to this phone only if the API isn't set up. */
const Party={live:false,players:[],
  owned(){try{return JSON.parse(localStorage.getItem('bq_me'))||{};}catch(e){return {};}},
  setOwned(o){try{localStorage.setItem('bq_me',JSON.stringify(o));}catch(e){}},
  local(){try{return cleanParty(JSON.parse(localStorage.getItem('bq_local')))||[];}catch(e){return [];}},
  setLocal(a){try{localStorage.setItem('bq_local',JSON.stringify(a));}catch(e){}},
  admin(){try{return localStorage.getItem('bq_admin')||'';}catch(e){return '';}},
  async call(method,body){const r=await fetch('/api/party',{method,cache:'no-store',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j;},
  async load(){try{const j=await this.call('GET');this.live=true;this.players=cleanParty(j.players)||[];}catch(e){this.live=false;this.players=this.local();}return this.players;},
  async add(pl){const clean={n:pl.n,h:pl.h,s:pl.s,p:pl.p};
    if(this.live){const j=await this.call('POST',clean);const o=this.owned();o[j.id]=j.token;this.setOwned(o);return j.id;}
    const id='l'+Math.random().toString(16).slice(2,12);this.setLocal(this.local().concat([Object.assign({id},clean)]));const o=this.owned();o[id]='local';this.setOwned(o);return id;},
  async update(id,pl){const clean={n:pl.n,h:pl.h,s:pl.s,p:pl.p};
    if(this.live){await this.call('PUT',Object.assign({id,token:this.owned()[id]||'',admin:this.admin()},clean));return;}
    this.setLocal(this.local().map(p=>p.id===id?Object.assign({id},clean):p));},
  /* true = valid host key, false = wrong key, null = can't check (offline/local) */
  async verifyHost(key){if(!key)return false;try{const r=await fetch('/api/party?verify='+encodeURIComponent(key),{cache:'no-store'});if(r.status===503||r.status===404)return null;const j=await r.json();return typeof j.host==='boolean'?j.host:null;}catch(e){return null;}},
  async resetAll(){if(this.live)await this.call('DELETE',{all:true,admin:this.admin()});else{this.setLocal([]);try{localStorage.removeItem('bq_drinks_local');}catch(e){}}this.setOwned({});},
  async remove(id){if(this.live)await this.call('DELETE',{id,token:this.owned()[id]||'',admin:this.admin()});else this.setLocal(this.local().filter(p=>p.id!==id));
    const o=this.owned();delete o[id];this.setOwned(o);}
};

/* Drinks: what each player had at each bar */
Object.assign(Party,{drinks:[],
  async loadDrinks(){if(this.live){try{const r=await fetch('/api/drinks',{cache:'no-store'});const j=await r.json();if(r.ok&&Array.isArray(j.drinks)){this.drinks=j.drinks;return this.drinks;}}catch(e){}}
    try{this.drinks=JSON.parse(localStorage.getItem('bq_drinks_local'))||[];}catch(e){this.drinks=[];}return this.drinks;},
  async addDrink(pid,stop,type,label){
    if(this.live){const r=await fetch('/api/drinks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pid,stop,type,label,token:this.owned()[pid]||'',admin:this.admin()})});
      const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j.drink;}
    const d={id:'l'+Math.random().toString(16).slice(2,10),pid,stop,type,label:String(label||'').toUpperCase().slice(0,20),t:Date.now()};
    let a=[];try{a=JSON.parse(localStorage.getItem('bq_drinks_local'))||[];}catch(e){}a.push(d);try{localStorage.setItem('bq_drinks_local',JSON.stringify(a));}catch(e){}return d;}
});
/* 8-bit glasses */
const GLASS={
  beer:['..WWWW..','.WWWWWW.','.YYYYYGG','.YYYYY.G','.YYYYY.G','.YYYYYGG','.YYYYY..','.GGGGG..'],
  cocktail:['GGGGGGGGG','.PPPPPKP.','..PPPPP..','...PPP...','....G....','....G....','....G....','..GGGGG..'],
  shot:['G...G','GOOOG','GOOOG','GOOOG','GGGGG'],
  wine:['.G...G.','.RRRRR.','.RRRRR.','..RRR..','...G...','...G...','...G...','.GGGGG.'],
  water:['....P.','...P..','GGGGGG','GBBBBG','GBBBBG','GBBBBG','.GBBG.','.GGGG.'],
  other:['...P..','..P...','GGGGGG','GCCCCG','GCCCCG','GCCCCG','.GCCG.','.GGGG.']};
const GLASS_COL={W:'#ffffff',Y:'#ffb02e',G:'#cfd3e0',P:'#ff4fa3',K:'#3ddc84',O:'#e88a1a',R:'#a8203a',B:'#4fc3ff',C:'#8a6bff'};
function drawGlass(g,type,x,y){const s=GLASS[type]||GLASS.other;x=Math.round(x);y=Math.round(y);g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x-1,y-1,s[0].length+2,s.length+2);
  s.forEach((row,r)=>{for(let c=0;c<row.length;c++){const k=row[c];if(k!=='.'){g.fillStyle=GLASS_COL[k];g.fillRect(x+c,y+r,1,1);}}});}
const DRINK_NAMES={beer:'BEER',cocktail:'COCKTAIL',shot:'SHOT',wine:'WINE',water:'WATER',other:'DRINK'};
