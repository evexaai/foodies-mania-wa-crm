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
      /* the channel never calls the tab it was posted from, so this tab is
         told separately: the order strip goes up the moment an order leaves */
      emit({type:'sent',id:order.id});
      return order;
    },
    status(id){return read(SK,{})[id]||null},
    mine(){return read(MK,[])},
    on(fn){subs.add(fn);return()=>subs.delete(fn)}
  };
})();

/* What the customer is told at each stage, in one place: the order page, the
   chat ticket and the agent's answers all read it from here.
   Until the restaurant approves, the customer is told exactly that, because
   nothing is promised yet. After that the two kinds part ways: a delivery
   travels to the customer, a pickup waits at the counter. */
const FM_STAGES={
  queued:   {n:0,t:'Waiting for approval',s:'Sent to Foodies Mania, the counter approves it in a moment'},
  new:      {n:1,t:'Waiting for approval',s:'The restaurant is checking your order'},
  approved: {n:2,t:'Approved',s:'Approved by the restaurant, it is going to the kitchen'},
  preparing:{n:3,t:'Cooking',s:'Your food is on the stove'},
  ready:    {n:4,t:'Packed',s:'Packed and waiting for a rider'},
  out:      {n:5,t:'On the way',s:'At your door soon'},
  delivered:{n:6,t:'Delivered',s:'Enjoy, and have some more!'},
  cancelled:{n:-1,t:'Cancelled',s:'Sorry, this order was cancelled, please call us'}
};
const fmStage=(st,pickup)=>{const x={...(FM_STAGES[st]||FM_STAGES.queued)};
  if(pickup){
    if(st==='approved')x.s=`Approved by the restaurant, ready at the counter in about ${FM_BIZ.pickupEta}`;
    if(st==='ready'){x.t='Ready for pickup';x.s='Come and collect it from our F.B. Area counter'}
    if(st==='delivered'){x.t='Collected';x.s='Enjoy, and have some more!'}
  }else if(st==='approved')x.s=`Approved by the restaurant, at your door in about ${FM_BIZ.eta}`;
  return x};
