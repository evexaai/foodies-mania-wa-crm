"use strict";
/* ================= one cart for the menu, the widget and the chat page =================
   Kept in localStorage, so an item added by the AI in the chat bubble is in the
   cart drawer too, and survives a reload.                                       */
const Cart=(()=>{
  const K='fm.cart';
  let lines=[];try{lines=JSON.parse(localStorage.getItem(K))||[]}catch{}
  lines=lines.filter(l=>FM_BYID[l.id]);
  const subs=new Set();
  const save=()=>{try{localStorage.setItem(K,JSON.stringify(lines))}catch{};subs.forEach(f=>f())};
  const keyOf=(id,size)=>id+'|'+(size||'');
  const priceOf=(id,size)=>{const it=FM_BYID[id];if(!it)return 0;if(it.sizes&&size){const s=it.sizes.find(x=>x[0]===size);if(s)return s[1]}return it.price};
  addEventListener('storage',e=>{if(e.key===K){try{lines=JSON.parse(e.newValue)||[]}catch{lines=[]}subs.forEach(f=>f())}});
  return {
    priceOf,
    lines:()=>lines.map(l=>({...l,item:FM_BYID[l.id],price:priceOf(l.id,l.size),label:FM_BYID[l.id].name+(l.size?' ('+l.size+')':'')})),
    add(id,size,qty=1,note=''){const it=FM_BYID[id];if(!it)return;if(it.sizes&&!size)size=it.sizes[0][0];
      const k=keyOf(id,size);const ex=lines.find(l=>keyOf(l.id,l.size)===k);
      if(ex){ex.qty+=qty;if(note)ex.note=note}else lines.push({id,size:size||'',qty,note});save()},
    setQty(id,size,qty){const k=keyOf(id,size);const ex=lines.find(l=>keyOf(l.id,l.size)===k);if(!ex)return;
      if(qty<=0)lines=lines.filter(l=>l!==ex);else ex.qty=qty;save()},
    remove(id,size){lines=lines.filter(l=>size===undefined?l.id!==id:keyOf(l.id,l.size)!==keyOf(id,size));save()},
    clear(){lines=[];save()},
    count:()=>lines.reduce((a,l)=>a+l.qty,0),
    subtotal:()=>lines.reduce((a,l)=>a+priceOf(l.id,l.size)*l.qty,0),
    on(fn){subs.add(fn);return()=>subs.delete(fn)},
    /* the order lines the CRM receives */
    orderLines:()=>lines.map(l=>{const it=FM_BYID[l.id];return {id:l.id,name:it.name,size:l.size||'',cat:it.crm||FM_CRM_CAT[it.cat]||it.cat,price:priceOf(l.id,l.size),qty:l.qty,note:l.note||''}})
  };
})();
