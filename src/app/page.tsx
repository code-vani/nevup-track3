"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import type { BehavioralMetrics, BehavioralProfile, HeatmapDay, Trader } from "@/types";
import { mintToken } from "@/lib/jwt";
import { TRADERS } from "@/lib/seedData";
import { SkeletonCard, SkeletonHeatmap, ErrorState, EmptyState, StatCard } from "@/components/shared/States";
import Heatmap from "@/components/dashboard/Heatmap";

const PATHOLOGY_LABELS: Record<string, string> = {
  revenge_trading: "Revenge Trading", overtrading: "Overtrading", fomo_entries: "FOMO Entries",
  plan_non_adherence: "Plan Non-Adherence", premature_exit: "Premature Exit", loss_running: "Loss Running",
  session_tilt: "Session Tilt", time_of_day_bias: "Time-of-Day Bias",
  position_sizing_inconsistency: "Position Sizing", none: "Control (No Pathology)",
};
const EMOTION_COLORS: Record<string, string> = {
  calm: "#4fffb0", anxious: "#ff9f45", greedy: "#f59e0b", fearful: "#ff4d6a", neutral: "#5b9cf6",
};

export default function App() {
  const router = useRouter();
  const [view, setView] = useState<"select" | "dashboard">("select");
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [token, setToken] = useState("");
  const [metrics, setMetrics] = useState<BehavioralMetrics | null>(null);
  const [profile, setProfile] = useState<BehavioralProfile | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadTrader = useCallback(async (trader: Trader) => {
    setSelectedTrader(trader);
    setLoading(true);
    setMetricsError(null);
    setProfileError(null);
    try {
      const t = await mintToken(trader.userId, trader.name);
      setToken(t);
      const headers = { Authorization: `Bearer ${t}` };
      const [metricsRes, profileRes, sessionsRes] = await Promise.allSettled([
        fetch(`/api/local/users/${trader.userId}/metrics`, { headers }).then((r) => r.ok ? r.json() : Promise.reject(new Error("Metrics failed"))),
        fetch(`/api/local/users/${trader.userId}/profile`, { headers }).then((r) => r.ok ? r.json() : Promise.reject(new Error("Profile failed"))),
        fetch(`/api/local/sessions/list?userId=${trader.userId}`, { headers }).then((r) => r.ok ? r.json() : null).catch(() => null),
      ]);
      if (metricsRes.status === "fulfilled") setMetrics(metricsRes.value);
      else setMetricsError("Could not load metrics");
      if (profileRes.status === "fulfilled") setProfile(profileRes.value);
      else setProfileError("Could not load profile");
      if (sessionsRes.status === "fulfilled" && sessionsRes.value)
        setHeatmapData(sessionsRes.value.heatmap || []);
    } catch {
      setMetricsError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectTrader = (trader: Trader) => {
    loadTrader(trader);
    setView("dashboard");
  };

  // Heatmap click → navigate to /sessions/[id] with userId so the page can auth without brute-force
  const handleHeatmapClick = useCallback((day: HeatmapDay) => {
    if (!day.sessionId || !selectedTrader) return;
    router.push(`/sessions/${day.sessionId}?userId=${selectedTrader.userId}`);
  }, [router, selectedTrader]);

  // Navigate to debrief from profile evidence sessions
  const handleStartDebrief = useCallback((sessionId: string) => {
    if (!selectedTrader) return;
    router.push(`/sessions/${sessionId}?userId=${selectedTrader.userId}`);
  }, [router, selectedTrader]);

  // SELECT VIEW
  if (view === "select") return (
    <main style={{ minHeight: "100dvh", padding: "24px 16px", maxWidth: 800, margin: "0 auto" }}>
      <div className="animate-fade-up" style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-dim)", border: "1px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📈</div>
          <div>
            <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase" }}>NevUp</div>
            <h1 style={{ fontSize: "1.6rem", lineHeight: 1 }}>Trading Psychology Coach</h1>
          </div>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Select a trader profile to view behavioral analytics and debrief sessions.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
        {TRADERS.map((trader, i) => (
          <button key={trader.userId} className="card" onClick={() => handleSelectTrader(trader)}
            aria-label={trader.name}
            aria-describedby={`trader-desc-${trader.userId}`}
            style={{ textAlign: "left", cursor: "pointer", animationDelay: `${i * 40}ms`, border: "1px solid var(--border)", transition: "all 0.2s", background: "var(--bg-1)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-1)"; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{trader.name}</div>
                <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{trader.userId.slice(0, 8)}…</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: trader.pathology === "none" ? "var(--blue)" : "var(--orange)", flexShrink: 0, marginTop: 4 }} />
            </div>
            <span id={`trader-desc-${trader.userId}`} style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, color: trader.pathology === "none" ? "var(--blue)" : "var(--orange)", background: trader.pathology === "none" ? "var(--blue-dim)" : "rgba(255,159,69,0.1)", padding: "3px 8px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {PATHOLOGY_LABELS[trader.pathology] || trader.pathology}
            </span>
          </button>
        ))}
      </div>
    </main>
  );

  // DASHBOARD VIEW
  return (
    <div style={{ minHeight: "100dvh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(8,9,12,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)", padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <button className="btn btn-ghost" style={{ padding: "4px 0", fontSize: 13 }} aria-label="Back to trader selection" onClick={() => setView("select")}>← Traders</button>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 700 }}>{selectedTrader?.name}</span>
          {selectedTrader?.pathology && selectedTrader.pathology !== "none" && (
            <span style={{ marginLeft: 10, fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--orange)", background: "rgba(255,159,69,0.1)", padding: "2px 8px", borderRadius: 4, textTransform: "uppercase" }}>
              {PATHOLOGY_LABELS[selectedTrader.pathology]}
            </span>
          )}
        </div>
        <button className="btn btn-secondary" style={{ fontSize: 13 }} aria-label="Refresh trader data" onClick={() => loadTrader(selectedTrader!)}>↻ Refresh</button>
      </header>

      <main style={{ padding: "20px 16px", maxWidth: 900, margin: "0 auto" }}>
        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 20 }}>
          {loading ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} lines={1} height={32} />) :
            metrics ? <>
              <StatCard label="Plan Score" value={`${metrics.planAdherenceScore.toFixed(1)}/5`} color={metrics.planAdherenceScore >= 3.5 ? "var(--win)" : "var(--loss)"} icon="📋" />
              <StatCard label="Session Tilt" value={`${(metrics.sessionTiltIndex * 100).toFixed(0)}%`} color={metrics.sessionTiltIndex > 0.3 ? "var(--loss)" : "var(--win)"} icon="⚡" />
              <StatCard label="Revenge Trades" value={metrics.revengeTrades} color={metrics.revengeTrades > 0 ? "var(--loss)" : "var(--text)"} icon="🔄" />
              <StatCard label="Win Rate" value={`${Math.round((metrics.timeseries.reduce((a, b) => a + b.winRate, 0) / Math.max(metrics.timeseries.length, 1)) * 100)}%`} color="var(--blue)" icon="🏆" />
            </> : metricsError ? (
              <div style={{ gridColumn: "1/-1" }}>
                <ErrorState message={metricsError} onRetry={() => loadTrader(selectedTrader!)} compact />
              </div>
            ) : null}
        </div>

        {/* Heatmap */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3>Trade Quality · 90 Days</h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Click a day to debrief</span>
          </div>
          {loading ? <SkeletonHeatmap /> :
            heatmapData.length > 0 ? (
              <Heatmap data={heatmapData} onDayClick={handleHeatmapClick} />
            ) : (
              <EmptyState icon="📅" title="No trading data" message="No sessions found for this trader in the past 90 days." />
            )}
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginBottom: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Daily P&amp;L</h3>
            {loading ? <SkeletonCard lines={4} height={12} /> :
              metricsError ? <ErrorState message={metricsError} compact onRetry={() => loadTrader(selectedTrader!)} /> :
                metrics?.timeseries.length ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={metrics.timeseries} margin={{ left: -20, right: 4 }}>
                      <XAxis dataKey="bucket" tickFormatter={(v) => v.slice(5, 10)} tick={{ fontSize: 11, fill: "#8a9ab5" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#8a9ab5" }} />
                      <Tooltip contentStyle={{ background: "var(--bg-2)", border: "1px solid var(--border-bright)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "P&L"]} />
                      <Line type="monotone" dataKey="pnl" stroke="var(--accent)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon="📈" title="No data" message="No timeseries data available." />}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Win Rate by Mood</h3>
            {loading ? <SkeletonCard lines={4} height={12} /> :
              metricsError ? <ErrorState message={metricsError} compact onRetry={() => loadTrader(selectedTrader!)} /> :
                metrics && Object.keys(metrics.winRateByEmotionalState).length ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={Object.entries(metrics.winRateByEmotionalState).map(([state, d]) => ({ state, winRate: d.winRate }))} margin={{ left: -20, right: 4 }}>
                      <XAxis dataKey="state" tick={{ fontSize: 11, fill: "#8a9ab5" }} />
                      <YAxis domain={[0, 1]} tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fontSize: 11, fill: "#8a9ab5" }} />
                      <Tooltip contentStyle={{ background: "var(--bg-2)", border: "1px solid var(--border-bright)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${Math.round(v * 100)}%`, "Win Rate"]} />
                      <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                        {Object.keys(metrics.winRateByEmotionalState).map((state) => (
                          <Cell key={state} fill={EMOTION_COLORS[state] || "var(--blue)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon="😐" title="No mood data" message="No emotional state data recorded yet." />}
          </div>
        </div>

        {/* Behavioral Profile */}
        {!loading && profile && (
          <div className="card card-glow" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16 }}>Behavioral Profile</h3>
            {profile.dominantPathologies.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>✓ No dominant pathologies detected — control profile.</p>
            ) : profile.dominantPathologies.map((p) => (
              <div key={p.pathology} style={{ marginBottom: 12, padding: 14, background: "var(--bg-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: "var(--orange)" }}>{PATHOLOGY_LABELS[p.pathology] || p.pathology}</span>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>{Math.round(p.confidence * 100)}% confidence</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.evidenceSessions.slice(0, 3).map((sid) => (
                    <button key={sid}
                      style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--blue)", background: "var(--blue-dim)", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}
                      aria-label={`Open debrief for session ${sid.slice(0, 8)}`}
                      onClick={() => handleStartDebrief(sid)}>
                      session:{sid.slice(0, 8)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {profile.strengths.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Strengths</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {profile.strengths.map((s) => <span key={s} className="badge badge-win">{s}</span>)}
                </div>
              </div>
            )}
            {profile.peakPerformanceWindow && (
              <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--accent-dim)", borderRadius: "var(--radius)", border: "1px solid rgba(79,255,176,0.15)" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Peak window: </span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)", fontWeight: 700 }}>{profile.peakPerformanceWindow.startHour}:00–{profile.peakPerformanceWindow.endHour}:00 UTC</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>({Math.round(profile.peakPerformanceWindow.winRate * 100)}% win rate)</span>
              </div>
            )}
          </div>
        )}

        {!loading && profileError && <ErrorState message={profileError} compact onRetry={() => loadTrader(selectedTrader!)} />}
      </main>
    </div>
  );
}
