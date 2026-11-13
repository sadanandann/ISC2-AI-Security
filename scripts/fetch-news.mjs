// Fetches AI security news feeds and writes news.json. Node 20+, no dependencies.
import {writeFileSync,readFileSync,existsSync} from "node:fs";
// [name, url, alwaysRelevant] - general feeds are filtered by the AI keywords below
const FEEDS=[
["OWASP GenAI Security Project","https://genai.owasp.org/feed/",1],
["Embrace The Red","https://embracethered.com/blog/index.xml",1],
["EU AI Act Newsletter","https://artificialintelligenceact.substack.com/feed",1],
["Simon Willison","https://simonwillison.net/atom/everything/",0],
["NIST News","https://www.nist.gov/news-events/news/rss.xml",0],
["CISA News","https://www.cisa.gov/news.xml",0],
["Schneier on Security","https://www.schneier.com/feed/atom/",0],
["Google Security Blog","https://security.googleblog.com/feeds/posts/default",0],
["Microsoft Security Blog","https://www.microsoft.com/en-us/security/blog/feed/",0],
["The Hacker News","https://feeds.feedburner.com/TheHackersNews",0],
["BleepingComputer","https://www.bleepingcomputer.com/feed/",0],
["Dark Reading","https://www.darkreading.com/rss.xml",0]];
const AI=/\b(ai|a\.i\.|artificial intelligence|genai|generative|llms?|machine learning|ml model|chatbots?|agentic|ai agents?|prompt injection|jailbreak|deepfakes?|copilot|chatgpt|claude|gemini|openai|anthropic|mcp|model context protocol|ai act|iso.?42001|ai rmf|hugging ?face)\b/i;
const ent=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#0?39;|&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&amp;/g,"&");
const text=s=>ent(ent(s||"")).replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const tag=(x,t)=>(x.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`,"i"))||[])[1]||"";
export function parse(xml,src,all){const out=[];
 for(const m of xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)){const x=m[0];
  const title=text(tag(x,"title"));let link=text(tag(x,"link"));
  if(!/^https?:/.test(link))link=ent((x.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)/i)||x.match(/<link[^>]*href=["']([^"']+)/i)||[])[1]||"");
  const d=new Date(text(tag(x,"pubDate")||tag(x,"published")||tag(x,"updated")||tag(x,"dc:date")));
  const sum=text(tag(x,"description")||tag(x,"summary")||tag(x,"content")).slice(0,280);
  if(!title||!/^https?:\/\//.test(link)||isNaN(d))continue;
  if(!all&&!AI.test(title+" "+sum))continue;
  out.push({title,link,date:d.toISOString(),source:src,summary:sum})}
 return out}
if(process.argv[1]&&process.argv[1].endsWith("fetch-news.mjs")){
 const items=[],status={};
 await Promise.all(FEEDS.map(async([n,u,all])=>{try{
   const r=await fetch(u,{headers:{"user-agent":"Mozilla/5.0 (compatible; rss-reader)",accept:"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"},signal:AbortSignal.timeout(20000)});
   if(!r.ok)throw new Error("HTTP "+r.status);const got=parse(await r.text(),n,all);items.push(...got);status[n]=got.length}
  catch(e){status[n]="failed: "+e.message}}));
 console.log(status);
 const cut=Date.now()-60*864e5,seen=new Set();
 let list=items.filter(i=>new Date(i.date)>cut&&new Date(i.date)<Date.now()+864e5&&!seen.has(i.link)&&seen.add(i.link)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,80);
 // keep the previous file if every feed failed, so the page never goes blank
 if(!list.length&&existsSync("news.json")){console.log("no items fetched; keeping existing news.json");process.exit(0)}
 writeFileSync("news.json",JSON.stringify({updated:new Date().toISOString(),status,items:list},null,1)+"\n")}
