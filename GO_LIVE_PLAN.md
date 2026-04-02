# StockDash — Go-Live Action Plan

**Goal:** Get paying users within 30 days.

---

## 🔴 CRITICAL BLOCKERS — Fix These First (Day 1–2)

These are breaking issues that will stop the app from working for any user who signs up.

### 1. FMP API Key (Market Data — $0 prices everywhere)

This is the single biggest visible bug. Every user with positions sees $0 values and –100% P&L until this is fixed.

**Steps:**
1. Go to [financialmodelingprep.com](https://financialmodelingprep.com) → sign up / log in
2. Copy your API key from the dashboard
3. In Netlify: **Site Settings → Environment Variables** → set `FMP_API_KEY = your_key`
4. Trigger a redeploy (Deploys → Trigger deploy)

> The free FMP tier gives 250 requests/day — enough to launch. Upgrade to Starter ($14/mo) once you have paying users.

---

### 2. Run Supabase Migration (Referrals page will crash without this)

**Steps:**
1. Go to your [Supabase SQL editor](https://supabase.com/dashboard/project/iaqzfiwopygfgbnguucx/sql)
2. Open the file `supabase/migrations/add_referrals.sql` from your project folder
3. Paste and run it

This creates the `referral_codes` and `referrals` tables. Without it, `/referrals` throws a DB error.

---

### 3. Copy All Env Vars to Netlify

If you haven't already, add every env var below to **Netlify → Site Settings → Environment Variables**:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `FMP_API_KEY` | financialmodelingprep.com dashboard |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks (see Section 4) |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO` | Stripe → Products → Pro plan price ID |
| `NEXT_PUBLIC_STRIPE_PRICE_ADVISOR` | Stripe → Products → Advisor plan price ID |
| `NEXT_PUBLIC_APP_URL` | Your live domain (e.g. `https://stockdash.app`) |
| `RESEND_API_KEY` | resend.com dashboard |
| `ADMIN_SECRET_KEY` | Make up a strong password for `/admin` |

After adding, redeploy.

---

## 🟡 REQUIRED TO MAKE MONEY — Stripe Go-Live (Day 2–3)

### 4. Switch Stripe from Test Mode to Live

1. In the [Stripe Dashboard](https://dashboard.stripe.com), toggle from **Test** to **Live** mode (top-left toggle)
2. Go to **Developers → API Keys** and copy your `sk_live_...` secret key
3. Replace `STRIPE_SECRET_KEY` in Netlify with the live key
4. In Stripe **Products**, create your two products:
   - **Pro** — $9.99/month recurring
   - **Advisor** — $29.99/month recurring
5. Copy the price IDs (start with `price_...`) into Netlify as `NEXT_PUBLIC_STRIPE_PRICE_PRO` and `NEXT_PUBLIC_STRIPE_PRICE_ADVISOR`
6. Register your **Webhook** in Stripe → Webhooks → Add endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET` in Netlify

> ⚠️ Also verify your email address in the Stripe dashboard — required before live charges work.

---

## 🟢 LAUNCH CHECKLIST (Day 3–5)

### 5. Custom Domain

A custom domain makes the app look professional and builds trust.

1. Buy a domain (suggestions: `stockdash.app`, `mystockdash.com`, `portfoliodash.io` — ~$10–15/yr on Namecheap or Cloudflare Registrar)
2. In Netlify → **Domain management** → Add custom domain
3. Follow Netlify's DNS instructions to point the domain
4. Netlify auto-provisions SSL (HTTPS) via Let's Encrypt — takes ~10 min

Update `NEXT_PUBLIC_APP_URL` in Netlify env vars to your new domain after this.

---

### 6. Verify the Full User Flow End-to-End

Walk through this as a new user before launching:

- [ ] Sign up with a new email (test Supabase auth + onboarding flow)
- [ ] Add an account and a few positions
- [ ] Confirm prices load correctly (not $0)
- [ ] Go to Billing → upgrade to Pro → confirm Stripe checkout works → confirm Pro features unlock
- [ ] Visit `/referrals` → confirm a code generates (requires migration from Step 2)
- [ ] Visit `/admin` with your `ADMIN_SECRET_KEY` → confirm MRR/user stats appear
- [ ] Test on mobile — check the bottom nav and "More" drawer

---

## 💰 HOW TO GET FIRST PAYING USERS (Week 1–2)

### 7. Free-to-Paid Conversion Strategy

The app already has a solid free tier — use it as the hook.

**Gated features that create upgrade pressure:**
- CSV + PDF export (Pro)
- Earnings calendar (Pro)
- Monte Carlo simulation (Pro)
- Correlation matrix (Pro)
- Tax lot simulator (Pro)
- Client mode (Advisor)

**Recommended flow:**
- Let users add accounts/positions for free
- Show upgrade prompts naturally when they try a Pro feature
- The `/billing` page already handles this — make sure it looks polished

---

### 8. Referral Program (Already Built — Just Activate It)

The referral system is fully coded. Once `add_referrals.sql` runs (Step 2 above):

- Users get a unique code at `/referrals`
- They can share via X, LinkedIn, or email (buttons already built)
- Rewards ladder: 1 / 3 / 5 / 10 referrals

Consider offering a **free month of Pro** for every 3 referrals — add this to the `/referrals` page copy.

---

### 9. Where to Post / Find Your First Users

Target these communities (free, no ads required):

| Platform | Community | What to post |
|---|---|---|
| Reddit | r/personalfinance, r/investing, r/financialindependence | "Built a free portfolio dashboard — looking for beta testers" |
| Reddit | r/SideProject, r/Entrepreneur | "Launched a portfolio tracking SaaS — feedback welcome" |
| Product Hunt | Launch on a Tuesday or Wednesday | Pre-write your PH description now |
| Twitter/X | #buildinpublic, #SaaS, #investing | Share screenshots, before/after |
| Facebook Groups | "Stock Market Investors", "Personal Finance" groups | Genuine value-add posts |
| IndieHackers | Post a milestone update | Great for SaaS founders |
| Nextdoor / LinkedIn | Local financial advisor groups | Target the Advisor plan ($29.99/mo) |

**Best ROI early on:** target financial advisors directly. One Advisor subscriber at $29.99/mo is worth 3 Pro subscribers. Look for RIA (Registered Investment Advisor) Facebook groups and LinkedIn communities.

---

## 📊 MONETIZATION MILESTONES

| Month | Goal | Revenue |
|---|---|---|
| Month 1 | 5 free users, 2 Pro | ~$20/mo |
| Month 2 | 20 free, 8 Pro, 1 Advisor | ~$110/mo |
| Month 3 | 50 free, 20 Pro, 5 Advisor | ~$350/mo |
| Month 6 | 150 free, 50 Pro, 15 Advisor | ~$950/mo |

These are conservative — once you hit Product Hunt or a Reddit thread that takes off, growth can be 5–10x faster.

---

## 🔧 QUICK WINS — Polish Before Launch (1–2 hours total)

These are small things that make the app feel production-ready:

- [ ] Add a favicon — update `/public/favicon.ico` with a custom icon (use favicon.io — free)
- [ ] Update the page `<title>` tags — search for `metadata` in `layout.tsx` files and set your brand name
- [ ] Add a basic landing page at `/` (currently redirects straight to login — a landing page converts visitors to signups much better)
- [ ] Set up [Resend](https://resend.com) account + `RESEND_API_KEY` so the email digest feature works
- [ ] Test the `/report` PDF print page — this is a major Pro selling point

---

## 📋 PRIORITY ORDER SUMMARY

| Priority | Task | Time |
|---|---|---|
| 🔴 1 | Set FMP_API_KEY in Netlify + redeploy | 10 min |
| 🔴 2 | Run add_referrals.sql in Supabase | 5 min |
| 🔴 3 | Copy all env vars to Netlify | 20 min |
| 🟡 4 | Switch Stripe to live mode + create products + webhook | 30 min |
| 🟢 5 | Buy + connect custom domain | 30 min |
| 🟢 6 | End-to-end user flow test | 30 min |
| 🟢 7 | Add landing page at `/` | 2–4 hrs |
| 💰 8 | Post in 3 Reddit communities | 30 min |
| 💰 9 | Post on Product Hunt | 2 hrs (prep) |

**Total time to revenue-ready:** ~4–6 hours of focused work.
