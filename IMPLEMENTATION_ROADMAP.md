# Stock Dashboard — Implementation Roadmap

> Last updated: March 24, 2026
> Goal: Ship a production-ready SaaS product for investment advisors and home office investors.

---

## Phase 1 — Bug Fixes & Critical Gaps
*Priority: Do these first. Broken/missing fundamentals that affect daily usability.*

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 1.1 | **Fix disconnected Rebalance page** — Wire `AllocationTargetEditor`, `DriftIndicator`, `RebalanceSuggestionList` into `/rebalance`. Rename route or create a dedicated `/rebalance` page separate from `/forecast`. | Medium | Components already built, just needs a page + wiring |
| 1.2 | **Auto-snapshot on login** — Trigger `addSnapshot()` automatically on user login if today's snapshot doesn't already exist. This powers the "Portfolio Value Over Time" chart. | Small | One hook call on auth hydration |
| 1.3 | **Price refresh + last-updated timestamp** — Add a "Refresh Prices" button and display "Last updated: X min ago" on dashboard and portfolio pages. | Small | Already have API clients; just add polling logic |
| 1.4 | **Fix Weekly Buys watchlist seeding** — Default the watchlist to the user's actual portfolio tickers instead of the hardcoded `AAPL, MSFT, GOOG...` list. | Small | User's tickers are already in `portfolioStore.getUniqueTickers()` |

---

## Phase 2 — UX & Onboarding Improvements
*Priority: Makes the product feel polished and reduces user friction.*

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 2.1 | **CSV Import wizard** — Upload a CSV from Fidelity, Schwab, Robinhood, etc. and auto-populate positions. Step 1: upload. Step 2: map columns. Step 3: confirm. | Large | Most impactful onboarding improvement |
| 2.2 | **Expandable sidebar** — Add a hover or toggle expand state that shows nav labels alongside icons. Keep collapsed by default. | Small | Pure UI change to Sidebar.tsx |
| 2.3 | **Cash balance per account** — Add a `cashBalance` field to the `accounts` table and BrokerAccount type. Show it in AccountCard and include in portfolio total. | Medium | DB migration + UI update |
| 2.4 | **Account filter on Charts page** — Dropdown to filter all charts by a specific account or view all combined. | Medium | Charts already built; add filter state |
| 2.5 | **Search/sort on Dashboard holdings list** — Add a search box and column-sort (by value, gain/loss, ticker) to the holdings table. | Small | Client-side filter/sort, no API changes |
| 2.6 | **Date range picker on Charts** — Let users filter the performance line chart by 1M / 3M / 6M / 1Y / All. | Small | UI only, filter snapshot data already fetched |

---

## Phase 3 — Analytics & KPI Expansion
*Priority: What investment advisors actually expect to see. Differentiates from free tools.*

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 3.1 | **Benchmark comparison** — Add S&P 500 (or user-chosen ETF like QQQ, DIA) as an overlay on the portfolio performance line chart. | Medium | FMP API supports benchmark OHLC data |
| 3.2 | **Dividend tracking** — Show dividend yield, annual income estimate, and upcoming ex-dates per position. | Medium | FMP has dividend endpoint; add to PositionWithMarketData |
| 3.3 | **Risk metrics panel** — Add Beta, Sharpe ratio, and 52-week high/low to the dashboard or a dedicated Risk tab. | Large | Beta available from FMP; Sharpe needs snapshot history |
| 3.4 | **Realized gain/loss tracking** — Let users "close" a position and log the sale price. Track closed positions in a new table and show tax-year summaries. | Large | New DB table: `closed_positions`; new UI section |
| 3.5 | **Cost basis display** — Show total cost basis alongside market value everywhere (dashboard summary, account cards, position rows). | Small | Data already in store; just render it |

---

## Phase 4 — Monetization Features (Paid Tier)
*Priority: Build these after Phase 2–3. These are the revenue-generating differentiators.*

| # | Task | Effort | Notes |
|---|------|--------|-------|
| 4.1 | **PDF Report Export** — Generate a one-page portfolio summary PDF (holdings, allocation, gain/loss, performance chart). Free = view only. Paid = export. | Large | Use skill: `pdf`. Great paywall anchor. |
| 4.2 | **Price Alerts** — Set a target buy/sell price per ticker and get notified (email or in-app badge). | Large | Needs a `price_alerts` table + Supabase Edge Function or cron for checking |
| 4.3 | **Multi-client management (Advisor mode)** — A "clients" table with a client switcher in the sidebar. Each client has their own set of accounts/positions. | X-Large | Biggest architectural change; core advisor feature |
| 4.4 | **Auto-snapshot scheduling (Paid)** — Daily auto-snapshots for paid users; weekly for free. Powers richer historical charts. | Medium | Supabase Edge Function on a daily cron |
| 4.5 | **Excel/CSV Export** — Export all positions across accounts to a formatted Excel workbook. Paid feature. | Medium | Use skill: `xlsx` |
| 4.6 | **Stripe billing integration** — Add subscription tiers (Free, Pro, Advisor). Gate paid features behind plan checks. | Large | Supabase + Stripe, standard SaaS pattern |

---

## Suggested Implementation Order

```
Phase 1  →  Phase 2 (2.1, 2.2, 2.5 first)  →  Phase 3 (3.5, 3.1, 3.2)  →  Phase 4
```

Start with Phase 1 to get the foundation stable. Then hit CSV import (2.1) because it dramatically improves day-1 experience. After that, the analytics in Phase 3 are what justifies a paid tier — build those before wiring up billing (4.6).

---

## Feature Count Summary

| Phase | Features | Complexity |
|-------|----------|------------|
| Phase 1 — Bugs | 4 | Low–Medium |
| Phase 2 — UX | 6 | Small–Large |
| Phase 3 — Analytics | 5 | Medium–Large |
| Phase 4 — Monetization | 6 | Large–X-Large |
| **Total** | **21** | |
