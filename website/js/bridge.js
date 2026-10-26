"use strict";
/* ================= the line between the website and the CRM =================
   Both live on the same origin, so they talk through the browser:
     website → CRM : an order is queued in localStorage (fm.web.queue) and
                     announced on the BroadcastChannel "fm-web". The CRM takes
                     it the moment it hears it, or on its next start.
     CRM → website : every status change is written to fm.web.status and
                     announced on the same channel, so the customer's tracker
                     moves while the counter works the order.
   When a real backend arrives, send() and the status feed are the only two
   things to swap for API calls.                                              */
const Bridge=(()=>{
  const QK='fm.web.queue',SK='fm.web.status',MK='fm.web.mine';
  const ch=('BroadcastChannel' in window)?new BroadcastChannel('fm-web'):null;
  const subs=new Set();
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
  const emit=msg=>subs.forEach(f=>{try{f(msg)}catch(e){console.error(e)}});
  if(ch)ch.onmessage=e=>emit(e.data);
  /* another tab wrote the status map: tell this tab too */
  addEventListener('storage',e=>{if(e.key===SK)emit({type:'status-all'})});

  const newId=()=>'FMW-'+(Date.now()%1e6).toString().padStart(6,'0');
  return {
    newId,
    /* order: {id,src,type,name,phone,area,addr,fee,pay,txn,note,items:[{id,name,size,cat,price,qty,note}],subtotal,total} */
    send(order){
      order.placed=Date.now();
      const q=read(QK,[]);q.push(order);write(QK,q);
      const mine=read(MK,[]);mine.unshift({id:order.id,placed:order.placed,total:order.total,type:order.type,items:order.items.map(i=>i.qty+'× '+i.name+(i.size?' ('+i.size+')':''))});
      write(MK,mine.slice(0,20));
      ch&&ch.postMessage({type:'order',order});
      return order;
    },
    status(id){return read(SK,{})[id]||null},
    mine(){return read(MK,[])},
    on(fn){subs.add(fn);return()=>subs.delete(fn)}
  };
})();

/* the stages a customer sees, in the CRM's own words */
const FM_STAGES={
  queued:   {n:0,t:'Sent to Foodies Mania',s:'Waiting for the counter to pick it up'},
  new:      {n:1,t:'Received',s:'The counter is checking your order'},
  approved: {n:2,t:'Confirmed',s:'Your order is in the kitchen queue'},
  preparing:{n:2,t:'Cooking',s:'The kitchen is making it right now'},
  ready:    {n:3,t:'Ready',s:'Packed and waiting for a rider'},
  out:      {n:4,t:'On the way',s:'Your rider is heading to you'},
  delivered:{n:5,t:'Delivered',s:'Enjoy, and have some more!'},
  cancelled:{n:-1,t:'Cancelled',s:'Sorry, this order was cancelled. Please call us.'}
};
const fmStage=(st,pickup)=>{const x={...(FM_STAGES[st]||FM_STAGES.queued)};
  if(pickup&&st==='ready'){x.t='Ready for pickup';x.s='Come and collect it from the counter'}
  if(pickup&&st==='delivered'){x.t='Collected';x.s='Enjoy, and have some more!'}
  return x};
