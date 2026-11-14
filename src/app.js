/* =========================================================
   APP — Lớp Vật lí 9
   Dữ liệu: TOPICS, WHO, LIB, PLAN, EXT, MORE, PHASES, NOTES, PAPERS (từ bản kế hoạch)
            QA, QUIZ (ngân hàng hỏi đáp + trắc nghiệm)
========================================================= */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const KEY='vnl9.v2';

/* ---------- schedule ---------- */
const SCHEDULE=(()=>{
  const order=[PLAN[0],PLAN[1],PLAN[2],PLAN[3],EXT[0],EXT[1],PLAN[6],PLAN[4],PLAN[5],MORE[0],MORE[1],MORE[2],MORE[3]];
  order.forEach((d,i)=>{ d.n=i+1; d.phase=i<=6?'I':i<=8?'II':i<=10?'III':'IV'; });
  return order;
})();
const DAYS=SCHEDULE;
const TOTAL_SESS=DAYS.reduce((a,d)=>a+d.sessions.length,0);
const VID_COUNT=Object.keys(LIB).length;
const sid=(d,s)=>`d${d}s${s}`;

/* ---------- state ---------- */
const loadState=()=>{
  let got={data:null,from:'trống'};
  try{ got = (typeof AppStore!=='undefined') ? AppStore.readSync() : {data:null,from:'trống'}; }catch(e){}
  const s=got.data||{};
  const st={
            done:s.done||{},watched:s.watched||{},ans:s.ans||{},mine:s.mine||[],
            note:s.note||{},runs:s.runs||[],days:s.days||{},calc:s.calc||null,book:s.book||[],sheet:s.sheet||null,
            music:s.music||null,pomo:s.pomo||null,build:s.build||null,lab:s.lab||null,cir:s.cir||null,sim:s.sim||null,school:s.school||null,
            pane:s.pane||'learn',last:s.last||null,exam:s.exam||null,goal:s.goal||20,doneAt:s.doneAt||{},
            prefs:s.prefs||{},pomoCfg:s.pomoCfg||{},seenWelcome:s.seenWelcome||0};
  st.__from=got.from; st.__partial=!!got.partial;
  return st;
};
let state=loadState();
const save=()=>{
  try{
    if(typeof AppStore!=='undefined'){ AppStore.write(state); AppStore.remember(state); }
    else localStorage.setItem(KEY,JSON.stringify(state));
  }catch(e){ try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e2){} }
};

/* ---------- text utils ---------- */
const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const STOP=new Set(('la gi the nao tai sao vi sao co khong khi cua va cho voi de mot nhung thi ma neu muon hoi tinh duoc ra sao bao nhieu giua tren duoi nay do nhu the nao cung mot vai ').split(' '));
const toks=s=>norm(s).split(' ').filter(w=>w.length>1&&!STOP.has(w));

const dkey=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function activity(n=1){ const k=dkey(); state.days[k]=(state.days[k]||0)+n; save(); }
function streak(){
  let s=0, d=new Date();
  if(!state.days[dkey(d)]) d.setDate(d.getDate()-1);
  while(state.days[dkey(d)]){ s++; d.setDate(d.getDate()-1); }
  return s;
}
const doneCount=()=>DAYS.reduce((a,d)=>a+d.sessions.filter(s=>state.done[sid(d.n,s.n)]).length,0);
const dayDone=d=>d.sessions.filter(s=>state.done[sid(d.n,s.n)]).length;
const watchedCount=()=>Object.keys(state.watched||{}).length;

/* ---------- ui helpers ---------- */
function toast(msg){
  let t=$('.toast');
  if(!t){t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');document.body.appendChild(t);}
  t.textContent=msg; t.classList.add('on');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('on'),1900);
}
/* Thoát ký tự cho HTML — dùng được cả trong nội dung lẫn trong thuộc tính
   (data-*, value="…", aria-label="…"). Thiếu `"` và `'` thì mọi tên do người
   dùng gõ mà có dấu nháy sẽ làm vỡ thuộc tính và hiện ra rỗng. */
const esc=s=>String(s==null?'':s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function go(hash){ if(location.hash===hash){render();} else location.hash=hash; }
const sessionHref=(d,s)=>`#/lesson/${d}/${s}`;

/* ---------- teacher labels ---------- */
const whoName=k=>WHO[k]||k;
const shortWho=k=>({VNA:'VNA',ĐVĐ:'ĐVĐ',NHL:'NHL',VTA:'VTA',PQT:'PQT',TS:'TS',HT:'HT',K:'K'})[k]||k;

/* =========================================================
   SEARCH
========================================================= */
function searchAll(q){
  const k=toks(q); if(!k.length) return [];
  const hit=(txt)=>{const t=norm(txt);return k.every(w=>t.includes(w));};
  const score=(txt)=>{const t=norm(txt);let s=0;k.forEach(w=>{if(t.includes(w))s++;});return s;};
  const out=[];
  DAYS.forEach(d=>d.sessions.forEach(s=>{
    if(hit(s.title+' '+s.obj+' '+d.title)) out.push({g:'Bài học',t:s.title,d:`Ngày ${String(d.n).padStart(2,'0')} · Ca ${s.n}`,href:sessionHref(d.n,s.n),sc:score(s.title+' '+s.obj)*2});
  }));
  Object.entries(LIB).forEach(([id,v])=>{
    if(hit(v.t+' '+(WHO[v.who]||''))) out.push({g:'Bài giảng',t:v.t,d:v.d,href:'#/vid/'+id,sc:score(v.t)});
  });
  QA.forEach((x,i)=>{
    if(hit(x.q+' '+x.k)) out.push({g:'Hỏi đáp',t:x.q,d:'',href:'#/qa?q='+encodeURIComponent(x.q),sc:score(x.q)*1.5});
  });
  NOTES.forEach(n=>n.rows.forEach(([a,b])=>{
    if(hit(a+' '+b.replace(/<[^>]+>/g,' '))) out.push({g:'Công thức',t:a,d:b.replace(/<[^>]+>/g,''),href:'#/notes?q='+encodeURIComponent(a),sc:score(a)});
  }));
  return out.sort((a,b)=>b.sc-a.sc).slice(0,14);
}

/* =========================================================
   Q&A ENGINE
========================================================= */
const QA_IDX=QA.map(x=>({x,set:new Set(norm(x.q+' '+x.k).split(' '))}));
const QA_DF=(()=>{const d={};QA_IDX.forEach(o=>o.set.forEach(w=>d[w]=(d[w]||0)+1));return d;})();

function askQA(query, topic){
  const raw=toks(query);
  if(!raw.length) return [];
  // bỏ những từ quá phổ biến (xuất hiện ở >22% câu) để tránh khớp rác
  const rare=raw.filter(w=>!QA_DF[w]||QA_DF[w]<=QA.length*0.22);
  const use=rare.length?rare:raw;
  const qn=norm(query);
  const scored=QA_IDX.map(o=>{
    let hit=0;
    use.forEach(w=>{ if(o.set.has(w)) hit++; });
    const frac=hit/use.length;
    if(!hit) return {x:o.x,s:-1};
    let s=frac*10+hit*0.4;
    if(topic&&o.x.t===topic) s+=0.9;
    if(qn.length>3&&norm(o.x.q).includes(qn)) s+=6;
    return {x:o.x,s,frac};
  }).filter(o=>o.s>=0&&o.frac>=0.5).sort((a,b)=>b.s-a.s);
  return scored.slice(0,3).map(o=>o.x);
}
const qaOfTopic=t=>QA.filter(x=>x.t===t);

/* =========================================================
   RENDER — SHELL
========================================================= */
function renderTop(){
  const dc=doneCount();
  $('#top').innerHTML=`
    <div class="topbar-in">
      <button class="menu-btn" id="menuBtn" aria-label="${tl('more')}" aria-expanded="false">☰</button>
      <a class="brand" href="${(typeof prefs==='function'&&prefs().start)||'#/'}" aria-label="${BRAND.name}">
        <span class="brand-mk" aria-hidden="true">${GM_SPRITE_MARK}</span>
        <span class="brand-tx"><b>${BRAND.name}</b><span>${tl('brand_sub')}</span></span>
      </a>
      <span class="grow"></span>
      <button class="tb-ico" id="openSettingsM" aria-label="Tuỳ biến" title="Tuỳ biến giao diện">
        <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="2.4"/><path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1"/></svg>
      </button>
      <button class="tb-ico" id="openSearchM" aria-label="Tìm kiếm">
        <svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5 14 14"/></svg>
      </button>
      <a class="scope-chip" href="#/subjects" title="Đổi lớp và môn">
        <b>Lớp ${schoolState().grade}</b><span>${(SUBJECTS.find(x => x.id === schoolState().subj) || { name: 'Vật lí' }).name}</span>
      </a>
      <a class="tb-phys" href="#/physics" aria-label="${tl('nav_physics')}" title="${tl('nav_physics')}">
        <b>${tl('nav_physics')}</b><span>${dc}/${TOTAL_SESS}</span>
      </a>
      <button class="tb-btn" data-nav="#/calc">${tl('btn_calc')}</button>
      <button class="tb-btn" data-nav="#/sim">${tl('btn_sim')}</button>
      <button class="tb-btn" data-nav="#/exam">${tl('btn_exam')}</button>
      <a class="tb-gear" href="#/settings" aria-label="${tl('nav_settings')}" title="${tl('nav_settings')}">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="2.4"/><path d="M8 1.6v1.6M8 12.8v1.6M1.6 8h1.6M12.8 8h1.6M3.5 3.5l1.1 1.1M11.4 11.4l1.1 1.1M12.5 3.5l-1.1 1.1M4.6 11.4l-1.1 1.1"/></svg>
      </a>
      <a class="tb-key" href="#/discover" aria-label="${tl('nav_discover')}">${tl('more')} ▾</a>
      <span class="tb-more">
        <button class="tb-btn" id="tbMoreBtn" aria-expanded="false" aria-controls="tbMenu" aria-haspopup="true">${tl('more')} ▾</button>
        <span class="tb-menu" id="tbMenu" role="menu" aria-label="${tl('more')}">${typeof explMenuBody === 'function' ? explMenuBody() : ''}</span>
      </span>
      <button class="tb-search" id="openSearch">
        <svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5 14 14"/></svg>
        <span>${tl('search_ph')}</span><kbd>⌘K</kbd>
      </button>
      <a class="tb-owner" href="#/about" title="${tl('nav_about')} · @its.fox_">@its.fox_</a>
      <span class="kicker" style="white-space:nowrap">${String(dc).padStart(2,'0')} / ${TOTAL_SESS}</span>
    </div>`;
  $('#menuBtn').onclick=()=>{
    const on=$('#rail').classList.toggle('open');
    $('#backdrop').classList.toggle('on',on);
  };
  $('#backdrop').onclick=closeRail;
  $$('[data-nav]').forEach(b=>b.onclick=()=>{go(b.dataset.nav);closeRail();});
  $('#openSearch').onclick=openSearchOverlay;
  const gear=$('#openSettings');
  if(gear) gear.onclick=()=>go('#/settings');
  bindExploreMenu();
  const gearM=$('#openSettingsM');
  if(gearM) gearM.onclick=()=>{go('#/settings');closeRail();};
  $('#openSearchM').onclick=openSearchOverlay;
}

/* Khám phá — popup trên thanh trên.
   Trước đây mỗi lần đổi trang lại gắn thêm một listener 'click' vào document
   mà không bao giờ gỡ, nên sau N trang có N listener chạy mãi. Giờ chỉ gắn
   một lần; phần tử được thay bằng innerHTML nên gắn lại cũng vô hại. */
let explMenuOff = null;
function bindExploreMenu() {
  const mb = $('#tbMoreBtn'), mm = $('#tbMenu');
  if (!mb || !mm) return;
  const setOpen = on => {
    mm.classList.toggle('on', on);
    mb.setAttribute('aria-expanded', String(on));
  };
  const isOpen = () => mm.classList.contains('on');
  if (explMenuOff) explMenuOff();
  mb.onclick = e => { e.stopPropagation(); setOpen(!isOpen()); };
  const onDoc = ev => { if (isOpen() && !mm.contains(ev.target) && ev.target !== mb) setOpen(false); };
  const onKey = ev => {
    if (ev.key === 'Escape' && isOpen()) { setOpen(false); mb.focus(); }
  };
  document.addEventListener('click', onDoc);
  document.addEventListener('keydown', onKey);
  explMenuOff = () => {
    document.removeEventListener('click', onDoc);
    document.removeEventListener('keydown', onKey);
    explMenuOff = null;
  };
  /* Chọn một mục thì ĐI TỚI ĐÓ rồi mới đóng.
     Bản cũ chỉ đóng menu: handler đóng được gán sau handler điều hướng nên ghi
     đè nó, và vì <a> không có href nên trình duyệt cũng không tự chuyển trang.
     Kết quả: bấm mục nào cũng chỉ làm menu biến mất — không đi đâu cả. */
  $$('#tbMenu [data-nav]').forEach(a => {
    a.onclick = ev => {
      ev.preventDefault();
      setOpen(false);
      closeRail();
      go(a.dataset.nav);
    };
    a.onkeydown = ev => {
      const rows = $$('#tbMenu [data-nav]');
      const i = rows.indexOf(a);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        const next = ev.key === 'ArrowDown' ? (i + 1) % rows.length : (i - 1 + rows.length) % rows.length;
        rows[next].focus();
      } else if (ev.key === 'Home') { ev.preventDefault(); rows[0].focus(); }
      else if (ev.key === 'End') { ev.preventDefault(); rows[rows.length - 1].focus(); }
    };
  });
}

/* thanh trên + rail đọc lại lớp/môn đang chọn sau khi trang đổi phạm vi */
function syncScope(){ try{ renderTop(); renderRail(); }catch(e){} }

function closeRail(){
  $('#rail').classList.remove('open');
  const b=$('#backdrop'); if(b) b.classList.remove('on');
}
function renderRail(){
  const byPhase={I:[],II:[],III:[],IV:[]};
  DAYS.forEach(d=>byPhase[d.phase].push(d));
  const dc=doneCount();
  const sch=(state.school||{}), sg=sch.grade||9, ss=sch.subj||'vatli';
  const sObj=(typeof SUBJECTS!=='undefined'&&SUBJECTS.find(x=>x.id===ss))||{name:'Vật lí'};
  const h0=location.hash||'';
  const onS=h0.startsWith('#/subjects')||h0.startsWith('#/subject/')||h0.startsWith('#/read/');
  const mineN=(typeof allLessons==='function')?allLessons().filter(l=>l.own).length:0;
  $('#rail').innerHTML=`
    ${(typeof prefs !== 'function' || prefs().railStart !== false) ? `<div class="rail-phys${h0.startsWith('#/physics')||h0==='#/'||h0===''||h0.startsWith('#/day/')||h0.startsWith('#/lesson/')?' on':''}">
      <a class="rp-main" href="#/physics">
        <span class="rp-k">${tl('nav_physics')}</span>
        <b>Vật lí 9 · ${dc}/${TOTAL_SESS} ca</b>
        <span class="rp-bar"><i style="width:${TOTAL_SESS?Math.round(dc/TOTAL_SESS*100):0}%"></i></span>
      </a>
      <div class="rp-links">
        <a href="#/" class="${h0==='#/'||h0===''?'on':''}">Lộ trình 13 ngày</a>
        <a href="#/calc">Máy giải</a>
        <a href="#/build">Bảng mạch</a>
        <a href="#/lab">Thí nghiệm</a>
      </div>
    </div>` : ''}
    <div class="rail-study">
      <a href="#/study" class="rs-main${h0.startsWith('#/study')?' on':''}"><b>${tl('nav_study')}</b><span>${tl('rail_today_sub')}</span></a>
      <div class="rs-links">
        <a href="#/cards" class="${h0.startsWith('#/cards')?'on':''}">${tl('nav_cards')}${(typeof syDue==='function'&&syDue().length)?'<i>'+syDue().length+'</i>':''}</a>
        <a href="#/practice" class="${h0.startsWith('#/practice')?'on':''}">${tl('nav_practice')}</a>
        <a href="#/plan" class="${h0.startsWith('#/plan')&&!h0.startsWith('#/weekly')?'on':''}">${tl('rail_plan')}</a>
        <a href="#/weekly" class="${h0.startsWith('#/weekly')?'on':''}">${tl('rail_week')}</a>
        <a href="#/grades" class="${h0.startsWith('#/grades')?'on':''}">${tl('nav_grades')}</a>
        <a href="#/focus" class="${h0.startsWith('#/focus')?'on':''}">${tl('rail_focus')}</a>
        <a href="#/timetable" class="${h0.startsWith('#/timetable')?'on':''}">${tl('rail_week_short')}</a>
        <a href="#/calendar" class="${h0.startsWith('#/calendar')?'on':''}">${tl('rail_cal')}</a>
        <a href="#/progress" class="${h0.startsWith('#/progress')?'on':''}">${tl('rail_progress')}</a>
      </div>
    </div>
    <div class="rail-school">
      <a class="rs-scope${onS?' on':''}" href="#/subjects" title="Đổi lớp, đổi môn">
        <b>Lớp ${sg} · ${esc(sObj.name)}</b><span>Chạm để đổi lớp &amp; môn</span>
      </a>
      <div class="rs-links">
        <a href="#/subjects" class="${onS?'on':''}">${tl('nav_subjects')}</a>
        <a href="#/studio" class="${h0.startsWith('#/studio')?'on':''}">Tạo bài học</a>
        <a href="#/mine" class="${h0.startsWith('#/mine')?'on':''}">Bài của tôi${mineN?'<i>'+mineN+'</i>':''}</a>
        <a href="#/files" class="${h0.startsWith('#/files')?'on':''}">Kho tệp</a>
      </div>
    </div>
    <div class="rail-h">Lộ trình Vật lí 9 · 13 ngày</div>
    ${['I','II','III','IV'].map(p=>`
      <div class="rail-phase">${PHASES[p].t}</div>
      ${byPhase[p].map(d=>{
        const on=(location.hash||'').startsWith(`#/day/${d.n}`)||(location.hash||'').startsWith(`#/lesson/${d.n}/`);
        const k=dayDone(d);
        return `<a class="rail-link${on?' on':''}" href="#/day/${d.n}">
          <span class="n">${String(d.n).padStart(2,'0')}</span>
          <span class="t">${d.title}<i>${k}/4 ca${k===4?' · xong':''}</i></span>
        </a>`;
      }).join('')}
    `).join('')}
    <div class="rail-prog">
      <div class="kicker">Tiến độ ${dc}/${TOTAL_SESS} ca</div>
      <div class="bar"><i style="width:${TOTAL_SESS?dc/TOTAL_SESS*100:0}%"></i></div>
    </div>
    <div class="rail-nav">
      <a href="#/discover"><b>Khám phá · mọi lối vào</b></a>
      <a href="#/study">Học hôm nay</a>
      <a href="#/subjects">Khoá học lớp 1–12</a>
      <a href="#/physics">Mục Vật lí</a>
      <a href="#/exam">Thi thử 15 câu</a>
      <a href="#/settings"><b>Tuỳ biến giao diện &amp; pomodoro</b></a>
    </div>`;
  $$('#rail a').forEach(a=>a.addEventListener('click',closeRail));
}

/* =========================================================
   RENDER — HOME
========================================================= */
function renderHome(){
  const dc=doneCount();
  /* "Học tiếp" phải trỏ về chỗ bạn vừa rời đi, không phải ca trống đầu tiên.
     Trước đây mở ca 5 cần mua, đóng tab, mở lại thì nút đưa về ca 1 — người
     dùng mất chỗ đang học, đúng lúc họ muốn tiếp tục nhất. state.last đã được
     ghi mỗi lần vào ca nhưng không ai đọc. */
  let next=null;
  const last=state.last;
  if(last&&last.d){
    const ld=DAYS.find(d=>d.n===+last.d);
    const ls=ld&&ld.sessions.find(s=>s.n===+last.s);
    if(ld&&ls&&!state.done[sid(ld.n,ls.n)]) next={d:ld,s:ls};
  }
  if(!next){
    for(const d of DAYS){ for(const s of d.sessions){ if(!state.done[sid(d.n,s.n)]){ next={d,s}; break; } } if(next) break; }
  }
  const byPhase={I:[],II:[],III:[],IV:[]};
  DAYS.forEach(d=>byPhase[d.phase].push(d));
  $('#main').innerHTML=`
    <section class="wrap hero">
      <span class="kicker">Chương trình Vật lí 9 · Ảnh 1 &amp; Ảnh 2 · và phần ngoài giới hạn</span>
      <h1>Học trực tiếp<br>từng ca — <em>13 ngày</em></h1>
      <p>52 ca, ${VID_COUNT} bài giảng phát ngay trong trang, ${QUIZ.length} câu hỏi sáu dạng (trắc nghiệm · nhiều đáp án · đúng–sai · điền số · sắp xếp bước · chọn hình) và ${QA.length} câu hỏi đáp tra được ngay trong bài.</p>
      <div class="hero-row">
        <div class="stats">
          <div class="stat"><div class="k">Đã học</div><div class="v">${dc} / ${TOTAL_SESS}</div></div>
          <div class="stat"><div class="k">Bài giảng đã xem</div><div class="v">${watchedCount()} / ${VID_COUNT}</div></div>
          <div class="stat"><div class="k">Hỏi đáp</div><div class="v">${QA.length}</div></div>
          <div class="stat"><div class="k">Câu hỏi</div><div class="v">${QUIZ.length}</div></div>
        </div>
      </div>
      ${typeof etaText==='function'?`<p class="eta">${etaText()}</p>`:''}
      <p class="hero-sign">Biên soạn &amp; thiết kế: <a href="https://github.com/MoLik-Labs/STUDY-SITE" target="_blank" rel="noopener">@its.fox_</a>
        <span>·</span> <a href="#/about">về trang này</a></p>
      <a class="hero-phys" href="#/physics">
        <span class="hp-l">
          <span class="kicker">${tl('nav_physics')} · ${dc}/${TOTAL_SESS} ca</span>
          <b>Vào mục Vật lí</b>
          <span class="hp-sub">Lộ trình 13 ngày · máy giải 16 dạng · bảng mạch · phòng thí nghiệm · 8 công cụ</span>
        </span>
        <span class="hp-r">
          <span class="hp-bar"><i style="width:${TOTAL_SESS?Math.round(dc/TOTAL_SESS*100):0}%"></i></span>
          <u>Mở →</u>
        </span>
      </a>
      <a class="hero-study" href="#/study">
        <span class="hs-l">
          <span class="kicker">Trung tâm tự học</span>
          <b>Học hôm nay</b>
          <span class="hs-sub">Thẻ ghi nhớ · luyện đề tự tạo · kế hoạch tới ngày thi · đồng hồ tập trung</span>
        </span>
        <span class="hs-r"><em id="hsMin">0</em><i>phút hôm nay</i><u>Mở →</u></span>
      </a>
      ${typeof examBanner==='function' && typeof examRestore==='function' ? examBanner(examRestore()) : ''}
      ${typeof syIfThenHtml==='function'?syIfThenHtml():''}
      ${typeof todayStrip==='function'?todayStrip():''}
      ${typeof routineCard==='function'?routineCard():''}
      ${next?`<a class="continue" href="${sessionHref(next.d.n,next.s.n)}">
        <div>
          <span class="kicker">${state.last&&state.last.d*1===next.d.n&&state.last.s*1===next.s.n?'Đang học dở':'Học tiếp'}</span>
          <h3>${next.s.title}</h3>
          <p>Ngày ${String(next.d.n).padStart(2,'0')} · ${next.s.label} · ${next.d.title}</p>
        </div>
        <span class="btn">Vào ca học →</span>
      </a>`:''}
    </section>
    <section class="wrap"><div id="toolsMount"></div></section>
    <section class="wrap school-strip">
      <a class="ss-main" href="#/subjects">
        <span class="kicker">Trường học · lớp 1 đến lớp 12</span>
        <b>Không chỉ Vật lí 9 — mọi môn, mọi lớp, trong cùng một máy</b>
        <span class="ss-sub">Toán, Văn, Anh, Hoá, Sinh, Sử – Địa, GDCD, Tin, Công nghệ… · tự soạn bài, tải tệp lên, xuất ra tệp để chia sẻ</span>
      </a>
      <div class="ss-links">
        <a href="#/subjects"><b>Chọn lớp &amp; môn</b><span>1 → 12</span></a>
        <a href="#/studio"><b>Tạo bài học</b><span>soạn · gắn tệp</span></a>
        <a href="#/files"><b>Kho tệp</b><span>ảnh · PDF · Word</span></a>
      </div>
    </section>
    ${['I','II','III','IV'].map(p=>`
      <section class="wrap">
        <div class="phase-block">
          <div class="phase-head">
            <span class="ph-n">${PHASES[p].t}</span>
            <h2>${PHASES[p].s}</h2>
          </div>
          <div class="days">
            ${byPhase[p].map(d=>{
              const k=dayDone(d);
              return `<a class="daycard${k===4?' done':''}" href="#/day/${d.n}">
                <div class="d"><span>Ngày ${String(d.n).padStart(2,'0')}</span><span>${k===4?'✓':''}</span></div>
                <div class="t">${d.title}</div>
                <div class="m"><span>${d.sessions.length} ca</span>
                  <span class="dots">${d.sessions.map(s=>`<i class="${state.done[sid(d.n,s.n)]?'on':''}"></i>`).join('')}</span>
                </div>
              </a>`;
            }).join('')}
          </div>
        </div>
      </section>`).join('')}
  `;
  mountHomeTools();
  try{
    const hm=$('#hsMin');
    if(hm && typeof syMinutesOn==='function' && typeof syDayKey==='function') hm.textContent=syMinutesOn(syDayKey());
  }catch(e){}
}

/* =========================================================
   RENDER — DAY
========================================================= */
function renderDay(n){
  const d=DAYS.find(x=>x.n===+n); if(!d){go('#/');return;}
  $('#main').innerHTML=`
    <section class="wrap">
      <div class="day-hero">
        <div class="crumb"><a href="#/">Lộ trình</a><span>/</span><span>${PHASES[d.phase].t}</span></div>
        <span class="kicker">Ngày ${String(d.n).padStart(2,'0')} · ${d.theme}</span>
        <h1 style="margin-top:8px">${d.title}</h1>
        <p>${d.desc||''}</p>
      </div>
      <div class="sess-list">
        ${d.sessions.map(s=>{
          const dn=state.done[sid(d.n,s.n)];
          return `<div class="sess${dn?' done':''}" data-go="${sessionHref(d.n,s.n)}">
            <div class="sess-n">CA ${s.n}<br>${s.time.replace('–','<br>')}</div>
            <div>
              <div class="sess-c"><span class="sess-t">${s.title}</span></div>
              <div class="sess-o">${s.obj}</div>
            </div>
            <div class="sess-r"><b>${s.v.length} bài giảng</b>${s.v.length?'Xem ngay →':'Tự làm đề'}</div>
          </div>`;
        }).join('')}
      </div>
    </section>`;
  $$('.sess').forEach(x=>x.onclick=()=>go(x.dataset.go));
}

/* =========================================================
   PLAYER
========================================================= */
function playerHTML(id,title,meta){
  return `<div class="player" data-vid="${id}">
    <img class="thumb" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy" decoding="async" data-thumb>
    <div class="scrim"></div>
    <button class="poster" data-play="${id}" data-title="${esc(title)}">
      <span class="play" aria-hidden="true"></span>
      <span class="p-k">Bài giảng · phát tại chỗ</span>
      <span class="p-t">${esc(title)}</span>
      <span class="p-m">${meta||''}</span>
    </button>
  </div>`;
}
/* Ảnh bìa YouTube có thể 404 (video bị gỡ). `error` không bốc bọt nên phải
   bắt ở pha capture; KHÔNG gắn thuộc tính xử lý sự kiện trong HTML vì CSP cấm. */
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.hasAttribute('data-thumb')) t.style.display = 'none';
}, true);

function mountPlayer(host,id,title,meta){
  host.innerHTML=playerHTML(id,title,meta);
  const b=$('.poster',host);
  b.onclick=()=>{
    host.innerHTML=`<div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1" title="${esc(title)}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen></iframe></div>`;
    if(!state.watched[id]){ state.watched[id]=1; save(); }
  };
}

/* =========================================================
   RENDER — LESSON
========================================================= */
function renderLesson(dn,sn,pane){
  const d=DAYS.find(x=>x.n===+dn), s=d&&d.sessions.find(x=>x.n===+sn);
  if(!d||!s){go('#/');return;}
  state.last={d:d.n,s:s.n}; save();
  const P=pane||state.pane||'learn';
  const done=!!state.done[sid(d.n,s.n)];
  const qs=quizFor(d.n,s.n,d);
  const qaList=qaOfTopic(TOPIC_OF_DAY(d));
  const answerdCount=qs.filter(x=>{const a=ansOf(x.id);return a&&a.ok;}).length;

  $('#main').innerHTML=`
    <section class="wrap">
      <div class="lesson-head">
        <div class="crumb">
          <a href="#/">Lộ trình</a><span>/</span>
          <a href="#/day/${d.n}">Ngày ${String(d.n).padStart(2,'0')}</a><span>/</span>
          <span>Ca ${s.n}</span>
        </div>
        <h1>${s.title}</h1>
        <div class="lesson-meta">
          <span>${s.label} · ${s.time} · ${d.title} · ${s.v.length} bài giảng</span>
          ${done?'<span class="tag" style="border-color:#a9c1ad;color:var(--green)">đã học</span>':''}
          <a class="tag tag-share" href="#/share/lesson/${d.n}/${s.n}">${tl('lesson_share')}</a>
        </div>
        <div class="seg" role="tablist">
          <button role="tab" data-pane="learn" aria-selected="${P==='learn'}">Bài giảng</button>
          <button role="tab" data-pane="quiz" aria-selected="${P==='quiz'}">Trắc nghiệm<span class="cnt">${qs.length}</span></button>
          <button role="tab" data-pane="qa" aria-selected="${P==='qa'}">Hỏi đáp<span class="cnt">${qaList.length}</span></button>
        </div>
      </div>
      <div class="pane" id="pane"></div>
      <div class="lesson-nav" id="lnav"></div>
    </section>`;

  // ca trước / ca sau trong toàn lộ trình
  const flat=[];
  DAYS.forEach(dd=>dd.sessions.forEach(ss=>flat.push({d:dd.n,s:ss.n,done:!!state.done[sid(dd.n,ss.n)],title:ss.title})));
  const idx=flat.findIndex(x=>x.d===d.n&&x.s===s.n);
  const prev=flat[idx-1], next=flat[idx+1];
  $('#lnav').innerHTML=`
    ${prev?`<a class="lnav-btn" href="#/lesson/${prev.d}/${prev.s}"><span class="kicker">← Ca trước</span><span>${prev.title}</span></a>`:'<span></span>'}
    ${next?`<a class="lnav-btn r" href="#/lesson/${next.d}/${next.s}"><span class="kicker">Ca tiếp →</span><span>${next.title}</span></a>`:''}`;

  $$('.seg button').forEach(b=>b.onclick=()=>{state.pane=b.dataset.pane;save();renderLesson(d.n,s.n,b.dataset.pane);});
  const host=$('#pane');
  if(P==='quiz') renderQuizPane(host,d,s,qs);
  else if(P==='qa') renderQAPane(host,d,s,qaList);
  else renderLearnPane(host,d,s);
}

function renderLearnPane(host,d,s){
  const ids=s.v;
  const first=ids[0];
  host.innerHTML=`
    <div class="room">
      <div>
        <div id="room-player">${first?playerHTML(first,LIB[first].t,`${LIB[first].d} · ${whoName(LIB[first].who)}`):`
          <div class="player" style="display:grid;place-items:center;background:var(--card);border-color:var(--rule)">
            <div style="text-align:center;color:var(--ink-2);padding:24px">
              <div class="kicker" style="margin-bottom:8px">Không có bài giảng</div>
              <p style="font-size:13.5px;max-width:34ch">Ca này để tự làm đề. Bấm giờ 150 phút, sau đó chữa bằng đề trong tab <a href="#/papers" style="color:var(--accent)">Đề thi</a>.</p>
            </div>
          </div>`}</div>
        ${first?`<div class="player-note">
          <span>Nếu khung phát không hiện (chế độ xem trước chặn mạng), mở trực tiếp:</span>
          <a href="https://www.youtube.com/watch?v=${first}" target="_blank" rel="noopener">YouTube ↗</a>
        </div>`:''}
        ${ids.length>1?`<div class="vidlist">
          ${ids.map((id,i)=>{
            const v=LIB[id]||{t:id,d:'—',who:'K'};
            const seen=state.watched[id];
            return `<button class="vidrow" data-vid="${id}">
              <span class="i">${String(i+1).padStart(2,'0')}</span>
              <span class="t">${v.pick?'<em>chọn</em>':''}${v.t}${seen?' · <span style="color:var(--green)">đã xem</span>':''}</span>
              <span class="d">${v.d||'—'}</span>
            </button>`;
          }).join('')}
        </div>`:''}
      </div>
      <aside class="side">
        <div class="side-box">
          <span class="kicker">Mục tiêu ca học</span>
          <p>${s.obj}</p>
        </div>
        <div class="side-box">
          <span class="kicker">Công thức cần nhớ</span>
          <div class="formula">${s.f}</div>
        </div>
        <div class="side-actions">
          <button class="done-btn" aria-pressed="${!!state.done[sid(d.n,s.n)]}" id="doneBtn">${state.done[sid(d.n,s.n)]?'Đã học xong':'Đánh dấu đã học'}</button>
          <button class="btn ghost sm" data-pane="quiz" style="justify-content:center">Làm trắc nghiệm →</button>
          <button class="btn ghost sm" data-pane="qa" style="justify-content:center">Hỏi đáp ca này →</button>
        </div>
      </aside>
    </div>
    <div id="noteMount">${noteHTML(d,s)}</div>
    <div id="simMount"></div>`;

  const room=$('#room-player');
  if(ids[0]) mountPlayer(room,ids[0],LIB[ids[0]].t,`${LIB[ids[0]].d} · ${whoName(LIB[ids[0]].who)}`);
  $$('.vidrow').forEach(r=>r.onclick=()=>{
    const id=r.dataset.vid;
    mountPlayer(room,id,LIB[id].t,`${LIB[id].d} · ${whoName(LIB[id].who)}`);
    $$('.vidrow').forEach(x=>x.classList.toggle('on',x.dataset.vid===id));
    window.scrollTo({top:0,behavior:'smooth'});
  });
  $('#doneBtn').onclick=()=>{
    const k=sid(d.n,s.n);
    if(state.done[k]){ delete state.done[k]; delete state.doneAt[k]; } else { state.done[k]=1; state.doneAt[k]=Date.now(); }
    save(); renderLesson(d.n,s.n,'learn'); renderRail(); renderTop();
    toast(state.done[k]?'Đã đánh dấu xong ca này':'Bỏ đánh dấu');
  };
  $$('[data-pane]').forEach(b=>b.onclick=()=>{state.pane=b.dataset.pane;save();renderLesson(d.n,s.n,b.dataset.pane);});

  mountNote(d,s);
  const tp=TOPIC_OF_DAY(d);
  if(tp===4||tp===8) mountLensSim($('#simMount'));
}

/* ---------- mô phỏng thấu kính ---------- */
function mountLensSim(host){
  if(!host) return;
  host.innerHTML=`
    <section class="sim">
      <div class="sim-h">
        <span class="kicker">Mô phỏng tương tác</span>
        <h3>Dựng ảnh qua thấu kính hội tụ</h3>
        <p>Kéo hai thanh trượt để đổi tiêu cự và vị trí vật. Ảnh, chiều và độ lớn cập nhật ngay.</p>
      </div>
      <div class="sim-grid">
        <div class="sim-canvas"><svg id="lensSvg" viewBox="0 0 640 250" role="img" aria-label="Sơ đồ dựng ảnh qua thấu kính hội tụ"></svg></div>
        <div class="sim-ctrl">
          <label class="sim-row"><span>Tiêu cự f</span><b id="fVal">10 cm</b>
            <input type="range" id="fRange" min="5" max="25" step="1" value="10"></label>
          <label class="sim-row"><span>Khoảng cách d</span><b id="dVal">30 cm</b>
            <input type="range" id="dRange" min="4" max="70" step="1" value="30"></label>
          <div class="sim-out" id="lensOut"></div>
          <div class="sim-legend">
            <span><i style="background:var(--accent)"></i>vật</span>
            <span><i style="background:var(--ink)"></i>ảnh thật</span>
            <span><i style="background:var(--ink-3)"></i>ảnh ảo (nét đứt)</span>
          </div>
        </div>
      </div>
    </section>`;
  const draw=()=>{
    const f=+$('#fRange').value, d=+$('#dRange').value;
    $('#fVal').textContent=f+' cm'; $('#dVal').textContent=d+' cm';
    const S=3.1, AX=132, LX=320, H=44;
    const xO=LX-d*S;
    const atFocus=Math.abs(d-f)<0.4;
    const dp=atFocus?null:d*f/(d-f);
    const real=dp!==null&&dp>0;
    const xi=dp===null?null:LX+dp*S;
    // ảnh thật thì ngược chiều (nằm dưới trục), ảnh ảo thì cùng chiều (nằm trên)
    const hiRaw=dp===null?0:-(H*dp/d);
    const hi=Math.max(-104,Math.min(104,hiRaw));
    const inFrame=xi!==null&&xi>8&&xi<632;
    const cx=xi===null?null:Math.max(16,Math.min(624,xi));
    const yTip=dp===null?null:AX-hi;
    const F1=LX-f*S, F2=LX+f*S;

    let rays='';
    // tia tới song song trục chính
    rays+=`<path d="M${xO} ${AX-H} H${LX}" class="ray"/>`;
    // tia tới qua quang tâm
    rays+=`<path d="M${xO} ${AX-H} L${LX} ${AX}" class="ray"/>`;

    if(dp!==null){
      if(real){
        rays+=`<path d="M${LX} ${AX-H} L${cx} ${yTip}" class="ray"/>`;
        rays+=`<path d="M${LX} ${AX} L${cx} ${yTip}" class="ray"/>`;
        // kéo dài qua ảnh một đoạn ngắn
        const dx=cx-LX, dy=yTip-(AX-H);
        rays+=`<path d="M${cx} ${yTip} L${Math.min(628,cx+26)} ${yTip+dy*26/Math.max(dx,1)}" class="ray" opacity=".45"/>`;
      }else{
        const m1=H/(f*S);
        rays+=`<path d="M${LX} ${AX-H} L${628} ${(AX-H)+m1*(628-LX)}" class="ray"/>`;
        const m2=H/(d*S);
        rays+=`<path d="M${LX} ${AX} L${628} ${AX+m2*(628-LX)}" class="ray"/>`;
        rays+=`<path d="M${LX} ${AX-H} L${cx} ${yTip}" class="ray dash"/>`;
        rays+=`<path d="M${LX} ${AX} L${cx} ${yTip}" class="ray dash"/>`;
      }
    }else{
      // vật tại tiêu điểm: tia ló song song
      rays+=`<path d="M${LX} ${AX-H} L${628} ${AX-H}" class="ray"/>`;
      rays+=`<path d="M${LX} ${AX} L${628} ${AX-(AX-H)/Math.max(1,(LX-xO))*(628-LX)}" class="ray" opacity=".5"/>`;
    }

    $('#lensSvg').innerHTML=`
      <defs>
        <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#8b2e22"/>
        </marker>
        <marker id="ab" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#17150f"/>
        </marker>
      </defs>
      <line x1="12" y1="${AX}" x2="628" y2="${AX}" class="axis"/>
      <line x1="${LX}" y1="18" x2="${LX}" y2="246" class="lens"/>
      <path d="M${LX-7} 30 L${LX} 18 L${LX+7} 30" class="lenscap"/>
      <path d="M${LX-7} 234 L${LX} 246 L${LX+7} 234" class="lenscap"/>
      <circle cx="${F1}" cy="${AX}" r="2.6" class="fdot"/><circle cx="${F2}" cy="${AX}" r="2.6" class="fdot"/>
      <text x="${F1-4}" y="${AX+18}" class="flab">F</text>
      <text x="${F2-4}" y="${AX+18}" class="flab">F′</text>
      <text x="${LX+8}" y="${AX-9}" class="flab">O</text>
      <line x1="${xO}" y1="${AX}" x2="${xO}" y2="${AX-H}" class="obj" marker-end="url(#ar)"/>
      <text x="${xO-4}" y="${AX-H-8}" class="oblab">AB</text>
      ${rays}
      ${dp!==null&&inFrame?`<line x1="${cx}" y1="${AX}" x2="${cx}" y2="${yTip}" class="${real?'img':'img virt'}" marker-end="url(#ab)"/>
      <text x="${cx-8}" y="${yTip+(yTip<AX?-8:16)}" class="oblab">A′B′</text>`:''}
      <text x="16" y="242" class="small">d = ${d} cm · f = ${f} cm</text>
      <text x="466" y="242" class="small">${dp===null?'d = f → chùm ló song song':`d′ = ${dp.toFixed(1)} cm`}</text>`;

    const out=$('#lensOut');
    if(dp===null){ out.innerHTML='<b>Vật đặt đúng tiêu điểm.</b> Các tia ló song song với nhau, không tạo ảnh rõ trên màn.'; return; }
    const k=Math.abs(dp/d);
    const kind=real?'Ảnh thật, ngược chiều':'Ảnh ảo, cùng chiều';
    const size=k>1.02?'lớn hơn vật':(k<0.98?'nhỏ hơn vật':'bằng vật');
    const zone=real&&d>2*f?'Vật ngoài 2F ⇒ ảnh trong khoảng F′–2F′.':(real&&d<2*f?'Vật trong khoảng F–2F ⇒ ảnh ngoài 2F′.':'');
    out.innerHTML=`<b>${kind}, ${size}.</b> d′ = ${dp.toFixed(1)} cm · |k| = ${k.toFixed(2)}.
      <span style="display:block;color:var(--ink-3);margin-top:4px">${real?'Hứng được trên màn, khác phía vật.':'Không hứng được trên màn, cùng phía với vật.'} ${zone}</span>`;
  };
  $('#fRange').oninput=draw; $('#dRange').oninput=draw; draw();
}

/* ---------- question engine ---------- */
const QS=QUIZ.map((q,i)=>Object.assign({id:i},q));
const qType=q=>q.type||'mcq';

/* ---------- chấm câu điền số: dung sai tương đối + kiểm tra đơn vị ---------- */
const UNIT_ALIAS={'ω':'Ω','ohm':'Ω','ôôm':'Ω','vôn':'V','ampe':'A','watt':'W','jun':'J','niuton':'N',
  'gam':'g','kilogam':'kg','giây':'s','phút':'min','giờ':'h','độ':'°C','do':'°C','c':'°C','oc':'°C'};
const unitNorm=u=>{
  let x=norm(u).replace(/\s+/g,'');
  x=x.replace(/m3/g,'m³').replace(/cm3/g,'cm³').replace(/dm3/g,'dm³').replace(/mm2/g,'mm²').replace(/cm2/g,'cm²');
  return UNIT_ALIAS[x]||x;
};
const unitOf=q=>unitNorm(q.unit||'');
function parseNum(str){
  const raw=String(str||'').replace(',','.').replace(/−/g,'-').trim();
  const m=raw.match(/^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*([^\d.\s].*)?$/);
  if(!m) return {v:NaN,unit:''};
  return {v:parseFloat(m[1]),unit:m[2]||''};
}
const numTol=q=>Math.max(q.tol||0,Math.abs(q.a)*0.005);
const numOK=(q,p)=>{
  if(typeof p!=='number'||!isFinite(p)) return false;
  const d=Math.abs(p-q.a);
  if(d<=numTol(q)) return true;
  /* chấp nhận làm tròn khác số chữ số có nghĩa: so ở mức 3 chữ số */
  const sig=v=>{const s=Math.abs(v).toPrecision(3);return parseFloat(s);};
  return sig(p)===sig(q.a)&&Math.abs(q.a)>0;
};
const MULTI={};

function isCorrect(q,p){
  const t=qType(q);
  if(t==='multi') return Array.isArray(p)&&p.length===q.a.length&&q.a.every(x=>p.includes(x));
  if(t==='tf') return p===q.a;
  if(t==='num') return numOK(q,p);
  if(t==='order') return Array.isArray(p)&&p.length===q.s.length&&p.every((v,i)=>v===i);
  return p===q.a;
}
function recordAns(id,ok,p){
  if(typeof srsRecord==='function') return srsRecord(id,ok,p);
  state.ans[id]={ok:ok,p:p,at:Date.now()};
  activity(1); save();
}
function quizFor(dn,sn,d){
  const t=TOPIC_OF_DAY(d);
  const bank=QS.filter(q=>q.t===t);
  if(!bank.length) return [];
  const start=(dn*3+sn)%bank.length;
  const out=[];
  for(let i=0;i<Math.min(3,bank.length);i++) out.push(bank[(start+i)%bank.length]);
  return out;
}
const TYPE_LABEL={mcq:'Trắc nghiệm',multi:'Nhiều đáp án',tf:'Đúng / Sai',num:'Điền số',order:'Sắp xếp bước',pick:'Chọn hình'};
const ORD={},PICK={},ordSeen={};

function renderQuestion(host,q,opt){
  opt=opt||{};
  const t=qType(q);
  const exam=!!opt.exam;
  const revealed=!exam&&!!opt.revealed;
  const picked=exam?(opt.picks?opt.picks[q.id]:opt.picked):opt.picked;
  const ok=revealed?isCorrect(q,picked):null;
  let body='';

  if(t==='mcq'||t==='multi'){
    const sel=t==='multi'?(Array.isArray(picked)?picked:(MULTI[q.id]||[])):picked;
    body='<div class="opts">'+q.o.map((o,i)=>{
      const on=t==='multi'?sel.includes(i):sel===i;
      let cls='opt'+(on?' pick':'');
      if(revealed){
        const isAns=t==='multi'?q.a.includes(i):i===q.a;
        if(isAns) cls+=' right';
        if(on&&!isAns) cls+=' wrong';
      }
      return `<button class="${cls}" data-o="${i}" ${revealed?'disabled':''}>
        <span class="oi">${t==='multi'?'<span class="mbox'+(on?' on':'')+'"></span>':'ABCD'[i]}</span>
        <span class="ot">${o}</span></button>`;
    }).join('')+'</div>';
    if(t==='multi'&&!revealed&&!exam){
      body+=`<div class="qfoot"><span class="qscore">Chọn tất cả đáp án đúng rồi bấm kiểm tra</span><button class="btn sm" data-check="1">Kiểm tra</button></div>`;
    }
  }else if(t==='tf'){
    const cls=(v)=>{let c='opt tfb';if(revealed){ if(q.a===v)c+=' right'; else if(picked===v)c+=' wrong'; }else if(picked===v)c+=' pick';return c;};
    body=`<div class="tfrow">
      <button class="${cls(true)}" data-tf="1" ${revealed?'disabled':''}>Đúng</button>
      <button class="${cls(false)}" data-tf="0" ${revealed?'disabled':''}>Sai</button>
    </div>`;
  }else if(t==='order'){
    if(!ORD[q.id]) ORD[q.id]=shuffleIdx(q.s.map((_,i)=>i));
    const cur=picked&&Array.isArray(picked)?picked.slice():ORD[q.id].slice();
    body=`<div class="ordlist">`+cur.map((oi,pos)=>{
      let cls='ord-row';
      if(revealed) cls+=oi===pos?' right':' wrong';
      return `<div class="${cls}" draggable="${revealed?'false':'true'}" data-pos="${pos}">
        <span class="ord-n">${pos+1}</span><span class="ord-t">${q.s[oi]}</span>
        ${revealed?'':`<span class="ord-mv"><button data-up="${pos}" aria-label="Lên">↑</button><button data-dn="${pos}" aria-label="Xuống">↓</button></span>`}
      </div>`;
    }).join('')+`</div>`;
    if(!revealed) body+=`<div class="qfoot"><span class="qscore">Kéo thả hoặc dùng mũi tên để xếp đúng thứ tự</span><button class="btn sm" data-check="1">Kiểm tra</button></div>`;
  }else if(t==='pick'){
    if(PICK[q.id]===undefined&&!picked) PICK[q.id]=null;
    const sel=(picked!==undefined&&picked!==null)?picked:PICK[q.id];
    body=`<div class="pickgrid">`+q.tiles.map((svg,i)=>{
      let cls='picktile'+(sel===i?' on':'');
      if(revealed) cls+=i===q.a?' right':(sel===i?' wrong':'');
      return `<button class="${cls}" data-i="${i}" draggable="${revealed?'false':'true'}" aria-pressed="${sel===i}">${svg}<span class="picklbl">${'ABCD'[i]}</span></button>`;
    }).join('')+`</div>`;
    if(!revealed) body+=`<div class="qfoot"><span class="qscore">Chọn hoặc kéo hình đúng vào khung bên dưới</span><button class="btn sm" data-check="1">Kiểm tra</button></div><div class="pickslot" id="pickSlot">Kéo hình đúng vào đây</div>`;
  }else{
    body=`<div class="numrow">
      <span class="numbox"><input class="numin" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="Nhập số" title="Gõ số, hoặc số kèm đơn vị (ví dụ 12${q.unit?' '+q.unit:''})" value="${picked===undefined||picked===null?'':picked}" ${revealed?'disabled':''}><span class="unit">${q.unit||''}</span></span>
      ${revealed?'':'<button class="btn sm" data-check="1">Kiểm tra</button>'}
    </div><div class="uunit"></div>`;
  }

  let fb='';
  if(revealed){
    const right=t==='multi'?q.a.map(i=>'ABCD'[i]).join(', '):(t==='num'?q.a+(q.unit?' '+q.unit:'')+(numTol(q)>0?` <span class="tol">(nhận sai số ±${Math.round(numTol(q)*1000)/1000}${q.unit?' '+q.unit:''})</span>`:''):(t==='tf'?(q.a?'Đúng':'Sai'):(t==='pick'?'Hình '+'ABCD'[q.a]:(t==='order'?'Thứ tự đúng là các bước 1 → '+q.s.length:'ABCD'[q.a]))));
    fb=`<div class="exp${ok?'':' bad'}"><b>${ok?'Đúng.':'Chưa đúng — đáp án '+right+'.'}</b> ${q.e||''}</div>`;
  }

  host.innerHTML=`<div class="qcard">
    <div class="qtop"><span class="qtype">${TYPE_LABEL[t]}</span><span class="qtopic">${topicName(q.t)}</span></div>
    <div class="qst">${q.q}</div>
    ${body}${fb}
  </div>`;

  const finish=(p)=>{
    if(exam){ opt.picks[q.id]=p; if(opt.onPick) opt.onPick(q.id,p); renderQuestion(host,q,opt); return; }
    const good=isCorrect(q,p);
    recordAns(q.id,good,p);
    opt.picked=p; opt.revealed=true;
    renderQuestion(host,q,opt);
    if(opt.onAnswer) opt.onAnswer(good);
  };

  if(t==='multi'&&!revealed&&!exam){
    $$('.opt',host).forEach(b=>b.onclick=()=>{
      const i=+b.dataset.o; const cur=MULTI[q.id]||[];
      MULTI[q.id]=cur.includes(i)?cur.filter(x=>x!==i):cur.concat(i);
      renderQuestion(host,q,opt);
    });
    const c=$('[data-check]',host); if(c) c.onclick=()=>finish(MULTI[q.id]||[]);
  }else if(t==='multi'&&exam){
    $$('.opt',host).forEach(b=>b.onclick=()=>{
      const i=+b.dataset.o; const cur=(opt.picks[q.id]||[]);
      finish(cur.includes(i)?cur.filter(x=>x!==i):cur.concat(i));
    });
  }else if(t==='mcq'){
    $$('.opt',host).forEach(b=>b.onclick=()=>finish(+b.dataset.o));
  }else if(t==='tf'){
    $$('[data-tf]',host).forEach(b=>b.onclick=()=>finish(b.dataset.tf==='1'));
  }else if(t==='order'){
    const cur=(picked&&Array.isArray(picked)?picked.slice():ORD[q.id].slice());
    const move=(from,to)=>{
      if(to<0||to>=cur.length) return;
      const a=cur.slice(); const [x]=a.splice(from,1); a.splice(to,0,x);
      ORD[q.id]=a; renderQuestion(host,q,Object.assign({},opt,{picked:undefined,revealed:false}));
    };
    $$('.ord-row',host).forEach(r=>{
      r.ondragstart=e=>{ e.dataTransfer.setData('text/plain',r.dataset.pos); r.classList.add('drag'); };
      r.ondragend=()=>r.classList.remove('drag');
      r.ondragover=e=>e.preventDefault();
      r.ondrop=e=>{ e.preventDefault(); const from=+e.dataTransfer.getData('text/plain'); move(from,+r.dataset.pos); };
    });
    $$('.ord-mv button',host).forEach(b=>b.onclick=()=>{
      const p=+ (b.dataset.up!==undefined?b.dataset.up:b.dataset.dn);
      move(p, b.dataset.up!==undefined?p-1:p+1);
    });
    const c=$('[data-check]',host); if(c) c.onclick=()=>finish(cur);
  }else if(t==='pick'){
    const choose=i=>{ PICK[q.id]=i; renderQuestion(host,q,Object.assign({},opt,{picked:undefined,revealed:false})); };
    $$('.picktile',host).forEach(b=>{
      b.onclick=()=>{ if(exam){ finish(+b.dataset.i); } else choose(+b.dataset.i); };
      b.ondragstart=e=>{ e.dataTransfer.setData('text/plain','pick:'+b.dataset.i); };
    });
    const ps=$('#pickSlot',host);
    if(ps){
      ps.ondragover=e=>{ e.preventDefault(); ps.classList.add('hot'); };
      ps.ondragleave=()=>ps.classList.remove('hot');
      ps.ondrop=e=>{
        e.preventDefault(); ps.classList.remove('hot');
        const raw=e.dataTransfer.getData('text/plain')||'';
        const i=+raw.replace('pick:','');
        if(!isNaN(i)){ PICK[q.id]=i; const c2=$('[data-check]',host); c2&&c2.click(); }
      };
    }
    const c=$('[data-check]',host); if(c) c.onclick=()=>{ if(PICK[q.id]===null||PICK[q.id]===undefined) return; finish(PICK[q.id]); };
  }else if(t==='num'){
    const inp=$('.numin',host);
    const read=()=>{
      const {v,unit}=parseNum(inp.value);
      if(!isFinite(v)) return {v:NaN,unit};
      if(unit&&q.unit&&unitNorm(unit)!==unitOf(q)) return {v,unit,mismatch:true};
      if(unit&&!q.unit) return {v,unit};
      return {v,unit};
    };
    const warn=(msg)=>{
      inp.classList.add('shake'); setTimeout(()=>inp.classList.remove('shake'),400);
      const w=$('.uunit',host); if(w){ w.textContent=msg; w.style.display='block'; }
      toast(msg); inp.focus();
    };
    if(inp){
      inp.onchange=()=>{
        if(!exam) return;
        const r=read();
        if(r.mismatch){ warn('Sai đơn vị — đáp án cần '+q.unit); return; }
        finish(isFinite(r.v)?r.v:null);
      };
      inp.onkeydown=e=>{ if(e.key==='Enter'){e.preventDefault();const b=$('[data-check]',host);b&&b.click();} };
      inp.oninput=()=>{ const w=$('.uunit',host); if(w) w.style.display='none'; };
    }
    const c=$('[data-check]',host);
    if(c) c.onclick=()=>{
      const r=read();
      if(!isFinite(r.v)){ warn('Chưa có số. Gõ ví dụ: 12 hoặc 12 '+(q.unit||'')); return; }
      if(r.mismatch){ warn('Số đúng hướng rồi, nhưng đơn vị phải là '+q.unit+'.'); return; }
      finish(r.v);
    };
  }
}

const topicName=id=>{const t=TOPICS.find(x=>x.id===id);return t?'Chủ đề '+t.id:'Tổng hợp';};
function shuffleIdx(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

function renderQuizPane(host,d,s,qs){
  if(!qs.length){host.innerHTML='<p style="color:var(--ink-3)">Chưa có câu hỏi cho chủ đề này.</p>';return;}
  let idx=0;
  const draw=()=>{
    const q=qs[idx];
    const a=ansOf(q.id);
    host.innerHTML=`
      <div class="quiz">
        <div class="qmeta">
          <span class="kicker">Câu ${idx+1} / ${qs.length}</span>
          <span class="qdots">${qs.map((x,i)=>{
            const p=ansOf(x.id);
            const c=i===idx?'cur':(p?(p.ok?'ok':'no'):'');
            return `<i class="${c}"></i>`;
          }).join('')}</span>
        </div>
        <div id="qslot"></div>
        <div class="qfoot">
          <span class="qscore">${qs.filter(x=>!!ansOf(x.id)).length} / ${qs.length} câu đã trả lời · đúng ${qs.filter(x=>{const a=ansOf(x.id);return a&&a.ok;}).length}</span>
          <span style="display:flex;gap:8px">
            ${idx>0?'<button class="btn ghost sm" id="prevQ">← Câu trước</button>':''}
            ${idx<qs.length-1?'<button class="btn ghost sm" id="nextQ">Câu tiếp →</button>':''}
            <button class="btn sm" id="againQ">Làm lại</button>
          </span>
        </div>
      </div>`;
    renderQuestion($('#qslot'),q,{picked:a?a.p:undefined,revealed:!!a,onAnswer:()=>{draw();}});
    const n=$('#nextQ'),p=$('#prevQ'),ag=$('#againQ');
    if(n) n.onclick=()=>{idx=Math.min(qs.length-1,idx+1);draw();};
    if(p) p.onclick=()=>{idx=Math.max(0,idx-1);draw();};
    if(ag) ag.onclick=()=>{qs.forEach(x=>delete state.ans[x.id]);save();idx=0;draw();};
  };
  draw();
}

/* ---------- Q&A pane ---------- */
function renderQAPane(host,d,s,list){
  const topic=TOPIC_OF_DAY(d);
  host.innerHTML=`
    <div class="qa">
      <form class="qa-search" id="qaForm">
        <input id="qaInput" placeholder="Hỏi: công thức tính công suất? mạch cầu cân bằng là gì?" autocomplete="off">
        <button type="submit">Tra</button>
      </form>
      <div class="qa-hint">Gõ không dấu cũng được. Ngân hàng có ${QA.length} câu — trả lời ngay, kèm công thức và bài giảng liên quan.</div>
      <div class="qa-chips">
        ${list.slice(0,4).map(x=>`<button class="qa-chip" data-q="${esc(x.q)}">${x.q}</button>`).join('')}
      </div>
      <div class="qa-out" id="qaOut">
        ${list.slice(0,3).map(x=>qaItemHTML(x,topic)).join('')}
      </div>
      <div class="qa-mine">
        <h4>Câu hỏi của tôi (${state.mine.length})</h4>
        ${state.mine.length?state.mine.map((m,i)=>`<div class="mine-row"><span>${esc(m.q)}</span><button data-del="${i}">xoá</button></div>`).join(''):
          `<p style="font-size:12.5px;color:var(--ink-3);padding:8px 0">Chưa có. Khi tra không ra, bấm “Lưu câu hỏi” để giữ lại và hỏi thầy sau.</p>`}
      </div>
    </div>`;

  const run=q=>{
    const res=askQA(q,topic);
    const out=$('#qaOut');
    if(res.length){
      out.innerHTML=res.map(x=>qaItemHTML(x,topic)).join('');
    }else{
      const rel=Object.entries(LIB).filter(([id,v])=>v.topic===topic&&v.pick).slice(0,2);
      out.innerHTML=`<div class="qa-empty">
        <h4>Chưa có câu trả lời sẵn cho câu này</h4>
        <p>Thử diễn đạt bằng từ khoá khác, hoặc lưu lại để hỏi thầy. Trong lúc đó xem bài giảng trọng tâm của chủ đề:</p>
        <div class="qa-src" style="padding-left:0;margin-top:10px">
          ${rel.map(([id,v])=>`<a href="#/vid/${id}">▶ ${esc(v.t)}</a>`).join('')}
          <a href="#" id="saveQ">＋ Lưu câu hỏi</a>
        </div></div>`;
      const sv=$('#saveQ'); if(sv) sv.onclick=e=>{e.preventDefault();state.mine.push({q:q,at:Date.now(),d:d.n,s:s.n});save();renderQAPane(host,d,s,list);toast('Đã lưu câu hỏi');};
    }
  };
  $('#qaForm').onsubmit=e=>{e.preventDefault();run($('#qaInput').value);};
  $$('.qa-chip').forEach(c=>c.onclick=()=>{$('#qaInput').value=c.dataset.q;run(c.dataset.q);});
  $$('[data-del]').forEach(b=>b.onclick=()=>{state.mine.splice(+b.dataset.del,1);save();renderQAPane(host,d,s,list);});
}

function qaItemHTML(x,topic){
  const rel=Object.entries(LIB).filter(([id,v])=>v.topic===x.t&&v.pick).slice(0,2);
  return `<div class="qa-item">
    <div class="qq"><span class="qmark">?</span><span>${x.q}</span></div>
    <div class="qa-a">${x.a}</div>
    ${rel.length?`<div class="qa-src">${rel.map(([id,v])=>`<a href="#/vid/${id}">▶ ${esc(v.t)}</a>`).join('')}</div>`:''}
  </div>`;
}

const TOPIC_OF_DAY=d=>{
  const m=String(d.theme).match(/Chủ đề\s+(\d+)/);
  return m?+m[1]:12;
};

/* =========================================================
   RENDER — QA PAGE
========================================================= */
function renderQA(q0){
  const q=q0||'';
  const res=q?askQA(q,null):[];
  $('#main').innerHTML=`
    <section class="wrap">
      <div class="page-head">
        <span class="kicker">Hỏi đáp · ${QA.length} câu thường gặp</span>
        <h1 style="margin-top:8px">Hỏi gì cũng tra được tại đây</h1>
        <p>Câu hỏi được trả lời bằng công thức và lí giải, kèm bài giảng trọng tâm của đúng chủ đề. Gõ không dấu vẫn tra được.</p>
      </div>
      <div class="pane">
        <div class="qa">
          <form class="qa-search" id="qaPageForm">
            <input id="qaPageInput" value="${esc(q)}" placeholder="Ví dụ: vì sao ảnh gương phẳng không hứng được?" autocomplete="off">
            <button type="submit">Tra</button>
          </form>
          <div class="qa-chips">
            <button class="qa-chip" id="qaAll">Tất cả</button>
            ${TOPICS.map(t=>`<button class="qa-chip" data-q="${esc(qaOfTopic(t.id)[0]?qaOfTopic(t.id)[0].q:'')}">${t.name.replace(/<[^>]+>/g,'')}</button>`).join('')}
          </div>
          <div class="qa-out" id="qaPageOut">
            ${q?(res.length?res.map(x=>qaItemHTML(x,null)).join(''):'<div class="qa-empty"><h4>Không tìm thấy</h4><p>Thử từ khoá ngắn hơn, ví dụ “công suất”, “mạch cầu”, “mắt cận”.</p></div>')
              :TOPICS.map(t=>{
                const list=qaOfTopic(t.id); if(!list.length) return '';
                const K=3;
                return `<div class="qa-group" data-topic="${t.id}" style="margin-top:26px" data-total="${list.length}" data-shown="${Math.min(K,list.length)}">
                  <div class="lib-head"><span class="n">${t.n}</span><h3>${t.name}</h3>
                    <span class="c">${list.length} câu</span></div>
                  <div class="qa-glist">${list.slice(0,K).map(x=>qaItemHTML(x,t.id)).join('')}</div>
                  ${list.length>K?`<button class="qa-more" data-more="${t.id}">Xem thêm ${list.length-K} câu về chủ đề ${t.id} ↓</button>`:''}
                </div>`;
              }).join('')}
          </div>
        </div>
      </div>
    </section>`;
  $('#qaPageForm').onsubmit=e=>{e.preventDefault();go('#/qa?q='+encodeURIComponent($('#qaPageInput').value));};
  $$('.qa-chip[data-q]').forEach(c=>c.onclick=()=>{if(c.dataset.q)go('#/qa?q='+encodeURIComponent(c.dataset.q));});
  if($('#qaAll')) $('#qaAll').onclick=()=>go('#/qa');
  $$('[data-more]').forEach(b=>b.onclick=()=>{
    const g=b.closest('.qa-group'); const tid=+b.dataset.more;
    const list=qaOfTopic(tid); const shown=+g.dataset.shown;
    const next=Math.min(list.length,shown+6);
    g.querySelector('.qa-glist').insertAdjacentHTML('beforeend',list.slice(shown,next).map(x=>qaItemHTML(x,tid)).join(''));
    g.dataset.shown=next;
    if(next>=list.length) b.remove();
    else b.textContent=`Xem thêm ${list.length-next} câu về chủ đề ${tid} ↓`;
  });
  if(q) window.scrollTo({top:0});
}

/* =========================================================
   RENDER — LIBRARY
========================================================= */
let libFilter={scope:'all',teacher:'all',q:''};
function renderLibrary(){
  /* The search box wrote to this variable, so it has to be mutable. It was
     `const`, and every keystroke threw "Assignment to constant variable" — the
     library search was dead, with no visible error beyond the box not
     filtering. Keep it in libFilter so the text survives a re-render. */
  let q=libFilter.q;
  const counts={};
  Object.values(LIB).forEach(v=>counts[v.topic]=(counts[v.topic]||0)+1);
  $('#main').innerHTML=`
    <section class="wrap wide">
      <div class="page-head">
        <span class="kicker">Thư viện · ${VID_COUNT} bài giảng đã kiểm chứng</span>
        <h1 style="margin-top:8px">Toàn bộ bài giảng</h1>
        <p>Bấm vào một dòng để phát ngay trong trang. Bài đánh dấu <b>chọn</b> là bài nên xem trước.</p>
      </div>
      <div class="filters">
        <button class="chip" data-scope="all" aria-pressed="${libFilter.scope==='all'}">Tất cả</button>
        <button class="chip" data-scope="pick" aria-pressed="${libFilter.scope==='pick'}">Bài chọn</button>
        <button class="chip" data-scope="vna" aria-pressed="${libFilter.scope==='vna'}">Thầy VNA</button>
        <button class="chip" data-scope="seen" aria-pressed="${libFilter.scope==='seen'}">Đã xem</button>
        <span class="sep"></span>
        <input id="libq" value="${esc(q)}" placeholder="Tìm bài giảng…" style="border:1px solid var(--rule);background:var(--card);padding:6px 10px;font:inherit;font-size:12.5px;min-width:200px" autocomplete="off">
        <span class="count" id="libcount"></span>
      </div>
      <div id="libgroups"></div>
    </section>`;
  const draw=()=>{
    const normq=norm(q); const out=$('#libgroups'); let total=0; out.innerHTML='';
    TOPICS.forEach(tp=>{
      const rows=Object.entries(LIB).filter(([id,v])=>{
        if(v.topic!==tp.id) return false;
        if(libFilter.scope==='pick'&&!v.pick) return false;
        if(libFilter.scope==='vna'&&v.who!=='VNA') return false;
        if(libFilter.scope==='seen'&&!state.watched[id]) return false;
        if(normq && !norm(v.t+' '+id+' '+(WHO[v.who]||'')).includes(normq)) return false;
        return true;
      });
      if(!rows.length) return;
      total+=rows.length;
      rows.sort((a,b)=>(b[1].pick?1:0)-(a[1].pick?1:0));
      const g=document.createElement('div');
      g.className='lib-group';
      const K=normq?rows.length:4;        /* có từ khoá thì mở hết */
      const rowHTML=([id,v],i)=>`<button class="lib-row${(state.watched||{})[id]?' seen':''}" data-vid="${id}">
          <span class="i">${String(i+1).padStart(2,'0')}</span>
          <span class="t">${v.pick?'<em>chọn</em>':''}${v.t}</span>
          <span class="w">${shortWho(v.who)}</span>
          <span class="d">${v.d||'—'}</span>
        </button>`;
      g.innerHTML=`<div class="lib-head"><span class="n">${tp.n}</span><h3>${tp.name}</h3><span class="c">${rows.length} bài</span></div>
        <div class="lib-rows">${rows.slice(0,K).map(rowHTML).join('')}</div>
        ${rows.length>K?`<button class="lib-more" data-left="${rows.length-K}">+ ${rows.length-K} bài nữa của chủ đề ${tp.n}</button>`:''}`;
      const more=g.querySelector('.lib-more');
      if(more) more.onclick=()=>{
        g.querySelector('.lib-rows').insertAdjacentHTML('beforeend',rows.slice(K).map(rowHTML).join(''));
        more.remove();
        $$('.lib-row',g).forEach(r=>r.onclick=()=>openVideoModal(r.dataset.vid));
      };
      out.appendChild(g);
    });
    $('#libcount').textContent=`${total} / ${VID_COUNT} bài`;
    $$('.lib-row').forEach(r=>r.onclick=()=>openVideoModal(r.dataset.vid));
  };
  draw();
  $$('.chip[data-scope]').forEach(b=>b.onclick=()=>{
    libFilter.scope=b.dataset.scope;
    $$('.chip[data-scope]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.scope===libFilter.scope));
    draw();
  });
  $('#libq').oninput=e=>{q=e.target.value;libFilter.q=q;draw();};
}

/* =========================================================
   RENDER — NOTES
========================================================= */
function renderNotes(q0){
  let q=q0||'';
  $('#main').innerHTML=`
    <section class="wrap wide">
      <div class="page-head">
        <span class="kicker">Sổ tay · 8 khối công thức</span>
        <h1 style="margin-top:8px">Công thức cả chương trình</h1>
        <p>Bấm vào một dòng để chép công thức. Dùng ô tìm để lọc nhanh trước khi làm đề.</p>
      </div>
      <div class="filters">
        <input id="noteq" value="${esc(q)}" placeholder="Tìm công thức: thấu kính, jun, hiệu suất…" style="border:1px solid var(--rule);background:var(--card);padding:6px 10px;font:inherit;font-size:12.5px;min-width:240px" autocomplete="off">
        <span class="count" id="notecount"></span>
      </div>
      <div class="notes" id="notes"></div>
    </section>`;
  const draw=()=>{
    const nq=norm(q); let n=0;
    $('#notes').innerHTML=NOTES.map(b=>{
      const rows=b.rows.filter(([k,v])=>!nq||norm(k+' '+v.replace(/<[^>]+>/g,' ')).includes(nq));
      if(!rows.length) return '';
      n+=rows.length;
      return `<div class="note-block">
        <div class="note-h"><span class="n">${b.n}</span><h3>${b.name}</h3><span class="g">${b.grade}</span></div>
        ${rows.map(([k,v])=>`<div class="note-row" data-copy="${esc(k+': '+v.replace(/<[^>]+>/g,''))}">
          <span class="note-k">${k}</span><span class="note-f">${v}</span></div>`).join('')}
        <p class="note-foot">${b.foot}</p>
      </div>`;
    }).join('');
    $('#notecount').textContent=`${n} công thức`;
    $$('[data-copy]').forEach(r=>r.onclick=()=>{
      const t=r.dataset.copy;
      if(navigator.clipboard) navigator.clipboard.writeText(t).then(()=>toast('Đã chép: '+t)).catch(()=>toast(t));
      else toast(t);
    });
  };
  draw();
  $('#noteq').oninput=e=>{q=e.target.value;draw();};
}

/* =========================================================
   RENDER — PAPERS : ngân hàng đề có lọc, có nguồn, có luyện phổ
========================================================= */
const PF={kind:'all',y:'all',tag:'all',star:false,q:''};
function paperYears(){ return [...new Set(PAPER_BANK.map(p=>p.y).filter(Boolean))].sort((a,b)=>b-a); }
function renderPapers(){
  const all=PAPER_BANK;
  const count=k=>all.filter(p=>p.kind===k).length;
  $('#main').innerHTML=`
    <section class="wrap wide">
      ${pageHead('Ngân hàng đề · '+all.length+' bộ',
        'Quét từ nguồn công khai, mỗi mục có link gốc',
        'Chuyên Lý vào 10 các tỉnh và trường chuyên, HSG tỉnh – thành phố nhiều năm, chuyên đề thực nghiệm và đề học kì. Bấm “Luyện phổ đề” để máy bốc một đề 12 câu đúng các chủ đề mà đề gốc hay hỏi.')}
      <div class="pstats">
        <div class="pstat"><b>${count('chuyen')}</b><span>đề chuyên</span></div>
        <div class="pstat"><b>${count('hsg')}</b><span>đề HSG</span></div>
        <div class="pstat"><b>${count('chuyende')}</b><span>chuyên đề</span></div>
        <div class="pstat"><b>${count('pdf')}</b><span>PDF gốc</span></div>
        <div class="pstat"><b>${PAPER_HUBS.length}</b><span>kho cả bộ</span></div>
      </div>
      <div class="pfilter">
        <div class="pchips" id="pKind">
          <button data-k="all" class="on">Tất cả</button>
          ${Object.entries(PAPER_KINDS).map(([k,v])=>`<button data-k="${k}">${v}</button>`).join('')}
        </div>
        <div class="prow">
          <select id="pYear" aria-label="Năm">
            <option value="all">Mọi năm</option>
            ${paperYears().map(y=>`<option value="${y}">${y}</option>`).join('')}
          </select>
          <select id="pTag" aria-label="Chủ đề">
            <option value="all">Mọi chủ đề</option>
            ${TOPICS.map(t=>`<option value="${t.id}">Chủ đề ${t.id} · ${t.name.replace(/&amp;/g,'&')}</option>`).join('')}
          </select>
          <label class="pstar"><input type="checkbox" id="pStar"> chỉ đề kinh điển ★</label>
          <input id="pQ" class="pq" type="search" placeholder="Tìm theo tỉnh, trường, năm…">
        </div>
      </div>
      <div id="pList"></div>
      <div class="phubs">
        <div class="ph-h"><h3>Kho tải cả bộ</h3><span>Tải một lần, dùng cả mùa ôn</span></div>
        ${PAPER_HUBS.map(h=>`<a class="phub" href="${h.u}" target="_blank" rel="noopener">
          <span class="ph-src">${h.src}</span><b>${h.t}</b><span class="ph-d">${h.d} ↗</span></a>`).join('')}
      </div>
    </section>`;

  const draw=()=>{
    const q=PF.q.trim().toLowerCase();
    let list=all.filter(p=>
      (PF.kind==='all'||p.kind===PF.kind)&&
      (PF.y==='all'||String(p.y)===PF.y)&&
      (PF.tag==='all'||p.tags.includes(+PF.tag))&&
      (!PF.star||p.star)&&
      (!q||(p.reg+' '+p.note+' '+(p.vt||'')+' '+p.y).toLowerCase().includes(q))
    );
    list.sort((a,b)=> (b.star?a.star:0)-(a.star?a.star:0) || b.y-a.y || a.reg.localeCompare(b.reg));
    $('#pList').innerHTML = list.length ? `<div class="pcards">${list.map((p,i)=>`
      <article class="pcard${p.star?' star':''}">
        <div class="pc-top">
          <span class="pc-kind">${PAPER_KINDS[p.kind]}</span>
          <span class="pc-y">${p.y||'—'}</span>
        </div>
        <h4>${p.reg}</h4>
        <p class="pc-note">${p.note}${p.star?' <b class="st">★ kinh điển</b>':''}</p>
        <div class="pc-tags">${p.tags.map(t=>`<span>${topicName(t)}</span>`).join('')}</div>
        <div class="pc-act">
          ${p.vid?`<button class="pc-b" data-vid="${p.vid}">Chữa đề ↗</button>`:''}
          ${p.drive?`<a class="pc-b" href="https://drive.google.com/file/d/${p.drive}/view" target="_blank" rel="noopener">PDF gốc ↗</a>`:''}
          <button class="pc-b ghost" data-drill="${p.tags.join(',')}" data-name="${esc(p.reg)}">Luyện phổ đề →</button>
        </div>
        ${p.src?`<div class="pc-src">${p.src}</div>`:''}
      </article>`).join('')}</div>`
      : `<div class="pempty">Không có đề nào khớp bộ lọc. <button class="btn ghost sm" id="pClear">Xoá lọc</button></div>`;
    $$('[data-vid]').forEach(b=>b.onclick=()=>openVideoModal(b.dataset.vid));
    $$('[data-drill]').forEach(b=>b.onclick=()=>{
      drillExam(b.dataset.drill.split(',').map(Number), 12, b.dataset.name);
    });
    const c=$('#pClear'); if(c) c.onclick=()=>{PF.kind='all';PF.y='all';PF.tag='all';PF.star=false;PF.q='';renderPapers();};
  };

  $$('#pKind button').forEach(b=>b.onclick=()=>{
    PF.kind=b.dataset.k;
    $$('#pKind button').forEach(x=>x.classList.toggle('on',x===b));
    draw();
  });
  $('#pYear').onchange=e=>{PF.y=e.target.value;draw();};
  $('#pTag').onchange=e=>{PF.tag=e.target.value;draw();};
  $('#pStar').onchange=e=>{PF.star=e.target.checked;draw();};
  $('#pQ').oninput=e=>{PF.q=e.target.value;draw();};
  draw();
}

/* =========================================================
   MODALS
========================================================= */
function openVideoModal(id){
  const v=LIB[id];
  const title=v?v.t:'Video chữa đề';
  const meta=v?(v.d||''):'';
  const m=document.createElement('div');
  m.className='modal';
  m.innerHTML=`<div class="modal-in" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-h"><span class="kicker">${esc(title)}${meta?' · '+meta:''}</span><button class="x" aria-label="Đóng">✕ Đóng</button></div>
      <div class="modal-b"><div style="position:relative;aspect-ratio:16/9">
        <iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="${esc(title)}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="autoplay;encrypted-media;picture-in-picture" allowfullscreen></iframe>
      </div></div>
      <div class="modal-f"><a href="https://www.youtube.com/watch?v=${encodeURIComponent(id)}" target="_blank" rel="noopener">Mở trên YouTube ↗</a>
        <span>Khung phát có thể bị chặn khi xem offline — mở trực tiếp nếu không thấy hình.</span></div>
    </div>`;
  document.body.appendChild(m);
  state.watched[id]=1; save();
  if(typeof musicDuck==='function') musicDuck(true);
  const close=()=>{ m.remove(); if(typeof musicDuck==='function') musicDuck(false); };
  $('.x',m).onclick=close;
  m.onclick=e=>{if(e.target===m)close();};
  document.addEventListener('keydown',function esc2(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc2);}});
}

let searchOverlay=null;
function openSearchOverlay(){
  if(typeof openPalette==='function') return openPalette();
  if(searchOverlay) return;
  const d=document.createElement('div');
  d.className='overlay';
  d.innerHTML=`<div class="ov-panel" role="dialog" aria-label="Tìm kiếm">
    <div class="ov-in">
      <svg viewBox="0 0 16 16" style="width:15px;height:15px;stroke:#8b8478;fill:none;stroke-width:1.6"><circle cx="7" cy="7" r="4.6"/><path d="M10.5 10.5 14 14"/></svg>
      <input id="ovq" placeholder="Tìm bài học, bài giảng, công thức, câu hỏi…" autocomplete="off">
      <span class="kicker">ESC</span>
    </div>
    <div class="ov-body" id="ovbody">
      <div class="ov-sec">Gợi ý</div>
      ${QA.slice(0,5).map(x=>`<div class="ov-row" data-href="#/qa?q=${encodeURIComponent(x.q)}"><span class="k">Hỏi đáp</span><span class="t">${x.q}</span></div>`).join('')}
    </div>
  </div>`;
  document.body.appendChild(d); searchOverlay=d;
  const input=$('#ovq',d); input.focus();
  const close=()=>{d.remove();searchOverlay=null;};
  d.onclick=e=>{if(e.target===d)close();};
  const draw=()=>{
    const q=input.value.trim();
    const body=$('#ovbody',d);
    if(!q){
      body.innerHTML=`<div class="ov-sec">Gợi ý</div>`+QA.slice(0,5).map(x=>`<div class="ov-row" data-href="#/qa?q=${encodeURIComponent(x.q)}"><span class="k">Hỏi đáp</span><span class="t">${x.q}</span></div>`).join('');
    }else{
      const res=searchAll(q);
      body.innerHTML=res.length?res.map(r=>`<div class="ov-row" data-href="${r.href}"><span class="k">${r.g}</span><span class="t">${esc(r.t)}</span><span class="d">${esc(r.d||'')}</span></div>`).join(''):
        '<div class="ov-sec">Không thấy kết quả. Thử: thấu kính, mạch cầu, nhiệt lượng…</div>';
    }
    $$('.ov-row',body).forEach(r=>r.onclick=()=>{const h=r.dataset.href;close();go(h);});
  };
  input.oninput=draw;
  input.onkeydown=e=>{if(e.key==='Enter'){const first=$('.ov-row',d);if(first){const h=first.dataset.href;close();go(h);}}};
  document.addEventListener('keydown',function k(e){
    if(e.key==='Escape'){close();document.removeEventListener('keydown',k);}
  });
  draw();
  $$('.ov-row',d).forEach(r=>r.onclick=()=>{const h=r.dataset.href;close();go(h);});
}

/* Mọi trang dựng xong đều đi qua đây: thêm dải "Đi tiếp" ở cuối trang.
   Làm ở một chỗ thay vì sửa 30 hàm render — và nhờ vậy không trang nào
   quên (trước đây 24 trang là ngõ cụt: chỉ còn thanh trên để thoát). */
/* Quay lại: nút thật trên trang, không bắt người dùng mò nút Back của trình
   duyệt — trên web app, nút đó thường rời khỏi trang này luôn. */
function routeBack(){
  const main=$('#main');
  if(!main) return;
  const path=(location.hash||'#/').replace(/^#/,'').split('?')[0];
  const root=(path.split('/').filter(Boolean)[0])||'';
  if(!root||root==='discover') return;          /* trang chủ và Khám phá không cần lùi */
  if(main.querySelector('.pg-back')) return;
  const a=document.createElement('a');
  a.className='pg-back'; a.href='#/discover';
  a.innerHTML='<span aria-hidden="true">←</span> Khám phá';
  a.setAttribute('aria-label','Về trang Khám phá');
  main.insertBefore(a, main.firstChild);
}

function routeNext(){
  const main=$('#main');
  if(!main) return;
  routeBack();
  if(main.querySelector('.next-steps')) return;      /* đã có, không thêm lần nữa */
  const host=document.createElement('div');
  host.innerHTML=(typeof explNextHtml==='function')?explNextHtml(location.hash):'';
  const node=host.firstElementChild;
  if(node) main.appendChild(node);
}
function routeOut(){
  routeNext();
  return undefined;
}

/* =========================================================
   ROUTER
========================================================= */
function render(){
  /* rời trang khi đang mở video bài giảng: đóng modal để nhạc trả lại âm lượng */
  const openModal=document.querySelector('.modal');
  if(openModal && typeof musicDuck==='function') musicDuck(false);
  if(openModal && !/^#\/vid/.test(location.hash)) openModal.remove();
  /* dọn listener của phiên thi cũ để phím tắt không đè lên trang mới */
  if (typeof EXAM !== 'undefined' && EXAM && typeof EXAM._cleanup === 'function' && !/^#\/exam/.test(location.hash||'')) {
    try { EXAM._cleanup(); } catch (e) {}
    if (EXAM.done) EXAM = null;
  }
  /* dọn thanh tiến độ đọc của trang bài học cũ */
  if (typeof readProgOff === 'function') { try { readProgOff(); } catch (e) {} }
  if (typeof syCleanup === 'function') { try { syCleanup(); } catch (e) {} }
  if (typeof mountDocks === 'function') mountDocks();
  const h=location.hash||'#/';
  renderTop(); renderRail();
  /* ghi lại lối vào vừa mở để trang Khám phá có mục "Vừa mở".
     Chỉ những route không tham số mới được ghi (hàm tự lọc). */
  if(typeof explRecord==='function') { try{ explRecord(h); }catch(e){} }
  syncBrandChrome();
  const [path,query]=h.replace(/^#/,'').split('?');
  const p=path.split('/').filter(Boolean);
  const qp=new URLSearchParams(query||'');
  window.scrollTo(0,0);
  const mainEl=$('#main');
  if(mainEl&&document.activeElement&&document.activeElement!==document.body&&!mainEl.contains(document.activeElement)){
    mainEl.setAttribute('tabindex','-1'); try{mainEl.focus({preventScroll:true});}catch(e){}
  }
  if(p[0]==='lesson'&&p[1]&&p[2]) return routeOut(renderLesson(p[1],p[2],qp.get('pane')||state.pane));
  if(p[0]==='day'&&p[1]) return routeOut(renderDay(p[1]));
  if(p[0]==='discover') return routeOut(renderDiscover(qp.get('q')||''));
  if(p[0]==='library') return routeOut(renderLibrary());
  if(p[0]==='notes') return routeOut(renderNotes(qp.get('q')||''));
  if(p[0]==='papers') return routeOut(renderPapers());
  if(p[0]==='qa') return routeOut(renderQA(qp.get('q')||''));
  if(p[0]==='exam') return routeOut(renderExam());
  if(p[0]==='review') return routeOut(renderReview());
  if(p[0]==='solve') return routeOut(renderSolve(p[1]===undefined?undefined:+p[1]));
  if(p[0]==='flash') return routeOut(renderFlash());
  if(p[0]==='stats') return routeOut(renderStats());
  if(p[0]==='calc') return routeOut(renderCalc());
  if(p[0]==='build') return routeOut(renderBoard());
  if(p[0]==='builder') return routeOut(renderBuild());
  if(p[0]==='sim') return routeOut(renderSim());
  if(p[0]==='subjects') return routeOut(renderShelf());
  if(p[0]==='subject'&&p[1]&&p[2]) return routeOut(renderSubject(+p[1],p[2]));
  if(p[0]==='read'&&p[1]) return routeOut(renderRead(p[1]));
  if(p[0]==='studio') return routeOut(renderStudio(p[1]||null));
  if(p[0]==='mine') return routeOut(renderMine());
  if(p[0]==='files') return routeOut(renderFiles());
  if(p[0]==='study') return routeOut(renderStudy());
  if(p[0]==='cards') return routeOut(renderCards());
  if(p[0]==='practice') return routeOut(renderPractice());
  if(p[0]==='plan') return routeOut(renderPlan());
  if(p[0]==='focus') return routeOut(renderFocus());
  if(p[0]==='progress') return routeOut(renderProgress());
  if(p[0]==='game') return routeOut(renderGame());
  if(p[0]==='physics') return routeOut(renderPhysics());
  if(p[0]==='special') return routeOut(renderSpecial());
  if(p[0]==='share'&&p[1]==='lesson'&&p[2]&&p[3]) return routeOut(renderShareLesson(p[2],p[3]));
  if(p[0]==='share') return routeOut(renderShare());
  if(p[0]==='grades') return routeOut(renderGrades(p[1]));
  if(p[0]==='weekly') return routeOut(renderWeekly());
  if(p[0]==='timetable') return routeOut(renderTimetable());
  if(p[0]==='calendar') return routeOut(renderCalendar());
  if(p[0]==='about') return routeOut(renderAbout());
  if(p[0]==='lab') return routeOut(renderLab());
  if(p[0]==='sheet') return routeOut(renderSheet());
  if(p[0]==='settings') return routeOut(renderSettings());
  if(p[0]==='vid'&&p[1]){ renderHome(); routeNext(); setTimeout(()=>openVideoModal(p[1]),60); return; }
  return renderHome();
}

/* =========================================================
   FOCUS TRAP — giữ phím Tab trong hộp thoại đang mở
   Mọi overlay (lịch, thời khoá biểu, uiPrompt, xoá dữ liệu) đều dựa vào
   phần tử .ov-panel[role=dialog|alertdialog]. Không có bẫy này thì Tab
   sẽ chạy ra sau lớp phủ và người dùng bàn phím bị lạc.
   ========================================================= */
document.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const panels = [...document.querySelectorAll('.ov-panel[role="dialog"],.ov-panel[role="alertdialog"]')];
  const panel = panels[panels.length - 1];
  if (!panel) return;
  const items = [...panel.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(el => el.offsetParent !== null || el === document.activeElement);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
    e.preventDefault(); first.focus();
  }
}, true);

window.addEventListener('hashchange',render);
document.addEventListener('keydown',e=>{
  const tgt=e.target||document.activeElement;
  const inField=/INPUT|TEXTAREA|SELECT/.test((tgt&&tgt.tagName)||'')||!!(tgt&&tgt.isContentEditable);
  /* M: tắt/bật tiếng nhạc nền (không chen vào ô nhập và phòng thi) */
  if((e.key==='m'||e.key==='M')&&!inField&&!e.metaKey&&!e.ctrlKey&&!/^#\/exam/.test(location.hash)&&typeof musicState==='function'){
    const ms=musicState();
    if(ms.q.length){
      ms.muted=!ms.muted;
      if(typeof musicApplyVol==='function') musicApplyVol(true);
      save();
      const btn=document.querySelector('#muMute');
      if(btn){ btn.textContent=ms.muted?'bật lại':'tắt'; btn.setAttribute('aria-pressed',String(ms.muted)); }
      const ico=document.querySelector('#muVolIco'); if(ico) ico.textContent=ms.muted?'🔇':'🔈';
      toast(ms.muted?'Đã tắt tiếng nhạc (M để bật lại)':'Đã bật lại nhạc nền');
    } else toast('Chưa có bài nhạc nào — mở phòng nghe để thêm link');
  }
  if((e.key==='k'&&(e.metaKey||e.ctrlKey))||(e.key==='/'&&!inField)){e.preventDefault();openSearchOverlay();}
  if(e.key==='Escape'){closeRail();const ko=document.querySelector('.keys-ov');if(ko)ko.remove();}
  if(e.key==='?'&&!inField){e.preventDefault();
    let m=document.querySelector('.keys-ov');
    if(m){m.remove();return;}
    m=document.createElement('div');m.className='overlay keys-ov';
    m.innerHTML=`<div class="ov-panel" style="max-width:520px"><div style="padding:22px 24px">
      <span class="kicker">Phím tắt</span>
      <h3 style="font-family:var(--serif);font-size:21px;margin:8px 0 14px">Làm mọi thứ không cần chuột</h3>
      <div class="keys-grid">
        ${[['⌘K / Ctrl+K','Bảng lệnh — tìm bài, công thức, câu hỏi'],
           ['/','Mở nhanh ô tìm'],
           ['?','Bảng phím tắt này'],
           ['M','Tắt / bật tiếng nhạc nền'],
           ['1–4 · A–D','Chọn đáp án trong đề thi'],
           ['↑ ↓','Chuyển câu trong đề thi'],
           ['F','Cắm cờ câu cần xem lại'],
           ['Enter','Sang câu trống kế tiếp'],
           ['← →','Ca trước / ca sau trong bài học'],
           ['Esc','Đóng mọi bảng đang mở']]
          .map(([k,t])=>`<div class="krow"><kbd>${k}</kbd><span>${t}</span></div>`).join('')}
      </div>
      <p class="muted" style="font-size:11px;margin-top:14px">Bấm ra ngoài hoặc Esc để đóng.</p>
    </div></div>`;
    document.body.appendChild(m);
    m.onclick=ev=>{if(ev.target===m)m.remove();};
  }
  if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&!inField&&/^#\/lesson\//.test(location.hash)){
    const b=e.key==='ArrowLeft'?$('.lnav-btn:not(.r)'):$('.lnav-btn.r');
    if(b){e.preventDefault();go(b.getAttribute('href'));}
  }
});
document.addEventListener('DOMContentLoaded',()=>{
  if(typeof applyPrefs==='function') applyPrefs();
  render();
  if(typeof rebuildPomo==='function') setTimeout(rebuildPomo,50);
  /* nếu bản chính trống/hỏng nhưng IndexedDB còn bản đầy đủ thì nhận lại */
  if(typeof AppStore!=='undefined' && (state.__from==='trống'||state.__partial)){
    AppStore.readAsync().then(d=>{
      if(!d) return;
      const richer=(Object.keys(d.ans||{}).length>Object.keys(state.ans||{}).length)
                || (Object.keys(d.done||{}).length>Object.keys(state.done||{}).length);
      if(richer){
        state=Object.assign(state,d); state.__from='kho trình duyệt'; state.__partial=false;
        if(typeof applyPrefs==='function') applyPrefs();
        save(); render();
        if(typeof rebuildPomo==='function') rebuildPomo();
        toast('Đã khôi phục từ kho trình duyệt');
      }
    });
  }
  if(typeof maybeWelcome==='function') setTimeout(maybeWelcome,900);
});
