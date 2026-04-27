"use client";
import React from "react";

export function SkeletonCard({ lines = 3, height = 20 }: { lines?: number; height?: number }) {
  return (
    <div className="card" aria-busy="true" aria-label="Loading...">
      <div className="skeleton" style={{ height: 16, width: "40%", marginBottom: 16 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height, width: i === lines - 1 ? "60%" : "100%", marginBottom: 8 }} />
      ))}
    </div>
  );
}

export function SkeletonHeatmap() {
  return (
    <div className="card" aria-busy="true" aria-label="Loading heatmap...">
      <div className="skeleton" style={{ height: 16, width: "25%", marginBottom: 20 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(13, 1fr)", gap: 4 }}>
        {Array.from({ length: 91 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 24, borderRadius: 3 }} />
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message = "Something went wrong", onRetry, compact }: { message?: string; onRetry?: () => void; compact?: boolean }) {
  if (compact) return (
    <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"var(--red-dim)",border:"1px solid rgba(255,77,106,0.2)",borderRadius:"var(--radius)",color:"var(--red)" }}>
      <span>⚠</span>
      <span style={{ fontSize:13,flex:1 }}>{message}</span>
      {onRetry && <button className="btn btn-ghost" onClick={onRetry} style={{ padding:"4px 12px",fontSize:12 }}>Retry</button>}
    </div>
  );
  return (
    <div className="card" style={{ textAlign:"center",padding:"40px 24px" }} role="alert">
      <div style={{ fontSize:40,marginBottom:16 }}>⚠️</div>
      <h3 style={{ color:"var(--red)",marginBottom:8 }}>Failed to load</h3>
      <p style={{ color:"var(--text-muted)",fontSize:14,marginBottom:24,maxWidth:300,margin:"0 auto 24px" }}>{message}</p>
      {onRetry && <button className="btn btn-secondary" onClick={onRetry}>↻ Try again</button>}
    </div>
  );
}

export function EmptyState({ icon="📭", title, message, action }: { icon?: string; title: string; message: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="card" style={{ textAlign:"center",padding:"48px 24px" }}>
      <div style={{ fontSize:48,marginBottom:16 }}>{icon}</div>
      <h3 style={{ marginBottom:8 }}>{title}</h3>
      <p style={{ color:"var(--text-muted)",fontSize:14,maxWidth:300,margin:"0 auto",marginBottom:action?24:0 }}>{message}</p>
      {action && <button className="btn btn-primary" onClick={action.onClick} style={{ marginTop:24 }}>{action.label}</button>}
    </div>
  );
}

export function Spinner({ size = 20, color = "var(--accent)" }: { size?: number; color?: string }) {
  return <div style={{ width:size,height:size,border:`2px solid ${color}30`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"spin 0.8s linear infinite",flexShrink:0 }} aria-label="Loading" role="status" />;
}

export function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color?: string; icon?: string }) {
  return (
    <div className="card" style={{ padding:"16px 20px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
        <span style={{ fontSize:12,color:"var(--text-muted)",fontFamily:"var(--font-mono)",textTransform:"uppercase",letterSpacing:"0.08em" }}>{label}</span>
        {icon && <span style={{ fontSize:18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:28,fontWeight:800,color:color||"var(--text)",letterSpacing:"-0.03em",lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12,color:"var(--text-muted)",marginTop:4 }}>{sub}</div>}
    </div>
  );
}
