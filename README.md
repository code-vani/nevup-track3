# 🚀 NevUp Track 3 — System of Engagement

Post-session debrief flow + behavioural dashboard for retail day traders.
Built to help traders analyze decisions, identify behavioral patterns, and improve performance over time.

---

## ✨ Features

* 📊 **90-day Heatmap Dashboard** (custom SVG, no external libraries)
* 🧠 **5-Step Debrief Flow**

  * Trade Replay
  * Emotion Tagging
  * Rule Adherence
  * AI Coaching
  * Save Session
* 🤖 **Real-time AI Coaching (SSE)**

  * Streaming responses
  * Auto-reconnect with exponential backoff
* 📈 **10 Trader Profiles**

  * Preloaded behavioral patterns from dataset
* ⚡ **Robust UI States**

  * Loading skeletons
  * Error + retry handling
  * Empty states across all components

---

## 📸 Screenshots

### 📊 Heatmap Dashboard

![Heatmap](https://raw.githubusercontent.com/code-vani/nevup-track3/main/public/screenshots/heatmap-loading.svg)

### 🧠 Debrief Flow

![Debrief](https://raw.githubusercontent.com/code-vani/nevup-track3/main/public/screenshots/debrief-loading.svg)

### 🤖 Coaching Panel

![Coaching](https://raw.githubusercontent.com/code-vani/nevup-track3/main/public/screenshots/coaching-loading.svg)

---

## 🛠️ Tech Stack

* **Frontend:** Next.js (App Router), TypeScript
* **Backend:** API Routes (Node.js)
* **Data:** Seed CSV dataset
* **Streaming:** Server-Sent Events (SSE)
* **DevOps:** Docker, Docker Compose
* **Testing:** Lighthouse CI

---

## ⚡ Quick Start

### 🐳 Docker (Recommended)

```bash
docker compose up
```

* App → http://localhost:3000
* Mock API → http://localhost:4010

---

### 💻 Local Development

```bash
npm install
npm run dev
```

---

## 🧪 Lighthouse CI

Run performance and accessibility audits:

```bash
npm run build
npm run start
npm run lhci
```

✔ Ensures ≥90 score in:

* Performance
* Accessibility
* Best Practices

---

## 🔐 Auth Test (403 Validation)

```bash
TOKEN=$(node -e "
const c=require('crypto'),s='97791d4db2aa5f689c3cc39356ce35762f0a73aa70923039d8ef72a2840a1b02';
const b=x=>Buffer.from(x).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const now=Math.floor(Date.now()/1000);
const h=b(JSON.stringify({alg:'HS256',typ:'JWT'}));
const p=b(JSON.stringify({sub:'f412f236-4edc-47a2-8f54-8763a6ed2ce8',iat:now,exp:now+86400,role:'trader'}));
const sig=c.createHmac('sha256',s).update(h+'.'+p).digest('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
console.log(h+'.'+p+'.'+sig);
")

curl -i -H "Authorization: Bearer $TOKEN" \
http://localhost:3000/api/local/users/fcd434aa-2201-4060-aeb2-f44c77aa0683/metrics
```

**Expected response:**

```
HTTP/1.1 403 {"error":"FORBIDDEN","message":"Cross-tenant access denied."}
```

---

## 📁 Project Structure

```
src/
 ├── app/              # Routes & pages
 ├── components/       # UI components
 ├── lib/              # Utilities (JWT, seed data)
 ├── types/            # Type definitions
public/screenshots/    # UI screenshots
seed/                  # Dataset & API schema
```

---

## 📌 Highlights

* End-to-end working product
* Handles real-world edge cases (network failure, retries, empty states)
* Clean architecture with modular components
* Focus on performance, UX, and reliability

---

## 👤 Author

**Vanshika Garg**
GitHub: https://github.com/code-vani
