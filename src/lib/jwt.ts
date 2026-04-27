const SIGNING_SECRET = "97791d4db2aa5f689c3cc39356ce35762f0a73aa70923039d8ef72a2840a1b02";

function base64url(str: string): string {
  return Buffer.from(str).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
}

export async function mintToken(userId: string, name: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify({ sub: userId, iat: now, exp: now + 86400, role: "trader", name }));
  const sigData = `${header}.${body}`;
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey("raw", enc.encode(SIGNING_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await window.crypto.subtle.sign("HMAC", key, enc.encode(sigData));
    const sigB64 = btoa(Array.from(new Uint8Array(sig)).map(b => String.fromCharCode(b)).join("")).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
    return `${sigData}.${sigB64}`;
  }
  const crypto = require("crypto");
  const sig = crypto.createHmac("sha256", SIGNING_SECRET).update(sigData).digest("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  return `${sigData}.${sig}`;
}
