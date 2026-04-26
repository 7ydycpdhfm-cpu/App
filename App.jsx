import { useEffect, useMemo, useRef, useState } from "react";

const LIGHT = {
  bg: "#f5f4fe", surface: "#ffffff", card: "#ffffff", text: "#1a1730", soft: "#5a5575", muted: "#9c98b8",
  border: "#e8e5f8", input: "#f8f7ff", accent: "#6c5fff", accentDim: "#edeaff", green: "#22c47a",
  orange: "#f5862a", red: "#e8334a", teal: "#15b8c8", yellow: "#d4a000", nav: "rgba(255,255,255,.94)", shadow: "rgba(80,60,180,.10)", dark: false,
};
const DARK = {
  bg: "#0d0d12", surface: "#14141c", card: "#1c1c28", text: "#eceaf8", soft: "#a8a4c8", muted: "#77718f",
  border: "#2a2a3e", input: "#10101a", accent: "#7c6fff", accentDim: "#28255a", green: "#44d492",
  orange: "#ff9f56", red: "#ff5c72", teal: "#3dd8e8", yellow: "#ffd166", nav: "rgba(18,18,28,.95)", shadow: "rgba(0,0,0,.45)", dark: true,
};
const TABS = [{ id: "home", icon: "🏠", label: "홈" }, { id: "timer", icon: "⏱", label: "타이머" }, { id: "mind", icon: "📖", label: "일기" }];
const CATS = { 필수: "⭐", 휴식: "🌿", 루틴: "🔄", 작업: "💼" };
const TEMPLATES = [
  ["💤", "기상", "07:00", "07:30", "필수"], ["🍳", "아침 식사", "07:30", "08:00", "필수"], ["💊", "약 복용", "08:00", "08:05", "필수"],
  ["🚶", "산책", "08:00", "08:30", "필수"], ["☕", "커피/차", "09:00", "09:15", "휴식"], ["🍱", "점심 식사", "12:00", "13:00", "필수"],
  ["💤", "낮잠", "13:00", "13:20", "휴식"], ["🧘", "명상", "14:00", "14:15", "휴식"], ["🍽", "저녁 식사", "18:00", "19:00", "필수"],
  ["🛁", "샤워", "21:00", "21:30", "필수"], ["📚", "독서", "22:00", "22:30", "루틴"], ["😴", "취침", "23:00", "07:00", "필수"],
];
const HABITS = [
  { id: 1, name: "물 마시기", emoji: "💧", target: 2000, unit: "ml" }, { id: 2, name: "산책", emoji: "🚶", target: 30, unit: "분" },
  { id: 3, name: "명상", emoji: "🧘", target: 10, unit: "분" }, { id: 4, name: "약 복용", emoji: "💊", target: 1, unit: "회" },
];
const EMOS = [["😌","차분"],["😊","기쁨"],["😰","불안"],["😤","짜증"],["😔","슬픔"],["😵","압도"],["🎯","집중"],["😴","피로"]];

function pad(n){ return String(n).padStart(2,"0"); }
function todayKey(){ const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function fmt(sec){ return `${pad(Math.floor(sec/60))}:${pad(sec%60)}`; }
function load(k, fallback){ try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

function Toast({ toast, C, onClose }){
  if(!toast) return null;
  return <div onClick={onClose} className="toast" style={{ background:C.surface, borderColor:C.accent, color:C.text, boxShadow:`0 10px 35px ${C.shadow}` }}>
    <b>{toast.title}</b><span>{toast.body}</span><button>×</button>
  </div>;
}
function Sheet({ C, title, children, onClose }){
  return <div className="overlay" onClick={onClose}><div className="sheet" onClick={e=>e.stopPropagation()} style={{ background:C.surface, borderColor:C.border }}>
    <div className="grab" style={{ background:C.border }} /><h3>{title}</h3>{children}</div></div>;
}

function Calendar({ tasks, sel, setSel, C }){
  const [month, setMonth] = useState(new Date());
  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m+1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i+1)];
  const move = n => setMonth(new Date(y, m+n, 1));
  const pct = k => { const a = tasks[k] || []; return a.length ? a.filter(t=>t.done).length / a.length : null; };
  return <section className="panel" style={{ background:C.surface, borderColor:C.border }}>
    <div className="calHead"><button onClick={()=>move(-1)}>‹</button><b>{y}년 {m+1}월</b><button onClick={()=>move(1)}>›</button></div>
    <div className="week">{"일월화수목금토".split("").map(d=><span key={d}>{d}</span>)}</div>
    <div className="grid7">{cells.map((d,i)=>{ if(!d) return <span key={i}/>; const k = `${y}-${pad(m+1)}-${pad(d)}`; const p = pct(k); const bg = sel===k ? C.accent : p===null ? "transparent" : p===1 ? C.green : p>.66 ? C.green+"99" : p>.33 ? C.yellow+"99" : C.orange+"66"; return <button key={k} onClick={()=>setSel(k)} style={{ background:bg, color:sel===k?"#fff":C.text }}>{d}{p===1 && sel!==k ? "⭐" : ""}</button>; })}</div>
  </section>;
}

function AddTask({ C, onClose, onAdd }){
  const [text,setText]=useState(""), [start,setStart]=useState(""), [end,setEnd]=useState(""), [cat,setCat]=useState("작업"), [steps,setSteps]=useState([]);
  const add = () => { if(!text.trim()) return; onAdd({ id:Date.now(), text:text.trim(), start, end, category:cat, done:false, steps:steps.filter(Boolean).map((s,i)=>({ id:i+1, text:s, done:false })) }); onClose(); };
  return <Sheet C={C} title="📋 일정 추가" onClose={onClose}>
    <p className="hint">빠른 추가</p><div className="chips">{TEMPLATES.map(([e,l,s,en,c])=><button key={l} onClick={()=>{setText(l);setStart(s);setEnd(en);setCat(c)}}>{e}<small>{l}</small></button>)}</div>
    <input className="input" style={{ background:C.input, borderColor:C.border, color:C.text }} value={text} onChange={e=>setText(e.target.value)} placeholder="일정 제목" autoFocus />
    <div className="seg">{Object.keys(CATS).map(x=><button key={x} onClick={()=>setCat(x)} style={{ background:cat===x?C.accent:C.input, color:cat===x?"#fff":C.soft }}>{CATS[x]} {x}</button>)}</div>
    <div className="two"><input className="input" type="time" value={start} onChange={e=>setStart(e.target.value)} /><input className="input" type="time" value={end} onChange={e=>setEnd(e.target.value)} /></div>
    {steps.map((s,i)=><input key={i} className="input" value={s} onChange={e=>setSteps(a=>a.map((v,idx)=>idx===i?e.target.value:v))} placeholder={`행동 ${i+1}`} />)}
    <button className="ghost" onClick={()=>setSteps(a=>[...a,""])}>＋ 행동 단계 추가</button><button className="primary" onClick={add}>일정 추가하기</button>
  </Sheet>;
}

function Home({ C, startTimer, showToast }){
  const [tasks,setTasks]=useState(()=>load("ff_tasks",{})); const [sel,setSel]=useState(todayKey()); const [add,setAdd]=useState(false);
  const [habits,setHabits]=useState(()=>load("ff_habits",HABITS)); const [logs,setLogs]=useState(()=>load("ff_logs",{})); const [view,setView]=useState("tasks");
  useEffect(()=>save("ff_tasks",tasks),[tasks]); useEffect(()=>save("ff_habits",habits),[habits]); useEffect(()=>save("ff_logs",logs),[logs]);
  useEffect(()=>{ const timers=[]; const list=tasks[todayKey()]||[]; if(Notification?.permission==="granted"){ list.forEach(t=>{ if(!t.start || t.done) return; const [h,m]=t.start.split(":").map(Number); const d=new Date(); d.setHours(h,m,0,0); const ms=d-new Date(); if(ms>0) timers.push(setTimeout(()=>{ new Notification(`지금 시작 — ${t.text}`, { body:t.start }); showToast("지금 시작", t.text); }, ms)); }); } return()=>timers.forEach(clearTimeout); },[tasks]);
  const list=tasks[sel]||[]; const done=list.filter(t=>t.done).length;
  const addTask=t=>setTasks(p=>({...p,[sel]:[...(p[sel]||[]),t].sort((a,b)=>(a.start||"").localeCompare(b.start||""))}));
  const update=(id,patch)=>setTasks(p=>({...p,[sel]:(p[sel]||[]).map(t=>t.id===id?{...t,...patch}:t)}));
  const del=id=>setTasks(p=>({...p,[sel]:(p[sel]||[]).filter(t=>t.id!==id)}));
  const logKey = id => `${id}_${todayKey()}`;
  return <><Calendar tasks={tasks} sel={sel} setSel={setSel} C={C}/>{add&&<AddTask C={C} onClose={()=>setAdd(false)} onAdd={addTask}/>}<div className="tabs2" style={{ background:C.surface, borderColor:C.border }}><button onClick={()=>setView("tasks")} className={view==="tasks"?"on":""}>📋 일정 {list.length?`(${done}/${list.length})`:""}</button><button onClick={()=>setView("habits")} className={view==="habits"?"on":""}>🔥 습관</button></div>
  {view==="tasks" ? <section><div className="row"><b>{sel}</b><span>{done}/{list.length} 완료</span></div>{list.length===0&&<p className="empty">이 날 일정이 없어요.</p>}{list.map(t=><article className="card" key={t.id} style={{ background:C.card, borderColor:C.border, borderLeftColor:C.accent }}><div className="taskTop"><button className="check" onClick={()=>update(t.id,{done:!t.done})}>{t.done?"✓":""}</button><div><b style={{ textDecoration:t.done?"line-through":"none" }}>{CATS[t.category]} {t.text}</b><small>{t.start||"??"}{t.end?` → ${t.end}`:""}</small></div><button onClick={()=>startTimer(t.text)}>⏱</button><button onClick={()=>del(t.id)}>×</button></div>{t.steps?.map(s=><label className="step" key={s.id}><input type="checkbox" checked={s.done} onChange={()=>update(t.id,{steps:t.steps.map(x=>x.id===s.id?{...x,done:!x.done}:x)})}/>{s.text||"행동"}</label>)}</article>)}<button className="primary" onClick={()=>setAdd(true)}>＋ 일정 추가</button></section>
  : <section>{habits.map(h=>{ const entries=logs[logKey(h.id)]||[]; const total=entries.reduce((s,e)=>s+e.value,0); const pct=Math.min(100,total/h.target*100); return <article className="card" key={h.id} style={{ background:C.card, borderColor:pct>=100?C.green:C.border }}><div className="taskTop"><b>{pct>=100?"✓":h.emoji} {h.name}</b><b>{total}/{h.target}{h.unit}</b></div><div className="bar"><i style={{ width:`${pct}%`, background:pct>=100?C.green:C.accent }}/></div><div className="quick"><button onClick={()=>setLogs(p=>({...p,[logKey(h.id)]:[...(p[logKey(h.id)]||[]),{value:h.unit==="ml"?200:1,time:Date.now()}]}))}>+{h.unit==="ml"?"200ml":"1"}</button><button onClick={()=>setLogs(p=>({...p,[logKey(h.id)]:[]}))}>초기화</button></div></article>})}</section>}</>;
}

function Timer({ C, task }){
  const presets=[300,1500,1800,3600]; const [chosen,setChosen]=useState(300); const [sec,setSec]=useState(300); const [run,setRun]=useState(false); const [done,setDone]=useState(0); const ref=useRef();
  useEffect(()=>{ if(run){ ref.current=setInterval(()=>setSec(s=>{ if(s<=1){ clearInterval(ref.current); setRun(false); setDone(d=>d+1); return 0; } return s-1; }),1000); } return()=>clearInterval(ref.current); },[run]);
  const start=s=>{ setChosen(s); setSec(s); setRun(true); };
  const pct=chosen?100-(sec/chosen*100):0;
  return <section className="timer"><p className="hint">{task?`📌 ${task}`:"집중할 시간을 고르세요"}</p><div className="presets">{presets.map(s=><button key={s} onClick={()=>start(s)}>{Math.floor(s/60)}분</button>)}</div><div className="circle" style={{ background:`conic-gradient(${C.accent} ${pct}%, ${C.border} 0)` }}><div style={{ background:C.bg }}><b>{fmt(sec)}</b><span>{run?"집중 중":"대기"}</span></div></div><div className="controls"><button className="primary" onClick={()=>setRun(!run)}>{run?"일시정지":"시작/재개"}</button><button onClick={()=>{setRun(false);setSec(chosen)}}>초기화</button><button onClick={()=>setSec(s=>s+300)}>+5분</button></div>{done>0&&<p className="hint">완료 세션 {done}개</p>}</section>;
}

function Mind({ C }){
  const [entries,setEntries]=useState(()=>load("ff_mind",{})); const [text,setText]=useState(""); const [emos,setEmos]=useState([]); const key=todayKey(); useEffect(()=>save("ff_mind",entries),[entries]);
  const add=()=>{ if(!text.trim()&&!emos.length) return; setEntries(p=>({...p,[key]:[{id:Date.now(),time:new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}),text,emos},...(p[key]||[])]})); setText(""); setEmos([]); };
  return <section><div className="panel" style={{ background:C.surface, borderColor:C.border }}><h3>🧠 지금 드는 생각</h3><textarea className="input" style={{ background:C.input, borderColor:C.border, color:C.text }} value={text} onChange={e=>setText(e.target.value)} placeholder="생각, 걱정, 감정을 자유롭게 적기" rows={5}/><div className="chips">{EMOS.map(([e,l])=><button key={l} onClick={()=>setEmos(a=>a.includes(l)?a.filter(x=>x!==l):[...a,l])} className={emos.includes(l)?"selected":""}>{e}<small>{l}</small></button>)}</div><button className="primary" onClick={add}>일기에 저장</button></div>{(entries[key]||[]).map(e=><article className="card" key={e.id} style={{ background:C.card, borderColor:C.border }}><small>{e.time}</small><p>{e.text}</p><p>{e.emos.map(x=>`#${x}`).join(" ")}</p></article>)}</section>;
}

export default function App(){
  const [tab,setTab]=useState("home"); const [dark,setDark]=useState(()=>load("ff_dark",false)); const [task,setTask]=useState(null); const [toast,setToast]=useState(null); const C=dark?DARK:LIGHT;
  useEffect(()=>save("ff_dark",dark),[dark]);
  const showToast=(title,body)=>{ setToast({title,body}); setTimeout(()=>setToast(null),4500); };
  const askNotif=async()=>{ if(!("Notification" in window)) return showToast("알림 미지원", "이 브라우저에서는 알림이 제한돼요."); const p=await Notification.requestPermission(); showToast(p==="granted"?"알림 허용 완료":"알림 미허용", p==="granted"?"일정 시작 시간에 알려드릴게요.":"브라우저 설정에서 다시 허용할 수 있어요."); };
  return <div style={{ minHeight:"100vh", background:C.bg, color:C.text }}><style>{css}</style><Toast toast={toast} C={C} onClose={()=>setToast(null)}/><header style={{ background:C.nav, borderColor:C.border }}><div><h1><span style={{ color:C.accent }}>Focus</span>Flow</h1><p>{new Date().toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"long"})}</p></div><button onClick={askNotif}>🔔</button><button onClick={()=>setDark(d=>!d)}>{dark?"☀️":"🌙"}</button></header><main>{tab==="home"&&<Home C={C} showToast={showToast} startTimer={label=>{setTask(label);setTab("timer")}}/>}{tab==="timer"&&<Timer C={C} task={task}/>} {tab==="mind"&&<Mind C={C}/>}</main><nav style={{ background:C.nav, borderColor:C.border }}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={tab===t.id?"active":""}><span>{t.icon}</span><small>{t.label}</small></button>)}</nav></div>;
}

const css = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Noto Sans KR',sans-serif}button,input,textarea{font:inherit}button{cursor:pointer}header{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:8;justify-content:space-between;border-bottom:1px solid;padding:13px 16px;backdrop-filter:blur(18px)}header div{flex:1}h1,h3,p{margin:0}header h1{font-size:20px;font-weight:900}header p,.hint,small{font-size:11px;color:#8d88a7}header button{border:1px solid #ddd;background:white;border-radius:18px;padding:8px 10px}main{max-width:480px;margin:0 auto;padding:16px 14px 105px}.panel,.card{border:1px solid;border-radius:18px;padding:14px 16px;margin-bottom:12px;box-shadow:0 2px 12px rgba(0,0,0,.04)}.calHead,.row,.taskTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.calHead button{border:0;background:transparent;font-size:28px;color:inherit}.week,.grid7{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}.week{font-size:11px;color:#999;margin:10px 0 4px}.grid7 button{border:0;border-radius:11px;padding:8px 0;color:inherit;background:transparent}.tabs2{display:flex;border:1px solid;border-radius:14px;padding:4px;margin-bottom:14px}.tabs2 button{flex:1;border:0;border-radius:10px;background:transparent;padding:10px;color:#8d88a7;font-weight:800}.tabs2 .on{background:#6c5fff;color:#fff}.empty{text-align:center;padding:35px 0;color:#999}.primary{width:100%;border:0;border-radius:15px;background:#6c5fff;color:white;padding:14px;font-weight:900;margin-top:10px}.ghost{width:100%;border:1px dashed #aaa;border-radius:13px;background:transparent;color:#888;padding:10px;margin:4px 0}.check{width:28px;height:28px;border-radius:8px;border:2px solid #6c5fff;background:transparent;color:#6c5fff;font-weight:900}.taskTop div{flex:1}.taskTop small,.taskTop div small{display:block;margin-top:3px}.taskTop>button:not(.check){border:0;background:transparent;color:#8d88a7;font-size:18px}.step{display:flex;gap:8px;align-items:center;padding:8px 0 0 38px;font-size:13px}.bar{height:6px;background:#ddd;border-radius:4px;overflow:hidden;margin:10px 0}.bar i{display:block;height:100%;border-radius:4px}.quick{display:flex;gap:8px}.quick button,.controls button,.presets button{flex:1;border:1px solid #ddd;background:white;border-radius:13px;padding:10px}.chips{display:flex;gap:7px;overflow-x:auto;padding:6px 0 12px}.chips button{flex-shrink:0;border:1px solid #ddd;background:white;border-radius:14px;padding:8px 11px;display:flex;flex-direction:column;align-items:center;gap:3px}.chips .selected{outline:2px solid #6c5fff}.input{width:100%;border:1.5px solid;border-radius:13px;padding:12px;margin-bottom:10px;outline:none}.seg{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}.seg button{border:0;border-radius:11px;padding:9px 4px;font-size:12px;font-weight:800}.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}.overlay{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}.sheet{width:100%;max-width:480px;max-height:90vh;overflow:auto;border:1px solid;border-radius:24px 24px 0 0;padding:0 18px 32px}.grab{width:44px;height:5px;border-radius:4px;margin:12px auto}.sheet h3{margin:12px 0 10px}.timer{display:flex;flex-direction:column;align-items:center;gap:16px}.presets,.controls{display:flex;gap:8px;width:100%}.circle{width:245px;height:245px;border-radius:50%;display:grid;place-items:center}.circle div{width:205px;height:205px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center}.circle b{font-size:48px;font-family:ui-monospace,Menlo,monospace}.toast{position:fixed;top:70px;left:16px;right:16px;z-index:80;max-width:420px;margin:auto;border-left:5px solid;border-radius:16px;padding:13px 42px 13px 15px;display:flex;flex-direction:column;gap:3px}.toast button{position:absolute;right:10px;top:9px;border:0;background:transparent;font-size:20px;color:#999}nav{position:fixed;bottom:0;left:0;right:0;z-index:20;display:flex;justify-content:center;border-top:1px solid;backdrop-filter:blur(18px);padding:7px 10px max(7px,env(safe-area-inset-bottom))}nav button{max-width:160px;flex:1;border:0;background:transparent;padding:6px;color:#8d88a7;display:flex;flex-direction:column;align-items:center;gap:3px}nav button span{font-size:20px}nav .active{color:#6c5fff;font-weight:900}@media (prefers-color-scheme: dark){header button,.chips button,.quick button,.controls button,.presets button{background:#1c1c28;color:#eee;border-color:#333}}`;
