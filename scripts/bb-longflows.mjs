#!/usr/bin/env node
// Long, realistic Browserbase journeys (3–10 minutes per session)
// Usage: node scripts/bb-longflows.mjs --n 4 --engine gm --minutes 3

import { Stagehand } from '@browserbasehq/stagehand'
import { execSync } from 'node:child_process'

function arg(k, d) { const i = process.argv.indexOf(`--${k}`); return i>=0 && process.argv[i+1] ? process.argv[i+1] : d }
const N = parseInt(arg('n', process.env.BB_LONG_N || '4'), 10)
const ENGINE = arg('engine', process.env.RUNNER_ENGINE || 'gm')
const MINUTES = parseFloat(arg('minutes', process.env.BB_LONG_MINUTES || '3'))
const SOFT_DELAY = parseInt(arg('delay', process.env.BB_LONG_DELAY_MS || '900'), 10)

function resolveModel(engine){ switch((engine||'').toLowerCase()){ case 'gm':return process.env.SMOKE_MODEL||'google/gemini-2.5-flash-preview-05-20'; case 'cc':return process.env.SMOKE_MODEL||'anthropic/claude-3-5-sonnet-20240620'; case 'c': default: return process.env.SMOKE_MODEL||(process.env.OPENAI_API_KEY?'openai/gpt-4o-mini':'google/gemini-2.5-flash-preview-05-20')} }
function resolveApiKey(engine){ const m=(engine||'').toLowerCase(); if(m==='gm'&&process.env.GOOGLE_API_KEY)return process.env.GOOGLE_API_KEY; if(m==='cc'&&process.env.ANTHROPIC_API_KEY)return process.env.ANTHROPIC_API_KEY; return process.env.OPENAI_API_KEY||process.env.GOOGLE_API_KEY||process.env.ANTHROPIC_API_KEY }
const baseUrl = process.env.SMOKE_URL || 'https://bob.newth.ai'

async function sleep(ms){ return new Promise(r=>setTimeout(r,ms)) }

async function smokeHome(page){ await page.goto(baseUrl,{waitUntil:'domcontentloaded'}); const ok = await page.evaluate(()=>{ const h=document.querySelector('header,[role="banner"],nav'); const l=document.querySelector('[data-testid="login-link"], a[href*="auth" i]'); const v=el=>!!el&&!!(el.offsetWidth||el.offsetHeight||el.getClientRects().length); return v(h)&&v(l)}); if(!ok) throw new Error('home: header/login missing') }
async function typeAndSend(page, text){ try{ await page.act(`Type "${text}" into the message input`); await page.act('Click the send message button') }catch{}; await sleep(SOFT_DELAY) }
async function authIfCreds(page){ const e=process.env.BOB_AUTH_EMAIL,p=process.env.BOB_AUTH_PASSWORD; if(!e||!p) return false; await page.goto(baseUrl+'/auth',{waitUntil:'domcontentloaded'}); await page.evaluate(({e,p})=>{ const E=document.querySelector('input[type="email"],input[placeholder*="Email" i]'); const P=document.querySelector('input[type="password"],input[placeholder*="Password" i]'); if(E&&'value'in E) E.value=e; if(P&&'value'in P) P.value=p },{e,p}); try{ await page.act('Click the Sign In button') }catch{ await page.evaluate(()=>document.querySelector('form')?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))) } await sleep(1500); return await page.evaluate(()=>!!document.querySelector('[data-testid="user-menu"], .user-avatar')) }
async function openSettings(page){ try{ await page.act('Click the settings button or settings nav link') }catch{}; await sleep(600); }
async function navigateSettingsTabs(page){ const tabs=['Appearance','Models','API Keys']; for(const t of tabs){ try{ await page.act(`Open the ${t} settings tab`) }catch{}; await sleep(500) } }
async function modelCycle(page){ try{ await page.act('Open the model selector'); await sleep(300); await page.act('Choose a different model from the list') }catch{}; await sleep(600) }
async function openInfoAndFeedback(page){ try{ await page.act('Open the user or app menu'); await sleep(300); await page.act('Open the About or App Info dialog') }catch{}; await sleep(500); try{ await page.act('Open the feedback dialog or feedback button') }catch{}; await sleep(500) }
async function deepLinkChat(page){ const chatId='6acac358-0e13-42c5-817c-cb3130fe659e'; await page.goto(`${baseUrl}/c/${chatId}`,{waitUntil:'domcontentloaded'}); await sleep(600) }
async function scrollChat(page){ try{ await page.evaluate(()=>{ window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'}) }) }catch{}; await sleep(400) }

async function detectUX(page){ const warns = await page.evaluate(()=>{ const w=[]; try{ const imgs=[...document.querySelectorAll('img')]; const missingAlt=imgs.filter(i=>!i.hasAttribute('alt')||i.getAttribute('alt')==='').length; if(missingAlt>0) w.push(`Images without alt: ${missingAlt}`); const btns=[...document.querySelectorAll('button,[role="button"],a[role="button"]')]; const nameless=btns.filter(b=>{ const t=(b.textContent||'').trim().length>0; const a=b.getAttribute('aria-label'); return !t && !(a && a.trim()) }).length; if(nameless>0) w.push(`Buttons without accessible name: ${nameless}`); const inputs=[...document.querySelectorAll('input,textarea,select')]; const hasLabel=el=>{ const id=el.getAttribute('id'); if(id){ const lab=document.querySelector(`label[for="${CSS.escape(id)}"]`); if(lab && (lab.textContent||'').trim()) return true } const aria=el.getAttribute('aria-label'); if(aria && aria.trim()) return true; const by=el.getAttribute('aria-labelledby'); if(by){ const l=document.getElementById(by); if(l && (l.textContent||'').trim()) return true } return false }; const unl=inputs.filter(el=>!hasLabel(el)).length; if(unl>0) w.push(`Inputs without label: ${unl}`); const sampleSel='button,a,p,span,label,h1,h2,h3,h4'; const nodes=[...document.querySelectorAll(sampleSel)].slice(0,120); const getRGB=s=>{ const m=s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i); if(!m) return null; return {r:+m[1],g:+m[2],b:+m[3]} }; const luminance=({r,g,b})=>{ const c=[r,g,b].map(v=>{ v/=255; return v<=0.03928? v/12.92: Math.pow((v+0.055)/1.055,2.4) }); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2] }; const ratio=(fg,bg)=>{ const L1=luminance(fg)+0.05, L2=luminance(bg)+0.05; return L1>L2? L1/L2: L2/L1 }; const bodyBg=getRGB(getComputedStyle(document.body).backgroundColor||'rgb(255,255,255)')||{r:255,g:255,b:255}; let low=0; for(const n of nodes){ const cs=getComputedStyle(n); const col=getRGB(cs.color); let bg=getRGB(cs.backgroundColor); if(!bg || cs.backgroundColor==='rgba(0, 0, 0, 0)' || cs.backgroundColor==='transparent') bg=bodyBg; if(col&&bg){ const cr=ratio(col,bg); if(cr<3.0) low++ } } if(low>0) w.push(`Low-contrast text samples: ${low}`); const small=[...document.querySelectorAll('button,[role="button"]')].filter(b=>{ const r=b.getBoundingClientRect(); return r.width<32||r.height<32 }).length; if(small>0) w.push(`Small tap targets (<32px): ${small}`); }catch(e){ w.push('UX detection error: '+String(e)) } return w }); return warns }

async function llmTitle({kind,engine,minutes,details}){ try{ const apiKey=process.env.OPENAI_API_KEY; if(!apiKey) throw new Error('no-openai-key'); const prompt=`Write a concise, descriptive GitHub issue title in Title Case summarizing ${kind} from long Browserbase journeys. Engine: ${engine}. Minutes: ${minutes}. Observations: ${details}. Constraints: - Under 90 chars. - Start with a category word (UX:, Monitoring:, Auth:, Performance:). - No trailing punctuation.`; const res=await fetch('https://api.openai.com/v1/chat/completions',{ method:'POST', headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'}, body:JSON.stringify({ model:process.env.LLM_TITLE_MODEL||'gpt-4o-mini', messages:[{role:'system',content:'You write concise, high-signal GitHub issue titles.'},{role:'user',content:prompt}], temperature:0.2, max_tokens:40 })}); const data=await res.json(); const title=data?.choices?.[0]?.message?.content?.trim(); if(title) return title; throw new Error('empty-title') }catch(e){ const first=(details||'').split('\n').find(Boolean)||`${kind} observations`; return `${kind}: ${first}`.substring(0,88) } }

function ensureLabel(name,desc,color){ try{ execSync(`gh label create ${JSON.stringify(name)} -d ${JSON.stringify(desc)} -c ${JSON.stringify(color)}`,{stdio:'ignore'}) }catch{} }
function createOrUpdateIssue({ title, body, labels=[], dedupeKey }){ try{ ensureLabel('monitoring','Automated monitoring and smoke test failures','#fbca04'); ensureLabel('ux','User experience improvements','#f9d0c4'); ensureLabel(`engine:${ENGINE}`,`${ENGINE} engine`,'#ededed'); const labelArgs=labels.map(l=>`--label ${JSON.stringify(l)}`).join(' '); const q=`gh issue list --state open --search ${JSON.stringify(dedupeKey+' in:body')} --json number --jq '.[0].number'`; const existing=execSync(q,{encoding:'utf8'}).trim(); if(existing){ execSync(`gh issue comment ${existing} --body ${JSON.stringify(body)}`,{stdio:'ignore'}); return existing } execSync(`gh issue create --title ${JSON.stringify(title)} --body ${JSON.stringify(body+"\n\n[dedupe]: "+dedupeKey)} ${labelArgs}`,{stdio:'ignore'}); return null }catch(e){ console.error('issue create/update error:',e?.message||e); return null } }

async function longJourney(page){ const tEnd=Date.now()+MINUTES*60*1000; let authed=await authIfCreds(page); await smokeHome(page); if(authed){ await openSettings(page); await navigateSettingsTabs(page) } let step=0; while(Date.now()<tEnd){ step++; // vary actions
  await typeAndSend(page, `Long-run message ${step}: explain step ${step} implications`)
  if(step%3===0) await modelCycle(page)
  if(step%4===0) await deepLinkChat(page)
  if(step%5===0 && authed){ await openSettings(page) }
  await scrollChat(page)
  await sleep(SOFT_DELAY)
}
await openInfoAndFeedback(page)
}

async function llmDynamicPlan({ minutes }){
  // Prefer OpenAI if available
  const apiKey = process.env.OPENAI_API_KEY
  const timeBudget = minutes || 3
  const fallback = [
    'Open the model selector',
    'Choose a different model from the list',
    'Type "Give me three bullet improvements to the UI" into the message input',
    'Click the send message button',
    'Open the user or app menu',
    'Open the About or App Info dialog',
    'Open the settings button or settings nav link',
    'Switch to dark theme in appearance settings',
  ]
  try {
    if (!apiKey) throw new Error('no-openai-key')
    const prompt = `You are a QA navigator using a web chat app. Produce a JSON array of 8-15 short UI actions that a human could perform, aiming to last ${timeBudget} minutes when executed with small delays between steps. Prioritize meaningful, varied steps across navigation, model selection, settings, and messaging. Use imperative phrases that a browser agent can execute directly, like "Open the settings button or settings nav link", "Open the model selector", "Choose a different model from the list", "Type \"...\" into the message input", "Click the send message button", "Open the user or app menu", "Open the About or App Info dialog", "Click the attach file button". Return ONLY JSON array of strings.`
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LLM_TITLE_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You output only valid JSON array of short UI actions.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 400,
      }),
    })
    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content?.trim()
    let actions = []
    try { actions = JSON.parse(content) } catch { actions = [] }
    if (!Array.isArray(actions) || actions.length === 0) return fallback
    return actions.slice(0, 20)
  } catch {
    return fallback
  }
}

async function runOne(ix){ const modelName=resolveModel(ENGINE), apiKey=resolveApiKey(ENGINE); const sh=new Stagehand({ env:'BROWSERBASE', verbose:0, modelName, disablePino:true, modelClientOptions:{ apiKey } }); const label=`[long:${ix}]`; const t0=Date.now(); try{ await sh.init(); const page=sh.page; await smokeHome(page); // Run the core long journey
  await longJourney(page);
  // Dynamically extend actions via LLM plan to use remaining time (~60-120s)
  const dyn = await llmDynamicPlan({ minutes: Math.max(1, Math.min(MINUTES, 4)) })
  for (const action of dyn) {
    if (Date.now() - t0 > MINUTES*60*1000) break
    try { await page.act(action) } catch {}
    await sleep(SOFT_DELAY)
  }
  const ux=await detectUX(page); const ms=Date.now()-t0; console.log(`${label} OK in ${ms}ms`); await sh.close(); return { ok:true, ms, ux } }catch(e){ const ms=Date.now()-t0; console.error(`${label} FAIL in ${ms}ms ->`, e?.message||e); try{ await sh.close() }catch{}; return { ok:false, ms, err:String(e?.message||e) } } }

(async()=>{ console.log(`Long flows starting: n=${N} engine=${ENGINE} minutes=${MINUTES}`); const tasks=Array.from({length:N},(_,i)=>runOne(i+1)); const res=await Promise.allSettled(tasks); const flat=res.map(r=>r.status==='fulfilled'?r.value:{ ok:false, ms:0, err:String(r.reason) }); const ok=flat.filter(x=>x.ok).length, fail=flat.length-ok; const avg=Math.round(flat.reduce((a,b)=>a+(b.ms||0),0)/flat.length); console.log(`Long flows complete: ok=${ok}, fail=${fail}, avgMs=${avg}`); const uxAll=flat.filter(x=>x.ux&&x.ux.length).flatMap(x=>x.ux); const uxUnique=Array.from(new Set(uxAll)).slice(0,12); if(uxUnique.length>0){ const ts=new Date().toISOString(); const title=await llmTitle({kind:'UX',engine:ENGINE,minutes:MINUTES,details:uxUnique.join('\n')}); const body=`UX observations from long journeys.\n\n- Engine: ${ENGINE}\n- Minutes: ${MINUTES}\n- N: ${N}\n- Success: ${ok}\n- Failures: ${fail}\n- Avg ms: ${avg}\n\n**Findings**\n- ${uxUnique.join('\n- ')}\n\n_Timestamp: ${ts}_`; createOrUpdateIssue({ title, body, labels:['ux','monitoring',`engine:${ENGINE}`], dedupeKey:`UX-LONG-${ENGINE}` }) } if(fail>0){ const ts=new Date().toISOString(); const sample=flat.filter(x=>!x.ok).slice(0,6).map((x,i)=>`#${i+1}: ${x.err}`).join('\n')||'n/a'; const title=await llmTitle({kind:'Monitoring',engine:ENGINE,minutes:MINUTES,details:sample}); const body=`Long journeys detected failures.\n\n- Engine: ${ENGINE}\n- Minutes: ${MINUTES}\n- N: ${N}\n- Success: ${ok}\n- Failures: ${fail}\n- Avg ms: ${avg}\n\n<details>\n<summary>Sample errors</summary>\n\n${sample}\n\n</details>\n\n_Timestamp: ${ts}_`; createOrUpdateIssue({ title, body, labels:['monitoring','bug',`engine:${ENGINE}`], dedupeKey:`MONITORING-LONG-${ENGINE}` }) } process.exit(fail?1:0) })()
