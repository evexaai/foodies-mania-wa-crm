"use strict";
/* ================= utilities ================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let _seed=20261016;
const rnd=()=>{_seed=(_seed*1664525+1013904223)%4294967296;return _seed/4294967296};
const pick=a=>a[Math.floor(rnd()*a.length)];
const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
const wpick=(arr,wf)=>{let t=0;const ws=arr.map(x=>{const w=wf(x);t+=w;return w});let r=rnd()*t;for(let i=0;i<arr.length;i++){r-=ws[i];if(r<=0)return arr[i]}return arr[arr.length-1]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rs=n=>'Rs '+Math.round(n).toLocaleString('en-US');
const k=n=>n>=100000?'Rs '+(n/1000).toFixed(0)+'k':rs(n);
const ic=(n,c='')=>`<svg class="i ${c}"><use href="#i-${n}"/></svg>`;
const fi=(n,c='')=>`<svg class="i ${c}"><use href="#f-${n}"/></svg>`;
const ini=n=>n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const avc=n=>['','c2','c3','c4'][[...n].reduce((a,c)=>a+c.charCodeAt(0),0)%4];
const MIN=60000, HOUR=3600000, DAY=86400000;

/* demo clock: tonight's shift, starting 10:41 PM, runs in real time */
const BOOT=Date.now();
const D0=(()=>{const d=new Date();d.setHours(22,41,0,0);return d.getTime()})();
const now=()=>D0+(Date.now()-BOOT);
const SHIFT0=(()=>{const d=new Date(D0);d.setHours(15,0,0,0);return d.getTime()})();
const SHIFT1=SHIFT0+14*HOUR;
const t12=ts=>{const d=new Date(ts);let h=d.getHours();const m=d.getMinutes(),ap=h>=12?'PM':'AM';h=h%12||12;return h+':'+String(m).padStart(2,'0')+' '+ap};
const dstr=ts=>new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const dshort=ts=>new Date(ts).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const mins=ts=>Math.max(0,Math.floor((now()-ts)/MIN));
const ago=ts=>{const m=mins(ts);if(m<1)return 'just now';if(m<60)return m+' min ago';const h=Math.floor(m/60);if(h<24)return h+'h '+(m%60)+'m ago';return Math.floor(h/24)+'d ago'};
const mmss=ts=>{const s=Math.max(0,Math.floor((now()-ts)/1000));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
/* business-night bucket: hours since 3 PM of that night (0..13) */
const nightOf=ts=>{const d=new Date(ts-15*HOUR);d.setHours(0,0,0,0);return d.getTime()};
const hourIdx=ts=>Math.floor((ts-nightOf(ts)-15*HOUR)/HOUR);

/* ================= menu (real items & prices from foodies-mania.com) ================= */
const CATS=[
 {id:'burger',name:'Burgers',ic:'burger'},{id:'pizza',name:'Pizzas',ic:'pizza'},{id:'sig',name:'Signature Pizzas',ic:'pizza'},
 {id:'roll',name:'Rolls',ic:'roll'},{id:'bbq',name:'BBQ',ic:'skewer'},{id:'fries',name:'Fries & Sides',ic:'fries'},
 {id:'special',name:'Specials',ic:'bowl'},{id:'chinese',name:'Chinese',ic:'bowl'},{id:'drink',name:'Drinks',ic:'drink'},{id:'deal',name:'Deals',ic:'platter'}]
 .map(c=>({...c,avail:true}));   /* a whole category can be switched off, e.g. the BBQ man has gone home */
const MENU_RAW=[
 ['burger','Zinger Burger',400,'zinger burger',10],['burger','Zinger Burger with Cheese',450,'cheese zinger',5],['burger','Mighty Burger',450,'mighty burger',8],
 ['burger','Smash Burger',450,'smash burger',4],['burger','Smash Spicy Burger',450,'spicy smash',3],['burger','BBQ Smoke Burger',450,'bbq smoke burger',3],
 ['burger','Steak Burger',450,'steak burger',2],['burger','Ranch Burger',450,'ranch burger',2],['burger','Hot Chek Chek Burger',450,'chek chek burger',2],
 ['burger','Chilli Sriracha Burger',450,'sriracha burger',2],['burger','Italian Burger',450,'italian burger',1],['burger','Chicken Burger',300,'chicken burger',4],
 ['burger','Beef Burger',300,'beef burger',3],['burger','Chicken Burger with Cheese',350,'cheese chicken burger',2],['burger','Beef Burger with Cheese',350,'cheese beef burger',2],
 ['pizza','Peri Peri Pizza',400,'peri peri pizza',4],['pizza','Supreme Max Pizza',400,'supreme max',3],['pizza','Bonfire Pizza',400,'bonfire pizza',3],
 ['pizza','Special Spicy & Scary Pizza',400,'spicy scary pizza',2],['pizza','Special Achari Pizza',400,'achari pizza',2],['pizza','Special Mughlai Pizza',400,'mughlai pizza',2],
 ['pizza','Butter Chicken Pizza',400,'butter chicken pizza',2],['pizza','Chicken Tikka Pizza',350,'tikka pizza',5],['pizza','Chicken Fajita Pizza',350,'fajita pizza',5],
 ['pizza','Cheese Lover Pizza',350,'cheese lover',3],['pizza','Meat Lover Pizza',350,'meat lover',2],['pizza','Chicken Tandoori Pizza',350,'tandoori pizza',2],
 ['pizza','Arabian Pizza',350,'arabian pizza',2],['pizza','Chicken Supreme Pizza',350,'chicken supreme',3],['pizza','Vegetable Pizza',350,'veg pizza',1],
 ['pizza','Chicken Malai Boti Pizza',350,'malai boti pizza',2],['pizza','Chicken Bihari Pizza',350,'bihari pizza',2],['pizza','Creamy Cheese Pizza',350,'creamy cheese pizza',2],
 ['sig','Special Mughlai Pizza (Cheesy)',800,'special mughlai',3],['sig','Chipotle Kabab Pizza',1100,'chipotle kabab',2],['sig','Chicken Seekh Kabab Pizza',1100,'seekh kabab pizza',2],
 ['sig','Supreme Sausages Pizza',1100,'sausages pizza',2],['sig','Pizza Crust',1400,'crust pizza',1],['sig','Calzone Pizza',1000,'calzone',2],['sig','4 Flavours Pizza',1000,'4 flavour pizza',2],
 ['roll','Zinger Roll',280,'zinger roll',8],['roll','Malai Boti Roll (Large)',320,'malai boti roll',5],['roll','Malai Boti Roll (Small)',220,'chota malai boti roll',3],
 ['roll','Chicken Boti Roll (Large)',300,'chicken boti roll',4],['roll','Chicken Mayo Roll (Large)',320,'mayo roll',4],['roll','Beef Boti Roll (Large)',300,'beef boti roll',3],
 ['roll','Reshmi Kabab Roll (Large)',280,'reshmi kabab roll',3],['roll','Beef Kabab Roll (Large)',260,'beef kabab roll',2],['roll','French Roll',500,'french roll',2],
 ['bbq','Chicken Tikka (Chest)',400,'chest tikka',4],['bbq','Chicken Tikka (Leg)',350,'leg tikka',3],['bbq','Malai Tikka (Chest)',430,'malai tikka',3],
 ['bbq','Cheesy Tikka (Chest)',450,'cheesy tikka',2],['bbq','Chicken Malai Boti',400,'malai boti',4],['bbq','Chicken Boti',380,'chicken boti',3],
 ['bbq','Beef Behari Boti',380,'behari boti',3],['bbq','Seekh Kabab',350,'seekh kabab',3],['bbq','Gola Kabab',380,'gola kabab',2],['bbq','Reshmi Chicken Kabab',380,'reshmi kabab',2],
 ['bbq','Cheesy Chicken Kabab',400,'cheesy kabab',2],['bbq','Paratha (Large)',100,'paratha',4],
 ['fries','Pizza Fries (Large)',450,'pizza fries large',6],['fries','Pizza Fries (Small)',350,'pizza fries',4],['fries','Mayo Fries',200,'mayo fries',5],['fries','Plain Fries',150,'fries',5],
 ['fries','Nuggets 4 pcs (Cheesy)',300,'cheesy nuggets',2],['fries','Crispy Broast (Chest)',550,'broast chest',3],['fries','Crispy Broast (Leg)',500,'broast leg',3],
 ['special','Cheesy Lava',600,'cheesy lava',6],['special','Dynamite Chicken',600,'dynamite chicken',3],['special','Arabian Spaghetti',600,'arabian spaghetti',2],
 ['special','Pasta Super',600,'pasta',2],['special','Lasagna',600,'lasagna',2],['special','Mexican Sandwich',600,'mexican sandwich',2],['special','Club Sandwich',400,'club sandwich',3],
 ['chinese','Chicken Shashlik with Fried Rice',650,'shashlik',3],['chinese','Chicken Manchurian with Fried Rice',650,'manchurian',3],
 ['drink','Cold Drink 345ml',80,'drink',6],['drink','Cold Drink 500ml',110,'500ml drink',7],['drink','Cold Drink 1 Ltr',160,'1 litre drink',4],['drink','Cold Drink 1.5 Ltr',210,'1.5 litre',5],['drink','Water (Large)',130,'pani',2],
 ['deal','Family Platter',2200,'family platter',3]];
const MENU=MENU_RAW.map((r,i)=>({id:'m'+i,cat:r[0],name:r[1],price:r[2],say:r[3],pop:r[4],avail:true}));
const MM={};MENU.forEach(m=>MM[m.id]=m);
const CM={};CATS.forEach(c=>CM[c.id]=c);
const catOf=id=>CATS.find(c=>c.id===MM[id].cat);
/* an item is sellable only when the item AND its category are both on,
   and the live AI agent reads exactly this when it quotes the menu */
const catOn=cid=>CM[cid]?CM[cid].avail!==false:true;
const isOn=m=>!!m.avail&&catOn(m.cat);
const offWhy=m=>!catOn(m.cat)?CM[m.cat].name+' is off':!m.avail?'Item is off':'';
const openCats=()=>CATS.filter(c=>c.avail&&c.id!=='drink'&&MENU.some(m=>m.cat===c.id&&m.avail));
const CATIC={burger:'burger',pizza:'pizza',sig:'pizza',roll:'roll',bbq:'skewer',fries:'fries',special:'bowl',chinese:'bowl',drink:'drink',deal:'platter'};
const foodIc=(mid,cls='')=>`<span class="food ${cls}">${fi(CATIC[MM[mid].cat]||'burger')}</span>`;

/* ================= delivery areas (demo fees: F.B. Area 150, max 230) ================= */
const AREAS=[
 ['F.B. Area',150,14],['Azizabad',150,6],['Karimabad',160,6],['Gulberg',160,5],['Hussainabad',160,4],['Liaquatabad',170,4],['F.C. Area',170,3],
 ['Nazimabad',180,5],['North Nazimabad',180,9],['Gulshan-e-Iqbal',190,10],['Shadman Town',180,3],['Bahadurabad',200,4],['P.E.C.H.S',210,3],
 ['North Karachi',200,5],['New Karachi',210,3],['Gulistan-e-Johar',220,5],['Scheme 33',220,3],['Tariq Road',210,3],['Saddar',220,2],
 ['Shah Faisal Colony',230,2],['Clifton',230,3],['DHA',230,3]].map(a=>({name:a[0],fee:a[1],w:a[2]}));
const feeOf=a=>(AREAS.find(x=>x.name===a)||{fee:200}).fee;
const STREETS={'F.B. Area':['Block 8','Block 10','Block 13','Block 16','Block 6','Block 14'],'North Nazimabad':['Block H','Block L','Block N','Block F','Block J'],'Gulshan-e-Iqbal':['Block 13-D','Block 2','Block 10-A','Block 5','Block 7'],'Gulistan-e-Johar':['Block 15','Block 7','Block 12'],'North Karachi':['Sector 11-B','Sector 5-C','Sector 7-D'],'DHA':['Phase 5','Phase 6','Phase 2 Ext'],'Clifton':['Block 2','Block 5','Block 8']};
const addrFor=a=>{const bl=(STREETS[a]||['Block '+ri(1,9)]);return `House ${ri(3,240)}, Street ${ri(1,19)}, ${pick(bl)}, ${a}`};

/* ================= people ================= */
const FIRST_M=['Ahmed','Hassan','Bilal','Usman','Ali','Hamza','Saad','Faizan','Zain','Taha','Rayyan','Daniyal','Arham','Owais','Shayan','Sufiyan','Kamran','Fahad','Talha','Muneeb','Haris','Areeb','Shahzaib','Moiz','Huzaifa','Abdullah','Asad','Junaid','Imran','Waqas','Salman','Omar','Raza','Sameer','Anas','Faraz','Adeel','Nabeel','Yasir','Rehan'];
const FIRST_F=['Ayesha','Sara','Fatima','Zainab','Hira','Mehwish','Sana','Maryam','Iqra','Areeba','Hafsa','Komal','Anum','Rabia','Sidra','Laiba','Alina','Mahnoor','Noor','Amna'];
const LAST=['Khan','Ahmed','Siddiqui','Qureshi','Shaikh','Raza','Ali','Malik','Baig','Hussain','Ansari','Farooqui','Abbasi','Memon','Rizvi','Jafri','Zaidi','Mirza','Chaudhry','Butt','Hashmi','Naqvi','Kazmi','Usmani','Rajput'];
const phoneNo=()=>'+92 3'+ri(0,4)+ri(0,9)+' '+String(ri(1000000,9999999));

const S={orders:[],omap:{},customers:[],cmap:{},riders:[],chats:[],notifs:[],campaigns:[],takeaway:[],seq:4210,
 users:[{id:'u1',name:'Shahnawaz Damani',login:'shahnawaz',pass:'fm@2025',on:true,role:'admin',perms:null},
  {id:'u2',name:'Kashif Ali',login:'kashif',pass:'counter12',on:true,role:'admin',perms:['dash','chats','orders','riders','customers','bulk']},
  {id:'u4',name:'Hamza Qureshi',login:'hamza',pass:'bike#44',on:true,role:'rider',riderId:'r0',perms:null},
  {id:'u5',name:'Nadia Siddiqui',login:'nadia',pass:'desk2025',on:true,role:'admin',perms:['dash','chats','orders','customers']}],
 set:{wa:true,waNo:'+92 335 2115129',takeNo:'0335-2115129',biz:'Foodies Mania',addr:'Shop 1, R12, Block 8, Federal B Area, Alyabad, near Tabba Heart Hospital, Karachi',phone:'021-37226172',open:'15:00',close:'05:00',
   voice:true,pop:true,lang:'en',vol:.9,voiceName:'',ev:{newChat:true,newOrder:true,needsHuman:true,kitchenReady:true,assigned:true,delivered:true,late:true,takeaway:false,wa:true},sim:true,autoKitchen:false,
   /* what the AI sends when a customer picks Takeaway. {number} is swapped for the takeaway number. */
   takeMsg:'Takeaway ke liye please humare takeaway number par WhatsApp/call karein:\n📞 {number}\nWo aap ka order ready rakhenge. Shukriya!'}};

/* customers */
(function genCustomers(){
  const used=new Set();
  for(let i=0;i<560;i++){
    let n;do{n=(rnd()<.72?pick(FIRST_M):pick(FIRST_F))+' '+pick(LAST)}while(used.has(n));used.add(n);
    const area=wpick(AREAS,a=>a.w).name;
    const r=rnd();
    const since=r<.68?SHIFT0-ri(70,420)*DAY:SHIFT0-ri(0,60)*DAY;
    const w=Math.pow(rnd(),2.6)*10+.15;
    const c={id:'c'+i,name:n,phone:phoneNo(),area,addr:addrFor(area),since,w,n:0,spent:0,first:null,last:0,fav:{},note:'',blocked:false,pays:{}};
    S.customers.push(c);S.cmap[c.id]=c;
  }
  // customers that went quiet (inactive 30+ days)
  S.customers.slice(520,560).forEach(c=>{c.quiet=true;c.since=SHIFT0-ri(120,300)*DAY});
  // new ones this week
  S.customers.slice(480,520).forEach(c=>{c.since=SHIFT0-ri(0,6)*DAY;c.w=1.2});
  // a handful already have a note on the counter
  const NOTE_SEED=['Prefers extra spicy, call before delivery','Flat has no lift, rider should call from the gate',
   'Pays by EasyPaisa, always sends the screenshot','Office order, bill needs the company name',
   'Regular Friday family order, keep the platter ready','Does not take calls, WhatsApp only',
   'Allergic to mayo — never add it','Big tipper, look after this one'];
  NOTE_SEED.forEach((n,i)=>{const c=S.customers[i*37+5];if(c)c.note=n});
})();

const PAYS=[['COD',62],['EasyPaisa',16],['JazzCash',12],['Bank',10]];
const payName={COD:'Cash on Delivery',EasyPaisa:'EasyPaisa',JazzCash:'JazzCash',Bank:'Bank Transfer'};
const NOTES=['No onion please','Extra spicy','Less spicy, kids are eating','Mayo separate','Extra ketchup sachets','Cut pizza in 8 slices','No cucumber','Well done please','Extra garlic sauce','Pack drinks separately','No jalapeños','Cheese extra'];
const ITEMNOTES={burger:['No onion','Extra cheese','No mayo','Extra spicy','No lettuce'],pizza:['Thin crust','Extra cheese','No olives','Less spicy','Cut in 8'],sig:['Extra cheese','Well done'],roll:['Extra chutney','No onion','Less spicy'],bbq:['Extra chutney','Well done'],fries:['Extra sauce','Less salt'],special:['Extra cheese'],chinese:['Less oil'],drink:['Chilled'],deal:['Mixed drinks']};

function makeItems(){
  const n=wpick([1,2,3,4],x=>[30,40,22,8][x-1]);const items=[];
  const mains=MENU.filter(m=>m.cat!=='drink'&&isOn(m));
  if(!mains.length)return [];
  for(let i=0;i<n;i++){
    const m=wpick(mains,x=>x.pop);const ex=items.find(x=>x.mid===m.id);
    if(ex)ex.qty++;else items.push({mid:m.id,qty:rnd()<.22?2:1,note:rnd()<.12?pick(ITEMNOTES[m.cat]||['']):''});
  }
  const drinks=MENU.filter(m=>m.cat==='drink'&&isOn(m));
  if(rnd()<.55&&drinks.length){const d=wpick(drinks,x=>x.pop);items.push({mid:d.id,qty:ri(1,2),note:''})}
  return items;
}
function calc(o){o.subtotal=o.items.reduce((s,it)=>s+MM[it.mid].price*it.qty,0);o.total=o.subtotal+o.fee;return o}
function newId(){return 'FM-'+(S.seq++)}
function addOrder(o){S.orders.push(o);S.omap[o.id]=o;return o}
function applyDelivered(o){const c=S.cmap[o.cid];if(!c)return;c.n++;c.spent+=o.total;if(!c.first||o.t.placed<c.first)c.first=o.t.placed;if(o.t.placed>c.last)c.last=o.t.placed;o.items.forEach(it=>c.fav[it.mid]=(c.fav[it.mid]||0)+it.qty);c.pays[o.pay]=(c.pays[o.pay]||0)+1}

const HW=[2,3,4,6,7,9,11,12,11,10,8,6,4,2];
const randTimeIn=(start)=>{const h=wpick([...Array(14).keys()],i=>HW[i]);return start+h*HOUR+ri(0,59)*MIN};

/* riders (Karachi teen boys, demo) */
const RIDERS=[['Hamza Qureshi','KHB-4821'],['Saad Ali','KKT-1290'],['Faizan Ahmed','KHM-7734'],['Taha Siddiqui','KHC-3365'],
 ['Rayyan Khan','KJA-9012'],['Daniyal Shaikh','KHS-5547'],['Arham Baig','KHP-2208'],['Owais Memon','KHE-6619'],
 ['Shayan Rizvi','KJB-4402'],['Sufiyan Ansari','KHT-8873'],['Moiz Abbasi','KHL-1157']];
/* cash = still to hand in to Foodies Mania, collected = everything he took tonight */
RIDERS.forEach((r,i)=>S.riders.push({id:'r'+i,name:r[0],bike:r[1],phone:phoneNo(),status:i>=9?'off':'free',cash:0,today:0,orders:[],handins:[],settledAt:SHIFT0,earn:0,since:SHIFT0-ri(30,500)*DAY}));

/* history: 60 nights */
(function genHistory(){
  _seed=777;
  let hid=1200;
  for(let d=60;d>=1;d--){
    const night=SHIFT0-d*DAY;const dow=new Date(night).getDay();
    const n=ri(48,66)+(dow===5||dow===6?14:0)+(dow===0?8:0);
    for(let i=0;i<n;i++){
      const ts=randTimeIn(night);
      const pool=S.customers.filter(c=>c.since<=ts&&!(c.quiet&&ts>SHIFT0-ri(32,60)*DAY));
      const c=wpick(pool,x=>x.w);
      const o=calc({id:'FM-'+(hid++),cid:c.id,items:makeItems(),note:rnd()<.15?pick(NOTES):'',area:c.area,addr:c.addr,fee:feeOf(c.area),pay:wpick(PAYS,p=>p[1])[0],paid:true,status:rnd()<.025?'cancelled':'delivered',t:{placed:ts},rider:'r'+ri(0,5),src:'ai'});
      o.t.delivered=ts+ri(28,52)*MIN;S.orders.push(o);S.omap[o.id]=o;
      if(o.status==='delivered')applyDelivered(o);
    }
  }
  S.seq=Math.max(S.seq,hid+10);
})();

/* tonight so far */
(function genTonight(){
  _seed=4242;
  const nowT=D0;const pipeline=[];
  const total=58;
  const times=[];for(let i=0;i<total;i++){let t;do{t=randTimeIn(SHIFT0)}while(t>nowT-2*MIN);times.push(t)}
  times.sort((a,b)=>a-b);
  // last few are tonight's live pipeline
  const forced=[['delivered',0],['out',0],['out',0],['out',0],['ready',0],['preparing',0],['preparing',0],['approved',0],['new',0],['new',0]];
  const recent=[nowT-46*MIN,nowT-38*MIN,nowT-31*MIN,nowT-27*MIN,nowT-22*MIN,nowT-17*MIN,nowT-14*MIN,nowT-9*MIN,nowT-4*MIN,nowT-2*MIN];
  const all=[...times.slice(0,total-forced.length).map(t=>[t,'delivered']),...recent.map((t,i)=>[t,forced[i][0]])];
  const riderIdx=[0,1,2,3,4,5];
  all.forEach(([ts,st],idx)=>{
    const c=wpick(S.customers.filter(x=>!x.quiet&&x.since<=ts),x=>x.w);
    const o=calc({id:newId(),cid:c.id,items:makeItems(),note:rnd()<.3?pick(NOTES):'',area:c.area,addr:c.addr,fee:feeOf(c.area),pay:wpick(PAYS,p=>p[1])[0],paid:false,status:st,t:{placed:ts},rider:null,src:'ai'});
    if(idx===12)o.status='cancelled';
    o.paid=o.pay!=='COD'?rnd()<.85:false;
    if(o.status==='cancelled'){o.t.cancelled=ts+4*MIN;addOrder(o);return}
    const T=o.t;
    if(['approved','preparing','ready','out','delivered'].includes(o.status))T.approved=ts+ri(1,3)*MIN;
    if(['preparing','ready','out','delivered'].includes(o.status))T.preparing=T.approved+ri(1,3)*MIN;
    if(['ready','out','delivered'].includes(o.status))T.ready=T.preparing+ri(9,14)*MIN;
    if(['out','delivered'].includes(o.status)){T.out=T.ready+ri(1,4)*MIN;o.rider='r'+pick(riderIdx)}
    if(o.status==='delivered'){T.delivered=T.out+ri(12,22)*MIN;if(o.pay==='COD')o.paid=true}
    // keep pipeline timestamps in the past
    ['approved','preparing','ready','out','delivered'].forEach(key=>{if(T[key]&&T[key]>nowT-30000)T[key]=nowT-ri(1,3)*MIN});
    addOrder(o);
    if(o.status==='delivered'){applyDelivered(o);const r=S.riders.find(x=>x.id===o.rider);r.today++;r.earn+=60;
      /* collected after his last hand-in is still in his pocket; anything
         earlier in the shift he has already brought to the counter */
      if(o.pay==='COD'){if(T.delivered>SHIFT0+5*HOUR)r.cash+=o.total;else r._early=(r._early||0)+o.total}}
  });
  // riders currently out
  const outs=S.orders.filter(o=>o.status==='out');
  const busy=['r0','r2','r4'];
  outs.forEach((o,i)=>{o.rider=busy[i%busy.length];const r=S.riders.find(x=>x.id===o.rider);r.orders.push(o.id);r.status='busy';o.dueAt=Date.now()+(60+i*35)*1000});
  /* make sure the rider demo always has cash moving: the signed-in rider keeps
     at least one cash-on-delivery drop on his bike */
  const own=outs.filter(o=>o.rider==='r0');
  if(own.length&&!own.some(o=>o.pay==='COD')){own[0].pay='COD';own[0].paid=false}
  S.riders.forEach(r=>{r.settledAt=SHIFT0+5*HOUR;
    if(r._early){r.handins=[{t:SHIFT0+5*HOUR,amt:r._early}];delete r._early}});
  // takeaway shares tonight
  for(let i=0;i<19;i++){const c=pick(S.customers);S.takeaway.push({name:c.name,phone:c.phone,t:SHIFT0+ri(10,460)*MIN})}
  S.takeaway.sort((a,b)=>a.t-b.t);
})();

/* past campaigns */
S.campaigns=[
 {id:'cp5',name:'Mighty Burger Rs 450',aud:'Regulars · F.B. Area',sent:148,replied:51,t:SHIFT0-1*DAY+5*HOUR},
 {id:'cp4',name:'Cheesy Lava',aud:'VIP / frequent',sent:72,replied:34,t:SHIFT0-4*DAY+6*HOUR},
 {id:'cp3',name:'Late Night Cravings',aud:'Frequent buyers',sent:96,replied:37,t:SHIFT0-2*DAY+6*HOUR},
 {id:'cp2',name:'Family Platter Rs 2,200',aud:'All customers',sent:388,replied:82,t:SHIFT0-6*DAY+4*HOUR},
 {id:'cp6',name:'Eid Mubarak',aud:'All customers',sent:402,replied:118,t:SHIFT0-9*DAY+7*HOUR},
 {id:'cp1',name:'We miss you',aud:'Inactive 30+ days',sent:41,replied:9,t:SHIFT0-13*DAY+5*HOUR}];
/* ================= voice + chime ================= */
const VOICE_LINES={
 newChat:{en:["Ooh, someone's knocking! New chat.","New chat! Somebody's hungry.","Hey hey, a new customer just said hi!"],ur:["Naya message aaya hai!","Koi bhooka hai, naya chat aaya!","Lo ji, naya customer aa gaya!"]},
 newOrder:{en:["Cha-ching! New order, approve it boss.","Fresh order waiting for you, boss!","New order! Don't keep them waiting."],ur:["Naya order aa gaya, approve kar do boss!","Order aaya hai, jaldi approve karo!","Cha-ching! Naya order, boss!"]},
 needsHuman:{en:["Psst! A customer needs a real human.","Help needed! Take over the chat.","Uh-oh, someone wants to talk to you."],ur:["Suno! Customer aap se baat karna chahta hai.","Insaan ki zaroorat hai, chat sambhalo!","Customer ko aap chahiye, jaldi!"]},
 kitchenReady:{en:["Ding! Food's hot and ready.","Order's ready! Grab a rider.","Hot and ready! Send it out."],ur:["Khana tayyar hai! Rider bhejo.","Garam garam order ready hai!","Ding! Order tayyar, rider bulao."]},
 assigned:{en:["Rider's on the way!","Zoom! Order is out."],ur:["Rider nikal gaya!","Order raste mein hai!"]},
 delivered:{en:["Delivered! Another happy tummy.","Done and delivered, nice!","Yay, order delivered!"],ur:["Order deliver ho gaya, shabash!","Ek aur khush customer!","Pohoch gaya order, zabardast!"]},
 late:{en:["Careful, an order is running late.","Tick tock! One order is getting late."],ur:["Dhyan do, order late ho raha hai!","Order late ho raha hai, dekh lo!"]},
 takeaway:{en:["Takeaway number sent."],ur:["Takeaway number bhej diya."]},
 wa:{en:["Oh no, WhatsApp is disconnected!","WhatsApp is back online!"],ur:["Uff, WhatsApp disconnect ho gaya!","WhatsApp wapis connect ho gaya!"]},
 hello:{en:["Hi Shahnawaz! Let's get cooking."],ur:["Assalam o Alaikum Shahnawaz! Chalo kaam shuru karein."]}
};
const VOICE_LABEL={newChat:'New WhatsApp chat',newOrder:'New order to approve',needsHuman:'Customer needs a human',kitchenReady:'Kitchen marks order ready',assigned:'Rider assigned',delivered:'Order delivered',late:'Order running late',takeaway:'Takeaway number shared',wa:'WhatsApp connection change'};
/* Pronunciation: respell the words an English engine mangles, so the line
   sounds like a person who actually works here. Owner is SHAH-NAWAAZ. */
const PRON=[
 [/\bShahnawaz\b/gi,'Shah Nawaaz'],[/\bDamani\b/gi,'Daamaani'],
 [/\bFoodies Mania\b/gi,'Foodies Maineea'],
 [/\bEasyPaisa\b/gi,'Easy Paisa'],[/\bJazzCash\b/gi,'Jazz Cash'],
 [/\bRs\.?\s?(\d)/g,'Rupees $1'],
 [/\bCOD\b/g,'cash on delivery'],[/\bAoA\b/gi,'Assalam o Alaikum'],
 [/\bkhana\b/gi,'khaana'],[/\btayyar\b/gi,'tay-yaar'],[/\bjaldi\b/gi,'jal-dee'],
 [/\bbhooka\b/gi,'bhoo-ka'],[/\bzaroorat\b/gi,'zaroo-rat'],[/\bsambhalo\b/gi,'sam-bhaalo'],
 [/\bshabash\b/gi,'sha-baash'],[/\bzabardast\b/gi,'zabar-dast'],[/\bpohoch\b/gi,'poh-onch'],
 [/\bmaazrat\b/gi,'maaz-rat'],[/\bshukriya\b/gi,'shuk-riya'],[/\bbhejo\b/gi,'bhay-jo'],
 [/\bnikal\b/gi,'ni-kal'],[/\braste\b/gi,'raas-tay'],[/\bdekh lo\b/gi,'daykh lo'],
 [/\bbulao\b/gi,'bu-laao'],[/\bchalo\b/gi,'cha-lo'],[/\bkaam\b/gi,'kaa-m'],
 [/\bGulshan-e-Iqbal\b/gi,'Gulshan e Iqbaal'],[/\bGulistan-e-Johar\b/gi,'Gulistan e Jauhar'],
 [/\bNazimabad\b/gi,'Naazim aabaad'],[/\bAzizabad\b/gi,'Azeez aabaad'],
 [/\bKarimabad\b/gi,'Kareem aabaad'],[/\bLiaquatabad\b/gi,'Liaaqat aabaad'],
 [/\bF\.B\. Area\b/gi,'F B Area'],[/\bhai\b/gi,'hay']
];
const sayAs=t=>PRON.reduce((s,[re,to])=>s.replace(re,to),String(t));
/* voices worth using, best first: the online neural ones sound human, the rest do not */
const V_GOOD=/aria|jenny|ava|emma|michelle|nancy|sara|zoe|nicky|samantha|serena|allison|uzma|gul|neerja|sonia|libby|natasha|clara|yuna/i;
const V_NATURAL=/natural|neural|online|google/i;
const V_MALE=/\bmale\b(?!.*female)|david|mark|daniel|alex|fred|ravi|hemant|prabhat|george|guy|ryan|asad|salman|eric|roger|steffan|thomas|william|james/i;
const Voice={ctx:null,last:{},voices:[],
 unlock(){try{this.ctx=this.ctx||new (window.AudioContext||window.webkitAudioContext)();this.ctx.resume&&this.ctx.resume()}catch(e){}
   try{if('speechSynthesis' in window){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);this.load()}}catch(e){}},
 load(){try{this.voices=speechSynthesis.getVoices()}catch(e){this.voices=[]}},
 /* score every installed voice and take the best: neural/online first, then a
    young female name, then the right language. A device with no good voice
    still gets the best of what it has. */
 score(v,lang){
   let s=0;const n=v.name||'';
   if(lang==='ur'){if(/^ur/i.test(v.lang))s+=140;else if(/^hi/i.test(v.lang))s+=70;else if(/en[-_]IN/i.test(v.lang))s+=55;else if(/^en/i.test(v.lang))s+=12}
   else{if(/^en[-_](US|GB)/i.test(v.lang))s+=110;else if(/^en/i.test(v.lang))s+=80;else s-=40}
   if(V_NATURAL.test(n))s+=60;
   if(v.localService===false)s+=30;
   if(V_GOOD.test(n))s+=45;
   if(V_MALE.test(n))s-=90;
   if(/zira|hazel|heera|kalpana|veena|lekha|moira|tessa|fiona|karen|victoria/i.test(n))s-=18; // older, flatter voices
   if(/\bdefault\b/i.test(n))s-=10;
   return s},
 pickVoice(lang){
   const v=this.voices.length?this.voices:(this.load(),this.voices);if(!v.length)return null;
   if(S.set.voiceName){const hit=v.find(x=>x.name===S.set.voiceName);if(hit)return hit}
   return v.slice().sort((a,b)=>this.score(b,lang)-this.score(a,lang))[0]},
 /* the voices a device actually has, best first, for the picker in Settings */
 options(lang){const v=this.voices.length?this.voices:(this.load(),this.voices);
   return v.slice().sort((a,b)=>this.score(b,lang)-this.score(a,lang))},
 /* one natural-sounding utterance: respelled, lightly varied so it is never identical twice */
 speak(text,lang){
   if(!('speechSynthesis' in window))return;
   try{
     if(speechSynthesis.speaking&&speechSynthesis.pending)speechSynthesis.cancel();
     const u=new SpeechSynthesisUtterance(sayAs(text));
     const v=this.pickVoice(lang);if(v){u.voice=v;u.lang=v.lang}
     const j=(Math.random()-.5)*.06;
     u.pitch=(lang==='ur'?1.06:1.12)+j;      // young, not chipmunk
     u.rate=(lang==='ur'?.94:.99)+j*.5;      // a touch under default reads as relaxed
     u.volume=S.set.vol;
     setTimeout(()=>speechSynthesis.speak(u),220);
   }catch(e){}},
 chime(kind){if(!this.ctx)return;try{const ctx=this.ctx,t=ctx.currentTime,g=ctx.createGain();g.connect(ctx.destination);
   const vol=S.set.vol*.16;const seq={newChat:[880,1175],newOrder:[784,988,1319],needsHuman:[659,523,659],kitchenReady:[1047,1319,1568],delivered:[784,1047],late:[440,415],assigned:[988,1175],takeaway:[988],wa:[523,392],hello:[659,880,1047]}[kind]||[880];
   seq.forEach((f,i)=>{const o=ctx.createOscillator(),gg=ctx.createGain();o.type=i%2?'triangle':'sine';o.frequency.value=f;o.connect(gg);gg.connect(g);const st=t+i*.11;gg.gain.setValueAtTime(0,st);gg.gain.linearRampToValueAtTime(vol,st+.012);gg.gain.exponentialRampToValueAtTime(.0008,st+.42);o.start(st);o.stop(st+.45)})}catch(e){}},
 say(kind,force,variant){
   if(!force&&(!S.set.voice||!S.set.ev[kind]))return;
   const nowMs=Date.now();if(!force&&this.last[kind]&&nowMs-this.last[kind]<2500)return;this.last[kind]=nowMs;
   this.chime(kind);
   if(!('speechSynthesis' in window))return;
   const set=VOICE_LINES[kind];if(!set)return;const lines=set[S.set.lang]||set.en;
   const text=variant!=null?lines[Math.min(variant,lines.length-1)]:lines[Math.floor(Math.random()*lines.length)];
   this.speak(text,S.set.lang)}
};
try{speechSynthesis.onvoiceschanged=()=>Voice.load()}catch(e){}

/* ================= toasts + notifications ================= */
/* A pop-up you can always get rid of: tap the x, or flick it to the right.
   Whatever it said is still waiting in the bell panel afterwards. */
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
function clearToasts(){const b=$('#toasts');if(b)$$('.tcl',b).forEach(x=>x.click())}
function notify(kind,title,sub,link,opt={}){
  S.notifs.unshift({id:'n'+Date.now()+Math.random(),kind,title,sub,t:now(),read:false,link});
  if(S.notifs.length>60)S.notifs.length=60;
  /* with pop-ups off it still lands in the bell panel and still rings the badge */
  if(S.set.pop)toast(title,sub,{...opt,go:link?()=>go(link.page,link):null});
  Voice.say(kind);
  const b=$('#bellBtn');b.classList.remove('ring');void b.offsetWidth;b.classList.add('ring');
  changed();
}

/* ================= change bus (batched, no full re-render) ================= */
let _chg=false;
function changed(){if(_chg)return;_chg=true;requestAnimationFrame(()=>{_chg=false;refreshChrome();PAGES[cur]&&PAGES[cur].refresh&&PAGES[cur].refresh();
  if(drawerOrder&&$('#drawer').classList.contains('on')){const d=$('#drawer .dw-b');const t=d?d.scrollTop:0;orderDrawer(drawerOrder);const d2=$('#drawer .dw-b');if(d2)d2.scrollTop=t}})}
const tmrCls=ts=>{const m=mins(ts);return m>=20?'b':m>=12?'w':''};
const seen=new Set();
/* mark keyed nodes: animate only nodes we have never shown before */
function settle(root){$$('[data-k]',root).forEach(el=>{const key=el.dataset.k;if(!seen.has(key)){seen.add(key);if(root.dataset.init)el.classList.add('enter')}});root.dataset.init=1}
function keepScroll(el,fn){const t=el?el.scrollTop:0;fn();if(el)el.scrollTop=t}
function countUp(el,to,fmt=x=>Math.round(x).toLocaleString('en-US')){
  if(!el)return;const from=+el.dataset.v||0;el.dataset.v=to;
  if(from===to){el.textContent=fmt(to);return}
  const t0=performance.now(),dur=from===0?900:650;
  const step=t=>{const p=Math.max(0,Math.min(1,(t-t0)/dur)),e=1-Math.pow(1-p,3);el.textContent=fmt(from+(to-from)*e);if(p<1)requestAnimationFrame(step)};
  requestAnimationFrame(step);
}

/* ================= selectors ================= */
const tonight=()=>S.orders.filter(o=>o.t.placed>=SHIFT0);
const byStatus=st=>S.orders.filter(o=>o.t.placed>=SHIFT0-DAY&&o.status===st);
const live=()=>S.orders.filter(o=>['new','approved','preparing','ready','out'].includes(o.status));
const isLate=o=>['new','approved','preparing','ready','out'].includes(o.status)&&mins(o.t.placed)>=50;
const custName=o=>S.cmap[o.cid]?.name||'Customer';
const itemsShort=o=>o.items.map(it=>it.qty+'× '+MM[it.mid].name).join(', ');
const ST={new:'Awaiting approval',approved:'Queued in kitchen',preparing:'Cooking',ready:'Ready for rider',out:'Out for delivery',delivered:'Delivered',cancelled:'Cancelled'};
const stTag=s=>`<span class="tag t-${s}">${ST[s]}</span>`;
const payTag=o=>`<span class="tag ${o.paid?'t-delivered':(o.pay==='COD'?'':'t-new')}">${ic(o.pay==='COD'?'cash':'wallet')}${o.pay==='COD'?'COD':o.pay==='Bank'?'Bank':o.pay}${o.pay!=='COD'?(o.paid?' · paid':' · verify'):''}</span>`;
const segOf=c=>{if(c.blocked)return 'blocked';if(c.since>=SHIFT0-7*DAY)return 'new';if(c.last&&c.last<now()-30*DAY)return 'inactive';if(c.n>=14)return 'vip';return 'regular'};
const SEGNAME={vip:'VIP',new:'New',inactive:'Inactive',regular:'Regular',blocked:'Blocked'};
const segTag=c=>{const s=segOf(c);return `<span class="tag ${s==='vip'?'t-vip':s==='new'?'t-approved':s==='inactive'?'t-cancelled':s==='blocked'?'t-cancelled':''}">${s==='vip'?ic('crown'):''}${SEGNAME[s]}</span>`};
const freeRiders=()=>S.riders.filter(r=>r.status!=='off').sort((a,b)=>a.orders.length-b.orders.length||a.today-b.today);
/* ---------- what a rider is carrying, and what he owes ----------
   to take  = cash-on-delivery orders he is out with right now, not collected yet
   collected= COD cash in his pocket since his last hand-in
   delivered= orders he finished tonight                                        */
const riderOut=r=>r.orders.map(id=>S.omap[id]).filter(Boolean);
/* The rider and the counter watch the same money from two ends.

   RIDER'S SCREEN
     To take  = cash-on-delivery orders still at the customer
     To give  = cash in his pocket, waiting to be handed in
     marking a drop delivered moves it from the first to the second

   COUNTER'S SCREEN
     To take   = everything he owes — on the road or in his pocket, it is all
                 still out of the till, so delivering changes nothing here
     Collected = cash actually handed in tonight; it only ever grows

   Receive at the counter is the one thing that moves money between them. */
const onRoad=r=>riderOut(r).filter(o=>o.pay==='COD').reduce((a,o)=>a+o.total,0);
const riderTake=r=>onRoad(r);          /* rider: still to collect  */
const riderGive=r=>r.cash;             /* rider: still to hand in  */
const toTake=r=>onRoad(r)+r.cash;      /* counter: still out of the till */
const collected=r=>(r.handins||[]).reduce((a,h)=>a+h.amt,0);
const riderDone=r=>S.orders.filter(o=>o.rider===r.id&&o.status==='delivered'&&o.t.delivered>=SHIFT0).sort((a,b)=>b.t.delivered-a.t.delivered);
const riderHolding=r=>riderDone(r).filter(o=>o.pay==='COD'&&o.t.delivered>r.settledAt);
const roadCash=()=>S.riders.reduce((a,r)=>a+toTake(r),0);      /* owed by every rider */
const heldCash=()=>S.riders.reduce((a,r)=>a+r.cash,0);          /* sitting in pockets */
const collectedCash=()=>S.riders.reduce((a,r)=>a+collected(r),0);

/* ================= actions (the glue that interconnects every page) ================= */
const A={
 approve(id,silent){const o=S.omap[id];if(!o||o.status!=='new')return;o.status='approved';o.t.approved=now();
   if(!silent)toast('Sent to kitchen',`${o.id} · ${custName(o)} is queued in the kitchen`,{icon:'chef',tone:'ok',go:()=>go('orders',{tab:'kitchen'})});
   const ch=S.chats.find(c=>c.orderId===id);if(ch)pushMsg(ch,'ai',`Aap ka order ${o.id} confirm ho gaya hai aur kitchen mein chala gaya hai. Approx 35–45 min mein pohoch jayega.`);
   changed()},
 cancel(id,reason){const o=S.omap[id];if(!o)return;const wasOut=o.status==='out';o.status='cancelled';o.t.cancelled=now();o.cancelReason=reason||'Cancelled by staff';
   if(o.rider){const r=S.riders.find(x=>x.id===o.rider);if(r){r.orders=r.orders.filter(x=>x!==id);if(!r.orders.length&&r.status==='busy')r.status='free'}}
   const ch=S.chats.find(c=>c.orderId===id);if(ch)pushMsg(ch,'st',`Sorry, aap ka order ${o.id} cancel kar diya gaya hai. Kisi bhi sawal ke liye isi chat par message karein.`);
   toast('Order cancelled',o.id+' · '+custName(o),{icon:'x',tone:'bad'});changed()},
 start(id){const o=S.omap[id];if(!o||o.status!=='approved')return;o.status='preparing';o.t.preparing=now();changed()},
 ready(id){const o=S.omap[id];if(!o||!['approved','preparing'].includes(o.status))return;if(!o.t.preparing)o.t.preparing=now();o.status='ready';o.t.ready=now();
   notify('kitchenReady',`${o.id} is ready`,`${custName(o)} · ${o.area} · assign a rider`,{page:'riders'},{icon:'chef',tone:'vio'})},
 assign(id,rid){const o=S.omap[id],r=S.riders.find(x=>x.id===rid);if(!o||!r)return;o.status='out';o.t.out=now();o.rider=rid;r.orders.push(id);r.status='busy';
   o.dueAt=Date.now()+ri(70,120)*1000;
   const ch=S.chats.find(c=>c.orderId===id);if(ch)pushMsg(ch,'ai',`Aap ka order raste mein hai! Rider ${r.name.split(' ')[0]} (${r.phone}) aap tak pohoch raha hai.`);
   /* if the rider himself is the one signed in, tell him — that is his job sheet */
   if(isRider()&&me().riderId===rid)
     notify('assigned',`New delivery · ${o.id}`,`${custName(o)} · ${o.area} · ${o.pay==='COD'?'collect '+rs(o.total):'already paid'}`,{page:'orders'},{icon:'bike',tone:'ok'});
   else toast(`${r.name.split(' ')[0]} is on the way`,`${o.id} → ${o.area}`,{icon:'bike',tone:'ok'});
   Voice.say('assigned');changed()},
 delivered(id){const o=S.omap[id];if(!o||o.status!=='out')return;o.status='delivered';o.t.delivered=now();if(o.pay==='COD')o.paid=true;
   const r=S.riders.find(x=>x.id===o.rider);if(r){r.orders=r.orders.filter(x=>x!==id);r.today++;r.earn+=60;if(o.pay==='COD')r.cash+=o.total;if(!r.orders.length&&r.status==='busy')r.status='free'}
   applyDelivered(o);
   const ch=S.chats.find(c=>c.orderId===id);if(ch){pushMsg(ch,'ai','Order deliver ho gaya! Foodies Mania choose karne ka shukriya. Have some more! 🧡');ch.state='done'}
   notify('delivered',`${o.id} delivered`,`${r?r.name.split(' ')[0]:'Rider'} · ${custName(o)} · ${rs(o.total)}${o.pay==='COD'?' cash collected':''}`,{page:'orders',order:id},{icon:'check',tone:'ok'})},
 markPaid(id){const o=S.omap[id];o.paid=true;toast('Payment marked received',`${o.id} · ${payName[o.pay]} · ${rs(o.total)}`,{icon:'wallet',tone:'ok'});changed()},
 /* the owner types in what he actually counted, so a short hand-in stays on the books */
 settle(rid,amt){const r=S.riders.find(x=>x.id===rid);const got=Math.max(0,Math.min(r.cash,Math.round(amt)));
   if(got<=0)return;
   r.cash-=got;
   (r.handins||(r.handins=[])).push({t:now(),amt:got});   /* the Collected ledger */
   /* keep the list of collected orders until he is square, so the number and
      the breakdown behind it always agree */
   if(r.cash===0)r.settledAt=now();
   toast('Cash received',r.cash?`${rs(got)} from ${r.name} · ${rs(r.cash)} still to hand in`:`${rs(got)} from ${r.name} · all settled`,{icon:'cash',tone:r.cash?'':'ok'});changed()},
 duty(rid){const r=S.riders.find(x=>x.id===rid);if(r.status==='off')r.status=r.orders.length?'busy':'free';else if(!r.orders.length)r.status='off';else{toast('Rider still has orders','Finish deliveries before going off duty',{icon:'alert',tone:'bad'});return}changed()},
 toggleItem(mid){const m=MM[mid];m.avail=!m.avail;toast(m.avail?`${m.name} is back on`:`${m.name} switched off`,m.avail?'The AI agent will offer it again':'The AI agent will tell customers it is unavailable',{icon:m.avail?'check':'block',tone:m.avail?'ok':'bad'});changed()},
 toggleCat(cid){const c=CM[cid];c.avail=!c.avail;const n=MENU.filter(m=>m.cat===cid).length;
   toast(c.avail?`${c.name} is back on`:`${c.name} switched off`,
     c.avail?`The AI agent can offer all ${n} ${c.name.toLowerCase()} again`:`The AI agent will tell customers ${c.name.toLowerCase()} are not available tonight — all ${n} items`,
     {icon:c.avail?'check':'block',tone:c.avail?'ok':'bad'});changed()},
 setWA(on){S.set.wa=on;if(!on){notify('wa','WhatsApp disconnected','New chats and AI replies are paused until you reconnect',{page:'settings',sec:'wa'},{icon:'unlink',tone:'bad'})}else{Voice.say('wa',false,1);toast('WhatsApp connected','AI agent is replying to customers again',{icon:'wa',tone:'ok'});changed()}}
};

/* ================= live chats (AI agent simulation) ================= */
const GREET=['Assalam o Alaikum','Hi','AoA bhai','Hello, order karna hai','Salam, menu bhej dein','Hey Foodies Mania!','Bhai order lena hai',
 'Salam, kya open ho?','Order karna tha','AoA, delivery kar dete ho?','Hi, deal kya chal rahi hai?','Bhai kitni der lagti hai delivery mein?'];
const CONFIRM=['Haan confirm karo','Yes please','Ji confirm','Done 👍','Haan jaldi bhejna','Ok confirm','Bilkul, bhej do','Theek hai confirm'];
const HUMAN_Q=['Bhai pichla order 1 ghanta late aya tha, kuch karo','Birthday ke liye 15 pizza ka bulk order hai, rate kya hoga?',
 'Mera order abhi tak nahi aya, rider ka number do','Kya aap office mein monthly lunch supply karte ho?',
 'Last time fries thande thay, refund mil sakta hai?','Shadi ke liye 100 logon ka order hai, owner se baat karni hai',
 'Mujhe apna pichla bill chahiye, company mein jama karna hai','Rider ne ghalat order de diya, exchange ho sakta hai?',
 'Aap ke yahan koi job hai delivery ki?','Payment ho gayi thi lekin order cancel ho gaya, paise wapis kaise milenge?',
 'Catering ka rate list bhej dein please','Kal raat ka order double charge ho gaya hai'];
const ADDR_REPLY=a=>a;
function pushMsg(ch,from,text){ch.msgs.push({from,text,t:now()});ch.last=now();if(from==='c'&&cur!=='chats'||from==='c'&&openChat!==ch.id)ch.unread=(ch.unread||0)+1;PAGES.chats.onMsg&&PAGES.chats.onMsg(ch);changed()}
function newChat(opts={}){
  if(!S.set.wa)return;
  let c=opts.c;
  if(!c){const pool=S.customers.filter(x=>!x.blocked);c=rnd()<.7?wpick(pool,x=>x.w+.2):null}
  let isNew=false;
  if(!c){isNew=true;const area=wpick(AREAS,a=>a.w).name;const nm=(rnd()<.7?pick(FIRST_M):pick(FIRST_F))+' '+pick(LAST);
    c={id:'c'+S.customers.length,name:nm,phone:phoneNo(),area,addr:addrFor(area),since:now(),w:1,n:0,spent:0,first:null,last:0,fav:{},note:'',blocked:false,pays:{}};S.customers.push(c);S.cmap[c.id]=c}
  const r=opts.kind||wpick(['delivery','takeaway','human'],x=>({delivery:72,takeaway:18,human:10})[x]);
  const ch={id:'ch'+Date.now()+ri(0,999),cid:c.id,state:'ai',msgs:[],unread:0,last:now(),draft:{items:[],note:'',addr:'',area:'',fee:0,pay:''},kind:r,typing:false,isNew};
  S.chats.unshift(ch);
  runScript(ch,buildScript(ch,c,r,opts.campaign));
  notify('newChat',`New chat · ${c.name}`,isNew?'First-time customer on WhatsApp':`${c.n} past orders · ${c.area}`,{page:'chats',chat:ch.id},{icon:'wa'});
}
/* the takeaway reply the owner can edit in Settings */
const takeText=()=>String(S.set.takeMsg||'').replaceAll('{number}',S.set.takeNo);
function buildScript(ch,c,kind,campaign){
  const s=[];const d=ch.draft;
  const C=(text,fn)=>s.push({who:'c',text,fn}),AI=(text,fn)=>s.push({who:'ai',text,fn});
  C(campaign?`Salam, ${campaign} wala offer chal raha hai?`:pick(GREET));
  AI(`Assalam o Alaikum${c.n?' '+c.name.split(' ')[0]:''}! Foodies Mania mein khush aamdeed 🍔🍕\nDelivery chahiye ya Takeaway?\n1. Delivery\n2. Takeaway`);
  if(kind==='takeaway'){
    C(pick(['Takeaway','2','Takeaway khud le lunga','Pickup karunga']));
    AI(()=>takeText(),()=>{ch.state='takeaway';S.takeaway.push({name:c.name,phone:c.phone,t:now()});Voice.say('takeaway');changed()});
    return s;
  }
  C(pick(['Delivery','1','Delivery please','Ghar pe chahiye']));
  if(kind==='human'){
    AI('Zaroor! Kya order karna chahenge?');
    C(pick(HUMAN_Q));
    AI('Main aap ko abhi humari team se connect kar raha hun, thora sa intezar karein 🙏',()=>{ch.state='human';notify('needsHuman',`${c.name} needs a human`,'AI handed the chat over. Tap to take it.',{page:'chats',chat:ch.id},{icon:'headset',tone:'bad'})});
    return s;
  }
  const off=MENU.filter(m=>!isOn(m)&&m.cat!=='drink');
  const items=makeItems();
  const want=items.map(x=>({...x}));
  let unavail=null;
  if(off.length&&rnd()<.6){unavail=pick(off);want.unshift({mid:unavail.id,qty:1,note:''})}
  /* the agent only ever offers what is actually switched on tonight */
  const onNames=openCats().map(x=>x.name.toLowerCase());
  const menuLine=onNames.length?`${onNames.slice(0,4).join(', ')}${onNames.length>4?' aur baqi sab':''} available hai.`:'Aaj menu limited hai, main check kar ke batata hun.';
  const favOn=Object.entries(c.fav).sort((a,b)=>b[1]-a[1]).map(e=>MM[e[0]]).find(m=>m&&isOn(m));
  AI(c.n>2&&favOn?`Zaroor! Last time aap ne ${favOn.name} liya tha. Aaj kya order karenge?`:`Zaroor! Kya order karna chahenge? ${menuLine}`);
  C(want.map(x=>`${x.qty} ${MM[x.mid].say}`).join(' aur ')+pick([' bhej do',' chahiye',' please','']));
  if(unavail)AI(catOn(unavail.cat)
    ?`Maazrat, ${unavail.name} abhi available nahi hai 😔 Baqi items add kar diye hain.`
    :`Maazrat, aaj ${CM[unavail.cat].name} band hai 😔 ${menuLine} Baqi items add kar diye hain.`);
  items.forEach((it,i)=>s.push({who:'sys',silent:true,fn:()=>{d.items.push(it);changed()},delay:i?500:300}));
  const sub=items.reduce((a,x)=>a+MM[x.mid].price*x.qty,0);
  AI(`Got it!\n${items.map(x=>`• ${x.qty}× ${MM[x.mid].name} — ${rs(MM[x.mid].price*x.qty)}`).join('\n')}\nKoi special instruction? (jaise onion nahi, extra spicy)`);
  const note=rnd()<.55?pick(NOTES):'';
  C(note?note:pick(['Nahi bas','No','Nahi theek hai']),()=>{d.note=note;changed()});
  if(c.n>0){AI(`Delivery isi address par karein?\n📍 ${c.addr}`);C(pick(['Haan','Ji same','Yes']),()=>{d.addr=c.addr;d.area=c.area;d.fee=feeOf(c.area);changed()})}
  else{AI('Apna delivery address bata dein (area ke saath).');C(ADDR_REPLY(c.addr),()=>{d.addr=c.addr;d.area=c.area;d.fee=feeOf(c.area);changed()})}
  const pay=wpick(PAYS,p=>p[1])[0];
  AI('Payment kaise karenge?\n1. Cash on Delivery\n2. EasyPaisa\n3. JazzCash\n4. Bank Transfer');
  C({COD:'Cash',EasyPaisa:'Easypaisa',JazzCash:'Jazzcash',Bank:'Bank transfer'}[pay],()=>{d.pay=pay;changed()});
  AI(()=>`Total: ${rs(sub)} + delivery ${rs(feeOf(c.area))} (${c.area}) = *${rs(sub+feeOf(c.area))}*${pay!=='COD'?`\n${payName[pay]} details bhej raha hun, payment ke baad screenshot share kar dein.`:''}\nOrder confirm kar dun?`);
  C(pick(CONFIRM));
  AI(()=>{const o=calc({id:newId(),cid:c.id,items:d.items.map(x=>({...x})),note:d.note,area:c.area,addr:c.addr,fee:feeOf(c.area),pay,paid:false,status:'new',t:{placed:now()},rider:null,src:'ai'});
    addOrder(o);ch.orderId=o.id;ch.state='placed';
    setTimeout(()=>notify('newOrder',`New order ${o.id}`,`${c.name} · ${o.area} · ${rs(o.total)}`,{page:'orders',order:o.id},{icon:'bike'}),400);
    if(S.set.autoKitchen)setTimeout(()=>A.approve(o.id,true),5000);
    return `Shukriya! Aap ka order *${o.id}* place ho gaya ✅\nRestaurant approve karte hi kitchen mein chala jayega.`});
  return s;
}
function runScript(ch,steps){
  let i=0;
  const next=()=>{
    if(i>=steps.length)return;
    if(ch.state==='human'&&steps[i].who!=='sys'&&!ch._final){ch.paused=steps.slice(i);return}
    if(!S.set.wa){ch.paused=steps.slice(i);return}
    const st=steps[i++];
    if(st.who==='sys'){st.fn&&st.fn();setTimeout(next,st.delay||400);return}
    if(st.who==='ai'){
      ch.typing=true;PAGES.chats.onTyping&&PAGES.chats.onTyping(ch);
      setTimeout(()=>{if(ch.state==='human'&&!st._force){ch.typing=false;PAGES.chats.onTyping&&PAGES.chats.onTyping(ch);ch.paused=[st,...steps.slice(i)];return}
        ch.typing=false;const text=typeof st.text==='function'?st.text():st.text;pushMsg(ch,'ai',text);st.fn&&st.fn();setTimeout(next,ri(1400,2600))},ri(1300,2200));
    }else{
      setTimeout(()=>{pushMsg(ch,'c',st.text);st.fn&&st.fn();setTimeout(next,600)},ri(2600,5200));
    }
  };
  setTimeout(next,300);
}

/* seed some earlier chats so the inbox has history */
(function seedChats(){
  const mk=(c,state,msgs,ago,extra={})=>{const base=now()-ago*MIN;const ch={id:'chs'+S.chats.length,cid:c.id,state,msgs:msgs.map((m,i)=>({from:m[0],text:m[1],t:base+i*40000})),unread:0,last:base+msgs.length*40000,draft:{items:[],note:'',addr:'',area:'',fee:0,pay:''},kind:'delivery',...extra};S.chats.push(ch);return ch};
  const recentOrders=S.orders.filter(o=>o.t.placed>=SHIFT0&&o.status!=='cancelled').slice(-8).reverse();
  recentOrders.forEach((o,i)=>{const c=S.cmap[o.cid];
    const ch=mk(c,o.status==='delivered'?'done':'placed',[['c',pick(GREET)],['ai',`Assalam o Alaikum! Foodies Mania mein khush aamdeed 🍔🍕\nDelivery chahiye ya Takeaway?`],['c','Delivery'],['ai','Zaroor! Kya order karna chahenge?'],['c',o.items.map(x=>`${x.qty} ${MM[x.mid].say}`).join(' aur ')],['ai',`Got it!\n${o.items.map(x=>`• ${x.qty}× ${MM[x.mid].name} — ${rs(MM[x.mid].price*x.qty)}`).join('\n')}\nKoi special instruction?`],['c',o.note||'Nahi bas'],['ai',`Total ${rs(o.total)} including delivery to ${o.area}. Confirm?`],['c',pick(CONFIRM)],['ai',`Shukriya! Aap ka order *${o.id}* place ho gaya ✅`]],mins(o.t.placed)+4);
    ch.orderId=o.id;ch.draft={items:o.items,note:o.note,addr:o.addr,area:o.area,fee:o.fee,pay:o.pay};ch.last=o.t.placed;ch.msgs.forEach((m,j)=>m.t=o.t.placed-(10-j)*35000);});
  const hc=S.customers[17];mk(hc,'human',[['c','AoA'],['ai','Assalam o Alaikum! Delivery chahiye ya Takeaway?'],['c','Delivery'],['ai','Zaroor! Kya order karna chahenge?'],['c','Kal 20 logon ka dinner hai office mein, koi deal milegi?'],['ai','Main aap ko abhi humari team se connect kar raha hun, thora sa intezar karein 🙏']],6).unread=1;
  S.takeaway.slice(-2).forEach(t=>{const c=S.customers.find(x=>x.name===t.name)||S.customers[3];mk(c,'takeaway',[['c','Salam'],['ai','Delivery chahiye ya Takeaway?'],['c','Takeaway'],['ai',takeText()]],mins(t.t)+2)});
  S.chats.sort((a,b)=>b.last-a.last);
})();

/* Several AI agents are already mid-conversation when the owner signs in.
   Seeded in silence on purpose: the notification feed is for things that
   happen while he is watching, not for a backlog at startup. */
(function seedLive(){
  _seed=8613;
  const pool=S.customers.filter(c=>!c.blocked&&!c.quiet&&c.n>0);
  const used=new Set();
  const menuLine=()=>{const n=openCats().map(x=>x.name.toLowerCase());return n.length?n.slice(0,4).join(', ')+' available hai.':'menu check kar raha hun.'};
  const mkLive=(stage,agoMin)=>{
    let c,guard=0;do{c=wpick(pool,x=>x.w+.2);guard++}while(used.has(c.id)&&guard<40);
    if(used.has(c.id))return;used.add(c.id);
    const items=makeItems();if(!items.length)return;
    const base=now()-agoMin*MIN;const M=[];
    const push=(from,text)=>M.push({from,text,t:base+M.length*42000});
    const draft={items:[],note:'',addr:'',area:'',fee:0,pay:''};
    push('c',pick(GREET));
    push('ai',`Assalam o Alaikum${c.n?' '+c.name.split(' ')[0]:''}! Foodies Mania mein khush aamdeed 🍔🍕\nDelivery chahiye ya Takeaway?\n1. Delivery\n2. Takeaway`);
    push('c',pick(['Delivery','1','Delivery please','Ghar pe chahiye']));
    push('ai',`Zaroor! Kya order karna chahenge? ${menuLine()}`);
    if(stage>=2){
      push('c',items.map(x=>`${x.qty} ${MM[x.mid].say}`).join(' aur ')+pick([' bhej do',' chahiye','']));
      draft.items=items.map(x=>({...x}));
      push('ai',`Got it!\n${items.map(x=>`• ${x.qty}× ${MM[x.mid].name} — ${rs(MM[x.mid].price*x.qty)}`).join('\n')}\nKoi special instruction? (jaise onion nahi, extra spicy)`);
    }
    if(stage>=3){
      const note=pick(NOTES);push('c',note);draft.note=note;
      push('ai',`Delivery isi address par karein?\n📍 ${c.addr}`);
    }
    if(stage>=4){
      push('c',pick(['Haan','Ji same','Yes']));
      draft.addr=c.addr;draft.area=c.area;draft.fee=feeOf(c.area);
      push('ai','Payment kaise karenge?\n1. Cash on Delivery\n2. EasyPaisa\n3. JazzCash\n4. Bank Transfer');
    }
    S.chats.push({id:'chl'+S.chats.length+'x',cid:c.id,state:'ai',msgs:M,unread:0,last:M.at(-1).t,draft,kind:'delivery',typing:false});
  };
  [[2,11],[3,8],[1,6],[4,5],[2,3],[1,2],[3,1]].forEach(([st,ag])=>mkLive(st,ag));
  S.chats.sort((a,b)=>b.last-a.last);
})();

/* ================= simulation loop ================= */
let simTimer=null;
function simStart(){
  // stagger the riders already on the road
  S.orders.filter(o=>o.status==='out').forEach((o,i)=>o.dueAt=Date.now()+(55+i*40)*1000);
  setTimeout(()=>newChat({kind:'delivery'}),5000);
  setTimeout(()=>newChat({kind:'takeaway'}),19000);
  /* the arrival rate is what sets the notification rate, so it stays as it was.
     The cap is only there to stop the inbox running away. */
  const loop=()=>{simTimer=setTimeout(()=>{if(S.set.sim&&S.set.wa){const active=S.chats.filter(c=>c.state==='ai').length;if(active<12)newChat()}loop()},78000)};   /* a new WhatsApp chat every 1.3 minutes */
  setTimeout(loop,26000);
  /* while a rider is the one signed in, the counter hands him a ready order now
     and then, so his screen behaves like a real shift */
  setInterval(()=>{
    if(!S.set.sim||!isRider())return;
    const r=myRider();if(!r||r.status==='off'||r.orders.length>=3)return;
    const ready=byStatus('ready')[0];if(!ready)return;
    A.assign(ready.id,r.id);
  },38000);
  setInterval(tick,1000);
}
let lateWarned=new Set(),lastMinute=0;
function tick(){
  // timers on screen
  $$('[data-since]').forEach(el=>{const ts=+el.dataset.since;el.textContent=el.dataset.fmt==='mmss'?mmss(ts):ago(ts);
    if(el.classList.contains('tmr')){const c=tmrCls(ts);el.classList.toggle('w',c==='w');el.classList.toggle('b',c==='b')}});
  // riders complete deliveries on their own (demo)
  if(S.set.sim)S.orders.forEach(o=>{if(o.status==='out'&&o.dueAt&&Date.now()>o.dueAt){o.dueAt=null;A.delivered(o.id)}});
  // late warnings
  live().forEach(o=>{if(isLate(o)&&!lateWarned.has(o.id)){lateWarned.add(o.id);notify('late',`${o.id} is running late`,`${mins(o.t.placed)} min since order · ${ST[o.status]}`,{page:'orders',order:o.id},{icon:'alert',tone:'bad'})}});
  const m=Math.floor(now()/MIN);if(m!==lastMinute){lastMinute=m;changed()}
}
/* ================= router + chrome ================= */
const NAV=[
 {id:'dash',t:'Dashboard',ic:'dash'},{id:'chats',t:'Live Conversations',ic:'chat'},{id:'orders',t:'Delivery Orders',ic:'bike'},
 {id:'riders',t:'Riders',ic:'helmet'},{id:'kitchen',t:'Kitchen',ic:'chef'},{h:'Grow'},{id:'bulk',t:'Bulk Message',ic:'send',soon:1},
 {id:'menu',t:'Menu Management',ic:'cloche'},{id:'customers',t:'Customers',ic:'users'},{id:'reports',t:'Payments & Reports',ic:'chart',soon:1},
 {id:'promos',t:'Promotions & Offers',ic:'tag',soon:1},{h:'Account'},{id:'settings',t:'Settings',ic:'gear'}];
const BNAV=[{id:'dash',t:'Home',ic:'dash'},{id:'chats',t:'Chats',ic:'chat'},{id:'orders',t:'Orders',ic:'bike'},{id:'riders',t:'Riders',ic:'helmet'},{id:'more',t:'More',ic:'bars'}];
let cur='dash',openChat=null;
/* the signed-in user decides what the nav shows and what the dashboard is */
const me=()=>S.me||S.users[0];
const myPerms=()=>new Set(userPerms(me()));
const isRider=()=>me().role==='rider';
const myRider=()=>S.riders.find(r=>r.id===me().riderId)||null;
const canSee=p=>myPerms().has(p);
const PAGES={};
function buildNav(){
  const ok=myPerms();
  /* keep the pages this user may open, then drop any heading left with nothing under it */
  const items=NAV.filter(n=>n.h||ok.has(n.id));
  const nav=items.filter((n,i)=>!n.h||(items[i+1]&&!items[i+1].h));
  $('#nav').innerHTML=nav.map(n=>n.h?`<div class="nav-h">${n.h}</div>`:`<button data-p="${n.id}" title="${n.t}">${ic(n.ic)}<span>${n.t}</span>${n.soon?'<span class="soon">Soon</span>':`<span class="cnt" data-nb="${n.id}" hidden></span>`}</button>`).join('');
  const bn=BNAV.filter(n=>n.id==='more'?nav.filter(x=>!x.h).length>4:ok.has(n.id));
  $('#bnav').innerHTML=bn.map(n=>`<button data-p="${n.id}">${ic(n.ic)}<span>${n.t}</span><span class="cnt" data-nb="${n.id}" hidden></span></button>`).join('');
  $('#bnav').style.gridTemplateColumns=`repeat(${Math.max(1,bn.length)},1fr)`;
  $$('#nav button,#bnav button').forEach(b=>b.onclick=()=>{if(b.dataset.p==='more')return toggleSide(true);go(b.dataset.p)});
}
function go(p,opts={}){
  if(p==='more'){toggleSide(true);return}
  closeDrawer();closeNP();toggleSide(false);
  const page=PAGES[p];if(!page)return;
  if(!canSee(p)){toast('No access','Ask the owner to switch this on for you in Settings',{icon:'lock',tone:'bad'});return}
  if(p===cur&&!opts.force){page.open&&page.open(opts);return}
  cur=p;
  $$('#nav button,#bnav button').forEach(b=>b.classList.toggle('on',b.dataset.p===p||(b.dataset.p==='more'&&!BNAV.some(x=>x.id===p))));
  $('#pgTitle').textContent=NAV.find(n=>n.id===p).t;
  const c=$('#content');c.className='content'+(page.flush?' flush':'');
  Smooth.top();
  c.innerHTML=`<div class="page" id="pg"></div>`;
  delete $('#pg').dataset.init;
  page.render($('#pg'),opts);
  Smooth.attach();
  Reveal.scan();
  refreshChrome();
}
let lastBadge={};
function refreshChrome(){
  const counts={chats:S.chats.filter(c=>c.state==='human').length,orders:byStatus('new').length+byStatus('approved').length+byStatus('preparing').length,riders:byStatus('ready').length};
  const unreadChats=S.chats.reduce((a,c)=>a+(c.unread||0),0);
  $$('[data-nb]').forEach(el=>{const id=el.dataset.nb;let n=counts[id]||0;if(id==='chats')n=counts.chats||unreadChats;
    el.hidden=!n;el.textContent=n;el.classList.toggle('red',id==='chats'&&counts.chats>0);
    if(lastBadge[id]!==undefined&&n>lastBadge[id]){el.classList.add('bump');setTimeout(()=>el.classList.remove('bump'),300)}});
  lastBadge={...counts};
  const un=S.notifs.filter(n=>!n.read).length;const b=$('#bellN');b.hidden=!un;b.textContent=un>9?'9+':un;
  const w=$('#waPill');w.className='wa '+(S.set.wa?'on':'off');w.querySelector('.dot').className='dot'+(S.set.wa?'':' red');$('#waTxt').textContent=S.set.wa?'Connected':'Disconnected';
  $('#liveTag').hidden=!S.set.wa;
  $('#voiceBtn').innerHTML=ic(S.set.voice?'sound':'mute');$('#voiceBtn').title=S.set.voice?'Voice alerts on':'Voice alerts off';
  $('#npPop').classList.toggle('on',S.set.pop);
  $('#bellBtn').classList.toggle('muted',!S.set.pop);
  if($('#np').classList.contains('on'))renderNP();
}
/* Riders get notifications only — never a voice talking over the shop floor. */
function applyRole(){
  buildNav();
  const r=isRider();
  $('#voiceBtn').hidden=r;
  if(r)S.set.voice=false;
  $('#meRole').textContent=(ROLES[me().role]||ROLES.admin).name;
  const first=canSee(cur)?cur:(NAV.find(n=>!n.h&&canSee(n.id))||{id:'dash'}).id;
  go(first,{force:true});
  refreshChrome();
}
function toggleSide(on){$('#side').classList.toggle('on',on);$('#scrim').classList.toggle('on',on||$('#drawer').classList.contains('on'))}

/* ---------- theme, sidebar width, full screen ---------- */
const LS={get(k,d){try{const v=localStorage.getItem('fm:'+k);return v==null?d:v}catch(e){return d}},
 set(k,v){try{localStorage.setItem('fm:'+k,v)}catch(e){}}};
const Theme={
 cur:LS.get('theme','dark'),
 apply(){document.documentElement.dataset.theme=this.cur;
   const b=$('#themeBtn');if(b){b.innerHTML=ic(this.cur==='dark'?'sun':'moon');b.title=this.cur==='dark'?'Switch to light mode':'Switch to dark mode'}},
 toggle(){this.cur=this.cur==='dark'?'light':'dark';LS.set('theme',this.cur);this.apply();
   toast(this.cur==='light'?'Light mode on':'Dark mode on',this.cur==='light'?'White working area, same warm brand colours':'Back to the kitchen-at-night console',{icon:this.cur==='dark'?'moon':'sun'})}
};
const Side={
 mini:LS.get('side','full')==='mini',
 apply(){document.documentElement.dataset.side=this.mini?'mini':'full';
   const b=$('#burger');if(b)b.title=innerWidth<=1024?'Menu':(this.mini?'Expand sidebar':'Collapse sidebar')},
 toggle(){this.mini=!this.mini;LS.set('side',this.mini?'mini':'full');this.apply()}
};
/* ---------- smooth scrolling and scroll-in motion ----------
   Lenis drives the wheel; touch is left alone because a phone's own scrolling is
   already better than anything we would put in front of it. Everything degrades
   to plain native scrolling if the script does not load. */
const reduceMotion=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
const Smooth={
 lenis:null,running:false,
 init(){
   if(reduceMotion()||!window.Lenis)return;
   this.attach();
   if(this.running)return;
   this.running=true;
   const tick=t=>{if(this.lenis)this.lenis.raf(t);requestAnimationFrame(tick)};
   requestAnimationFrame(tick);
   addEventListener('resize',()=>{try{this.lenis&&this.lenis.resize()}catch(e){}});
 },
 attach(){
   if(reduceMotion()||!window.Lenis)return;
   if(this.lenis){try{this.lenis.destroy()}catch(e){}this.lenis=null}
   const wrap=$('#content'),content=$('#pg');
   if(!wrap||!content||wrap.classList.contains('flush'))return;  /* chats scrolls its own panes */
   try{
     this.lenis=new window.Lenis({
       wrapper:wrap,content,
       duration:.85,
       easing:t=>1-Math.pow(1-t,3),
       smoothWheel:true,
       syncTouch:false,
       wheelMultiplier:1,
       overscroll:false
     });
   }catch(e){this.lenis=null}
 },
 /* a page change should land at the top instantly, not glide there */
 top(){
   if(this.lenis){try{this.lenis.scrollTo(0,{immediate:true});return}catch(e){}}
   const c=$('#content');if(c)c.scrollTop=0;
 }
};
/* cards below the fold rise in as you reach them — transform and opacity only */
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
   $$('#pg > .card, #pg > .grid > *, #pg > .rdrops > *').forEach(el=>{
     if(el.dataset.rv)return;
     if(el.getBoundingClientRect().top>fold){el.dataset.rv=1;el.classList.add('rv');this.io.observe(el)}
   });
 }
};

/* ---------- install as an app ---------- */
/* The worker plus the manifest is what puts the install icon in Chrome's
   address bar; this button fires the same prompt, within reach on a phone. */
const Install={
 evt:null,
 init(){
   if('serviceWorker' in navigator)
     addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
   /* Chrome also shows its own install icon in the address bar; this keeps the
      same prompt so Settings can offer a proper button for it. */
   addEventListener('beforeinstallprompt',e=>{e.preventDefault();this.evt=e;
     if(cur==='settings'&&setSec==='app')PAGES.settings.body()});
   addEventListener('appinstalled',()=>{this.evt=null;
     toast('Installed','Foodies Mania CRM now opens from your home screen',{icon:'check',tone:'ok'});
     if(cur==='settings'&&setSec==='app')PAGES.settings.body()});
 },
 /* fire the real prompt; resolves to what the person chose */
 async prompt(){
   const e=this.evt;if(!e)return 'unavailable';
   this.evt=null;
   try{e.prompt();const c=await e.userChoice;return c&&c.outcome||'dismissed'}
   catch(err){return 'failed'}
 },
 can(){return !!this.evt},
 standalone(){try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}catch(e){return false}},
 /* iOS never fires the prompt, so tell them where the button actually is */
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
  else toast('Full screen not supported','This browser does not offer it',{icon:'alert',tone:'bad'});
}

/* ---------- notifications panel ---------- */
const NIC={newChat:'wa',newOrder:'bike',needsHuman:'headset',kitchenReady:'chef',delivered:'check',late:'alert',wa:'unlink',assigned:'bike'};
function renderNP(){
  $('#npB').innerHTML=S.notifs.length?S.notifs.slice(0,30).map(n=>`<button class="${n.read?'':'unread'}" data-id="${n.id}"><span class="ti">${ic(NIC[n.kind]||'bell')}</span><span class="grow"><b>${esc(n.title)}</b><small>${esc(n.sub||'')}</small><small>${ago(n.t)}</small></span></button>`).join(''):`<div class="empty">${ic('bell')}No notifications yet. New chats, orders and kitchen alerts land here.</div>`;
  $$('#npB button').forEach(b=>b.onclick=()=>{const n=S.notifs.find(x=>x.id===b.dataset.id);n.read=true;closeNP();if(n.link)go(n.link.page,n.link);refreshChrome()});
}
function closeNP(){$('#np').classList.remove('on')}

/* ---------- drawer + modal ---------- */
function openDrawer(html,onMount){const d=$('#drawer');d.innerHTML=html;d.classList.add('on');$('#scrim').classList.add('on');$$('[data-close]',d).forEach(b=>b.onclick=closeDrawer);onMount&&onMount(d)}
function closeDrawer(){$('#drawer').classList.remove('on');if(!$('#side').classList.contains('on'))$('#scrim').classList.remove('on');drawerOrder=null}
function modal(html,onMount){const m=$('#modal');$('#modalIn').innerHTML=html;m.classList.add('on');$$('[data-close]',m).forEach(b=>b.onclick=closeModal);onMount&&onMount($('#modalIn'))}
function closeModal(){$('#modal').classList.remove('on')}
function confirmBox(title,sub,okText,fn,danger){modal(`<div class="md-h"><div class="grow"><h3>${esc(title)}</h3><p>${esc(sub)}</p></div></div><div class="md-f"><button class="btn ghost" data-close>Keep it</button><button class="btn ${danger?'danger':'pri'}" id="mOk">${esc(okText)}</button></div>`,m=>$('#mOk',m).onclick=()=>{closeModal();fn()})}

/* ---------- order drawer ---------- */
let drawerOrder=null;
function orderDrawer(id){
  const o=S.omap[id];if(!o)return;drawerOrder=id;const c=S.cmap[o.cid];const r=S.riders.find(x=>x.id===o.rider);
  const steps=[['placed','Order placed by AI agent'],['approved','Approved, sent to kitchen'],['preparing','Kitchen started cooking'],['ready','Ready, waiting for rider'],['out','Out for delivery'+(r?' · '+r.name:'')],['delivered','Delivered']];
  const order=['new','approved','preparing','ready','out','delivered'];const si=order.indexOf(o.status);
  const acts={new:`<button class="btn danger" data-a="cancel">${ic('x')}Cancel</button><button class="btn pri" data-a="approve">${ic('check')}Approve → Kitchen</button>`,
    approved:`<button class="btn" data-a="kitchen">${ic('chef')}Kitchen queue</button><button class="btn pri" data-a="ready">Mark ready</button>`,
    preparing:`<button class="btn" data-a="kitchen">${ic('chef')}Kitchen queue</button><button class="btn pri" data-a="ready">Mark ready</button>`,
    ready:`<button class="btn pri" data-a="assign">${ic('helmet')}Assign rider</button>`,
    out:`<button class="btn" data-a="rider">${ic('helmet')}Riders</button><button class="btn ok" data-a="delivered">${ic('check')}Mark delivered</button>`}[o.status]||'';
  const chat=S.chats.find(x=>x.orderId===id);
  openDrawer(`<div class="dw-h"><div class="grow"><div class="row"><h3 class="mono">${o.id}</h3>${stTag(o.status)}${isLate(o)?'<span class="tag t-late">Late</span>':''}</div><small class="muted">${dstr(o.t.placed)} · ${t12(o.t.placed)}</small></div><button class="iconbtn" data-close aria-label="Close">${ic('x')}</button></div>
  <div class="dw-b">
   <div class="box row" style="gap:12px"><div class="av ${avc(c.name)}">${ini(c.name)}</div><div class="grow"><b>${esc(c.name)}</b> ${segTag(c)}<div class="muted" style="font-size:12.5px">${c.phone} · ${c.n} orders · ${rs(c.spent)} spent</div></div><button class="btn sm" data-a="cust">Profile</button></div>
   <div class="sec"><h4>Items</h4><div class="box" style="display:grid;gap:10px">${o.items.map(it=>`<div class="row">${foodIc(it.mid,'sm')}<div class="grow"><b>${it.qty}× ${esc(MM[it.mid].name)}</b>${it.note?`<div style="color:var(--warn);font-size:12px">${esc(it.note)}</div>`:''}</div><span class="num">${rs(MM[it.mid].price*it.qty)}</span></div>`).join('')}
     ${o.note?`<div class="row" style="color:var(--warn);font-size:13px;gap:8px;padding:8px 10px;border-radius:10px;background:var(--warnsoft)">${ic('note','sm')}Kitchen note: ${esc(o.note)}</div>`:''}
     <div class="kv"><span>Subtotal</span><b class="num">${rs(o.subtotal)}</b></div><div class="kv"><span>Delivery · ${esc(o.area)}</span><b class="num">${rs(o.fee)}</b></div><div class="kv tot"><span style="color:var(--fg)">Total</span><span class="num">${rs(o.total)}</span></div></div></div>
   <div class="sec"><h4>Delivery & payment</h4><div class="box" style="display:grid;gap:10px"><div class="row" style="align-items:flex-start">${ic('pin')}<span>${esc(o.addr)}</span></div><div class="row">${ic(o.pay==='COD'?'cash':'wallet')}<span class="grow">${payName[o.pay]}</span>${o.paid?'<span class="tag t-delivered">Paid</span>':o.pay==='COD'?'<span class="tag">Collect on delivery</span>':`<button class="btn sm" data-a="paid">Mark payment received</button>`}</div>${r?`<div class="row">${ic('helmet')}<span class="grow">${esc(r.name)} · ${r.bike}</span><span class="dim">${r.phone}</span></div>`:''}</div></div>
   ${o.status==='cancelled'?`<div class="box" style="color:var(--bad)">${esc(o.cancelReason||'Cancelled')}</div>`:`<div class="sec"><h4>Timeline</h4><div class="tl">${steps.map((s,i)=>{const ts=o.t[s[0]];const done=i===0||i<=si;return `<div><span class="k ${done?'done':i===si+1?'cur':''}">${done?ic('check'):''}</span><span>${s[1]}</span><small>${ts?t12(ts):''}</small></div>`}).join('')}</div></div>`}
  </div>
  <div class="dw-f">${chat?`<button class="btn" data-a="chat">${ic('chat')}Chat</button>`:''}${acts}</div>`,d=>{
    $$('[data-a]',d).forEach(b=>b.onclick=()=>{const a=b.dataset.a;
      if(a==='approve'){A.approve(id);orderDrawer(id)}
      else if(a==='cancel')confirmBox(`Cancel ${o.id}?`,`${custName(o)} will get a WhatsApp message that the order is cancelled.`,'Cancel order',()=>{A.cancel(id);orderDrawer(id)},1);
      else if(a==='ready'){A.ready(id);orderDrawer(id)}
      else if(a==='kitchen')go('orders',{tab:'kitchen'});
      else if(a==='assign')riderPicker(id,()=>orderDrawer(id));
      else if(a==='delivered'){A.delivered(id);orderDrawer(id)}
      else if(a==='paid'){A.markPaid(id);orderDrawer(id)}
      else if(a==='rider')go('riders');
      else if(a==='cust')go('customers',{cust:c.id});
      else if(a==='chat')go('chats',{chat:chat.id});
    })});
}

/* ---------- rider picker (free riders first, busy below, off duty last) ---------- */
function riderPicker(oid,after){
  const o=S.omap[oid];
  const all=[...S.riders].sort((a,b)=>({free:0,busy:1,off:2}[a.status]-{free:0,busy:1,off:2}[b.status])||a.orders.length-b.orders.length||a.today-b.today);
  const row=r=>{const areas=r.orders.map(x=>S.omap[x]?.area).filter(Boolean);const same=areas.includes(o.area);
    return `<button class="rp ${r.status==='busy'?'busy':''} ${r.status==='off'?'offd':''}" data-r="${r.id}"><div class="av ${avc(r.name)}">${ini(r.name)}</div><div class="grow"><b>${esc(r.name)}</b><div class="dim" style="font-size:12px">${r.status==='free'?'Free now':r.status==='busy'?`Carrying ${r.orders.length} · ${areas.join(', ')}`:'Off duty'} · ${r.today} delivered tonight</div></div>${same?'<span class="tag t-ready">Same area</span>':''}<span class="tag ${r.status==='free'?'t-delivered':r.status==='busy'?'t-out':''}">${r.status==='free'?'Free':r.status==='busy'?'On delivery':'Off'}</span></button>`};
  const free=all.filter(r=>r.status==='free'),busy=all.filter(r=>r.status==='busy'),off=all.filter(r=>r.status==='off');
  modal(`<div class="md-h"><div class="grow"><h3>Assign a rider</h3><p><span class="mono" style="color:var(--or2)">${o.id}</span> · ${esc(custName(o))} · ${esc(o.area)} · ${rs(o.total)} ${o.pay==='COD'?'cash':'prepaid'}</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b"><div class="rp-h"><span class="dot still"></span>Free riders (${free.length})</div>${free.map(row).join('')||'<div class="dim" style="font-size:13px">No rider is free right now.</div>'}
   ${busy.length?`<div class="rp-h">${ic('bike','sm')}On delivery, can stack</div>${busy.map(row).join('')}`:''}
   ${off.length?`<div class="rp-h">Off duty</div>${off.map(row).join('')}`:''}</div>`,m=>$$('[data-r]',m).forEach(b=>b.onclick=()=>{A.assign(oid,b.dataset.r);closeModal();after&&after()}));
}

A.riderNote=function(id,txt){const o=S.omap[id];if(!o)return;o.riderNote=txt;
  toast('Note saved',o.id+' · the counter can see this too',{icon:'note',tone:'ok'});changed()};

/* ================= A RIDER'S OWN SCREEN =================
   Everything he needs and nothing he does not: what is on his bike, what he
   has to collect, and one button to mark a drop done. */
function riderHome(el,keep){
  const r=myRider();
  if(!r){el.innerHTML=`<div class="empty card">${ic('helmet')}This login is not linked to a rider yet. Ask the owner to link it in Settings → Users.</div>`;return}
  const out=riderOut(r),done=riderDone(r);
  const html=`
   <div class="hello"><div><h2>Salam, ${esc(r.name.split(' ')[0])}</h2><p>${out.length?`You have ${out.length} order${out.length===1?'':'s'} on the bike right now.`:'Nothing on the bike. The counter will send you the next one.'}</p></div>
    <div class="shift">${ic(r.status==='off'?'pause':'bike','sm')}<span>${r.status==='off'?'Off duty':r.status==='busy'?'On delivery':'Free — waiting for an order'}</span></div></div>
   <div class="grid g3 st" style="margin-top:16px">
    <button class="card kpi rk" data-br="rtake:${r.id}"><div class="ico">${ic('cash')}</div><div><div class="lbl">To take</div><div class="val num">${rs(riderTake(r))}</div><div class="dl"><span class="dim">Still to collect at the door</span></div></div></button>
    <button class="card kpi rk" data-br="give:${r.id}"><div class="ico">${ic('wallet')}</div><div><div class="lbl">To give</div><div class="val num">${rs(riderGive(r))}</div><div class="dl"><span class="dim">Hand this in at the counter</span></div></div></button>
    <button class="card kpi rk" data-br="done:${r.id}"><div class="ico">${ic('check')}</div><div><div class="lbl">Delivered tonight</div><div class="val num">${r.today}</div><div class="dl"><span class="dim">${rs(r.earn)} earned</span></div></div></button>
   </div>
   <div class="card" style="margin-top:16px"><div class="card-h"><h3>${ic('bike')}On the bike</h3><span class="dim sp" style="font-size:12.5px">Oldest first</span></div>
    <div class="rdrops">${out.length?out.sort((a,b)=>a.t.out-b.t.out).map(o=>{const c=S.cmap[o.cid];return `
      <div class="rdrop" data-k="rd${o.id}">
       <div class="r1"><span class="mono" style="color:var(--or2)">${o.id}</span>${payTag(o)}<span class="tm">${ic('clock','sm')}<span data-since="${o.t.out}">${ago(o.t.out)}</span></span></div>
       <div class="who"><b>${esc(c.name)}</b><span class="dim mono" style="font-size:12.5px">${esc(c.phone)}</span></div>
       <div class="addr">${ic('pin','sm')}<span>${esc(o.addr)}</span></div>
       <div class="its dim">${esc(itemsShort(o))}</div>
       ${o.note?`<div class="nt">${ic('note','sm')}${esc(o.note)}</div>`:''}
       <div class="r3"><span class="${o.pay==='COD'?'cod':'dim'}">${o.pay==='COD'?'Collect '+rs(o.total):'Already paid · '+rs(o.total)}</span>
        <button class="btn ok" data-dl="${o.id}">${ic('check')}Mark delivered</button></div>
      </div>`}).join(''):`<div class="empty">${ic('check')}Nothing on the bike right now.</div>`}</div></div>
   <div class="card" style="margin-top:16px"><div class="card-h"><h3>${ic('clock')}Delivered tonight</h3><span class="dim sp" style="font-size:12.5px">${done.length} order${done.length===1?'':'s'}</span></div>
    <div class="lst">${done.length?done.slice(0,8).map(o=>`<div data-k="rh${o.id}"><span class="food sm">${ic('check','sm')}</span><div class="grow"><b class="ell">${esc(custName(o))}</b><div class="dim" style="font-size:12px">${esc(o.area)} · ${t12(o.t.delivered)}</div></div><b class="num">${rs(o.total)}</b></div>`).join(''):`<div class="empty">${ic('hourglass')}No deliveries yet tonight.</div>`}</div></div>`;
  if(keep){const sc=el.scrollTop;el.innerHTML=html;el.scrollTop=sc}else el.innerHTML=html;
  $$('[data-dl]',el).forEach(b=>b.onclick=()=>A.delivered(b.dataset.dl));
  $$('[data-rd]',el).forEach(b=>b.onclick=()=>riderDrop(b.dataset.rd));
  $$('[data-br]',el).forEach(b=>b.onclick=()=>{const [kind,rid]=b.dataset.br.split(':');riderBreakdown(S.riders.find(x=>x.id===rid),kind)});
  settle(el);
}

/* ---------- one drop, everything about it, on a phone ---------- */
function riderDrop(id){
  const o=S.omap[id];if(!o)return;const c=S.cmap[o.cid];
  openDrawer(`<div class="dw-h"><div class="grow"><div class="row"><h3 class="mono">${o.id}</h3>${stTag(o.status)}</div>
    <small class="muted">${esc(o.area)} · ${t12(o.t.placed)}</small></div>
    <button class="iconbtn" data-close aria-label="Close">${ic('x')}</button></div>
   <div class="dw-b">
    <div class="box" style="display:grid;gap:12px">
     <div class="row" style="gap:12px"><div class="av ${avc(c.name)}">${ini(c.name)}</div>
      <div class="grow"><b style="font-size:16px">${esc(c.name)}</b><div class="dim" style="font-size:12.5px">${c.n} past orders</div></div></div>
     <div class="row" style="gap:8px">${ic('phone','sm')}<span class="mono" style="font-size:14px">${esc(c.phone)}</span></div>
     <div class="row" style="align-items:flex-start;gap:8px">${ic('pin','sm')}<span style="font-size:14px;line-height:1.5">${esc(o.addr)}</span></div>
    </div>
    <div class="sec"><h4>What to hand over</h4><div class="box" style="display:grid;gap:10px">
     ${o.items.map(it=>`<div class="row">${foodIc(it.mid,'sm')}<div class="grow"><b>${it.qty}× ${esc(MM[it.mid].name)}</b>${it.note?`<div style="color:var(--warn);font-size:12px">${esc(it.note)}</div>`:''}</div></div>`).join('')}
     ${o.note?`<div class="row" style="color:var(--warn);font-size:13px;gap:8px;padding:8px 10px;border-radius:10px;background:var(--warnsoft)">${ic('note','sm')}${esc(o.note)}</div>`:''}
     <div class="kv tot"><span style="color:var(--fg)">${o.pay==='COD'?'Collect at the door':'Already paid'}</span><span class="num">${rs(o.total)}</span></div></div></div>
    <div class="sec"><h4>Anything the counter should know?</h4>
     <textarea class="tx" id="rdNote" rows="3" placeholder="e.g. gate was locked, customer asked for the next one earlier">${esc(o.riderNote||'')}</textarea>
     <button class="btn full" id="rdSave" style="margin-top:10px">${ic('note')}Save note</button></div>
   </div>
   <div class="dw-f">${o.status==='out'?`<button class="btn ok full" data-a="dl">${ic('check')}Mark delivered</button>`:''}</div>`,d=>{
    $('#rdSave',d).onclick=()=>A.riderNote(id,$('#rdNote',d).value.trim());
    $$('[data-a]',d).forEach(b=>b.onclick=()=>{A.delivered(id);closeDrawer()});
  });
}

/* ---------- the rider's Orders page: only what is his ---------- */
let rOrdTab='active';
function riderOrders(el,keep){
  const r=myRider();
  if(!r){el.innerHTML=`<div class="empty card">${ic('helmet')}This login is not linked to a rider yet.</div>`;return}
  const active=riderOut(r).sort((a,b)=>a.t.out-b.t.out);
  const done=riderDone(r);
  const L=rOrdTab==='active'?active:done;
  const html=`
   <div class="mob-tabs" id="rot" style="display:flex">
    <button class="chip ${rOrdTab==='active'?'on':''}" data-t="active">On the bike <b>${active.length}</b></button>
    <button class="chip ${rOrdTab==='done'?'on':''}" data-t="done">Delivered <b>${done.length}</b></button></div>
   <div class="rdrops">${L.length?L.map(o=>{const c=S.cmap[o.cid];return `
     <button class="rdrop" data-rd="${o.id}" data-k="ro${o.id}${o.status}">
      <div class="r1"><span class="mono" style="color:var(--or2)">${o.id}</span>${payTag(o)}
       <span class="tm">${ic('clock','sm')}${o.status==='delivered'?t12(o.t.delivered):ago(o.t.out)}</span></div>
      <div class="who"><b>${esc(c.name)}</b></div>
      <div class="addr">${ic('pin','sm')}<span>${esc(o.addr)}</span></div>
      <div class="its dim">${esc(itemsShort(o))}</div>
      ${o.riderNote?`<div class="nt">${ic('note','sm')}${esc(o.riderNote)}</div>`:''}
      <div class="r3"><span class="${o.pay==='COD'?'cod':'dim'}">${o.pay==='COD'?(o.status==='delivered'?'Collected ':'Collect ')+rs(o.total):'Prepaid · '+rs(o.total)}</span>
       <span class="btn sm ghost">${ic('chev','sm')}Open</span></div>
     </button>`}).join(''):`<div class="empty card">${ic(rOrdTab==='active'?'check':'hourglass')}${rOrdTab==='active'?'Nothing on the bike right now.':'No deliveries yet tonight.'}</div>`}</div>`;
  if(keep){const sc=el.scrollTop;el.innerHTML=html;el.scrollTop=sc}else el.innerHTML=html;
  $$('#rot button',el).forEach(b=>b.onclick=()=>{rOrdTab=b.dataset.t;riderOrders(el)});
  $$('[data-rd]',el).forEach(b=>b.onclick=()=>riderDrop(b.dataset.rd));
  settle(el);
}

/* ================= DASHBOARD ================= */
function spark(vals,color='var(--or)'){const w=96,h=34,mx=Math.max(...vals,1),mn=Math.min(...vals);const pts=vals.map((v,i)=>[i*(w/(vals.length-1)),h-3-((v-mn)/(mx-mn||1))*(h-8)]);const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');const id='sg'+Math.random().toString(36).slice(2,7);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h}Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="2.8" fill="${color}"/></svg>`}
function nightStats(night){const os=S.orders.filter(o=>o.t.placed>=night+15*HOUR&&o.t.placed<night+29*HOUR&&o.status!=='cancelled');return os}
function hourly(night,upto){const b=Array(14).fill(0);S.orders.forEach(o=>{if(o.status==='cancelled')return;if(o.t.placed>=night+15*HOUR&&o.t.placed<(upto||night+29*HOUR)){const i=Math.floor((o.t.placed-night-15*HOUR)/HOUR);if(i>=0&&i<14)b[i]++}});return b}
const HLBL=['3P','4P','5P','6P','7P','8P','9P','10P','11P','12A','1A','2A','3A','4A'];
function hourChart(){
  const night0=SHIFT0-15*HOUR,lw=night0-7*DAY;const a=hourly(night0,now()),b=hourly(lw);const curH=Math.min(13,Math.floor((now()-SHIFT0)/HOUR));
  const W=640,H=220,L=30,R=8,T=12,B=26,mx=Math.ceil(Math.max(...a,...b,4)/4)*4;const bw=(W-L-R)/14;const y=v=>T+(H-T-B)*(1-v/mx);
  let g='';for(let i=0;i<=4;i++){const v=mx/4*i;g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="10.5" fill="var(--dim)">${v}</text>`}
  let bars='';a.forEach((v,i)=>{if(i>curH)return;const x=L+i*bw+bw*.18,w=bw*.64,h=(H-T-B)*(v/mx);bars+=`<rect x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0,h).toFixed(1)}" rx="4" fill="${i===curH?'url(#bh)':'var(--or)'}" opacity="${i===curH?1:.88}"><title>${HLBL[i]}: ${v} orders</title></rect>`;if(i===curH)bars+=`<text x="${x+w/2}" y="${y(v)-6}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--or2)">${v}</text>`});
  const lp=b.map((v,i)=>[L+i*bw+bw/2,y(v)]);const line=lp.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const xl=HLBL.map((l,i)=>`<text x="${L+i*bw+bw/2}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="${i===curH?'var(--or2)':'var(--dim)'}" font-weight="${i===curH?700:400}">${l}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Orders per hour tonight versus last week"><defs><linearGradient id="bh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--or2)"/><stop offset="1" stop-color="var(--or)" stop-opacity=".5"/></linearGradient></defs>${g}${bars}<path d="${line}" fill="none" stroke="var(--cream)" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round" opacity=".8"/>${lp.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="var(--cream)"/>`).join('')}${xl}</svg>`}
const greet=()=>{const h=new Date(now()).getHours();return h<5?'Still up':h<12?'Good morning':h<17?'Good afternoon':'Good evening'};
/* ---------- which nights the dashboard is looking at ---------- */
const RANGES=[['today','Today'],['yest','Yesterday'],['7d','Last 7 days'],['30d','Last 30 days'],['custom','Custom']];
let dashRange={id:'today',from:'',to:''};
/* a trading night runs 3 PM to 5 AM, so a "day" here is a night, not a calendar date */
function nightStart(ymd){const d=new Date(ymd+'T00:00:00');d.setHours(15,0,0,0);return d.getTime()}
function rangeBounds(r=dashRange){
  if(r.id==='yest')  return [SHIFT0-DAY,SHIFT1-DAY];
  if(r.id==='7d')    return [SHIFT0-6*DAY,SHIFT1];
  if(r.id==='30d')   return [SHIFT0-29*DAY,SHIFT1];
  if(r.id==='custom'&&r.from){
    const a=nightStart(r.from), b=(r.to?nightStart(r.to):a)+14*HOUR;
    return [Math.min(a,b),Math.max(a+14*HOUR,b)];
  }
  return [SHIFT0,SHIFT1];
}
const rangeLabel=()=>{
  const r=dashRange;
  if(r.id==='custom'&&r.from)return r.to&&r.to!==r.from?dshort(nightStart(r.from))+' – '+dshort(nightStart(r.to)):dstr(nightStart(r.from));
  return (RANGES.find(x=>x[0]===r.id)||RANGES[0])[1];
};
const rangeNights=()=>{const [a,b]=rangeBounds();return Math.max(1,Math.round((b-a)/DAY))};
const inSpan=(o,a,b)=>o.t.placed>=a&&o.t.placed<b;
const rangeOrders=()=>{const [a,b]=rangeBounds();return S.orders.filter(o=>inSpan(o,a,b)&&o.status!=='cancelled')};
/* a trading night is 14 hours inside a 24-hour day, so the period before is a
   whole number of days back — not the window's own length */
const prevOrders=()=>{const [a,b]=rangeBounds();const back=DAY*rangeNights();return S.orders.filter(o=>inSpan(o,a-back,b-back)&&o.status!=='cancelled')};
const rangeTakeaway=()=>{const [a,b]=rangeBounds();return S.takeaway.filter(t=>t.t>=a&&t.t<b)};

/* ---------- one chart that knows whether it is showing hours or nights ---------- */
function chartModel(){
  const [a,b]=rangeBounds();
  if(rangeNights()<=1){
    const night=a-15*HOUR;
    const vals=hourly(night,Math.min(b,now()));
    const cmp=hourly(night-7*DAY);
    const curH=dashRange.id==='today'?Math.min(13,Math.floor((now()-a)/HOUR)):13;
    return {kind:'hour',labels:HLBL,vals,cmp,cur:curH,
      keyOf:i=>[night+15*HOUR+i*HOUR,night+15*HOUR+(i+1)*HOUR],
      title:i=>HLBL[i]};
  }
  const n=rangeNights(),vals=[],labels=[],keys=[];
  for(let i=0;i<n;i++){
    const from=a+i*DAY,to=from+14*HOUR;
    vals.push(S.orders.filter(o=>o.status!=='cancelled'&&o.t.placed>=from&&o.t.placed<to).length);
    labels.push(dshort(from));keys.push([from,to]);
  }
  return {kind:'night',labels,vals,cmp:null,cur:-1,keyOf:i=>keys[i],title:i=>labels[i]};
}
function barChart(){
  const m=chartModel();
  const N=m.vals.length;
  const W=640,H=220,L=30,R=8,T=12,B=26;
  const mx=Math.ceil(Math.max(...m.vals,...(m.cmp||[]),4)/4)*4;
  const bw=(W-L-R)/N, y=v=>T+(H-T-B)*(1-v/mx);
  let g='';for(let i=0;i<=4;i++){const v=mx/4*i;
    g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="10.5" fill="var(--dim)">${v}</text>`}
  let bars='';
  m.vals.forEach((v,i)=>{
    if(m.kind==='hour'&&i>m.cur)return;
    const x=L+i*bw+bw*.18,w=bw*.64,h=(H-T-B)*(v/mx);
    bars+=`<rect class="cb" data-b="${i}" x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(1,h).toFixed(1)}" rx="4" fill="${i===m.cur?'url(#bh)':'var(--or)'}" opacity="${i===m.cur?1:.85}"><title>${m.title(i)}: ${v} orders — tap for the list</title></rect>`;
    if(i===m.cur&&v)bars+=`<text x="${x+w/2}" y="${y(v)-6}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--or2)">${v}</text>`;
  });
  let cmpLine='';
  if(m.cmp){
    const lp=m.cmp.map((v,i)=>[L+i*bw+bw/2,y(v)]);
    cmpLine=`<path d="${lp.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ')}" fill="none" stroke="var(--cream)" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round" opacity=".8"/>`
      +lp.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="var(--cream)"/>`).join('');
  }
  const step=N>14?Math.ceil(N/10):1;
  const xl=m.labels.map((l,i)=>i%step?'':`<text x="${L+i*bw+bw/2}" y="${H-8}" text-anchor="middle" font-size="10.5" fill="${i===m.cur?'var(--or2)':'var(--dim)'}" font-weight="${i===m.cur?700:400}">${l}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Orders over the chosen period"><defs><linearGradient id="bh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--or2)"/><stop offset="1" stop-color="var(--or)" stop-opacity=".5"/></linearGradient></defs>${g}${bars}${cmpLine}${xl}</svg>`;
}
/* tapping a bar lists the orders behind it */
function barDrill(i){
  const m=chartModel();const [a,b]=m.keyOf(i);
  const L=S.orders.filter(o=>o.status!=='cancelled'&&o.t.placed>=a&&o.t.placed<b).sort((x,y)=>x.t.placed-y.t.placed);
  const total=L.reduce((s2,o)=>s2+o.total,0);
  modal(`<div class="md-h"><div class="grow"><h3>${esc(m.kind==='hour'?m.title(i)+' — '+HLBL[i].replace('P',' PM').replace('A',' AM'):m.title(i))}</h3><p>${L.length} order${L.length===1?'':'s'} · ${rs(total)}</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b">${L.length?`<div class="brlist">${L.map(o=>`<button class="brrow" data-o="${o.id}"><span class="mono" style="color:var(--or2)">${o.id}</span><div class="grow"><b class="ell">${esc(custName(o))}</b><div class="dim" style="font-size:12px">${esc(o.area)} · ${t12(o.t.placed)}</div></div><div style="text-align:right"><b class="num">${rs(o.total)}</b><div style="font-size:11.5px">${stTag(o.status)}</div></div></button>`).join('')}</div>`:`<div class="empty">${ic('hourglass')}No orders in this slot.</div>`}</div>
   <div class="md-f"><button class="btn ghost" data-close>Close</button></div>`,
   mm=>$$('[data-o]',mm).forEach(x=>x.onclick=()=>{closeModal();orderDrawer(x.dataset.o)}));
}

/* ---------- who got the takeaway number ---------- */
function takeawayList(){
  const L=rangeTakeaway().slice().reverse();
  modal(`<div class="md-h"><div class="grow"><h3>Takeaway number shared</h3><p>${L.length} customer${L.length===1?'':'s'} got <b class="mono">${esc(S.set.takeNo)}</b> from the AI agent · ${esc(rangeLabel()).toLowerCase()}</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b">${L.length?`<div class="brlist">${L.map(t=>`<div class="brrow" style="cursor:default"><div class="av sm c2">${ini(t.name)}</div><div class="grow"><b class="ell">${esc(t.name)}</b><div class="dim mono" style="font-size:12.5px">${esc(t.phone)}</div></div><span class="dim" style="font-size:12px">${t12(t.t)}</span></div>`).join('')}</div>`:`<div class="empty">${ic('take')}Nobody asked for takeaway in this period.</div>`}</div>
   <div class="md-f"><button class="btn ghost" data-close>Close</button></div>`);
}

/* ================= DASHBOARD ================= */
let dashTab='recent';
PAGES.dash={
 render(el){
  if(isRider())return riderHome(el);
  el.innerHTML=`<div class="hello"><div><h2>${esc(greet())}, ${esc(me().name.split(' ')[0])}</h2><p id="dSub">Here is how tonight is going. Everything below updates live.</p></div>
    <div class="rng" id="rng"></div></div>
  <div class="grid g4 st" id="kpis"></div>
  <div class="card pipe" id="pipe" style="margin-top:16px"></div>
  <div class="grid g21" style="margin-top:16px">
   <div class="card chart"><div class="card-h"><h3>${ic('chart')}<span id="chTtl">Orders by hour</span></h3><div class="legend sp" id="chLeg"></div></div><div id="hc"></div>
    <div class="dim" style="font-size:12px;margin-top:6px">${ic('eye','sm')} Tap any bar to see the orders behind it.</div></div>
   <div class="card"><div class="card-h"><h3>${ic('helmet')}Riders right now</h3><button class="link sp" data-go="riders">Manage ${ic('chev','sm')}</button></div><div class="lst" id="dRiders"></div></div></div>
  <div class="card" style="margin-top:16px"><div class="card-h"><div class="dtabs" id="dTabs"></div><button class="link sp" id="dMore"></button></div><div id="dPane"></div></div>`;
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  this.refresh(true);
 },
 ranges(){
  const r=$('#rng');if(!r)return;
  r.innerHTML=RANGES.map(([id,t])=>`<button class="${dashRange.id===id?'on':''}" data-r="${id}">${t}</button>`).join('');
  $$('button',r).forEach(b=>b.onclick=()=>{
    if(b.dataset.r==='custom')return this.customRange();
    dashRange={id:b.dataset.r,from:'',to:''};this.refresh(true);
  });
 },
 customRange(){
  const today=new Date(SHIFT0).toISOString().slice(0,10);
  modal(`<div class="md-h"><div class="grow"><h3>Pick your own dates</h3><p>A night runs 3 PM to 5 AM, so a date means that night's trading.</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b"><div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
    <label class="field"><span>From</span><input class="tx" type="date" id="cfFrom" max="${today}" value="${dashRange.from||today}"></label>
    <label class="field"><span>To</span><input class="tx" type="date" id="cfTo" max="${today}" value="${dashRange.to||today}"></label>
   </div></div>
   <div class="md-f"><button class="btn ghost" data-close>Cancel</button><button class="btn pri" id="cfOk">Show it</button></div>`,m=>{
    $('#cfOk',m).onclick=()=>{
      const f=$('#cfFrom',m).value,t=$('#cfTo',m).value;
      if(!f){toast('Pick a start date','',{icon:'alert',tone:'bad'});return}
      dashRange={id:'custom',from:f,to:t||f};closeModal();this.refresh(true);
    };
  });
 },
 tabs(){
  const T=[['recent','Recent orders','bike'],['chats','Live chats','bot'],['top','Top sellers','flame'],['areas','Areas','pin']];
  $('#dTabs').innerHTML=T.map(([id,t,i])=>`<button class="${dashTab===id?'on':''}" data-d="${id}">${ic(i,'sm')}<span>${t}</span></button>`).join('');
  $$('#dTabs button').forEach(b=>b.onclick=()=>{dashTab=b.dataset.d;this.pane()});
  const more=$('#dMore');
  const go2={recent:['orders','All orders'],chats:['chats','Open inbox'],top:['menu','Menu'],areas:['settings','Areas']}[dashTab];
  more.innerHTML=go2[1]+ic('chev','sm');more.onclick=()=>go(go2[0]);
 },
 pane(){
  const box=$('#dPane');if(!box)return;
  this.tabs();
  const L=rangeOrders();
  if(dashTab==='recent'){
   const rec=L.slice(-10).reverse();
   box.innerHTML=`<div class="tbl-wrap"><table class="tbl tbl-d"><thead><tr><th>Order</th><th>Customer</th><th>Area</th><th>Total</th><th>Status</th><th>Time</th></tr></thead><tbody>${rec.map(o=>`<tr data-o="${o.id}"><td class="mono" style="color:var(--or2)">${o.id}</td><td>${esc(custName(o))}</td><td class="muted">${esc(o.area)}</td><td class="num"><b>${rs(o.total)}</b></td><td>${stTag(o.status)}</td><td class="dim">${t12(o.t.placed)}</td></tr>`).join('')}</tbody></table>
    <div class="mcards lst">${rec.map(o=>`<button data-o="${o.id}"><div class="grow"><div class="row"><span class="mono" style="color:var(--or2)">${o.id}</span><b class="ell">${esc(custName(o))}</b></div><div class="dim" style="font-size:12px">${esc(o.area)} · ${t12(o.t.placed)}</div></div><div style="text-align:right;display:grid;gap:4px;justify-items:end"><b class="num">${rs(o.total)}</b>${stTag(o.status)}</div></button>`).join('')}</div></div>`;
   if(!rec.length)box.innerHTML=`<div class="empty">${ic('bike')}No orders in this period.</div>`;
   $$('[data-o]',box).forEach(r=>r.onclick=()=>orderDrawer(r.dataset.o));
  }
  else if(dashTab==='chats'){
   const ac=S.chats.filter(c=>c.state==='ai'||c.state==='human').slice(0,6);
   box.innerHTML=ac.length?`<div class="lst">${ac.map(c=>{const cu=S.cmap[c.cid];const lm=c.msgs.at(-1);
     return `<button data-ch="${c.id}"><div class="av sm ${avc(cu.name)}">${ini(cu.name)}</div><div class="grow"><div class="row"><b class="ell">${esc(cu.name)}</b><span class="tag ${c.state==='human'?'t-human':'t-ai'}" style="margin-left:auto">${c.state==='human'?'Needs human':'AI active'}</span></div><div class="dim ell" style="font-size:12px">${c.typing?'AI is typing…':esc(lm?lm.text.split('\n')[0].replace(/\*/g,''):'')}</div></div></button>`}).join('')}</div>`
     :`<div class="empty">${ic('chat')}No active chats right now.</div>`;
   $$('[data-ch]',box).forEach(b=>b.onclick=()=>go('chats',{chat:b.dataset.ch}));
  }
  else if(dashTab==='top'){
   const cnt={};L.forEach(o=>o.items.forEach(it=>{if(MM[it.mid].cat!=='drink')cnt[it.mid]=(cnt[it.mid]||0)+it.qty}));
   const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,8);const mx=top[0]?.[1]||1;
   box.innerHTML=top.length?`<div class="bars">${top.map(([m,n])=>`<div class="br"><span class="row ell">${foodIc(m,'sm')}<span class="ell">${esc(MM[m].name)}</span></span><b class="num">${n}</b><span class="tr"><i style="width:${n/mx*100}%"></i></span></div>`).join('')}</div>`
     :`<div class="empty">${ic('flame')}Nothing sold in this period.</div>`;
  }
  else{
   const ac2={};L.forEach(o=>ac2[o.area]=(ac2[o.area]||0)+1);
   const ta=Object.entries(ac2).sort((a,b)=>b[1]-a[1]).slice(0,8);const mx2=ta[0]?.[1]||1;
   box.innerHTML=ta.length?`<div class="bars">${ta.map(([a,n])=>`<div class="br"><span class="ell">${esc(a)} <span class="dim">· ${rs(feeOf(a))} fee</span></span><b class="num">${n}</b><span class="tr"><i style="width:${n/mx2*100}%"></i></span></div>`).join('')}</div>`
     :`<div class="empty">${ic('pin')}No deliveries in this period.</div>`;
  }
  settle(box);
 },
 refresh(first){
  const el=$('#pg');if(!el)return;
  if(isRider())return riderHome(el,true);
  if(!$('#kpis'))return;
  if(first)this.ranges();
  const live=dashRange.id==='today';
  const L=rangeOrders(),prev=prevOrders();
  const rev=L.reduce((a,o)=>a+o.total,0),prev_rev=prev.reduce((a,o)=>a+o.total,0);
  const tk=rangeTakeaway().length;
  const pct=(a,b)=>b?Math.round((a-b)/b*100):0;
  const nights=[...Array(7)].map((_,i)=>SHIFT0-15*HOUR-(6-i)*DAY);
  const sp1=nights.map(n=>nightStats(n).length),sp2=nights.map(n=>nightStats(n).reduce((a,o)=>a+o.total,0));
  const K=[
   ['bike','Orders',L.length,pct(L.length,prev.length),sp1,null,null],
   ['wallet','Revenue',rev,pct(rev,prev_rev),sp2,rs,null],
   ['helmet','Cash to collect',roadCash(),null,null,rs,'riders'],
   ['take','Takeaway number shared',tk,null,null,null,'take']
  ];
  const kp=$('#kpis');
  if(first||kp.children.length!==K.length){
    kp.innerHTML=K.map((x,i)=>`<${x[6]?'button':'div'} class="card kpi kpi2 ${x[6]?'tap':''}" ${x[6]?`data-k2="${x[6]}"`:''} style="--d:${i}"><div class="kh"><div class="ico">${ic(x[0])}</div><div class="lbl">${x[1]}</div></div><div class="val num" id="kv${i}">0</div><div class="kft"><div class="dl" id="kd${i}"></div>${x[4]?spark(x[4],i===1?'var(--or2)':'var(--or)'):''}</div></${x[6]?'button':'div'}>`).join('');
    $$('[data-k2]',kp).forEach(b=>b.onclick=()=>b.dataset.k2==='take'?takeawayList():go('riders'));
  }
  const CAP={2:rs(heldCash())+' already in pockets · '+rs(collectedCash())+' handed in',3:'Tap to see who got it'};
  K.forEach((x,i)=>{countUp($('#kv'+i),x[2],x[5]||undefined);
    $('#kd'+i).innerHTML=x[3]==null?`<span class="dim">${CAP[i]||''}</span>`:`<span class="${x[3]>=0?'up':'down'}">${x[3]>=0?'▲':'▼'} ${Math.abs(x[3])}%</span><span class="dim">vs the ${rangeNights()>1?'period before':'night before'}</span>`});
  $('#dSub').textContent=live?'Here is how tonight is going. Everything below updates live.':`Showing ${rangeLabel().toLowerCase()} · ${L.length} orders · ${rs(rev)}`;
  $$('#rng button').forEach(b=>b.classList.toggle('on',b.dataset.r===dashRange.id));

  /* the live strip only makes sense for tonight */
  const pp=$('#pipe');pp.hidden=!live;
  if(live){
   const PL=[['new','Awaiting approval','var(--warn)','orders','Tap to approve'],['kitchen','In kitchen','var(--blue)','orders','Queued + cooking'],['ready','Ready for rider','var(--vio)','riders','Assign a rider'],['out','Out for delivery','var(--cyan)','riders','On the road'],['delivered','Delivered tonight','var(--ok)','orders','Completed']];
   const pc={new:byStatus('new').length,kitchen:byStatus('approved').length+byStatus('preparing').length,ready:byStatus('ready').length,out:byStatus('out').length,delivered:tonight().filter(o=>o.status==='delivered').length};
   if(!pp.children.length){pp.innerHTML=PL.map(x=>`<button data-go="${x[3]}" data-st="${x[0]}"><span class="pl"><span class="pd" style="background:${x[2]}"></span>${x[1]}</span><span class="pv num" id="pv-${x[0]}">0</span><span class="ps">${x[4]}</span></button>`).join('');$$('button',pp).forEach(b=>b.onclick=()=>go(b.dataset.go,{tab:b.dataset.st}))}
   PL.forEach(x=>countUp($('#pv-'+x[0]),pc[x[0]]));
  }

  /* chart */
  const hourly_=rangeNights()<=1;
  $('#chTtl').textContent=hourly_?'Orders by hour':'Orders by night';
  $('#chLeg').innerHTML=hourly_?`<span><i style="background:var(--or)"></i>${rangeLabel()}</span><span><i style="background:var(--cream);height:2px;border-radius:0"></i>Same night last week</span>`:`<span><i style="background:var(--or)"></i>Orders per night</span>`;
  const hc=$('#hc');hc.innerHTML=barChart();
  hc.onclick=e=>{const b=e.target.closest('[data-b]');if(b)barDrill(+b.dataset.b)};

  /* riders */
  const rs_=[...S.riders].sort((a,b)=>({free:0,busy:1,off:2}[a.status]-{free:0,busy:1,off:2}[b.status]));
  $('#dRiders').innerHTML=rs_.slice(0,6).map(r=>`<button data-rg="${r.id}"><div class="av sm ${avc(r.name)}">${ini(r.name)}</div><div class="grow"><b>${esc(r.name)}</b><div class="dim" style="font-size:12px">${r.today} delivered · ${rs(toTake(r))} to take · ${rs(collected(r))} collected</div></div><span class="tag ${r.status==='free'?'t-delivered':r.status==='busy'?'t-out':''}">${r.status==='free'?'Free':r.status==='busy'?r.orders.length+' on road':'Off'}</span></button>`).join('');
  $$('[data-rg]',el).forEach(b=>b.onclick=()=>riderBreakdown(S.riders.find(x=>x.id===b.dataset.rg),'take'));

  this.pane();
  settle(el);
 }
};

/* ================= LIVE CONVERSATIONS ================= */
let chatFilter='all',chatQ='';
PAGES.chats={flush:true,
 render(el,opts){
  el.style.height='100%';
  el.innerHTML=`<div class="cv" id="cv" data-pane="list"><div class="cv-list"><div class="hd"><div class="cv-tabs" id="cvTabs"></div><div class="inp" style="height:40px">${ic('search')}<input id="cvQ" placeholder="Search name or phone" aria-label="Search chats"></div></div><div class="cv-items" id="cvItems"></div></div>
   <div class="cv-th" id="cvTh"></div><div class="cv-side" id="cvSide"></div></div>`;
  $('#cvQ').oninput=e=>{chatQ=e.target.value.toLowerCase();this.list()};
  if(opts.chat)openChat=opts.chat;
  if(!openChat||!S.chats.find(c=>c.id===openChat))openChat=(S.chats.find(c=>c.state==='human')||S.chats.find(c=>c.state==='ai')||S.chats[0])?.id;
  this.list();this.thread();
  if(opts.chat)$('#cv').dataset.pane='th';
 },
 open(opts){if(opts.chat){openChat=opts.chat;this.list();this.thread();$('#cv').dataset.pane='th'}},
 tabs(){const n={all:S.chats.length,ai:S.chats.filter(c=>c.state==='ai').length,human:S.chats.filter(c=>c.state==='human').length,placed:S.chats.filter(c=>c.state==='placed'||c.state==='done').length,takeaway:S.chats.filter(c=>c.state==='takeaway').length};
  $('#cvTabs').innerHTML=[['all','All'],['human','Needs human'],['ai','AI active'],['placed','Ordered'],['takeaway','Takeaway']].map(([id,t])=>`<button class="chip ${chatFilter===id?'on':''}" data-f="${id}">${t} <b style="${id==='human'&&n.human?'color:var(--bad)':''}">${n[id]}</b></button>`).join('');
  $$('#cvTabs button').forEach(b=>b.onclick=()=>{chatFilter=b.dataset.f;this.list()})},
 list(){
  if(!$('#cvItems'))return;this.tabs();
  let L=S.chats.filter(c=>chatFilter==='all'||(chatFilter==='placed'?['placed','done'].includes(c.state):c.state===chatFilter));
  if(chatQ)L=L.filter(c=>{const cu=S.cmap[c.cid];return cu.name.toLowerCase().includes(chatQ)||cu.phone.replace(/\s/g,'').includes(chatQ.replace(/\s/g,''))});
  L.sort((a,b)=>(b.state==='human')-(a.state==='human')||b.last-a.last);
  const box=$('#cvItems');
  keepScroll(box,()=>{box.innerHTML=L.length?L.map(c=>{const cu=S.cmap[c.cid];const lm=c.msgs.at(-1);const tg={ai:'<span class="tag t-ai">AI active</span>',human:'<span class="tag t-human">Needs human</span>',placed:`<span class="tag t-${S.omap[c.orderId]?.status||'new'}">${c.orderId}</span>`,done:'<span class="tag t-delivered">Delivered</span>',takeaway:'<span class="tag t-take">Takeaway shared</span>'}[c.state];
   return `<button class="ci ${c.id===openChat?'on':''}" data-k="ci${c.id}" data-id="${c.id}"><div class="av ${avc(cu.name)}">${ini(cu.name)}</div><div class="grow" style="min-width:0"><div class="b1"><b class="ell">${esc(cu.name)}</b><small>${t12(c.last)}</small></div><div class="pv ell">${c.typing?'<span style="color:var(--or2)">AI is typing…</span>':esc(lm?({c:'',ai:'AI: ',st:'You: ',sys:''}[lm.from])+lm.text.split('\n')[0].replace(/\*/g,''):'')}</div><div class="tg">${tg}${c.isNew?'<span class="tag t-approved">New</span>':''}</div></div>${c.unread&&c.id!==openChat?`<span class="un">${c.unread}</span>`:''}</button>`}).join(''):`<div class="empty">${ic('chat')}No chats in this view.</div>`});
  $$('.ci',box).forEach(b=>b.onclick=()=>{openChat=b.dataset.id;this.list();this.thread();$('#cv').dataset.pane='th'});
  settle(box);
 },
 thread(){
  const ch=S.chats.find(c=>c.id===openChat);const th=$('#cvTh');if(!th)return;
  if(!ch){th.innerHTML=`<div class="empty" style="height:100%">${ic('chat')}Pick a chat to read it.</div>`;$('#cvSide').innerHTML='';return}
  ch.unread=0;const cu=S.cmap[ch.cid];
  th.innerHTML=`<div class="hd"><button class="iconbtn cv-back" id="cvBack" aria-label="Back">${ic('back')}</button><div class="av ${avc(cu.name)}">${ini(cu.name)}</div><div class="grow" style="min-width:0"><b>${esc(cu.name)}</b><div class="dim" style="font-size:12.5px">${cu.phone} · ${esc(cu.area)}</div></div><span id="thState"></span><button class="btn sm sum-tg" id="sumTg" style="display:none">${ic('note','sm')}Order</button><span id="thAct"></span></div>
   <div class="msgs" id="msgs" style="position:relative"></div>
   <div class="cmp" id="cmp"></div>`;
  $('#cvBack').onclick=()=>{$('#cv').dataset.pane='list'};
  $('#sumTg').onclick=()=>$('#cvSide').classList.toggle('on');
  const ms=$('#msgs');ms.innerHTML=`<div class="day">${new Date(ch.msgs[0]?.t||now()).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})}</div>`+ch.msgs.map(m=>this.bub(m,true)).join('')+`<div class="typing" id="typ" ${ch.typing?'':'hidden'}><span><i></i><i></i><i></i></span>AI agent is replying</div>`;
  ms.scrollTop=ms.scrollHeight;
  this.head(ch);this.side(ch);this.compose(ch);refreshChrome();
 },
 bub(m,still){
  if(m.from==='sys')return `<div class="sys" ${still?'style="animation:none"':''}>${ic('bot','sm')}${esc(m.text)}</div>`;
  const cls=m.from==='c'?'c':m.from==='ai'?'ai':'st';
  return `<div class="bub ${cls}" ${still?'style="animation:none"':''}>${m.from==='st'?'<span class="who">You</span>':m.from==='ai'?'<span class="who">AI agent</span>':''}${esc(m.text).replace(/\*(.+?)\*/g,'<b>$1</b>')}<small>${t12(m.t)}${m.from!=='c'?' ✓✓':''}</small></div>`},
 head(ch){
  const s=$('#thState');if(!s)return;
  s.innerHTML={ai:'<span class="tag t-ai">AI agent active</span>',human:'<span class="tag t-human">You are handling this</span>',placed:'<span class="tag t-ai">Order placed</span>',done:'<span class="tag t-delivered">Completed</span>',takeaway:'<span class="tag t-take">Takeaway number shared</span>'}[ch.state];
  $('#thAct').innerHTML=ch.state==='human'?`<button class="btn sm" id="handBack">${ic('bot','sm')}Hand back to AI</button>`:`<button class="btn pri sm" id="takeOver">${ic('headset','sm')}Take over chat</button>`;
  const tb=$('#takeOver'),hb=$('#handBack');
  if(tb)tb.onclick=()=>{ch.state='human';ch.typing=false;ch.msgs.push({from:'sys',text:'You took over this chat. The AI agent is paused.',t:now()});this.handoff('headset','You are now chatting with '+S.cmap[ch.cid].name.split(' ')[0]);this.thread();changed()};
  if(hb)hb.onclick=()=>{ch.state=ch.orderId?'placed':'ai';ch.msgs.push({from:'sys',text:'Chat handed back to the AI agent.',t:now()});this.handoff('bot','AI agent is back on this chat');
    if(ch.paused&&ch.paused.length){const p=ch.paused;ch.paused=null;runScript(ch,p)}else{setTimeout(()=>{ch.typing=false;pushMsg(ch,'ai','Main hazir hun! Kuch aur chahiye ho to batayein 😊')},1200)}
    this.thread();changed()};
 },
 handoff(icn,text){const ms=$('#msgs');if(!ms)return;const d=document.createElement('div');d.className='handoff';d.innerHTML=`<div>${ic(icn)}${esc(text)}</div>`;$('#cvTh').style.position='relative';$('#cvTh').appendChild(d);setTimeout(()=>{d.style.transition='opacity .4s';d.style.opacity=0;setTimeout(()=>d.remove(),400)},1300)},
 compose(ch){
  const c=$('#cmp');if(!c)return;
  const on=ch.state==='human';
  c.innerHTML=`${on?`<div class="qr">${['Ji, main check kar raha hun','Aap ka order 15 min mein pohoch jayega','Bulk order par 10% discount mil jayega','Maazrat, hum dobara aisa nahi hone denge','Rider ka number share kar raha hun'].map(q=>`<button>${q}</button>`).join('')}</div>`:''}
   <div class="inp">${ic('chat')}<input id="cmpIn" placeholder="${on?'Type a reply…':S.set.wa?'AI is handling this chat. Take over to reply.':'WhatsApp is disconnected. Reconnect in Settings.'}" ${on&&S.set.wa?'':'disabled'} aria-label="Message"><button class="btn pri sm" id="cmpSend" ${on&&S.set.wa?'':'disabled'}>${ic('send','sm')}Send</button></div>`;
  const send=t=>{t=t.trim();if(!t)return;pushMsg(ch,'st',t);$('#cmpIn').value='';
    setTimeout(()=>{if(ch.state==='human')pushMsg(ch,'c',pick(['Ok shukriya','Theek hai bhai','Jazakallah','Ok great 👍','Acha theek hai']))},ri(3500,6000))};
  const inp=$('#cmpIn');if(inp){inp.onkeydown=e=>{if(e.key==='Enter')send(inp.value)};$('#cmpSend').onclick=()=>send(inp.value)}
  $$('.qr button',c).forEach(b=>b.onclick=()=>send(b.textContent));
 },
 side(ch){
  const sd=$('#cvSide');if(!sd)return;const cu=S.cmap[ch.cid];const o=ch.orderId?S.omap[ch.orderId]:null;const d=o?{items:o.items,note:o.note,addr:o.addr,area:o.area,fee:o.fee,pay:o.pay}:ch.draft;
  const sub=d.items.reduce((a,x)=>a+MM[x.mid].price*x.qty,0);
  sd.innerHTML=`<div class="card" style="padding:16px"><div class="card-h" style="margin-bottom:10px"><h3>${ic('note')}Order summary</h3><span class="sp">${o?stTag(o.status):ch.state==='takeaway'?'<span class="tag t-take">Takeaway</span>':'<span class="tag t-new">Building…</span>'}</span></div>
   ${d.items.length?`<div style="display:grid;gap:10px">${d.items.map((x,i)=>`<div class="oline" data-k="ol${ch.id}${i}">${foodIc(x.mid,'sm')}<div class="grow"><b style="font-size:13.5px">${esc(MM[x.mid].name)}</b><div class="q">× ${x.qty}${x.note?' · '+esc(x.note):''}</div></div><span class="num">${rs(MM[x.mid].price*x.qty)}</span></div>`).join('')}</div>
   ${d.note?`<div class="row" style="margin-top:10px;color:var(--warn);font-size:12.5px;gap:6px">${ic('note','sm')}${esc(d.note)}</div>`:''}
   <div style="display:grid;gap:7px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--line2)"><div class="kv"><span>Subtotal</span><span class="num">${rs(sub)}</span></div><div class="kv"><span>Delivery${d.area?' · '+esc(d.area):''}</span><span class="num">${d.fee?rs(d.fee):'—'}</span></div><div class="kv tot"><span style="color:var(--fg)">Total</span><span class="num">${rs(sub+(d.fee||0))}</span></div>${d.pay?`<div class="kv"><span>Payment</span><b>${payName[d.pay]}</b></div>`:''}</div>`
   :`<div class="empty" style="padding:18px 6px">${ch.state==='takeaway'?ic('take')+`Customer chose takeaway. AI shared ${S.set.takeNo}.`:ch.state==='human'?ic('headset')+'No items yet. Reply to the customer to help them.':ic('bot')+'Items appear here as the AI understands them.'}</div>`}
   ${o?`<div style="display:grid;gap:8px;margin-top:14px">${o.status==='new'?`<button class="btn pri full" id="sApprove">${ic('check')}Approve → Kitchen</button><button class="btn danger full" id="sCancel">${ic('x')}Cancel order</button>`:`<button class="btn full" id="sOpen">${ic('bike')}Track ${o.id}</button>`}</div>`:''}</div>
   <div class="card" style="padding:16px"><div class="card-h" style="margin-bottom:10px"><h3>${ic('user')}Customer</h3>${segTag(cu)}</div><div style="display:grid;gap:9px;font-size:13px"><div class="row">${ic('phone','sm')}${cu.phone}</div><div class="row" style="align-items:flex-start">${ic('pin','sm')}<span>${esc(cu.addr)}</span></div><div class="kv"><span>Past orders</span><b>${cu.n}</b></div><div class="kv"><span>Total spent</span><b>${rs(cu.spent)}</b></div>${cu.last?`<div class="kv"><span>Last order</span><b>${dstr(cu.last)}</b></div>`:''}</div><button class="btn full" style="margin-top:12px" id="sProf">Open profile</button></div>`;
  const a=$('#sApprove',sd),cn=$('#sCancel',sd),op=$('#sOpen',sd);
  if(a)a.onclick=()=>{A.approve(o.id)};if(cn)cn.onclick=()=>confirmBox(`Cancel ${o.id}?`,'The customer gets a WhatsApp message.','Cancel order',()=>A.cancel(o.id),1);if(op)op.onclick=()=>orderDrawer(o.id);
  $('#sProf',sd).onclick=()=>go('customers',{cust:cu.id});
  settle(sd);
 },
 onMsg(ch){if(cur!=='chats')return;this.list();if(ch.id!==openChat)return;const ms=$('#msgs');if(!ms)return;const m=ch.msgs.at(-1);const typ=$('#typ');typ.insertAdjacentHTML('beforebegin',this.bub(m));typ.hidden=!ch.typing;ms.scrollTo({top:ms.scrollHeight,behavior:'smooth'});ch.unread=0},
 onTyping(ch){if(cur!=='chats')return;this.list();if(ch.id!==openChat)return;const t=$('#typ');if(t){t.hidden=!ch.typing;const ms=$('#msgs');ms.scrollTo({top:ms.scrollHeight,behavior:'smooth'})}},
 refresh(){if(!$('#cvItems'))return;this.list();const ch=S.chats.find(c=>c.id===openChat);if(ch){const sd=$('#cvSide');keepScroll(sd,()=>this.side(ch));this.head(ch);const inp=$('#cmpIn');const focused=document.activeElement===inp;if(!focused){const v=inp?inp.value:'';this.compose(ch);if($('#cmpIn'))$('#cmpIn').value=v}}}
};
/* ================= DELIVERY ORDERS ================= */
let ordTab='new',ordQ='';
const COLS=[['new','Awaiting approval','var(--warn)'],['kitchen','In kitchen','var(--blue)'],['ready','Ready for rider','var(--vio)'],['out','Out for delivery','var(--cyan)'],['delivered','Delivered tonight','var(--ok)']];
function colOrders(id){
  const base=S.orders.filter(o=>o.t.placed>=SHIFT0-DAY);
  let L=id==='kitchen'?base.filter(o=>o.status==='approved'||o.status==='preparing'):id==='delivered'?base.filter(o=>(o.status==='delivered'||o.status==='cancelled')&&o.t.placed>=SHIFT0):base.filter(o=>o.status===id);
  if(ordQ){const q=ordQ.toLowerCase();L=L.filter(o=>o.id.toLowerCase().includes(q)||custName(o).toLowerCase().includes(q)||o.area.toLowerCase().includes(q))}
  return id==='delivered'?L.sort((a,b)=>(b.t.delivered||b.t.cancelled)-(a.t.delivered||a.t.cancelled)).slice(0,25):L.sort((a,b)=>a.t.placed-b.t.placed);
}
function orderCard(o,col){
  const r=S.riders.find(x=>x.id===o.rider);const late=isLate(o);
  const sinceKey={new:'placed',kitchen:o.status==='preparing'?'preparing':'approved',ready:'ready',out:'out'}[col];
  const acts={new:`<div class="acts"><button class="btn sm danger" data-x="cancel">${ic('x','sm')}</button><button class="btn sm pri" data-x="approve">${ic('check','sm')}Approve</button></div>`,
    kitchen:`<div class="acts"><button class="btn sm" data-x="ready">${o.status==='approved'?'Queued':'Cooking'} · mark ready</button></div>`,
    ready:`<div class="acts"><button class="btn sm pri" data-x="assign">${ic('helmet','sm')}Assign rider</button></div>`,
    out:`<div class="acts"><button class="btn sm ok" data-x="delivered">${ic('check','sm')}Delivered</button></div>`}[col]||'';
  return `<div class="oc ${late?'late':''}" data-k="oc${o.id}${o.status}" data-o="${o.id}" role="button" tabindex="0">
   <div class="r1"><span class="id">${o.id}</span>${late?'<span class="tag t-late">Late</span>':''}<span class="tm">${ic('clock','sm')}${col==='delivered'?t12(o.t.delivered||o.t.cancelled):`<span data-since="${o.t[sinceKey]||o.t.placed}">${ago(o.t[sinceKey]||o.t.placed)}</span>`}</span></div>
   <div><div class="nm">${esc(custName(o))}</div><div class="dim" style="font-size:12px">${ic('pin','sm')} ${esc(o.area)}</div></div>
   <div class="it">${esc(itemsShort(o))}</div>
   ${o.note&&col!=='delivered'?`<div class="nt">${ic('note','sm')}${esc(o.note)}</div>`:''}
   ${r&&col==='out'?`<div class="row" style="font-size:12.5px">${ic('helmet','sm')}${esc(r.name)}</div>`:''}
   <div class="r3">${col==='delivered'?stTag(o.status):payTag(o)}<span class="tot num">${rs(o.total)}</span></div>${acts}</div>`;
}
PAGES.orders={
 render(el,opts){
  if(isRider())return riderOrders(el);
  if(opts.tab)ordTab=opts.tab==='kitchen'?'kitchen':opts.tab;
  el.innerHTML=`<div class="toolbar"><div class="inp" style="height:40px;flex:1;max-width:340px;min-width:200px">${ic('search')}<input id="oq" placeholder="Filter by order ID, customer or area" aria-label="Filter orders" value="${esc(ordQ)}"></div>
   <span class="dim hide-m" style="font-size:12.5px">Flow: AI places order → you approve → kitchen cooks → rider delivers</span>
   <div class="sp" style="margin-left:auto;display:flex;gap:8px;align-items:center"><span class="muted" style="font-size:12.5px">Auto-approve</span><button class="sw ${S.set.autoKitchen?'on':''}" id="autoK" role="switch" aria-label="Auto approve new orders"></button></div></div>
   <div class="mob-tabs" id="omt"></div><div class="board" id="board">${COLS.map(c=>`<div class="col" data-col="${c[0]}"><div class="col-h"><span class="pd" style="width:9px;height:9px;border-radius:50%;background:${c[2]}"></span>${c[1]}<span class="n" id="n-${c[0]}">0</span></div><div class="col-b" id="cb-${c[0]}"></div></div>`).join('')}</div>`;
  $('#oq').oninput=e=>{ordQ=e.target.value;this.refresh()};
  $('#autoK').onclick=e=>{S.set.autoKitchen=!S.set.autoKitchen;e.currentTarget.classList.toggle('on',S.set.autoKitchen);toast(S.set.autoKitchen?'Auto-approve on':'Auto-approve off',S.set.autoKitchen?'New AI orders go straight to the kitchen':'You approve every order first',{icon:'chef'})};
  $('#board').onclick=e=>{const card=e.target.closest('[data-o]');if(!card)return;const id=card.dataset.o;const x=e.target.closest('[data-x]');
    if(!x)return orderDrawer(id);e.stopPropagation();const a=x.dataset.x;
    if(a==='approve')A.approve(id);else if(a==='cancel')confirmBox(`Cancel ${id}?`,`${custName(S.omap[id])} will get a WhatsApp message.`,'Cancel order',()=>A.cancel(id),1);
    else if(a==='ready')A.ready(id);else if(a==='assign')riderPicker(id);else if(a==='delivered')A.delivered(id)};
  this.refresh();if(opts.order)orderDrawer(opts.order);
 },
 open(opts){if(opts.order)orderDrawer(opts.order);if(opts.tab){ordTab=opts.tab;this.refresh()}},
 refresh(){
  if(isRider()){const el=$('#pg');if(el)riderOrders(el,true);return}
  if(!$('#board'))return;
  COLS.forEach(([id])=>{const L=colOrders(id);$('#n-'+id).textContent=L.length;const b=$('#cb-'+id);keepScroll(b,()=>{b.innerHTML=L.length?L.map(o=>orderCard(o,id)).join(''):`<div class="empty">${ic(id==='new'?'check':'hourglass')}${{new:'All caught up. New AI orders land here for approval.',kitchen:'Kitchen is clear.',ready:'Nothing waiting for a rider.',out:'No rider on the road.',delivered:'No deliveries yet tonight.'}[id]}</div>`});
    $(`.col[data-col="${id}"]`).classList.toggle('mon',ordTab===id)});
  $('#omt').innerHTML=COLS.map(c=>`<button class="chip ${ordTab===c[0]?'on':''}" data-t="${c[0]}">${c[1]} <b>${colOrders(c[0]).length}</b></button>`).join('');
  $$('#omt button').forEach(b=>b.onclick=()=>{ordTab=b.dataset.t;this.refresh()});
  settle($('#board'));
 }
};

/* ================= RIDERS ================= */
/* "Receive" asks how much cash Foodies Mania actually counted, so a rider
   can hand in part of what he is carrying and the rest stays owed. */
function receiveCash(r){
  modal(`<div class="md-h"><div class="grow"><h3>Cash received from ${esc(r.name.split(' ')[0])}</h3><p>${esc(r.name)} is carrying <b class="num" style="color:var(--warn)">${rs(r.cash)}</b> from cash-on-delivery orders. How much did Foodies Mania receive?</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b"><label class="field"><span>Amount counted (Rs)</span><input class="tx" id="rcAmt" type="number" inputmode="numeric" min="0" max="${r.cash}" value="${r.cash}"></label>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-amt="${r.cash}">All ${rs(r.cash)}</button><button class="btn sm" data-amt="${Math.round(r.cash/2)}">Half</button></div>
    <div class="box" style="margin-top:14px;font-size:12.5px" id="rcNote"></div></div>
   <div class="md-f"><button class="btn ghost" data-close>Cancel</button><button class="btn pri" id="rcOk">${ic('cash')}Confirm received</button></div>`,m=>{
   const inp=$('#rcAmt',m),note=$('#rcNote',m);
   const sync=()=>{const v=Math.max(0,Math.min(r.cash,Math.round(+inp.value||0)));const left=r.cash-v;
     note.innerHTML=left?`<span style="color:var(--warn)">${rs(left)} stays on ${esc(r.name.split(' ')[0])}'s account</span>`:`<span style="color:var(--ok)">${esc(r.name.split(' ')[0])} will be fully settled</span>`};
   inp.oninput=sync;sync();
   $$('[data-amt]',m).forEach(b=>b.onclick=()=>{inp.value=b.dataset.amt;sync()});
   $('#rcOk',m).onclick=()=>{const v=Math.round(+inp.value||0);if(v<=0){toast('Enter an amount','Type how much cash you counted',{icon:'alert',tone:'bad'});return}closeModal();A.settle(r.id,v)};
   setTimeout(()=>{inp.focus();inp.select()},120);
  });
}
/* Collected is every hand-in he has made tonight, in order. */
function handinList(r){
  const H=(r.handins||[]).slice().reverse();
  const tot=collected(r);
  modal(`<div class="md-h"><div class="grow"><div class="row" style="gap:10px"><div class="av sm ${avc(r.name)}">${ini(r.name)}</div><h3>Collected</h3></div><p>Cash ${esc(r.name.split(' ')[0])} has handed in at the counter tonight. This is the night's total for him and only ever grows.</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b">${H.length?`<div class="brlist">${H.map(h=>`<div class="brrow" style="cursor:default"><span class="food sm">${ic('cash','sm')}</span><div class="grow"><b>Handed in at the counter</b><div class="dim" style="font-size:12px">${t12(h.t)}</div></div><b class="num">${rs(h.amt)}</b></div>`).join('')}</div>
     <div class="kv tot" style="margin-top:14px"><span style="color:var(--fg)">${H.length} hand-in${H.length===1?'':'s'}</span><span class="num">${rs(tot)}</span></div>
     <div class="dim" style="font-size:12.5px;margin-top:10px">${ic('wallet','sm')} Still owed by him: <b>${rs(toTake(r))}</b></div>`
    :`<div class="empty">${ic('cash')}He has not handed anything in yet tonight.</div>`}</div>
   <div class="md-f"><button class="btn ghost" data-close>Close</button>${r.cash?`<button class="btn pri" id="hlRec">${ic('cash')}Receive ${rs(r.cash)}</button>`:''}</div>`,m=>{
    const b=$('#hlRec',m);if(b)b.onclick=()=>{closeModal();receiveCash(r)};
  });
}

/* Tap any of a rider's three numbers to see exactly which orders make it up. */
function riderBreakdown(r,kind){
  if(!r)return;
  if(kind==='coll')return handinList(r);   /* Collected is a ledger, not a list of orders */
  const V={
   take:{t:'To take',sub:'Everything '+r.name.split(' ')[0]+' owes the counter — still at the customer or already in his pocket. It stays here until he hands the cash in.',
         rows:[...riderOut(r).filter(o=>o.pay==='COD'),...riderHolding(r)],tot:toTake(r),icon:'bike',
         empty:'He owes nothing right now.'},
   rtake:{t:'To take',sub:'Cash '+r.name.split(' ')[0]+' still has to collect at the door.',
         rows:riderOut(r).filter(o=>o.pay==='COD'),tot:onRoad(r),icon:'bike',
         empty:'Nothing left to collect.'},
   give:{t:'To give',sub:'Cash '+r.name.split(' ')[0]+' has collected and not yet handed in at the counter.',
         rows:riderHolding(r),tot:r.cash,icon:'cash',
         empty:'Nothing to hand in.'},
   done:{t:'Delivered tonight',sub:'Every order '+r.name.split(' ')[0]+' finished this shift.',
         rows:riderDone(r),tot:null,icon:'check',
         empty:'No deliveries yet tonight.'}
  }[kind];
  if(!V)return;
  const prepaid=kind==='take'?riderOut(r).filter(o=>o.pay!=='COD'):[];
  const collected=riderHolding(r).reduce((a,o)=>a+o.total,0);
  const handed=Math.max(0,collected-r.cash);   /* what a part-payment already covered */
  const line=o=>`<button class="brrow" data-o="${o.id}"><span class="mono" style="color:var(--or2)">${o.id}</span>
    <div class="grow"><b class="ell">${esc(custName(o))}</b><div class="dim" style="font-size:12px">${esc(o.area)} · ${o.t.delivered?'delivered '+t12(o.t.delivered):'out '+ago(o.t.out||o.t.placed)}</div></div>
    <div style="text-align:right"><b class="num">${rs(o.total)}</b><div style="font-size:11.5px" class="${o.pay==='COD'?'up':'dim'}">${o.pay==='COD'?'cash':payName[o.pay]}</div></div></button>`;
  modal(`<div class="md-h"><div class="grow"><div class="row" style="gap:10px"><div class="av sm ${avc(r.name)}">${ini(r.name)}</div><h3>${V.t}</h3></div><p>${esc(V.sub)}</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b">${V.rows.length?`<div class="brlist">${V.rows.map(line).join('')}</div>`:`<div class="empty">${ic(V.icon)}${V.empty}</div>`}
    ${V.tot!=null?`<div class="kv tot" style="margin-top:14px"><span style="color:var(--fg)">${V.rows.length} order${V.rows.length===1?'':'s'}</span><span class="num">${rs(V.tot)}</span></div>`:''}
    ${kind==='give'&&handed>0?`<div class="box" style="margin-top:12px;display:grid;gap:6px;font-size:12.5px">
      <div class="kv"><span>Collected since his last hand-in</span><b class="num">${rs(collected)}</b></div>
      <div class="kv"><span>Already handed in</span><b class="num" style="color:var(--ok)">− ${rs(handed)}</b></div>
      <div class="kv tot"><span style="color:var(--fg)">Still to give</span><span class="num">${rs(r.cash)}</span></div></div>`:''}
    ${prepaid.length?`<div class="dim" style="font-size:12.5px;margin-top:12px">${ic('wallet','sm')} Also carrying ${prepaid.length} already-paid order${prepaid.length===1?'':'s'} — no cash to collect on ${prepaid.length===1?'that one':'those'}.</div>`:''}
   </div>
   <div class="md-f"><button class="btn ghost" data-close>Close</button>${(kind==='give'||kind==='take')&&r.cash?`<button class="btn pri" id="brRec">${ic('cash')}Receive ${rs(r.cash)}</button>`:''}</div>`,m=>{
    $$('[data-o]',m).forEach(b=>b.onclick=()=>{closeModal();orderDrawer(b.dataset.o)});
    const rec=$('#brRec',m);if(rec)rec.onclick=()=>{closeModal();receiveCash(r)};
  });
}
PAGES.riders={
 render(el){
  el.innerHTML=`<div class="grid g4 st" id="rk"></div>
   <div class="card" style="margin-top:16px"><div class="card-h"><h3>${ic('hourglass')}Ready orders waiting for a rider</h3><span class="dim sp" style="font-size:12.5px">Kitchen marked these ready</span></div><div class="waitbar" id="rw"></div></div>
   <div class="toolbar" style="margin-top:20px"><h3 style="font-size:18px">Team tonight</h3><span class="dim" style="font-size:12.5px">Free riders first</span><button class="btn sm" style="margin-left:auto" id="addR">${ic('plus','sm')}Add rider</button></div><div class="rdr" id="rl"></div>`;
  $('#addR').onclick=()=>modal(`<div class="md-h"><div class="grow"><h3>Add rider</h3><p>Riders appear in the assign list straight away.</p></div><button class="iconbtn" data-close>${ic('x')}</button></div><div class="md-b"><label class="field"><span>Full name</span><input class="tx" id="nrN" placeholder="e.g. Zain Abbasi"></label><label class="field"><span>Phone</span><input class="tx" id="nrP" placeholder="+92 3xx xxxxxxx"></label><label class="field"><span>Bike number</span><input class="tx" id="nrB" placeholder="KHX-0000"></label></div><div class="md-f"><button class="btn ghost" data-close>Cancel</button><button class="btn pri" id="nrOk">Add rider</button></div>`,m=>$('#nrOk',m).onclick=()=>{const n=$('#nrN',m).value.trim()||'New Rider';S.riders.push({id:'r'+S.riders.length+Date.now(),name:n,bike:$('#nrB',m).value||'KHX-0000',phone:$('#nrP',m).value||phoneNo(),status:'free',cash:0,today:0,orders:[],handins:[],settledAt:now(),earn:0,since:now()});closeModal();toast('Rider added',n+' is free and ready',{icon:'helmet',tone:'ok'});changed()});
  this.refresh();
 },
 refresh(){
  if(!$('#rl'))return;
  const f=S.riders.filter(r=>r.status==='free').length,b=S.riders.filter(r=>r.status==='busy').length,cash=S.riders.reduce((a,r)=>a+r.cash,0),del=S.riders.reduce((a,r)=>a+r.today,0);
  const K=[['helmet','Free now',f],['bike','On delivery',b],['cash','Cash with riders',cash,rs],['check','Delivered tonight',del]];
  const rk=$('#rk');if(!rk.children.length)rk.innerHTML=K.map((x,i)=>`<div class="card kpi" style="--d:${i}"><div class="ico">${ic(x[0])}</div><div><div class="lbl">${x[1]}</div><div class="val num" id="rkv${i}">0</div></div></div>`).join('');
  K.forEach((x,i)=>countUp($('#rkv'+i),x[2],x[3]));
  const ready=byStatus('ready');
  $('#rw').innerHTML=ready.length?ready.map(o=>`<div class="oc" data-k="rw${o.id}"><div class="r1"><span class="id">${o.id}</span><span class="tm">${ic('clock','sm')}<span data-since="${o.t.ready}">${ago(o.t.ready)}</span></span></div><div><div class="nm">${esc(custName(o))}</div><div class="dim" style="font-size:12px">${ic('pin','sm')} ${esc(o.area)} · ${rs(o.total)} ${o.pay==='COD'?'cash':'prepaid'}</div></div><button class="btn sm pri" data-as="${o.id}">${ic('helmet','sm')}Assign rider</button></div>`).join(''):`<div class="empty" style="width:100%">${ic('check')}No order is waiting. When the kitchen taps Ready, it shows up here.</div>`;
  const L=[...S.riders].sort((a,b)=>({free:0,busy:1,off:2}[a.status]-{free:0,busy:1,off:2}[b.status])||b.today-a.today);
  $('#rl').innerHTML=L.map(r=>`<div class="card rc ${r.status==='off'?'off':''}" data-k="rc${r.id}${r.status}">
   <div class="r1"><div class="av lg ${avc(r.name)}">${ini(r.name)}</div><div class="grow"><b style="font-size:15.5px">${esc(r.name)}</b><div class="dim" style="font-size:12.5px">${r.phone} · ${r.bike}</div></div><span class="tag ${r.status==='free'?'t-delivered':r.status==='busy'?'t-out':''}">${r.status==='free'?'<span class="dot"></span>Free':r.status==='busy'?'On delivery':'Off duty'}</span></div>
   <div class="stat"><button data-br="done:${r.id}"><small>Delivered</small><b class="num">${r.today}</b></button><button data-br="take:${r.id}" class="take ${toTake(r)?'live':''}"><small>To take</small><b class="num">${rs(toTake(r))}</b></button><button data-br="coll:${r.id}" class="hand ${collected(r)?'clear':''}"><small>Collected</small><b class="num">${rs(collected(r))}</b></button></div>
   ${r.orders.length?`<div class="cur">${r.orders.map(id=>{const o=S.omap[id];return `<div>${ic('bike','sm')}<span class="mono" style="color:var(--cyan)">${id}</span><span class="grow ell">${esc(o.area)} · ${rs(o.total)}</span><span class="dim" data-since="${o.t.out}">${ago(o.t.out)}</span><button class="btn sm ok" data-dl="${id}">Delivered</button></div>`}).join('')}</div>`:''}
   <div class="acts">${r.status!=='off'&&ready.length?`<button class="btn sm pri" data-pick="${r.id}">${ic('plus','sm')}Give order</button>`:''}${r.cash?`<button class="btn sm" data-st="${r.id}">${ic('cash','sm')}Receive</button>`:''}<button class="btn sm ghost" data-du="${r.id}">${r.status==='off'?'Start shift':'End shift'}</button></div></div>`).join('');
  const pg=$('#pg');
  $$('[data-as]',pg).forEach(b=>b.onclick=()=>riderPicker(b.dataset.as));
  $$('[data-dl]',pg).forEach(b=>b.onclick=()=>A.delivered(b.dataset.dl));
  $$('[data-du]',pg).forEach(b=>b.onclick=()=>A.duty(b.dataset.du));
  $$('[data-st]',pg).forEach(b=>b.onclick=()=>{const r=S.riders.find(x=>x.id===b.dataset.st);receiveCash(r)});
  $$('[data-br]',pg).forEach(b=>b.onclick=()=>{const [kind,rid]=b.dataset.br.split(':');riderBreakdown(S.riders.find(x=>x.id===rid),kind)});
  $$('[data-pick]',pg).forEach(b=>b.onclick=()=>{const r=S.riders.find(x=>x.id===b.dataset.pick);modal(`<div class="md-h"><div class="grow"><h3>Give ${esc(r.name.split(' ')[0])} an order</h3><p>Orders the kitchen has marked ready.</p></div><button class="iconbtn" data-close>${ic('x')}</button></div><div class="md-b">${byStatus('ready').map(o=>`<button class="rp" data-o="${o.id}"><span class="mono" style="color:var(--or2)">${o.id}</span><div class="grow"><b>${esc(custName(o))}</b><div class="dim" style="font-size:12px">${esc(o.area)} · ${rs(o.total)}</div></div>${ic('chev')}</button>`).join('')}</div>`,m=>$$('[data-o]',m).forEach(x=>x.onclick=()=>{A.assign(x.dataset.o,r.id);closeModal()}))});
  settle(pg);
 }
};

/* ================= CUSTOMERS ================= */
let cuSeg='all',cuArea='',cuQ='',cuPage=1,cuSel=null,cuSort='recent';
PAGES.customers={
 render(el,opts){
  if(opts.cust){cuSel=opts.cust;cuSeg='all';cuQ='';const c=S.cmap[opts.cust];const L=this.filtered();const i=L.indexOf(c);cuPage=i>=0?Math.floor(i/10)+1:1}
  el.innerHTML=`<div class="grid g4 st" id="cuk"></div>
   <div class="cu" style="margin-top:16px"><div class="card" style="min-width:0"><div class="card-h"><h3>${ic('users')}Customers</h3><div class="sp row" style="gap:8px;flex-wrap:wrap"><div class="inp" style="height:38px;width:220px;max-width:100%">${ic('search','sm')}<input id="cuQ" placeholder="Name or phone" aria-label="Search customers" value="${esc(cuQ)}"></div>
     <select class="tx" id="cuA" style="width:auto;height:38px" aria-label="Area"><option value="">All areas</option>${AREAS.map(a=>`<option ${cuArea===a.name?'selected':''}>${a.name}</option>`).join('')}</select>
     <select class="tx" id="cuS" style="width:auto;height:38px" aria-label="Sort"><option value="recent">Recent orders</option><option value="spent">Most spent</option><option value="orders">Most orders</option></select></div></div>
    <div class="segs" id="cuSegs"></div><div class="tbl-wrap" style="margin-top:12px"><table class="tbl tbl-d"><thead><tr><th>Customer</th><th>Status</th><th>Area</th><th>Orders</th><th>Total spent</th><th>Last order</th><th>Favourite</th></tr></thead><tbody id="cuT"></tbody></table><div class="mcards lst" id="cuM" style="padding:0 14px"></div><div class="pager" id="cuP" style="padding-bottom:16px"></div></div></div>
    <div class="prof" id="cuPr"></div></div>
   <div class="grid g21" style="margin-top:16px"><div class="card"><div class="card-h"><h3>${ic('crown')}Top customers this month</h3></div><div class="lst" id="cuTop"></div></div><div class="card chart"><div class="card-h"><h3>${ic('sparkle')}New customers per week</h3></div><div id="cuG"></div></div></div>`;
  $('#cuS').value=cuSort;
  $('#cuQ').oninput=e=>{cuQ=e.target.value.toLowerCase();cuPage=1;this.table()};
  $('#cuA').onchange=e=>{cuArea=e.target.value;cuPage=1;this.table()};
  $('#cuS').onchange=e=>{cuSort=e.target.value;cuPage=1;this.table()};
  this.refresh(true);
 },
 open(opts){if(opts.cust){this.render($('#pg'),opts)}},
 filtered(){let L=S.customers.filter(c=>c.n>0||c.since>=SHIFT0-7*DAY||c.blocked);
  if(cuSeg!=='all')L=L.filter(c=>segOf(c)===cuSeg);if(cuArea)L=L.filter(c=>c.area===cuArea);
  if(cuQ)L=L.filter(c=>c.name.toLowerCase().includes(cuQ)||c.phone.replace(/\s/g,'').includes(cuQ.replace(/\s/g,'')));
  return L.sort(cuSort==='spent'?(a,b)=>b.spent-a.spent:cuSort==='orders'?(a,b)=>b.n-a.n:(a,b)=>b.last-a.last)},
 refresh(first){
  if(!$('#cuT'))return;
  const all=S.customers.filter(c=>c.n>0||c.since>=SHIFT0-7*DAY);
  const nw=all.filter(c=>c.since>=SHIFT0-7*DAY).length,rep=all.filter(c=>c.n>1).length;
  const tot=all.reduce((a,c)=>a+c.spent,0),ords=all.reduce((a,c)=>a+c.n,0);
  const K=[['users','Total customers',all.length],['sparkle','New this week',nw],['heart','Repeat customers',rep],['wallet','Average order value',ords?tot/ords:0,rs]];
  const kk=$('#cuk');if(!kk.children.length)kk.innerHTML=K.map((x,i)=>`<div class="card kpi" style="--d:${i}"><div class="ico">${ic(x[0])}</div><div><div class="lbl">${x[1]}</div><div class="val num" id="cuv${i}">0</div></div></div>`).join('');
  K.forEach((x,i)=>countUp($('#cuv'+i),x[2],x[3]));
  const sc={all:all.length,vip:0,regular:0,new:0,inactive:0,blocked:0};all.forEach(c=>sc[segOf(c)]++);
  $('#cuSegs').innerHTML=[['all','All'],['vip','VIP · 14+ orders'],['regular','Regular'],['new','New this week'],['inactive','Inactive 30+ days'],['blocked','Blocked']].map(([id,t])=>`<button class="chip ${cuSeg===id?'on':''}" data-s="${id}">${t} <b>${sc[id]}</b></button>`).join('');
  $$('#cuSegs button').forEach(b=>b.onclick=()=>{cuSeg=b.dataset.s;cuPage=1;this.refresh()});
  this.table();
  if(first){
   const m0=now()-30*DAY;const sp={};S.orders.forEach(o=>{if(o.status==='delivered'&&o.t.placed>=m0)sp[o.cid]=(sp[o.cid]||0)+o.total});
   const top=Object.entries(sp).sort((a,b)=>b[1]-a[1]).slice(0,5);
   $('#cuTop').innerHTML=top.map(([id,v],i)=>{const c=S.cmap[id];return `<button data-cu="${id}"><b class="num dim" style="width:18px">${i+1}</b><div class="av sm ${avc(c.name)}">${ini(c.name)}</div><div class="grow"><b>${esc(c.name)}</b><div class="dim" style="font-size:12px">${esc(c.area)} · ${c.n} orders all time</div></div><b class="num">${rs(v)}</b></button>`}).join('');
   $$('#cuTop [data-cu]').forEach(b=>b.onclick=()=>this.select(b.dataset.cu));
   const wk=[...Array(8)].map((_,i)=>{const e=SHIFT0+DAY-(7-i)*7*DAY;return S.customers.filter(c=>c.first&&c.first>=e-7*DAY&&c.first<e||(i===7&&c.since>=SHIFT0-7*DAY&&!c.first)).length});
   const W=560,H=170,L=26,mx=Math.ceil(Math.max(...wk,4)/4)*4,bw=(W-L-8)/8,y=v=>10+(H-36)*(1-v/mx);
   $('#cuG').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="New customers per week">${[0,1,2,3,4].map(i=>`<line x1="${L}" x2="${W-8}" y1="${y(mx/4*i)}" y2="${y(mx/4*i)}" stroke="var(--line)"/><text x="${L-6}" y="${y(mx/4*i)+4}" font-size="10" text-anchor="end" fill="var(--dim)">${mx/4*i}</text>`).join('')}${wk.map((v,i)=>`<rect x="${L+i*bw+bw*.2}" y="${y(v)}" width="${bw*.6}" height="${H-26-y(v)}" rx="4" fill="${i===7?'var(--or2)':'var(--or)'}" opacity="${i===7?1:.75}"><title>${v} new</title></rect><text x="${L+i*bw+bw/2}" y="${H-8}" font-size="10" text-anchor="middle" fill="var(--dim)">${i===7?'This wk':dshort(SHIFT0-(7-i)*7*DAY)}</text>`).join('')}</svg>`;
  }
  this.profile();
 },
 table(){
  const L=this.filtered();const pages=Math.max(1,Math.ceil(L.length/10));cuPage=Math.min(cuPage,pages);const rows=L.slice((cuPage-1)*10,cuPage*10);
  const fav=c=>{const f=Object.entries(c.fav).filter(([m])=>MM[m].cat!=='drink').sort((a,b)=>b[1]-a[1])[0];return f?f[0]:null};
  $('#cuT').innerHTML=rows.map(c=>{const f=fav(c);return `<tr class="${cuSel===c.id?'sel':''}" data-cu="${c.id}"><td><div class="row"><div class="av sm ${avc(c.name)}">${ini(c.name)}</div><div><b>${esc(c.name)}</b><div class="dim" style="font-size:12px">${c.phone}</div></div></div></td><td>${segTag(c)}</td><td class="muted">${esc(c.area)}</td><td class="num">${c.n}</td><td class="num"><b>${rs(c.spent)}</b></td><td class="muted">${c.last?dstr(c.last):'—'}</td><td>${f?`<div class="row">${foodIc(f,'sm')}<span class="ell" style="max-width:140px">${esc(MM[f].name)}</span></div>`:'<span class="dim">—</span>'}</td></tr>`}).join('')||`<tr><td colspan="7"><div class="empty">${ic('users')}No customers match these filters.</div></td></tr>`;
  $('#cuM').innerHTML=rows.map(c=>`<button data-cu="${c.id}"><div class="av sm ${avc(c.name)}">${ini(c.name)}</div><div class="grow"><b class="ell">${esc(c.name)}</b><div class="dim" style="font-size:12px">${esc(c.area)} · ${c.n} orders</div></div><div style="display:grid;justify-items:end;gap:4px"><b class="num">${rs(c.spent)}</b>${segTag(c)}</div></button>`).join('');
  const pg=[];for(let i=1;i<=pages;i++)if(i<=2||i>pages-2||Math.abs(i-cuPage)<=1)pg.push(i);else if(pg.at(-1)!=='…')pg.push('…');
  $('#cuP').innerHTML=`<span class="dim" style="font-size:12.5px">Showing ${L.length?(cuPage-1)*10+1:0}–${Math.min(cuPage*10,L.length)} of ${L.length}</span><div class="pg"><button data-p="${cuPage-1}" aria-label="Previous" ${cuPage===1?'disabled':''}>${ic('back','sm')}</button>${pg.map(p=>p==='…'?'<button disabled>…</button>':`<button class="${p===cuPage?'on':''}" data-p="${p}">${p}</button>`).join('')}<button data-p="${cuPage+1}" aria-label="Next" ${cuPage===pages?'disabled':''}>${ic('chev','sm')}</button></div>`;
  $$('#cuP [data-p]').forEach(b=>b.onclick=()=>{cuPage=+b.dataset.p;this.table()});
  $$('#cuT [data-cu],#cuM [data-cu]').forEach(r=>r.onclick=()=>this.select(r.dataset.cu));
 },
 select(id){cuSel=id;$$('#cuT tr').forEach(r=>r.classList.toggle('sel',r.dataset.cu===id));this.profile(true);if(innerWidth<1180)$('#cuPr').scrollIntoView({behavior:'smooth',block:'start'})},
 profile(anim){
  const box=$('#cuPr');if(!box)return;
  const c=S.cmap[cuSel]||this.filtered()[0];if(!c){box.innerHTML='';return}cuSel=c.id;
  if(document.activeElement&&document.activeElement.id==='cuNote')return;
  const os=S.orders.filter(o=>o.cid===c.id).sort((a,b)=>b.t.placed-a.t.placed);
  const favs=Object.entries(c.fav).filter(([m])=>MM[m].cat!=='drink').sort((a,b)=>b[1]-a[1]).slice(0,3);
  const pref=Object.entries(c.pays).sort((a,b)=>b[1]-a[1])[0];
  box.innerHTML=`<div class="card ${anim?'enter':''}" style="display:grid;gap:14px"><div class="card-h" style="margin:0"><h3>Customer profile</h3>${segTag(c)}</div>
   <div class="ph"><div class="av lg ${avc(c.name)}">${ini(c.name)}</div><div class="grow"><b style="font-size:17px">${esc(c.name)}</b><div class="dim" style="font-size:12.5px">${c.phone}</div><div class="dim" style="font-size:12px">Customer since ${dstr(c.since)}</div></div></div>
   <div class="stat3"><div><small>Orders</small><b class="num">${c.n}</b></div><div><small>Spent</small><b class="num">${k(c.spent)}</b></div><div><small>Avg order</small><b class="num">${rs(c.n?c.spent/c.n:0)}</b></div></div>
   <div class="box row" style="align-items:flex-start;font-size:13px">${ic('pin','sm')}<span>${esc(c.addr)}<br><span class="dim">Delivery fee ${rs(feeOf(c.area))}${pref?' · Usually pays by '+payName[pref[0]]:''}</span></span></div>
   ${favs.length?`<div class="sec"><h4>Favourite items</h4><div style="display:flex;gap:6px;flex-wrap:wrap">${favs.map(([m,n])=>`<span class="tag" style="height:30px">${fi(CATIC[MM[m].cat],'sm')}${esc(MM[m].name)} ×${n}</span>`).join('')}</div></div>`:''}
   <div class="sec"><h4>Order history</h4><div class="lst">${os.slice(0,5).map(o=>`<button data-o="${o.id}" style="padding:8px 0"><div class="grow"><div class="row" style="gap:6px"><span class="mono" style="color:var(--or2);font-size:12px">${o.id}</span><span class="dim" style="font-size:12px">${dstr(o.t.placed)}</span></div><div class="ell dim" style="font-size:12px">${esc(itemsShort(o))}</div></div><div style="display:grid;justify-items:end;gap:3px"><b class="num" style="font-size:13px">${rs(o.total)}</b>${stTag(o.status)}</div></button>`).join('')||'<div class="dim" style="font-size:13px">No orders yet.</div>'}</div></div>
   <label class="field"><span>Notes</span><textarea class="tx" id="cuNote" rows="2" placeholder="e.g. Prefers extra spicy, call before delivery">${esc(c.note)}</textarea></label>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn pri" id="cuChat">${ic('wa')}Open chat</button><button class="btn" id="cuOffer">${ic('send')}Send offer</button><button class="btn ${c.blocked?'':'danger'}" id="cuBlock" style="grid-column:1/-1">${ic('block')}${c.blocked?'Unblock customer':'Block customer'}</button></div></div>`;
  $('#cuNote').onchange=e=>{c.note=e.target.value;toast('Note saved',c.name,{icon:'note',tone:'ok'})};
  $$('[data-o]',box).forEach(b=>b.onclick=()=>orderDrawer(b.dataset.o));
  $('#cuChat').onclick=()=>{let ch=S.chats.find(x=>x.cid===c.id);if(!ch){ch={id:'chm'+Date.now(),cid:c.id,state:'human',msgs:[{from:'sys',text:'You started this chat from the customer profile.',t:now()}],unread:0,last:now(),draft:{items:[],note:'',addr:'',area:'',fee:0,pay:''},kind:'delivery'};S.chats.unshift(ch)}go('chats',{chat:ch.id})};
  $('#cuOffer').onclick=()=>go('bulk');
  $('#cuBlock').onclick=()=>{if(c.blocked){c.blocked=false;toast('Customer unblocked',c.name,{icon:'check',tone:'ok'});changed()}else confirmBox(`Block ${c.name}?`,'The AI agent will stop replying to this number and they are left out of bulk messages.','Block',()=>{c.blocked=true;toast('Customer blocked',c.name,{icon:'block',tone:'bad'});changed()},1)};
 }
};

/* ================= MENU ================= */
let mCat='all',mQ='';
PAGES.menu={
 render(el){
  el.innerHTML=`<div class="toolbar"><div class="inp" style="height:40px;width:280px;max-width:100%">${ic('search')}<input id="mQ" placeholder="Search menu" aria-label="Search menu" value="${esc(mQ)}"></div><span class="dim" style="font-size:12.5px" id="mInfo"></span><button class="btn pri" id="mAdd" style="margin-left:auto">${ic('plus')}Add item</button></div>
   <div class="segs" id="mCats"></div>
   <div id="catAv"></div>
   <div class="mg" id="mGrid"></div>`;
  $('#mQ').oninput=e=>{mQ=e.target.value.toLowerCase();this.refresh()};
  $('#mAdd').onclick=()=>modal(`<div class="md-h"><div class="grow"><h3>Add menu item</h3><p>The AI agent can offer it as soon as you save.</p></div><button class="iconbtn" data-close>${ic('x')}</button></div><div class="md-b"><label class="field"><span>Item name</span><input class="tx" id="niN" placeholder="e.g. Tower Burger"></label><div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><label class="field"><span>Category</span><select class="tx" id="niC">${CATS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></label><label class="field"><span>Price (Rs)</span><input class="tx" id="niP" type="number" min="0" placeholder="450"></label></div></div><div class="md-f"><button class="btn ghost" data-close>Cancel</button><button class="btn pri" id="niOk">Save item</button></div>`,m=>$('#niOk',m).onclick=()=>{const n=$('#niN',m).value.trim();const p=+$('#niP',m).value;if(!n||!p){toast('Add a name and price','Both are needed so the AI can quote it',{icon:'alert',tone:'bad'});return}const it={id:'m'+MENU.length,cat:$('#niC',m).value,name:n,price:p,say:n.toLowerCase(),pop:2,avail:true};MENU.push(it);MM[it.id]=it;closeModal();toast('Item added',`${n} · ${rs(p)}`,{icon:'check',tone:'ok'});this.refresh()});
  $('#mGrid').onclick=e=>{const t=e.target.closest('[data-tg]');if(t)A.toggleItem(t.dataset.tg)};
  $('#catAv').onclick=e=>{const t=e.target.closest('[data-tc]');if(t)A.toggleCat(t.dataset.tc)};
  $('#mGrid').onchange=e=>{const p=e.target.closest('[data-pr]');if(p){const m=MM[p.dataset.pr];const v=Math.max(0,Math.round(+p.value||m.price));m.price=v;p.value=v;toast('Price updated',`${m.name} is now ${rs(v)}. New orders use this price.`,{icon:'edit',tone:'ok'})}};
  this.refresh();
 },
 refresh(){
  if(!$('#mGrid'))return;if(document.activeElement&&document.activeElement.dataset.pr)return;
  const sold={};tonight().forEach(o=>o.items.forEach(it=>sold[it.mid]=(sold[it.mid]||0)+it.qty));
  $('#mCats').innerHTML=[{id:'all',name:'All'},...CATS].map(c=>`<button class="chip ${mCat===c.id?'on':''} ${c.id!=='all'&&!c.avail?'coff':''}" data-c="${c.id}">${c.name} <b>${c.id==='all'?MENU.length:MENU.filter(m=>m.cat===c.id).length}</b></button>`).join('');
  $$('#mCats button').forEach(b=>b.onclick=()=>{mCat=b.dataset.c;this.refresh()});
  const offAll=MENU.filter(m=>!isOn(m)).length;
  $('#mInfo').textContent=`${MENU.length} items · ${offAll} not being offered`;
  /* the whole-category switch lives on the category you picked, not in a separate list */
  const c=CM[mCat];
  $('#catAv').innerHTML=c?`<div class="catone ${c.avail?'':'off'}" data-k="cav${c.id}${c.avail}">
     <span class="food sm">${fi(c.ic)}</span>
     <div class="t"><b>${esc(c.name)} ${c.avail?'are being offered':'are switched off'}</b>
      <small>${c.avail?`The AI agent can offer all ${MENU.filter(m=>m.cat===c.id&&m.avail).length} items that are on`:`All ${MENU.filter(m=>m.cat===c.id).length} items are hidden from the AI agent tonight`}</small></div>
     <button class="sw ${c.avail?'on':''}" data-tc="${c.id}" role="switch" aria-checked="${c.avail}" aria-label="${esc(c.name)} available"></button></div>`:'';
  const L=MENU.filter(m=>(mCat==='all'||m.cat===mCat)&&(!mQ||m.name.toLowerCase().includes(mQ)));
  $('#mGrid').innerHTML=L.map(m=>{const cOn=catOn(m.cat);
   return `<div class="card mi ${m.avail?'':'off'} ${cOn?'':'catoff'}" data-k="mi${m.id}"><div class="r1">${foodIc(m.id)}<div class="grow" style="min-width:0"><b class="ell" style="display:block">${esc(m.name)}</b><span class="dim" style="font-size:12px">${CM[m.cat].name} · ${sold[m.id]||0} sold tonight</span></div></div>
   <div class="r2"><label class="pr">Rs <input type="number" min="0" value="${m.price}" data-pr="${m.id}" aria-label="Price of ${esc(m.name)}"></label><span class="grow"></span>${cOn?`<span style="font-size:12.5px" class="${m.avail?'up':'dim'}">${m.avail?'Available':'Off'}</span>`:`<span class="offwhy">${esc(CM[m.cat].name)} off</span>`}<button class="sw ${isOn(m)?'on':''}" data-tg="${m.id}" role="switch" aria-checked="${isOn(m)}" aria-label="Available" ${cOn?'':'disabled style="opacity:.5;pointer-events:none"'}></button></div></div>`}).join('')||`<div class="empty card" style="grid-column:1/-1">${ic('search')}No items match.</div>`;
  settle($('#pg'));
 }
};

/* ================= SETTINGS ================= */
let setSec='wa';const showPw=new Set();

/* who Evexa AI is, for the locked WhatsApp panel */
function evexaModal(){
  modal(`<div class="md-h"><div class="grow"><div class="row" style="gap:10px"><span class="xm" style="width:30px;height:30px;border-radius:8px;background:var(--fg);color:var(--bg);display:grid;place-items:center">${ic('evexa')}</span><h3>Evexa AI</h3></div><p>Evexa AI runs the WhatsApp connection and the order-taking agent for Foodies Mania.</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b"><div class="box" style="display:grid;gap:10px;font-size:13px">
     <div class="row">${ic('wa','sm')}<span class="grow">Delivery WhatsApp</span><b class="mono">${esc(S.set.waNo)}</b></div>
     <div class="row">${ic('bot','sm')}<span class="grow">AI order agent</span><span class="tag t-ai">Active</span></div>
     <div class="row">${ic('shield','sm')}<span class="grow">Connection managed by</span><b>Evexa AI</b></div>
   </div>
   <p class="muted" style="font-size:12.5px;margin:14px 0 0">To change the number, re-link the device or pause the agent, message your Evexa AI contact. Nothing in this CRM can disconnect it.</p></div>
   <div class="md-f"><button class="btn ghost" data-close>Close</button><a class="evexa" href="https://evexaai.com" target="_blank" rel="noopener"><span class="xm">${ic('evexa')}</span>Open evexaai.com</a></div>`);
}

/* staff roles and what each side of the CRM a user can be given */
const PERMS=[['dash','Dashboard','dash'],['chats','Live Conversations','chat'],['orders','Delivery Orders','bike'],['kitchen','Kitchen','chef'],['riders','Riders','helmet'],['bulk','Bulk Message','send'],['menu','Menu Management','cloche'],
 ['customers','Customers','users'],['reports','Payments & Reports','chart'],['promos','Promotions & Offers','tag'],['settings','Settings','gear']];
const ROLES={
 admin:{name:'Admin',ic:'crown',note:'The whole CRM, settings included',perms:PERMS.map(p=>p[0])},
 rider:{name:'Rider',ic:'helmet',note:'Only his own deliveries',perms:['dash','orders']}
};
const permName=id=>(PERMS.find(p=>p[0]===id)||[,'—'])[1];
/* a user with no explicit tick list simply gets whatever the role gives */
const userPerms=u=>u.perms&&u.perms.length?u.perms:(ROLES[u.role]||ROLES.admin).perms;

/* Add a user, reset a password, or change what someone can reach.
   mode: null = add, 'pass' = password only, 'access' = role + sections */
function userForm(u,after,mode){
  let role=u?(u.role||'admin'):'admin';
  let riderId=u?(u.riderId||''):'';
  let picked=u?userPerms(u).slice():ROLES[role].perms.slice();
  const permsHTML=()=>PERMS.map(([id,label,icn])=>`<label class="${picked.includes(id)?'on':''}" data-pm="${id}"><input type="checkbox" ${picked.includes(id)?'checked':''}>${ic(icn,'sm')}<span class="ell">${label}</span></label>`).join('');
  const rolesHTML=()=>Object.entries(ROLES).map(([id,r])=>`<button class="${role===id?'on':''}" data-rl="${id}">${ic(r.ic,'lg')}<b>${r.name}</b><small>${esc(r.note)}</small></button>`).join('');
  const title=mode==='pass'?'Reset password':mode==='access'?'Access for '+(u?u.name.split(' ')[0]:''):'Add user';
  const sub=mode==='pass'?esc(u.name):mode==='access'?'Change the role or tick exactly what they can open.':'Who is this user, and what should they be able to open?';
  modal(`<div class="md-h"><div class="grow"><h3>${esc(title)}</h3><p>${sub}</p></div><button class="iconbtn" data-close>${ic('x')}</button></div>
   <div class="md-b">
    ${mode?'':`<label class="field"><span>Full name</span><input class="tx" id="uN" placeholder="e.g. Kashif Ali"></label>
      <label class="field" style="margin-top:12px"><span>Login ID</span><input class="tx" id="uL" placeholder="kashif"></label>`}
    ${mode==='access'?'':`<label class="field" style="margin-top:12px"><span>${mode==='pass'?'New password':'Password'}</span><input class="tx" id="uP" placeholder="At least 6 characters"></label>`}
    ${mode==='pass'?'':`<div class="field" style="margin-top:16px"><span>Who is this user?</span><div class="roleseg" id="uRole">${rolesHTML()}</div></div>
      <div class="field" id="uRiderWrap" style="margin-top:16px;${role==='rider'?'':'display:none'}"><span>Which rider on the board is this?</span>
       <select class="tx" id="uRider">${S.riders.map(r=>`<option value="${r.id}" ${riderId===r.id?'selected':''}>${esc(r.name)} · ${esc(r.bike)}</option>`).join('')}</select>
       <small class="dim" style="font-size:11.5px">He signs in and sees only this rider's drops and cash.</small></div>
      <div class="field" style="margin-top:16px"><span>Sections they can open <b class="dim" id="uPn"></b></span><div class="perms" id="uPerms">${permsHTML()}</div></div>`}
   </div>
   <div class="md-f"><button class="btn ghost" data-close>Cancel</button><button class="btn pri" id="uOk">${mode==='pass'?'Reset password':mode==='access'?'Save access':'Add user'}</button></div>`,m=>{
   const count=()=>{const n=$('#uPn',m);if(n)n.textContent=`· ${picked.length} of ${PERMS.length}`};
   const paint=()=>{const box=$('#uPerms',m);if(box){box.innerHTML=permsHTML();wirePerms()}
     const rb=$('#uRole',m);if(rb)$$('button',rb).forEach(b=>b.classList.toggle('on',b.dataset.rl===role));
     const rw=$('#uRiderWrap',m);if(rw)rw.style.display=role==='rider'?'':'none';
     count()};
   const wirePerms=()=>$$('[data-pm]',m).forEach(l=>l.onclick=e=>{e.preventDefault();const id=l.dataset.pm;
     picked=picked.includes(id)?picked.filter(x=>x!==id):[...picked,id];
     l.classList.toggle('on',picked.includes(id));const cb=l.querySelector('input');if(cb)cb.checked=picked.includes(id);count()});
   if($('#uRole',m))$$('[data-rl]',m).forEach(b=>b.onclick=()=>{role=b.dataset.rl;picked=ROLES[role].perms.slice();paint()});
   wirePerms();count();
   $('#uOk',m).onclick=()=>{
     const pw=$('#uP',m)?$('#uP',m).value:'';
     if(mode==='pass'){u.pass=pw||u.pass;toast('Password reset',u.name,{icon:'lock',tone:'ok'})}
     else if(mode==='access'){
       if(!picked.length){toast('Tick at least one section','Otherwise they can sign in and see nothing',{icon:'alert',tone:'bad'});return}
       u.role=role;u.perms=picked.slice();
       u.riderId=role==='rider'?(($('#uRider',m)||{}).value||riderId||'r0'):'';
       toast('Access saved',`${u.name} · ${ROLES[role].name} · ${picked.length} of ${PERMS.length} sections`,{icon:'shield',tone:'ok'})}
     else{
       const n=$('#uN',m).value.trim();
       if(!n){toast('Add a name','Who is signing in?',{icon:'alert',tone:'bad'});return}
       if(!picked.length){toast('Tick at least one section','Otherwise they can sign in and see nothing',{icon:'alert',tone:'bad'});return}
       const login=($('#uL',m).value.trim()||n.split(' ')[0]).toLowerCase();
       if(S.users.some(x=>x.login===login)){toast('That login ID is taken','Pick a different one',{icon:'alert',tone:'bad'});return}
       S.users.push({id:'u'+Date.now(),name:n,login,pass:pw||'changeme',on:true,role,perms:picked.slice(),
         riderId:role==='rider'?(($('#uRider',m)||{}).value||'r0'):''});
       toast('User added',`${n} · ${ROLES[role].name} · ${picked.length} of ${PERMS.length} sections`,{icon:'user',tone:'ok'})}
     closeModal();after&&after()};
   setTimeout(()=>{const f=$('#uN',m)||$('#uP',m);f&&f.focus()},120);
  });
}
PAGES.settings={
 render(el,opts){
  if(opts.sec)setSec=opts.sec;
  const secs=[['wa','WhatsApp','wa'],['app','Install the app','down'],['take','Takeaway number','take'],['biz','Business & hours','store'],['areas','Delivery areas','pin'],['users','Users & logins','users'],['voice','Notifications & voice','sound'],['demo','Demo','play']];
  el.innerHTML=`<div class="set"><div class="set-nav" id="setNav">${secs.map(s=>`<button data-s="${s[0]}" class="${setSec===s[0]?'on':''}">${ic(s[2])}${s[1]}</button>`).join('')}</div><div class="set-body" id="setB"></div></div>`;
  $$('#setNav button').forEach(b=>b.onclick=()=>{setSec=b.dataset.s;$$('#setNav button').forEach(x=>x.classList.toggle('on',x===b));this.body()});
  this.body();
 },
 open(opts){if(opts.sec){setSec=opts.sec;this.render($('#pg'),opts)}},
 refresh(){if(setSec==='wa'&&$('#waStat')&&this._wa!==S.set.wa)this.body()},
 body(){
  const B=$('#setB');if(!B)return;const s=S.set;
  if(setSec==='wa'){
   this._wa=s.wa;
   /* status, the number, and who to call. Nothing here can change the connection. */
   B.innerHTML=`<div class="card enter"><div class="card-h"><h3>${ic('wa')}Delivery WhatsApp</h3><span class="tag sp">${ic('lock')}Managed by Evexa AI</span></div>
    <div class="walite">
     <div class="warow"><span class="dot ${s.wa?'':'red'}"></span>
      <div class="grow"><b style="font-size:17px;color:${s.wa?'var(--ok)':'var(--bad)'}">${s.wa?'Connected':'Disconnected'}</b>
       <div class="dim" style="font-size:12.5px">${s.wa?'The AI agent is answering customers':'The AI agent cannot reply right now'}</div></div></div>
     <div class="warow"><span class="food sm">${ic('phone','sm')}</span>
      <div class="grow"><b class="mono" style="font-size:16px">${esc(s.waNo)}</b>
       <div class="dim" style="font-size:12.5px">The number customers message to order</div></div></div>
    </div>
    <div class="row" style="gap:10px;flex-wrap:wrap;margin-top:16px">
     <button class="evexa" id="waEvexa"><span class="xm">${ic('evexa')}</span>Contact Evexa AI</button>
     <a class="btn" href="https://evexaai.com" target="_blank" rel="noopener">${ic('link')}evexaai.com</a>
    </div></div>`;
   $('#waEvexa').onclick=()=>evexaModal();
  }
  if(setSec==='app'){
   const on=Install.standalone(), ready=Install.can(), plat=Install.platform();
   const HOW={
    ios:['Open this page in Safari','Tap the Share button at the bottom','Choose <b>Add to Home Screen</b>'],
    android:['Open the browser menu (⋮)','Choose <b>Install app</b> or <b>Add to Home screen</b>','Confirm, and it lands on your home screen'],
    desktop:['Look for the install icon at the right of the address bar','Or open the browser menu and choose <b>Install Foodies Mania CRM</b>','It opens in its own window from then on']
   }[plat];
   B.innerHTML=`<div class="card enter"><div class="card-h"><h3>${ic('down')}Install the app</h3>${on?'<span class="tag t-delivered sp">'+ic('check')+'Installed</span>':''}</div>
    <p class="muted" style="margin:0 0 16px">Put Foodies Mania CRM on the home screen of a phone or on a desktop, so it opens in its own window with no address bar — and keeps working if the line drops.</p>
    <div class="appbox">
     <img class="appicon" src="assets/icon.svg" alt="">
     <div class="grow" style="min-width:200px">
      <b style="font-size:16px">Foodies Mania CRM</b>
      <div class="dim" style="font-size:12.5px">${on?'Running as an installed app right now.':ready?'Your browser is ready to install it.':'Installs from your browser menu — see the steps below.'}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:12px">
       ${on?'':`<button class="btn pri lg" id="appGo" ${ready?'':'disabled'}>${ic('down')}Download the app</button>`}
       <button class="btn" id="appCopy">${ic('copy')}Copy the link</button></div>
     </div></div>
    ${on?'':`<div class="sec" style="margin-top:18px"><h4>${plat==='ios'?'On an iPhone or iPad':plat==='android'?'On Android':'On a computer'}</h4>
      <ol class="appsteps">${HOW.map(h=>`<li>${h}</li>`).join('')}</ol></div>`}
    <div class="srow" style="margin-top:6px"><div class="t"><b>Works without a signal</b><small>Once installed, the screens still open on a weak line — only live updates wait for the connection.</small></div>${ic('shield')}</div>
   </div>`;
   const g=$('#appGo');
   if(g)g.onclick=async()=>{
     g.disabled=true;g.innerHTML=ic('clock')+'Opening…';
     const out=await Install.prompt();
     if(out==='accepted')toast('Installing','Look for Foodies Mania on your home screen',{icon:'check',tone:'ok'});
     else if(out==='unavailable')toast('Use the browser menu','Your browser did not offer the prompt — follow the steps below',{icon:'alert'});
     else toast('Not installed','You can start it again any time from here',{icon:'down'});
     this.body();
   };
   $('#appCopy').onclick=async()=>{
     try{await navigator.clipboard.writeText(location.origin+location.pathname);
       toast('Link copied','Open it on the phone you want to install it on',{icon:'copy',tone:'ok'})}
     catch(e){toast('Copy it from the address bar','Clipboard access was refused',{icon:'alert',tone:'bad'})}
   };
  }
  if(setSec==='take'){
   B.innerHTML=`<div class="card enter"><div class="card-h"><h3>${ic('take')}Takeaway number</h3></div><p class="muted" style="margin:0 0 14px">When a customer picks Takeaway, the AI agent sends this number and ends the chat. The dashboard counts how many customers received it.</p>
    <div class="row" style="gap:10px;flex-wrap:wrap"><input class="tx" id="tkNo" value="${esc(s.takeNo)}" style="max-width:260px" aria-label="Takeaway number"><button class="btn pri" id="tkSave">Save number</button></div>
    <div class="srow" style="margin-top:8px"><div class="t"><b>${S.takeaway.filter(t=>t.t>=SHIFT0).length} customers tonight</b><small>Got the takeaway number from the AI agent</small></div></div></div>
    <div class="card"><div class="card-h"><h3>${ic('edit')}What the customer sees</h3><button class="btn sm ghost sp" id="tkReset">Reset to default</button></div>
     <p class="muted" style="margin:0 0 12px;font-size:12.5px">Write it however you want. <b class="mono">{number}</b> is swapped for the takeaway number above, so you only ever change the number in one place.</p>
     <textarea class="tx" id="tkMsg" rows="4" maxlength="420" aria-label="Takeaway message">${esc(s.takeMsg)}</textarea>
     <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px"><button class="btn sm" id="tkIns">${ic('plus','sm')}Insert {number}</button><span class="dim" style="font-size:12px;margin-left:auto" id="tkLen"></span></div>
     <div class="box" style="margin-top:16px;max-width:460px"><div class="dim" style="font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Preview</div><div class="bub ai" id="tkPrev" style="max-width:100%;animation:none"></div></div>
     <div style="margin-top:14px"><button class="btn pri" id="tkMsgSave">Save message</button></div></div>`;
   const prev=()=>{const t=$('#tkMsg').value;
     $('#tkPrev').innerHTML=esc(t.replaceAll('{number}',$('#tkNo').value||s.takeNo)).replace(/\n/g,'<br>');
     $('#tkLen').textContent=t.length+'/420'};
   $('#tkNo').oninput=prev;$('#tkMsg').oninput=prev;prev();
   $('#tkIns').onclick=()=>{const t=$('#tkMsg');const p=t.selectionStart??t.value.length;t.value=t.value.slice(0,p)+'{number}'+t.value.slice(p);t.focus();prev()};
   $('#tkReset').onclick=()=>{$('#tkMsg').value='Takeaway ke liye please humare takeaway number par WhatsApp/call karein:\n📞 {number}\nWo aap ka order ready rakhenge. Shukriya!';prev()};
   $('#tkSave').onclick=()=>{s.takeNo=$('#tkNo').value.trim()||s.takeNo;toast('Takeaway number saved',s.takeNo,{icon:'check',tone:'ok'});changed()};
   $('#tkMsgSave').onclick=()=>{const t=$('#tkMsg').value.trim();if(!t){toast('Message cannot be empty','The AI needs something to send',{icon:'alert',tone:'bad'});return}
     if(!t.includes('{number}'))toast('Saved without {number}','The takeaway number will not appear in the message',{icon:'alert',tone:'bad'});
     else toast('Message saved','The AI agent sends this from the next takeaway chat',{icon:'check',tone:'ok'});
     s.takeMsg=t;changed()};
  }
  if(setSec==='biz'){
   B.innerHTML=`<div class="card enter"><div class="card-h"><h3>${ic('store')}Business details</h3></div><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px"><label class="field"><span>Restaurant name</span><input class="tx" id="bzN" value="${esc(s.biz)}"></label><label class="field"><span>Phone</span><input class="tx" id="bzP" value="${esc(s.phone)}"></label><label class="field" style="grid-column:1/-1"><span>Address</span><input class="tx" id="bzA" value="${esc(s.addr)}"></label><label class="field"><span>Opens</span><input class="tx" id="bzO" type="time" value="${s.open}"></label><label class="field"><span>Closes</span><input class="tx" id="bzC" type="time" value="${s.close}"></label></div>
    <div class="muted" style="font-size:12.5px;margin-top:12px">Outside these hours the AI agent tells customers you are closed and when you open.</div><div style="margin-top:14px"><button class="btn pri" id="bzSave">Save changes</button></div></div>`;
   $('#bzSave').onclick=()=>{s.biz=$('#bzN').value;s.phone=$('#bzP').value;s.addr=$('#bzA').value;s.open=$('#bzO').value;s.close=$('#bzC').value;toast('Business details saved','',{icon:'check',tone:'ok'})};
  }
  if(setSec==='areas'){
   B.innerHTML=`<div class="card enter"><div class="card-h"><h3>${ic('pin')}Delivery areas & fees</h3><span class="dim sp" style="font-size:12.5px">Fee range Rs 150 – 230</span></div><p class="muted" style="margin:0 0 14px">The AI agent adds this fee to the bill based on the customer's area.</p><div class="area-list">${AREAS.map((a,i)=>`<label><span class="ell">${esc(a.name)}</span>Rs<input type="number" min="0" max="230" value="${a.fee}" data-ai="${i}" aria-label="Fee for ${esc(a.name)}"></label>`).join('')}</div><div style="margin-top:14px"><button class="btn pri" id="arSave">Save fees</button></div></div>`;
   $('#arSave').onclick=()=>{let bad=0;$$('[data-ai]').forEach(inp=>{const v=+inp.value;const ok=v>=0&&v<=230;inp.classList.toggle('err',!ok);if(ok)AREAS[+inp.dataset.ai].fee=v;else bad++});bad?toast('Some fees are above Rs 230','Fix the highlighted areas and save again',{icon:'alert',tone:'bad'}):toast('Delivery fees saved','New orders use the updated fees',{icon:'check',tone:'ok'})};
  }
  if(setSec==='users'){
   B.innerHTML=`<div class="card enter"><div class="card-h"><h3>${ic('users')}Users & logins</h3><button class="btn sm pri sp" id="uAdd">${ic('plus','sm')}Add user</button></div><p class="muted" style="margin:0 0 14px">Everyone signs in with their own login ID and password. A user only sees the sides of the CRM you tick for them. Turn a user off to block their login.</p>
    <div class="users">${S.users.map(u=>{const P=userPerms(u),R=ROLES[u.role]||ROLES.admin;
     return `<div class="urow"><div class="av sm ${avc(u.name)}">${ini(u.name)}</div>
      <div style="min-width:0"><b class="ell" style="display:block">${esc(u.name)}</b><span class="dim mono" style="font-size:12px">@${esc(u.login)}</span></div>
      <div style="min-width:0"><span class="role">${ic(R.ic)}${R.name}</span><div class="dim ell" style="font-size:11.5px;margin-top:3px">${P.length===PERMS.length?'All sections':`${P.length} of ${PERMS.length} sections`}</div></div>
      <div class="pw hide-m">${showPw.has(u.id)?esc(u.pass):'••••••••'}<button data-eye="${u.id}" aria-label="Show password">${ic(showPw.has(u.id)?'eyeoff':'eye','sm')}</button></div>
      <div class="uacts"><button class="btn sm ghost" data-rs="${u.id}">Reset</button><button class="btn sm ghost" data-ed="${u.id}">${ic('shield','sm')}Access</button></div>
      <button class="sw ${u.on?'on':''}" data-on="${u.id}" role="switch" aria-label="Active"></button>
      <button class="iconbtn" style="width:34px;height:34px" data-del="${u.id}" aria-label="Remove user" ${u.id==='u1'?'disabled':''}>${ic('trash','sm')}</button></div>`}).join('')}</div></div>
    <div class="card"><div class="card-h"><h3>${ic('shield')}What each role gets by default</h3></div><div class="roleseg">${Object.entries(ROLES).map(([id,r])=>`<button style="pointer-events:none">${ic(r.ic,'lg')}<b>${r.name}</b><small>${esc(r.note)}</small></button>`).join('')}</div>
     <p class="muted" style="font-size:12.5px;margin:14px 0 0">Pick a role when you add someone, then tick or untick individual sections for them — the role is only the starting point.</p></div>`;
   $$('[data-eye]').forEach(b=>b.onclick=()=>{const id=b.dataset.eye;showPw.has(id)?showPw.delete(id):showPw.add(id);this.body()});
   $$('[data-on]').forEach(b=>b.onclick=()=>{const u=S.users.find(x=>x.id===b.dataset.on);if(u.id==='u1')return toast('Owner stays active','You cannot switch off your own login',{icon:'lock'});u.on=!u.on;this.body()});
   $$('[data-del]').forEach(b=>b.onclick=()=>{const u=S.users.find(x=>x.id===b.dataset.del);confirmBox(`Remove ${u.name}?`,'They will no longer be able to sign in.','Remove',()=>{S.users=S.users.filter(x=>x!==u);this.body()},1)});
   $('#uAdd').onclick=()=>userForm(null,()=>this.body());
   $$('[data-ed]').forEach(b=>b.onclick=()=>userForm(S.users.find(x=>x.id===b.dataset.ed),()=>this.body(),'access'));
   $$('[data-rs]').forEach(b=>b.onclick=()=>userForm(S.users.find(x=>x.id===b.dataset.rs),()=>this.body(),'pass'));
  }
  if(setSec==='voice'){
   B.innerHTML=`<div class="card enter"><div class="card-h"><h3>${ic('sound')}Voice alerts</h3></div>
    <div class="srow"><div class="t"><b>Speak alerts out loud</b><small>A short chime plus a quick line, so the counter hears it without looking.</small></div><button class="sw ${s.voice?'on':''}" id="vOn" role="switch" aria-label="Voice on"></button></div>
    <div class="srow"><div class="t"><b>Language</b><small>Urdu lines are spoken in Roman Urdu with the closest voice your device has.</small></div><div class="seg"><button class="${s.lang==='en'?'on':''}" data-l="en">English</button><button class="${s.lang==='ur'?'on':''}" data-l="ur">Urdu</button></div></div>
    <div class="srow"><div class="t"><b>Voice</b><small id="vNote">Picks the most human-sounding voice your device has. The online &ldquo;Natural&rdquo; voices sound like a real person; the built-in offline ones do not.</small></div>
     <div class="row" style="gap:8px;flex-wrap:wrap"><select class="tx" id="vPick" style="width:auto;max-width:260px;height:38px" aria-label="Voice"></select><button class="btn sm" id="vTest">${ic('play','sm')}Hear it</button></div></div>
    <div class="srow"><div class="t"><b>Volume</b></div><input type="range" min="0" max="1" step=".05" value="${s.vol}" id="vVol" style="width:200px;accent-color:var(--or)" aria-label="Volume"></div></div>
    <div class="card"><div class="card-h"><h3>${ic('bell')}What to announce</h3><span class="dim sp" style="font-size:12.5px">Tap play to hear it</span></div><div class="vgrid">${Object.keys(VOICE_LABEL).map(key=>`<div><button class="iconbtn" style="width:34px;height:34px" data-play="${key}" aria-label="Play">${ic('play','sm')}</button><div class="grow" style="min-width:0"><b style="font-size:13px">${VOICE_LABEL[key]}</b><small>“${esc((VOICE_LINES[key][s.lang]||VOICE_LINES[key].en)[0])}”</small></div><button class="sw ${s.ev[key]?'on':''}" data-ev="${key}" role="switch" aria-label="${VOICE_LABEL[key]}"></button></div>`).join('')}</div></div>`;
   $('#vOn').onclick=()=>{s.voice=!s.voice;this.body();refreshChrome()};
   /* list the voices this device actually has, best first */
   const fillVoices=()=>{
     Voice.load();const sel=$('#vPick');if(!sel)return;
     const opts=Voice.options(s.lang);
     const best=opts[0];
     sel.innerHTML=`<option value="">Best available${best?` — ${esc(best.name)}`:''}</option>`+
       opts.map(v=>`<option value="${esc(v.name)}" ${s.voiceName===v.name?'selected':''}>${esc(v.name)} · ${esc(v.lang)}${V_NATURAL.test(v.name)?' ★':''}</option>`).join('');
     if(!opts.length){sel.innerHTML='<option value="">No voices installed</option>';sel.disabled=true}
     const n=$('#vNote');
     if(n&&opts.length&&!opts.some(v=>V_NATURAL.test(v.name)))
       n.innerHTML='Your device only has offline voices, which sound robotic. Install a Microsoft &ldquo;Natural&rdquo; or Google voice for your language and it will be picked automatically.';
   };
   fillVoices();
   try{speechSynthesis.onvoiceschanged=()=>{Voice.load();if(setSec==='voice')fillVoices()}}catch(e){}
   $('#vPick').onchange=e=>{s.voiceName=e.target.value;Voice.say('hello',true)};
   $('#vTest').onclick=()=>Voice.say('hello',true);
   $$('[data-l]').forEach(b=>b.onclick=()=>{s.lang=b.dataset.l;this.body();Voice.say('hello',true)});
   $('#vVol').oninput=e=>s.vol=+e.target.value;$('#vVol').onchange=()=>Voice.say('newOrder',true);
   $$('[data-ev]').forEach(b=>b.onclick=()=>{s.ev[b.dataset.ev]=!s.ev[b.dataset.ev];b.classList.toggle('on')});
   $$('[data-play]').forEach(b=>b.onclick=()=>Voice.say(b.dataset.play,true));
  }
  if(setSec==='demo'){
   B.innerHTML=`<div class="card enter"><div class="card-h"><h3>${ic('play')}Demo controls</h3><span class="tag t-new sp">Prototype only</span></div>
    <div class="srow"><div class="t"><b>Live simulation</b><small>New WhatsApp chats arrive every 25–40 seconds and riders mark deliveries on their own.</small></div><button class="sw ${s.sim?'on':''}" id="dSim" role="switch" aria-label="Simulation"></button></div>
    <div class="srow"><div class="t"><b>Send a test chat now</b><small>Pick what the customer wants.</small></div><div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm" data-nc="delivery">Delivery order</button><button class="btn sm" data-nc="takeaway">Takeaway</button><button class="btn sm" data-nc="human">Needs human</button></div></div></div>`;
   $('#dSim').onclick=e=>{s.sim=!s.sim;e.currentTarget.classList.toggle('on',s.sim)};
   $$('[data-nc]').forEach(b=>b.onclick=()=>{if(!s.wa)return toast('WhatsApp is disconnected','Reconnect it first',{icon:'unlink',tone:'bad'});newChat({kind:b.dataset.nc})});
  }
 }
};

/* ================= KITCHEN =================
   A ticket rail for the cooks. One job per card, oldest first, a timer that
   turns amber then red, and two buttons big enough for floury hands. On a
   phone it becomes a single column with the pass behind a tab. */
const struck=new Set();
let kTab='cook';
PAGES.kitchen={
 render(el){
  el.innerHTML=`<div class="kd" id="kd">
   <div class="kd-top" id="kstats"></div>
   <div class="mob-tabs" id="kmt">
     <button class="chip ${kTab==='cook'?'on':''}" data-kt="cook">Tickets <b id="kcn">0</b></button>
     <button class="chip ${kTab==='pass'?'on':''}" data-kt="pass">At the pass <b id="kpn">0</b></button></div>
   <div class="kd-grid">
    <div class="kcol" data-col="cook"><div class="tickets" id="tix"></div></div>
    <div class="kcol" data-col="pass"><div class="card"><div class="card-h"><h3>${ic('helmet')}At the pass</h3><span class="dim sp" style="font-size:12px">Ready, waiting for a rider</span></div><div class="pass" id="pass"></div></div></div>
   </div></div>`;
  $$('#kmt button',el).forEach(b=>b.onclick=()=>{kTab=b.dataset.kt;this.refresh()});
  /* one handler for the whole rail: tick an item off, start it, or send it out */
  $('#tix').onclick=e=>{
   const t=e.target.closest('[data-tk]');if(!t)return;
   const id=t.dataset.tk;
   const it=e.target.closest('[data-it]');
   const b=e.target.closest('[data-kx]');
   if(it){const key=id+':'+it.dataset.it;struck.has(key)?struck.delete(key):struck.add(key);it.classList.toggle('done');return}
   if(!b)return;
   if(b.dataset.kx==='start')A.start(id);
   else{t.classList.add('leaving');setTimeout(()=>A.ready(id),420)}
  };
  this.refresh();
 },
 refresh(){
  if(!$('#tix'))return;
  const q=S.orders.filter(o=>o.status==='approved'||o.status==='preparing').sort((a,b)=>a.t.approved-b.t.approved);
  const ready=byStatus('ready');
  const waiting=byStatus('new').length;
  const done=tonight().filter(o=>o.t.ready&&o.t.preparing);
  const avg=done.length?Math.round(done.reduce((a,o)=>a+(o.t.ready-o.t.preparing),0)/done.length/MIN)+' min':'—';
  const K=[['chef','To cook',q.filter(o=>o.status==='approved').length,''],
           ['flame','Cooking now',q.filter(o=>o.status==='preparing').length,'var(--or2)'],
           ['helmet','At the pass',ready.length,'var(--vio)'],
           ['clock','Average cook time',avg,'var(--ok)']];
  $('#kstats').innerHTML=K.map(x=>`<div class="kstat">${ic(x[0],'lg')}<div><b class="num" ${x[3]?`style="color:${x[3]}"`:''}>${x[2]}</b><span>${x[1]}</span></div></div>`).join('')
   +(waiting?`<button class="kwait" data-go="orders">${ic('alert','sm')}${waiting} order${waiting>1?'s':''} still waiting for approval${ic('chev','sm')}</button>`:'');
  const g=$('#kwait')||$('.kwait');if(g)g.onclick=()=>go('orders',{tab:'new'});
  $('#kcn').textContent=q.length;$('#kpn').textContent=ready.length;
  $$('#kmt button').forEach(b=>b.classList.toggle('on',b.dataset.kt===kTab));
  $$('.kcol').forEach(c=>c.classList.toggle('mon',c.dataset.col===kTab));

  const box=$('#tix');
  keepScroll(box,()=>{box.innerHTML=q.length?q.map(o=>{const c=S.cmap[o.cid];
   return `<div class="tk" data-k="tk${o.id}" data-tk="${o.id}">
    <div class="tk-h"><span class="id">${o.id}</span>
     <span class="st">${o.status==='preparing'?ic('flame','sm')+'Cooking':'New'}</span>
     <span class="tmr ${tmrCls(o.t.approved)}" data-since="${o.t.approved}" data-fmt="mmss">${mmss(o.t.approved)}</span></div>
    <div class="tk-m"><span>${esc(c.name.split(' ')[0])} · ${esc(o.area)}</span><span>In at ${t12(o.t.approved)}</span></div>
    ${o.note?`<div class="tk-note">${ic('alert','sm')}${esc(o.note)}</div>`:''}
    <div class="tk-items">${o.items.map((it,i)=>`<button data-it="${i}" class="${struck.has(o.id+':'+i)?'done':''}"><span class="q">${it.qty}×</span><span><span class="n">${esc(MM[it.mid].name)}</span>${it.note?`<br><span class="inote">${esc(it.note)}</span>`:''}</span></button>`).join('')}</div>
    <div class="tk-f">${o.status==='approved'?`<button class="btn b-start" data-kx="start">${ic('flame')}Start cooking</button>`:''}<button class="btn b-ready" data-kx="ready">${ic('check')}Ready</button></div></div>`}).join('')
   :`<div class="card empty" style="grid-column:1/-1;padding:56px 20px">${ic('chef')}<b style="color:var(--fg);font-size:16px">Kitchen is clear</b>Approved orders land here as tickets, oldest first.</div>`});

  $('#pass').innerHTML=ready.length?ready.map(o=>`<div class="oc" data-k="ps${o.id}"><div class="r1"><span class="id">${o.id}</span><span class="tm">${ic('clock','sm')}<span data-since="${o.t.ready}">${ago(o.t.ready)}</span></span></div><div class="nm">${esc(custName(o))} · <span class="dim">${esc(o.area)}</span></div><button class="btn sm pri" data-as="${o.id}">${ic('helmet','sm')}Assign rider</button></div>`).join(''):`<div class="empty">${ic('helmet')}Nothing at the pass.</div>`;
  $$('[data-as]',$('#pass')).forEach(b=>b.onclick=()=>riderPicker(b.dataset.as));
  settle($('#kd'));
 }
};

/* ================= COMING SOON ================= */
const soon=(title,lines)=>({render(el){el.innerHTML=`<div class="soon-wrap"><div class="soon-bg">${'<div></div>'.repeat(8)}</div><div class="soon-c"><span class="badge">Coming soon</span><h2>${title}</h2><p>We're cooking this one. Here is what it will do:</p><ul>${lines.map(l=>`<li>${ic('check','sm')}${l}</li>`).join('')}</ul><button class="btn" id="soonBack">${ic('back','sm')}Back to dashboard</button></div></div>`;$('#soonBack').onclick=()=>go('dash')}});
PAGES.bulk=soon('Bulk Message',['Write one offer and send it to a whole group of customers at once','Pick who gets it: regulars, VIPs, a single area, or everyone who has gone quiet','A live preview of exactly how it lands on their phone','Replies come straight back into Live Conversations as new chats','See how many were sent, how many replied, and what each campaign earned']);
PAGES.reports=soon('Payments & Reports',['Cash, EasyPaisa, JazzCash and bank transfer totals by night','Rider cash hand-in history, and what each rider still owes','Works out every rider&rsquo;s daily wages automatically from the deliveries he ran','Best sellers, peak hours and area reports','Download reports as PDF or Excel']);
PAGES.promos=soon('Promotions & Offers',['Create deals like the Family Platter','Discount codes the AI agent understands','Schedule offers for weekends and Eid','See how many orders each deal brought in']);

/* ================= global search ================= */
function searchAll(q){
  q=q.trim().toLowerCase();const box=$('#srchRes');if(!q){box.hidden=true;return}
  const os=S.orders.filter(o=>o.id.toLowerCase().includes(q)||custName(o).toLowerCase().includes(q)).sort((a,b)=>b.t.placed-a.t.placed).slice(0,5);
  const cs=S.customers.filter(c=>c.name.toLowerCase().includes(q)||c.phone.replace(/\s/g,'').includes(q.replace(/\s/g,''))).slice(0,5);
  box.className='srch-res';box.hidden=false;
  box.innerHTML=(os.length?`<div class="h">Orders</div>${os.map(o=>`<button data-so="${o.id}"><span class="mono" style="color:var(--or2)">${o.id}</span><span class="grow ell">${esc(custName(o))} <small>· ${dshort(o.t.placed)}</small></span>${stTag(o.status)}</button>`).join('')}`:'')+(cs.length?`<div class="h">Customers</div>${cs.map(c=>`<button data-sc="${c.id}"><div class="av sm ${avc(c.name)}">${ini(c.name)}</div><span class="grow ell">${esc(c.name)} <small>· ${c.phone}</small></span></button>`).join('')}`:'')||`<div class="empty">${ic('search')}Nothing found for “${esc(q)}”.</div>`;
  $$('[data-so]',box).forEach(b=>b.onmousedown=()=>{orderDrawer(b.dataset.so);box.hidden=true});
  $$('[data-sc]',box).forEach(b=>b.onmousedown=()=>{go('customers',{cust:b.dataset.sc,force:cur==='customers'});box.hidden=true});
}

/* ================= login + boot ================= */
function embers(){
  const cv=$('#embers');if(!cv)return;const x=cv.getContext('2d');let W,H,P=[];const dpr=Math.min(2,devicePixelRatio||1);
  const rs_=()=>{W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0)};rs_();addEventListener('resize',rs_);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(let i=0;i<46;i++)P.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2.2+.6,v:Math.random()*.35+.12,s:Math.random()*Math.PI*2,a:Math.random()*.5+.25});
  const f=()=>{if(!$('#embers')||$('#login').classList.contains('out'))return;x.clearRect(0,0,W,H);P.forEach(p=>{if(!reduce){p.y-=p.v;p.s+=.012;p.x+=Math.sin(p.s)*.25}if(p.y<-10){p.y=H+10;p.x=Math.random()*W}const g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);g.addColorStop(0,`rgba(255,160,80,${p.a})`);g.addColorStop(1,'rgba(244,123,32,0)');x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,p.r*4,0,7);x.fill()});requestAnimationFrame(f)};f();
}
function boot(){
  buildNav();embers();Theme.apply();Side.apply();Install.init();Reveal.init();
  addEventListener('load',()=>Smooth.init());
  $('#themeBtn').onclick=()=>Theme.toggle();
  /* the whole dashboard goes full screen on a double-click of the brand mark */
  $('#brandBtn').ondblclick=()=>toggleFull();
  $('#brandBtn').onclick=e=>{if(e.detail>1)return;go('dash')};
  $('#lgEye').onclick=()=>{const p=$('#lgPw');p.type=p.type==='password'?'text':'password';$('#lgEye').innerHTML=ic(p.type==='password'?'eye':'eyeoff')};
  $('#lgRem').onclick=e=>e.currentTarget.classList.toggle('on');
  let started=false;
  $('#lgForm').onsubmit=e=>{e.preventDefault();Voice.unlock();const b=$('#lgBtn');b.classList.add('busy');b.innerHTML='Signing in…';
    /* whoever signs in decides what the nav shows and where they land */
    const id=$('#lgId').value.trim().toLowerCase();
    S.me=S.users.find(x=>x.login===id&&x.on)||S.users[0];
    const name=S.me.name;
    $('#meName').textContent=name.split(' ')[0];$('#meAv').textContent=ini(name);
    setTimeout(()=>{$('#login').classList.add('out');$('#app').classList.add('on');
      applyRole();
      if(!isRider())setTimeout(()=>Voice.say('hello',true),500);
      if(!started){started=true;simStart()}},900)};
  $('#logout').onclick=()=>{$('#login').classList.remove('out');$('#app').classList.remove('on');const b=$('#lgBtn');b.classList.remove('busy');b.innerHTML='Sign in '+ic('chev');embers()};
  /* one button: opens the drawer on a phone, collapses the rail on a desktop */
  $('#burger').onclick=()=>{if(innerWidth<=1024)toggleSide(true);else Side.toggle()};
  addEventListener('resize',()=>Side.apply());
  $('#scrim').onclick=()=>{toggleSide(false);closeDrawer()};
  $('#bellBtn').onclick=e=>{e.stopPropagation();const np=$('#np');np.classList.toggle('on');if(np.classList.contains('on'))renderNP()};
  $('#npRead').onclick=()=>{S.notifs.forEach(n=>n.read=true);renderNP();refreshChrome()};
  $('#npPop').onclick=()=>{S.set.pop=!S.set.pop;refreshChrome();
    if(!S.set.pop){clearToasts();toast('Pop-ups off','Alerts stay in this panel and on the bell',{icon:'bell',ms:2600})}
    else toast('Pop-ups on','Alerts appear on screen again',{icon:'bell',tone:'ok',ms:2600})};
  document.addEventListener('click',e=>{if(!e.target.closest('#np')&&!e.target.closest('#bellBtn'))closeNP();if(!e.target.closest('#srch')&&!e.target.closest('#sBtn')){$('#srchRes').hidden=true;$('#srch').classList.remove('m')}});
  $('#voiceBtn').onclick=()=>{S.set.voice=!S.set.voice;Voice.unlock();refreshChrome();toast(S.set.voice?'Voice alerts on':'Voice alerts muted',S.set.voice?'You will hear new chats, orders and kitchen alerts':'Chimes and voice are off',{icon:S.set.voice?'sound':'mute'});if(S.set.voice)Voice.say('hello',true)};
  $('#waPill').onclick=()=>go('settings',{sec:'wa',force:true});
  $('#srchIn').oninput=e=>searchAll(e.target.value);$('#srchIn').onfocus=e=>searchAll(e.target.value);
  $('#sBtn').onclick=()=>{$('#srch').classList.add('m');$('#srchIn').focus()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeDrawer();closeNP();toggleSide(false)}});
  $('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
}
boot();

