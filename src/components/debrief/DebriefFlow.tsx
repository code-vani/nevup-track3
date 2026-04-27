"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import type { SessionSummary, EmotionalState, DebriefInput } from "@/types";
import { ErrorState } from "@/components/shared/States";
import CoachingPanel from "@/components/coaching/CoachingPanel";

const EMOTIONAL_STATES: EmotionalState[] = ["calm","anxious","greedy","fearful","neutral"];
const EMOTION_EMOJI: Record<EmotionalState,string> = { calm:"😌",anxious:"😰",greedy:"🤑",fearful:"😨",neutral:"😐" };
const EMOTION_COLORS: Record<EmotionalState,string> = { calm:"var(--calm)",anxious:"var(--anxious)",greedy:"var(--greedy)",fearful:"var(--fearful)",neutral:"var(--neutral-e)" };
const STEP_TITLES: Record<number,string> = { 1:"Trade Replay",2:"Emotional Check-in",3:"Plan Adherence",4:"AI Coaching",5:"Save & Reflect" };

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:0 }} role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({length:total}).map((_,i)=>{
        const n=i+1,done=n<current,active=n===current;
        return <React.Fragment key={n}>
          <div style={{ width:active?32:24,height:24,borderRadius:12,background:(done||active)?"var(--accent)":"var(--bg-3)",border:active?"2px solid var(--accent)":done?"none":"1px solid var(--border-bright)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:(done||active)?"#000":"var(--text-muted)",transition:"all 0.3s ease",flexShrink:0 }}>
            {done?"✓":n}
          </div>
          {i<total-1&&<div style={{ height:2,flex:1,minWidth:16,background:done?"var(--accent)":"var(--bg-3)",transition:"background 0.3s ease" }}/>}
        </React.Fragment>;
      })}
    </div>
  );
}

export default function DebriefFlow({ session, token, onComplete, onBack }: { session: SessionSummary; token: string; onComplete: ()=>void; onBack: ()=>void }) {
  const [step, setStep] = useState(1);
  const [emotionalTags, setEmotionalTags] = useState<Record<string,EmotionalState>>({});
  const [adherenceRatings, setAdherenceRatings] = useState<Record<string,number>>({});
  const [overallMood, setOverallMood] = useState<EmotionalState>("neutral");
  const [keyMistake, setKeyMistake] = useState("");
  const [keyLesson, setKeyLesson] = useState("");
  const [planAdherenceRating, setPlanAdherenceRating] = useState(3);
  const [willReviewTomorrow, setWillReviewTomorrow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string|null>(null);
  const [animKey, setAnimKey] = useState(0);
  const firstFocusRef = useRef<HTMLButtonElement|HTMLTextAreaElement>(null);

  const advance = useCallback((next: number) => { setAnimKey(k=>k+1); setStep(next); }, []);
  useEffect(() => { const t=setTimeout(()=>firstFocusRef.current?.focus(),350); return ()=>clearTimeout(t); }, [step]);

  const handleSave = async () => {
    setSaving(true); setSaveError(null);
    try {
      await fetch(`/api/local/sessions/${session.sessionId}/debrief`, {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body: JSON.stringify({ overallMood, keyMistake:keyMistake||null, keyLesson:keyLesson||null, planAdherenceRating, willReviewTomorrow }),
      });
      onComplete();
    } catch(e) { setSaveError(e instanceof Error?e.message:"Failed to save"); setSaving(false); }
  };

  const winCount = session.trades.filter(t=>t.outcome==="win").length;
  const lossCount = session.trades.filter(t=>t.outcome==="loss").length;

  return (
    <div style={{ maxWidth:640,margin:"0 auto",padding:"0 0 32px" }}>
      <div style={{ marginBottom:24 }}>
        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom:16,padding:"6px 0",fontSize:13 }}>← Back to dashboard</button>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:16 }}>
          <div>
            <h2 style={{ marginBottom:4 }}>{STEP_TITLES[step]}</h2>
            <p style={{ color:"var(--text-muted)",fontSize:13 }}>
              {new Date(session.date).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
              {" · "}<span style={{ color:session.totalPnl>=0?"var(--win)":"var(--loss)" }}>{session.totalPnl>=0?"+":""}${session.totalPnl.toFixed(2)}</span>
              {" · "}{winCount}W / {lossCount}L
            </p>
          </div>
        </div>
        <StepIndicator current={step} total={5}/>
      </div>
      <div key={animKey} className="animate-fade-up">
        {step===1&&(
          <div>
            {session.trades.map((trade,i)=>(
              <div key={trade.tradeId} className="card" style={{ marginBottom:8,padding:"14px 16px" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ fontFamily:"var(--font-mono)",fontSize:11,color:"var(--text-muted)",minWidth:20 }}>#{i+1}</span>
                    <div>
                      <span style={{ fontWeight:700 }}>{trade.asset}</span>
                      <span style={{ marginLeft:8,fontSize:11,fontFamily:"var(--font-mono)",fontWeight:600,color:trade.direction==="long"?"var(--win)":"var(--loss)" }}>{trade.direction.toUpperCase()}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    {trade.revengeFlag&&<span style={{ fontSize:10,color:"var(--orange)",fontFamily:"var(--font-mono)",background:"rgba(255,159,69,0.1)",padding:"2px 6px",borderRadius:4 }}>⚡ REVENGE</span>}
                    {trade.emotionalState&&<span className={`badge badge-${trade.emotionalState}`}>{EMOTION_EMOJI[trade.emotionalState as EmotionalState]} {trade.emotionalState}</span>}
                    {trade.pnl!==null&&<span className={trade.pnl>=0?"badge badge-win":"badge badge-loss"}>{trade.pnl>=0?"+":""}${trade.pnl.toFixed(2)}</span>}
                  </div>
                </div>
                {trade.entryRationale&&<p style={{ fontSize:12,color:"var(--text-muted)",marginTop:8,paddingTop:8,borderTop:"1px solid var(--border)" }}>"{trade.entryRationale}"</p>}
              </div>
            ))}
            <button ref={firstFocusRef as React.RefObject<HTMLButtonElement>} className="btn btn-primary" style={{ width:"100%" }} onClick={()=>advance(2)}>Continue → Tag your emotions</button>
          </div>
        )}
        {step===2&&(
          <div>
            <p style={{ color:"var(--text-muted)",fontSize:14,marginBottom:20 }}>How were you feeling during each trade?</p>
            {session.trades.map(trade=>(
              <div key={trade.tradeId} className="card" style={{ marginBottom:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                  <span style={{ fontWeight:700 }}>{trade.asset}</span>
                  {trade.pnl!==null&&<span className={trade.pnl>=0?"badge badge-win":"badge badge-loss"}>{trade.pnl>=0?"+":""}${trade.pnl.toFixed(2)}</span>}
                </div>
                <div role="group" style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                  {EMOTIONAL_STATES.map(state=>{
                    const selected=emotionalTags[trade.tradeId]===state;
                    return <button key={state} className={`btn ${selected?"btn-primary":"btn-secondary"}`} style={{ padding:"6px 12px",fontSize:12,background:selected?EMOTION_COLORS[state]:undefined,color:selected?"#000":undefined,borderColor:selected?EMOTION_COLORS[state]:undefined }} onClick={()=>setEmotionalTags(p=>({...p,[trade.tradeId]:state}))} aria-pressed={selected}>{EMOTION_EMOJI[state]} {state}</button>;
                  })}
                </div>
              </div>
            ))}
            <div style={{ display:"flex",gap:10,marginTop:16 }}>
              <button className="btn btn-ghost" onClick={()=>advance(1)}>← Back</button>
              <button ref={firstFocusRef as React.RefObject<HTMLButtonElement>} className="btn btn-primary" style={{ flex:1 }} onClick={()=>advance(3)}>Continue → Rate adherence</button>
            </div>
          </div>
        )}
        {step===3&&(
          <div>
            <p style={{ color:"var(--text-muted)",fontSize:14,marginBottom:20 }}>How well did you stick to your trading plan?</p>
            {session.trades.slice(0,5).map(trade=>(
              <div key={trade.tradeId} className="card" style={{ marginBottom:10 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                  <span style={{ fontWeight:700 }}>{trade.asset}</span>
                  {trade.pnl!==null&&<span className={trade.pnl>=0?"badge badge-win":"badge badge-loss"}>{trade.pnl>=0?"+":""}${trade.pnl.toFixed(2)}</span>}
                </div>
                <div role="group" style={{ display:"flex",gap:6 }}>
                  {[1,2,3,4,5].map(n=>{
                    const sel=(adherenceRatings[trade.tradeId]||trade.planAdherence||3)>=n;
                    return <button key={n} aria-label={`${n} stars`} aria-pressed={sel} onClick={()=>setAdherenceRatings(p=>({...p,[trade.tradeId]:n}))} style={{ width:32,height:32,borderRadius:4,border:"none",cursor:"pointer",background:sel?"var(--accent-dim)":"var(--bg-3)",fontSize:18,transition:"all 0.15s" }}>{sel?"⭐":"☆"}</button>;
                  })}
                </div>
              </div>
            ))}
            <div className="card card-glow" style={{ marginBottom:16 }}>
              <p style={{ fontWeight:700,marginBottom:12 }}>Overall session rating</p>
              <div role="group" style={{ display:"flex",gap:8 }}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} aria-label={`Overall ${n} stars`} aria-pressed={planAdherenceRating===n} onClick={()=>setPlanAdherenceRating(n)} style={{ flex:1,height:44,borderRadius:6,border:planAdherenceRating===n?"2px solid var(--accent)":"1px solid var(--border-bright)",background:planAdherenceRating===n?"var(--accent-dim)":"var(--bg-2)",cursor:"pointer",fontSize:20,transition:"all 0.15s",color:planAdherenceRating===n?"var(--accent)":"var(--text-muted)" }}>{n}</button>
                ))}
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",marginTop:6 }}>
                <span style={{ fontSize:11,color:"var(--text-muted)" }}>Ignored plan</span>
                <span style={{ fontSize:11,color:"var(--text-muted)" }}>Followed perfectly</span>
              </div>
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button className="btn btn-ghost" onClick={()=>advance(2)}>← Back</button>
              <button ref={firstFocusRef as React.RefObject<HTMLButtonElement>} className="btn btn-primary" style={{ flex:1 }} onClick={()=>advance(4)}>Continue → AI Coaching</button>
            </div>
          </div>
        )}
        {step===4&&(
          <div>
            <CoachingPanel sessionId={session.sessionId} userId={session.userId} token={token}/>
            <div style={{ display:"flex",gap:10,marginTop:16 }}>
              <button className="btn btn-ghost" onClick={()=>advance(3)}>← Back</button>
              <button ref={firstFocusRef as React.RefObject<HTMLButtonElement>} className="btn btn-primary" style={{ flex:1 }} onClick={()=>advance(5)}>Continue → Save reflection</button>
            </div>
          </div>
        )}
        {step===5&&(
          <div>
            <p style={{ color:"var(--text-muted)",fontSize:14,marginBottom:20 }}>Document your key learnings.</p>
            <div className="card" style={{ marginBottom:12 }}>
              <label style={{ fontWeight:600,marginBottom:10,display:"block",fontSize:14 }}>Overall session mood</label>
              <div role="group" style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {EMOTIONAL_STATES.map(state=>(
                  <button key={state} className="btn" style={{ padding:"8px 14px",fontSize:13,background:overallMood===state?EMOTION_COLORS[state]:"var(--bg-2)",color:overallMood===state?"#000":"var(--text)",border:`1px solid ${overallMood===state?EMOTION_COLORS[state]:"var(--border-bright)"}` }} aria-pressed={overallMood===state} onClick={()=>setOverallMood(state)}>{EMOTION_EMOJI[state]} {state}</button>
                ))}
              </div>
            </div>
            <div className="card" style={{ marginBottom:12 }}>
              <label htmlFor="mistake" style={{ fontWeight:600,marginBottom:8,display:"block",fontSize:14 }}>Biggest mistake today</label>
              <textarea id="mistake" ref={firstFocusRef as React.RefObject<HTMLTextAreaElement>} className="input" placeholder="e.g. I held a losing trade too long..." value={keyMistake} onChange={e=>setKeyMistake(e.target.value)} maxLength={1000} rows={3}/>
            </div>
            <div className="card" style={{ marginBottom:12 }}>
              <label htmlFor="lesson" style={{ fontWeight:600,marginBottom:8,display:"block",fontSize:14 }}>Key lesson learned</label>
              <textarea id="lesson" className="input" placeholder="e.g. Exit when the setup invalidates..." value={keyLesson} onChange={e=>setKeyLesson(e.target.value)} maxLength={1000} rows={3}/>
            </div>
            <div className="card" style={{ marginBottom:20 }}>
              <label style={{ display:"flex",alignItems:"center",gap:12,cursor:"pointer" }}>
                <div role="checkbox" aria-checked={willReviewTomorrow} tabIndex={0} onClick={()=>setWillReviewTomorrow(v=>!v)} onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();setWillReviewTomorrow(v=>!v);}}} style={{ width:44,height:24,borderRadius:12,position:"relative",background:willReviewTomorrow?"var(--accent)":"var(--bg-3)",border:`1px solid ${willReviewTomorrow?"var(--accent)":"var(--border-bright)"}`,transition:"all 0.2s",cursor:"pointer",flexShrink:0 }}>
                  <div style={{ position:"absolute",top:2,left:willReviewTomorrow?22:2,width:18,height:18,borderRadius:"50%",background:willReviewTomorrow?"#000":"var(--text-muted)",transition:"left 0.2s" }}/>
                </div>
                <span style={{ fontSize:14 }}>I'll review this debrief tomorrow morning</span>
              </label>
            </div>
            {saveError&&<ErrorState message={saveError} compact onRetry={handleSave}/>}
            <div style={{ display:"flex",gap:10 }}>
              <button className="btn btn-ghost" onClick={()=>advance(4)}>← Back</button>
              <button className="btn btn-primary" style={{ flex:1,opacity:saving?0.7:1 }} onClick={handleSave} disabled={saving}>{saving?"Saving...":"✓ Save debrief"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
