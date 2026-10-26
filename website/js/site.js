"use strict";
/* ================= Foodies Mania website ================= */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];

/* ---------- delivery or pickup ----------
   A two-way switch in the header. Delivery is the default; the area (and so
   the fee) is chosen at checkout, never in a popup. */
const Mode={
  get(){let m=null;try{m=JSON.parse(localStorage.getItem('fm.mode'))}catch{}return m&&m.type?m:{type:'delivery',area:''}},
  set(m){try{localStorage.setItem('fm.mode',JSON.stringify(m))}catch{};paintMode();drawCart()},
  fee(){const m=this.get();if(m.type!=='delivery'||!m.area)return 0;return (FM_AREAS.find(a=>a.name===m.area)||{fee:200}).fee}
};
function paintMode(){const m=Mode.get();
  $$('#modeSw [data-mode]').forEach(b=>{const on=b.dataset.mode===m.type;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)});
  const on=$('#modeSw .on'),th=$('#modeThumb');if(on&&th){th.style.width=on.offsetWidth+'px';th.style.transform=`translateX(${on.offsetLeft-th.offsetLeft}px)`}}
function pickMode(type){const m=Mode.get();if(m.type===type)return;Mode.set({type,area:m.area});
  toast(type==='pickup'?`Pickup from our F.B. Area counter · ready in ~${FM_BIZ.pickupEta}`:`Delivery across Karachi · ${FM_BIZ.eta}`)}

/* ---------- open now? 3 PM to 5 AM ---------- */
function openNow(){const h=new Date().getHours();return h>=FM_BIZ.open||h<FM_BIZ.close}
function paintOpen(){const o=openNow();$('#openTxt').textContent=o?'Open now · till 5 AM':'Opens today at 3 PM · order ahead';$('.hero .live-dot').classList.toggle('off',!o)}

/* ---------- toasts ---------- */
function toast(text,img){const t=document.createElement('div');t.className='toast';t.innerHTML=`${img?`<img src="${img}" alt="">`:''}<span>${text}</span>`;
  $('#toasts').appendChild(t);setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),300)},2400)}

/* ---------- overlays ---------- */
let lastFocus=null;
/* while a dialog or the cart is open the page behind stays still */
function lockPage(on){document.body.classList.toggle('locked',on);document.body.style.overflow=on?'hidden':'';if(window.lenis)on?lenis.stop():lenis.start()}
function openModal(html,wire){lastFocus=document.activeElement;$('#modalCard').innerHTML=html;$('#modal').classList.add('on');$('#modal').setAttribute('aria-hidden','false');$('#scrim').classList.add('on');lockPage(true);
  $$('[data-close]',$('#modalCard')).forEach(b=>b.onclick=closeModal);wire&&wire($('#modalCard'));$('#modalCard').scrollTop=0;
  setTimeout(()=>{const f=$('#modalCard input:not([type=radio]),#modalCard button');f&&f.focus({preventScroll:true})},60)}
function closeModal(){$('#modal').classList.remove('on');$('#modal').setAttribute('aria-hidden','true');if(!$('#drawer').classList.contains('on')){$('#scrim').classList.remove('on');lockPage(false)}lastFocus&&lastFocus.focus&&lastFocus.focus({preventScroll:true})}
function openDrawer(){drawCart();$('#drawer').classList.add('on');$('#drawer').setAttribute('aria-hidden','false');$('#scrim').classList.add('on');lockPage(true)}
function closeDrawer(){$('#drawer').classList.remove('on');$('#drawer').setAttribute('aria-hidden','true');if(!$('#modal').classList.contains('on')){$('#scrim').classList.remove('on');lockPage(false)}}

/* ---------- the menu ---------- */
const tagCls=t=>/spicy/i.test(t)?'spicy':/best|popular|must/i.test(t)?'hot':'';
const qtyIn=id=>Cart.lines().filter(l=>l.id===id).reduce((a,l)=>a+l.qty,0);
function cardHtml(it,i=0){
  const q=qtyIn(it.id);
  const ctl=it.sizes?`<button class="add" data-open="${it.id}">${q?q+' in cart · ':''}Choose</button>`
    :q?`<div class="stepper" data-step="${it.id}"><button data-d="-1" aria-label="Remove one">−</button><span>${q}</span><button data-d="1" aria-label="Add one">+</button></div>`
    :`<button class="add" data-add="${it.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg>Add</button>`;
  return `<article class="card rv" style="--d:${(i%4)*.07}s" data-item="${it.id}" data-name="${esc((it.name+' '+(it.alias||[]).join(' ')+' '+it.desc).toLowerCase())}">
    <div class="card-img">${it.tag?`<span class="tag ${tagCls(it.tag)}">${esc(it.tag)}</span>`:''}<img src="${fmImg(it.img,'-s')}" alt="${esc(it.name)}" loading="lazy" decoding="async" width="480" height="360"></div>
    <div class="card-b"><h3>${esc(it.name)}</h3><p>${esc(it.desc)}</p>
    <div class="card-f"><span class="price">${it.sizes?'<small>from</small>':''}${fmRs(it.price)}</span><span class="ctl">${ctl}</span></div></div></article>`}
function drawMenu(){
  $('#cats').innerHTML=`<span class="cat-ind" id="catInd"></span>`+FM_CATS.map((c,i)=>`<a class="cat${i===0?' on':''}" href="#cat-${c.id}" data-cat="${c.id}">${c.name}</a>`).join('');
  $('#sections').innerHTML=FM_CATS.map((c,n)=>{const items=FM_ITEMS.filter(i=>i.cat===c.id);
    return `<section class="sec${c.id==='deal'?' deals':''}" id="cat-${c.id}" data-sec="${c.id}"><div class="sec-h rv"><span class="sec-n">${String(n+1).padStart(2,'0')}</span><h2>${c.name}</h2><small>${items.length} items</small></div><div class="grid">${items.map(cardHtml).join('')}</div></section>`}).join('');
  reveal();requestAnimationFrame(moveInd)}
/* the gradient pill glides to the section on screen */
function moveInd(){const a=$('.cat.on'),ind=$('#catInd');if(!a||!ind)return;ind.style.width=a.offsetWidth+'px';ind.style.transform=`translateX(${a.offsetLeft}px)`}
function refreshCtl(id){$$(`.card[data-item="${id}"]`).forEach(card=>{const tmp=document.createElement('div');tmp.innerHTML=cardHtml(FM_BYID[id]);card.querySelector('.ctl').replaceWith(tmp.querySelector('.ctl'))})}
function reveal(){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -40px'});$$('.rv:not(.in)').forEach(el=>io.observe(el))}

/* scrollspy: the motion loop decides which section is under the bar */
function setCat(cur){
  $$('.cat').forEach(a=>{const on=a.dataset.cat===cur;if(on===a.classList.contains('on'))return;a.classList.toggle('on',on);
    if(on){moveInd();const c=$('#cats');c.scrollTo({left:a.offsetLeft-c.offsetWidth/2+a.offsetWidth/2,behavior:'smooth'})}})}

function search(q){q=q.trim().toLowerCase();let any=false;
  $$('.sec').forEach(s=>{let n=0;$$('.card',s).forEach(c=>{const hit=!q||q.split(/\s+/).every(w=>c.dataset.name.includes(w));c.hidden=!hit;if(hit)n++});s.hidden=!n;if(n)any=true});
  $('#emptyQ').hidden=any;$('#emptyQt').textContent=q;$$('.rv').forEach(e=>e.classList.add('in'));window.remeasure&&remeasure()}

/* ---------- one dish: sizes, quantity, a note ---------- */
function itemModal(id){
  const it=FM_BYID[id];let size=it.sizes?it.sizes[0][0]:'';let qty=1;
  const price=()=>Cart.priceOf(id,size)*qty;
  openModal(`<div class="m-img"><img src="${fmImg(it.img)}" alt="${esc(it.name)}" decoding="async"><button class="x" data-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <div class="m-b"><h3>${esc(it.name)}</h3><p>${esc(it.desc)}</p>
    ${it.sizes?`<div class="opt-h">Choose size<small>Required</small></div><div class="opts">${it.sizes.map((s,i)=>`<label class="opt${i===0?' on':''}"><input type="radio" name="sz" value="${esc(s[0])}"${i===0?' checked':''}><b>${esc(s[0])}</b><span>${fmRs(s[1])}</span></label>`).join('')}</div>`:''}
    <div class="field"><label for="inote">Special instructions <span style="color:var(--dim)">(optional)</span></label><textarea id="inote" placeholder="e.g. extra spicy, no onion"></textarea></div></div>
    <div class="m-f"><div class="stepper" id="mq"><button data-d="-1" aria-label="Less">−</button><span>1</span><button data-d="1" aria-label="More">+</button></div><button class="btn pri lg grow" id="madd">Add to cart · <span id="mp">${fmRs(price())}</span></button></div>`,el=>{
    $$('input[name=sz]',el).forEach(r=>r.onchange=()=>{size=r.value;$$('.opt',el).forEach(o=>o.classList.toggle('on',o.contains(r)));$('#mp').textContent=fmRs(price())});
    $('#mq',el).onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;qty=Math.max(1,qty+ +b.dataset.d);$('#mq span',el).textContent=qty;$('#mp').textContent=fmRs(price())};
    $('#madd',el).onclick=()=>{Cart.add(id,size,qty,$('#inote',el).value.trim());closeModal();toast(`Added ${qty}× ${it.name}${size?' ('+size+')':''}`,fmImg(it.img))};
  })}

/* ---------- cart ---------- */
function drawCart(){
  const L=Cart.lines(),sub=Cart.subtotal(),m=Mode.get(),fee=Mode.fee(),n=Cart.count();
  $('#cartN').hidden=!n;$('#cartN').textContent=n;const dn=$('#dkN');dn.hidden=!n;if(dn.textContent!=String(n)){dn.textContent=n;dn.classList.remove('pop');void dn.offsetWidth;dn.classList.add('pop')}
  document.body.classList.toggle('has-cart',!!n);
  $('#drawer').innerHTML=`<div class="dw-h"><h3 class="grow">Your order</h3>${n?`<button class="btn" style="height:36px;padding:0 14px;font-size:13px" id="clr">Clear</button>`:''}<button class="x" id="dwX" aria-label="Close cart"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
   <div class="dw-b">${n?L.map(l=>`<div class="line"><img src="${fmImg(l.item.img,'-s')}" alt="" decoding="async"><div class="grow"><b>${esc(l.label)}</b>${l.note?`<small>“${esc(l.note)}”</small><br>`:''}<small>${fmRs(l.price)} each</small><br>
     <div class="mini-step" data-id="${l.id}" data-sz="${esc(l.size)}"><button data-d="-1" aria-label="Remove one">−</button><span>${l.qty}</span><button data-d="1" aria-label="Add one">+</button></div></div><span class="lp">${fmRs(l.price*l.qty)}</span></div>`).join('')
     :`<div class="empty"><div class="big"></div><p>Your cart is empty.<br>Add something delicious.</p></div>`}</div>
   ${n?`<div class="dw-f"><div class="kv tot"><span>Subtotal</span><span>${fmRs(sub)}</span></div><p class="hint">Delivery or pickup is chosen at checkout</p>
     <button class="btn pri lg block" id="toCheckout">Checkout</button></div>`:''}`;
  $('#dwX').onclick=closeDrawer;
  $('#clr')&&($('#clr').onclick=()=>Cart.clear());
  $$('.mini-step').forEach(s=>s.onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;const l=L.find(x=>x.id===s.dataset.id&&x.size===s.dataset.sz);Cart.setQty(l.id,l.size,l.qty+ +b.dataset.d)});
  $('#toCheckout')&&($('#toCheckout').onclick=()=>{closeDrawer();setTimeout(()=>checkout(),220)});
}

/* ---------- checkout ---------- */
/* `keep` carries what was typed when the switch or the area re-draws the form */
function checkout(keep){
  if(!Cart.count())return;
  const m=Mode.get();let me={};try{me=JSON.parse(localStorage.getItem('fm.me'))||{}}catch{}
  if(!keep&&m.type==='delivery'&&!m.area&&me.area&&FM_AREAS.some(a=>a.name===me.area)){Mode.set({type:'delivery',area:me.area});return checkout()}
  const v=keep||{name:me.name||'',phone:me.phone||'',addr:me.area===m.area?me.addr||'':'',note:'',pay:'COD',txn:'',shot:''};
  let pay=v.pay,txn=v.txn||'',shot=v.shot||'';const del=m.type==='delivery';
  const total=()=>Cart.subtotal()+Mode.fee();
  const payInfo=()=>{const p=FM_PAY.find(x=>x.id===pay);if(pay==='COD')return `<div class="paybox">${del?'Pay the rider in cash when your food arrives.':'Pay in cash at the counter when you collect.'}</div>`;
    return `<div class="paybox" id="payBox">Send <b>${fmRs(total())}</b> to<br><b>${p.name}</b> · ${p.acct}<br>${p.title}<span class="demo">DEMO</span>
      <div class="field" style="margin-top:12px"><label for="ctxn">Transaction ID</label><input id="ctxn" value="${esc(txn)}" placeholder="From your ${p.name} receipt" autocomplete="off"></div>
      <div class="or">or</div>
      <label class="shot${shot?' has':''}" id="shotL"><input type="file" id="cshot" accept="image/*" hidden><span class="sq">${shot?`<img src="${shot}" alt="Payment screenshot">`:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>'}</span><span class="grow"><b>${shot?'Screenshot attached':'Upload payment screenshot'}</b><small>${shot?'Tap to change it':'PNG or JPG from your banking app'}</small></span></label>
      <p class="pay-err">Add the transaction ID or upload the payment screenshot</p></div>`};
  /* a phone screenshot is shrunk before it is sent: ~1000px JPEG */
  const squeeze=f=>new Promise((res,rej)=>{const r=new FileReader();r.onerror=rej;r.onload=()=>{const im=new Image();im.onerror=rej;im.onload=()=>{const k=Math.min(1,1000/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.72))};im.src=r.result};r.readAsDataURL(f)});
  const wirePay=el=>{const t=$('#ctxn',el),f=$('#cshot',el);if(!t)return;
    t.oninput=()=>{txn=t.value;$('#payBox',el).classList.remove('bad')};
    f.onchange=async()=>{const file=f.files[0];if(!file)return;try{shot=await squeeze(file);$('#payInfo',el).innerHTML=payInfo();wirePay(el)}catch{toast('That file could not be read. Try a PNG or JPG.')}}};
  openModal(`<div class="m-h"><h3 class="grow">Checkout</h3><button class="x" data-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
   <div class="m-b" style="padding-top:6px">
    <div class="seg2" id="ctype"><button data-t="delivery" class="${del?'on':''}"><b>Delivery</b><small>${FM_BIZ.eta} across Karachi</small></button><button data-t="pickup" class="${del?'':'on'}"><b>Pickup</b><small>Ready in ~${FM_BIZ.pickupEta}</small></button></div>
    ${del?`<div class="field" id="fAr"><label for="carea">Your area</label><select id="carea"><option value="">Select your area</option>${FM_AREAS.map(a=>`<option${a.name===m.area?' selected':''} value="${esc(a.name)}">${esc(a.name)} · ${fmRs(a.fee)} delivery</option>`).join('')}</select><span class="err">Please choose your area</span></div>`
      :`<div class="paybox"><b>Foodies Mania, F.B. Area</b><br>${FM_BIZ.addr}<br>${FM_BIZ.hours}</div>`}
    <div class="row2"><div class="field" id="fN"><label for="cname">Your name</label><input id="cname" autocomplete="name" value="${esc(v.name)}" placeholder="Full name"><span class="err">Please enter your name</span></div>
    <div class="field" id="fP"><label for="cphone">Mobile number</label><input id="cphone" type="tel" inputmode="tel" autocomplete="tel" value="${esc(v.phone)}" placeholder="03xx xxxxxxx"><span class="err">Enter an 11-digit number starting with 03</span></div></div>
    ${del?`<div class="field" id="fA"><label for="caddr">Full address${m.area?' in '+esc(m.area):''}</label><input id="caddr" autocomplete="street-address" value="${esc(v.addr)}" placeholder="House, street, block, nearby landmark"><span class="err">Please enter your address</span></div>`:''}
    <div class="field"><label for="cnote">Note for the kitchen <span style="color:var(--dim)">(optional)</span></label><input id="cnote" value="${esc(v.note)}" placeholder="e.g. less spicy, extra ketchup"></div>
    <div class="opt-h">Payment</div>
    <div class="opts">${FM_PAY.map(p=>`<label class="opt${p.id===pay?' on':''}"><input type="radio" name="pay" value="${p.id}"${p.id===pay?' checked':''}><b>${p.id==='COD'?(del?'Cash on Delivery':'Cash at counter'):p.name}</b><span>${p.id==='COD'?'Cash':'Online'}</span></label>`).join('')}</div>
    <div id="payInfo">${payInfo()}</div>
    <div style="display:grid;gap:8px;margin:20px 0 4px">${Cart.lines().map(l=>`<div class="kv"><span>${l.qty}× ${esc(l.label)}</span><span>${fmRs(l.price*l.qty)}</span></div>`).join('')}
     <div class="kv" style="border-top:1px dashed var(--line2);padding-top:8px"><span>Subtotal</span><span>${fmRs(Cart.subtotal())}</span></div><div class="kv"><span>${del?(m.area?'Delivery · '+esc(m.area):'Delivery'):'Pickup'}</span><span>${del?(m.area?fmRs(Mode.fee()):'Choose area'):'Free'}</span></div>
     <div class="kv tot"><span>Total</span><span>${fmRs(total())}</span></div></div></div>
   <div class="m-f"><button class="btn pri lg block" id="place">Place order · ${fmRs(total())}</button></div>`,el=>{
    const grab=()=>({name:$('#cname',el).value,phone:$('#cphone',el).value,addr:del?$('#caddr',el).value:v.addr,note:$('#cnote',el).value,pay,txn,shot});
    wirePay(el);
    $$('#ctype [data-t]',el).forEach(b=>b.onclick=()=>{if(b.dataset.t===m.type)return;Mode.set({type:b.dataset.t,area:m.area});checkout(grab())});
    $('#carea',el)&&($('#carea',el).onchange=e=>{Mode.set({type:'delivery',area:e.target.value});checkout(grab())});
    $$('input[name=pay]',el).forEach(r=>r.onchange=()=>{pay=r.value;$$('.opt',el).forEach(o=>o.classList.toggle('on',o.contains(r)));$('#payInfo',el).innerHTML=payInfo();wirePay(el)});
    $('#place',el).onclick=()=>{
      const name=$('#cname',el).value.trim(),dg=$('#cphone',el).value.replace(/\D/g,'').replace(/^92/,'0'),addr=del?$('#caddr',el).value.trim():'';
      if(del)$('#fAr',el).classList.toggle('bad',!m.area);
      $('#fN',el).classList.toggle('bad',name.length<2);$('#fP',el).classList.toggle('bad',!/^03\d{9}$/.test(dg));if(del)$('#fA',el).classList.toggle('bad',addr.length<6);
      const bad=$('.field.bad',el);if(bad){bad.querySelector('input,select').focus();return}
      if(pay!=='COD'&&!txn.trim()&&!shot){const b=$('#payBox',el);b.classList.add('bad');b.scrollIntoView({block:'center',behavior:'smooth'});$('#ctxn',el).focus({preventScroll:true});return}
      const phone=dg.slice(0,4)+' '+dg.slice(4);
      const order=Bridge.send({id:Bridge.newId(),src:'web',type:m.type,name,phone,area:del?m.area:'Pickup',addr:del?addr:'Pickup from F.B. Area counter',fee:Mode.fee(),pay,txn:pay==='COD'?'':txn.trim(),shot:pay==='COD'?'':shot,note:$('#cnote',el).value.trim(),
        items:Cart.orderLines(),subtotal:Cart.subtotal(),total:total()});
      try{localStorage.setItem('fm.me',JSON.stringify({name,phone,area:del?m.area:me.area,addr:del?addr:me.addr}))}catch{}
      Cart.clear();tracker(order.id,true)};
  })}

/* ---------- live tracker: follows the CRM ---------- */
let trackOff=null;
function tracker(id,fresh){
  const mine=Bridge.mine().find(o=>o.id===id)||{};const pickup=mine.type==='pickup';
  const steps=pickup?[['new','1','Received'],['approved','2','Confirmed'],['preparing','3','Cooking'],['ready','4','Ready for pickup'],['delivered','5','Collected']]
    :[['new','1','Received'],['approved','2','Confirmed'],['preparing','3','Cooking'],['out','4','On the way'],['delivered','5','Delivered']];
  const order=['queued','new','approved','preparing','ready','out','delivered'];
  const paint=()=>{const s=Bridge.status(id);const st=s?s.status:'queued';const g=fmStage(st,pickup);const el=$('#trk');if(!el)return;
    const si=order.indexOf(st);const next=steps.findIndex(x=>order.indexOf(x[0])>si);
    el.innerHTML=st==='cancelled'?`<div class="note-crm" style="color:var(--bad)">${g.s}</div>`:
      `<div class="steps">${steps.map((x,k)=>{const i=order.indexOf(x[0]);const done=si>=i;const cur=k===next;
        return `<div class="step ${done?'done':''} ${cur?'cur':''}"><span class="dot">${done?'✓':x[1]}</span><div><b>${x[2]}</b><small>${x[0]===st||(cur&&!steps.some(y=>y[0]===st))?g.s:''}${x[0]==='out'&&s&&s.rider&&si>=i?' · Rider '+esc(s.rider.split(' ')[0]):''}</small></div></div>`}).join('')}</div>
       ${st==='queued'?`<div class="note-crm">Demo: the order is waiting in the Foodies Mania CRM. Open the CRM (<a href="../" target="_blank" style="color:var(--or2)">localhost</a>) and sign in to see it arrive and move it along.</div>`:''}`};
  openModal(`<div class="m-h"><div class="grow">${fresh?'<p class="kicker">Order placed</p>':''}<h3>${fresh?'Shukriya!':'Your order'}</h3><div class="trk-id">${id} · ${mine.total?fmRs(mine.total):''}</div></div><button class="x" data-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
    <div class="track"><div id="trk"></div>${mine.items?`<div class="note-crm" style="color:var(--mut)">${mine.items.map(esc).join(' · ')}</div>`:''}</div>
    <div class="m-f"><a class="btn block" href="order-chat.html">Questions? Chat with us</a></div>`,()=>paint());
  trackOff&&trackOff();trackOff=Bridge.on(m=>{if((m.type==='status'&&m.id===id)||m.type==='status-all'||m.type==='ack')paint()});
}
function myOrders(){
  const L=Bridge.mine();
  if(L.length===1)return tracker(L[0].id);
  openModal(`<div class="m-h"><h3 class="grow">Track your order</h3><button class="x" data-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
   <div class="myo">${L.length?L.map(o=>{const s=Bridge.status(o.id);const st=s?s.status:'queued';const g=fmStage(st,o.type==='pickup');
     return `<button data-o="${o.id}"><span><b>${o.id}</b><br><small style="color:var(--mut)">${new Date(o.placed).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})} · ${fmRs(o.total)}</small></span><span class="pill ${st==='delivered'?'ok':st==='cancelled'?'bad':''}">${g.t}</span></button>`}).join('')
     :`<div class="empty"><div class="big"></div><p>No orders on this device yet.</p></div>`}</div>`,el=>$$('[data-o]',el).forEach(b=>b.onclick=()=>tracker(b.dataset.o)))}

/* ---------- hero slider ---------- */
const HERO=[
  [['Crispy. Cheesy.','*Have some more.'],'Hand-breaded zingers, loaded pizzas and charcoal BBQ from F.B. Area, delivered hot across Karachi until 5 AM.'],
  [['The cheese pull','*you came for.'],'30+ pizzas from Rs 350: Fajita, Tikka, Peri Peri and our Foodies Specials, baked fresh to order.'],
  [['Off the coals,','*straight to you.'],'Seekh, malai boti and Bihari tikka, charcoal-grilled every night with hot paratha.']];
/* each line clips its words, and each word rises in turn; "*" marks the gradient line */
const heroLines=lines=>{let k=0;return lines.map(l=>{const g=l[0]==='*';const words=(g?l.slice(1):l).split(' ');
  return `<span class="ln">${words.map(w=>`<span class="w" style="animation-delay:${.08+(k++)*.07}s">${g?`<em>${esc(w)}</em>`:esc(w)}</span>`).join(' ')}</span>`}).join('')};
let slide=0,slideT=null;
function goSlide(i){slide=(i+HERO.length)%HERO.length;$$('.slide').forEach((s,k)=>s.classList.toggle('on',k===slide));$$('#dots button').forEach((d,k)=>d.classList.toggle('on',k===slide));
  $('#heroH').innerHTML=heroLines(HERO[slide][0]);const p=$('#heroP');p.textContent=HERO[slide][1];p.style.animation='none';void p.offsetWidth;p.style.animation='';clearTimeout(slideT);slideT=setTimeout(()=>goSlide(slide+1),6500)}

/* ---------- chat widget ---------- */
let chat=null,unread=0;
function widget(){
  const cw=$('#cw');const agent=new Agent('widget');
  chat=ChatUI({log:$('#cwLog'),quick:$('#cwQuick'),form:$('#cwForm'),input:$('#cwIn'),agent,key:'fm.chatlog.widget',
    onBot:m=>{if(!cw.classList.contains('on')){unread++;let b=$('.cw-badge');if(!b){b=document.createElement('span');b.className='cw-badge';$('#cwBubble').appendChild(b)}b.textContent=unread}}});
  const open=on=>{cw.classList.toggle('on',on);$('#cwPanel').setAttribute('aria-hidden',String(!on));if(on){cw.classList.add('seen');unread=0;$('.cw-badge')&&$('.cw-badge').remove();chat.start();chat.redraw();setTimeout(()=>innerWidth>720&&$('#cwIn').focus(),250)}};
  $('#cwBubble').onclick=()=>open(!cw.classList.contains('on'));$('#cwX').onclick=()=>open(false);
  setTimeout(()=>{if(!cw.classList.contains('on')&&!cw.classList.contains('seen'))$('#cwHint').classList.add('on');setTimeout(()=>$('#cwHint').classList.remove('on'),6000)},3500);
}

/* ---------- instagram strip ---------- */
function insta(){
  const rows=[['b-mighty','p-fajita','q-seekh','f-pizzafries','x-lava','r-zinger','s-crust','d-bbq5'],['q-tikka','b-chek','p-tikka','x-dynamite','s-calzone','q-malaiboti','b-smash','f-garlicc']];
  const tile=id=>{const it=FM_BYID[id];return `<a href="${FM_BIZ.insta}" target="_blank" rel="noopener" aria-label="${esc(it.name)} on Instagram"><img src="${fmImg(it.img,'-s')}" alt="${esc(it.name)}" loading="lazy" decoding="async"></a>`};
  $('#iwall').innerHTML=rows.map((r,i)=>`<div class="iw-row" data-dir="${i?1:-1}">${r.concat(r).map(tile).join('')}</div>`).join('')}

/* ================= motion =================
   Lenis smooths the wheel (touch stays native: a phone already scrolls well).
   Everything that moves with the scroll is measured once (and again on resize
   or when the page grows), then one frame loop only *writes* transforms. No
   layout is read inside the loop, which is what keeps it smooth.
   The operating system's "reduce motion" setting is honoured: with it on, the
   page scrolls natively and nothing drifts. */
const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
const LEGENDS=['b-zinger','b-mighty','f-pizzafries','x-lava','p-fajita'];

function legends(){
  $('#lgTrack').innerHTML=LEGENDS.map((id,i)=>{const it=FM_BYID[id];
    return `<article class="lg-card" data-legend="${id}"><img src="${fmImg(it.img)}" alt="${esc(it.name)}" loading="lazy" decoding="async"><span class="lg-num">${String(i+1).padStart(2,'0')}</span>
      <div class="lg-info"><h3>${esc(it.name)}</h3><p>${esc(it.desc)}</p><div class="lg-row"><span class="price">${it.sizes?'<small>from</small>':''}${fmRs(it.price)}</span><button class="btn pri">${it.sizes?'Choose':'Add to order'}</button></div></div></article>`}).join('');
  $('#lgTrack').onclick=e=>{const c=e.target.closest('[data-legend]');if(!c)return;const it=FM_BYID[c.dataset.legend];
    if(it.sizes||!e.target.closest('.btn'))return itemModal(it.id);Cart.add(it.id,'',1);toast(`Added ${it.name}`,fmImg(it.img))};
}

/* sparks rising off the grill: one pre-drawn glow sprite, stamped with additive light */
function embers(){
  if(calm)return;const c=$('#embers'),x=c.getContext('2d');let W,H;const P=[];const d=1;
  const spr=document.createElement('canvas');spr.width=spr.height=32;const sx=spr.getContext('2d');
  const g=sx.createRadialGradient(16,16,0,16,16,16);g.addColorStop(0,'rgba(255,214,150,1)');g.addColorStop(.25,'rgba(255,150,60,.9)');g.addColorStop(1,'rgba(244,90,20,0)');sx.fillStyle=g;sx.fillRect(0,0,32,32);
  const size=()=>{W=c.width=c.offsetWidth*d;H=c.height=c.offsetHeight*d};size();addEventListener('resize',size);
  const spawn=y=>({x:Math.random()*W,y:y??H+Math.random()*H*.2,r:(Math.random()*3+3)*d,v:(Math.random()*.5+.25)*d,w:Math.random()*7,a:Math.random()*.6+.35});
  for(let i=0;i<(innerWidth<720?22:40);i++)P.push(spawn(Math.random()*H));
  let on=true;new IntersectionObserver(es=>on=es[0].isIntersecting).observe(c);
  const tick=()=>{if(on&&!document.hidden){x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
    for(const p of P){p.y-=p.v;p.w+=.02;p.x+=Math.sin(p.w)*.35;const life=p.y/H;
      x.globalAlpha=p.a*Math.max(0,Math.min(1,life*1.6));x.drawImage(spr,p.x-p.r,p.y-p.r,p.r*2,p.r*2);
      if(p.y<-20)Object.assign(p,spawn())}}
    requestAnimationFrame(tick)};tick();
}

/* the phone in the promo types out a conversation when it comes into view */
function phone(){
  const ms=$$('#phB .ph-m'),ty=$('#phB .ph-typing');let played=false;
  const play=()=>{if(played)return;played=true;
    ms.forEach((m,i)=>{const t=i*1100+(m.classList.contains('bot')?500:0);
      if(m.classList.contains('bot'))setTimeout(()=>ty.classList.add('in'),t-700);
      setTimeout(()=>{ty.classList.remove('in');m.classList.add('in')},t)});
    setTimeout(()=>ty.classList.add('in'),ms.length*1100+400)};
  if(calm)return ms.forEach(m=>m.classList.add('in'));
  new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&play()),{threshold:.35}).observe($('#phone'));
  if(fine){const st=$('#phoneStage'),ph=$('#phone');
    st.addEventListener('pointermove',e=>{const r=st.getBoundingClientRect();const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;ph.style.transform=`rotateY(${px*22}deg) rotateX(${-py*16}deg)`});
    st.addEventListener('pointerleave',()=>ph.style.transform='')}
}

/* desktop only: cards light up under the cursor and the main buttons lean toward it */
function pointerFx(){
  if(!fine||calm)return;
  $('#sections').addEventListener('pointermove',e=>{const c=e.target.closest('.card');if(!c)return;const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')},{passive:true});
  document.addEventListener('pointermove',e=>{const b=e.target.closest('.btn.pri.lg,.cart-btn');if(!b)return;const r=b.getBoundingClientRect();
    b.style.translate=`${(e.clientX-r.left-r.width/2)*.22}px ${(e.clientY-r.top-r.height/2)*.3}px`;b.onpointerleave=()=>b.style.translate=''},{passive:true});
}

function motion(){
  legends();embers();phone();pointerFx();
  if(window.Lenis&&!calm){window.lenis=new Lenis({lerp:.12,smoothWheel:true,wheelMultiplier:1});
    requestAnimationFrame(function raf(t){lenis.raf(t);requestAnimationFrame(raf)})}
  /* in-page links glide, and land below the header and the category bar */
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"],[data-top]');if(!a||a.hasAttribute('data-track'))return;
    const h=a.hasAttribute('data-top')?'#top':a.getAttribute('href');if(h==='#')return;e.preventDefault();
    const t=h==='#top'?0:$(h);if(t===null)return;const off=-(($('#top').offsetHeight)+(t&&t.closest&&t.closest('#menu')&&t.id!=='menu'?$('#catsBar').offsetHeight:0))+1;
    if(window.lenis)lenis.scrollTo(t,{offset:t===0?0:off,duration:1.4});else if(t===0)scrollTo({top:0,behavior:'smooth'});else scrollTo({top:t.getBoundingClientRect().top+scrollY+off,behavior:'smooth'})});

  const hero=$('#hero'),slides=$('#slides'),heroIn=$('#heroIn'),top=$('#top'),lgSec=$('#legends'),lgTrack=$('#lgTrack'),lgBar=$('#lgBar'),ins=$('.insta'),mq=$('.marquee'),bar=$('#catsBar');
  /* marquees loop seamlessly: repeat the words until a row is over twice the screen */
  /* marquees and the Instagram wall glide on their own (CSS, on the graphics card):
     fill each row to over twice the screen, then set a speed in pixels per second */
  $$('.mq-t').forEach(el=>{const one=el.innerHTML;for(let i=0;i<8&&el.scrollWidth<innerWidth*2.2;i++)el.innerHTML+=one;el.innerHTML+=el.innerHTML});
  const speed=()=>{$$('.mq-t').forEach(el=>el.style.setProperty('--dur',(el.scrollWidth/2/70).toFixed(1)+'s'));};
  /* the Instagram rows slide against each other as you scroll (eased, so a wheel notch glides) */
  const iw=$$('.iw-row').map(el=>({el,dir:+el.dataset.dir,w:1,x:null}));
  const cards=$$('.lg-card',lgTrack);
  const M={};const docTop=el=>el.getBoundingClientRect().top+scrollY;
  function measure(){
    M.vw=innerWidth;M.vh=innerHeight;M.heroH=hero.offsetHeight;
    speed();iw.forEach(r=>r.w=r.el.scrollWidth/2);M.menuTop=docTop($('#menu'));M.menuBot=M.menuTop+$('#menu').offsetHeight;
    M.lgOn=innerWidth>900;M.lgTop=docTop(lgSec);M.lgLen=Math.max(1,lgSec.offsetHeight-innerHeight);
    M.lgMax=Math.max(0,lgTrack.scrollWidth-innerWidth+Math.max(28,(innerWidth-1280)/2+28));
    M.cX=cards.map(c=>c.offsetLeft+c.offsetWidth/2);M.cW=cards[0]?cards[0].offsetWidth:0;
    M.insTop=docTop(ins);M.insH=ins.offsetHeight;
    M.secs=$$('.sec').filter(x=>!x.hidden).map(x=>({id:x.dataset.sec,top:docTop(x)}));
    M.spyLine=top.offsetHeight+bar.offsetHeight+30;
    last.y=-1;
  }
  const last={y:-1,solid:null,cur:null,dk:null};
  window.remeasure=()=>requestAnimationFrame(measure);
  addEventListener('resize',()=>{measure();moveInd();paintMode()});
  addEventListener('load',measure);
  let ro=null;new ResizeObserver(()=>{clearTimeout(ro);ro=setTimeout(measure,150)}).observe($('#sections'));
  measure();

  let t0=performance.now(),vel=0,prevY=scrollY;
  if(window.lenis)lenis.on('scroll',l=>vel=l.velocity);
  const loop=t=>{
    const dt=Math.min(64,t-t0);t0=t;
    const y=window.lenis?lenis.scroll:scrollY;if(!window.lenis){vel=y-prevY;prevY=y}
    const moved=y!==last.y;
    /* header: frosted glass once you leave the top */
    const solid=y>40;if(solid!==last.solid){top.classList.toggle('solid',solid);last.solid=solid}
    if(moved){
      /* the category pill follows the section under the bar */
      let cur=M.secs.length?M.secs[0].id:null;for(const x of M.secs)if(x.top-y<=M.spyLine)cur=x.id;
      if(cur!==last.cur){last.cur=cur;setCat(cur)}
      /* the dock lights Menu while you are in the menu, Home elsewhere */
      const dk=y+M.vh*.5>M.menuTop&&y+M.vh*.5<M.menuBot?'menu':'home';
      if(dk!==last.dk){last.dk=dk;$$('#dock [data-dk]').forEach(a=>a.classList.toggle('on',a.dataset.dk===dk))}
    }
    if(!calm){
      /* hero: the photo sinks slower than the page, the words drift up and fade */
      if(moved&&y<M.heroH+50){const k=Math.min(y,M.heroH);slides.style.transform=`translate3d(0,${k*.35}px,0) scale(${1+k/4000})`;heroIn.style.transform=`translate3d(0,${k*-.12}px,0)`;heroIn.style.opacity=Math.max(0,1-k/(M.heroH*.7))}
      /* instagram wall: position follows the scroll, eased toward it every frame */
      const iy=y-M.insTop+M.vh;if(iy>-200&&iy<M.insH+M.vh+200)iw.forEach(r=>{const tgt=(r.dir>0?-r.w/2:0)+iy*.35*r.dir;if(r.x===null)r.x=tgt;const d=tgt-r.x;if(Math.abs(d)<.1&&r.el.style.transform)return;r.x+=d*Math.min(1,dt*.012);r.el.style.transform=`translate3d(${r.x.toFixed(1)}px,0,0)`});
      /* legends: pinned while scrolling down slides the track sideways */
      if(moved&&M.lgOn&&y+M.vh>M.lgTop&&y<M.lgTop+M.lgLen+M.vh){const p=Math.max(0,Math.min(1,(y-M.lgTop)/M.lgLen));const tx=-p*M.lgMax;
        lgTrack.style.transform=`translate3d(${tx.toFixed(1)}px,0,0)`;lgBar.style.transform=`scaleX(${p})`;
        cards.forEach((c,i)=>{const k=Math.max(-1,Math.min(1,(M.cX[i]+tx-M.vw/2)/M.vw));c.firstElementChild.style.transform=`translate3d(${(k*-.1*M.cW).toFixed(1)}px,0,0)`})}
    }
    last.y=y;requestAnimationFrame(loop)};
  requestAnimationFrame(loop);
}
/* ---------- boot ---------- */
function boot(){
  drawMenu();paintMode();paintOpen();drawCart();insta();widget();
  $('#yr').textContent=new Date().getFullYear();
  Cart.on(()=>{drawCart();FM_ITEMS.forEach(it=>refreshCtl(it.id));$('#cartBtn').classList.remove('bump');void $('#cartBtn').offsetWidth;$('#cartBtn').classList.add('bump')});
  $('#sections').addEventListener('click',e=>{
    const add=e.target.closest('[data-add]'),op=e.target.closest('[data-open]'),st=e.target.closest('[data-step] [data-d]');
    if(add){e.stopPropagation();const it=FM_BYID[add.dataset.add];Cart.add(it.id,'',1);toast(`Added ${it.name}`,fmImg(it.img));return}
    if(st){e.stopPropagation();const id=st.closest('[data-step]').dataset.step;const l=Cart.lines().find(x=>x.id===id);Cart.setQty(id,l.size,l.qty+ +st.dataset.d);return}
    if(op){e.stopPropagation();itemModal(op.dataset.open);return}
    const card=e.target.closest('[data-item]');if(card)itemModal(card.dataset.item)});
  $('#cartBtn').onclick=openDrawer;$('#dkCart').onclick=openDrawer;
  $('#modeSw').onclick=e=>{const b=e.target.closest('[data-mode]');if(b)pickMode(b.dataset.mode)};
  $('#scrim').onclick=()=>{closeModal();closeDrawer()};
  $('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeDrawer()}});
  $$('[data-track]').forEach(a=>a.onclick=e=>{e.preventDefault();myOrders()});
  $('#dots').onclick=e=>{const b=e.target.closest('button');if(b)goSlide($$('#dots button').indexOf(b))};
  $('#q').oninput=e=>search(e.target.value);
  $('#cats').onclick=e=>{const a=e.target.closest('.cat');if(!a)return;if($('#q').value){$('#q').value='';search('')}};
  motion();
  /* the curtain lifts once the hero photo is ready (or after a moment, whichever is first) */
  const lift=()=>{if(document.body.classList.contains('ready'))return;document.body.classList.add('ready');goSlide(0);paintMode()};
  const hi=$('.slide.on img');Promise.race([hi.decode?hi.decode().catch(()=>{}):Promise.resolve(),new Promise(r=>setTimeout(r,1600))]).then(()=>setTimeout(lift,calm?0:650));
  setInterval(paintOpen,60000);
  /* #track=FMW-123456 opens that order's tracker (the chat links here) */
  const m=location.hash.match(/track=([\w-]+)/);if(m)setTimeout(()=>tracker(m[1]),900);
}
boot();
