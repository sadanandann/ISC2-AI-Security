// Small in-browser ML, no libraries, nothing leaves the device.
const ML=(()=>{
const STOP=new Set("the a an and or of to in on for with from is are be as at by it this that your you then plus each one what which how do does read write list make draw table day self quiz pdf".split(" "));
const tok=s=>(s.toLowerCase().match(/[a-z][a-z0-9-]+/g)||[]).filter(w=>w.length>2&&!STOP.has(w)).map(w=>w.replace(/(ing|s)$/,""));
// 1. TF-IDF search with cosine similarity
function index(docs){const df={},vs=docs.map(d=>{const tf={};tok(d.text).forEach(w=>tf[w]=(tf[w]||0)+1);for(const w in tf)df[w]=(df[w]||0)+1;return tf});
 const idf=w=>Math.log(1+docs.length/(df[w]||0.5));
 const vec=tf=>{let n=0;const v={};for(const w in tf){v[w]=(1+Math.log(tf[w]))*idf(w);n+=v[w]**2}n=Math.sqrt(n)||1;for(const w in v)v[w]/=n;return v};
 const V=vs.map(vec);
 return q=>{const tf={};tok(q).forEach(w=>tf[w]=(tf[w]||0)+1);const qv=vec(tf);
  return docs.map((d,i)=>{let s=0;for(const w in qv)if(V[i][w])s+=qv[w]*V[i][w];return{d,s}}).filter(r=>r.s>0.02).sort((a,b)=>b.s-a.s).slice(0,8)}}
// 2. Multinomial Naive Bayes: text -> exam domain
function nb(samples){const C={},N={},P={},vocab=new Set();let tot=0;
 samples.forEach(([c,t])=>{C[c]=C[c]||{};P[c]=(P[c]||0)+1;tot++;tok(t).forEach(w=>{C[c][w]=(C[c][w]||0)+1;N[c]=(N[c]||0)+1;vocab.add(w)})});
 return text=>{const ws=tok(text).filter(w=>vocab.has(w));if(!ws.length)return null;
  const ls=Object.keys(C).map(c=>[c,Math.log(P[c]/tot)+ws.reduce((a,w)=>a+Math.log(((C[c][w]||0)+1)/(N[c]+vocab.size)),0)]);
  const m=Math.max(...ls.map(x=>x[1])),z=ls.reduce((a,x)=>a+Math.exp(x[1]-m),0);
  return{probs:ls.map(([c,l])=>[+c,Math.exp(l-m)/z]).sort((a,b)=>b[1]-a[1]),words:ws}}}
// 3. Beta-Bernoulli mastery model + Thompson sampling to choose the next quiz domain
const gamma=k=>{let s=0;for(let i=0;i<k;i++)s-=Math.log(Math.random()||1e-9);return s}; // integer shape
const betaSample=(a,b)=>{const x=gamma(a),y=gamma(b);return x/(x+y)};
const mastery=(r,w)=>(r+1)/(r+w+2);
const pickWeak=stats=>Object.keys(stats).map(d=>[d,betaSample(stats[d][0]+1,stats[d][1]+1)]).sort((a,b)=>a[1]-b[1])[0][0];
return{index,nb,mastery,pickWeak}})();
