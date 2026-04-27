import { NextRequest, NextResponse } from "next/server";
import { getSeedRows, buildSessions, buildHeatmap, TRADERS } from "@/lib/seedData";

const SECRET = "97791d4db2aa5f689c3cc39356ce35762f0a73aa70923039d8ef72a2840a1b02";

async function validateJWT(req: NextRequest): Promise<{userId:string}|NextResponse> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
  const token = auth.slice(7);
  try {
    const parts = token.split(".");
    if (parts.length!==3) throw new Error();
    const payload = JSON.parse(Buffer.from(parts[1],"base64").toString());
    if (payload.exp<Math.floor(Date.now()/1000)) return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
    const crypto=require("crypto");
    const sigData=`${parts[0]}.${parts[1]}`;
    const expected=crypto.createHmac("sha256",SECRET).update(sigData).digest("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
    if (expected!==parts[2]) return NextResponse.json({error:"UNAUTHORIZED"},{status:401});
    return {userId:payload.sub};
  } catch { return NextResponse.json({error:"UNAUTHORIZED"},{status:401}); }
}

export async function GET(req: NextRequest) {
  const authResult=await validateJWT(req);
  if (authResult instanceof NextResponse) return authResult;
  const {userId}=authResult;
  const url=new URL(req.url); const qUserId=url.searchParams.get("userId");
  if (qUserId&&qUserId!==userId) return NextResponse.json({error:"FORBIDDEN"},{status:403});
  const rows=await getSeedRows();
  const userRows=rows.filter(r=>r.userId===userId);
  const sessions=buildSessions(userRows);
  const heatmap=buildHeatmap(userRows,userId);
  return NextResponse.json({sessions:Array.from(sessions.values()),heatmap});
}
