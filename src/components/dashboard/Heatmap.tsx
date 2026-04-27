"use client";
import React, { useRef, useState, useCallback } from "react";
import type { HeatmapDay } from "@/types";

const CELL_SIZE = 13, CELL_GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function scoreToColor(score: number | null, pnl: number): string {
  if (score === null) return "#1c2232";
  if (pnl > 0) {
    const intensity = Math.min(score / 5, 1);
    return `rgba(79, ${Math.round(180 + intensity * 75)}, ${Math.round(100 + intensity * 76)}, ${0.4 + intensity * 0.6})`;
  }
  const intensity = Math.min(Math.abs(pnl) / 200, 1);
  return `rgba(255, ${Math.round(77 - intensity * 40)}, ${Math.round(106 - intensity * 40)}, ${0.4 + intensity * 0.5})`;
}

export default function Heatmap({ data, onDayClick }: { data: HeatmapDay[]; onDayClick?: (day: HeatmapDay) => void }) {
  const [tooltip, setTooltip] = useState<{ day: HeatmapDay; x: number; y: number } | null>(null);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const dayMap = new Map(data.map((d) => [d.date, d]));

  // Use data-relative window: end at latest trade date, go back 90 days
  // This ensures seed data (2025) is always visible regardless of current date
  const latestDate = data.length > 0
    ? new Date(data.reduce((latest, d) => d.date > latest ? d.date : latest, data[0].date))
    : new Date();

  const endDate = latestDate;
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 89);

  const days: (HeatmapDay | null)[] = [];
  const startDayOfWeek = startDate.getDay();
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let i = 0; i < 90; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push(dayMap.get(dateStr) || { date: dateStr, score: null, sessionId: null, tradeCount: 0, pnl: 0 });
  }

  const totalCols = Math.ceil(days.length / 7);
  const svgW = totalCols * (CELL_SIZE + CELL_GAP) + 32;
  const svgH = 7 * (CELL_SIZE + CELL_GAP) + 28;

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  days.forEach((d, idx) => {
    if (!d) return;
    const m = new Date(d.date).getUTCMonth();
    const col = Math.floor(idx / 7);
    if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], col }); lastMonth = m; }
  });

  const tradingDays = days.filter((d) => d && d.tradeCount > 0) as HeatmapDay[];

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setFocusedIdx((i) => Math.min(i + 1, tradingDays.length - 1));
    if (e.key === "ArrowLeft") setFocusedIdx((i) => Math.max(i - 1, 0));
    if (e.key === "ArrowDown") setFocusedIdx((i) => Math.min(i + 4, tradingDays.length - 1));
    if (e.key === "ArrowUp") setFocusedIdx((i) => Math.max(i - 4, 0));
    if ((e.key === "Enter" || e.key === " ") && focusedIdx >= 0) {
      e.preventDefault();
      onDayClick?.(tradingDays[focusedIdx]);
    }
  }, [focusedIdx, tradingDays, onDayClick]);

  return (
    <div ref={containerRef} style={{ position: "relative", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH}
        aria-label="Trade quality heatmap" role="grid" tabIndex={0}
        style={{ outline: "none", display: "block" }}
        onKeyDown={handleKeyDown}
        onBlur={() => setFocusedIdx(-1)}
      >
        {DAY_LABELS.map((label, i) =>
          label && (
            <text key={i} x={0} y={i * (CELL_SIZE + CELL_GAP) + CELL_SIZE + 22}
              fontSize={9} fill="var(--text-muted)" fontFamily="var(--font-mono)">{label}</text>
          )
        )}
        {monthLabels.map(({ label, col }) => (
          <text key={label + col} x={30 + col * (CELL_SIZE + CELL_GAP)} y={12}
            fontSize={9} fill="var(--text-muted)" fontFamily="var(--font-mono)">{label}</text>
        ))}
        {days.map((day, idx) => {
          if (!day) return null;
          const col = Math.floor(idx / 7), row = idx % 7;
          const x = 30 + col * (CELL_SIZE + CELL_GAP), y = 18 + row * (CELL_SIZE + CELL_GAP);
          const color = scoreToColor(day.score, day.pnl);
          const hasData = day.tradeCount > 0;
          const hasSession = !!day.sessionId;
          const focusIdx = tradingDays.findIndex((d) => d.date === day.date);
          const isFocused = focusedIdx === focusIdx && focusIdx >= 0;
          return (
            <g key={day.date} role="gridcell"
              aria-label={hasData ? `${day.date}: ${day.tradeCount} trades${hasSession ? ", click to debrief" : ""}` : `${day.date}: no trades`}>
              <rect
                x={x} y={y} width={CELL_SIZE} height={CELL_SIZE} rx={2} fill={color}
                stroke={isFocused ? "var(--accent)" : hasData ? "rgba(255,255,255,0.06)" : "none"}
                strokeWidth={isFocused ? 2 : 0.5}
                style={{ cursor: hasSession ? "pointer" : hasData ? "default" : "default" }}
                onMouseEnter={hasData ? (e) => {
                  const rect = (e.target as SVGElement).getBoundingClientRect();
                  const c = containerRef.current?.getBoundingClientRect();
                  setTooltip({ day, x: rect.left - (c?.left || 0) + CELL_SIZE / 2, y: rect.top - (c?.top || 0) - 8 });
                } : undefined}
                onMouseLeave={() => setTooltip(null)}
                onClick={hasSession ? () => onDayClick?.(day) : undefined}
              />
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Less</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <div key={v} style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 2, background: scoreToColor(v + 1, v > 2 ? 50 : -50) }} />
        ))}
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>More</span>
      </div>

      {tooltip && (
        <div role="tooltip" style={{
          position: "absolute", left: tooltip.x, top: tooltip.y,
          transform: "translateX(-50%) translateY(-100%)",
          background: "var(--bg-3)", border: "1px solid var(--border-bright)",
          borderRadius: "var(--radius)", padding: "10px 14px", fontSize: 12, minWidth: 170,
          pointerEvents: "none", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: "var(--font-mono)", fontSize: 11 }}>{tooltip.day.date}</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 3 }}>
            <span style={{ color: "var(--text-muted)" }}>Trades</span><span>{tooltip.day.tradeCount}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 3 }}>
            <span style={{ color: "var(--text-muted)" }}>P&amp;L</span>
            <span className={tooltip.day.pnl >= 0 ? "pnl-positive" : "pnl-negative"}>
              {tooltip.day.pnl >= 0 ? "+" : ""}${tooltip.day.pnl.toFixed(2)}
            </span>
          </div>
          {tooltip.day.score !== null && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 3 }}>
              <span style={{ color: "var(--text-muted)" }}>Plan score</span>
              <span>{tooltip.day.score.toFixed(1)}/5</span>
            </div>
          )}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)", fontSize: 11 }}>
            {tooltip.day.sessionId
              ? <span style={{ color: "var(--accent)" }}>↗ Click to debrief session</span>
              : <span style={{ color: "var(--text-muted)" }}>No session recorded</span>
            }
          </div>
        </div>
      )}
    </div>
  );
}
