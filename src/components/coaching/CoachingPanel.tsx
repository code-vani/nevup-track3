"use client";
import React, { useState, useEffect, useRef } from "react";
import { Spinner } from "@/components/shared/States";

export default function CoachingPanel({ sessionId, token }: { sessionId: string; userId: string; token: string }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "streaming" | "done" | "error" | "reconnecting">("idle");
  const [attempt, setAttempt] = useState(0);
  const mountedRef = useRef(true);
  const esRef = useRef<EventSource | null>(null);
  const attemptRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    attemptRef.current = 0;
    setMessage("");
    setAttempt(0);
    setStatus("idle");

    const connectSSE = () => {
      if (!mountedRef.current) return;
      const isRetry = attemptRef.current > 0;
      setStatus(isRetry ? "reconnecting" : "connecting");

      const url = `/api/local/sessions/${sessionId}/coaching?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener("token", (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const d = JSON.parse(e.data);
          setStatus("streaming");
          setMessage((prev) => prev + d.token);
        } catch {}
      });

      es.addEventListener("done", (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const d = JSON.parse(e.data);
          if (d.fullMessage) setMessage(d.fullMessage);
        } catch {}
        setStatus("done");
        es.close();
      });

      es.onerror = () => {
        es.close();
        if (!mountedRef.current) return;
        const nextAttempt = attemptRef.current + 1;
        attemptRef.current = nextAttempt;
        setAttempt(nextAttempt);
        // Exponential backoff capped at 30s
        const delay = Math.min(Math.pow(2, nextAttempt - 1) * 1000, 30000);
        retryTimerRef.current = setTimeout(connectSSE, delay);
      };

      es.onopen = () => {
        if (!mountedRef.current) return;
        attemptRef.current = 0;
        setAttempt(0);
      };
    };

    const startTimer = setTimeout(connectSSE, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(startTimer);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      esRef.current?.close();
    };
  }, [sessionId, token]);

  return (
    <div className="card card-glow" style={{ minHeight: 160 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "var(--accent-dim)", border: "1px solid var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>🧠</div>
        <div>
          <h3 style={{ marginBottom: 0 }}>AI Coach</h3>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color:
            status === "done" ? "var(--accent)" :
            status === "error" ? "var(--red)" : "var(--text-muted)",
          }}>
            {status === "connecting" && "Connecting..."}
            {status === "streaming" && "Streaming..."}
            {status === "done" && "Complete"}
            {status === "reconnecting" && `Reconnecting... (attempt ${attempt})`}
            {status === "error" && "Connection failed"}
            {status === "idle" && "Initializing..."}
          </span>
        </div>
        {(status === "connecting" || status === "streaming") && <Spinner size={16} />}
      </div>

      {status === "reconnecting" && (
        <div style={{
          padding: "8px 12px",
          background: "rgba(255,159,69,0.1)",
          border: "1px solid rgba(255,159,69,0.3)",
          borderRadius: "var(--radius)",
          color: "var(--orange)", fontSize: 12, marginBottom: 12,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>↻</span>
          Reconnecting in {Math.min(Math.pow(2, attempt - 1), 30)}s... (attempt {attempt})
        </div>
      )}

      <div style={{
        fontSize: 14, lineHeight: 1.8,
        color: message ? "var(--text)" : "var(--text-muted)",
        minHeight: 80,
        fontFamily: message ? "var(--font-sans)" : "var(--font-mono)",
      }}>
        {message || (status === "connecting" || status === "idle" ? "Analyzing your session..." : "Waiting to start...")}
        {status === "streaming" && (
          <span style={{
            display: "inline-block", width: 2, height: 16,
            background: "var(--accent)", marginLeft: 2,
            animation: "pulse-dot 1s infinite", verticalAlign: "middle",
          }} />
        )}
      </div>
    </div>
  );
}
