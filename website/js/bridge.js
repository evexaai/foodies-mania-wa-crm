"use strict";
/* ================= the line between the website and the counter =============
   An order leaves this page by two roads at once, and either one alone is
   enough:

     the database  POST /api/order writes the customer and the order into Neon,
                   keyed by phone number. The dashboard reads from there, so an
                   order survives a closed tab, a different computer, a reboot.
                   Nothing goes out again until it is written; an order placed
                   with no signal waits in an outbox and goes when there is one.

     the browser   the same order is queued in localStorage and announced on a
                   BroadcastChannel, which is how the demo works with no
                   database behind it at all.

   Coming back, the customer is told one thing: whether the restaurant has
   taken the order on. They never sign in. This browser keeps a device id, the
   order carries it, and the server only ever hands back orders bearing the id
   it was asked with, so an order number on its own opens nothing.           */
const Bridge=(()=>{
  const QK='fm.web.queue',SK='fm.web.status',MK='fm.web.mine',OB='fm.web.outbox',DK='fm.device';
  const ch=('BroadcastChannel' in window)?new BroadcastChannel('fm-web'):null;
  const subs=new Set();
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const emit=msg=>subs.forEach(f=>{try{f(msg)}catch(e){console.error(e)}});
  if(ch)ch.onmessage=e=>emit(e.data);
  /* another tab wrote the status map: tell this tab too */
  addEventListener('storage',e=>{if(e.key===SK)emit({type:'status-all'})});

  /* this device: made once, kept, and never shown to anyone */
  const device=(()=>{let d='';try{d=localStorage.getItem(DK)||''}catch{}
    if(!d){d='fmd-'+((self.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,10));
      try{localStorage.setItem(DK,d)}catch{}}
    return d})();

  let live=true;                       /* false once the server says it has no database */
  const outbox=()=>read(OB,[]);
  async function drain(){
    if(!live)return;
    const q=outbox();if(!q.length)return;
    const left=[];
    for(const o of q){
      try{
        const r=await fetch('/api/order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...o,device})});
        if(r.status===503){live=false;return}            /* no database: the demo carries on */
        if(r.status>=400&&r.status<500)continue;          /* the server will never accept it */
        if(!r.ok)throw new Error(r.status);
        emit({type:'saved',id:o.id});
      }catch{left.push(o)}                                /* no signal: try again next time */
    }
    write(OB,left);
  }
  /* what the restaurant has done with this device's orders */
  async function pull(){
    if(!live)return;
    try{
      const r=await fetch('/api/order?device='+encodeURIComponent(device),{headers:{accept:'application/json'}});
      if(r.status===503){live=false;return}
      if(!r.ok)return;
      const {orders=[]}=await r.json();
      const map=read(SK,{});let moved=false;
      orders.forEach(o=>{
        const was=map[o.id];
        if(!was||was.status!==o.status){map[o.id]={type:'status',id:o.id,status:o.status,pickup:o.kind==='pickup',t:Date.now()};moved=true}
      });
      if(moved){write(SK,map);emit({type:'status-all'})}
    }catch{}
  }
  const beat=()=>{if(document.visibilityState!=='visible')return;drain();pull()};
  addEventListener('visibilitychange',beat);addEventListener('online',beat);
  setTimeout(beat,600);setInterval(beat,8000);

  const newId=()=>'FMW-'+(Date.now()%1e6).toString().padStart(6,'0');
  return {
    newId,device,
    /* order: {id,src,type,name,phone,area,addr,fee,pay,txn,note,items:[{id,name,size,cat,price,qty,note}],subtotal,total} */
    send(order){
      order.placed=Date.now();
      const q=read(QK,[]);q.push(order);write(QK,q);
      const mine=read(MK,[]);mine.unshift({id:order.id,placed:order.placed,total:order.total,type:order.type,items:order.items.map(i=>i.qty+'× '+i.name+(i.size?' ('+i.size+')':''))});
      write(MK,mine.slice(0,20));
      write(OB,[...outbox(),order].slice(-20));
      ch&&ch.postMessage({type:'order',order});
      /* the channel never calls the tab it was posted from, so this tab is
         told separately: the order strip goes up the moment an order leaves */
      emit({type:'sent',id:order.id});
      drain();
      return order;
    },
    status(id){return read(SK,{})[id]||null},
    mine(){return read(MK,[])},
    on(fn){subs.add(fn);return()=>subs.delete(fn)}
  };
})();

/* What the customer is shown, in one place: the order card, the chat ticket and
   the agent's answers all read it from here.
   A customer is told one thing, because one thing is what they need: has the
   restaurant taken the order on, or not yet. What happens after that, the
   kitchen queue, the rider, the handover, is the counter's business and lives
   on the dashboard. */
const FM_TAKEN=['approved','preparing','ready','out','delivered'];
const fmStage=(st,pickup)=>{
  if(st==='cancelled')return{ok:false,gone:true,t:'Cancelled',s:'Sorry, this order was cancelled, please call us'};
  if(FM_TAKEN.includes(st))return{ok:true,t:'Approved by the restaurant',
    s:pickup?`Ready at our F.B. Area counter in about ${FM_BIZ.pickupEta}`:`At your door in about ${FM_BIZ.eta}`};
  return{ok:false,t:'Waiting for approval',s:'The restaurant is checking your order'};
};
