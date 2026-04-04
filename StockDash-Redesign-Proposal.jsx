import { useState } from "react";
import { ChevronDown, ChevronRight, Sparkles, Lock, Check, X, Minus, ArrowUpRight, ArrowDownRight, BarChart3, Shield, Zap, Users, TrendingUp, PieChart, Bell, FileText, Layers, Target, Activity, Wallet, Globe, Calendar, BookOpen, GitBranch, Eye, Palette, LayoutGrid, Type, MousePointer, Navigation } from "lucide-react";

// ─── Color Tokens ───
const T = {
  bg: "#0a0b10",
  card: "rgba(255,255,255,0.03)",
  cardBorder: "rgba(255,255,255,0.06)",
  cardHover: "rgba(255,255,255,0.05)",
  text: "#e2e8f0",
  textMuted: "#64748b",
  textDim: "#475569",
  accent: "#3b82f6",   // Tremor blue
  accentMuted: "rgba(59,130,246,0.12)",
  emerald: "#10b981",
  emeraldMuted: "rgba(16,185,129,0.12)",
  rose: "#f43f5e",
  roseMuted: "rgba(244,63,94,0.12)",
  amber: "#f59e0b",
  amberMuted: "rgba(245,158,11,0.12)",
  violet: "#8b5cf6",
  violetMuted: "rgba(139,92,246,0.12)",
  ring: "rgba(255,255,255,0.08)",
};

// ─── Shared Components ───
const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`rounded-xl border transition-colors duration-150 ${className}`}
    style={{ background: T.card, borderColor: T.cardBorder, cursor: onClick ? "pointer" : "default" }}>
    {children}
  </div>
);

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: { bg: T.accentMuted, text: T.accent },
    emerald: { bg: T.emeraldMuted, text: T.emerald },
    rose: { bg: T.roseMuted, text: T.rose },
    amber: { bg: T.amberMuted, text: T.amber },
    violet: { bg: T.violetMuted, text: T.violet },
  };
  const c = colors[color] || colors.blue;
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: c.bg, color: c.text }}>
      {children}
    </span>
  );
};

const SectionTitle = ({ children, sub }) => (
  <div className="mb-6">
    <h2 className="text-xl font-semibold" style={{ color: T.text }}>{children}</h2>
    {sub && <p className="mt-1 text-sm" style={{ color: T.textMuted }}>{sub}</p>}
  </div>
);

const Divider = () => <hr className="my-8 border-t" style={{ borderColor: T.cardBorder }} />;

// ─── Section: Design Philosophy ───
const DesignPhilosophy = () => {
  const principles = [
    { icon: <LayoutGrid size={18} />, title: "Flat Cards, Not Glass", desc: "Replace heavy glassmorphism (backdrop-blur, saturate, specular highlights) with clean flat cards using subtle 1px borders and micro-opacity backgrounds. Tremor uses ring-1 ring-gray-200 — our dark equivalent is border-white/[0.06]." },
    { icon: <Type size={18} />, title: "Typography Hierarchy", desc: "Use 3 clear text tiers: primary (#e2e8f0), muted (#64748b), dim (#475569). No more than 2 font weights per card (medium for labels, semibold for values). This alone will make the app feel 2× more professional." },
    { icon: <Palette size={18} />, title: "Purposeful Color", desc: "Shift from cyan/violet accent pair to a single primary blue (#3b82f6) with semantic colors only for data: emerald = positive, rose = negative, amber = warning. Remove decorative gradients from the background." },
    { icon: <MousePointer size={18} />, title: "Reduce Motion", desc: "Remove the whileHover y-shift on every card and staggered fade-in on every element. Keep motion only where it communicates state change (toasts, modals, chart transitions). This cuts layout thrash and improves perceived speed." },
    { icon: <Navigation size={18} />, title: "Grouped Navigation", desc: "18 flat nav items is overwhelming. Group them into 4 sections: Overview (Dashboard, Portfolio), Analytics (Charts, Attribution, Correlation, Monte Carlo), Tools (Alerts, Rebalance, Tax Lots, Mock Builder, Forecast), and Management (Clients, Billing, Settings)." },
    { icon: <Eye size={18} />, title: "Data Density", desc: "Tremor's power is packing more data into less space. Use KPI rows (4 metrics in one horizontal bar), inline sparklines, and tabbed sections instead of separate pages. The dashboard should tell the full story without scrolling." },
  ];

  return (
    <div>
      <SectionTitle sub="Shift from glassmorphism to Tremor-inspired clarity">Design Philosophy Changes</SectionTitle>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {principles.map((p, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg p-2" style={{ background: T.accentMuted, color: T.accent }}>{p.icon}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: T.text }}>{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: T.textMuted }}>{p.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Section: Component Migration ───
const ComponentMigration = () => {
  const migrations = [
    { from: "GlassCard", to: "TremorCard", change: "Remove backdrop-blur, saturate, specular highlight div, heavy box-shadow. Use bg-white/[0.03] + border-white/[0.06] + rounded-xl. Remove whileHover y-shift.", priority: "high" },
    { from: "GlassButton", to: "TremorButton", change: "Flat buttons with ring-1 border. Primary = solid blue fill. Ghost = transparent with hover:bg-white/[0.05]. Remove framer-motion spring animations.", priority: "high" },
    { from: "GlassInput / GlassSelect", to: "TremorInput / TremorSelect", change: "Simpler focus ring (ring-2 ring-blue-500/40). Remove backdrop-blur. Consistent height (h-9 for sm, h-10 for md).", priority: "medium" },
    { from: "GlassModal", to: "TremorDialog", change: "Keep AnimatePresence but simplify backdrop to bg-black/60 (no blur). Modal card uses same flat style. Add subtle scale transition.", priority: "medium" },
    { from: "GlassTable", to: "TremorTable", change: "Horizontal dividers only (no cell borders). Sticky header row. Muted header text. Row hover = bg-white/[0.02]. Align numbers right.", priority: "high" },
    { from: "GlassBadge", to: "TremorBadge", change: "Keep current variant names. Adjust to use semantic muted backgrounds (emerald/12%, rose/12%). Add optional dot indicator.", priority: "low" },
    { from: "AllocationBar", to: "Tracker", change: "Add Tremor-style Tracker component — a row of small colored blocks showing daily/weekly performance (green/red). Use alongside existing AllocationBar.", priority: "medium" },
    { from: "(new)", to: "KpiCard", change: "New component: metric value + delta badge (▲ 2.4%) + optional sparkline. Used for the top row of every page.", priority: "high" },
    { from: "(new)", to: "TabGroup", change: "New component: horizontal tab bar for switching views within a page. Replaces the need for separate pages for related features.", priority: "high" },
    { from: "globals.css bg", to: "Simplified bg", change: "Replace 3-layer radial gradient with solid #0a0b10 + single subtle radial at 50% 0% for a slight top glow. Dramatically cleaner.", priority: "medium" },
  ];

  const priorityColor = { high: "rose", medium: "amber", low: "blue" };

  return (
    <div>
      <SectionTitle sub="Migrate existing glass components to Tremor-inspired equivalents">Component Migration Plan</SectionTitle>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
              <th className="px-4 py-3 font-medium" style={{ color: T.textMuted }}>Current</th>
              <th className="px-4 py-3 font-medium" style={{ color: T.textMuted }}>New</th>
              <th className="px-4 py-3 font-medium" style={{ color: T.textMuted }}>Change</th>
              <th className="px-4 py-3 font-medium text-right" style={{ color: T.textMuted }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {migrations.map((m, i) => (
              <tr key={i} style={{ borderBottom: i < migrations.length - 1 ? `1px solid ${T.cardBorder}` : "none" }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: T.textDim }}>{m.from}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: T.accent }}>{m.to}</td>
                <td className="px-4 py-3 text-xs leading-relaxed" style={{ color: T.textMuted }}>{m.change}</td>
                <td className="px-4 py-3 text-right"><Badge color={priorityColor[m.priority]}>{m.priority}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── Section: New Features ───
const NewFeatures = () => {
  const features = [
    { icon: <Activity size={16} />, name: "Portfolio Performance Chart", desc: "Time-series area chart on the dashboard showing portfolio value over 1W/1M/3M/1Y/ALL with benchmark overlay (SPY). This is the #1 missing piece — users need to see their trajectory at a glance.", plan: "free", effort: "medium", impact: "critical" },
    { icon: <TrendingUp size={16} />, name: "Inline Sparklines in KPIs", desc: "Tiny 7-day sparkline charts embedded in KPI cards (total value, daily P&L, best performer). Tremor signature. Makes metrics feel alive.", plan: "free", effort: "low", impact: "high" },
    { icon: <BarChart3 size={16} />, name: "Sector Heatmap", desc: "Treemap/heatmap showing sector exposure with color = daily change. Much more intuitive than the current pie chart for sector breakdown.", plan: "pro", effort: "medium", impact: "high" },
    { icon: <Target size={16} />, name: "Goal Tracker", desc: "Set financial goals (retirement target, down payment, etc.) with progress bars and projected completion dates based on current returns + contributions.", plan: "pro", effort: "medium", impact: "high" },
    { icon: <BookOpen size={16} />, name: "Trade Journal", desc: "Log trades with notes, thesis, and outcome. Tag by strategy. Review win rate and avg return by strategy over time. Turns the app from passive tracking to active improvement.", plan: "pro", effort: "high", impact: "high" },
    { icon: <Calendar size={16} />, name: "Economic Calendar", desc: "FOMC dates, CPI releases, earnings for held stocks, ex-dividend dates — all in one calendar view. Pull from FMP's economic calendar endpoint.", plan: "pro", effort: "medium", impact: "medium" },
    { icon: <Wallet size={16} />, name: "Cash Flow Tracker", desc: "Track dividends received, deposits, withdrawals. Monthly cash flow chart. Pairs with the existing dividend hook but gives it a proper UI.", plan: "pro", effort: "medium", impact: "medium" },
    { icon: <Globe size={16} />, name: "Multi-Currency Support", desc: "Portfolio value in USD/EUR/GBP/CAD with auto-conversion. Important for international users and a natural Pro upsell.", plan: "pro", effort: "medium", impact: "medium" },
    { icon: <GitBranch size={16} />, name: "Scenario Comparator", desc: "Side-by-side comparison of 2-3 mock portfolios against actual. What-if analysis with different allocations. Upgrade of current mock builder.", plan: "pro", effort: "high", impact: "medium" },
    { icon: <FileText size={16} />, name: "White-Label Client Portal", desc: "Unique URL per client (advisor.stockdash.com/client/abc) where clients can view their portfolio read-only with advisor's branding. Massive value for advisors.", plan: "advisor", effort: "high", impact: "critical" },
    { icon: <Users size={16} />, name: "Client Household Grouping", desc: "Group clients into households (spouse accounts, trust, IRA). View aggregated household metrics. Essential for real advisor workflows.", plan: "advisor", effort: "medium", impact: "high" },
    { icon: <Bell size={16} />, name: "Client Activity Alerts", desc: "Get notified when a client's portfolio drops >5%, a position hits a target, or rebalancing is needed. Proactive advisor tools.", plan: "advisor", effort: "medium", impact: "high" },
    { icon: <Shield size={16} />, name: "Compliance Notes", desc: "Attach compliance notes to trades and client interactions. Export audit trail as PDF. Advisors need this for regulatory requirements.", plan: "advisor", effort: "medium", impact: "high" },
    { icon: <Layers size={16} />, name: "Model Portfolios", desc: "Create template portfolios (Conservative, Growth, Income) and assign to clients. One-click rebalance across all clients using a model. This is the killer advisor feature.", plan: "advisor", effort: "high", impact: "critical" },
  ];

  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? features : features.filter(f => f.plan === filter);
  const planColor = { free: "blue", pro: "emerald", advisor: "violet" };
  const impactColor = { critical: "rose", high: "amber", medium: "blue" };

  return (
    <div>
      <SectionTitle sub="Features to build, organized by plan tier and impact">New Feature Roadmap</SectionTitle>
      <div className="mb-4 flex gap-2">
        {["all", "free", "pro", "advisor"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: filter === f ? T.accentMuted : "transparent",
              color: filter === f ? T.accent : T.textMuted,
              border: `1px solid ${filter === f ? T.accent + "40" : T.cardBorder}`
            }}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.map((f, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg p-2" style={{
                  background: planColor[f.plan] === "blue" ? T.accentMuted : planColor[f.plan] === "emerald" ? T.emeraldMuted : T.violetMuted,
                  color: planColor[f.plan] === "blue" ? T.accent : planColor[f.plan] === "emerald" ? T.emerald : T.violet
                }}>{f.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: T.text }}>{f.name}</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: T.textMuted }}>{f.desc}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge color={planColor[f.plan]}>{f.plan}</Badge>
                    <Badge color={impactColor[f.impact]}>{f.impact} impact</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Section: Plan Matrix ───
const PlanMatrix = () => {
  const features = [
    { section: "Portfolio Tracking", items: [
      { name: "Accounts", free: "2", pro: "Unlimited", advisor: "Unlimited" },
      { name: "Positions", free: "20", pro: "Unlimited", advisor: "Unlimited" },
      { name: "Live market data", free: true, pro: true, advisor: true },
      { name: "Portfolio performance chart", free: true, pro: true, advisor: true },
      { name: "Basic allocation view", free: true, pro: true, advisor: true },
      { name: "KPI sparklines", free: false, pro: true, advisor: true },
      { name: "Multi-currency", free: false, pro: true, advisor: true },
    ]},
    { section: "Analytics", items: [
      { name: "Pie charts (ticker/sector)", free: true, pro: true, advisor: true },
      { name: "Benchmark comparison (SPY)", free: false, pro: true, advisor: true },
      { name: "Sector heatmap", free: false, pro: true, advisor: true },
      { name: "Correlation matrix", free: false, pro: true, advisor: true },
      { name: "Monte Carlo simulation", free: false, pro: true, advisor: true },
      { name: "Performance attribution", free: false, pro: true, advisor: true },
      { name: "Risk metrics (Beta, Sharpe, Vol)", free: false, pro: true, advisor: true },
      { name: "Dividend tracking & income", free: false, pro: true, advisor: true },
    ]},
    { section: "Tools", items: [
      { name: "Price alerts", free: "3 alerts", pro: "Unlimited", advisor: "Unlimited" },
      { name: "Rebalance calculator", free: false, pro: true, advisor: true },
      { name: "Tax lot analysis", free: false, pro: true, advisor: true },
      { name: "Mock portfolio builder", free: "1 mock", pro: "Unlimited", advisor: "Unlimited" },
      { name: "Scenario comparator", free: false, pro: true, advisor: true },
      { name: "Goal tracker", free: false, pro: true, advisor: true },
      { name: "Trade journal", free: false, pro: true, advisor: true },
      { name: "Economic calendar", free: false, pro: true, advisor: true },
      { name: "Cash flow tracker", free: false, pro: true, advisor: true },
    ]},
    { section: "Export & Reports", items: [
      { name: "CSV export", free: false, pro: true, advisor: true },
      { name: "PDF portfolio report", free: false, pro: true, advisor: true },
      { name: "Email digest", free: false, pro: true, advisor: true },
      { name: "Branded PDF reports", free: false, pro: false, advisor: true },
    ]},
    { section: "Advisor Tools", items: [
      { name: "Multi-client CRM", free: false, pro: false, advisor: true },
      { name: "Client household grouping", free: false, pro: false, advisor: true },
      { name: "Model portfolios", free: false, pro: false, advisor: true },
      { name: "White-label client portal", free: false, pro: false, advisor: true },
      { name: "Client activity alerts", free: false, pro: false, advisor: true },
      { name: "Compliance notes & audit trail", free: false, pro: false, advisor: true },
      { name: "Firm branding (logo, colors)", free: false, pro: false, advisor: true },
      { name: "Priority support", free: false, pro: false, advisor: true },
    ]},
  ];

  const CellValue = ({ val }) => {
    if (val === true) return <Check size={16} style={{ color: T.emerald }} />;
    if (val === false) return <Minus size={16} style={{ color: T.textDim }} />;
    return <span className="text-xs font-medium" style={{ color: T.text }}>{val}</span>;
  };

  return (
    <div>
      <SectionTitle sub="Complete feature matrix showing what each plan gets">Revised Plan Tiers</SectionTitle>

      {/* Plan headers */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <div />
        {[
          { name: "Free", price: "$0", desc: "Get started", color: T.textMuted },
          { name: "Pro", price: "$9.99/mo", desc: "Serious investors", color: T.emerald },
          { name: "Advisor", price: "$29.99/mo", desc: "Financial advisors", color: T.violet },
        ].map((p, i) => (
          <Card key={i} className="p-4 text-center">
            <p className="text-lg font-bold" style={{ color: p.color }}>{p.name}</p>
            <p className="text-xl font-bold mt-1" style={{ color: T.text }}>{p.price}</p>
            <p className="text-xs mt-1" style={{ color: T.textMuted }}>{p.desc}</p>
          </Card>
        ))}
      </div>

      {/* Feature sections */}
      <Card className="overflow-hidden">
        {features.map((section, si) => (
          <div key={si}>
            <div className="px-4 py-2.5" style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${T.cardBorder}`, borderTop: si > 0 ? `1px solid ${T.cardBorder}` : "none" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>{section.section}</p>
            </div>
            {section.items.map((item, ii) => (
              <div key={ii} className="grid grid-cols-4 items-center" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
                <p className="px-4 py-2.5 text-sm" style={{ color: T.text }}>{item.name}</p>
                <div className="flex justify-center py-2.5"><CellValue val={item.free} /></div>
                <div className="flex justify-center py-2.5"><CellValue val={item.pro} /></div>
                <div className="flex justify-center py-2.5"><CellValue val={item.advisor} /></div>
              </div>
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── Section: Dashboard Wireframe ───
const DashboardWireframe = () => {
  const kpis = [
    { label: "Portfolio Value", value: "$124,831.50", delta: "+2.4%", up: true },
    { label: "Day's P&L", value: "+$1,247.30", delta: "+1.01%", up: true },
    { label: "Total Return", value: "+$18,432.00", delta: "+17.3%", up: true },
    { label: "Dividend Yield", value: "2.18%", delta: "-0.1%", up: false },
  ];

  return (
    <div>
      <SectionTitle sub="How the redesigned dashboard would look with Tremor patterns">Dashboard Layout Wireframe</SectionTitle>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="p-4">
            <p className="text-xs font-medium" style={{ color: T.textMuted }}>{kpi.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: T.text }}>{kpi.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {kpi.up ? <ArrowUpRight size={14} style={{ color: T.emerald }} /> : <ArrowDownRight size={14} style={{ color: T.rose }} />}
              <span className="text-xs font-medium" style={{ color: kpi.up ? T.emerald : T.rose }}>{kpi.delta}</span>
              <span className="text-xs" style={{ color: T.textDim }}>vs yesterday</span>
            </div>
            {/* Sparkline placeholder */}
            <div className="mt-3 flex items-end gap-[2px] h-8">
              {[40, 35, 50, 45, 55, 60, 52, 65, 58, 70, 62, 75, 68, 72, 80].map((h, j) => (
                <div key={j} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: kpi.up ? T.emeraldMuted : T.roseMuted, opacity: 0.3 + (j / 15) * 0.7 }} />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Chart + Holdings area */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">
        <Card className="p-4 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: T.text }}>Portfolio Performance</p>
            <div className="flex gap-1">
              {["1W", "1M", "3M", "1Y", "ALL"].map(p => (
                <button key={p} className="rounded-md px-2 py-1 text-xs font-medium" style={{ color: p === "1Y" ? T.accent : T.textMuted, background: p === "1Y" ? T.accentMuted : "transparent" }}>{p}</button>
              ))}
            </div>
          </div>
          {/* Chart placeholder */}
          <div className="relative h-48 flex items-end">
            <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={T.accent} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,100 C30,95 60,85 100,70 C140,55 180,60 220,45 C260,30 300,35 340,20 C360,15 380,10 400,5 L400,120 L0,120 Z" fill="url(#areaGrad)" />
              <path d="M0,100 C30,95 60,85 100,70 C140,55 180,60 220,45 C260,30 300,35 340,20 C360,15 380,10 400,5" fill="none" stroke={T.accent} strokeWidth="2" />
              {/* Benchmark line */}
              <path d="M0,98 C30,93 60,88 100,78 C140,68 180,72 220,60 C260,50 300,52 340,40 C360,35 380,32 400,28" fill="none" stroke={T.textDim} strokeWidth="1" strokeDasharray="4,4" />
            </svg>
            <div className="absolute bottom-2 right-2 flex items-center gap-3">
              <div className="flex items-center gap-1"><div className="h-0.5 w-4 rounded" style={{ background: T.accent }} /><span className="text-[10px]" style={{ color: T.textMuted }}>Portfolio</span></div>
              <div className="flex items-center gap-1"><div className="h-0.5 w-4 rounded border-dashed" style={{ borderBottom: `1px dashed ${T.textDim}` }} /><span className="text-[10px]" style={{ color: T.textMuted }}>S&P 500</span></div>
            </div>
          </div>
        </Card>

        {/* Allocation */}
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Allocation</p>
          <div className="space-y-2">
            {[
              { name: "AAPL", pct: 22, color: T.accent },
              { name: "MSFT", pct: 18, color: T.violet },
              { name: "GOOGL", pct: 15, color: T.emerald },
              { name: "NVDA", pct: 12, color: T.amber },
              { name: "AMZN", pct: 10, color: T.rose },
              { name: "Others", pct: 23, color: T.textDim },
            ].map((a, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: T.text }}>{a.name}</span>
                  <span style={{ color: T.textMuted }}>{a.pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full" style={{ background: T.ring }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${a.pct}%`, background: a.color, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Tracker */}
          <p className="text-xs font-medium mt-5 mb-2" style={{ color: T.textMuted }}>30-Day Performance</p>
          <div className="flex gap-[2px]">
            {[1,1,0,1,1,1,0,0,1,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1,0,0,1,1,1,1].map((d, i) => (
              <div key={i} className="h-3 flex-1 rounded-sm" style={{ background: d ? T.emeraldMuted : T.roseMuted }} />
            ))}
          </div>
        </Card>
      </div>

      {/* Holdings table preview */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
          <p className="text-sm font-semibold" style={{ color: T.text }}>Holdings</p>
          <div className="flex gap-2">
            {["All", "Gainers", "Losers"].map(t => (
              <button key={t} className="text-xs font-medium px-2 py-1 rounded-md" style={{ color: t === "All" ? T.accent : T.textMuted, background: t === "All" ? T.accentMuted : "transparent" }}>{t}</button>
            ))}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
              {["Ticker", "Shares", "Price", "Value", "P&L", "Weight"].map(h => (
                <th key={h} className={`px-4 py-2 text-xs font-medium ${h !== "Ticker" ? "text-right" : ""}`} style={{ color: T.textDim }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { ticker: "AAPL", shares: "150", price: "$182.52", value: "$27,378", pl: "+12.4%", weight: "22%" },
              { ticker: "MSFT", shares: "65", price: "$345.20", value: "$22,438", pl: "+8.7%", weight: "18%" },
              { ticker: "NVDA", shares: "25", price: "$598.40", value: "$14,960", pl: "+34.2%", weight: "12%" },
              { ticker: "GOOGL", shares: "80", price: "$234.10", value: "$18,728", pl: "-2.1%", weight: "15%" },
            ].map((row, i) => (
              <tr key={i} className="transition-colors" style={{ borderBottom: `1px solid ${T.cardBorder}` }}
                onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td className="px-4 py-2.5 font-semibold" style={{ color: T.text }}>{row.ticker}</td>
                <td className="px-4 py-2.5 text-right" style={{ color: T.textMuted }}>{row.shares}</td>
                <td className="px-4 py-2.5 text-right" style={{ color: T.textMuted }}>{row.price}</td>
                <td className="px-4 py-2.5 text-right font-medium" style={{ color: T.text }}>{row.value}</td>
                <td className="px-4 py-2.5 text-right font-medium" style={{ color: row.pl.startsWith("+") ? T.emerald : T.rose }}>{row.pl}</td>
                <td className="px-4 py-2.5 text-right" style={{ color: T.textMuted }}>{row.weight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── Section: Page Consolidation ───
const PageConsolidation = () => {
  const consolidations = [
    {
      before: ["Charts", "Correlation", "Monte Carlo", "Performance Attribution"],
      after: "Analytics",
      desc: "One page with a TabGroup: Overview (pie charts + benchmark) → Correlation → Monte Carlo → Attribution. Reduces 4 sidebar items to 1. Each tab loads its own data lazily.",
    },
    {
      before: ["Rebalance", "Forecast"],
      after: "Rebalance & Forecast",
      desc: "Combine into one page with two tabs. The forecast/compound growth tool is conceptually part of rebalancing — 'here's your target allocation' → 'here's what it grows to'.",
    },
    {
      before: ["Settings/Branding", "Settings/Digest"],
      after: "Settings",
      desc: "One settings page with tabs: Profile → Branding (Advisor only) → Email Digest → Notifications.",
    },
    {
      before: ["Mock Builder (standalone)"],
      after: "Mock Builder + Scenario Comparator",
      desc: "Merge mock builder with a new scenario comparison view. Build mocks in one tab, compare them side-by-side in another.",
    },
  ];

  return (
    <div>
      <SectionTitle sub="Reduce sidebar items from 18 to ~10 by consolidating related pages">Page Consolidation Plan</SectionTitle>
      <div className="space-y-3">
        {consolidations.map((c, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {c.before.map((b, j) => (
                    <span key={j}>
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: T.roseMuted, color: T.rose }}>{b}</span>
                      {j < c.before.length - 1 && <span className="text-xs mx-1" style={{ color: T.textDim }}>+</span>}
                    </span>
                  ))}
                  <span className="text-xs mx-2" style={{ color: T.textDim }}>→</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded font-semibold" style={{ background: T.emeraldMuted, color: T.emerald }}>{c.after}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: T.textMuted }}>{c.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-4">
        <p className="text-sm font-semibold mb-3" style={{ color: T.text }}>Proposed Sidebar (after consolidation)</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-4">
          {[
            { section: "Overview", items: ["Dashboard", "Portfolio"] },
            { section: "Analytics", items: ["Analytics (tabbed)", "Earnings", "News"] },
            { section: "Tools", items: ["Alerts", "Rebalance", "Tax Lots", "Mock Builder"] },
            { section: "Advisor", items: ["Clients", "Billing", "Referrals", "Settings"] },
          ].map((g, i) => (
            <div key={i}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.textDim }}>{g.section}</p>
              {g.items.map((item, j) => (
                <p key={j} className="text-xs py-0.5" style={{ color: T.textMuted }}>{item}</p>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─── Section: Quick Wins ───
const QuickWins = () => {
  const wins = [
    { title: "Add period selector to dashboard", desc: "1W/1M/3M/1Y/ALL toggle above the portfolio value. Changes the P&L calculation period and (future) chart range. Simple state change, huge UX win.", time: "1 hour" },
    { title: "Number formatting consistency", desc: "Create a single formatCurrency/formatPercent/formatNumber util. Currently inconsistent across pages (some show 2 decimals, some 4, some use $, some don't).", time: "30 min" },
    { title: "Loading skeletons", desc: "Replace spinner states with Tremor-style pulse skeletons that match the card layout. Users perceive the page as faster even though load time is the same.", time: "2 hours" },
    { title: "Empty state illustrations", desc: "Replace the current text-only empty states with simple SVG illustrations + clear CTA. Makes the free tier feel premium on first login.", time: "2 hours" },
    { title: "Command palette (⌘K)", desc: "Quick-nav to any page, search tickers, jump to a position. Uses existing TickerSearch component as a base. Power user feature that feels premium.", time: "3 hours" },
    { title: "Keyboard shortcuts", desc: "R = refresh, N = new position, / = search. Minimal effort, big perceived quality.", time: "1 hour" },
  ];

  return (
    <div>
      <SectionTitle sub="High-impact changes that can ship in a day">Quick Wins (Ship This Week)</SectionTitle>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {wins.map((w, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: T.text }}>{w.title}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: T.textMuted }}>{w.desc}</p>
              </div>
              <Badge color="emerald">{w.time}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Main App ───
export default function DesignProposal() {
  const [section, setSection] = useState("all");

  const sections = [
    { id: "all", label: "Full Proposal" },
    { id: "philosophy", label: "Design" },
    { id: "wireframe", label: "Dashboard" },
    { id: "components", label: "Components" },
    { id: "features", label: "Features" },
    { id: "plans", label: "Plans" },
    { id: "pages", label: "Pages" },
    { id: "wins", label: "Quick Wins" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={20} style={{ color: T.accent }} />
            <Badge color="blue">Proposal</Badge>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: T.text }}>StockDash Redesign</h1>
          <p className="mt-2 text-sm leading-relaxed max-w-2xl" style={{ color: T.textMuted }}>
            A Tremor-inspired redesign that trades glassmorphism for clarity, consolidates 18 nav items into ~10 grouped sections,
            adds 14 new features distributed across 3 monetizable tiers, and ships quick wins that make the free tier feel premium on day one.
          </p>
        </div>

        {/* Nav */}
        <div className="flex flex-wrap gap-1 mb-8 pb-4" style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                background: section === s.id ? T.accentMuted : "transparent",
                color: section === s.id ? T.accent : T.textMuted,
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-0">
          {(section === "all" || section === "philosophy") && <><DesignPhilosophy /><Divider /></>}
          {(section === "all" || section === "wireframe") && <><DashboardWireframe /><Divider /></>}
          {(section === "all" || section === "components") && <><ComponentMigration /><Divider /></>}
          {(section === "all" || section === "features") && <><NewFeatures /><Divider /></>}
          {(section === "all" || section === "plans") && <><PlanMatrix /><Divider /></>}
          {(section === "all" || section === "pages") && <><PageConsolidation /><Divider /></>}
          {(section === "all" || section === "wins") && <QuickWins />}
        </div>
      </div>
    </div>
  );
}
