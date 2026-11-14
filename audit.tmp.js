const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errs.push(e.message)});
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{runScripts:'dangerously',url:'http://localhost/x.html',pretendToBeVisual:true,virtualConsole:vc});
const w=dom.window;w.scrollTo=()=>{};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await wait(800);
 w.location.hash='#/physics'; await wait(250);
 const m=w.document.querySelector('#main');
 console.log('rendered:', m.innerHTML.length);
 console.log('ring:', !!m.querySelector('.ph-ring svg'));
 console.log('pct:', (m.querySelector('.ph-ring-t b')||{}).textContent);
 console.log('phase bars:', m.querySelectorAll('.ph-phase').length);
 console.log('tool groups:', m.querySelectorAll('.ph-group').length, '| tools:', m.querySelectorAll('.ph-tool').length);
 console.log('next session:', (m.querySelector('.ph-next-t')||{}).textContent);
 console.log('hero:', (m.querySelector('.ph-hero h1')||{}).textContent);
 console.log('errors:', errs.length, errs.slice(0,2));
 // weak topics with seeded answers
 w.eval(`state.ans[0]={ok:false};state.ans[1]={ok:false};state.ans[2]={ok:false};state.ans[3]={ok:true};save();`);
 w.location.hash='#/__b__'; await wait(20); w.location.hash='#/physics'; await wait(250);
 const weak=w.document.querySelectorAll('.ph-weak');
 console.log('weak rows after seeding:', weak.length, weak.length?weak[0].textContent.replace(/\s+/g,' ').trim():'');
 process.exit(0);
})();
