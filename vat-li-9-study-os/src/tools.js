/* =========================================================
   TOOLS — thi thử, luyện câu sai, bài giải mẫu, flashcard,
            ghi chú từng ca, bảng thống kê
   Nạp sau app.js, dùng chung scope.
========================================================= */

/* ---------- helpers ---------- */
const ALLQ=QS;
const wrongList=()=>ALLQ.filter(q=>state.ans[q.id]&&!state.ans[q.id].ok);
const reviewList=()=>typeof dueList==='function'?dueList():wrongList();
const answerStats=()=>{
  const a=Object.values(state.ans);
  return {n:a.length, ok:a.filter(x=>x.ok).length};
};
function pageHead(kicker,h1,p){
  return `<div class="page-head"><span class="kicker">${kicker}</span>
    <h1 style="margin-top:8px">${h1}</h1><p>${p||''}</p></div>`;
}
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

/* =========================================================
   1 · EXAM — 15 câu ngẫu nhiên, 20 phút, bảng điểm theo chủ đề
========================================================= */
const EXAM_N=15, EXAM_SEC=20*60;
let EXAM=null;

function pickExam(n){
  const byTopic={};
  ALLQ.forEach(q=>{(byTopic[q.t]=byTopic[q.t]||[]).push(q);});
  const keys=Object.keys(byTopic);
  const out=[];
  // vòng 1: mỗi chủ đề một câu
  shuffle(keys).forEach(k=>{ if(out.length<n) out.push(shuffle(byTopic[k])[0]); });
  // vòng 2: lấp đầy từ pool còn lại
  const rest=shuffle(ALLQ.filter(q=>!out.includes(q)));
  while(out.length<n&&rest.length) out.push(rest.pop());
  return shuffle(out);
}

function drillExam(tags,n,label){
  const pool=ALLQ.filter(q=>tags.includes(q.t));
  if(!pool.length){ toast('Chưa có câu cho chủ đề này'); return; }
  const byT={};
  pool.forEach(q=>{(byT[q.t]=byT[q.t]||[]).push(q);});
  const out=[];
  Object.keys(byT).forEach(k=>out.push(shuffle(byT[k])[0]));
  const rest=shuffle(pool.filter(q=>!out.includes(q)));
  while(out.length<(n||12)&&rest.length) out.push(rest.pop());
  EXAM={qs:shuffle(out),picks:{},left:EXAM_SEC,t0:Date.now(),done:false,report:null,
        label:'Luyện phổ đề · '+(label||'đề đã chọn')};
  location.hash='#/exam';
  if(location.hash==='#/exam') renderExam();
}
function drillQuestions(list,label){
  if(!list||!list.length){ toast('Không có câu nào'); return; }
  EXAM={qs:list.slice(),picks:{},left:EXAM_SEC,t0:Date.now(),done:false,report:null,
        label:'Luyện lại · '+(label||list.length+' câu')};
  location.hash='#/exam';
  if(location.hash==='#/exam') renderExam();
}

let __examUnbind=null;   /* gỡ listener + đồng hồ của lượt thi trước (kể cả khi đã bốc đề mới) */
function renderExam(){
  if(!EXAM){
    const r=typeof examRestore==='function'?examRestore():null;
    if(r){ EXAM=r; setTimeout(()=>toast('Đã khôi phục đề đang làm'),60); }
    else EXAM={qs:pickExam(EXAM_N),picks:{},left:EXAM_SEC,t0:Date.now(),done:false,report:null,label:''};
  }
  /* dọn listener + đồng hồ của lượt vẽ trước, tránh gắn trùng (bấm F sẽ đảo 2 lần) */
  if(__examUnbind){ try{ __examUnbind(); }catch(e){} __examUnbind=null; }
  if(typeof EXAM._cleanup==='function'){ try{ EXAM._cleanup(); }catch(e){} delete EXAM._cleanup; }
  const EH=EXAM.label||'Thi thử · 15 câu · 20 phút';
  const ES=EXAM.label
    ? 'Đề luyện riêng · '+EXAM.qs.length+' câu · chấm xong có bảng theo chủ đề'
    : 'Đề ngẫu nhiên toàn chương trình · '+EXAM.qs.length+' câu';
  $('#main').innerHTML=`<section class="wrap wide">
    ${pageHead(EH,ES,'Mỗi lượt bốc lại câu mới từ 12 chủ đề. Không xem lời giải trong lúc làm; nộp bài mới có bảng điểm theo chủ đề.')}
    <div class="exam-bar" id="examBar">
      <span class="exam-clock" id="clock">20:00</span>
      <div class="exam-prog"><i id="examProg"></i></div>
      <span class="exam-cnt" id="examCnt">0 / 15</span>
      <button class="btn sm" id="examSubmit">Nộp bài</button>
      <button class="btn ghost sm" id="examReset">Đề mới</button>
    </div>
    <div class="exam-map" id="examMap"></div>
    <div id="examBody"></div>
    <p class="exam-keys">Phím: <b>1–4 / A–D</b> chọn đáp án · <b>↑ ↓</b> chuyển câu · <b>F</b> cắm cờ xem lại · <b>Enter</b> sang câu trống kế tiếp</p>
  </section>`;
  const body=$('#examBody');
  if(EXAM.done&&EXAM.report){
    const bar=$('#examBar'); if(bar) bar.style.display='none';
    showReport(EXAM.report.rows,EXAM.report.rep,EXAM.report.auto);
    return;
  }
  startClock();

  const drawList=()=>{
    body.innerHTML=EXAM.qs.map((q,i)=>`<div class="exam-q" id="eq${i}">
      <div class="exam-qn"><span class="num">${i+1}</span><span class="qtype">${TYPE_LABEL[qType(q)]}</span></div>
      <div id="eqslot${i}"></div>
    </div>`).join('');
    EXAM.qs.forEach((q,i)=>{
      renderQuestion($('#eqslot'+i),q,{exam:true,picks:EXAM.picks,onPick:updateBar});
    });
    updateBar();
  };
  const updateBar=()=>{
    const n=Object.keys(EXAM.picks).filter(k=>EXAM.picks[k]!==undefined&&EXAM.picks[k]!==null&&!(Array.isArray(EXAM.picks[k])&&!EXAM.picks[k].length)).length;
    $('#examCnt').textContent=`${n} / ${EXAM.qs.length}`;
    $('#examProg').style.width=(n/EXAM.qs.length*100)+'%';
    if(typeof examPersist==='function') examPersist(EXAM);
    paintMap(n);
  };
  let CUR=0;
  const isAnswered=i=>{const v=EXAM.picks[EXAM.qs[i].id];return v!==undefined&&v!==null&&!(Array.isArray(v)&&!v.length);};
  const paintMap=(n)=>{
    const m=$('#examMap'); if(!m) return;
    m.innerHTML=EXAM.qs.map((q,i)=>`<button class="em${isAnswered(i)?' done':''}${EXAM.flags&&EXAM.flags[q.id]?' flag':''}${i===CUR?' cur':''}"
      data-j="${i}" aria-label="Câu ${i+1}${isAnswered(i)?' đã làm':''}">${i+1}</button>`).join('')
      +`<span class="em-l">${n}/${EXAM.qs.length} đã làm · ${EXAM.flags?Object.keys(EXAM.flags).filter(k=>EXAM.flags[k]).length:0} cờ</span>`;
    $$('.em',m).forEach(b=>b.onclick=()=>jumpTo(+b.dataset.j));
  };
  const jumpTo=i=>{
    i=Math.max(0,Math.min(EXAM.qs.length-1,i)); CUR=i;
    const el=$('#eq'+i); if(!el) return;
    el.scrollIntoView({block:'center',behavior:'smooth'});
    $$('.exam-q').forEach(x=>x.classList.remove('cur'));
    el.classList.add('cur');
    paintMap(Object.keys(EXAM.picks).filter(k=>EXAM.picks[k]!==undefined).length);
    const f=el.querySelector('.opt:not([disabled])'); if(f) setTimeout(()=>f.focus({preventScroll:true}),220);
  };
  const currentFromScroll=()=>{
    const bar=$('#examBar'); const top=(bar?bar.getBoundingClientRect().bottom:0)+70;
    let best=0,bd=1e9;
    $$('.exam-q').forEach((el,i)=>{const d=Math.abs(el.getBoundingClientRect().top-top); if(d<bd){bd=d;best=i;}});
    return best;
  };
  const pickNth=n=>{
    const i=CUR, q=EXAM.qs[i], slot=$('#eqslot'+i); if(!slot) return;
    const t=qType(q);
    if(t==='mcq'){const b=slot.querySelectorAll('.opt')[n]; if(b) b.click();}
    else if(t==='multi'){const b=slot.querySelectorAll('.opt')[n]; if(b) b.click();}
    else if(t==='tf'){const b=slot.querySelector('[data-tf="'+(n===0?'1':'0')+'"]'); if(b) b.click();}
    else if(t==='num'){
      const inp=slot.querySelector('.numin');
      if(inp){ inp.focus(); inp.select&&inp.select(); toast('Câu này điền số — gõ đáp án rồi Enter'); }
    }
    else {const b=slot.querySelectorAll('.picktile')[n]; if(b) b.click();}
  };
  const onKey=e=>{
    if(!EXAM||EXAM.done) return;
    if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k=e.key;
    if(/^[1-4]$/.test(k)){e.preventDefault(); pickNth(+k-1);}
    else if(/^[a-dA-D]$/.test(k)){e.preventDefault(); pickNth('abcd'.indexOf(k.toLowerCase()));}
    else if(k==='ArrowDown'||k==='j'){e.preventDefault(); jumpTo(CUR+1);}
    else if(k==='ArrowUp'||k==='k'){e.preventDefault(); jumpTo(CUR-1);}
    else if(k==='f'||k==='F'){
      e.preventDefault(); EXAM.flags=EXAM.flags||{};
      const id=EXAM.qs[CUR].id; EXAM.flags[id]=!EXAM.flags[id];
      if(typeof examPersist==='function') examPersist(EXAM);
      paintMap(Object.keys(EXAM.picks).filter(x=>EXAM.picks[x]!==undefined).length);
      toast(EXAM.flags[id]?'Đã cắm cờ câu '+(CUR+1):'Bỏ cờ câu '+(CUR+1));
    }
    else if(k==='Enter'){
      e.preventDefault();
      let next=-1;
      for(let d=1;d<=EXAM.qs.length;d++){const i=(CUR+d)%EXAM.qs.length; if(!isAnswered(i)){next=i;break;}}
      jumpTo(next<0?CUR:next);
    }
  };
  document.addEventListener('keydown',onKey);
  const scroller=()=>{if(!EXAM||EXAM.done)return; CUR=currentFromScroll(); paintMap(Object.keys(EXAM.picks).filter(k=>EXAM.picks[k]!==undefined).length);};
  window.addEventListener('scroll',scroller,{passive:true});
  drawList();

  EXAM._cleanup=()=>{ document.removeEventListener('keydown',onKey); window.removeEventListener('scroll',scroller); clearInterval(EXAM.timer); };
  __examUnbind=EXAM._cleanup;
  function startClock(){
    const tick=()=>{
      if(!EXAM||EXAM.done) return;
      const left=EXAM_SEC-Math.floor((Date.now()-EXAM.t0)/1000);
      EXAM.left=Math.max(0,left);
      const m=String(Math.floor(EXAM.left/60)).padStart(2,'0'), s=String(EXAM.left%60).padStart(2,'0');
      const c=$('#clock'); if(!c) return;
      c.textContent=`${m}:${s}`;
      c.classList.toggle('warn',EXAM.left<=120);
      EXAM._tk=(EXAM._tk||0)+1;
      if(typeof examPersist==='function'&&EXAM._tk%5===0) examPersist(EXAM);
      if(EXAM.left<=0){ clearInterval(EXAM.timer); submit(true); }
    };
    clearInterval(EXAM.timer); EXAM.timer=setInterval(tick,1000); tick();
    return ()=>clearInterval(EXAM.timer);
  }

  function submit(auto){
    if(EXAM.done) return;
    EXAM.done=true; clearInterval(EXAM.timer);
    if(typeof examClear==='function') examClear();
    const bar=$('#examBar'); if(bar) bar.style.display='none';
    const rows=EXAM.qs.map(q=>{
      const p=EXAM.picks[q.id];
      const ok=isCorrect(q,p);
      if(typeof srsRecord==='function') srsRecord(q.id,ok,p);
      else state.ans[q.id]={ok:ok,p:p,at:Date.now()};
      return {q,ok,p};
    });
    const score=rows.filter(r=>r.ok).length;
    const byT={};
    rows.forEach(r=>{ const k=r.q.t; byT[k]=byT[k]||{n:0,ok:0}; byT[k].n++; if(r.ok) byT[k].ok++; });
    if(auto){
      try{ if(typeof chime==='function') chime(true); }catch(e){}
      toast('Hết giờ — đã tự nộp bài');
    }
    const rep={score,n:rows.length,byT,at:Date.now(),sec:EXAM_SEC-EXAM.left};
    state.runs=(state.runs||[]).concat(rep).slice(-20); save(); activity(3);
    EXAM.report={rows,rep,auto};
    showReport(rows,rep,auto);
  }

  function showReport(rows,rep,auto){
    const score=rep.score, byT=rep.byT;
    const pass=score>=rows.length*0.6;
    body.innerHTML=`
      <div class="exam-report">
        <div class="er-top">
          <div><span class="kicker">Kết quả</span><div class="er-score">${score}<span>/${rows.length}</span></div></div>
          <div class="er-verdict${pass?' ok':''}">${auto?'Hết giờ — tự nộp bài. ':''}${pass?'Đạt ngưỡng 60% · giữ nhịp này':'Dưới 60% · xem lại bảng chủ đề bên dưới'}</div>
        </div>
        <table class="er-tab"><thead><tr><th>Chủ đề</th><th>Đúng</th><th></th></tr></thead><tbody>
          ${Object.keys(byT).sort((a,b)=>a-b).map(k=>{
            const v=byT[k]; const pc=Math.round(v.ok/v.n*100);
            return `<tr><td>${topicName(+k)} · ${TOPICS.find(t=>t.id===+k)?TOPICS.find(t=>t.id===+k).name.replace(/<[^>]+>/g,''):''}</td>
              <td class="mono">${v.ok}/${v.n}</td>
              <td><span class="er-bar"><i style="width:${pc}%;background:${pc>=60?'var(--green)':'var(--accent)'}"></i></span></td></tr>`;
          }).join('')}
        </tbody></table>
        <div class="er-acts">
          <button class="btn" id="examAgain">Thi đề mới</button>
          <button class="btn ghost" id="examWrong">Luyện lại ${rows.filter(r=>!r.ok).length} câu sai</button>
          <a class="btn ghost" href="#/review">Vào hộp ôn cách quãng</a>
          <a class="btn ghost" href="#/stats">Xem toàn bộ tiến độ</a>
        </div>
        ${Object.keys(byT).filter(k=>byT[k].ok/byT[k].n<0.6).length?`<div class="er-weak">
          <span class="kicker">Chủ đề dưới 60% — luyện ngay</span>
          ${Object.keys(byT).filter(k=>byT[k].ok/byT[k].n<0.6).sort((a,b)=>byT[a].ok/byT[a].n-byT[b].ok/byT[b].n)
            .map(k=>`<button class="chip-btn" data-weak="${k}">${topicName(+k)} · ${Math.round(byT[k].ok/byT[k].n*100)}%</button>`).join('')}
        </div>`:''}
        <h3 class="er-h">Chữa từng câu</h3>
        ${rows.map((r,i)=>`<div class="exam-q${r.ok?' good':' bad'}">
          <div class="exam-qn"><span class="num">${i+1}</span><span class="qtype">${r.ok?'đúng':'sai'}</span></div>
          <div id="erslot${i}"></div></div>`).join('')}
      </div>`;
    rows.forEach((r,i)=>renderQuestion($('#erslot'+i),r.q,{picked:r.p,revealed:true}));
    $('#examAgain').onclick=()=>{ EXAM=null; if(typeof examClear==='function') examClear(); renderExam(); };
    const wb=$('#examWrong');
    if(wb) wb.onclick=()=>{ const bad=rows.filter(r=>!r.ok).map(r=>r.q); EXAM=null;
      if(typeof examClear==='function') examClear();
      drillQuestions(bad,'câu sai vừa làm'); };
    $$('[data-weak]').forEach(b=>b.onclick=()=>{ EXAM=null;
      if(typeof examClear==='function') examClear();
      drillExam([+b.dataset.weak],10,'chủ đề '+b.dataset.weak); });
    window.scrollTo({top:0,behavior:'smooth'});
  }

  $('#examSubmit').onclick=()=>{
    const n=Object.values(EXAM.picks).filter(v=>v!==undefined&&v!==null).length;
    if(!n) toast('Chưa chọn đáp án nào');
    submit(false);
  };
  $('#examReset').onclick=()=>{
    const answered=Object.keys(EXAM.picks||{}).length;
    if(answered && !confirm('Đang làm dở '+answered+' câu. Bốc đề mới sẽ bỏ hết đáp án đã chọn. Tiếp tục?')) return;
    EXAM=null; if(typeof examClear==='function') examClear(); renderExam(); toast('Đã bốc đề mới');
  };
}

/* =========================================================
   2 · REVIEW — luyện lại đúng những câu từng sai
========================================================= */
function renderReview(){
  const list=reviewList();
  const bx=typeof srsBoxes==='function'?srsBoxes():null;
  $('#main').innerHTML=`<section class="wrap">
    ${pageHead('Ôn cách quãng · hộp Leitner','Câu đến hạn được hỏi lại đúng lúc bạn sắp quên',
      list.length?`${list.length} câu đến hạn hôm nay. Trả lời đúng, câu lên hộp cao hơn (1 → 3 → 7 → 21 ngày); trả lời sai, câu về hộp 1 và gặp lại ngay.`
        :'Hôm nay không còn câu nào đến hạn. Làm một đề mới để mở rộng vùng lỗi.')}
    ${bx?`<div class="srs-strip">${bx.map((n,i)=>`<span class="${n?'':'dim'}"><b>${n}</b> ${['hộp 1 · hôm nay','hộp 2 · 1 ngày','hộp 3 · 3 ngày','hộp 4 · 7 ngày','hộp 5 · 21 ngày'][i]}</span>`).join('')}</div>`:''}
    <div id="revBody"></div>
  </section>`;
  const body=$('#revBody');
  if(!list.length){
    body.innerHTML=`<div class="empty-card"><p>Không còn câu đến hạn. Làm một đề thi thử để kiểm tra lại toàn bộ 12 chủ đề — câu sai sẽ tự vào hộp 1.</p>
      <a class="btn" href="#/exam">Thi thử 15 câu →</a></div>`;
    return;
  }
  let run=shuffle(list);
  let idx=0;
  const draw=()=>{
    if(idx>=run.length){
      const left=reviewList();
      if(left.length){ run=shuffle(left); idx=0; }
      else{
        body.innerHTML=`<div class="empty-card"><p>Đã sạch danh sách câu sai. Làm một đề mới để mở rộng vùng lỗi.</p><a class="btn" href="#/exam">Thi thử →</a></div>`;
        return;
      }
    }
    const q=run[idx];
    body.innerHTML=`
      <div class="qmeta"><span class="kicker">Câu ${idx+1} / ${run.length} · còn ${reviewList().length} câu đến hạn</span></div>
      <div id="revSlot"></div>
      <div class="qfoot"><span class="qscore">Nguồn: ${topicName(q.t)}</span>
        <span style="display:flex;gap:8px">
          <button class="btn ghost sm" id="revSkip">Bỏ qua</button>
          <button class="btn ghost sm" id="revNext">Câu tiếp →</button>
        </span></div>`;
    const slot=$('#revSlot');
    renderQuestion(slot,q,{revealed:false,picked:undefined,onAnswer:ok=>{
      const a=state.ans[q.id];
      if(a){
        const box=Math.min(4,a.box||0);
        toast(ok?`Đúng · lên hộp ${box+1}${SRS_DAYS[box]?` — ôn lại sau ${SRS_DAYS[box]} ngày`:' — ôn lại sau 21 ngày'}`
                :'Sai · về hộp 1, gặp lại ngay hôm nay');
      }
      setTimeout(()=>{ idx++; draw(); },1500);
    }});
    $('#revSkip').onclick=()=>{ idx++; draw(); };
    $('#revNext').onclick=()=>{ idx++; draw(); };
  };
  draw();
}

/* =========================================================
   3 · SOLVE — bài giải mẫu, mở dần từng bước
========================================================= */
function renderSolve(one){
  const list=SOLVE;
  if(one!==undefined&&!isNaN(one)&&list[one]) return renderSolveOne(one);
  $('#main').innerHTML=`<section class="wrap wide">
    ${pageHead(`Bài giải mẫu · ${list.length} bài`, 'Cách trình bày một bài tự luận', 'Mỗi bài mở dần theo bước: đọc đề → dựng lập luận → thay số → kết luận. Bấm từng bước để tự kiểm tra trước khi xem bước kế.')}
    <div class="solve-grid">
      ${list.map((x,i)=>`<a class="solve-card" href="#/solve/${i}">
        <span class="kicker">${topicName(x.t)}</span>
        <h3>${esc(x.title)}</h3>
        <p>${esc(x.problem).slice(0,120)}…</p>
        <span class="solve-more">${x.steps.length} bước →</span>
      </a>`).join('')}
    </div>
  </section>`;
}

function renderSolveOne(i){
  const x=SOLVE[i];
  $('#main').innerHTML=`<section class="wrap">
    <div class="crumb"><a href="#/solve">Bài giải mẫu</a><span>/</span><span>Bài ${i+1}</span></div>
    <div class="solve-head">
      <span class="kicker">${topicName(x.t)}</span>
      <h1>${esc(x.title)}</h1>
    </div>
    <div class="solve-prob"><div class="kicker">Đề bài</div><p>${esc(x.problem)}</p></div>
    <div class="solve-steps" id="steps"></div>
    <div class="solve-foot">
      <button class="btn" id="revealAll">Mở tất cả các bước</button>
      <span class="kicker" id="stepCnt">0 / ${x.steps.length} bước</span>
    </div>
    <div class="solve-ans" id="ans" hidden>
      <div class="kicker">Kết luận</div><p>${esc(x.answer)}</p>
    </div>
    <div class="lesson-nav">
      ${i>0?`<a class="lnav-btn" href="#/solve/${i-1}"><span class="kicker">← Bài trước</span><span>${esc(SOLVE[i-1].title)}</span></a>`:'<span></span>'}
      ${i<SOLVE.length-1?`<a class="lnav-btn r" href="#/solve/${i+1}"><span class="kicker">Bài tiếp →</span><span>${esc(SOLVE[i+1].title)}</span></a>`:''}
    </div>
  </section>`;
  const host=$('#steps');
  const render=()=>{
    host.innerHTML=x.steps.map((s,k)=>`<div class="sstep${k<x.steps.length?'':''}" data-k="${k}">
      <div class="sstep-n">Bước ${k+1}</div>
      <div class="sstep-b">${k<x.steps.length?'':''}${esc(s)}</div></div>`).join('');
  };
  render();
  let open=1;
  const paint=()=>{
    $$('.sstep',host).forEach((el,k)=>{
      el.classList.toggle('open',k<open);
    });
    $('#stepCnt').textContent=`${open} / ${x.steps.length} bước`;
    const ans=$('#ans');
    if(open>=x.steps.length){ ans.hidden=false; }
    const b=$('#revealAll');
    b.textContent=open>=x.steps.length?'Thu gọn':'Mở tất cả các bước';
  };
  $$('.sstep',host).forEach(el=>{
    el.onclick=()=>{
      const k=+el.dataset.k;
      open = k<open ? Math.max(1,k) : k+1;
      paint();
    };
  });
  $('#revealAll').onclick=()=>{ open=open>=x.steps.length?1:x.steps.length; paint(); };
  paint();
}

/* =========================================================
   4 · FLASH — flashcard công thức
========================================================= */
function renderFlash(){
  const cards=[];
  NOTES.forEach(b=>b.rows.forEach(([k,v])=>cards.push({b:b.name,k,v})));
  $('#main').innerHTML=`<section class="wrap">
    ${pageHead(`Flashcard · ${cards.length} công thức`,'Lật thẻ để nhớ công thức','Nhìn tên đại lượng, tự đọc công thức rồi bấm để lật. Nút xáo trộn đổi thứ tự để không học thuộc theo vị trí.')}
    <div class="flash-bar">
      <span class="kicker" id="flashCnt">1 / ${cards.length}</span>
      <div style="display:flex;gap:8px">
        <button class="btn ghost sm" id="flashShuffle">Xáo trộn</button>
        <button class="btn ghost sm" id="flashPrev">←</button>
        <button class="btn ghost sm" id="flashNext">→</button>
      </div>
    </div>
    <div class="flash-wrap"><button class="flash" id="flashCard" aria-label="Lật thẻ">
      <div class="flash-in">
        <div class="flash-front"><span class="kicker" id="flashGroup"></span><div class="flash-q" id="flashQ"></div><span class="flash-hint">bấm để xem công thức</span></div>
        <div class="flash-back"><span class="kicker">Công thức</span><div class="flash-f" id="flashF"></div><span class="flash-hint">bấm để lật lại</span></div>
      </div></button></div>
  </section>`;
  let order=shuffle(cards.map((_,i)=>i)), pos=0;
  const draw=()=>{
    const c=cards[order[pos]];
    $('#flashGroup').innerHTML=c.b;
    $('#flashQ').textContent=c.k;
    $('#flashF').innerHTML=c.v;
    $('#flashCnt').textContent=`${pos+1} / ${cards.length}`;
    $('#flashCard').classList.remove('flip');
  };
  $('#flashCard').onclick=()=>$('#flashCard').classList.toggle('flip');
  $('#flashShuffle').onclick=()=>{order=shuffle(order);pos=0;draw();toast('Đã xáo trộn');};
  $('#flashNext').onclick=()=>{pos=(pos+1)%cards.length;draw();};
  $('#flashPrev').onclick=()=>{pos=(pos-1+cards.length)%cards.length;draw();};
  draw();
}

/* =========================================================
   5 · STATS — bảng tiến độ
========================================================= */
function renderStats(){
  const st=answerStats();
  const byT={};
  ALLQ.forEach(q=>{const k=q.t;byT[k]=byT[k]||{n:0,seen:0,ok:0};byT[k].n++;const a=state.ans[q.id];if(a){byT[k].seen++;if(a.ok)byT[k].ok++;}});
  const runs=(state.runs||[]).slice().reverse();
  $('#main').innerHTML=`<section class="wrap wide">
    ${pageHead('Tiến độ','Toàn bộ số liệu học tập của bạn','Lưu trong trình duyệt này. Không có tài khoản, không gửi dữ liệu đi đâu.')}
    <div class="stats stats-4">
      <div class="stat"><div class="k">Ca đã học</div><div class="v">${doneCount()} / ${TOTAL_SESS}</div></div>
      <div class="stat"><div class="k">Câu đã làm</div><div class="v">${st.n} / ${ALLQ.length}</div></div>
      <div class="stat"><div class="k">Đúng</div><div class="v">${st.n?Math.round(st.ok/st.n*100):0}<small>%</small></div></div>
      <div class="stat"><div class="k">Chuỗi ngày</div><div class="v">${streak()}<small> ngày</small></div></div>
    </div>
    ${typeof heatStrip==='function'?heatStrip(14):''}
    ${typeof planCard==='function'?planCard():''}
    <h2 class="sec-h">Theo chủ đề</h2>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Chủ đề</th><th>Đã làm</th><th>Đúng</th><th>Tỉ lệ</th></tr></thead>
      <tbody>${Object.keys(byT).sort((a,b)=>a-b).map(k=>{
        const v=byT[k], pc=v.seen?Math.round(v.ok/v.seen*100):0;
        return `<tr><td>${topicName(+k)}</td><td class="mono">${v.seen}/${v.n}</td><td class="mono">${v.ok}</td>
          <td><span class="er-bar"><i style="width:${pc}%;background:${pc>=60?'var(--green)':'var(--accent)'}"></i></span> <span class="mono">${pc}%</span></td></tr>`;
      }).join('')}</tbody></table></div>
    <h2 class="sec-h">Lượt thi thử</h2>
    ${runs.length?`<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>#</th><th>Thời điểm</th><th>Điểm</th><th>Tỉ lệ</th><th>Thời gian</th></tr></thead><tbody>
      ${runs.map((r,i)=>`<tr><td class="mono">${runs.length-i}</td><td>${new Date(r.at).toLocaleString('vi-VN')}</td>
        <td class="mono">${r.score}/${r.n}</td>
        <td><span class="er-bar"><i style="width:${Math.round(r.score/r.n*100)}%;background:${r.score/r.n>=0.6?'var(--green)':'var(--accent)'}"></i></span></td>
        <td class="mono">${Math.floor(r.sec/60)}:${String(r.sec%60).padStart(2,'0')}</td></tr>`).join('')}
      </tbody></table></div>`:'<p class="muted">Chưa có lượt thi thử nào. <a href="#/exam">Bắt đầu 15 câu →</a></p>'}
  </section>`;
}

/* =========================================================
   6 · NOTE — ghi chú riêng từng ca
========================================================= */
function noteHTML(d,s){
  const k=`d${d.n}s${s.n}`;
  const v=state.note[k]||'';
  return `<section class="mynote">
    <div class="mynote-h"><span class="kicker">Ghi chú của bạn · ca này</span>
      <span class="mynote-st" id="noteSt">${v?'đã lưu':'trống'}</span></div>
    <textarea id="noteBox" rows="4" placeholder="Chỗ chưa hiểu, công thức cần nhớ, bài tập phải làm lại…">${esc(v)}</textarea>
    <div class="mynote-f"><span>Tự lưu khi ngừng gõ · chỉ ở trình duyệt này</span>
      <button class="btn ghost sm" id="noteDel">Xoá</button></div>
  </section>`;
}
function mountNote(d,s){
  const box=$('#noteBox'); if(!box) return;
  const k=`d${d.n}s${s.n}`;
  box.oninput=()=>{
    const v=box.value.trim();
    if(v) state.note[k]=box.value; else delete state.note[k];
    save();
    const st=$('#noteSt'); if(st) st.textContent=v?'đã lưu':'trống';
  };
  $('#noteDel').onclick=()=>{
    box.value=''; delete state.note[k]; save();
    const st=$('#noteSt'); if(st) st.textContent='trống';
  };
}

/* =========================================================
   7 · HOME PANEL — dải công cụ dưới hero
========================================================= */
function mountHomeTools(){
  const host=$('#toolsMount'); if(!host) return;
  const st=answerStats(), wr=wrongList().length;
  host.innerHTML=`
    <div class="toolbar">
      <a class="tool" href="#/calc"><span class="kicker">00 · Máy giải</span><h3>Nhập số liệu → ra lời giải</h3><p>16 dạng bài điện – quang – cơ – nhiệt – từ, tự vẽ hình theo tỉ lệ.</p></a>
      <a class="tool" href="#/build"><span class="kicker">01 · Mạch tự dựng</span><h3>Thêm bớt R tuỳ ý</h3><p>Lồng nối tiếp – song song bao nhiêu tầng cũng được, tự vẽ và tự giải.</p></a>
      <a class="tool" href="#/lab"><span class="kicker">02 · Phòng thí nghiệm</span><h3>Bốn bàn thực hành</h3><p>Đo điện trở bằng vôn–ampe kế, đo tiêu cự, đo lực đẩy Archimedes, trộn nước nóng lạnh.</p></a>
      <a class="tool" href="#/papers"><span class="kicker">03 · Ngân hàng đề</span><h3>${PAPER_BANK.length} bộ đề có nguồn</h3><p>Chuyên Lý các tỉnh, HSG nhiều năm, chuyên đề thực nghiệm — lọc và luyện theo phổ đề.</p></a>
      <a class="tool" href="#/exam"><span class="kicker">04 · Thi thử</span><h3>Đề 15 câu · 20 phút</h3><p>Bốc ngẫu nhiên đủ 12 chủ đề, nộp bài có bảng điểm từng chủ đề.</p></a>
      <a class="tool" href="#/review"><span class="kicker">05 · Luyện câu sai</span><h3>${wr?wr+' câu đang chờ':'Chưa có lỗi nào'}</h3><p>Đúng một câu thì gỡ khỏi danh sách — lặp lại cách quãng.</p></a>
      <a class="tool" href="#/solve"><span class="kicker">06 · Bài giải mẫu</span><h3>${SOLVE.length} bài tự luận</h3><p>Từng bước mở dần, đúng cách trình bày bài thi chuyên.</p></a>
      <a class="tool" href="#/flash"><span class="kicker">07 · Flashcard</span><h3>${NOTES.reduce((a,b)=>a+b.rows.length,0)} công thức</h3><p>Lật thẻ, xáo trộn, nhớ công thức trước khi vào đề.</p></a>
      <a class="tool" href="#/sheet"><span class="kicker">08 · Phiếu in</span><h3>Tạo đề cho cả lớp</h3><p>Chọn chủ đề, dạng câu, mã đề — in ra phiếu sạch kèm đáp án.</p></a>
      <a class="tool" href="#/stats"><span class="kicker">09 · Tiến độ</span><h3>${st.n} câu đã làm · ${st.n?Math.round(st.ok/st.n*100):0}% đúng</h3><p>Bảng theo chủ đề, chuỗi ngày và lịch sử thi thử.</p></a>
    </div>`;
}
