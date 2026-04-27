"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { SessionSummary } from "@/types";
import { mintToken } from "@/lib/jwt";
import { TRADERS } from "@/lib/seedData";
import DebriefFlow from "@/components/debrief/DebriefFlow";
import { SkeletonCard, ErrorState } from "@/components/shared/States";

function SessionContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params.id as string;
  // userId passed as query param from dashboard navigation for fast auth
  // Falls back to brute-force if accessed directly
  const hintUserId = searchParams.get("userId");

  const [session, setSession] = useState<SessionSummary | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // If we have a userId hint, try that trader first (fast path)
      const orderedTraders = hintUserId
        ? [
            ...TRADERS.filter((t) => t.userId === hintUserId),
            ...TRADERS.filter((t) => t.userId !== hintUserId),
          ]
        : TRADERS;

      let found = false;
      for (const t of orderedTraders) {
        const tok = await mintToken(t.userId, t.name);
        const res = await fetch(`/api/local/sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${tok}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data);
          setToken(tok);
          found = true;
          break;
        }
        // 403 = wrong trader, 404 = session doesn't exist at all
        if (res.status === 404) break;
      }
      if (!found) throw new Error("Session not found or access denied");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId, hintUserId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
        <div style={{ marginBottom: 24 }}>
          <div className="skeleton" style={{ width: 120, height: 18, marginBottom: 24 }} />
          <div className="skeleton" style={{ width: "60%", height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: "40%", height: 16, marginBottom: 24 }} />
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ flex: 1, height: 24, borderRadius: 12 }} />
            ))}
          </div>
        </div>
        <SkeletonCard lines={5} height={16} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
        <ErrorState message={error || "Session not found"} onRetry={loadSession} />
        <button
          className="btn btn-ghost"
          style={{ marginTop: 16 }}
          aria-label="Back to dashboard"
          onClick={() => router.push("/")}
        >
          ← Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", padding: "24px 16px" }}>
      <DebriefFlow
        session={session}
        token={token}
        onComplete={() => router.push("/")}
        onBack={() => router.back()}
      />
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          <div className="skeleton" style={{ width: "60%", height: 28, marginBottom: 24 }} />
          <SkeletonCard lines={5} height={16} />
        </div>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
