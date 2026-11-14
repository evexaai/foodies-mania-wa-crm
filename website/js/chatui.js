"use strict";
/* ================= a chat window, drawn the same way in the widget and the chat page =================
   ChatUI({log,quick,form,input,agent,key,intro?,extra?,onTyping?,onBot?}) wires a transcript to an Agent.
   extra(msg) may return HTML to add inside a message (the chat page's receipt).
   Messages are kept in localStorage under `key`, so a reload keeps the chat.
   intro() returns HTML drawn above the messages; anything in it (or in a
   message) with data-send="text" sends that text when tapped.

   Every line, the customer's and the agent's, is also sent to /api/chat, so
   the counter can read the conversation while it is happening. If somebody
   there answers, their reply arrives through the same endpoint and the agent
   goes quiet: from then on the customer is talking to a person, until the
   counter hands it back.                                                    */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* chat formatting: *bold*, _italic_, line breaks */
const fmt=s=>esc(s).replace(/\*([^*\n]+)\*/g,'<b>$1</b>').replace(/(^|[\s(])_([^_\n]+)_/g,'$1<i>$2</i>').replace(/\n/g,'<br>');
const hhmm=ts=>{const d=new Date(ts);let h=d.getHours();const m=String(d.getMinutes()).padStart(2,'0');const ap=h>=12?'pm':'am';h=h%12||12;return h+':'+m+' '+ap};

function ChatUI(o){
  const {log,quick,form,input,agent,key}=o;
  let msgs=[];try{msgs=JSON.parse(localStorage.getItem(key))||[]}catch{}
  let busy=false,queue=Promise.resolve();
  const save=()=>{try{localStorage.setItem(key,JSON.stringify(msgs.slice(-80)))}catch{}};
  const atBottom=()=>log.scrollHeight-log.scrollTop-log.clientHeight<80;
  const toBottom=(smooth=true)=>log.scrollTo({top:log.scrollHeight,behavior:smooth?'smooth':'auto'});

  function itemsHtml(ids){
    return `<div class="mc-row">${ids.map(id=>{const it=FM_BYID[id];if(!it)return '';
      return `<div class="mc"><img src="${fmImg(it.img,'-s')}" alt="" loading="lazy" decoding="async"><div class="mc-b"><b>${esc(it.name)}</b><small>${it.sizes?'from ':''}${fmRs(it.price)}</small><button data-add="${id}">Add</button></div></div>`}).join('')}</div>`}
  function bubble(m,anim){
    const el=document.createElement('div');
    const who=m.who==='staff'?'bot staff':m.who;
    el.className=`msg ${who}${m.summary?' sum':''}${anim?' pop':''}`;
    el.innerHTML=`${m.who==='staff'?'<span class="wholbl">Foodies Mania</span>':''}${m.text?`<div class="bt">${fmt(m.text)}</div>`:''}${m.items?itemsHtml(m.items):''}${o.extra?o.extra(m):''}${m.order?`<a class="ord-link" href="index.html#track=${m.order}">See order ${esc(m.order)} →</a>`:''}<span class="ts">${hhmm(m.t)}</span>`;
    return el}
  function draw(){
    log.innerHTML='';
    if(o.intro){const d=document.createElement('div');d.className='intro';d.innerHTML=o.intro();log.appendChild(d)}
    msgs.forEach(m=>log.appendChild(bubble(m)));
    drawQuick((msgs.filter(m=>m.who==='bot').pop()||{}).quick);toBottom(false)}
  function drawQuick(q){quick.innerHTML=(q||[]).map(x=>`<button type="button">${esc(x)}</button>`).join('');quick.hidden=!q||!q.length}
  function typing(on){let t=log.querySelector('.typing');
    if(on&&!t){t=document.createElement('div');t.className='msg bot typing';t.innerHTML='<i></i><i></i><i></i>';log.appendChild(t);toBottom()}
    if(!on&&t)t.remove();o.onTyping&&o.onTyping(on)}
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  /* bot messages arrive one by one, with a short "typing…" before each */
  function botSay(list){
    queue=queue.then(async()=>{
      for(const m of list){
        typing(true);await wait(Math.min(1300,420+(m.text||'').length*6));typing(false);
        const msg={...m,who:'bot',t:Date.now()};msgs.push(msg);save();Live.copy(msg);
        const stick=atBottom();log.appendChild(bubble(msg,true));if(stick)toBottom();else toBottom();
        o.onBot&&o.onBot(msg);
      }
      drawQuick(list[list.length-1].quick);
    });return queue}
  function send(text){
    text=String(text).trim();if(!text)return;
    const m={who:'me',text,t:Date.now()};msgs.push(m);save();log.appendChild(bubble(m,true));toBottom();drawQuick(null);
    Live.copy(m);
    /* somebody at the counter is answering: the agent keeps out of it */
    if(Live.taken()){Live.pull();return}
    const out=agent.reply(text);botSay(out)}

  /* ---------- the carbon copy to the counter ----------
     Sending is fire and forget: a chat that cannot reach the server still
     works exactly as it did, it is simply not being read at the counter. */
  const Live={
    device:(typeof Bridge!=='undefined'&&Bridge.device)||'',
    channel:o.channel||'bubble',
    after:0, staff:'', live:true, timer:null,
    me(){try{return JSON.parse(localStorage.getItem('fm.me')||'{}')}catch{return {}}},
    copy(m){
      if(!this.live||!this.device||m.who==='staff'||!m.text)return;
      const who=this.me();
      fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},
        body:JSON.stringify({device:this.device,who:m.who==='me'?'me':'bot',text:m.text,
          channel:this.channel,phone:who.phone||'',name:who.name||''})})
        .then(r=>{if(r.status===503)this.live=false})
        .catch(()=>{});
    },
    async pull(){
      if(!this.live||!this.device)return;
      try{
        const r=await fetch(`/api/chat?device=${encodeURIComponent(this.device)}&after=${this.after}`,{headers:{accept:'application/json'}});
        if(r.status===503){this.live=false;return}
        if(!r.ok)return;
        const d=await r.json();
        this.staff=d.staff||'';
        (d.msgs||[]).forEach(m=>{
          this.after=Math.max(this.after,m.id);
          /* only a person's reply is news: this chat said the rest itself */
          if(m.who!=='staff')return;
          if(msgs.some(x=>x.sid===m.id))return;
          const msg={who:'staff',text:m.text,t:new Date(m.at).getTime()||Date.now(),sid:m.id};
          msgs.push(msg);save();
          const stick=atBottom();log.appendChild(bubble(msg,true));if(stick)toBottom();
          drawQuick(null);
        });
      }catch{}
    },
    /* the first pull only notes where the conversation has got to, so a
       reload does not replay replies the page has already shown */
    async init(){
      if(!this.device)return;
      const seen=msgs.reduce((a,m)=>Math.max(a,m.sid||0),0);
      this.after=seen;
      if(!seen){
        try{
          const r=await fetch(`/api/chat?device=${encodeURIComponent(this.device)}&after=0`,{headers:{accept:'application/json'}});
          if(r.status===503){this.live=false;return}
          const d=await r.json();
          this.after=(d.msgs||[]).reduce((a,m)=>Math.max(a,m.id),0);
          this.staff=d.staff||'';
        }catch{}
      }
      clearInterval(this.timer);
      this.timer=setInterval(()=>{if(document.visibilityState==='visible')this.pull()},5000);
      addEventListener('visibilitychange',()=>this.pull());
    },
    taken(){return !!this.staff}
  };
  Live.init();

  form.addEventListener('submit',e=>{e.preventDefault();const v=input.value;input.value='';send(v);input.focus()});
  quick.addEventListener('click',e=>{const b=e.target.closest('button');if(b)send(b.textContent)});
  log.addEventListener('click',e=>{const s=e.target.closest('[data-send]');if(s)return send(s.dataset.send);
    const b=e.target.closest('[data-add]');if(!b)return;const it=FM_BYID[b.dataset.add];send('1 '+it.name)});
  agent.onPush=list=>botSay(list);

  draw();
  return {
    start(){if(!msgs.length)botSay(agent.greet())},
    send,
    reset(){msgs=[];save();try{localStorage.removeItem(agent.key)}catch{};Object.assign(agent,new Agent(agent.channel));agent.onPush=l=>botSay(l);draw();botSay(agent.greet())},
    redraw:draw
  };
}
