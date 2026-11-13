const $=s=>document.querySelector(s),esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const KEY="isc2ai",S=Object.assign({done:{},notes:{},q:{},seen:{},known:{}},JSON.parse(localStorage.getItem(KEY)||"{}"));
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const START=new Date(2026,10,13),EXAM=new Date(2026,11,15),DAY=864e5;
const date=i=>new Date(START.getTime()+i*DAY),fmt=d=>d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
const now=new Date();now.setHours(0,0,0,0);const todayIdx=Math.round((now-START)/DAY);
const names=Object.keys(SOURCES).sort((a,b)=>b.length-a.length);
function link(t){const hold=[];names.forEach(n=>{t=t.split(n).join("\u0001"+(hold.push(n)-1)+"\u0002")});
 return esc(t).replace(/\u0001(\d+)\u0002/g,(_,i)=>`<a href="${SOURCES[hold[i]]}" target="_blank" rel="noopener">${esc(hold[i])}</a>`)}
const tags=ts=>ts?ts.split(" ").map(t=>`<span class="tag" title="${TASKS[t]}">${t}</span>`).join(""):'<span class="tag">Review</span>';
const bar=p=>`<div class="bar"><i style="width:${Math.round(p*100)}%"></i></div>`;
const stats=()=>{const st={};for(let d=1;d<=6;d++)st[d]=[0,0];QUIZ.forEach((q,i)=>{const r=S.q[i];if(r){st[q[0]][0]+=r[0];st[q[0]][1]+=r[1]}});return st};
const VIEWS={Today:today,Plan:plan,Tasks:tasks,Quiz:quiz,Cards:cards,"ML Lab":lab,Sources:sources,News:news};let view="Today";
function go(v){view=v;$("#nav").innerHTML=Object.keys(VIEWS).map(k=>`<button class="${k==v?"on":""}" onclick="go('${k}')">${k}</button>`).join("");
 const n=Object.values(S.done).filter(Boolean).length,left=Math.ceil((EXAM-now)/DAY);
 $("#sub").textContent="32-day study plan, 13 Nov to 14 Dec 2026, 2 hours a day";
 $("#ring").innerHTML=`${left>0?left+" days to exam":left==0?"Exam day":"Exam passed"}<small>${n}/32 days done</small>`;VIEWS[v]()}
function dayCard(i,open){const d=DAYS[i],dn=S.done[i];
 return `<div class="card ${i==todayIdx?"today":""} ${dn&&!open?"done":""}"><div class="row"><label class="grow"><input type="checkbox" ${dn?"checked":""} onchange="S.done[${i}]=this.checked;save();go(view)"> <b>Day ${i+1}, ${fmt(date(i))}</b></label><span class="mute">${d[0]<7?"Domain "+d[0]:"Final review"}</span></div>
 <div>${tags(d[1])}</div><h3>Hour 1: learn</h3><div>${link(d[2])}</div><h3>Hour 2: recall</h3><div>${link(d[3])}</div>
 <details ${S.notes[i]||open?"open":""}><summary>My notes</summary><textarea rows="4" placeholder="Write what you remember, in your own words" oninput="S.notes[${i}]=this.value;save()">${esc(S.notes[i]||"")}</textarea></details></div>`}
function today(){const i=Math.min(Math.max(todayIdx,0),31),st=stats(),weak=Object.keys(st).sort((a,b)=>ML.mastery(...st[a])-ML.mastery(...st[b]))[0];
 const late=[];for(let k=0;k<Math.min(todayIdx,32);k++)if(!S.done[k])late.push(k);
 $("#main").innerHTML=(todayIdx<0?`<div class="card">The plan starts on ${fmt(START)}. Day 1 is shown below.</div>`:todayIdx>31?`<div class="card"><b>${todayIdx==32?"Exam day. No new material.":"The plan has ended."}</b></div>`:"")+dayCard(i,1)+
 `<div class="card"><h2>Readiness by domain</h2><p class="mute">Estimated from your quiz answers. Weakest now: Domain ${weak}.</p>${[1,2,3,4,5,6].map(d=>`<div class="row"><span class="w">D${d} ${st[d][0]}/${st[d][0]+st[d][1]}</span>${bar(st[d][0]+st[d][1]?ML.mastery(...st[d]):0)}</div>`).join("")}<p><button class="pri" onclick="go('Quiz')">Practise weak areas</button></p></div>`+
 (late.length?`<div class="card"><h2>Catch up</h2>${late.map(k=>`<button onclick="go('Plan');document.getElementById('d${k}').scrollIntoView()">Day ${k+1}, ${fmt(date(k))}</button>`).join(" ")}</div>`:"")}
function plan(){let h="",cur=0;DAYS.forEach((d,i)=>{if(d[0]!=cur){cur=d[0];h+=`<h2 style="margin-top:22px">${cur<7?"Domain "+cur+": ":""}${DOMAINS[cur]}</h2>`}h+=`<div id="d${i}">${dayCard(i)}</div>`});
 $("#main").innerHTML=h+`<div class="card"><b>Tuesday 15 December 2026: exam day.</b> No new material.</div>`}
function tasks(){$("#main").innerHTML=`<div class="card"><h2>Coverage: all 41 official tasks</h2><table><tr><th>Task</th><th>Title</th><th>Study day(s)</th><th></th></tr>${Object.keys(TASKS).map(t=>{const ds=DAYS.map((d,i)=>d[1].split(" ").includes(t)?i:-1).filter(i=>i>=0);
 return `<tr><td>${t}</td><td>${TASKS[t]}</td><td>${ds.map(i=>fmt(date(i))).join(", ")}</td><td>${ds.every(i=>S.done[i])?"Done":""}</td></tr>`}).join("")}</table></div>`}
let qi=-1;
function quiz(pick){const st=stats();if(pick||qi<0){const d=+ML.pickWeak(st),pool=QUIZ.map((q,i)=>i).filter(i=>QUIZ[i][0]==d&&i!=qi);
  pool.sort((a,b)=>(S.seen[a]||0)-(S.seen[b]||0)||Math.random()-.5);qi=pool[0]}
 const q=QUIZ[qi],tot=Object.values(st).reduce((a,x)=>a+x[0]+x[1],0),ok=Object.values(st).reduce((a,x)=>a+x[0],0);
 $("#main").innerHTML=`<div class="card"><div class="row"><span class="tag">Domain ${q[0]}</span><span class="mute grow">${DOMAINS[q[0]]}</span><span class="mute">${ok}/${tot} correct</span></div>
 <h2 style="margin-top:10px">${esc(q[1])}</h2>${q[2].map((o,k)=>`<button class="opt" onclick="ans(${k})">${esc(o)}</button>`).join("")}<div id="why"></div></div>
 <p class="mute">Adaptive: the next question is drawn more often from domains where your answers are weaker (Thompson sampling). <a href="#" onclick="if(confirm('Clear all quiz results?')){S.q={};S.seen={};save();quiz(1)}return false">Reset quiz results</a></p>`}
function ans(k){const q=QUIZ[qi],good=k==q[3],r=S.q[qi]=S.q[qi]||[0,0];r[good?0:1]++;S.seen[qi]=(S.seen[qi]||0)+1;save();
 document.querySelectorAll(".opt").forEach((b,i)=>{b.disabled=true;if(i==q[3])b.classList.add("ok");else if(i==k)b.classList.add("no")});
 $("#why").innerHTML=`<p><b>${good?"Correct.":"Not quite."}</b> ${esc(q[4])}</p><button class="pri" onclick="quiz(1)">Next question</button>`}
let ci=0,face=0;
function cards(){const c=CARDS[ci];$("#main").innerHTML=`<div class="card"><div class="row"><span class="tag">Domain ${c[0]}</span><span class="mute grow">Card ${ci+1} of ${CARDS.length}${S.known[ci]?", marked known":""}</span></div>
 <div class="flip" onclick="face^=1;cards()">${face?esc(c[2]):"<b>"+esc(c[1])+"</b>"}</div><p class="mute" style="text-align:center">Tap the card to flip</p>
 <div class="row"><button onclick="nextCard(0)">Still learning</button><button class="pri" onclick="nextCard(1)">I know this</button></div></div>`}
function nextCard(k){S.known[ci]=k;save();face=0;let n=ci;for(let j=1;j<=CARDS.length;j++){n=(ci+j)%CARDS.length;if(!S.known[n])break}ci=n==ci?(ci+1)%CARDS.length:n;cards()}
let search,clf;
function build(){if(search)return;{const docs=[];DAYS.forEach((d,i)=>docs.push({t:`Day ${i+1}, ${fmt(date(i))}`,text:d[1].split(" ").map(t=>TASKS[t]||"").join(" ")+" "+d[2]+" "+d[3],go:`go('Plan');document.getElementById('d${i}').scrollIntoView()`}));
  for(const n in SOURCES)docs.push({t:n,text:n,url:SOURCES[n]});CARDS.forEach(c=>docs.push({t:c[1]+": "+c[2],text:c[1]+" "+c[2]}));search=ML.index(docs);
  const tr=[];for(const t in TASKS)tr.push([t[0],TASKS[t]+" "+TASKS[t]]);DAYS.forEach(d=>d[0]<7&&tr.push([d[0],d[2]+" "+d[3]]));QUIZ.forEach(q=>tr.push([q[0],q[1]+" "+q[2][q[3]]+" "+q[4]]));CARDS.forEach(c=>tr.push([c[0],c[1]+" "+c[2]]));clf=ML.nb(tr)}}
function lab(){build();
 $("#main").innerHTML=`<div class="card"><h2>Smart search</h2><p class="mute">Ranks plan days, sources and flashcards by TF-IDF similarity to your words.</p><input type="text" id="sq" placeholder="e.g. poisoning evidence rollback" oninput="doSearch()"><div id="sr"></div></div>
 <div class="card"><h2>Which domain is this?</h2><p class="mute">Paste a scenario or a topic. A Naive Bayes classifier trained in your browser on the plan's text estimates the exam domain. It is a study aid and can be wrong on short or unusual text.</p><textarea id="cq" rows="3" placeholder="e.g. An agent with access to payments acts on instructions hidden in a retrieved web page" oninput="doClf()"></textarea><div id="cr"></div></div>
 <div class="card"><h2>How it works</h2><p class="mute">All three models (search, classifier, adaptive quiz) are plain JavaScript in <code>ml.js</code>. They run on your device; no data is sent anywhere.</p></div>`}
function doSearch(){const r=search($("#sq").value);$("#sr").innerHTML=r.map(({d,s})=>`<div class="row" style="margin-top:8px"><span class="grow">${d.url?`<a href="${d.url}" target="_blank" rel="noopener">${esc(d.t)}</a>`:d.go?`<a href="#" onclick="${d.go};return false">${esc(d.t)}</a>`:esc(d.t)}</span><span class="mute">${s.toFixed(2)}</span></div>`).join("")||($("#sq").value?'<p class="mute">No match.</p>':"")}
function doClf(){const r=clf($("#cq").value);$("#cr").innerHTML=!r?($("#cq").value?'<p class="mute">No known words yet; add more detail.</p>':""):r.probs.map(([d,p])=>`<div class="row" style="margin-top:6px"><span class="w">D${d} ${Math.round(p*100)}%</span>${bar(p)}</div>`).join("")+`<p class="mute">Top match: Domain ${r.probs[0][0]}, ${DOMAINS[r.probs[0][0]]}.</p>`}
function sources(){$("#main").innerHTML=`<div class="card"><h2>All sources (free, public)</h2><table>${Object.keys(SOURCES).map(n=>`<tr><td><a href="${SOURCES[n]}" target="_blank" rel="noopener">${esc(n)}</a></td></tr>`).join("")}</table></div>`}
let NEWS,nf="",ns="";
async function news(){$("#main").innerHTML='<div class="card">Loading news…</div>';build();
 if(!NEWS)try{NEWS=await(await fetch("news.json?"+Date.now())).json()}catch(e){NEWS=0}
 if(view!="News")return;
 if(!NEWS||!NEWS.items.length){NEWS=null;$("#main").innerHTML='<div class="card"><h2>AI security news</h2><p>No news has been fetched yet. The feed is refreshed by a scheduled GitHub Action every 6 hours; check the Actions tab of the repository if this persists.</p></div>';return}
 NEWS.items.forEach(i=>{if(i.dom===undefined){const r=clf(i.title+" "+i.summary);i.dom=r&&r.probs[0][1]>.6?r.probs[0][0]:0}});
 const srcs=[...new Set(NEWS.items.map(i=>i.source))].sort();
 $("#main").innerHTML=`<div class="card"><h2>AI security news</h2><p class="mute">Updated ${new Date(NEWS.updated).toLocaleString("en-GB")} from ${srcs.length} feeds, refreshed every 6 hours. Domain tags are guesses by the in-browser classifier.</p>
 <div class="row"><input type="text" class="grow" style="width:auto" placeholder="Filter, e.g. agent, EU AI Act, NIST" value="${esc(nf)}" oninput="nf=this.value;newsList()"><select onchange="ns=this.value;newsList()"><option value="">All sources</option>${srcs.map(s=>`<option ${s==ns?"selected":""}>${esc(s)}</option>`).join("")}</select></div></div><div id="nl"></div>`;newsList()}
function newsList(){const q=nf.toLowerCase(),L=NEWS.items.filter(i=>(!ns||i.source==ns)&&(!q||(i.title+" "+i.summary+" "+i.source).toLowerCase().includes(q)));
 $("#nl").innerHTML=L.map(i=>`<div class="card"><a href="${esc(i.link)}" target="_blank" rel="noopener noreferrer"><b>${esc(i.title)}</b></a><div class="mute">${esc(i.source)}, ${fmt(new Date(i.date))} ${i.dom?`<span class="tag" title="${DOMAINS[i.dom]}">Domain ${i.dom}?</span>`:""}</div><div>${esc(i.summary)}</div></div>`).join("")||'<div class="card mute">No items match.</div>'}
go("Today");
