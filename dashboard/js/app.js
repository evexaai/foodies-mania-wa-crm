"use strict";
/* ================= Foodies Mania order desk =================
   One screen for the website's orders.

   Everything on it is real. Orders, customers and conversations come from the
   same Neon database the website writes to, through /api/orders, /api/chats
   and /api/menu, and every change made here goes back the same way. There is
   no sample data and nothing is invented: an empty board means a quiet night.

   The menu is not kept here either. Both sites read website/js/menu.js, which
   this page loads before this file, so FM_ITEMS and FM_CATS below are the very
   list the customer is ordering from. Menu Management writes only the few
   things that change during a night, an item being off or a price, and the
   website picks those up within seconds.

   If the database cannot be reached, the desk falls back to listening to the
   browser: a website order placed in another tab still lands here through a
   BroadcastChannel. That is what makes the whole thing work on a laptop with
   no connection, and it is the only thing here that is not the database.   */

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rs=n=>'Rs '+Math.round(Number(n)||0).toLocaleString('en-US');
const ic=(n,c='')=>`<svg class="i ${c}"><use href="#i-${n}"/></svg>`;
const fi=(n,c='')=>`<svg class="i ${c}"><use href="#f-${n}"/></svg>`;
const ini=n=>String(n||'?').trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
const avc=n=>['','c2','c3','c4'][[...String(n||'')].reduce((a,c)=>a+c.charCodeAt(0),0)%4];
const MIN=60000,HOUR=3600000,DAY=86400000;
const now=()=>Date.now();
const ts=v=>{const t=new Date(v).getTime();return Number.isFinite(t)?t:0};
const t12=v=>{const d=new Date(v);const h=d.getHours(),m=String(d.getMinutes()).padStart(2,'0');return (h%12||12)+':'+m+' '+(h>=12?'PM':'AM')};
const dshort=v=>new Date(v).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const mins=v=>Math.max(0,Math.floor((now()-ts(v))/MIN));
const ago=v=>{const m=mins(v);if(m<1)return 'just now';if(m<60)return m+' min ago';const h=Math.floor(m/60);if(h<24)return h+'h '+(m%60)+'m ago';return Math.floor(h/24)+'d ago'};
const phonePretty=p=>{const d=String(p||'').replace(/\D/g,'');return d.length===11?d.slice(0,4)+' '+d.slice(4):p||''};
const waLink=p=>'https://wa.me/92'+String(p||'').replace(/\D/g,'').replace(/^0/,'');
const mmss=v=>{const s=Math.max(0,Math.floor((now()-ts(v))/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};

/* a night runs from 6 PM to 5 AM, so "tonight" starts at 6 PM, or at 6 PM
   yesterday if it is now the small hours */
const nightStart=()=>{const d=new Date();if(d.getHours()<5)d.setDate(d.getDate()-1);d.setHours(18,0,0,0);return d.getTime()};

/* ---------- the menu, exactly as the website has it ---------- */
const CATS=(typeof FM_CATS!=='undefined'?FM_CATS:[]);
const ITEMS=(typeof FM_ITEMS!=='undefined'?FM_ITEMS:[]);
const BIZ=(typeof FM_BIZ!=='undefined'?FM_BIZ:{name:'Foodies Mania'});
const AREAS=(typeof FM_AREAS!=='undefined'?FM_AREAS:[]);
const CM={};CATS.forEach(c=>CM[c.id]=c);
const IM={};ITEMS.forEach(i=>IM[i.id]=i);
const CATIC={deal:'platter',bbqdeal:'skewer',burger:'burger','special-pizza':'pizza',pizza:'pizza',sig:'pizza',
  roll:'roll',bbq:'skewer',fries:'fries',special:'bowl',juice:'drink',shake:'drink',dessert:'drink',addon:'drink'};
const catName=id=>CM[id]?CM[id].name:id;
const foodThumb=it=>it&&it.img?`<img class="mth" src="../website/assets/food/${esc(it.img)}-s.webp" alt="" loading="lazy" decoding="async">`:`<span class="food">${fi(CATIC[it&&it.cat]||'burger')}</span>`;

/* ---------- state ---------- */
const S={
  orders:[],omap:{},
  threads:[],tmap:{},msgs:{},
  menu:{items:{},cats:{}},
  notifs:[],
  offline:false, lastSync:0, ready:false,
  set:{sound:true,pop:true,speak:true},
  me:{name:'Shahnawaz',role:'Counter'}
};
try{Object.assign(S.set,JSON.parse(localStorage.getItem('fm.set')||'{}'))}catch{}
const saveSet=()=>{try{localStorage.setItem('fm.set',JSON.stringify(S.set))}catch{}};

/* ---------- status, in the counter's words ---------- */
const DONE=['delivered'];
const bucketOf=o=>o.status==='cancelled'?'cancelled':o.status==='new'?'new':DONE.includes(o.status)?'done':'open';
const ST=o=>{
  const pickup=o.kind==='pickup';
  if(o.status==='cancelled')return 'Cancelled';
  if(o.status==='new')return 'Needs approval';
  if(DONE.includes(o.status))return pickup?'Picked up':'Delivered';
  return pickup?'Waiting at the counter':'On the way';
};
const stCls=o=>({new:'t-new',open:o.kind==='pickup'?'t-ready':'t-out',done:'t-delivered',cancelled:'t-cancelled'})[bucketOf(o)];
const stTag=o=>`<span class="tag ${stCls(o)}">${ST(o)}</span>`;
const kindTag=o=>`<span class="tag">${ic(o.kind==='pickup'?'bag':'moped','sm')}${o.kind==='pickup'?'Pickup':'Delivery'}</span>`;
const payName={COD:'Cash on Delivery',EasyPaisa:'EasyPaisa',JazzCash:'JazzCash',Bank:'Bank Transfer'};
const paidProof=o=>o.pay!=='COD'&&!!(o.txn||o.shot);
const payTag=o=>`<span class="tag ${o.pay==='COD'?'':paidProof(o)?'t-approved':'t-new'}">${ic(o.pay==='COD'?'cash':'wallet','sm')}${esc(o.pay==='COD'?'Cash':payName[o.pay]||o.pay)}${o.pay==='COD'?'':paidProof(o)?' · proof sent':' · no proof'}</span>`;
const itemsShort=o=>(o.items||[]).map(i=>i.qty+'× '+i.name).join(', ');
const custName=o=>o.name||'Customer';
const isLate=o=>bucketOf(o)==='new'&&mins(o.placed_at)>=10;
const tonight=()=>S.orders.filter(o=>ts(o.placed_at)>=nightStart());

/* ================= the line to the server ================= */
const API={
  key(){try{return localStorage.getItem('fm.staffkey')||''}catch{return ''}},
  setKey(v){try{v?localStorage.setItem('fm.staffkey',v):localStorage.removeItem('fm.staffkey')}catch{}},
  head(j){const h=j?{'content-type':'application/json'}:{};const k=this.key();if(k)h['x-fm-key']=k;return h},
  async call(path,opt={}){
    const r=await fetch('/api'+path,{...opt,headers:{...this.head(!!opt.body),...(opt.headers||{})}});
    if(r.status===503){S.offline=true;throw Object.assign(new Error('offline'),{offline:true})}
    if(r.status===401){askKey();throw Object.assign(new Error('key'),{auth:true})}
    if(!r.ok)throw new Error('HTTP '+r.status);
    S.offline=false;
    return r.json();
  },
  get(path){return this.call(path)},
  post(path,b){return this.call(path,{method:'POST',body:JSON.stringify(b)})}
};
let keyAsked=false;
function askKey(){
  if(keyAsked)return;keyAsked=true;
  modal(`<div class="md-h"><div class="grow"><h3>Staff key needed</h3><p>This desk is locked. Enter the key the owner set and it will be remembered on this computer.</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b"><label class="field"><span>Staff key</span><input class="tx" id="skIn" type="password" placeholder="Paste the key"></label></div>
   <div class="md-f"><button class="btn ghost" data-close>Later</button><button class="btn pri" id="skOk">Save and carry on</button></div>`,m=>{
    $('#skOk',m).onclick=()=>{const v=$('#skIn',m).value.trim();if(!v)return;API.setKey(v);keyAsked=false;closeModal();Sync.all()};
    setTimeout(()=>$('#skIn',m).focus(),120);
  });
}

/* ================= keeping in step =================
   The desk asks for news while it is being looked at and stops when it is
   not. Six seconds is short enough that an order feels immediate and long
   enough to leave the database alone on a quiet night.                      */
const Sync={
  busy:false, timer:null,
  async orders(){
    const {orders=[]}=await API.get('/orders');
    const fresh=[];
    orders.forEach(o=>{
      const had=S.omap[o.id];
      S.omap[o.id]=o;
      if(!had)fresh.push(o);
    });
    S.orders=Object.values(S.omap).sort((a,b)=>ts(b.placed_at)-ts(a.placed_at));
    /* only announce an order that arrived after this page was opened */
    if(S.ready)fresh.filter(o=>o.status==='new'&&ts(o.placed_at)>S.lastSync).forEach(o=>{
      notify('order',`New order · ${o.id}`,`${custName(o)} · ${o.kind==='pickup'?'Pickup':o.area||'Delivery'} · ${rs(o.total)}`,{page:'orders',order:o.id},{icon:'bell',tone:'warn'});
      Sound.alert(`New order from ${custName(o)}`);
    });
    S.lastSync=Math.max(S.lastSync,...orders.map(o=>ts(o.placed_at)),0);
  },
  async chats(){
    const {threads=[]}=await API.get('/chats');
    const before=S.tmap;
    S.threads=threads;S.tmap={};
    threads.forEach(t=>{
      S.tmap[t.device_id]=t;
      const had=before[t.device_id];
      if(S.ready&&t.unread>0&&t.last_who==='me'&&(!had||ts(t.updated_at)>ts(had.updated_at))&&t.device_id!==openChat){
        notify('chat',`${t.name||'A customer'} is chatting`,String(t.last_text||'').slice(0,90),{page:'chats',chat:t.device_id},{icon:'chat',tone:'vio'});
      }
    });
  },
  async menu(){
    const {items=[],cats=[]}=await API.get('/menu');
    const m={items:{},cats:{}};
    items.forEach(r=>m.items[r.item_id]=r);
    cats.forEach(r=>m.cats[r.item_id]=r);
    S.menu=m;
  },
  async all(){
    if(this.busy)return;this.busy=true;
    try{
      await Promise.all([this.orders(),this.chats(),this.menu()]);
      S.offline=false;S.ready=true;
    }catch(e){
      if(e.offline){S.offline=true;Local.on()}
    }finally{this.busy=false;changed()}
  },
  beat(){if(document.visibilityState==='visible')this.all()},
  start(){
    this.all();
    clearInterval(this.timer);
    this.timer=setInterval(()=>this.beat(),6000);
    addEventListener('visibilitychange',()=>this.beat());
    addEventListener('online',()=>this.beat());
  }
};

/* move an order along: the board changes at once, the database is told, and if
   the telling fails the board goes back to what the database last said */
async function setStatus(id,status){
  const o=S.omap[id];if(!o)return;
  const was=o.status,wasAt=o.approved_at;
  o.status=status;
  if(status!=='new'&&status!=='cancelled'&&!o.approved_at)o.approved_at=new Date().toISOString();
  changed();
  if(S.offline||o.local){Local.push(id,status);return}
  try{await API.post('/orders',{id,status})}
  catch(e){
    if(e.offline){Local.push(id,status);return}
    o.status=was;o.approved_at=wasAt;changed();
    toast('That did not save','The order is as it was. Check the connection and try again.',{icon:'alert',tone:'bad'});
  }
}

/* ================= the fallback: the browser itself =================
   With no database, a website order still reaches this page when both are
   open in the same browser. It is how the desk works on a laptop with no
   connection, and nothing else here depends on it.                        */
const Local={
  ch:null,live:false,
  on(){
    if(this.live)return;this.live=true;
    try{this.ch=new BroadcastChannel('fm-web')}catch{}
    if(this.ch)this.ch.onmessage=e=>{if(e.data&&e.data.type==='order')this.take(e.data.order)};
    this.sweep();
    setInterval(()=>this.sweep(),4000);
  },
  sweep(){
    let q=[];try{q=JSON.parse(localStorage.getItem('fm.web.queue')||'[]')}catch{}
    q.forEach(o=>this.take(o));
  },
  take(w){
    if(!w||!w.id||S.omap[w.id])return;
    const o={id:w.id,phone:String(w.phone||'').replace(/\D/g,''),name:w.name||'Customer',device_id:w.device||'',ip:'',
      kind:w.type==='pickup'?'pickup':'delivery',area:w.area||'',address:w.addr||'',note:w.note||'',pay:w.pay||'COD',
      txn:w.txn||'',shot:w.shot||'',src:w.src||'web',items:w.items||[],subtotal:w.subtotal||0,fee:w.fee||0,total:w.total||0,
      status:'new',placed_at:new Date(w.placed||Date.now()).toISOString(),local:true};
    S.omap[o.id]=o;
    S.orders=Object.values(S.omap).sort((a,b)=>ts(b.placed_at)-ts(a.placed_at));
    notify('order',`New order · ${o.id}`,`${custName(o)} · ${o.kind==='pickup'?'Pickup':o.area} · ${rs(o.total)}`,{page:'orders',order:o.id},{icon:'bell',tone:'warn'});
    Sound.alert(`New order from ${custName(o)}`);
    changed();
  },
  push(id,status){
    let m={};try{m=JSON.parse(localStorage.getItem('fm.web.status')||'{}')}catch{}
    const o=S.omap[id]||{};
    m[id]={type:'status',id,status,pickup:o.kind==='pickup',t:Date.now()};
    try{localStorage.setItem('fm.web.status',JSON.stringify(m))}catch{}
    if(this.ch)this.ch.postMessage({type:'status',id,status,pickup:o.kind==='pickup'});
  }
};

/* ================= sound =================
   A chime, and the order read out if that is switched on. Browsers will not
   make a sound until the page has been clicked once, so the first click wakes
   it up and nothing is said before that.                                   */
const Sound={
  ctx:null,woke:false,
  wake(){this.woke=true;if(!this.ctx&&window.AudioContext)this.ctx=new AudioContext();if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume()},
  chime(){
    if(!S.set.sound||!this.ctx)return;
    const t=this.ctx.currentTime;
    [880,1320].forEach((f,i)=>{
      const o=this.ctx.createOscillator(),g=this.ctx.createGain();
      o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(0,t+i*.14);
      g.gain.linearRampToValueAtTime(.22,t+i*.14+.02);
      g.gain.exponentialRampToValueAtTime(.001,t+i*.14+.34);
      o.connect(g).connect(this.ctx.destination);o.start(t+i*.14);o.stop(t+i*.14+.36);
    });
  },
  say(line){
    if(!S.set.sound||!S.set.speak||!this.woke||!window.speechSynthesis||!line)return;
    try{
      const u=new SpeechSynthesisUtterance(line);
      u.rate=1;u.pitch=1;u.volume=.9;
      const v=speechSynthesis.getVoices().find(x=>/en-GB|en-US|en-IN/i.test(x.lang));
      if(v)u.voice=v;
      speechSynthesis.speak(u);
    }catch{}
  },
  alert(line){this.chime();setTimeout(()=>this.say(line),420)}
};
addEventListener('pointerdown',()=>Sound.wake(),{once:true});
addEventListener('keydown',()=>Sound.wake(),{once:true});

/* ================= toasts and the bell ================= */
function toast(title,sub,opt={}){
  const box=$('#toasts');if(!box)return;
  const el=document.createElement('div');el.className='toast '+(opt.tone||'');
  el.innerHTML=`<div class="ti">${ic(opt.icon||'bell')}</div><div class="grow"><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div><button class="tcl" aria-label="Dismiss">${ic('x','sm')}</button>`;
  let tmr=null,gone=false;
  const bye=()=>{if(gone)return;gone=true;clearTimeout(tmr);el.classList.add('bye');setTimeout(()=>el.remove(),380)};
  $('.tcl',el).onclick=e=>{e.stopPropagation();bye()};
  el.onclick=()=>{opt.go&&opt.go();bye()};
  let x0=null,dx=0;                       /* flick it away */
  el.addEventListener('pointerdown',e=>{if(e.target.closest('.tcl'))return;x0=e.clientX;dx=0;el.style.transition='none';try{el.setPointerCapture(e.pointerId)}catch(err){}});
  el.addEventListener('pointermove',e=>{if(x0===null)return;dx=e.clientX-x0;
    if(dx>0){el.style.transform=`translateX(${dx}px)`;el.style.opacity=String(Math.max(0,1-dx/170))}});
  const end=()=>{if(x0===null)return;x0=null;el.style.transition='';
    if(dx>64)bye();else{el.style.transform='';el.style.opacity=''}};
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
  el.addEventListener('mouseenter',()=>clearTimeout(tmr));
  el.addEventListener('mouseleave',()=>{if(!gone)tmr=setTimeout(bye,2000)});
  box.prepend(el);
  const cap=innerWidth<=720?2:3;          /* a phone screen is small; never stack more than two */
  while(box.children.length>cap)box.lastChild.remove();
  tmr=setTimeout(bye,opt.ms||4600);
  return el;
}
function notify(kind,title,sub,link,opt={}){
  S.notifs.unshift({id:'n'+Date.now()+Math.random(),kind,title,sub,t:now(),read:false,link});
  if(S.notifs.length>60)S.notifs.length=60;
  /* with pop-ups off it still lands in the bell panel and still rings the badge */
  if(S.set.pop)toast(title,sub,{...opt,go:link?()=>go(link.page,link):null});
  const b=$('#bellBtn');if(b){b.classList.remove('ring');void b.offsetWidth;b.classList.add('ring')}
  changed();
}
const NIC={order:'bell',chat:'chat',menu:'cloche'};
function renderNP(){
  $('#npB').innerHTML=S.notifs.length?S.notifs.slice(0,30).map(n=>`<button class="${n.read?'':'unread'}" data-id="${n.id}"><span class="ti">${ic(NIC[n.kind]||'bell')}</span><span class="grow"><b>${esc(n.title)}</b><small>${esc(n.sub||'')}</small><small>${ago(n.t)}</small></span></button>`).join(''):`<div class="empty">${ic('bell')}Nothing yet. New orders and new chats land here.</div>`;
  $$('#npB button').forEach(b=>b.onclick=()=>{const n=S.notifs.find(x=>x.id===b.dataset.id);if(n){n.read=true;closeNP();if(n.link)go(n.link.page,n.link)}refreshChrome()});
}
function closeNP(){$('#np').classList.remove('on')}

/* ================= change bus =================
   Anything that changes calls changed(); the page is redrawn once on the next
   frame rather than once per change.                                        */
let _chg=false;
function changed(){
  if(_chg)return;_chg=true;
  requestAnimationFrame(()=>{
    _chg=false;refreshChrome();
    PAGES[cur]&&PAGES[cur].refresh&&PAGES[cur].refresh();
    if(drawerOrder&&$('#drawer').classList.contains('on')){
      const d=$('#drawer .dw-b'),t=d?d.scrollTop:0;orderDrawer(drawerOrder);
      const d2=$('#drawer .dw-b');if(d2)d2.scrollTop=t}
  });
}

/* ================= drawer, modal, side ================= */
function openDrawer(html,onMount){const d=$('#drawer');d.innerHTML=html;d.classList.add('on');$('#scrim').classList.add('on');$$('[data-close]',d).forEach(b=>b.onclick=closeDrawer);onMount&&onMount(d)}
function closeDrawer(){$('#drawer').classList.remove('on');if(!$('#side').classList.contains('on'))$('#scrim').classList.remove('on');drawerOrder=null}
function modal(html,onMount){const m=$('#modal');$('#modalIn').innerHTML=html;m.classList.add('on');$$('[data-close]',m).forEach(b=>b.onclick=closeModal);onMount&&onMount($('#modalIn'))}
function closeModal(){$('#modal').classList.remove('on')}
function confirmBox(title,sub,okText,fn,danger){modal(`<div class="md-h"><div class="grow"><h3>${esc(title)}</h3><p>${esc(sub)}</p></div></div><div class="md-f"><button class="btn ghost" data-close>Keep it</button><button class="btn ${danger?'danger':'pri'}" id="mOk">${esc(okText)}</button></div>`,m=>$('#mOk',m).onclick=()=>{closeModal();fn()})}
function toggleSide(on){$('#side').classList.toggle('on',on);$('#scrim').classList.toggle('on',on||$('#drawer').classList.contains('on'))}
async function copyText(txt,btn){
  try{await navigator.clipboard.writeText(txt)}
  catch{const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch{}t.remove()}
  if(btn){const was=btn.innerHTML;btn.innerHTML=ic('check','sm')+'Copied';setTimeout(()=>btn.innerHTML=was,1400)}
}

/* ---------- theme and sidebar ---------- */
const LS={get(k,d){try{const v=localStorage.getItem('fm:'+k);return v==null?d:v}catch(e){return d}},
 set(k,v){try{localStorage.setItem('fm:'+k,v)}catch(e){}}};
const Theme={
 cur:LS.get('theme','dark'),
 apply(){document.documentElement.dataset.theme=this.cur;
   const b=$('#themeBtn');if(b){b.innerHTML=ic(this.cur==='dark'?'sun':'moon');b.title=this.cur==='dark'?'Switch to light mode':'Switch to dark mode'}},
 toggle(){this.cur=this.cur==='dark'?'light':'dark';LS.set('theme',this.cur);this.apply()}
};
const Side={
 mini:LS.get('side','full')==='mini',
 apply(){document.documentElement.dataset.side=this.mini?'mini':'full';
   const b=$('#burger');if(b)b.title=innerWidth<=1024?'Menu':(this.mini?'Expand sidebar':'Collapse sidebar')},
 toggle(){this.mini=!this.mini;LS.set('side',this.mini?'mini':'full');this.apply()}
};
const reduceMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
/* cards below the fold rise in as you reach them: transform and opacity only */
const Reveal={
 io:null,
 init(){
   if(reduceMotion()||!('IntersectionObserver' in window))return;
   this.io=new IntersectionObserver(es=>es.forEach(e=>{
     if(e.isIntersecting){e.target.classList.add('in');this.io.unobserve(e.target)}
   }),{root:$('#content'),rootMargin:'0px 0px -5% 0px',threshold:.04});
 },
 scan(){
   if(!this.io)return;
   const box=$('#content');if(!box)return;
   const fold=box.getBoundingClientRect().bottom-24;
   $$('#pg > .card, #pg > .grid > *').forEach(el=>{
     if(el.dataset.rv)return;
     if(el.getBoundingClientRect().top>fold){el.dataset.rv=1;el.classList.add('rv');this.io.observe(el)}
   });
 }
};
/* ---------- install as an app ---------- */
const Install={
 evt:null,
 init(){
   if('serviceWorker' in navigator)
     addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
   addEventListener('beforeinstallprompt',e=>{e.preventDefault();this.evt=e;
     if(cur==='settings')PAGES.settings.body()});
   addEventListener('appinstalled',()=>{this.evt=null;
     toast('Installed','The order desk now opens from your home screen',{icon:'check',tone:'ok'});
     if(cur==='settings')PAGES.settings.body()});
 },
 async prompt(){
   const e=this.evt;if(!e)return 'unavailable';
   this.evt=null;
   try{e.prompt();const c=await e.userChoice;return c&&c.outcome||'dismissed'}
   catch(err){return 'failed'}
 },
 can(){return !!this.evt},
 standalone(){try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}},
 platform(){
   const u=navigator.userAgent||'';
   if(/iPhone|iPad|iPod/i.test(u))return 'ios';
   if(/Android/i.test(u))return 'android';
   return 'desktop';
 }
};
function toggleFull(){
  const d=document.documentElement;
  if(document.fullscreenElement){document.exitFullscreen&&document.exitFullscreen().catch(()=>{});return}
  if(d.requestFullscreen)d.requestFullscreen().catch(()=>toast('Full screen blocked','Your browser would not allow it from here',{icon:'alert',tone:'bad'}));
}
function settle(root){if(!root)return;root.dataset.init=1}

/* ================= the five pages ================= */
const NAV=[
 {id:'dash',t:'Dashboard',ic:'dash'},
 {id:'orders',t:'Orders',ic:'moped'},
 {id:'chats',t:'Live Conversations',ic:'chat'},
 {id:'menu',t:'Menu Management',ic:'cloche'},
 {id:'customers',t:'Customers',ic:'users'},
 {id:'settings',t:'Settings',ic:'gear'}
];
const PAGES={};
let cur='orders',openChat=null,lastBadge={};

function buildNav(){
  $('#nav').innerHTML=NAV.map(n=>`<button data-p="${n.id}" title="${n.t}">${ic(n.ic)}<span>${n.t}</span><span class="cnt" data-nb="${n.id}" hidden></span></button>`).join('');
  /* on a phone every page is one tap away, so the bar carries all of them */
  $('#bnav').innerHTML=NAV.filter(n=>n.id!=='settings').map(n=>`<button data-p="${n.id}">${ic(n.ic)}<span>${n.id==='chats'?'Chats':n.id==='menu'?'Menu':n.t}</span><span class="cnt" data-nb="${n.id}" hidden></span></button>`).join('');
  $('#bnav').style.gridTemplateColumns=`repeat(${NAV.length-1},1fr)`;
  $$('#nav button,#bnav button').forEach(b=>b.onclick=()=>go(b.dataset.p));
}
function go(p,opts={}){
  closeDrawer();closeNP();toggleSide(false);
  const page=PAGES[p];if(!page)return;
  if(p===cur&&!opts.force){page.open&&page.open(opts);return}
  cur=p;
  $$('#nav button,#bnav button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));
  $('#pgTitle').textContent=(NAV.find(n=>n.id===p)||{}).t||'';
  const c=$('#content');c.className='content'+(page.flush?' flush':'');
  c.scrollTop=0;
  c.innerHTML='<div class="page" id="pg"></div>';
  page.render($('#pg'),opts);
  Reveal.scan();
}
function refreshChrome(){
  const counts={
    orders:S.orders.filter(o=>o.status==='new').length,
    chats:S.threads.reduce((a,t)=>a+(Number(t.unread)||0),0),
    dash:0,menu:0,customers:0
  };
  $$('[data-nb]').forEach(el=>{
    const id=el.dataset.nb,n=counts[id]||0;
    el.hidden=!n;el.textContent=n?(n>99?'99+':String(n)):'';
    el.classList.toggle('red',n>0);
    if(lastBadge[id]!==undefined&&n>lastBadge[id]){el.classList.add('bump');setTimeout(()=>el.classList.remove('bump'),300)}
  });
  lastBadge={...counts};
  const un=S.notifs.filter(n=>!n.read).length,b=$('#bellN');
  b.hidden=!un;b.textContent=un>9?'9+':un;
  const lt=$('#liveTag');
  lt.className='live'+(S.offline?' off':'');
  $('#liveTx').textContent=S.offline?'No database':'Live';
  lt.title=S.offline?'The database cannot be reached, so this desk is listening to the browser instead':'Orders are coming straight from the database';
  $('#voiceBtn').innerHTML=ic(S.set.sound?'sound':'mute');
  $('#voiceBtn').title=S.set.sound?'Sound on':'Sound off';
  $('#npPop').classList.toggle('on',S.set.pop);
  $('#bellBtn').classList.toggle('muted',!S.set.pop);
  if($('#np').classList.contains('on'))renderNP();
}

/* ================= one order, in full ================= */
let drawerOrder=null;
const SRCNAME={web:'Website',chat:'Chat to order',bubble:'Chat bubble'};
function orderDrawer(id){
  const o=S.omap[id];if(!o)return;drawerOrder=id;
  const pickup=o.kind==='pickup';
  const b=bucketOf(o);
  const acts={
    new:`<button class="btn danger" data-a="cancel">${ic('x')}Cancel</button><button class="btn pri" data-a="approve">${ic('check')}Approve</button>`,
    open:`<button class="btn danger" data-a="cancel">${ic('x')}Cancel</button><button class="btn pri" data-a="done">${ic('check')}${pickup?'Picked up':'Delivered'}</button>`,
    done:`<button class="btn ghost" data-close>Close</button>`,
    cancelled:`<button class="btn ghost" data-close>Close</button>`
  }[b];
  const paidLines=o.pay==='COD'?'':`
    ${o.txn?`<div class="dw-r"><span>Transaction ID</span><b class="mono">${esc(o.txn)}</b></div>`:''}
    ${o.shot?`<div class="dw-r"><span>Screenshot</span><button class="link" data-shot>${ic('eye','sm')}See it</button></div>`:''}
    ${!o.txn&&!o.shot?`<div class="warnbox">${ic('alert','sm')}They chose ${esc(payName[o.pay]||o.pay)} but sent no transaction ID and no screenshot. Ring them before you approve.</div>`:''}`;
  openDrawer(`
   <div class="dw-h">
     <div class="grow"><h3>${esc(o.id)}</h3><p>${esc(SRCNAME[o.src]||'Website')} · ${t12(o.placed_at)} · ${ago(o.placed_at)}</p></div>
     <button class="iconbtn" data-close aria-label="Close">${ic('x')}</button>
   </div>
   <div class="dw-b">
     <div class="row wrap" style="gap:6px">${stTag(o)}${kindTag(o)}${payTag(o)}${isLate(o)?`<span class="tag t-cancelled">${ic('clock','sm')}${mins(o.placed_at)} min waiting</span>`:''}</div>

     <div class="box">
       <div class="row" style="gap:10px">
         <div class="av ${avc(custName(o))}">${ini(custName(o))}</div>
         <div class="grow"><b>${esc(custName(o))}</b><div class="dim" style="font-size:12.5px">${esc(phonePretty(o.phone))}${o.customer_orders>1?` · ${o.customer_orders} orders · ${rs(o.customer_spent)} with us`:' · first order'}</div></div>
         <a class="iconbtn" href="tel:${esc(o.phone)}" aria-label="Call">${ic('phone')}</a>
       </div>
       ${pickup?`<div class="dw-r"><span>Collecting from</span><b>${esc(BIZ.addr||'the counter')}</b></div>`
         :`<div class="dw-r"><span>Deliver to</span><b style="text-align:right">${esc(o.address||'—')}</b></div>
           <div class="dw-r"><span>Area</span><b>${esc(o.area||'—')}</b></div>`}
       ${o.note?`<div class="dw-r"><span>Note</span><b style="text-align:right">${esc(o.note)}</b></div>`:''}
     </div>

     <h4 class="dw-t">What they ordered</h4>
     <div class="dw-items">
       ${(o.items||[]).map(it=>{const m=IM[it.id];
         return `<div class="dw-i">${foodThumb(m||it)}<div class="grow"><b>${esc(it.name)}${it.size?` <span class="dim">· ${esc(it.size)}</span>`:''}</b>${it.note?`<small class="warn">${esc(it.note)}</small>`:''}</div><span class="qty">${it.qty}×</span><b class="num">${rs((Number(it.price)||0)*(Number(it.qty)||1))}</b></div>`}).join('')}
     </div>
     <div class="dw-sum">
       <div class="dw-r"><span>Items</span><b class="num">${rs(o.subtotal)}</b></div>
       ${pickup?'':`<div class="dw-r"><span>Delivery to ${esc(o.area||'—')}</span><b class="num">${rs(o.fee)}</b></div>`}
       <div class="dw-r tot"><span>Total</span><b class="num">${rs(o.total)}</b></div>
       <div class="dw-r"><span>Paying by</span><b>${esc(payName[o.pay]||o.pay)}</b></div>
       ${paidLines}
     </div>

     <h4 class="dw-t">How we know it is them</h4>
     <div class="box small">
       <div class="dw-r"><span>Their device</span><b class="mono">${esc(String(o.device_id||'—').slice(0,22))}</b></div>
       <div class="dw-r"><span>Seen from</span><b class="mono">${esc(o.ip||'—')}</b></div>
       <p class="dim" style="font-size:12px;margin:8px 0 0">The customer never signs in. Their browser carries this id, so they are shown their own orders and nobody else's.</p>
     </div>
   </div>
   <div class="dw-f">${acts}</div>`,d=>{
    const act=$('[data-a]',d)?$$('[data-a]',d):[];
    act.forEach(btn=>btn.onclick=()=>{
      const a=btn.dataset.a;
      if(a==='approve'){setStatus(o.id,'approved');toast('Approved',`${custName(o)} can see it is on the way`,{icon:'check',tone:'ok'})}
      if(a==='done'){setStatus(o.id,'delivered');closeDrawer();toast(pickup?'Marked picked up':'Marked delivered',o.id,{icon:'check',tone:'ok'})}
      if(a==='cancel')confirmBox('Cancel this order?',`${custName(o)} will be told it was cancelled and asked to call us.`,'Cancel the order',()=>{setStatus(o.id,'cancelled');closeDrawer();toast('Order cancelled',o.id,{icon:'x',tone:'bad'})},true);
    });
    const sh=$('[data-shot]',d);
    if(sh)sh.onclick=()=>modal(`<div class="md-h"><div class="grow"><h3>Payment screenshot</h3><p>${esc(o.id)} · ${esc(payName[o.pay]||o.pay)} · ${rs(o.total)}</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
      <div class="md-b" style="text-align:center"><img src="${esc(o.shot)}" alt="Payment screenshot the customer sent" style="max-width:100%;border-radius:12px"></div>
      <div class="md-f"><button class="btn ghost" data-close>Close</button></div>`);
  });
}

/* ================= DASHBOARD ================= */
PAGES.dash={
 render(el){
  el.innerHTML=`<div class="hello"><div><h2>${greet()}, ${esc(S.me.name.split(' ')[0])}</h2><p id="dSub">Tonight's orders, straight from the website.</p></div></div>
   <div class="grid g4 st" id="kpis"></div>
   <div class="card" style="margin-top:16px"><div class="card-h"><h3>${ic('bell')}Needs you now</h3><button class="link sp" data-go="orders">All orders ${ic('chev','sm')}</button></div><div id="dNew"></div></div>
   <div class="grid g21" style="margin-top:16px">
    <div class="card"><div class="card-h"><h3>${ic('flame')}Selling tonight</h3><button class="link sp" data-go="menu">Menu ${ic('chev','sm')}</button></div><div id="dTop"></div></div>
    <div class="card"><div class="card-h"><h3>${ic('chat')}Chatting now</h3><button class="link sp" data-go="chats">Open ${ic('chev','sm')}</button></div><div id="dChats"></div></div>
   </div>`;
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  this.refresh();
 },
 refresh(){
  const kp=$('#kpis');if(!kp)return;
  const L=tonight();
  const need=L.filter(o=>o.status==='new');
  const open=L.filter(o=>bucketOf(o)==='open');
  const done=L.filter(o=>bucketOf(o)==='done');
  const money=L.filter(o=>bucketOf(o)!=='cancelled').reduce((a,o)=>a+(Number(o.total)||0),0);
  const K=[['bell','Needs approval',need.length,need.length?'Approve them so the customer knows':'Nothing waiting','orders'],
   ['moped','On the way',open.length,'Approved and not finished','orders'],
   ['check','Finished tonight',done.length,'Delivered or picked up','orders'],
   ['wallet','Taken tonight',rs(money),'Everything not cancelled',null]];
  kp.innerHTML=K.map((x,i)=>`<${x[4]?'button':'div'} class="card kpi ${x[4]?'tap':''}" ${x[4]?`data-k="${x[4]}"`:''} style="--d:${i}"><div class="kh"><div class="ico">${ic(x[0])}</div><div class="lbl">${x[1]}</div></div><div class="val num">${typeof x[2]==='number'?x[2]:x[2]}</div><div class="kft"><span class="dim">${x[3]}</span></div></${x[4]?'button':'div'}>`).join('');
  $$('[data-k]',kp).forEach(b=>b.onclick=()=>go('orders',{tab:'new'}));

  const nb=$('#dNew');
  nb.innerHTML=need.length?`<div class="lst">${need.slice(0,6).map(o=>ordRow(o)).join('')}</div>`
    :`<div class="empty">${ic('check')}Every order is approved. Nothing is waiting on you.</div>`;
  $$('[data-o]',nb).forEach(r=>r.onclick=()=>orderDrawer(r.dataset.o));

  const cnt={};L.forEach(o=>(o.items||[]).forEach(it=>cnt[it.name]=(cnt[it.name]||0)+(Number(it.qty)||1)));
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,7);const mx=top[0]?top[0][1]:1;
  $('#dTop').innerHTML=top.length?`<div class="bars">${top.map(([n,q])=>`<div class="br"><span class="ell">${esc(n)}</span><b class="num">${q}</b><span class="tr"><i style="width:${q/mx*100}%"></i></span></div>`).join('')}</div>`
    :`<div class="empty">${ic('flame')}Nothing sold yet tonight.</div>`;

  const live=S.threads.filter(t=>ts(t.updated_at)>now()-2*HOUR).slice(0,6);
  $('#dChats').innerHTML=live.length?`<div class="lst">${live.map(t=>thRow(t)).join('')}</div>`
    :`<div class="empty">${ic('chat')}No one is chatting right now.</div>`;
  $$('[data-ch]',$('#dChats')).forEach(b=>b.onclick=()=>go('chats',{chat:b.dataset.ch}));
 }
};
const greet=()=>{const h=new Date().getHours();return h<5?'Still going':h<12?'Good morning':h<17?'Good afternoon':'Good evening'};

/* one order as a row in a list */
function ordRow(o){
  return `<button data-o="${esc(o.id)}" class="${isLate(o)?'late':''}">
   <span class="food ${o.kind==='pickup'?'pk':'dl'}">${ic(o.kind==='pickup'?'bag':'moped')}</span>
   <div class="grow"><div class="row"><span class="mono oid">${esc(o.id)}</span><b class="ell">${esc(custName(o))}</b></div>
    <div class="dim ell" style="font-size:12px">${esc(o.kind==='pickup'?'Pickup':o.area||'Delivery')} · ${esc(itemsShort(o))||'—'}</div></div>
   <div class="rt"><b class="num">${rs(o.total)}</b><small class="dim">${t12(o.placed_at)}</small></div>
   ${stTag(o)}</button>`;
}
function thRow(t){
  const who=t.last_who==='me'?'':t.last_who==='staff'?'You: ':'AI: ';
  return `<button data-ch="${esc(t.device_id)}" class="${t.unread>0?'unread':''}">
   <div class="av sm ${avc(t.name||t.device_id)}">${ini(t.name||'?')}</div>
   <div class="grow"><div class="row"><b class="ell">${esc(t.name||'Someone on the website')}</b>
     <span class="tag ${t.taken_by?'t-human':'t-ai'}" style="margin-left:auto">${t.taken_by?'You have it':'AI is answering'}</span></div>
    <div class="dim ell" style="font-size:12px">${esc(who+String(t.last_text||'').replace(/\*/g,''))}</div></div>
   ${t.unread>0?`<span class="cnt red">${t.unread}</span>`:''}</button>`;
}

/* ================= ORDERS ================= */
let ordTab='new',ordKind='all',ordQ='';
PAGES.orders={
 render(el,opts){
  if(opts.tab)ordTab=opts.tab;
  el.innerHTML=`<div class="toolbar">
    <div class="segs" id="oTabs"></div>
    <div class="grow"></div>
    <div class="segs sm" id="oKind"></div>
    <div class="inp srch-in">${ic('search')}<input id="oQ" placeholder="Order number, name or phone" aria-label="Search orders" value="${esc(ordQ)}"></div>
   </div>
   <div id="oList"></div>`;
  $('#oQ').oninput=e=>{ordQ=e.target.value.toLowerCase().trim();this.refresh()};
  this.refresh();
  if(opts.order)orderDrawer(opts.order);
 },
 open(opts){if(opts.tab){ordTab=opts.tab;this.refresh()}if(opts.order)orderDrawer(opts.order)},
 list(){
  return S.orders.filter(o=>{
    if(ordTab!=='all'&&bucketOf(o)!==ordTab)return false;
    if(ordKind!=='all'&&o.kind!==ordKind)return false;
    if(ordQ){
      const hay=(o.id+' '+custName(o)+' '+o.phone+' '+(o.area||'')+' '+itemsShort(o)).toLowerCase();
      if(!hay.includes(ordQ))return false;
    }
    return true;
  });
 },
 refresh(){
  const box=$('#oList');if(!box)return;
  const all=S.orders;
  const n=b=>all.filter(o=>bucketOf(o)===b).length;
  const T=[['new','Needs approval',n('new')],['open','On the way',n('open')],['done','Finished',n('done')],['cancelled','Cancelled',n('cancelled')],['all','All',all.length]];
  $('#oTabs').innerHTML=T.map(([id,t,c])=>`<button class="chip ${ordTab===id?'on':''} ${id==='new'&&c?'hot':''}" data-t="${id}">${t} <b>${c}</b></button>`).join('');
  $$('#oTabs button').forEach(b=>b.onclick=()=>{ordTab=b.dataset.t;this.refresh()});
  const KD=[['all','Both'],['delivery','Delivery'],['pickup','Pickup']];
  $('#oKind').innerHTML=KD.map(([id,t])=>`<button class="chip ${ordKind===id?'on':''}" data-k="${id}">${t}</button>`).join('');
  $$('#oKind button').forEach(b=>b.onclick=()=>{ordKind=b.dataset.k;this.refresh()});

  const L=this.list();
  if(!L.length){
    box.innerHTML=`<div class="empty card">${ic(ordQ?'search':'moped')}${ordQ?'Nothing matches that.':ordTab==='new'?'No order is waiting for approval.':S.orders.length?'Nothing here.':'No orders yet. The moment someone orders on the website, it lands here.'}</div>`;
    return;
  }
  box.innerHTML=`<div class="ocards">${L.map(o=>ordCard(o)).join('')}</div>`;
  $$('[data-o]',box).forEach(c=>c.onclick=e=>{if(e.target.closest('[data-a]'))return;orderDrawer(c.dataset.o)});
  $$('[data-a]',box).forEach(btn=>btn.onclick=e=>{
    e.stopPropagation();
    const {a,id}=btn.dataset;const o=S.omap[id];if(!o)return;
    if(a==='approve'){setStatus(id,'approved');toast('Approved',`${custName(o)} can see it is on the way`,{icon:'check',tone:'ok'})}
    if(a==='done'){setStatus(id,'delivered');toast(o.kind==='pickup'?'Marked picked up':'Marked delivered',id,{icon:'check',tone:'ok'})}
    if(a==='cancel')confirmBox('Cancel this order?',`${custName(o)} will be told it was cancelled and asked to call us.`,'Cancel the order',()=>{setStatus(id,'cancelled');toast('Order cancelled',id,{icon:'x',tone:'bad'})},true);
  });
 }
};
/* an order as a card on the board: everything needed to decide, nothing else */
function ordCard(o){
  const b=bucketOf(o),pickup=o.kind==='pickup';
  const foot=b==='new'
    ?`<button class="btn danger sm" data-a="cancel" data-id="${esc(o.id)}">${ic('x','sm')}Cancel</button>
      <button class="btn pri sm grow" data-a="approve" data-id="${esc(o.id)}">${ic('check','sm')}Approve</button>`
    :b==='open'
    ?`<button class="btn ghost sm" data-a="cancel" data-id="${esc(o.id)}">Cancel</button>
      <button class="btn pri sm grow" data-a="done" data-id="${esc(o.id)}">${ic('check','sm')}${pickup?'Picked up':'Delivered'}</button>`
    :`<span class="dim" style="font-size:12.5px">${b==='done'?(pickup?'Picked up':'Delivered')+' · '+ago(o.updated_at||o.placed_at):'Cancelled · '+ago(o.updated_at||o.placed_at)}</span>`;
  return `<article class="card oc ${b} ${isLate(o)?'late':''}" data-o="${esc(o.id)}">
   <div class="oc-h">
     <span class="mono oid">${esc(o.id)}</span>
     ${kindTag(o)}
     <span class="grow"></span>
     <span class="dim" style="font-size:12px">${t12(o.placed_at)}</span>
   </div>
   <div class="oc-c">
     <div class="av sm ${avc(custName(o))}">${ini(custName(o))}</div>
     <div class="grow" style="min-width:0"><b class="ell">${esc(custName(o))}</b>
       <small class="dim ell">${esc(phonePretty(o.phone))}${Number(o.customer_orders)>1?` · ${o.customer_orders} orders`:' · first order'}</small></div>
     <b class="num">${rs(o.total)}</b>
   </div>
   <div class="oc-i">${esc(itemsShort(o))||'—'}</div>
   ${pickup?`<div class="oc-a">${ic('bag','sm')}Collecting from the counter</div>`
     :`<div class="oc-a">${ic('pin','sm')}<span class="ell">${esc(o.address||'—')}</span></div>
       <div class="oc-a dim">${esc(o.area||'—')} · delivery ${rs(o.fee)}</div>`}
   ${o.note?`<div class="oc-n">${ic('note','sm')}${esc(o.note)}</div>`:''}
   <div class="oc-t">${payTag(o)}${b!=='new'?stTag(o):isLate(o)?`<span class="tag t-cancelled">${ic('clock','sm')}${mins(o.placed_at)} min</span>`:''}</div>
   <div class="oc-f">${foot}</div>
  </article>`;
}

/* ================= LIVE CONVERSATIONS =================
   These are the conversations happening on the website: in the chat bubble and
   on the chat-to-order page. The agent in the customer's page answers by
   itself, and every line, theirs and the agent's, is written to the database
   as it is said, which is what this page reads.

   Type a reply and the agent in their page steps aside: from then on they are
   talking to you, until you hand it back.                                   */
let chatQ='',chatFilter='all',chatPoll=null;
const whoCls={me:'c',bot:'ai',staff:'st'};
const whoName={bot:'Foodies Mania AI',staff:'Counter'};
const fmtMsg=s=>esc(s).replace(/\*([^*\n]+)\*/g,'<b>$1</b>').replace(/\n/g,'<br>');

PAGES.chats={flush:true,
 render(el,opts){
  el.style.height='100%';
  el.innerHTML=`<div class="cv" id="cv" data-pane="list">
    <div class="cv-list">
      <div class="hd"><div class="cv-tabs" id="cvTabs"></div>
       <div class="inp" style="height:40px">${ic('search')}<input id="cvQ" placeholder="Search a name or a number" aria-label="Search conversations"></div></div>
      <div class="cv-items" id="cvItems"></div>
    </div>
    <div class="cv-th" id="cvTh"></div>
   </div>`;
  $('#cvQ').oninput=e=>{chatQ=e.target.value.toLowerCase().trim();this.list()};
  if(opts.chat)openChat=opts.chat;
  if(!openChat||!S.tmap[openChat])openChat=(S.threads.find(t=>t.unread>0)||S.threads[0]||{}).device_id||null;
  this.list();this.thread();
  if(opts.chat)$('#cv').dataset.pane='th';
  clearInterval(chatPoll);
  chatPoll=setInterval(()=>{if(cur==='chats'&&openChat&&document.visibilityState==='visible')this.pull(openChat)},3000);
 },
 open(opts){if(opts.chat){openChat=opts.chat;this.list();this.thread();$('#cv').dataset.pane='th'}},
 refresh(){if($('#cvItems')){this.list();this.head()}},
 list(){
  const box=$('#cvItems');if(!box)return;
  const F=[['all','All',S.threads.length],['mine','You have it',S.threads.filter(t=>t.taken_by).length],['unread','Unread',S.threads.filter(t=>t.unread>0).length]];
  $('#cvTabs').innerHTML=F.map(([id,t,c])=>`<button class="chip ${chatFilter===id?'on':''}" data-f="${id}">${t} <b>${c}</b></button>`).join('');
  $$('#cvTabs button').forEach(b=>b.onclick=()=>{chatFilter=b.dataset.f;this.list()});
  const L=S.threads.filter(t=>{
    if(chatFilter==='mine'&&!t.taken_by)return false;
    if(chatFilter==='unread'&&!(t.unread>0))return false;
    if(chatQ&&!((t.name||'')+' '+(t.phone||'')+' '+(t.last_text||'')).toLowerCase().includes(chatQ))return false;
    return true;
  });
  box.innerHTML=L.length?L.map(t=>`<button class="ci ${t.device_id===openChat?'on':''}" data-ch="${esc(t.device_id)}">
    <div class="av sm ${avc(t.name||t.device_id)}">${ini(t.name||'?')}</div>
    <div class="grow" style="min-width:0">
     <div class="b1"><b class="ell">${esc(t.name||'Someone on the website')}</b><small>${ago(t.updated_at)}</small></div>
     <div class="pv ell">${esc((t.last_who==='staff'?'You: ':t.last_who==='bot'?'AI: ':'')+String(t.last_text||'').replace(/\*/g,''))}</div>
     <div class="tg"><span class="tag ${t.taken_by?'t-human':'t-ai'}">${t.taken_by?'You have it':'AI is answering'}</span>${t.channel==='page'?'<span class="tag">Chat page</span>':'<span class="tag">Bubble</span>'}</div>
    </div>
    ${t.unread>0?`<span class="un">${t.unread}</span>`:''}</button>`).join('')
   :`<div class="empty">${ic('chat')}${S.threads.length?'Nothing matches.':'No conversations yet. When someone opens the chat on the website, it appears here.'}</div>`;
  $$('[data-ch]',box).forEach(b=>b.onclick=()=>{openChat=b.dataset.ch;$('#cv').dataset.pane='th';this.list();this.thread()});
 },
 async pull(dev){
  try{
    const {thread,msgs=[]}=await API.get('/chats?device='+encodeURIComponent(dev));
    const had=S.msgs[dev];
    S.msgs[dev]=msgs;
    if(thread)S.tmap[dev]=Object.assign(S.tmap[dev]||{},thread);
    if(cur==='chats'&&openChat===dev&&(!had||had.length!==msgs.length))this.paint();
  }catch{}
 },
 thread(){
  const box=$('#cvTh');if(!box)return;
  if(!openChat){box.innerHTML=`<div class="empty">${ic('chat')}Pick a conversation on the left.</div>`;return}
  const t=S.tmap[openChat]||{};
  box.innerHTML=`
   <div class="hd">
     <button class="iconbtn cv-back" id="cvBack" aria-label="Back to the list">${ic('back')}</button>
     <div class="av ${avc(t.name||openChat)}">${ini(t.name||'?')}</div>
     <div class="grow" style="min-width:0"><b class="ell">${esc(t.name||'Someone on the website')}</b>
       <small class="dim" id="chSub"></small></div>
     ${t.phone?`<a class="iconbtn" href="tel:${esc(t.phone)}" aria-label="Call">${ic('phone')}</a>`:''}
     <button class="btn sm" id="chHand"></button>
   </div>
   <div class="msgs" id="chMsgs"></div>
   <form class="cmp" id="chForm">
     <div class="inp">${ic('send')}<input id="chIn" placeholder="Write to the customer" autocomplete="off" aria-label="Your reply"><button class="btn pri sm" type="submit">Send</button></div>
     <div class="hint" id="chHint"></div>
   </form>`;
  $('#cvBack').onclick=()=>{$('#cv').dataset.pane='list'};
  $('#chForm').onsubmit=async e=>{
    e.preventDefault();
    const inp=$('#chIn'),text=inp.value.trim();if(!text)return;
    inp.value='';
    (S.msgs[openChat]=S.msgs[openChat]||[]).push({id:'tmp'+Date.now(),who:'staff',text,at:new Date().toISOString()});
    this.paint();
    try{
      await API.post('/chats',{device:openChat,text,by:S.me.name});
      if(S.tmap[openChat])S.tmap[openChat].taken_by=S.me.name;
      this.pull(openChat);this.list();this.head();
    }catch(e){
      toast('That did not send',e.offline?'There is no database to send it through':'Check the connection and try again',{icon:'alert',tone:'bad'});
    }
  };
  $('#chHand').onclick=async()=>{
    const taken=!!(S.tmap[openChat]||{}).taken_by;
    if(taken){
      try{await API.post('/chats',{device:openChat,release:true});
        if(S.tmap[openChat])S.tmap[openChat].taken_by=null;
        toast('Handed back to the AI','It will answer the next message',{icon:'bot',tone:'ok'});
        this.head();this.list()}catch{}
    }else{
      $('#chIn').focus();
      toast('Just write a reply','The moment you send one, the AI steps aside',{icon:'headset'});
    }
  };
  this.head();
  if(!S.msgs[openChat])this.pull(openChat);else this.paint();
  /* opening a conversation is reading it */
  if((S.tmap[openChat]||{}).unread>0){
    S.tmap[openChat].unread=0;refreshChrome();
    API.post('/chats',{device:openChat,read:true}).catch(()=>{});
  }
 },
 head(){
  if(!openChat||!$('#chHand'))return;
  const t=S.tmap[openChat]||{};
  const taken=!!t.taken_by;
  $('#chHand').innerHTML=taken?ic('bot','sm')+'Hand back to AI':ic('headset','sm')+'Take over';
  $('#chHand').className='btn sm'+(taken?'':' pri');
  const bits=[];
  if(t.phone)bits.push(phonePretty(t.phone));
  if(Number(t.customer_orders))bits.push(t.customer_orders+' orders · '+rs(t.customer_spent));
  bits.push(t.channel==='page'?'Chat to order page':'Chat bubble');
  $('#chSub').textContent=bits.join(' · ');
  $('#chHint').innerHTML=taken?`${ic('headset','sm')}You are answering this one. The AI stays quiet until you hand it back.`
    :`${ic('bot','sm')}The AI is answering. Send a message and it steps aside for you.`;
 },
 paint(){
  const box=$('#chMsgs');if(!box)return;
  const msgs=S.msgs[openChat]||[];
  const stick=box.scrollHeight-box.scrollTop-box.clientHeight<120;
  let day='';
  box.innerHTML=msgs.length?msgs.map(m=>{
    const d=dshort(m.at);let head='';
    if(d!==day){day=d;head=`<div class="day">${esc(d===dshort(now())?'Today':d)}</div>`}
    return head+`<div class="bub ${whoCls[m.who]||'c'}">${m.who!=='me'?`<span class="who">${esc(whoName[m.who]||'')}</span>`:''}${fmtMsg(m.text)}<small>${t12(m.at)}</small></div>`;
  }).join(''):`<div class="sys">${ic('hourglass','sm')}Nothing said yet.</div>`;
  if(stick)box.scrollTop=box.scrollHeight;
 }
};

/* ================= MENU MANAGEMENT =================
   The menu itself is one file that both sites read, so nothing is edited here
   that could put the two out of step. What the counter controls is what
   changes during a night: whether something is being offered, and its price.
   Both are written to the database, and the website reads them, so switching
   an item off here sells it out on the site within seconds.                 */
let mCat='all',mQ='';
const mAvail=it=>{const r=S.menu.items[it.id];return r?r.available!==false:true};
const mCatAvail=id=>{const r=S.menu.cats[id];return r?r.available!==false:true};
const mOn=it=>mAvail(it)&&mCatAvail(it.cat);
const mPrice=it=>{const r=S.menu.items[it.id];return r&&r.price!=null?Number(r.price):it.price};
const soldTonight=()=>{const c={};tonight().forEach(o=>(o.items||[]).forEach(i=>c[i.id]=(c[i.id]||0)+(Number(i.qty)||1)));return c};

async function menuSet(id,kind,available,price){
  const bag=kind==='cat'?S.menu.cats:S.menu.items;
  const was=bag[id];
  bag[id]={item_id:id,kind,available,price:price==null?(was?was.price:null):price};
  changed();
  try{await API.post('/menu',{id,kind,available,price:bag[id].price})}
  catch(e){
    if(was)bag[id]=was;else delete bag[id];
    changed();
    toast('That did not save',e.offline?'There is no database to save it to':'Check the connection and try again',{icon:'alert',tone:'bad'});
  }
}
PAGES.menu={
 render(el){
  el.innerHTML=`<div class="toolbar">
    <div class="inp srch-in">${ic('search')}<input id="mQ" placeholder="Search the menu" aria-label="Search the menu" value="${esc(mQ)}"></div>
    <span class="dim" style="font-size:12.5px" id="mInfo"></span>
   </div>
   <div class="segs scroll" id="mCats"></div>
   <div id="catAv"></div>
   <div class="mg" id="mGrid"></div>
   <p class="dim foot-note">${ic('link','sm')}This is the same menu the website shows, read from one file. Switch something off and it sells out on the site within seconds.</p>`;
  $('#mQ').oninput=e=>{mQ=e.target.value.toLowerCase().trim();this.refresh()};
  $('#mGrid').onclick=e=>{
    const t=e.target.closest('[data-tg]');if(!t)return;
    const it=IM[t.dataset.tg];if(!it)return;
    const to=!mAvail(it);
    menuSet(it.id,'item',to,null);
    toast(to?'Back on the menu':'Taken off the menu',`${it.name}${to?' can be ordered again':' is sold out on the website now'}`,{icon:to?'check':'block',tone:to?'ok':'warn'});
  };
  $('#catAv').onclick=e=>{
    const t=e.target.closest('[data-tc]');if(!t)return;
    const c=CM[t.dataset.tc];if(!c)return;
    const to=!mCatAvail(c.id);
    menuSet(c.id,'cat',to,null);
    toast(to?`${c.name} back on`:`${c.name} switched off`,to?'The whole section can be ordered again':'The whole section is hidden on the website',{icon:to?'check':'block',tone:to?'ok':'warn'});
  };
  $('#mGrid').onchange=e=>{
    const p=e.target.closest('[data-pr]');if(!p)return;
    const it=IM[p.dataset.pr];if(!it)return;
    const v=Math.max(0,Math.round(Number(p.value)||0));
    if(!v||v===mPrice(it)){p.value=mPrice(it);return}
    menuSet(it.id,'item',mAvail(it),v);
    toast('Price changed',`${it.name} is now ${rs(v)} on the website`,{icon:'edit',tone:'ok'});
  };
  this.refresh();
 },
 refresh(){
  const grid=$('#mGrid');if(!grid)return;
  if(document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.pr)return;
  const sold=soldTonight();
  $('#mCats').innerHTML=[{id:'all',name:'Everything'},...CATS].map(c=>`<button class="chip ${mCat===c.id?'on':''} ${c.id!=='all'&&!mCatAvail(c.id)?'coff':''}" data-c="${c.id}">${esc(c.name)} <b>${c.id==='all'?ITEMS.length:ITEMS.filter(i=>i.cat===c.id).length}</b></button>`).join('');
  $$('#mCats button').forEach(b=>b.onclick=()=>{mCat=b.dataset.c;this.refresh()});
  const off=ITEMS.filter(i=>!mOn(i)).length;
  $('#mInfo').textContent=`${ITEMS.length} items · ${off} not being offered`;

  const c=mCat==='all'?null:CM[mCat];
  $('#catAv').innerHTML=c?`<div class="catone ${mCatAvail(c.id)?'':'off'}">
     <span class="food sm">${fi(CATIC[c.id]||'burger')}</span>
     <div class="t"><b>${esc(c.name)} ${mCatAvail(c.id)?'are being offered':'are switched off'}</b>
      <small>${mCatAvail(c.id)?`${ITEMS.filter(i=>i.cat===c.id&&mAvail(i)).length} of ${ITEMS.filter(i=>i.cat===c.id).length} can be ordered on the website`:`All ${ITEMS.filter(i=>i.cat===c.id).length} are hidden on the website`}</small></div>
     <button class="sw ${mCatAvail(c.id)?'on':''}" data-tc="${c.id}" role="switch" aria-checked="${mCatAvail(c.id)}" aria-label="${esc(c.name)} available"></button></div>`:'';

  const L=ITEMS.filter(i=>(mCat==='all'||i.cat===mCat)&&(!mQ||i.name.toLowerCase().includes(mQ)||(i.desc||'').toLowerCase().includes(mQ)));
  grid.innerHTML=L.length?L.map(it=>{
    const catOn=mCatAvail(it.cat),on=mAvail(it),p=mPrice(it),moved=p!==it.price;
    return `<div class="card mi ${on?'':'off'} ${catOn?'':'catoff'}">
     <div class="r1">${foodThumb(it)}<div class="grow" style="min-width:0">
       <b class="ell" style="display:block">${esc(it.name)}</b>
       <span class="dim" style="font-size:12px">${esc(catName(it.cat))} · ${sold[it.id]||0} sold tonight</span></div></div>
     <div class="r2">
       <label class="pr">Rs <input type="number" min="0" step="10" value="${p}" data-pr="${esc(it.id)}" aria-label="Price of ${esc(it.name)}"></label>
       ${moved?`<span class="tag t-new" title="The file says ${rs(it.price)}">changed</span>`:''}
       ${it.sizes?`<span class="dim" style="font-size:11.5px">smallest size</span>`:''}
       <span class="grow"></span>
       ${catOn?`<span style="font-size:12.5px" class="${on?'up':'dim'}">${on?'On':'Off'}</span>`:`<span class="offwhy">${esc(catName(it.cat))} off</span>`}
       <button class="sw ${mOn(it)?'on':''}" data-tg="${esc(it.id)}" role="switch" aria-checked="${mOn(it)}" aria-label="${esc(it.name)} available" ${catOn?'':'disabled'}></button>
     </div></div>`}).join('')
   :`<div class="empty card" style="grid-column:1/-1">${ic('search')}No item matches that.</div>`;
 }
};

/* ================= CUSTOMERS =================
   One row per phone number, which is how the restaurant already knows people.
   Everything here is counted from the orders the database holds.            */
let cQ='';
PAGES.customers={
 render(el){
  el.innerHTML=`<div class="toolbar">
    <div class="inp srch-in">${ic('search')}<input id="cQ" placeholder="Name, number or area" aria-label="Search customers" value="${esc(cQ)}"></div>
    <span class="dim" style="font-size:12.5px" id="cInfo"></span>
   </div>
   <div id="cList"></div>`;
  $('#cQ').oninput=e=>{cQ=e.target.value.toLowerCase().trim();this.refresh()};
  this.refresh();
 },
 people(){
  const m={};
  S.orders.forEach(o=>{
    if(!o.phone)return;
    const c=m[o.phone]||(m[o.phone]={phone:o.phone,name:custName(o),area:o.area,address:o.address,orders:[],spent:0,last:0,lifetime:0,lifeSpent:0});
    c.orders.push(o);
    if(bucketOf(o)!=='cancelled')c.spent+=Number(o.total)||0;
    if(ts(o.placed_at)>c.last){c.last=ts(o.placed_at);c.name=custName(o);c.area=o.area;c.address=o.address}
    c.lifetime=Math.max(c.lifetime,Number(o.customer_orders)||0);
    c.lifeSpent=Math.max(c.lifeSpent,Number(o.customer_spent)||0);
  });
  return Object.values(m).sort((a,b)=>b.last-a.last);
 },
 refresh(){
  const box=$('#cList');if(!box)return;
  const all=this.people();
  const L=all.filter(c=>!cQ||((c.name+' '+c.phone+' '+(c.area||'')).toLowerCase().includes(cQ)));
  $('#cInfo').textContent=`${all.length} ${all.length===1?'customer':'customers'}`;
  box.innerHTML=L.length?`<div class="lst cards">${L.map(c=>`<button data-c="${esc(c.phone)}">
    <div class="av ${avc(c.name)}">${ini(c.name)}</div>
    <div class="grow" style="min-width:0">
      <div class="row"><b class="ell">${esc(c.name)}</b>${(c.lifetime||c.orders.length)>=5?`<span class="tag t-vip">${ic('crown','sm')}Regular</span>`:''}</div>
      <small class="dim ell">${esc(phonePretty(c.phone))}${c.area?' · '+esc(c.area):''}</small></div>
    <div class="rt"><b class="num">${rs(c.lifeSpent||c.spent)}</b><small class="dim">${c.lifetime||c.orders.length} ${(c.lifetime||c.orders.length)===1?'order':'orders'} · ${ago(c.last)}</small></div>
   </button>`).join('')}</div>`
   :`<div class="empty card">${ic('users')}${all.length?'Nobody matches that.':'No customers yet. The first website order creates the first one.'}</div>`;
  $$('[data-c]',box).forEach(b=>b.onclick=()=>custDrawer(b.dataset.c));
 }
};
function custDrawer(phone){
  const c=PAGES.customers.people().find(x=>x.phone===phone);if(!c)return;
  const fav={};c.orders.forEach(o=>(o.items||[]).forEach(i=>fav[i.name]=(fav[i.name]||0)+(Number(i.qty)||1)));
  const top=Object.entries(fav).sort((a,b)=>b[1]-a[1]).slice(0,5);
  openDrawer(`<div class="dw-h">
    <div class="av ${avc(c.name)}">${ini(c.name)}</div>
    <div class="grow"><h3>${esc(c.name)}</h3><p>${esc(phonePretty(c.phone))}</p></div>
    <button class="iconbtn" data-close aria-label="Close">${ic('x')}</button></div>
   <div class="dw-b">
    <div class="grid g3 st">
      <div class="card kpi mini"><div class="lbl">Orders</div><div class="val num">${c.lifetime||c.orders.length}</div></div>
      <div class="card kpi mini"><div class="lbl">Spent</div><div class="val num">${rs(c.lifeSpent||c.spent)}</div></div>
      <div class="card kpi mini"><div class="lbl">Last seen</div><div class="val" style="font-size:15px">${ago(c.last)}</div></div>
    </div>
    <div class="box" style="margin-top:14px">
      <div class="dw-r"><span>Usual area</span><b>${esc(c.area||'—')}</b></div>
      <div class="dw-r"><span>Last address</span><b style="text-align:right">${esc(c.address||'—')}</b></div>
    </div>
    ${top.length?`<h4 class="dw-t">What they order</h4><div class="bars">${top.map(([n,q])=>`<div class="br"><span class="ell">${esc(n)}</span><b class="num">${q}</b><span class="tr"><i style="width:${q/top[0][1]*100}%"></i></span></div>`).join('')}</div>`:''}
    <h4 class="dw-t">Their orders</h4>
    <div class="lst">${c.orders.map(o=>ordRow(o)).join('')}</div>
   </div>
   <div class="dw-f"><a class="btn ghost grow" href="tel:${esc(c.phone)}">${ic('phone')}Call ${esc(c.name.split(' ')[0])}</a></div>`,d=>{
    $$('[data-o]',d).forEach(r=>r.onclick=()=>orderDrawer(r.dataset.o));
  });
}

/* ================= SETTINGS ================= */
let setSec='desk';
PAGES.settings={
 render(el,opts){
  if(opts.sec)setSec=opts.sec;
  const secs=[['desk','Alerts and sound','sound'],['app','Install the app','down'],['link','Website and database','link'],['biz','The restaurant','store']];
  el.innerHTML=`<div class="set"><div class="set-nav" id="setNav">${secs.map(s=>`<button data-s="${s[0]}" class="${setSec===s[0]?'on':''}">${ic(s[2])}${s[1]}</button>`).join('')}</div><div class="set-body" id="setB"></div></div>`;
  $$('#setNav button').forEach(b=>b.onclick=()=>{setSec=b.dataset.s;$$('#setNav button').forEach(x=>x.classList.toggle('on',x===b));this.body()});
  this.body();
 },
 open(opts){if(opts.sec){setSec=opts.sec;this.render($('#pg'),opts)}},
 refresh(){},
 body(){
  const B=$('#setB');if(!B)return;

  if(setSec==='desk'){
   B.innerHTML=`<div class="card"><div class="card-h"><h3>${ic('bell')}How you are told about a new order</h3></div>
     <div class="rows">
      <label class="srow"><div class="grow"><b>Pop-up on screen</b><small>A card slides in at the corner whenever something happens.</small></div><button class="sw ${S.set.pop?'on':''}" id="sPop" role="switch" aria-checked="${S.set.pop}"></button></label>
      <label class="srow"><div class="grow"><b>Chime</b><small>A short sound for a new order, so nothing is missed on a busy counter.</small></div><button class="sw ${S.set.sound?'on':''}" id="sSnd" role="switch" aria-checked="${S.set.sound}"></button></label>
      <label class="srow"><div class="grow"><b>Read the order out</b><small>The customer's name is spoken after the chime. Needs the chime on.</small></div><button class="sw ${S.set.speak?'on':''}" id="sSpk" role="switch" aria-checked="${S.set.speak}"></button></label>
     </div>
     <div class="md-f" style="padding:14px 0 0;border:0"><button class="btn ghost" id="sTest">${ic('sound')}Test it</button></div>
     <p class="dim" style="font-size:12px;margin:10px 0 0">A browser will not play a sound until the page has been clicked once. Click anywhere after opening the desk and the chime works for the rest of the shift.</p>
    </div>`;
   const tog=(id,k)=>{$(id).onclick=e=>{e.preventDefault();S.set[k]=!S.set[k];saveSet();this.body();refreshChrome()}};
   tog('#sPop','pop');tog('#sSnd','sound');tog('#sSpk','speak');
   $('#sTest').onclick=()=>{Sound.wake();Sound.alert('New order from Ahmed Khan');toast('That is the alert','A new order looks and sounds like this',{icon:'bell',tone:'warn'})};
   return;
  }

  if(setSec==='app'){
   const p=Install.platform();
   B.innerHTML=`<div class="card"><div class="card-h"><h3>${ic('down')}Keep it on the home screen</h3></div>
     <p class="muted" style="font-size:13.5px;margin:0 0 14px">Installed, the desk opens full screen with no address bar, and it is one tap from the home screen on the counter's phone or tablet.</p>
     ${Install.standalone()?`<div class="okbox">${ic('check','sm')}Already installed. You are looking at the installed app now.</div>`
      :p==='ios'?`<div class="box"><b>On an iPhone or iPad</b><ol class="steps-l"><li>Tap the Share button at the bottom of Safari.</li><li>Scroll down and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol></div>`
      :Install.can()?`<button class="btn pri" id="instBtn">${ic('down')}Install the desk</button>`
      :`<div class="box"><b>In Chrome or Edge</b><p class="dim" style="font-size:13px;margin:6px 0 0">Open the browser menu and choose <b>Install app</b>, or use the install icon in the address bar. The button appears here once the browser offers it.</p></div>`}
    </div>`;
   const ib=$('#instBtn');
   if(ib)ib.onclick=async()=>{const r=await Install.prompt();if(r==='accepted')toast('Installing','It will appear on your home screen',{icon:'check',tone:'ok'});this.body()};
   return;
  }

  if(setSec==='link'){
   const site=location.origin+'/website/';
   B.innerHTML=`<div class="card"><div class="card-h"><h3>${ic('link')}Where the orders come from</h3></div>
     <div class="rows">
      <div class="srow"><div class="grow"><b>The database</b><small>${S.offline?'Cannot be reached. The desk is listening to the browser instead, so only orders placed in this same browser will show.':'Connected. Orders, customers and conversations are coming from it.'}</small></div><span class="tag ${S.offline?'t-cancelled':'t-delivered'}">${S.offline?'Not connected':'Connected'}</span></div>
      <div class="srow"><div class="grow"><b>The website</b><small class="ell">${esc(site)}</small></div><a class="btn sm ghost" href="${esc(site)}" target="_blank" rel="noopener">${ic('expand','sm')}Open</a></div>
      <div class="srow"><div class="grow"><b>Orders on the board</b><small>${S.orders.length} in the last two days, ${tonight().length} tonight</small></div><button class="btn sm ghost" id="lkSync">${ic('sparkle','sm')}Check now</button></div>
      <div class="srow"><div class="grow"><b>Staff key</b><small>${API.key()?'Set on this computer. It is sent with every request so the desk can read the orders.':'Not needed: the owner has not locked the desk.'}</small></div><button class="btn sm ghost" id="lkKey">${API.key()?'Change':'Enter one'}</button></div>
     </div>
     <p class="dim" style="font-size:12px;margin:12px 0 0">${ic('shield','sm')}Nothing on this page holds the database password. It lives on the server, in an environment variable, and never reaches a browser.</p>
    </div>`;
   $('#lkSync').onclick=async()=>{await Sync.all();toast(S.offline?'Still no database':'Up to date',S.offline?'Check DATABASE_URL on the host':`${S.orders.length} orders, ${S.threads.length} conversations`,{icon:S.offline?'alert':'check',tone:S.offline?'bad':'ok'});this.body()};
   $('#lkKey').onclick=()=>{keyAsked=false;askKey()};
   return;
  }

  /* the restaurant: read from the same file the website reads, so there is
     nothing here to get out of step */
  B.innerHTML=`<div class="card"><div class="card-h"><h3>${ic('store')}${esc(BIZ.name||'The restaurant')}</h3></div>
    <div class="rows">
     <div class="srow"><div class="grow"><b>Open</b><small>${esc(BIZ.hours||'')}</small></div></div>
     <div class="srow"><div class="grow"><b>Phone</b><small>${esc(BIZ.phone||'')}</small></div><a class="btn sm ghost" href="tel:${esc(BIZ.phone||'')}">${ic('phone','sm')}Call</a></div>
     <div class="srow"><div class="grow"><b>Address</b><small>${esc(BIZ.addr||'')}</small></div></div>
     <div class="srow"><div class="grow"><b>Delivery</b><small>${esc(BIZ.eta||'')} · pickup ready in ${esc(BIZ.pickupEta||'')}</small></div></div>
    </div>
   </div>
   <div class="card" style="margin-top:14px"><div class="card-h"><h3>${ic('pin')}Delivery areas and fees</h3><span class="dim sp" style="font-size:12.5px">${AREAS.length} areas</span></div>
    <div class="areas">${AREAS.map(a=>`<div class="arow"><span class="ell">${esc(a.name)}</span><b class="num">${rs(a.fee)}</b></div>`).join('')}</div>
    <p class="dim" style="font-size:12px;margin:12px 0 0">${ic('note','sm')}These, the opening hours and the whole menu live in one file, <b class="mono">website/js/menu.js</b>, which both the website and this desk read. Changing it there changes it in both places at once.</p>
   </div>`;
 }
};

/* ================= the search box in the header ================= */
function wireSearch(){
  const inp=$('#srchIn'),res=$('#srchRes');
  const run=()=>{
    const q=inp.value.toLowerCase().trim();
    if(!q){res.hidden=true;return}
    const orders=S.orders.filter(o=>(o.id+' '+custName(o)+' '+o.phone+' '+(o.area||'')).toLowerCase().includes(q)).slice(0,6);
    const people=PAGES.customers.people().filter(c=>(c.name+' '+c.phone).toLowerCase().includes(q)).slice(0,4);
    res.hidden=false;
    res.innerHTML=(orders.length||people.length)?`
      ${orders.length?`<div class="sr-h">Orders</div>${orders.map(o=>`<button data-so="${esc(o.id)}"><span class="mono oid">${esc(o.id)}</span><span class="grow ell">${esc(custName(o))} · ${esc(o.kind==='pickup'?'Pickup':o.area||'')}</span><b class="num">${rs(o.total)}</b></button>`).join('')}`:''}
      ${people.length?`<div class="sr-h">Customers</div>${people.map(c=>`<button data-sc="${esc(c.phone)}"><span class="av sm ${avc(c.name)}">${ini(c.name)}</span><span class="grow ell">${esc(c.name)}</span><span class="dim">${esc(phonePretty(c.phone))}</span></button>`).join('')}`:''}`
      :`<div class="empty sm">${ic('search')}Nothing matches that.</div>`;
    $$('[data-so]',res).forEach(b=>b.onclick=()=>{res.hidden=true;inp.value='';$('#srch').classList.remove('m');orderDrawer(b.dataset.so)});
    $$('[data-sc]',res).forEach(b=>b.onclick=()=>{res.hidden=true;inp.value='';$('#srch').classList.remove('m');custDrawer(b.dataset.sc)});
  };
  inp.oninput=run;
  inp.onfocus=run;
  $('#sBtn').onclick=()=>{const s=$('#srch');s.classList.toggle('m');if(s.classList.contains('m'))inp.focus();else res.hidden=true};
  addEventListener('pointerdown',e=>{if(!e.target.closest('#srch')&&!e.target.closest('#sBtn')){res.hidden=true;$('#srch').classList.remove('m')}});
}

/* ================= signing in ================= */
/* The desk is behind the counter, so the sign-in is a formality: it keeps the
   board off the screen while a phone is being handed round. The orders
   themselves are protected on the server by STAFF_KEY, not by this.        */
function showApp(){
  $('#login').classList.add('out');
  $('#app').classList.add('on');
  buildNav();
  Reveal.init();
  go(cur,{force:true});
  Sync.start();
}
function wireLogin(){
  const rem=$('#lgRem');let keep=true;
  rem.onclick=e=>{e.preventDefault();keep=!keep;rem.classList.toggle('on',keep);rem.setAttribute('aria-checked',String(keep))};
  $('#lgEye').onclick=()=>{const p=$('#lgPw');p.type=p.type==='password'?'text':'password';$('#lgEye').innerHTML=ic(p.type==='password'?'eye':'eyeoff')};
  $('#lgForm').onsubmit=e=>{
    e.preventDefault();
    const id=$('#lgId').value.trim();
    if(id){S.me.name=id[0].toUpperCase()+id.slice(1);}
    if(keep)LS.set('in',S.me.name);
    $('#meName').textContent=S.me.name;
    $('#meAv').textContent=ini(S.me.name);
    showApp();
  };
  $('#logout').onclick=()=>{
    LS.set('in','');
    $('#app').classList.remove('on');
    $('#login').classList.remove('out');
    clearInterval(Sync.timer);clearInterval(chatPoll);
  };
  /* embers behind the sign-in panel */
  const cv=$('#embers');
  if(cv&&!reduceMotion()){
    const ctx=cv.getContext('2d');let w=0,h=0,ps=[];
    const size=()=>{w=cv.width=cv.offsetWidth;h=cv.height=cv.offsetHeight;
      ps=[...Array(Math.round(w*h/26000))].map(()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.9+.5,s:Math.random()*.32+.08,a:Math.random()*.5+.15}))};
    size();addEventListener('resize',size);
    (function draw(){
      if(!document.body.contains(cv))return;
      ctx.clearRect(0,0,w,h);
      ps.forEach(p=>{p.y-=p.s;p.x+=Math.sin(p.y/42)*.22;if(p.y<-6){p.y=h+6;p.x=Math.random()*w}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fillStyle=`rgba(244,123,32,${p.a})`;ctx.fill()});
      requestAnimationFrame(draw);
    })();
  }
}

/* ================= boot ================= */
function boot(){
  Theme.apply();Side.apply();Install.init();
  /* the installed app's shortcuts arrive as ?go=orders and the like */
  try{const g=new URL(location.href).searchParams.get('go');if(g&&NAV.some(n=>n.id===g))cur=g}catch{}
  S.me.name=LS.get('in','')||S.me.name;
  $('#meName').textContent=S.me.name;
  $('#meAv').textContent=ini(S.me.name);
  wireLogin();wireSearch();

  $('#burger').onclick=()=>{innerWidth<=1024?toggleSide(!$('#side').classList.contains('on')):Side.toggle()};
  $('#scrim').onclick=()=>{toggleSide(false);closeDrawer();closeNP()};
  $('#themeBtn').onclick=()=>Theme.toggle();
  $('#voiceBtn').onclick=()=>{Sound.wake();S.set.sound=!S.set.sound;saveSet();refreshChrome();
    toast(S.set.sound?'Sound on':'Sound off',S.set.sound?'A new order will chime':'New orders will arrive quietly',{icon:S.set.sound?'sound':'mute'})};
  $('#bellBtn').onclick=()=>{const np=$('#np');np.classList.toggle('on');if(np.classList.contains('on'))renderNP()};
  $('#npRead').onclick=()=>{S.notifs.forEach(n=>n.read=true);renderNP();refreshChrome()};
  $('#npPop').onclick=()=>{S.set.pop=!S.set.pop;saveSet();refreshChrome()};
  $('#brandBtn').ondblclick=toggleFull;
  $('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
  addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeModal();closeDrawer();closeNP();toggleSide(false)}
    if(e.key==='/'&&!/input|textarea/i.test(document.activeElement.tagName)){e.preventDefault();$('#srchIn').focus()}
  });
  addEventListener('resize',()=>Side.apply());
  /* the board is useful the moment it loads, so it starts fetching before
     anyone signs in */
  Sync.all();
  if(LS.get('in',''))showApp();
}
boot();
