import type { Trade, SessionSummary, BehavioralMetrics, BehavioralProfile, HeatmapDay, Trader } from "@/types";
import seedJson from "../../seed/data.json";

export const TRADERS: Trader[] = [
  { userId: "f412f236-4edc-47a2-8f54-8763a6ed2ce8", name: "Alex Mercer", pathology: "revenge_trading" },
  { userId: "fcd434aa-2201-4060-aeb2-f44c77aa0683", name: "Jordan Lee", pathology: "overtrading" },
  { userId: "84a6a3dd-f2d0-4167-960b-7319a6033d49", name: "Sam Rivera", pathology: "fomo_entries" },
  { userId: "4f2f0816-f350-4684-b6c3-29bbddbb1869", name: "Casey Kim", pathology: "plan_non_adherence" },
  { userId: "75076413-e8e8-44ac-861f-c7acb3902d6d", name: "Morgan Bell", pathology: "premature_exit" },
  { userId: "8effb0f2-f16b-4b5f-87ab-7ffca376f309", name: "Taylor Grant", pathology: "loss_running" },
  { userId: "50dd1053-73b0-43c5-8d0f-d2af88c01451", name: "Riley Stone", pathology: "session_tilt" },
  { userId: "af2cfc5e-c132-4989-9c12-2913f89271fb", name: "Drew Patel", pathology: "time_of_day_bias" },
  { userId: "9419073a-3d58-4ee6-a917-be2d40aecef2", name: "Quinn Torres", pathology: "position_sizing_inconsistency" },
  { userId: "e84ea28c-e5a7-49ef-ac26-a873e32667bd", name: "Avery Chen", pathology: "none" },
];

export interface SeedRow {
  tradeId: string; userId: string; traderName: string; sessionId: string;
  asset: string; assetClass: string; direction: string; entryPrice: number;
  exitPrice: number | null; quantity: number; entryAt: string; exitAt: string | null;
  status: string; outcome: string | null; pnl: number | null; planAdherence: number | null;
  emotionalState: string | null; entryRationale: string | null; revengeFlag: boolean;
  groundTruthPathologies: string;
}

export function rowToTrade(r: SeedRow): Trade {
  return {
    tradeId: r.tradeId, userId: r.userId, sessionId: r.sessionId, asset: r.asset,
    assetClass: r.assetClass as Trade["assetClass"], direction: r.direction as Trade["direction"],
    entryPrice: r.entryPrice, exitPrice: r.exitPrice, quantity: r.quantity,
    entryAt: r.entryAt, exitAt: r.exitAt, status: r.status as Trade["status"],
    planAdherence: r.planAdherence, emotionalState: r.emotionalState as Trade["emotionalState"],
    entryRationale: r.entryRationale, outcome: r.outcome as Trade["outcome"],
    pnl: r.pnl, revengeFlag: r.revengeFlag, createdAt: r.entryAt, updatedAt: r.exitAt || r.entryAt,
  };
}

export function buildSessions(rows: SeedRow[]): Map<string, SessionSummary> {
  const sessions = new Map<string, SessionSummary>();
  for (const r of rows) {
    if (!sessions.has(r.sessionId)) {
      sessions.set(r.sessionId, { sessionId: r.sessionId, userId: r.userId, date: r.entryAt, notes: null, tradeCount: 0, winRate: 0, totalPnl: 0, trades: [] });
    }
    const s = sessions.get(r.sessionId)!;
    s.trades.push(rowToTrade(r)); s.tradeCount++; s.totalPnl += r.pnl || 0;
  }
  for (const s of sessions.values()) {
    const closed = s.trades.filter(t => t.outcome);
    s.winRate = closed.length > 0 ? closed.filter(t => t.outcome === "win").length / closed.length : 0;
    s.totalPnl = Math.round(s.totalPnl * 100) / 100;
  }
  return sessions;
}

export function buildMetrics(rows: SeedRow[], userId: string): BehavioralMetrics {
  const userRows = rows.filter(r => r.userId === userId);
  const closedRows = userRows.filter(r => r.status === "closed");
  const recentAdherence = closedRows.slice(-10).map(r => r.planAdherence || 0);
  const planAdherenceScore = recentAdherence.length > 0 ? recentAdherence.reduce((a,b)=>a+b,0)/recentAdherence.length : 0;
  const lossFollowing = closedRows.filter(r => r.revengeFlag).length;
  const sessionTiltIndex = closedRows.length > 0 ? lossFollowing / closedRows.length : 0;
  const winRateByEmotionalState: BehavioralMetrics["winRateByEmotionalState"] = {};
  for (const r of closedRows) {
    const state = r.emotionalState || "neutral";
    if (!winRateByEmotionalState[state]) winRateByEmotionalState[state] = { wins:0, losses:0, winRate:0 };
    if (r.outcome === "win") winRateByEmotionalState[state].wins++;
    else if (r.outcome === "loss") winRateByEmotionalState[state].losses++;
  }
  for (const state of Object.keys(winRateByEmotionalState)) {
    const { wins, losses } = winRateByEmotionalState[state];
    winRateByEmotionalState[state].winRate = (wins+losses)>0 ? wins/(wins+losses) : 0;
  }
  const byDay = new Map<string, {count:number;wins:number;pnl:number;adherence:number[]}>();
  for (const r of closedRows) {
    const day = r.entryAt.slice(0,10);
    if (!byDay.has(day)) byDay.set(day, {count:0,wins:0,pnl:0,adherence:[]});
    const d = byDay.get(day)!; d.count++; if (r.outcome==="win") d.wins++; d.pnl+=r.pnl||0; if(r.planAdherence)d.adherence.push(r.planAdherence);
  }
  const timeseries = Array.from(byDay.entries()).sort().map(([day,d])=>({
    bucket: day+"T00:00:00Z", tradeCount:d.count, winRate:d.count>0?d.wins/d.count:0,
    pnl:Math.round(d.pnl*100)/100, avgPlanAdherence:d.adherence.length>0?d.adherence.reduce((a,b)=>a+b,0)/d.adherence.length:0,
  }));
  return {
    userId, granularity:"daily", from:userRows[0]?.entryAt||"", to:userRows[userRows.length-1]?.entryAt||"",
    planAdherenceScore:Math.round(planAdherenceScore*100)/100, sessionTiltIndex:Math.round(sessionTiltIndex*100)/100,
    winRateByEmotionalState, revengeTrades:userRows.filter(r=>r.revengeFlag).length, overtradingEvents:0, timeseries,
  };
}

export function buildProfile(rows: SeedRow[], userId: string): BehavioralProfile {
  const trader = TRADERS.find(t => t.userId === userId);
  const userRows = rows.filter(r => r.userId === userId);
  const sessions = buildSessions(userRows);
  const dominantPathologies = trader?.pathology && trader.pathology !== "none" ? [{
    pathology: trader.pathology, confidence: 0.87,
    evidenceSessions: Array.from(sessions.keys()).slice(0,3),
    evidenceTrades: userRows.filter(r=>r.revengeFlag).map(r=>r.tradeId).slice(0,5),
  }] : [];
  const closedWins = userRows.filter(r=>r.status==="closed"&&r.outcome==="win");
  const hourWins = new Map<number,number>();
  for (const r of closedWins) { const h=new Date(r.entryAt).getUTCHours(); hourWins.set(h,(hourWins.get(h)||0)+1); }
  let peakHour=9, peakCount=0;
  for (const [h,c] of hourWins.entries()) { if(c>peakCount){peakCount=c;peakHour=h;} }
  return {
    userId, generatedAt: new Date().toISOString(), dominantPathologies,
    strengths:["Consistent position sizing","Strong morning session discipline"],
    peakPerformanceWindow:{startHour:peakHour,endHour:peakHour+2,winRate:0.72},
  };
}

export function buildHeatmap(rows: SeedRow[], userId: string): HeatmapDay[] {
  const userRows = rows.filter(r=>r.userId===userId);
  const byDay = new Map<string,{sessionId:string;latestAt:string;pnl:number;count:number;adherence:number[]}>();
  for (const r of userRows) {
    const day=r.entryAt.slice(0,10);
    if(!byDay.has(day))byDay.set(day,{sessionId:r.sessionId,latestAt:r.entryAt,pnl:0,count:0,adherence:[]});
    const d=byDay.get(day)!;
    if(r.entryAt > d.latestAt){ d.sessionId=r.sessionId; d.latestAt=r.entryAt; }
    d.pnl+=r.pnl||0; d.count++; if(r.planAdherence)d.adherence.push(r.planAdherence);
  }
  return Array.from(byDay.entries()).sort().map(([date,d])=>({
    date, score:d.adherence.length>0?d.adherence.reduce((a,b)=>a+b,0)/d.adherence.length:null,
    sessionId:d.sessionId, tradeCount:d.count, pnl:Math.round(d.pnl*100)/100,
  }));
}

let _rows: SeedRow[] | null = null;
export async function getSeedRows(): Promise<SeedRow[]> {
  if (_rows) return _rows;
  _rows = (seedJson as any[]).map(obj => ({
    tradeId: obj.tradeId,
    userId: obj.userId,
    traderName: obj.traderName,
    sessionId: obj.sessionId,
    asset: obj.asset,
    assetClass: obj.assetClass,
    direction: obj.direction,
    entryPrice: parseFloat(obj.entryPrice),
    exitPrice: obj.exitPrice ? parseFloat(obj.exitPrice) : null,
    quantity: parseFloat(obj.quantity),
    entryAt: obj.entryAt,
    exitAt: obj.exitAt || null,
    status: obj.status,
    outcome: obj.outcome || null,
    pnl: obj.pnl ? parseFloat(obj.pnl) : null,
    planAdherence: obj.planAdherence ? parseInt(obj.planAdherence) : null,
    emotionalState: obj.emotionalState || null,
    entryRationale: obj.entryRationale || null,
    revengeFlag: obj.revengeFlag === "true",
    groundTruthPathologies: obj.groundTruthPathologies,
  })) as SeedRow[];
  return _rows;
}