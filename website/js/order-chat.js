"use strict";
/* ================= order by chat ================= */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const mobile=()=>matchMedia('(max-width:1100px)').matches;
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- kitchen open? ---------- */
function paintOpen(){const h=new Date().getHours(),o=h>=FM_BIZ.open||h<FM_BIZ.close;
  $('#openTxt').textContent=o?'Kitchen open · till 5 AM':'Opens at 3 PM · order ahead';$('#openDot').classList.toggle('off',!o)}

/* ---------- sparks rising off the grill ---------- */
function embers(){
  if(calm)return;const c=$('#embers'),x=c.getContext('2d');let W,H,P=[];
  const size=()=>{const d=Math.min(devicePixelRatio||1,2);W=c.width=innerWidth*d;H=c.height=innerHeight*d};size();addEventListener('resize',size);
  const N=innerWidth<720?26:48;
  const spawn=(y)=>({x:Math.random()*W,y:y??H+Math.random()*H*.2,r:(Math.random()*1.8+.6)*(devicePixelRatio||1),v:Math.random()*.6+.25,w:Math.random()*Math.PI*2,a:Math.random()*.6+.3,h:20+Math.random()*25});
  for(let i=0;i<N;i++)P.push(spawn(Math.random()*H));
  const tick=()=>{if(!document.hidden){x.clearRect(0,0,W,H);
    const boost=document.body.classList.contains('thinking')?2.2:1;
    for(const p of P){p.y-=p.v*boost*(devicePixelRatio||1);p.w+=.02;p.x+=Math.sin(p.w)*.4;
      const life=p.y/H;x.beginPath();x.fillStyle=`hsla(${p.h},100%,${55+life*15}%,${p.a*Math.min(1,life*1.6)})`;x.shadowColor='rgba(255,140,40,.9)';x.shadowBlur=8;x.arc(p.x,p.y,p.r,0,7);x.fill();
      if(p.y<-10)Object.assign(p,spawn())}}
    requestAnimationFrame(tick)};tick();
}

/* ---------- the intro: an orb, a headline, cravings to tap ---------- */
const CRAVE=[
  {i:'🌶️',t:'Something spicy',s:'Bring the fire',img:17121731,send:'Something spicy'},
  {i:'🧀',t:'Cheese overload',s:'Lava, pulls & crusts',img:3727243,send:'Cheese overload'},
  {i:'🎉',t:'Feed the squad',s:'Feasts & big deals',img:31372162,send:'Feast for the squad'},
  {i:'💸',t:'Under Rs 1,000',s:'Big taste, small bill',img:4669262,send:'Deals under Rs 1000'}];
function intro(){
  const h=new Date().getHours();const when=h>=21||h<5?'tonight':h>=15?'this evening':'today';
  return `<div class="orb"><img src="assets/logo.webp" alt="Foodies Mania"></div>
    <h1>What are you <em>craving</em><br>${when}?</h1>
    <p>Just tell us, like you’d tell a friend. In English or Roman Urdu, we’ll build your order and send it straight to the kitchen.</p>
    <div class="crave">${CRAVE.map(c=>`<button data-send="${esc(c.send)}"><img src="${fmImg(c.img,'-s')}" alt="" loading="lazy" decoding="async"><span><b>${c.t}</b><small>${c.s}</small></span></button>`).join('')}</div>`}

/* ---------- the kitchen ticket ---------- */
const LK='fm.oc.last';
let last=null;try{last=JSON.parse(localStorage.getItem(LK))}catch{}
let freshStamp=false;const printed=new Set();const keyOf=l=>l.id+'|'+l.size;
function placed(id){last={id,t:Date.now()};try{localStorage.setItem(LK,JSON.stringify(last))}catch{};freshStamp=true;draw()}
const lastMine=()=>last&&Bridge.mine().find(o=>o.id===last.id);
const lastLive=()=>{if(!last||Date.now()-last.t>6*3600e3)return false;const s=Bridge.status(last.id);return !s||!['delivered','cancelled'].includes(s.status)};
const t12=ts=>new Date(ts).toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true});
const head=sub=>`<div class="tk-h"><img src="assets/logo.webp" alt=""><b>Foodies Mania</b><small>${sub}</small></div>`;

function trackerHtml(o){
  const pk=o.type==='pickup';const s=Bridge.status(o.id);const st=s?s.status:'queued';const g=fmStage(st,pk);
  if(st==='cancelled')return `<p style="color:#c2410c;font-size:12.5px;padding:8px 0">${g.s}</p>`;
  const steps=pk?[['new','1','Received'],['approved','2','Confirmed'],['preparing','3','Cooking'],['ready','4','Ready for pickup'],['delivered','5','Collected']]
    :[['new','1','Received'],['approved','2','Confirmed'],['preparing','3','Cooking'],['out','4','On the way'],['delivered','5','Delivered']];
  const order=['queued','new','approved','preparing','ready','out','delivered'];const si=order.indexOf(st);const next=steps.findIndex(x=>order.indexOf(x[0])>si);
  return `<div class="trk">${steps.map((x,k)=>{const done=si>=order.indexOf(x[0]);const cur=k===next;
    return `<div class="trk-s ${done?'done':''} ${cur?'cur':''}"><span class="d">${done?'✓':x[1]}</span><div><b>${x[2]}</b>${x[0]===st||(cur&&!steps.some(y=>y[0]===st))?`<small>${g.s}${x[0]==='out'&&s&&s.rider?' · '+esc(s.rider.split(' ')[0]):''}</small>`:''}</div></div>`}).join('')}</div>`}

function draw(){
  const L=Cart.lines(),n=Cart.count(),tk=$('#tk');let html='';
  if(n){
    const live=lastLive()&&lastMine();
    html=head('Kitchen ticket · draft')+`<div class="tk-meta"><span>DRAFT</span><span>${t12(Date.now())}</span></div>`+
      (live?`<div class="tk-last" style="margin-top:10px">🔥 <span>Order <b>${live.id}</b> is ${fmStage((Bridge.status(live.id)||{}).status||'queued',live.type==='pickup').t.toLowerCase()}</span></div>`:'')+
      `<div class="tk-lines">${L.map(l=>`<div class="tk-line${printed.has(keyOf(l))?'':' new'}" data-k="${l.id}|${esc(l.size)}"><img src="${fmImg(l.item.img,'-s')}" alt="" decoding="async"><div class="nm">${esc(l.item.name)}${l.size?`<small>${esc(l.size)}</small>`:''}<div class="tk-q" data-id="${l.id}" data-sz="${esc(l.size)}"><button data-d="-1" aria-label="One less">−</button><span>${l.qty}</span><button data-d="1" aria-label="One more">+</button></div></div><span class="pr">${fmRs(l.price*l.qty)}</span></div>`).join('')}</div>
      <div class="tk-tot"><div class="r"><span>${n} item${n>1?'s':''}</span><span>Delivery fee at checkout</span></div><div class="big"><small>Subtotal</small><span>${fmRs(Cart.subtotal())}</span></div></div>
      <button class="tk-go" id="tkGo">Send to kitchen <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      <div class="tk-bar"></div><div class="tk-foot">Have some more!</div>`;
  }else if(last&&lastMine()&&Date.now()-last.t<6*3600e3){
    const o=lastMine();
    html=head('Kitchen ticket')+`<div class="tk-meta"><span>${o.id}</span><span>${t12(o.placed)}</span></div>
      <div class="tk-lines">${o.items.map(i=>`<div class="tk-line" style="grid-template-columns:1fr"><div class="nm">${esc(i)}</div></div>`).join('')}</div>
      <div class="tk-tot"><div class="big"><small>${o.type==='pickup'?'Pickup':'Delivery'}</small><span>${fmRs(o.total)}</span></div></div>
      <div class="stamp${freshStamp?' slam':''}">Sent to kitchen</div>${trackerHtml(o)}
      <button class="tk-again" id="tkAgain">Order something else</button><div class="tk-bar"></div><div class="tk-foot">Thank you · have some more!</div>`;
    freshStamp=false;
  }else{
    html=head('Kitchen ticket')+`<div class="tk-empty"><div class="plate">🍽️</div><b>Your plate is empty</b><p>Tell us what you want and it prints here, line by line.</p><span class="eg">“2 zinger aur ek large fajita pizza”</span></div><div class="tk-bar"></div><div class="tk-foot">Foodies Mania · F.B. Area</div>`;
  }
  tk.innerHTML=html;L.forEach(l=>printed.add(keyOf(l)));
  $$('.tk-q',tk).forEach(q=>q.onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;const l=L.find(x=>x.id===q.dataset.id&&x.size===q.dataset.sz);Cart.setQty(l.id,l.size,l.qty+ +b.dataset.d)});
  $('#tkGo')&&($('#tkGo').onclick=()=>ui.send('Checkout'));
  $('#tkAgain')&&($('#tkAgain').onclick=()=>$('#in').focus());
}

/* ---------- a dish flies from the chat onto the ticket ---------- */
let snap={};
function flyAdds(){
  const now={};Cart.lines().forEach(l=>now[keyOf(l)]=l.qty);
  const added=Object.keys(now).filter(k=>now[k]>(snap[k]||0));snap=now;
  if(calm||mobile()||!added.length)return;
  added.forEach((k,i)=>{const id=k.split('|')[0];const it=FM_BYID[id];
    const src=[...$$(`#log [data-add="${id}"]`)].pop()?.closest('.mc')?.querySelector('img')||$$('#log .msg.me').pop()||$('#in');
    const dst=$(`.tk-line[data-k="${CSS.escape(k)}"] img`)||$('#ticket');
    if(!src||!dst)return;
    const a=src.getBoundingClientRect(),b=dst.getBoundingClientRect();
    const f=document.createElement('img');f.src=fmImg(it.img);f.className='fly';document.body.appendChild(f);
    const sx=a.left+a.width/2-32,sy=a.top+a.height/2-32,ex=b.left+b.width/2-32,ey=b.top+b.height/2-32;
    f.animate([{transform:`translate(${sx}px,${sy}px) scale(.4)`,opacity:0},{transform:`translate(${sx}px,${sy-30}px) scale(1)`,opacity:1,offset:.15},
      {transform:`translate(${(sx+ex)/2}px,${Math.min(sy,ey)-120}px) scale(1.1) rotate(180deg)`,offset:.55},{transform:`translate(${ex}px,${ey}px) scale(.5) rotate(360deg)`,opacity:.2}],
      {duration:900,delay:i*120,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'}).onfinish=()=>{f.remove();const t=$('#ticket');t.classList.remove('bump');void t.offsetWidth;t.classList.add('bump')};
  });
}

/* ---------- on phones: the receipt inside the chat, once the order is confirmed ---------- */
let freshRcpt=null;
function receipt(id){
  const o=Bridge.mine().find(x=>x.id===id);if(!o)return '';
  const slam=freshRcpt===null&&last&&last.id===id&&Date.now()-last.t<4000;
  return `<div class="tk-in">${head('Kitchen ticket')}<div class="tk-meta"><span>${esc(o.id)}</span><span>${t12(o.placed)}</span></div>
    <div class="tk-lines">${o.items.map(i=>`<div class="tk-line" style="grid-template-columns:1fr"><div class="nm">${esc(i)}</div></div>`).join('')}</div>
    <div class="tk-tot"><div class="big"><small>${o.type==='pickup'?'Pickup':'Delivery'}</small><span>${fmRs(o.total)}</span></div></div>
    <div class="stamp${slam?' slam':''}">Sent to kitchen</div>${trackerHtml(o)}</div><div class="tk-edge bot"></div>`}
const repaintReceipts=()=>$$('#log .rcpt').forEach(el=>{freshRcpt=el.dataset.o;el.innerHTML=receipt(el.dataset.o)});

/* ---------- the chat ---------- */
const agent=new Agent('chat');
const ui=ChatUI({log:$('#log'),quick:$('#quick'),form:$('#form'),input:$('#in'),agent,key:'fm.chatlog.chat',intro,
  extra:m=>m.order?`<div class="rcpt" data-o="${esc(m.order)}">${receipt(m.order)}</div>`:'',
  onTyping:on=>document.body.classList.toggle('thinking',on),
  onBot:m=>{if(m.order)placed(m.order)}});

/* ---------- wire it up ---------- */
snap={};Cart.lines().forEach(l=>snap[keyOf(l)]=l.qty);
Cart.on(()=>{draw();requestAnimationFrame(flyAdds)});
Bridge.on(m=>{if(m.type==='status'||m.type==='status-all'){draw();repaintReceipts()}});
$('#menuBtn').onclick=()=>ui.send('Menu');
$('#newChat').onclick=()=>ui.reset();
paintOpen();setInterval(paintOpen,60000);embers();draw();ui.start();
if(!mobile())$('#in').focus({preventScroll:true});
