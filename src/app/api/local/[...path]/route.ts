import { NextRequest, NextResponse } from "next/server";
import { getSeedRows, buildSessions, buildMetrics, buildProfile, buildHeatmap, TRADERS } from "@/lib/seedData";

const SECRET = "97791d4db2aa5f689c3cc39356ce35762f0a73aa70923039d8ef72a2840a1b02";

function traceId(): string { return Math.random().toString(36).slice(2)+Date.now().toString(36); }

async function validateJWT(req: NextRequest): Promise<{userId:string}|NextResponse> {
  // SSE/EventSource cannot set Authorization headers in browser, so also accept ?token= query param
  const auth = req.headers.get("authorization");
  const queryToken = new URL(req.url).searchParams.get("token");
  const rawToken = auth?.startsWith("Bearer ") ? auth.slice(7) : queryToken;
  if (!rawToken) return NextResponse.json({error:"UNAUTHORIZED",message:"Missing token",traceId:traceId()},{status:401});
  const token = rawToken;
  try {
    const parts = token.split(".");
    if (parts.length!==3) throw new Error("malformed");
    const payload = JSON.parse(Buffer.from(parts[1],"base64").toString());
    if (payload.exp < Math.floor(Date.now()/1000)) return NextResponse.json({error:"UNAUTHORIZED",message:"Token expired",traceId:traceId()},{status:401});
    const crypto = require("crypto");
    const sigData = `${parts[0]}.${parts[1]}`;
    const expected = crypto.createHmac("sha256",SECRET).update(sigData).digest("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
    if (expected!==parts[2]) return NextResponse.json({error:"UNAUTHORIZED",message:"Invalid signature",traceId:traceId()},{status:401});
    return {userId:payload.sub};
  } catch { return NextResponse.json({error:"UNAUTHORIZED",message:"Malformed token",traceId:traceId()},{status:401}); }
}

export async function GET(req: NextRequest, {params}:{params:{path:string[]}}) {
  const start=Date.now(); const tid=traceId(); const path=params.path;
  const authResult = await validateJWT(req);
  if (authResult instanceof NextResponse) return authResult;
  const {userId:jwtUserId} = authResult;
  const rows = await getSeedRows();

  if (path[0]==="health") return NextResponse.json({status:"ok",dbConnection:"connected",queueLag:0,timestamp:new Date().toISOString()});

  if (path[0]==="sessions"&&path[1]&&!path[2]) {
    const sessions=buildSessions(rows); const session=sessions.get(path[1]);
    if (!session) return NextResponse.json({error:"NOT_FOUND",message:"Session not found",traceId:tid},{status:404});
    if (session.userId!==jwtUserId) return NextResponse.json({error:"FORBIDDEN",message:"Cross-tenant access denied.",traceId:tid},{status:403});
    console.log(JSON.stringify({traceId:tid,userId:jwtUserId,latency:Date.now()-start,statusCode:200}));
    return NextResponse.json(session);
  }

  if (path[0]==="sessions"&&path[1]&&path[2]==="coaching") {
    const sessions=buildSessions(rows); const session=sessions.get(path[1]);
    if (!session) return NextResponse.json({error:"NOT_FOUND",message:"Session not found",traceId:tid},{status:404});
    if (session.userId!==jwtUserId) return NextResponse.json({error:"FORBIDDEN",message:"Cross-tenant access denied.",traceId:tid},{status:403});
    const trader=TRADERS.find(t=>t.userId===jwtUserId);
    const msgs: Record<string,string> = {
      revenge_trading:`Session complete. Win rate ${Math.round(session.winRate*100)}% across ${session.tradeCount} trades, P&L ${session.totalPnl>=0?"+":""}$${session.totalPnl.toFixed(2)}. I see a pattern: several entries came right after a loss with anxious emotional state — that's the revenge cycle. After any loss tomorrow, step away for 10 minutes. Your best trades came when you followed your plan calmly.`,
      overtrading:`You logged ${session.tradeCount} trades with ${Math.round(session.winRate*100)}% win rate. More trades doesn't mean more edge. Set a hard cap of 6 trades tomorrow. Quality over quantity.`,
      fomo_entries:`${Math.round(session.winRate*100)}% win rate today. Trades where you waited for your setup outperformed the chased entries. Every trade you didn't take because it wasn't your setup saved you money.`,
      default:`Session complete. ${Math.round(session.winRate*100)}% win rate, ${session.tradeCount} trades, P&L: ${session.totalPnl>=0?"+":""}$${session.totalPnl.toFixed(2)}. Protect your process and review any deviations.`,
    };
    const msg = msgs[trader?.pathology||"default"]||msgs.default;
    const tokens = msg.split(" ");
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (let i=0;i<tokens.length;i++) {
          await new Promise(r=>setTimeout(r,60));
          controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({token:(i>0?" ":"")+tokens[i],index:i})}\n\n`));
        }
        controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({fullMessage:msg})}\n\n`));
        controller.close();
      }
    });
    return new Response(stream, {headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive"}});
  }

  if (path[0]==="users"&&path[1]&&path[2]==="metrics") {
    if (path[1]!==jwtUserId) return NextResponse.json({error:"FORBIDDEN",message:"Cross-tenant access denied.",traceId:tid},{status:403});
    const metrics=buildMetrics(rows,path[1]);
    console.log(JSON.stringify({traceId:tid,userId:jwtUserId,latency:Date.now()-start,statusCode:200}));
    return NextResponse.json(metrics);
  }

  if (path[0]==="users"&&path[1]&&path[2]==="profile") {
    if (path[1]!==jwtUserId) return NextResponse.json({error:"FORBIDDEN",message:"Cross-tenant access denied.",traceId:tid},{status:403});
    const profile=buildProfile(rows,path[1]);
    return NextResponse.json(profile);
  }

  return NextResponse.json({error:"NOT_FOUND",message:"Route not found",traceId:tid},{status:404});
}

export async function POST(req: NextRequest, {params}:{params:{path:string[]}}) {
  const tid=traceId(); const path=params.path;
  const authResult = await validateJWT(req);
  if (authResult instanceof NextResponse) return authResult;
  const {userId:jwtUserId}=authResult;
  if (path[0]==="sessions"&&path[1]&&path[2]==="debrief") {
    const rows=await getSeedRows(); const sessions=buildSessions(rows); const session=sessions.get(path[1]);
    if (!session) return NextResponse.json({error:"NOT_FOUND",message:"Session not found",traceId:tid},{status:404});
    if (session.userId!==jwtUserId) return NextResponse.json({error:"FORBIDDEN",message:"Cross-tenant access denied.",traceId:tid},{status:403});
    return NextResponse.json({debriefId:Math.random().toString(36).slice(2),sessionId:path[1],savedAt:new Date().toISOString()},{status:201});
  }
  return NextResponse.json({error:"NOT_FOUND",message:"Route not found",traceId:tid},{status:404});
}
