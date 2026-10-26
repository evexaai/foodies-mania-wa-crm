"use strict";
/* ================= the order-taking agent (demo brain) =================
   Shared by the chat bubble on the website and the chat-to-order page.
   It speaks English or Roman Urdu, whichever the customer writes in, the same
   way the CRM's WhatsApp agent does.

   Today the brain is rules: it reads the menu in menu.js, finds the dishes,
   quantities and sizes in what the customer typed, and walks them through
   delivery or pickup, their details, payment and a confirm. When the LLM is
   connected, think() is the one method to replace: send the transcript, the
   cart and the menu to the model, and act on the tool calls it returns
   (add_to_cart, remove_from_cart, set_details, place_order). Everything
   around it (cart, CRM hand-off, tracking) stays as it is.

   A reply is a list of messages: {text, quick?:[labels], items?:[ids], summary?:true}
   *bold* and line breaks are rendered by the chat UI, WhatsApp-style.       */

/* ---------- reading what the customer typed ---------- */
const NUMW={ek:1,one:1,a:1,an:1,do:2,two:2,teen:3,three:3,char:4,chaar:4,four:4,panch:5,paanch:5,five:5,chay:6,che:6,six:6,saat:7,seven:7,aath:8,eight:8,nau:9,nine:9,das:10,ten:10};
const SIZEW={cheese:'With cheese',single:'Single scoop',double:'Double scoop',small:'Small',sm:'Small',chota:'Small',chhota:'Small',choti:'Small',chhoti:'Small',medium:'Medium',med:'Medium',regular:'Medium',normal:'Medium',
  large:'Large',lg:'Large',bara:'Large',bari:'Large',bada:'Large',badi:'Large',chest:'Chest',leg:'Leg',
  sz345:'345ml',sz500:'500ml',sz1l:'1 Ltr',sz15l:'1.5 Ltr',sz2pc:'2 pcs',sz4pc:'4 pcs'};
const FILLER=new Set(['x','pcs','pc','piece','pieces','wala','wali','wale','of','the','plate','plates','pls','please','plz','mujhe','mujhay','chahiye','chahye','add','and','aur','or','bhi','with','me','i','want','need','order','karna','karo','kar','do','dein','de','get','give']);
const GENERIC={pizza:['p-fajita','p-tikka','sp-peri','p-cheese','sp-butter','s-crust'],burger:['b-zinger','b-mighty','b-smash','b-chek','b-bbqsmoke','b-chicken'],
  roll:['r-zinger','r-malai','r-boti','r-mayo','r-beefboti','x-french'],deal:['d-family','d-block','d-couple','d-one','d-jumper','d-bbq5'],
  bbq:['q-tikka','q-malaiboti','q-seekh','q-behari','q-reshmi','q-paratha'],drink:['k-cold','j-lemonmint','m-mango','i-coffee','j-orange','k-water'],fries:['f-pizzafries','f-mayo','f-plain','f-garlicc'],
  juice:['j-orange','j-annar','j-tarbooz','j-lemonmint','j-margarita','j-pinacolada'],shake:['m-mango','m-oreo','m-strawberry','m-special','ic-vanilla','m-pista'],
  dessert:['i-falsp','i-choc','i-pista','i-oreo','i-coffee','i-falsada'],pasta:['x-pasta','x-spaghetti','x-lasagna'],sandwich:['x-club','x-mexican','x-french'],kabab:['q-seekh','q-reshmi','q-gola','q-dhaga'],broast:['f-broast','x-kuku']};
const CAT_WORDS={pizza:'pizza',pizzas:'pizza',burger:'burger',burgers:'burger',roll:'roll',rolls:'roll',deal:'deal',deals:'deal',bbq:'bbq',barbecue:'bbq',tikka:'bbq',
  drink:'drink',drinks:'drink',fries:'fries',pasta:'pasta',sandwich:'sandwich',kabab:'kabab',kebab:'kabab',juice:'juice',juices:'juice',shake:'shake',shakes:'shake',milkshake:'shake',
  dessert:'dessert',desserts:'dessert',icecream:'dessert',faluda:'dessert',falooda:'dessert',sweet:'dessert',broast:'broast'};

const fmNorm=s=>' '+String(s).toLowerCase()
  .replace(/&/g,' and ').replace(/[’']/g,'')
  .replace(/(\d)\s*x\b/g,'$1 ').replace(/\bx\s*(\d)/g,' $1')
  .replace(/\b1\.5\s*(ltr|liter|litre|l)\b/g,' sz15l ').replace(/\b1\s*(ltr|liter|litre|l)\b/g,' sz1l ')
  .replace(/\b345\s*(ml)?\b/g,' sz345 ').replace(/\b500\s*(ml)?\b/g,' sz500 ')
  .replace(/\b([24])\s*(pcs|pc|pieces|piece)\b/g,' sz$1pc ')
  .replace(/kebab/g,'kabab').replace(/[^a-z0-9\s]/g,' ')+' ';

/* every way a dish can be named, longest first */
const FM_PHRASES=(()=>{
  const out=[],seen={};
  const add=(text,id,prio)=>{const t=fmNorm(text).trim().split(/\s+/).filter(Boolean);if(!t.length)return;const k=t.join(' ');
    if(seen[k]){if(seen[k].prio>=prio)return;seen[k].id=id;seen[k].prio=prio;return}
    const p={t,id,prio};seen[k]=p;out.push(p)};
  FM_ITEMS.forEach(it=>{
    add(it.name,it.id,3);add(it.name.replace(/\s*\(.*?\)\s*/g,' '),it.id,3);
    (it.alias||[]).forEach(a=>add(a,it.id,2));
    /* "fajita pizza" → Chicken Fajita Pizza */
    const bare=it.name.replace(/\s*\(.*?\)\s*/g,' ').replace(/^chicken\s+/i,'');add(bare,it.id,1);
  });
  return out.sort((a,b)=>b.t.length-a.t.length||b.prio-a.prio);
})();
const FM_VOCAB=new Set(FM_PHRASES.flatMap(p=>p.t));
function fmEdit1(a,b){if(Math.abs(a.length-b.length)>1)return false;let i=0,j=0,e=0;
  while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue}if(++e>1)return false;if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++}}
  return e+(a.length-i)+(b.length-j)<=1}
function fmTokens(text){
  return fmNorm(text).trim().split(/\s+/).filter(Boolean).map(t=>{
    if(FM_VOCAB.has(t)||SIZEW[t]||NUMW[t]!==undefined||/^\d+$/.test(t))return t;
    if(t.endsWith('es')&&FM_VOCAB.has(t.slice(0,-2)))return t.slice(0,-2);
    if(t.endsWith('s')&&FM_VOCAB.has(t.slice(0,-1)))return t.slice(0,-1);
    if(t.length>=5)for(const v of FM_VOCAB)if(v.length>=5&&fmEdit1(t,v))return v;   /* one typo is fine: "zingr" */
    return t});
}
/* → [{id,qty,size,start,end}] */
function fmFindItems(text){
  const T=fmTokens(text),used=new Array(T.length).fill(false),found=[];
  for(const p of FM_PHRASES){
    for(let i=0;i+p.t.length<=T.length;i++){
      let ok=true;for(let j=0;j<p.t.length;j++)if(used[i+j]||T[i+j]!==p.t[j]){ok=false;break}
      if(!ok)continue;
      for(let j=0;j<p.t.length;j++)used[i+j]=true;
      found.push({id:p.id,start:i,end:i+p.t.length});
    }
  }
  found.sort((a,b)=>a.start-b.start);
  found.forEach((f,n)=>{
    const it=FM_BYID[f.id];
    /* quantity: the nearest number before it, skipping filler words */
    f.qty=1;
    for(let k=f.start-1,hops=0;k>=0&&hops<3;k--,hops++){
      if(used[k])break;const t=T[k];
      if(/^\d{1,2}$/.test(t)&&+t>0&&+t<=30){f.qty=+t;f.said=true;used[k]=true;break}
      if(NUMW[t]!==undefined&&(t!=='do'||k===f.start-1)){f.qty=NUMW[t];f.said=!['a','an'].includes(t);used[k]=true;break}
      if(!FILLER.has(t)&&!SIZEW[t])break}
    /* size: a size word near it that this dish actually comes in */
    if(it.sizes){
      const lo=Math.max(0,f.start-3),hi=Math.min(T.length,(found[n+1]?found[n+1].start:T.length),f.end+3);
      for(let k=lo;k<hi;k++){if(used[k]&&(k<f.start||k>=f.end))continue;const s=SIZEW[T[k]];
        if(s&&it.sizes.some(x=>x[0]===s)){f.size=s;used[k]=true;break}}
    }
  });
  const loose=T.filter((t,i)=>!used[i]);
  return {found,loose,T};
}

/* ---------- the agent ---------- */
const RX={
  greet:/\b(hi|hello|hey|hlo|salam|salaam|assalam|assalamualaikum|aoa|asalam|slam|aslam)\b/,
  menu:/\b(menu|kya kya|what do you have|whats there|options|list)\b/,
  hours:/\b(time|timing|timings|open|close|closing|hours|kab tak|kab khulta|kab band)\b/,
  where:/\b(where|address|location|kahan|kidhar|branch|shop)\b/,
  fee:/\b(delivery charges?|delivery fee|charges|fees?|minimum)\b/,
  reco:/\b(suggest|recommend|best|famous|popular|kya acha|kya achha|kya mangwaun|what should)\b/,
  cart:/\b(cart|basket|my order|kitna hua|kitne hue|total|bill)\b/,
  done:/\b(done|checkout|check out|bas|thats all|that s all|thats it|place order|order kar do|order karo|proceed|confirm order|finish)\b/,
  clear:/\b(clear|empty cart|start over|sab hata|reset)\b/,
  remove:/\b(remove|hata|hatao|hata do|nikal|nikalo|delete|minus|without|cancel)\b/,
  human:/\b(human|agent|real person|manager|complain|complaint|insaan|banda|representative|call me)\b/,
  thanks:/\b(thanks|thank you|thankyou|shukriya|shukria|jazakallah|thx|ty)\b/,
  delivery:/\b(delivery|deliver|ghar|ghar par)\b/,
  pickup:/\b(pickup|pick up|takeaway|take away|khud|collect|aa kar)\b/,
  yes:/\b(yes|haan|han|ha|ji|jee|g|ok|okay|confirm|sure|theek|thik|done|yup|yeah|yep|bilkul|kar do)\b/,
  no:/\b(no|nahi|nahin|nai|nope|na|change|edit)\b/,
  track:/\b(where is my order|status|track|kahan hai|kab aye|kab aaye|kitni der|how long|eta)\b/,
  urdu:/\b(hai|hain|chahiye|chahye|karna|karo|kya|mujhe|bhai|yaar|aur|ek|teen|kitna|kitne|nahi|haan|kar|dein|dena|wala|wali|kaise|kab|kahan|mein|mai|hum|aap|ap|ho|bhej|kitni|acha|achha|theek|bas|jaldi|abhi)\b/
};

class Agent{
  /* channel: 'widget' | 'chat' — only decides where the CRM says the order came from */
  constructor(channel){
    this.channel=channel;this.lang='en';this.stage='browse';this.pending=[];
    this.d={type:'',name:'',phone:'',area:'',addr:'',pay:'',txn:'',note:''};
    this.orderId=null;this.onPush=null;
    this.load();
    Bridge.on(m=>this.heard(m));
  }
  get key(){return 'fm.agent.'+this.channel}
  save(){try{localStorage.setItem(this.key,JSON.stringify({lang:this.lang,stage:this.stage,pending:this.pending,d:this.d,orderId:this.orderId,lastSt:this.lastSt}))}catch{}}
  load(){try{const s=JSON.parse(localStorage.getItem(this.key));if(s)Object.assign(this,s)}catch{}
    try{const me=JSON.parse(localStorage.getItem('fm.me'));if(me)this.me=me}catch{}}
  L(en,ur){return this.lang==='ur'?ur:en}

  greet(){
    const hr=new Date().getHours();const late=hr>=0&&hr<5;
    return [{text:this.L(
      `Assalam o Alaikum! 👋 Welcome to *Foodies Mania*.\nI can take your order right here. Just type what you're craving, like _"2 zinger burgers and a large fajita pizza"_.\n\nDelivery or pickup?`,
      `Assalam o Alaikum! 👋 *Foodies Mania* mein khush aamdeed.\nAap ka order main yahin le sakta hun. Bas likhein kya khana hai, jaise _"2 zinger burger aur ek large fajita pizza"_.\n\nDelivery chahiye ya Pickup?`)+(late?this.L('\n\n🌙 Late-night cravings? We are open till 5 AM.','\n\n🌙 Raat ki bhook? Hum subah 5 baje tak open hain.'):''),
      quick:['Delivery','Pickup','Deals','Menu']}];
  }

  /* the one method an LLM would replace */
  think(text){
    const t=fmNorm(text);
    if(RX.urdu.test(t))this.lang='ur';else if(/\b(the|is|are|please|want|would|can|you|what|how|i|my)\b/.test(t))this.lang='en';
    const out=[];const say=(text,extra={})=>out.push({text,...extra});

    if(RX.human.test(t)){say(this.L(`Of course. Call us on *${FM_BIZ.phone}* or *${FM_BIZ.takeaway}* and the team will help you right away. 🙏`,
      `Zaroor. Humein *${FM_BIZ.phone}* ya *${FM_BIZ.takeaway}* par call karein, team foran madad karegi. 🙏`));return out}
    if(RX.clear.test(t)){Cart.clear();this.pending=[];this.stage='browse';say(this.L('Cart cleared. What would you like?','Cart khali kar diya. Kya order karna hai?'),{quick:['Deals','Burgers','Pizzas']});return out}

    /* stages that expect an answer, not a dish */
    const st=this.stage;
    if(st==='size')return this.answerSize(text,out);
    if(['name','phone','addr','txn','saved'].includes(st))return this.answerDetail(st,text,out);
    if(st==='area')return this.answerArea(text,out);
    if(st==='pay')return this.answerPay(text,out);
    if(st==='confirm')return this.answerConfirm(t,out);

    /* browsing: dishes first, then questions */
    const {found}=fmFindItems(text);
    if(found.length){
      if(RX.remove.test(t)){
        found.forEach(f=>{const it=FM_BYID[f.id];const l=Cart.lines().find(x=>x.id===f.id&&(!f.size||x.size===f.size));
          if(l)Cart.setQty(l.id,l.size,f.said&&f.qty<l.qty?l.qty-f.qty:0)});
        say(this.L('Done, removed. 👍','Theek hai, hata diya. 👍')+'\n\n'+this.cartText(),{quick:Cart.count()?['Checkout','Add more']:['Deals','Menu']});
        return out}
      const added=[];
      found.forEach(f=>{const it=FM_BYID[f.id];
        if(it.sizes&&!f.size)this.pending.push({id:f.id,qty:f.qty});
        else{Cart.add(f.id,f.size,f.qty);added.push(`${f.qty}× ${it.name}${f.size?' ('+f.size+')':''} · ${fmRs(Cart.priceOf(f.id,f.size)*f.qty)}`)}});
      if(RX.pickup.test(t))this.d.type='pickup';else if(RX.delivery.test(t))this.d.type='delivery';
      if(added.length)say(this.L('Added to your order ✅\n','Order mein add kar diya ✅\n')+added.map(a=>'• '+a).join('\n'));
      if(this.pending.length)return this.askSize(out);
      say(this.L(`Your total so far is *${fmRs(Cart.subtotal())}*. Anything else, or shall I check out?`,`Abhi tak total *${fmRs(Cart.subtotal())}* hai. Kuch aur, ya order confirm karun?`),
        {quick:['Checkout','Add a drink','Add fries']});
      return out;
    }

    if(RX.track.test(t)&&this.orderId){const s=Bridge.status(this.orderId);const g=fmStage(s?s.status:'queued',this.d.type==='pickup');
      say(this.L(`Order *${this.orderId}*: *${g.t}*. ${g.s}.`,`Order *${this.orderId}*: *${g.t}*. ${g.s}.`));return out}
    if(RX.done.test(t)||/checkout/.test(t))return this.checkout(out);
    if(RX.cart.test(t)){say(Cart.count()?this.cartText():this.L('Your cart is empty. What are you craving?','Cart abhi khali hai. Kya khana hai?'),{quick:Cart.count()?['Checkout','Add more']:['Deals','Menu']});return out}

    /* delivery / pickup chosen on its own */
    if(RX.pickup.test(t)||RX.delivery.test(t)){
      this.d.type=RX.pickup.test(t)?'pickup':'delivery';
      say(this.d.type==='pickup'
        ?this.L(`Pickup it is 🏃 Ready in about ${FM_BIZ.pickupEta} at our F.B. Area counter. What would you like?`,`Pickup theek hai 🏃 Taqreeban ${FM_BIZ.pickupEta} mein F.B. Area counter par ready hoga. Kya order karna hai?`)
        :this.L(`Delivery it is 🛵 About ${FM_BIZ.eta} to your door. What would you like?`,`Delivery theek hai 🛵 Taqreeban ${FM_BIZ.eta} mein aap ke ghar. Kya order karna hai?`),
        {quick:['Deals','Burgers','Pizzas','BBQ']});
      return out}

    /* cravings and budgets: "something spicy", "cheesy", "deals under 1000" */
    const budget=(t.match(/\b(?:under|below|within|less than|tak|budget|andar)\s+(?:rs\s*)?(\d{3,5})\b/)||t.match(/\b(?:rs\s*)?(\d{3,5})\s+(?:tak|ke andar|se kam|budget)\b/)||[])[1];
    if(budget){const max=+budget;const pool=FM_ITEMS.filter(i=>i.price<=max&&(/deal/.test(t)?i.cat==='deal':true)).sort((a,b)=>b.price-a.price).slice(0,8);
      say(pool.length?this.L(`Best picks under *${fmRs(max)}* 💸`,`*${fmRs(max)}* ke andar best options 💸`):this.L(`Nothing on the menu comes in under ${fmRs(max)}, sorry!`,`${fmRs(max)} ke andar kuch nahi hai, sorry!`),pool.length?{items:pool.map(i=>i.id)}:{});return out}
    if(/\b(spicy|teekha|tikha|hot|mirchi|fiery)\b/.test(t)){
      say(this.L('Turn up the heat 🌶️ These bring the fire:','Teekha pasand hai? 🌶️ Ye dekhiye:'),{items:FM_ITEMS.filter(i=>/spicy/i.test(i.tag||'')||/chilli|jalape|fiery|hot /i.test(i.desc)).slice(0,8).map(i=>i.id)});return out}
    if(/\b(cheesy|cheese|cheez|cheesey)\b/.test(t)){
      say(this.L('Cheese overload, coming up 🧀','Cheese lovers ke liye 🧀'),{items:['x-lava','s-crust','p-cheese','f-pizzafries','x-pide','f-garlicc','q-cheesytikka','p-creamy']});return out}
    if(/\b(late night|midnight|raat|night)\b/.test(t)){
      say(this.L('Late-night cravings? We are open till 5 AM 🌙 Crowd favourites after midnight:','Raat ki bhook? Hum 5 AM tak open hain 🌙 Raat ke favourites:'),{items:['d-jumper','b-zinger','f-pizzafries','r-zinger','x-lava','d-block']});return out}
    if(/\b(family|feast|party|group|log|sab ke liye|friends|dawat)\b/.test(t)){
      say(this.L('Feeding the whole squad? 🎉 These deals go the distance:','Poori family ke liye? 🎉 Ye deals best hain:'),{items:['d-family','d-bbq5','d-ff20','d-ff21','d-ff22','d-ff19']});return out}

    /* a section by name, then a loose category word: show it */
    const catHit=FM_CATS.find(c=>t.includes(' '+fmNorm(c.name).trim()+' '));
    if(catHit){const ids=FM_ITEMS.filter(i=>i.cat===catHit.id).slice(0,10).map(i=>i.id);
      say(this.L(`*${catHit.name}*: tap to add.`,`*${catHit.name}*: add karne ke liye tap karein.`),{items:ids});return out}
    const cw=Object.keys(CAT_WORDS).find(w=>new RegExp('\\b'+w+'\\b').test(t));
    if(cw||RX.menu.test(t)&&!cw){
      if(cw){const g=CAT_WORDS[cw];const ids=GENERIC[g];
        say(this.L(`Here are our favourite ${cw.replace(/s$/,'')}s 😋 Tap one to add it, or type the name.`,`Ye rahe humare best ${cw.replace(/s$/,'')} 😋 Add karne ke liye tap karein ya naam likhein.`),{items:ids});return out}
      say(this.L('Here is what we make. Pick a section:','Ye hai humara menu. Section choose karein:'),{quick:FM_CATS.map(c=>c.name)});return out}

    if(RX.reco.test(t)){say(this.L('Our crowd favourites: the *Zinger Burger*, *Mighty Burger*, *Pizza Fries* and *Cheesy Lava*. For a group, the *Family Deal* never misses. 🔥',
      'Sab se zyada pasand kiye jane wale: *Zinger Burger*, *Mighty Burger*, *Pizza Fries* aur *Cheesy Lava*. Family ke liye *Family Deal* best hai. 🔥'),{items:['b-zinger','b-mighty','f-pizzafries','x-lava','d-family']});return out}
    if(RX.hours.test(t)){say(this.L(`We're open *every day, 3 PM to 5 AM*. 🌙`,`Hum *rozana 3 PM se subah 5 AM* tak open hain. 🌙`));return out}
    if(RX.where.test(t)){say(this.L(`📍 ${FM_BIZ.addr}.\nPickup is available from this counter.`,`📍 ${FM_BIZ.addr}.\nPickup isi counter se ho sakta hai.`));return out}
    if(RX.fee.test(t)){say(this.L(`Delivery is Rs 150 in F.B. Area and up to Rs 230 for areas further away (Clifton, DHA). Pickup is free.`,`F.B. Area mein delivery Rs 150 hai, door ke areas (Clifton, DHA) mein Rs 230 tak. Pickup free hai.`));return out}
    if(RX.thanks.test(t)){say(this.L('Anytime! Have some more! 🧡','Shukriya! Have some more! 🧡'));return out}
    if(RX.greet.test(t))return this.greet();

    say(this.L(`Sorry, I didn't catch that 🙈 Try typing a dish, like _"1 mighty burger and 2 cold drinks"_, or pick below.`,
      `Maaf kijiye, samajh nahi aaya 🙈 Dish ka naam likhein, jaise _"1 mighty burger aur 2 cold drink"_, ya neeche se choose karein.`),{quick:['Deals','Menu','Checkout']});
    return out;
  }

  askSize(out){
    const p=this.pending[0];const it=FM_BYID[p.id];this.stage='size';
    out.push({text:this.L(`Which size for the *${it.name}*?`,`*${it.name}* kaunsa size?`),quick:it.sizes.map(s=>`${s[0]} · ${fmRs(s[1])}`)});
    return out}
  answerSize(text,out){
    const p=this.pending[0];const it=FM_BYID[p.id];const T=fmTokens(text);
    let size=null;for(const t of T){const s=SIZEW[t];if(s&&it.sizes.some(x=>x[0]===s)){size=s;break}}
    if(!size)size=(it.sizes.find(s=>fmNorm(text).includes(' '+fmNorm(s[0]).trim()+' '))||[])[0];
    if(!size){out.push({text:this.L('Please pick one of these sizes:','In mein se size choose karein:'),quick:it.sizes.map(s=>`${s[0]} · ${fmRs(s[1])}`)});return out}
    this.pending.shift();Cart.add(p.id,size,p.qty);
    out.push({text:this.L('Added ✅ ','Add ho gaya ✅ ')+`${p.qty}× ${it.name} (${size}) · ${fmRs(Cart.priceOf(p.id,size)*p.qty)}`});
    if(this.pending.length)return this.askSize(out);
    this.stage='browse';
    out.push({text:this.L(`Total so far *${fmRs(Cart.subtotal())}*. Anything else?`,`Abhi tak total *${fmRs(Cart.subtotal())}*. Kuch aur?`),quick:['Checkout','Add a drink','Add fries']});
    return out}

  cartText(){const L=Cart.lines();if(!L.length)return '';
    return this.L('🧾 *Your order*\n','🧾 *Aap ka order*\n')+L.map(l=>`• ${l.qty}× ${l.label} · ${fmRs(l.price*l.qty)}`).join('\n')+`\n*${this.L('Subtotal','Subtotal')}: ${fmRs(Cart.subtotal())}*`}

  checkout(out){
    if(!Cart.count()){out.push({text:this.L('Your cart is empty. What would you like to eat? 😋','Cart khali hai. Kya khana pasand karenge? 😋'),quick:['Deals','Burgers','Pizzas']});return out}
    /* delivery or pickup first: it decides whether a saved address matters */
    if(!this.d.type){out.push({text:this.L('Delivery or pickup?','Delivery ya Pickup?'),quick:['Delivery','Pickup']});this.stage='browse-type';return out}
    if(this.me&&this.me.phone&&!this.d.phone){
      const m=this.me;this.stage='saved';
      out.push({text:this.L(`Welcome back${m.name?', '+m.name.split(' ')[0]:''}! Use your saved details?\n👤 ${m.name}\n📞 ${m.phone}${m.addr?`\n📍 ${m.addr}, ${m.area}`:''}`,
        `Welcome back${m.name?' '+m.name.split(' ')[0]:''}! Pichli details use karun?\n👤 ${m.name}\n📞 ${m.phone}${m.addr?`\n📍 ${m.addr}, ${m.area}`:''}`),quick:['Yes, use these','New details']});
      return out}
    return this.nextDetail(out)}

  nextDetail(out){
    const d=this.d;
    if(!d.type){out.push({text:this.L('Delivery or pickup?','Delivery ya Pickup?'),quick:['Delivery','Pickup']});this.stage='browse-type';return out}
    if(!d.name){this.stage='name';out.push({text:this.L('Great! What name should we put on the order?','Zabardast! Order kis naam par likhun?')});return out}
    if(!d.phone){this.stage='phone';out.push({text:this.L(`Thanks ${d.name.split(' ')[0]}! Your phone number? (e.g. 0300 1234567)`,`Shukriya ${d.name.split(' ')[0]}! Aap ka phone number? (jaise 0300 1234567)`)});return out}
    if(d.type==='delivery'&&!d.area){this.stage='area';out.push({text:this.L('Which area are you in?','Aap kis area mein hain?'),quick:FM_AREAS.slice(0,10).map(a=>a.name).concat(['Other area'])});return out}
    if(d.type==='delivery'&&!d.addr){this.stage='addr';out.push({text:this.L(`And the full address in ${d.area}? (house, street, block)`,`${d.area} mein poora address? (house, street, block)`)});return out}
    if(!d.pay){this.stage='pay';out.push({text:this.L('How would you like to pay?','Payment kaise karenge?'),quick:FM_PAY.map(p=>p.id==='COD'?(d.type==='pickup'?'Cash at counter':'Cash on Delivery'):p.name)});return out}
    return this.summary(out)}

  answerDetail(st,text,out){
    const raw=text.trim();const t=fmNorm(text);
    if(st==='saved'){
      if(/\b(new|no|nahi|nai|change|edit|naya|nayi|different|dusri|doosri)\b/.test(t)){this.me=null;return this.nextDetail(out)}
      /* typing a different name means new details: take it as the name */
      if(!RX.yes.test(t)&&/^[a-z][a-z .']{1,39}$/i.test(text.trim())&&!fmFindItems(text).found.length){this.me=null;this.d.name=text.trim().replace(/\w/g,c=>c.toUpperCase());return this.nextDetail(out)}
      /* only a clear yes uses the saved details; anything else asks again */
      if(!RX.yes.test(t)&&!/\b(use|these|same|wohi|wahi)\b/.test(t)){out.push({text:this.L('Shall I use these saved details?','Kya yehi details use karun?'),quick:['Yes, use these','New details']});return out}
      const m=this.me;Object.assign(this.d,{name:m.name,phone:m.phone});
      if(this.d.type==='delivery'&&m.area){this.d.area=m.area;this.d.addr=m.addr}
      return this.nextDetail(out)}
    if(st==='name'){
      const n=raw.replace(/^(my name is|i am|i'm|mera naam|name)\s*/i,'').replace(/\s*(hai|he)$/i,'').trim();
      if(n.length<2||n.length>40){out.push({text:this.L('Just your name, please 🙂','Bas aap ka naam likh dein 🙂')});return out}
      this.d.name=n.replace(/\b\w/g,c=>c.toUpperCase());return this.nextDetail(out)}
    if(st==='phone'){
      const dg=raw.replace(/\D/g,'').replace(/^92/,'0');
      if(!/^03\d{9}$/.test(dg)){out.push({text:this.L('That number doesn’t look right. Please send an 11-digit mobile number starting with 03.','Ye number sahi nahi lag raha. 03 se shuru hone wala 11 digit mobile number bhejein.')});return out}
      this.d.phone=dg.slice(0,4)+' '+dg.slice(4);return this.nextDetail(out)}
    if(st==='addr'){
      if(raw.length<6){out.push({text:this.L('Please add a little more detail (house number, street, block).','Thori aur detail likhein (house number, street, block).')});return out}
      this.d.addr=raw;return this.nextDetail(out)}
    if(st==='txn'){
      if(/\b(cash|cod)\b/.test(t)){this.d.pay='COD';this.d.txn='';return this.summary(out)}
      const id=raw.replace(/\s+/g,'');
      if(id.length<6||!/\d/.test(id)){out.push({text:this.L('Please send the transaction ID from your payment receipt (usually 8–12 digits), or choose cash instead.','Payment receipt wala transaction ID bhej dein (aam tor par 8–12 digits), ya cash choose kar lein.'),quick:['Pay cash instead']});return out}
      this.d.txn=id.slice(0,40);return this.summary(out)}
    return out}

  answerArea(text,out){
    const t=fmNorm(text);
    const a=FM_AREAS.find(a=>t.includes(' '+fmNorm(a.name).trim()+' '))||FM_AREAS.find(a=>fmNorm(a.name).trim().split(' ')[0]===t.trim().split(' ')[0]);
    if(a){this.d.area=a.name;return this.nextDetail(out)}
    if(/other/.test(t)){out.push({text:this.L('We deliver across Karachi. Type your area name:','Hum poore Karachi mein deliver karte hain. Apne area ka naam likhein:'),quick:FM_AREAS.slice(10).map(a=>a.name)});return out}
    out.push({text:this.L('Please pick your area from the list:','List se apna area choose karein:'),quick:FM_AREAS.map(a=>a.name)});return out}

  answerPay(text,out){
    const t=fmNorm(text);
    const p=/easy/.test(t)?'EasyPaisa':/jazz/.test(t)?'JazzCash':/bank|transfer/.test(t)?'Bank':/cash|cod/.test(t)?'COD':null;
    if(!p){out.push({text:this.L('Please choose a payment method:','Payment method choose karein:'),quick:FM_PAY.map(x=>x.id==='COD'?(this.d.type==='pickup'?'Cash at counter':'Cash on Delivery'):x.name)});return out}
    this.d.pay=p;
    if(p!=='COD'){const m=FM_PAY.find(x=>x.id===p);this.stage='txn';
      out.push({text:this.L(`Please send *${fmRs(this.total())}* to:\n*${m.name}*\n${m.acct}\n${m.title}\n\nThen type the *transaction ID* here so we can verify it.`,
        `Please *${fmRs(this.total())}* is account par bhejein:\n*${m.name}*\n${m.acct}\n${m.title}\n\nPhir yahan *transaction ID* likh dein taake hum verify kar sakein.`),quick:['Pay cash instead']});
      return out}
    return this.summary(out)}

  fee(){return this.d.type==='delivery'?((FM_AREAS.find(a=>a.name===this.d.area)||{fee:200}).fee):0}
  total(){return Cart.subtotal()+this.fee()}

  summary(out){
    this.stage='confirm';const d=this.d;const pay=FM_PAY.find(p=>p.id===d.pay);
    out.push({summary:true,text:this.L('Please check your order:','Apna order check kar lein:')+'\n\n'+this.cartText()+
      (d.type==='delivery'?`\nDelivery · ${d.area}: ${fmRs(this.fee())}`:`\nPickup: ${fmRs(0)}`)+`\n*Total: ${fmRs(this.total())}*\n\n`+
      `👤 ${d.name} · ${d.phone}\n`+(d.type==='delivery'?`📍 ${d.addr}, ${d.area}\n`:`🏃 Pickup from F.B. Area counter\n`)+`💳 ${d.pay==='COD'&&d.type==='pickup'?'Cash at counter':pay.name}${d.txn?' · TID '+d.txn:''}`,
      quick:['Confirm order','Change something']});
    return out}

  answerConfirm(t,out){
    if(/change|edit|badal/.test(t)||RX.no.test(t)&&!RX.yes.test(t)){this.stage='browse';
      out.push({text:this.L('No problem. Tell me what to change: add or remove a dish, or type _change address_.','Koi baat nahi. Bataein kya badalna hai: dish add/remove karein, ya _change address_ likhein.'),quick:['Checkout']});
      if(/address|area/.test(t)){this.d.area='';this.d.addr=''}
      if(/payment|pay/.test(t))this.d.pay='';
      return out}
    if(!RX.yes.test(t)&&!/confirm/.test(t)){out.push({text:this.L('Shall I place it?','Order place kar dun?'),quick:['Confirm order','Change something']});return out}
    return this.place(out)}

  place(out){
    const d=this.d;
    const order=Bridge.send({id:Bridge.newId(),src:this.channel==='chat'?'chat':'widget',type:d.type,name:d.name,phone:d.phone,
      area:d.type==='delivery'?d.area:'Pickup',addr:d.type==='delivery'?d.addr:'Pickup from F.B. Area counter',fee:this.fee(),pay:d.pay,txn:d.txn,note:d.note,
      items:Cart.orderLines(),subtotal:Cart.subtotal(),total:this.total()});
    try{localStorage.setItem('fm.me',JSON.stringify({name:d.name,phone:d.phone,area:d.area,addr:d.addr}))}catch{}
    this.me={name:d.name,phone:d.phone,area:d.area,addr:d.addr};
    Cart.clear();this.orderId=order.id;this.lastSt='queued';this.stage='browse';
    const type=d.type;this.d={type,name:'',phone:'',area:'',addr:'',pay:'',txn:'',note:''};
    out.push({text:this.L(`Shukriya! Your order *${order.id}* is placed ✅\n${type==='pickup'?`It'll be ready in about ${FM_BIZ.pickupEta}.`:`Expected in ${FM_BIZ.eta}.`} I'll update you here as it moves.`,
      `Shukriya! Aap ka order *${order.id}* place ho gaya ✅\n${type==='pickup'?`Taqreeban ${FM_BIZ.pickupEta} mein ready hoga.`:`Taqreeban ${FM_BIZ.eta} mein pohoch jayega.`} Main yahin update karta rahunga.`),order:order.id});
    return out}

  /* the CRM moved the order: tell the customer, in the CRM's own words */
  heard(m){
    if(!this.orderId)return;
    const s=m.type==='status'&&m.id===this.orderId?m:m.type==='status-all'?Bridge.status(this.orderId):null;
    if(!s||!s.status||s.status===this.lastSt)return;
    this.lastSt=s.status;this.save();
    const pk=s.pickup;const first=(s.rider||'').split(' ')[0];
    const msg={
      new:this.L('📥 Foodies Mania has received your order.','📥 Foodies Mania ko aap ka order mil gaya hai.'),
      approved:this.L(`✅ Order ${this.orderId} confirmed and sent to the kitchen.`,`✅ Aap ka order ${this.orderId} confirm ho gaya hai aur kitchen mein chala gaya hai.`),
      preparing:this.L('👨‍🍳 The kitchen is cooking your order.','👨‍🍳 Kitchen mein aap ka order ban raha hai.'),
      ready:pk?this.L('🛍️ Your order is ready for pickup at the counter!','🛍️ Aap ka order counter par pickup ke liye ready hai!'):this.L('📦 Packed and ready. Assigning a rider.','📦 Order pack ho gaya, rider assign ho raha hai.'),
      out:this.L(`🛵 On the way! Rider ${first||''}${s.riderPhone?' ('+s.riderPhone+')':''} is heading to you.`,`🛵 Aap ka order raste mein hai! Rider ${first||''}${s.riderPhone?' ('+s.riderPhone+')':''} aap tak pohoch raha hai.`),
      delivered:pk?this.L('🎉 Collected. Enjoy your meal! Have some more! 🧡','🎉 Order collect ho gaya. Enjoy! Have some more! 🧡'):this.L('🎉 Delivered! Thank you for choosing Foodies Mania. Have some more! 🧡','🎉 Order deliver ho gaya! Foodies Mania choose karne ka shukriya. Have some more! 🧡'),
      cancelled:this.L(`Sorry, order ${this.orderId} was cancelled. Please call ${FM_BIZ.phone} for help.`,`Sorry, aap ka order ${this.orderId} cancel ho gaya hai. Madad ke liye ${FM_BIZ.phone} par call karein.`)
    }[s.status];
    if(msg&&this.onPush)this.onPush([{text:msg}]);
  }

  /* the UI calls this */
  reply(text){
    let out;
    /* "Delivery or pickup?" asked at checkout comes back here */
    if(this.stage==='browse-type'){const t=fmNorm(text);
      if(RX.pickup.test(t)||RX.delivery.test(t)){this.d.type=RX.pickup.test(t)?'pickup':'delivery';this.stage='browse';out=this.checkout([])}
      /* a dish named here is still added; anything else gets the question again */
      else if(fmFindItems(text).found.length||RX.clear.test(t)||RX.human.test(t)){this.stage='browse';out=this.think(text)}
      else out=[{text:this.L('Please choose delivery or pickup first.','Pehle delivery ya pickup choose karein.'),quick:['Delivery','Pickup']}]}
    else out=this.think(text);
    this.save();return out}
}
