export type AssetClass = 'equity' | 'crypto' | 'forex';
export type Direction = 'long' | 'short';
export type TradeStatus = 'open' | 'closed' | 'cancelled';
export type EmotionalState = 'calm' | 'anxious' | 'greedy' | 'fearful' | 'neutral';
export type Outcome = 'win' | 'loss';
export type Granularity = 'hourly' | 'daily' | 'rolling30d';

export interface Trade {
  tradeId: string; userId: string; sessionId: string; asset: string;
  assetClass: AssetClass; direction: Direction; entryPrice: number;
  exitPrice: number | null; quantity: number; entryAt: string; exitAt: string | null;
  status: TradeStatus; planAdherence: number | null; emotionalState: EmotionalState | null;
  entryRationale: string | null; outcome: Outcome | null; pnl: number | null;
  revengeFlag: boolean; createdAt: string; updatedAt: string;
}
export interface SessionSummary {
  sessionId: string; userId: string; date: string; notes: string | null;
  tradeCount: number; winRate: number; totalPnl: number; trades: Trade[];
}
export interface DebriefInput {
  overallMood: EmotionalState; keyMistake: string | null; keyLesson: string | null;
  planAdherenceRating: number; willReviewTomorrow: boolean;
}
export interface TimeseriesBucket {
  bucket: string; tradeCount: number; winRate: number; pnl: number; avgPlanAdherence: number;
}
export interface BehavioralMetrics {
  userId: string; granularity: Granularity; from: string; to: string;
  planAdherenceScore: number; sessionTiltIndex: number;
  winRateByEmotionalState: Record<string, { wins: number; losses: number; winRate: number }>;
  revengeTrades: number; overtradingEvents: number; timeseries: TimeseriesBucket[];
}
export interface BehavioralProfile {
  userId: string; generatedAt: string;
  dominantPathologies: { pathology: string; confidence: number; evidenceSessions: string[]; evidenceTrades: string[] }[];
  strengths: string[];
  peakPerformanceWindow: { startHour: number; endHour: number; winRate: number } | null;
}
export interface HeatmapDay {
  date: string; score: number | null; sessionId: string | null; tradeCount: number; pnl: number;
}
export interface Trader { userId: string; name: string; pathology: string; }
