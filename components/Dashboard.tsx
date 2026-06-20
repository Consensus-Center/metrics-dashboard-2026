'use client'

/* Consensus Center — Transparency Dashboard
 * Ported from the Retool React app (frontend/App.tsx) to a standalone Next.js
 * client component. Live data is fetched from /api/dashboard, which queries the
 * cc_* tables in the Retool/Neon Postgres database. The constants below remain
 * as an embedded fallback so the dashboard still renders if the API is
 * unavailable.
 */
import { createContext, useContext, useEffect } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useGetDashboardData } from '../hooks/useGetDashboardData'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import {
  Users, FlaskConical, BadgeCheck, DollarSign, TrendingUp, Percent, Award,
  MapPin, Target, PieChart as PieIcon, Stethoscope, Divide, Building2, FileText,
  CircleCheck, SlidersHorizontal, Layers, TriangleAlert, Shield, Clock, Flame,
  BatteryMedium, Briefcase, Activity, Lock, ShieldCheck,
} from 'lucide-react'

/* ----------------------------- data ----------------------------- */
type Metric = {
  id: string; section: string; metric: string; value: number; value_display: string
  status: string; md: 'Yes' | 'No'; public: 'Yes' | 'No'; def: string; icon: string; trend: string | null
}
const METRICS: Metric[] = [
  { id: 'm01', section: '1.a', metric: 'Waitlist size', value: 703, value_display: '703', status: 'Live', md: 'No', public: 'Yes', def: 'People on the pre-launch waitlist', icon: 'users', trend: 'waitlist' },
  { id: 'm02', section: '1.a', metric: 'Beta participants', value: 60, value_display: '60', status: 'Beta', md: 'No', public: 'Yes', def: 'Active beta cohort, non-paying', icon: 'flask', trend: null },
  { id: 'm03', section: '1.a', metric: 'Active paying members', value: 0, value_display: '0', status: 'Pre-launch', md: 'No', public: 'Yes', def: 'Currently subscribed paying members', icon: 'badge-check', trend: 'members' },
  { id: 'm04', section: '1.a', metric: 'MRR', value: 0, value_display: '$0', status: 'Pre-launch', md: 'No', public: 'Yes', def: 'Monthly recurring revenue (honest: $0 pre-launch)', icon: 'dollar', trend: 'mrr' },
  { id: 'm05', section: '1.a', metric: 'ARR', value: 0, value_display: '$0', status: 'Pre-launch', md: 'No', public: 'Yes', def: 'Annual recurring revenue', icon: 'trending-up', trend: null },
  { id: 'm06', section: '1.a', metric: 'Beta to paid conversion', value: 35, value_display: '35% (est.)', status: 'Estimate', md: 'No', public: 'Yes', def: 'Estimated conversion; not yet observed', icon: 'percent', trend: null },
  { id: 'm07', section: '1.b', metric: 'Members served (cumulative)', value: 60, value_display: '60', status: 'Live', md: 'No', public: 'Yes', def: 'All members ever onboarded', icon: 'users', trend: null },
  { id: 'm08', section: '1.b', metric: 'Credentials issued', value: 60, value_display: '60', status: 'Live', md: 'No', public: 'Yes', def: 'Certified biological credentials issued', icon: 'award', trend: null },
  { id: 'm09', section: '1.b', metric: 'Cities active', value: 3, value_display: '3', status: 'Live', md: 'No', public: 'Yes', def: 'Cali, Bogota, Medellin', icon: 'map-pin', trend: null },
  { id: 'm10', section: '1.b', metric: 'Target population reached', value: 68, value_display: '68%', status: 'Aggregate', md: 'No', public: 'Yes', def: 'Share from under-represented groups (aggregate)', icon: 'target', trend: null },
  { id: 'm11', section: '1.b', metric: 'Pathway: Derecho a la Salud', value: 46, value_display: '46%', status: 'Aggregate', md: 'No', public: 'Yes', def: 'Share of members via equity pathway', icon: 'pie', trend: null },
  { id: 'm12', section: '1.b', metric: 'Pathway: Longevity Pass', value: 31, value_display: '31%', status: 'Aggregate', md: 'No', public: 'Yes', def: 'Share via premium pathway', icon: 'pie', trend: null },
  { id: 'm13', section: '1.b', metric: 'Pathway: Acceso Raiz', value: 23, value_display: '23%', status: 'Aggregate', md: 'No', public: 'Yes', def: 'Share via ancestry pathway', icon: 'pie', trend: null },
  { id: 'm14', section: '1.c', metric: 'Active operators', value: 8, value_display: '8', status: 'Live', md: 'No', public: 'Yes', def: 'Licensed physician operators live', icon: 'stethoscope', trend: 'operators' },
  { id: 'm15', section: '1.c', metric: 'Members per operator', value: 7.5, value_display: '7.5', status: 'Periodic', md: 'No', public: 'Yes', def: 'Average member load per operator', icon: 'divide', trend: null },
  { id: 'm16', section: '1.c', metric: 'Operator earnings distributed', value: 0, value_display: '$0', status: 'Pre-launch', md: 'No', public: 'Yes', def: 'Total paid to operators', icon: 'dollar', trend: null },
  { id: 'm17', section: '1.c', metric: 'Institutional relationships', value: 17, value_display: '17+', status: 'Early', md: 'No', public: 'Yes', def: 'Early-stage institutional relationships', icon: 'building', trend: null },
  { id: 'm18', section: '1.d', metric: 'Panels processed', value: 112, value_display: '112', status: 'Live', md: 'Yes', public: 'Yes', def: '75-biomarker panels run (aggregate)', icon: 'flask', trend: 'panels' },
  { id: 'm19', section: '1.d', metric: 'Interpretations delivered', value: 112, value_display: '112', status: 'Live', md: 'Yes', public: 'Yes', def: 'Engine interpretations, clinician-reviewed', icon: 'file-text', trend: null },
  { id: 'm20', section: '1.d', metric: 'Clinician review rate', value: 100, value_display: '100%', status: 'Live', md: 'Yes', public: 'Yes', def: 'Share of interpretations clinician-reviewed (target 100%)', icon: 'check-circle', trend: null },
  { id: 'm21', section: '1.d', metric: 'Calibrations active', value: 4, value_display: '4', status: 'Periodic', md: 'Yes', public: 'Yes', def: 'Duffy, APOL1, HbA1c, Vitamin D', icon: 'sliders', trend: null },
  { id: 'm22', section: '1.d', metric: 'Calibration coverage', value: 61, value_display: '61%', status: 'Aggregate', md: 'Yes', public: 'Yes', def: 'Share of interpretations using a calibration', icon: 'layers', trend: null },
  { id: 'm23', section: '1.d', metric: 'Safety escalations surfaced', value: 3, value_display: '3', status: 'Aggregate', md: 'Yes', public: 'Yes', def: 'CRITICAL/ACTION states surfaced (aggregate)', icon: 'alert-triangle', trend: null },
  { id: 'm24', section: '1.d', metric: 'Adverse events tracked', value: 0, value_display: '0', status: 'Aggregate', md: 'Yes', public: 'Yes', def: 'Reported and resolved (aggregate)', icon: 'shield', trend: null },
  { id: 'm25', section: '1.e', metric: 'CC contribution per member-year', value: 101.14, value_display: '$101', status: 'Modeled', md: 'No', public: 'Yes', def: 'From unit economics model', icon: 'dollar', trend: null },
  { id: 'm26', section: '1.e', metric: 'LTV / CAC', value: 4.21, value_display: '4.21x', status: 'Modeled', md: 'No', public: 'Yes', def: 'Lifetime value over CAC (target ≥ 3.0x)', icon: 'trending-up', trend: null },
  { id: 'm27', section: '1.e', metric: 'CAC payback', value: 4.7, value_display: '4.7 mo', status: 'Modeled', md: 'No', public: 'Yes', def: 'Months to recover CAC (target ≤ 12)', icon: 'clock', trend: null },
  { id: 'm28', section: '1.e', metric: 'Gross margin', value: 56, value_display: '56%', status: 'Modeled', md: 'No', public: 'Yes', def: 'Blended contribution margin (modeled)', icon: 'percent', trend: null },
  { id: 'm29', section: '1.e', metric: 'Monthly burn', value: 4000, value_display: '$4.0K', status: 'Live', md: 'No', public: 'No', def: 'Monthly cash burn (investor view only)', icon: 'flame', trend: 'burn' },
  { id: 'm30', section: '1.e', metric: 'Runway (post-raise)', value: 37.9, value_display: '37.9 mo', status: 'Modeled', md: 'No', public: 'No', def: 'Months of runway after raise (investor view only)', icon: 'battery', trend: null },
  { id: 'm31', section: '1.e', metric: 'Round size (pre-seed SAFE)', value: 500000, value_display: '$500K', status: 'Fixed', md: 'No', public: 'No', def: 'Pre-seed SAFE, $5M post-money cap (investor)', icon: 'briefcase', trend: null },
]
const SECTIONS = [
  { section: '1.a', name: 'Membership & Revenue Base', subtitle: 'The recurring base that compounds — members and revenue, not tokens', world: 'Tokenomics / circulating supply', accent: '#3e8b9e' },
  { section: '1.b', name: 'Members & Access', subtitle: 'How many people the system actually reaches and serves', world: 'User grants / wallets', accent: '#c8843c' },
  { section: '1.c', name: 'Operator Network', subtitle: 'Health of the distributed Longevity Lab operator layer', world: 'Operator rewards', accent: '#5db4c7' },
  { section: '1.d', name: 'Clinical Activity & Integrity', subtitle: 'Proof the clinical product is used AND safe — MD-reviewed, aggregate', world: 'Token stats / holders & transfers', accent: '#3f9d77' },
  { section: '1.e', name: 'Unit Economics & Financial Health', subtitle: 'The financial engine from the unit-economics model', world: 'DEX volume / market activity', accent: '#c98a3c' },
]
const HISTORY = [
  { m: "Nov '24", waitlist: 12, members: 5, operators: 2, panels: 0, burn: 3500 },
  { m: "Dec '24", waitlist: 18, members: 8, operators: 2, panels: 0, burn: 3500 },
  { m: "Jan '25", waitlist: 25, members: 10, operators: 3, panels: 0, burn: 3800 },
  { m: "Feb '25", waitlist: 31, members: 12, operators: 3, panels: 0, burn: 3800 },
  { m: "Mar '25", waitlist: 40, members: 15, operators: 4, panels: 4, burn: 4000 },
  { m: "Apr '25", waitlist: 52, members: 18, operators: 4, panels: 9, burn: 4000 },
  { m: "May '25", waitlist: 61, members: 22, operators: 5, panels: 16, burn: 4000 },
  { m: "Jun '25", waitlist: 70, members: 26, operators: 5, panels: 24, burn: 4000 },
  { m: "Jul '25", waitlist: 88, members: 30, operators: 5, panels: 33, burn: 4000 },
  { m: "Aug '25", waitlist: 104, members: 35, operators: 6, panels: 44, burn: 4000 },
  { m: "Sep '25", waitlist: 140, members: 40, operators: 6, panels: 55, burn: 4000 },
  { m: "Oct '25", waitlist: 180, members: 45, operators: 6, panels: 67, burn: 4000 },
  { m: "Nov '25", waitlist: 230, members: 48, operators: 7, panels: 78, burn: 4000 },
  { m: "Dec '25", waitlist: 290, members: 52, operators: 7, panels: 88, burn: 4000 },
  { m: "Jan '26", waitlist: 360, members: 55, operators: 7, panels: 95, burn: 4000 },
  { m: "Feb '26", waitlist: 440, members: 57, operators: 8, panels: 101, burn: 4000 },
  { m: "Mar '26", waitlist: 520, members: 58, operators: 8, panels: 106, burn: 4000 },
  { m: "Apr '26", waitlist: 600, members: 59, operators: 8, panels: 109, burn: 4000 },
  { m: "May '26", waitlist: 650, members: 60, operators: 8, panels: 111, burn: 4000 },
  { m: "Jun '26", waitlist: 703, members: 60, operators: 8, panels: 112, burn: 4000 },
]
const OPERATORS = [
  { id: 'OP-01', city: 'Cali', status: 'Active', members: 11, joined: 'Nov 2024', specialty: 'Internal medicine' },
  { id: 'OP-02', city: 'Cali', status: 'Active', members: 9, joined: 'Jan 2025', specialty: 'Family medicine' },
  { id: 'OP-03', city: 'Bogotá', status: 'Active', members: 8, joined: 'Feb 2025', specialty: 'Endocrinology' },
  { id: 'OP-04', city: 'Bogotá', status: 'Active', members: 7, joined: 'Apr 2025', specialty: 'General practice' },
  { id: 'OP-05', city: 'Medellín', status: 'Active', members: 6, joined: 'May 2025', specialty: 'Internal medicine' },
  { id: 'OP-06', city: 'Medellín', status: 'Active', members: 5, joined: 'Jul 2025', specialty: 'Preventive medicine' },
  { id: 'OP-07', city: 'Cali', status: 'Active', members: 4, joined: 'Sep 2025', specialty: 'Family medicine' },
  { id: 'OP-08', city: 'Bogotá', status: 'Active', members: 10, joined: 'Nov 2025', specialty: 'Longevity / functional' },
]

/* ----------- live-data context (Sparkline & KpiCard read from here) ----------- */
type HistoryRow = { m: string; waitlist: number; members: number; operators: number; panels: number; burn: number }
type DashCtxType = { metrics: Metric[]; history: HistoryRow[] }
const DashCtx = createContext<DashCtxType>({ metrics: METRICS, history: HISTORY })

/* --------------------------- design tokens --------------------------- */
const C = {
  brand: '#4F50FF', brand50: '#ECF1FF', brand100: '#DDE4FF', brand600: '#4436F5', brand700: '#3A2AD8',
  g25: '#FCFCFD', g50: '#F9FAFB', g100: '#F3F4F6', g200: '#E5E7EB', g400: '#9CA3B0',
  g500: '#687582', g600: '#4D5560', g700: '#363D44', g800: '#22272B', g900: '#191C1F',
  border: '#E5E7EB',
  shadow: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.10)',
  radius: 14,
}
const PALETTE = ['#4F50FF', '#14BEC6', '#00E8B4', '#0BA5EC', '#9E77ED', '#F79009']
const FONT = "'Plus Jakarta Sans', -apple-system, sans-serif"

const ICONS: Record<string, any> = {
  users: Users, flask: FlaskConical, 'badge-check': BadgeCheck, dollar: DollarSign,
  'trending-up': TrendingUp, percent: Percent, award: Award, 'map-pin': MapPin, target: Target,
  pie: PieIcon, stethoscope: Stethoscope, divide: Divide, building: Building2, 'file-text': FileText,
  'check-circle': CircleCheck, sliders: SlidersHorizontal, layers: Layers, 'alert-triangle': TriangleAlert,
  shield: Shield, clock: Clock, flame: Flame, battery: BatteryMedium, briefcase: Briefcase,
}
function Icon({ name, size = 18, color = C.g600 }: { name: string; size?: number; color?: string }) {
  const Cmp = ICONS[name] || Activity
  return <Cmp size={size} color={color} strokeWidth={2} />
}
function pillStyle(status: string): CSSProperties {
  let bg = C.g100, fg = C.g600
  if (status === 'Live') { bg = '#ECFDF3'; fg = '#027A48' }
  else if (status === 'Beta' || status === 'Estimate') { bg = '#FFFAEB'; fg = '#B54708' }
  else if (status === 'Modeled') { bg = C.brand50; fg = C.brand700 }
  return { background: bg, color: fg, fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }
}

/* ------------------------------ pieces ------------------------------ */
function StatusPill({ status }: { status: string }) {
  return <span style={pillStyle(status)}>{status}</span>
}
function MdBadge() {
  return <span style={{ background: '#F0F9FF', color: '#026AA2', fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={11} /> MD-reviewed</span>
}
function Sparkline({ field }: { field: string }) {
  const { history } = useContext(DashCtx)
  const data = history.map((h) => ({ v: (h as any)[field] }))
  return (
    <div style={{ height: 34, marginTop: 2 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Area type="monotone" dataKey="v" stroke={C.brand} fill="rgba(79,80,255,0.10)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
function KpiCard({ id, label }: { id: string; label: string }) {
  const { metrics } = useContext(DashCtx)
  const m = metrics.find((x) => x.id === id)!
  const sparkField = id === 'm07' ? 'members' : m.trend
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: C.radius, boxShadow: C.shadow, padding: '18px 18px 14px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: C.brand50, color: C.brand600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={m.icon} color={C.brand600} /></div>
        <StatusPill status={m.status} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: C.g900, letterSpacing: '-0.02em', lineHeight: 1 }}>{m.value_display}</div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.g500 }}>{label}</div>
      {sparkField ? <Sparkline field={sparkField} /> : <div style={{ height: 34 }} />}
    </div>
  )
}
function Tile({ m }: { m: Metric }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: C.radius, boxShadow: C.shadow, padding: '16px 16px 15px', display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: C.g100, color: C.g600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={m.icon} size={16} /></div>
        <div style={{ fontSize: 23, fontWeight: 800, color: C.g900, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{m.value_display}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.g700 }}>{m.metric}</div>
      <div style={{ fontSize: 11.5, color: C.g400, fontWeight: 500, lineHeight: 1.4 }}>{m.def}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 4 }}>
        <StatusPill status={m.status} />{m.md === 'Yes' && <MdBadge />}
      </div>
    </div>
  )
}
function SectionHead({ name, subtitle, accent, tag }: { name: string; subtitle: string; accent: string; tag?: string }) {
  return (
    <div style={{ margin: '44px 0 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 5, alignSelf: 'stretch', borderRadius: 3, minHeight: 42, background: accent }} />
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: C.g900, letterSpacing: '-0.01em', margin: 0 }}>{name}</h2>
        <p style={{ fontSize: 13.5, color: C.g500, fontWeight: 500, marginTop: 2, maxWidth: 680 }}>{subtitle}</p>
      </div>
      {tag && <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: C.g400, letterSpacing: '.06em', textTransform: 'uppercase', paddingTop: 3 }}>{tag}</div>}
    </div>
  )
}
function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: C.radius, boxShadow: C.shadow, padding: 20, minWidth: 0, ...style }}>{children}</div>
}
function Legend({ items }: { items: { c: string; t: string }[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '14px 0 6px', fontSize: 12, fontWeight: 600, color: C.g600 }}>
      {items.map((i) => <span key={i.t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: i.c }} />{i.t}</span>)}
    </div>
  )
}

/* ------------------------------- app ------------------------------- */
export default function Dashboard() {
  const { data, trigger } = useGetDashboardData()

  useEffect(() => {
    const id = 'pjs-font'
    if (!document.getElementById(id)) {
      const l = document.createElement('link')
      l.id = id; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
      document.head.appendChild(l)
    }
  }, [])

  useEffect(() => { void trigger() }, [trigger])

  const metrics: Metric[] = (data as any)?.metrics?.map((r: any) => ({
    id: r.id, section: r.section, metric: r.metric, value: Number(r.value),
    value_display: r.value_display, status: r.status,
    md: r.md_reviewed as 'Yes' | 'No', public: r.public as 'Yes' | 'No',
    def: r.definition, icon: r.icon, trend: r.trend_key ?? null,
  })) ?? METRICS

  type Section = { section: string; name: string; subtitle: string; world: string; accent: string }
  const sections: Section[] = ((data as any)?.sections ?? SECTIONS).map((r: any) => ({
    section: r.section as string, name: r.name as string, subtitle: r.subtitle as string,
    world: (r.world_equivalent ?? r.world) as string, accent: (r.accent_color ?? r.accent) as string,
  }))

  const history: HistoryRow[] = (data as any)?.history?.map((r: any) => ({
    m: r.month, waitlist: Number(r.waitlist), members: Number(r.members),
    operators: Number(r.operators), panels: Number(r.panels), burn: Number(r.burn),
  })) ?? HISTORY

  type Operator = { id: string; city: string; status: string; members: number; joined: string; specialty: string }
  const operators: Operator[] = ((data as any)?.operators ?? OPERATORS).map((r: any) => ({
    id: (r.operator_id ?? r.id) as string, city: r.city as string, status: r.status as string,
    members: Number(r.members_served ?? r.members),
    joined: (r.joined_month ?? r.joined) as string, specialty: r.specialty as string,
  }))

  const cities: Record<string, number> = {}
  operators.forEach((o) => { cities[o.city] = (cities[o.city] || 0) + 1 })
  const cityData = Object.keys(cities).map((c) => ({ name: c, value: cities[c] }))
  const pathways = ['m11', 'm12', 'm13'].map((pid) => metrics.find((m) => m.id === pid)!)
  const pathData = pathways.map((m) => ({ name: m.metric.replace('Pathway: ', ''), value: m.value }))
  const opSorted = [...operators].sort((a, b) => b.members - a.members)
  const axis = { fontSize: 11, fontFamily: FONT, fill: C.g500 }

  return (
    <DashCtx.Provider value={{ metrics, history }}>
    <div style={{ fontFamily: FONT, background: C.g50, color: C.g800, minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 28px 64px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingBottom: 28, borderBottom: `1px solid ${C.border}`, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, boxShadow: C.shadow, overflow: 'hidden', flexShrink: 0 }}>
              <svg width="46" height="46" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <rect width="180" height="180" rx="40" fill="url(#ccGrad)"/>
                <g clipPath="url(#ccClip)">
                  <path d="M91.5706 38.8241C107.182 39.3027 120.946 46.7154 129.999 58.0155L140 50.0185C128.266 35.3768 110.229 26 90 26C69.7712 26 51.7341 35.3768 40 50.0185L49.9992 58.0142C59.7223 45.8849 74.8313 38.3108 91.5706 38.8241Z" fill="white"/>
                  <path d="M88.4294 141.176C72.8183 140.697 59.0539 133.285 50.0008 121.984L40 129.981C51.7341 144.623 69.7712 154 90 154C110.229 154 128.266 144.623 140 129.981L130.001 121.986C120.278 134.115 105.169 141.689 88.4294 141.176Z" fill="white"/>
                  <path d="M109.999 74.0083L119.998 66.0124C112.958 57.2274 102.137 51.6 90 51.6C77.8627 51.6 67.0421 57.2274 60.0016 66.0124C54.7344 72.5848 51.5822 80.9239 51.5822 90C51.5822 99.0761 54.7344 107.415 60.0016 113.988C67.0421 122.773 77.8627 128.4 90 128.4C102.137 128.4 112.958 122.773 119.998 113.988L109.999 105.992C105.305 111.848 98.0915 115.6 90 115.6C81.9085 115.6 74.6947 111.848 70.0011 105.992C66.4896 101.61 64.3881 96.0507 64.3881 90C64.3881 83.9492 66.4896 78.3899 70.0011 74.0083C74.6947 68.1516 81.9085 64.4 90 64.4C98.0914 64.4 105.305 68.1516 109.999 74.0083Z" fill="white"/>
                  <path d="M90 79.6448C86.727 79.6448 83.809 81.1623 81.9105 83.5313C80.4901 85.3037 79.64 87.5524 79.64 90C79.64 92.4475 80.4901 94.6963 81.9105 96.4686C83.809 98.8376 86.727 100.355 90 100.355C93.273 100.355 96.191 98.8376 98.0896 96.4686C99.51 94.6962 100.36 92.4475 100.36 90C100.36 87.5524 99.5099 85.3037 98.0896 83.5313C96.191 81.1623 93.273 79.6448 90 79.6448Z" fill="white"/>
                </g>
                <defs>
                  <linearGradient id="ccGrad" x1="180" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0BA5EC"/>
                    <stop offset="1" stopColor="#4F50FF"/>
                  </linearGradient>
                  <clipPath id="ccClip">
                    <rect width="100" height="128" fill="white" transform="translate(40 26)"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.g900, letterSpacing: '-0.02em', margin: 0 }}>Consensus Center</h1>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.g500, margin: 0 }}>Transparency Dashboard</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: C.g600, background: '#fff', border: `1px solid ${C.border}`, padding: '8px 14px', borderRadius: 999, boxShadow: C.shadow }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.brand }} /> Pre-launch · Updated June 2026
          </div>
        </div>

        {/* KPI hero */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 16 }} className="cc-kpis">
          <KpiCard id="m01" label="Waitlist size" />
          <KpiCard id="m07" label="Members served" />
          <KpiCard id="m14" label="Active operators" />
          <KpiCard id="m18" label="Panels processed" />
          <KpiCard id="m20" label="Clinician review rate" />
        </div>

        {/* growth chart */}
        <Card style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: 0 }}>Growth & clinical activity over time</h3>
          <div style={{ fontSize: 12.5, color: C.g500, fontWeight: 500, marginTop: 2 }}>Monthly trajectory, Nov 2024 – Jun 2026 · honest pre-launch trend (paying revenue still $0)</div>
          <Legend items={[{ c: PALETTE[0], t: 'Waitlist' }, { c: PALETTE[1], t: 'Members served' }, { c: PALETTE[3], t: 'Panels processed' }, { c: PALETTE[4], t: 'Active operators' }]} />
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={C.g100} vertical={false} />
                <XAxis dataKey="m" tick={axis} tickLine={false} axisLine={{ stroke: C.g200 }} angle={-45} textAnchor="end" height={50} interval={0} />
                <YAxis tick={axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 10, border: `1px solid ${C.border}` }} />
                <Line type="monotone" dataKey="waitlist" name="Waitlist" stroke={PALETTE[0]} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="members" name="Members served" stroke={PALETTE[1]} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="panels" name="Panels processed" stroke={PALETTE[3]} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="operators" name="Active operators" stroke={PALETTE[4]} strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* sections */}
        {sections.map((sec) => {
          const tiles = metrics.filter((m) => m.section === sec.section && m.public === 'Yes')
          return (
            <div key={sec.section}>
              <SectionHead name={sec.name} subtitle={sec.subtitle} accent={sec.accent} tag={sec.section} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16 }} className="cc-tiles">
                {tiles.map((m) => <Tile key={m.id} m={m} />)}
              </div>

              {sec.section === '1.b' && (
                <Card style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: 0 }}>Member pathway mix</h3>
                  <div style={{ fontSize: 12.5, color: C.g500, fontWeight: 500, marginTop: 2 }}>Distribution of members across access pathways (aggregate)</div>
                  <Legend items={pathData.map((p, i) => ({ c: PALETTE[[0, 1, 4][i]], t: `${p.name} ${p.value}%` }))} />
                  <div style={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pathData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} stroke="#fff" strokeWidth={3}>
                          {pathData.map((_, i) => <Cell key={i} fill={PALETTE[[0, 1, 4][i]]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 10, border: `1px solid ${C.border}` }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {sec.section === '1.c' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, marginTop: 16 }} className="cc-2col">
                  <Card>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: 0 }}>Operators by city</h3>
                    <div style={{ fontSize: 12.5, color: C.g500, fontWeight: 500, marginTop: 2 }}>8 active operators · Cali, Bogotá, Medellín</div>
                    <Legend items={cityData.map((c, i) => ({ c: PALETTE[i], t: `${c.name} (${c.value})` }))} />
                    <div style={{ width: '100%', height: 230 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={cityData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={2} stroke="#fff" strokeWidth={3}>
                            {cityData.map((_, i) => <Cell key={i} fill={PALETTE[i]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 10, border: `1px solid ${C.border}` }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.g900, margin: 0 }}>Members served per operator</h3>
                    <div style={{ fontSize: 12.5, color: C.g500, fontWeight: 500, marginTop: 2 }}>Current member load by operator</div>
                    <div style={{ width: '100%', height: 300, marginTop: 10 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={opSorted} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }}>
                          <CartesianGrid stroke={C.g100} horizontal={false} />
                          <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="id" tick={{ ...axis, fontWeight: 600 }} tickLine={false} axisLine={false} width={48} />
                          <Tooltip cursor={{ fill: C.g50 }} contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 10, border: `1px solid ${C.border}` }} />
                          <Bar dataKey="members" fill={C.brand} radius={[0, 6, 6, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              )}

              {sec.section === '1.e' && (
                <div style={{ background: C.g50, border: `1px dashed ${C.brand}`, borderRadius: C.radius, padding: 20, marginTop: 18, boxShadow: C.shadow }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: C.brand100, color: C.brand700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={14} /></div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: C.g800, margin: 0 }}>Investor-only</h3>
                  </div>
                  <div style={{ fontSize: 12, color: C.g500, fontWeight: 500, marginBottom: 16 }}>Confidential financial figures — exclude from any public-facing view.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }} className="cc-inv">
                    {metrics.filter((m) => m.section === '1.e' && m.public === 'No').map((m) => (
                      <div key={m.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 15, boxShadow: C.shadow }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: C.g900, letterSpacing: '-0.02em' }}>{m.value_display}</div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.g600, marginTop: 3 }}>{m.metric}</div>
                        <div style={{ fontSize: 11, color: C.g400, fontWeight: 500, marginTop: 5 }}>{m.def}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ width: '100%', height: 200, marginTop: 18 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history} margin={{ top: 6, right: 12, bottom: 0, left: -8 }}>
                        <CartesianGrid stroke={C.g100} vertical={false} />
                        <XAxis dataKey="m" tick={{ ...axis, fontSize: 10 }} tickLine={false} axisLine={{ stroke: C.g200 }} angle={-45} textAnchor="end" height={46} interval={0} />
                        <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v: any) => `$${v / 1000}K`} />
                        <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Burn']} contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 10, border: `1px solid ${C.border}` }} />
                        <Area type="monotone" dataKey="burn" stroke="#F79009" fill="rgba(247,144,9,0.10)" strokeWidth={2.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* operators table */}
        <SectionHead name="Operator network" subtitle="Licensed physician operators across three Colombian cities" accent="#5db4c7" />
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Operator', 'City', 'Specialty', 'Members', 'Joined', 'Status'].map((h) => (
              <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.g500, textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>{operators.map((o) => (
              <tr key={o.id}>
                <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g100}`, fontWeight: 700, color: C.g900 }}>{o.id}</td>
                <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g100}` }}><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: C.brand50, color: C.brand700 }}>{o.city}</span></td>
                <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g100}`, fontWeight: 500, color: C.g700 }}>{o.specialty}</td>
                <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g100}`, fontWeight: 700, color: C.g900 }}>{o.members}</td>
                <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g100}`, fontWeight: 500, color: C.g700 }}>{o.joined}</td>
                <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g100}` }}><StatusPill status="Live" /></td>
              </tr>
            ))}</tbody>
          </table>
        </Card>

        {/* reference structure */}
        <SectionHead name="Reference structure" subtitle="How each section of this dashboard maps to a familiar transparency model" accent="#c98a3c" />
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr>{['Section', 'Name', 'Equivalent model'].map((h) => (
              <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.g500, textTransform: 'uppercase', letterSpacing: '.05em', padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>{sections.map((s) => (
              <tr key={s.section}>
                <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g100}`, fontWeight: 700, color: C.g900 }}>{s.section}</td>
                <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g100}`, fontWeight: 600, color: C.g900 }}>{s.name}</td>
                <td style={{ padding: '12px 14px', borderBottom: `1px solid ${C.g100}`, fontWeight: 500, color: C.g500 }}>{s.world}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.g400, fontWeight: 500, lineHeight: 1.6 }}>
          All values are real and shown honestly. Pre-launch figures (paying members, MRR, ARR, operator earnings) are genuinely $0 / 0 and are not replaced with projections. Clinical metrics are aggregate and de-identified, reviewed by the Medical Director. Investor-only figures (burn, runway, round size) are marked and separated.
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px){ .cc-kpis{grid-template-columns:repeat(3,minmax(0,1fr)) !important} .cc-tiles{grid-template-columns:repeat(2,minmax(0,1fr)) !important} }
        @media (max-width: 680px){ .cc-kpis,.cc-tiles,.cc-2col,.cc-inv{grid-template-columns:1fr !important} }
      `}</style>
    </div>
    </DashCtx.Provider>
  )
}
