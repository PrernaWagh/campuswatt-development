'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  BarChart3,
  Building2,
  Calculator,
  ChevronDown,
  CircleHelp,
  Cloud,
  Database,
  Download,
  FileText,
  Gauge,
  Home,
  Leaf,
  Menu,
  Network,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import {
  buildings,
  categories,
  calculateCarbon,
  calculateCost,
  calculateEnergy,
  calculateMetrics,
  createDemoReadings,
  createUserReading,
  detectWastage,
  exportReadingsCsv,
  formatMetric,
  type Category,
  type EnergyReading,
  type Settings as AppSettings,
} from '@/lib/campus-data'

const nav = [
  { label: 'Dashboard', icon: Home },
  { label: 'Energy Analytics', icon: Zap },
  { label: 'Wastage Detector', icon: TriangleAlert },
  { label: 'Recommendations', icon: Sparkles },
  { label: 'What-If Simulator', icon: Calculator },
  { label: 'IT Infrastructure', icon: Database },
  { label: 'Sustainability Metrics', icon: Leaf },
  { label: 'Impact & Reports', icon: FileText },
  { label: 'Settings', icon: Settings },
]

const colors = ['#1f8f79', '#e28b45', '#5d8da4', '#8b9a65', '#b06e9c', '#d9b95b', '#879895']

const emptyForm = {
  building: buildings[0].name,
  room: '',
  date: new Date().toISOString().slice(0, 10),
  category: 'Computing' as Category,
  asset: '',
  powerWatts: 150,
  quantity: 1,
  operatingHours: 8,
  utilization: 50,
  activeHours: 7,
  idleHours: 1,
  age: 0,
  notes: '',
}

/* ---------- Reusable UI Primitives ---------- */

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
        <Leaf size={19} />
      </div>
      <div>
        <p className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">
          Campus<span className="text-emerald-600">Watt</span>
        </p>
        <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-slate-400">
          Energy intelligence
        </p>
      </div>
    </div>
  )
}

function Badge({
  children,
  tone = 'green',
}: {
  children: React.ReactNode
  tone?: 'green' | 'amber' | 'blue'
}) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
      : tone === 'blue'
      ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${toneClass}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${className}`}
    >
      {children}
    </section>
  )
}

function Kpi({
  label,
  value,
  detail,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Zap
  color: string
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className={`grid size-9 place-items-center rounded-xl ${color}`}>
          <Icon size={17} />
        </div>
        <span className="text-[10px] font-bold text-emerald-600">Calculated</span>
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

function Title({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="mb-6">
      <Badge tone="blue">CampusWatt module</Badge>
      <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </section>
  )
}

/* ---------- Main Page Component ---------- */

export default function Page() {
  const [active, setActive] = useState('Dashboard')
  const [menu, setMenu] = useState(false)
  const [dark, setDark] = useState(false)
  const [toast, setToast] = useState('')

  const [demo, setDemo] = useState<EnergyReading[]>(() => createDemoReadings())
  const [user, setUser] = useState<EnergyReading[]>([])
  const [college, setCollege] = useState<EnergyReading[]>([])
  const [source, setSource] = useState<'All' | 'DEMO' | 'USER INPUT' | 'COLLEGE DATA'>('All')
  const [building, setBuilding] = useState('All Campus')
  const [room, setRoom] = useState('All Rooms')
  const [category, setCategory] = useState<'All' | Category>('All')
  const [range, setRange] = useState('30 days')
  const [query, setQuery] = useState('')

  const [settings, setSettings] = useState<AppSettings>({
    tariff: 10,
    emissionFactor: 0.82,
    operatingDays: 26,
    lowUtilization: 30,
    idleThreshold: 20,
    oldAssetYears: 5,
  })
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [sim, setSim] = useState({
    devices: 60,
    power: 150,
    hours: 10,
    utilization: 25,
    projectedHours: 7,
    projectedUtilization: 60,
    sleepPower: 5,
  })

  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    setDemo(createDemoReadings())
    const loadPersistedReadings = async () => {
      try {
        const response = await fetch('/api/energy-readings')
        if (!response.ok) throw new Error('Database unavailable')
        const payload = await response.json()
        setCollege(payload.readings ?? [])
        setDbStatus('online')
      } catch {
        setDbStatus('offline')
        showToast('Database unavailable; demo data remains available.')
      }
    }
    loadPersistedReadings()
    try {
      const theme = localStorage.getItem('campuswatt-theme')
      if (theme === 'dark') {
        setDark(true)
        document.documentElement.classList.add('dark')
      }
    } catch {}
  }, [])

  const allReadings = useMemo(() => [...demo, ...college, ...user], [demo, college, user])

  const filtered = useMemo(() => {
    const cutoff = range === '7 days' ? 7 : range === '3 months' ? 90 : 30
    const since = Date.now() - cutoff * 86400000
    return allReadings.filter(
      (r) =>
        (source === 'All' || r.source === source) &&
        (building === 'All Campus' || r.building === building) &&
        (room === 'All Rooms' || r.room === room) &&
        (category === 'All' || r.category === category) &&
        new Date(r.date).getTime() >= since &&
        `${r.building} ${r.room} ${r.asset}`.toLowerCase().includes(query.toLowerCase()),
    )
  }, [allReadings, source, building, room, category, range, query])

  const availableRooms = useMemo(() => {
    const pool = building === 'All Campus' ? allReadings : allReadings.filter((r) => r.building === building)
    return Array.from(new Set(pool.map((r) => r.room).filter(Boolean))).sort()
  }, [allReadings, building])

  const metrics = useMemo(() => calculateMetrics(filtered, settings), [filtered, settings])
  const issues = useMemo(() => detectWastage(filtered, settings), [filtered, settings])

  const categoryData = categories
    .map((name, i) => ({
      name,
      value: filtered
        .filter((r) => r.category === name)
        .reduce((s, r) => s + calculateEnergy(r, settings.operatingDays), 0),
      fill: colors[i],
    }))
    .filter((x) => x.value > 0)

  const buildingData = buildings
    .map((b) => ({
      name: b.name.replace(' Block', ''),
      value: filtered
        .filter((r) => r.buildingId === b.id)
        .reduce((s, r) => s + calculateEnergy(r, settings.operatingDays), 0),
    }))
    .filter((x) => x.value > 0)

  const trend = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(5, 10)
    return {
      day,
      energy: filtered
        .filter((r) => r.date.slice(5) === day)
        .reduce((s, r) => s + calculateEnergy(r, settings.operatingDays) / settings.operatingDays, 0),
    }
  })

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  const saveReading = async (event: React.FormEvent) => {
    event.preventDefault()
    if (
      form.powerWatts < 0 ||
      form.operatingHours < 0 ||
      form.operatingHours > 24 ||
      form.quantity <= 0 ||
      form.utilization < 0 ||
      form.utilization > 100 ||
      !form.building ||
      !form.date
    )
      return showToast('Please check power, quantity, hours, utilization and building fields.')

    const buildingRecord = buildings.find((item) => item.name === form.building)
    if (!buildingRecord) return showToast('Select a valid building.')

    try {
      const response = await fetch('/api/energy-readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          buildingName: buildingRecord.name,
          operatingDays: settings.operatingDays,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save reading')

      // Re-fetch from DB to ensure consistency
      const refreshRes = await fetch('/api/energy-readings')
      if (refreshRes.ok) {
        const refreshPayload = await refreshRes.json()
        setCollege(refreshPayload.readings ?? [])
      } else {
        const next = {
          ...createUserReading(form),
          id: payload.id,
          source: 'COLLEGE DATA' as const,
          buildingId: buildingRecord.id,
        }
        setCollege((current) => [next, ...current])
      }

      setShowForm(false)
      setForm(emptyForm)
      showToast('✓ Reading saved to Supabase')
    } catch (err: any) {
      console.error('Save failed:', err)
      showToast(err.message ?? 'Unable to save data. Please check your connection.')
    }
  }

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('campuswatt-theme', next ? 'dark' : 'light')
  }

  const download = () => {
    const blob = new Blob([exportReadingsCsv(filtered)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'campuswatt-readings.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('CSV export downloaded')
  }

  const simCurrent = calculateEnergy(
    { powerWatts: sim.power, quantity: sim.devices, operatingHours: sim.hours },
    settings.operatingDays,
  )
  const simAfter = calculateEnergy(
    {
      powerWatts: sim.sleepPower + (sim.power - sim.sleepPower) * sim.projectedUtilization / 100,
      quantity: sim.devices,
      operatingHours: sim.projectedHours,
    },
    settings.operatingDays,
  )
  const simSave = Math.max(0, simCurrent - simAfter)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl"
        >
          {toast}
        </div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-slate-200 bg-white px-4 py-5 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          menu ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Logo />
          <button
            onClick={() => setMenu(false)}
            className="rounded-lg p-2 text-slate-400 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActive(label)
                setMenu(false)
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold transition ${
                active === label
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              {label}
              {label === 'Wastage Detector' && issues.length > 0 && (
                <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">
                  {issues.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={17} className="text-emerald-600" />
            <div>
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                Demo workspace
              </p>
              <p className="text-[10px] text-emerald-700/60">Synthetic campus data</p>
            </div>
          </div>
        </div>
      </aside>

      {menu && (
        <button
          onClick={() => setMenu(false)}
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
        />
      )}

      <main className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-slate-50/90 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenu(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 lg:hidden dark:border-slate-700 dark:bg-slate-900"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <span className="hidden text-xs text-slate-400 sm:block">
              Campus operations /{' '}
              <strong className="text-slate-600 dark:text-slate-300">{active}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                dbStatus === 'online'
                  ? 'bg-emerald-100 text-emerald-700'
                  : dbStatus === 'offline'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  dbStatus === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : dbStatus === 'offline'
                    ? 'bg-red-500'
                    : 'bg-slate-400'
                }`}
              />
              {dbStatus === 'online' ? 'DB Online' : dbStatus === 'offline' ? 'DB Offline' : 'Checking...'}
            </span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 dark:border-slate-700 dark:bg-slate-900"
            >
              {dark ? <Sun size={16} /> : <Sun size={16} />}
            </button>
            <Badge tone="green">
              {source === 'All'
                ? user.length
                  ? 'Demo + User Data'
                  : 'Demo Data'
                : source === 'DEMO'
                ? 'Demo Data'
                : 'User Data'}
            </Badge>
          </div>
        </header>
        <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 sm:px-8">
          <Activity size={13} /> DEMO MODE — Synthetic campus data is being used. Add your college
          readings to compare.
        </div>

        <div className="mx-auto max-w-[1440px] px-4 py-7 pb-24 sm:px-8 lg:px-10 lg:py-9">
          {active === 'Dashboard' && (
            <Dashboard
              metrics={metrics}
              trend={trend}
              categoryData={categoryData}
              buildingData={buildingData}
              issues={issues}
              onNavigate={setActive}
            />
          )}
          {active === 'Energy Analytics' && (
            <Analytics trend={trend} categoryData={categoryData} buildingData={buildingData} />
          )}
          {active === 'Wastage Detector' && (
            <Wastage
              issues={issues}
              expanded={expanded}
              setExpanded={setExpanded}
              settings={settings}
            />
          )}
          {active === 'Recommendations' && (
            <Recommendations issues={issues} metrics={metrics} settings={settings} />
          )}
          {active === 'What-If Simulator' && (
            <Simulator
              sim={sim}
              setSim={setSim}
              current={simCurrent}
              after={simAfter}
              saved={simSave}
              settings={settings}
            />
          )}
          {active === 'IT Infrastructure' && <Infrastructure />}
          {active === 'Sustainability Metrics' && (
            <Sustainability metrics={metrics} settings={settings} />
          )}
          {active === 'Impact & Reports' && (
            <Reports metrics={metrics} issues={issues} onDownload={download} />
          )}
          {active === 'Settings' && (
            <SettingsPanel settings={settings} setSettings={setSettings} />
          )}

          <section className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Energy readings</h2>
                <p className="mt-1 text-xs text-slate-400">
                  {filtered.length} records • formulas use {settings.operatingDays} operating days/month
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20"
                >
                  <Plus size={15} /> Add Energy Reading
                </button>
                <button
                  onClick={download}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>
            {showForm && (
              <ReadingForm
                form={form}
                setForm={setForm}
                onSubmit={saveReading}
                onCancel={() => setShowForm(false)}
              />
            )}
          </section>

          <section className="mt-5">
            <Card>
              <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[180px] flex-1">
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search building, room or asset"
                    className={`${inputClass} pl-9`}
                  />
                </div>
                <select
                  value={building}
                  onChange={(e) => {
                    setBuilding(e.target.value)
                    setRoom('All Rooms')
                  }}
                  className={inputClass + ' max-w-[190px]'}
                >
                  <option>All Campus</option>
                  {buildings.map((b) => (
                    <option key={b.id}>{b.name}</option>
                  ))}
                </select>
                <select
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className={inputClass + ' max-w-[170px]'}
                >
                  <option>All Rooms</option>
                  {availableRooms.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as 'All' | Category)}
                  className={inputClass + ' max-w-[150px]'}
                >
                  <option value="All">All categories</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as typeof source)}
                  className={inputClass + ' max-w-[150px]'}
                >
                  <option value="All">All sources</option>
                  <option value="DEMO">Demo only</option>
                  <option value="USER INPUT">User input only</option>
                  <option value="COLLEGE DATA">College data only</option>
                </select>
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className={inputClass + ' max-w-[125px]'}
                >
                  <option>7 days</option>
                  <option>30 days</option>
                  <option>3 months</option>
                </select>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      {['Date', 'Building / Area', 'Category', 'Power', 'Hours', 'Energy', 'Source'].map((h) => (
                        <th key={h} className="px-3 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 12).map((r) => (
                      <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-3">{r.date}</td>
                        <td className="px-3 py-3 font-semibold">
                          {r.building}
                          <span className="block text-[10px] font-normal text-slate-400">{r.room}</span>
                        </td>
                        <td className="px-3 py-3">{r.category}</td>
                        <td className="px-3 py-3">
                          {r.powerWatts} W × {r.quantity}
                        </td>
                        <td className="px-3 py-3">{r.operatingHours} h</td>
                        <td className="px-3 py-3 font-semibold">
                          {calculateEnergy(r, settings.operatingDays).toFixed(1)} kWh
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={r.source === 'DEMO' ? 'blue' : 'green'}>{r.source}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-sm text-slate-400">
                    No readings found. Add a USER INPUT reading or reset the demo dataset.
                  </div>
                )}
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}

/* ---------- Dashboard Component ---------- */

function Dashboard({ metrics, trend, categoryData, buildingData, issues, onNavigate }: any) {
  return (
    <>
      <section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge>Campus overview</Badge>
            <span className="text-[10px] text-slate-400">DEMO DATA — Synthetic Campus Dataset</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Good morning, Campus Administrator
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Monitor, analyze and improve campus energy performance.
          </p>
        </div>
        <button
          onClick={() => onNavigate('Impact & Reports')}
          className="flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-slate-900"
        >
          <FileText size={15} /> Impact report
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Kpi
          label="Total energy"
          value={`${formatMetric(metrics.totalEnergy)} kWh`}
          detail="calculated monthly estimate"
          icon={Zap}
          color="bg-emerald-100 text-emerald-700"
        />
        <Kpi
          label="Energy cost"
          value={`₹${formatMetric(metrics.cost)}`}
          detail="at configurable tariff"
          icon={Calculator}
          color="bg-amber-100 text-amber-700"
        />
        <Kpi
          label="Carbon footprint"
          value={`${formatMetric(metrics.carbon)} kg`}
          detail="estimated CO₂e"
          icon={Cloud}
          color="bg-sky-100 text-sky-700"
        />
        <Kpi
          label="Potential savings"
          value={`${formatMetric(metrics.potentialSavings)} kWh`}
          detail="rule-based estimate"
          icon={Sparkles}
          color="bg-lime-100 text-lime-700"
        />
        <Kpi
          label="Green IT score"
          value="78/100"
          detail="demonstration score"
          icon={Gauge}
          color="bg-violet-100 text-violet-700"
        />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold">Energy trend</h2>
              <p className="mt-1 text-[11px] text-slate-400">Daily calculated consumption</p>
            </div>
            <Badge tone="blue">Last 7 days</Badge>
          </div>
          <div className="mt-6 h-[250px]">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#1f8f79" stopOpacity=".25" />
                    <stop offset="1" stopColor="#1f8f79" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e8efeb" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="energy" stroke="#1f8f79" strokeWidth={2.5} fill="url(#fill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-bold">Energy by category</h2>
          <p className="mt-1 text-[11px] text-slate-400">Where calculated energy goes</p>
          <div className="h-[225px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={3}
                >
                  {categoryData.map((x: any) => (
                    <Cell key={x.name} fill={x.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-[10px]">
            {categoryData.map((x: any) => (
              <span key={x.name} className="flex items-center gap-1">
                <i className="size-2 rounded-full" style={{ background: x.fill }} />
                {x.name}
              </span>
            ))}
          </div>
        </Card>
      </section>

      <Card className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">What did CampusWatt find?</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Insights generated from the current dataset
            </p>
          </div>
          <button
            onClick={() => onNavigate('Wastage Detector')}
            className="text-xs font-bold text-emerald-600"
          >
            Review issues →
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4 text-xs dark:bg-emerald-950/40">
            {buildingData[0]?.name ?? 'Campus'} accounts for{' '}
            {buildingData.length
              ? Math.round(
                  (buildingData[0].value /
                    buildingData.reduce((s: number, x: any) => s + x.value, 0)) *
                    100,
                )
              : 0}
            % of calculated campus energy.
          </div>
          <div className="rounded-xl bg-amber-50 p-4 text-xs dark:bg-amber-950/40">
            {issues.length} potential wastage patterns detected by transparent rules.
          </div>
          <div className="rounded-xl bg-sky-50 p-4 text-xs dark:bg-sky-950/40">
            Estimated opportunity: {formatMetric(metrics.potentialSavings)} kWh/month, not guaranteed.
          </div>
        </div>
      </Card>
    </>
  )
}

/* ---------- Analytics Component ---------- */

function Analytics({ trend, categoryData, buildingData }: any) {
  return (
    <>
      <Title
        title="Energy Analytics"
        subtitle="Explore consumption by time, category, building and intensity."
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-sm font-bold">Energy consumption trend</h2>
          <div className="mt-5 h-[280px]">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <CartesianGrid vertical={false} stroke="#e8efeb" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area dataKey="energy" stroke="#1f8f79" fill="#1f8f7930" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-bold">Building comparison</h2>
          <div className="mt-5 h-[280px]">
            <ResponsiveContainer>
              <BarChart data={buildingData}>
                <CartesianGrid vertical={false} stroke="#e8efeb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1f8f79" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card className="mt-5">
        <h2 className="text-sm font-bold">Category distribution</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categoryData.map((x: any) => (
            <div key={x.name} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-xs font-semibold">{x.name}</p>
              <p className="mt-2 text-xl font-bold">{formatMetric(x.value)} kWh</p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (x.value / Math.max(...categoryData.map((y: any) => y.value))) * 100,
                    )}%`,
                    background: x.fill,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ---------- Wastage Component ---------- */

function Wastage({ issues, expanded, setExpanded, settings }: any) {
  return (
    <>
      <Title
        title="Energy Wastage Detector"
        subtitle="Explainable rule-based detection. CampusWatt does not claim AI or machine learning."
      />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          label="Issues detected"
          value={issues.length}
          detail="current filtered data"
          icon={TriangleAlert}
          color="bg-amber-100 text-amber-700"
        />
        <Kpi
          label="Estimated waste"
          value={`${formatMetric(issues.reduce((s: number, x: any) => s + x.saving, 0))} kWh`}
          detail="not guaranteed"
          icon={Zap}
          color="bg-emerald-100 text-emerald-700"
        />
      </div>
      <div className="space-y-3">
        {issues.map((issue: any) => (
          <Card key={issue.id}>
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={issue.severity === 'High' ? 'amber' : 'blue'}>
                    {issue.severity}
                  </Badge>
                  <span className="text-[10px] text-slate-400">{issue.reading.source}</span>
                </div>
                <h2 className="mt-3 font-bold">
                  {issue.type} in {issue.reading.room}
                </h2>
                <p className="mt-1 text-xs text-slate-500">Evidence: {issue.evidence}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  Estimated impact: {formatMetric(issue.saving)} kWh/month • ₹
                  {formatMetric(calculateCost(issue.saving, settings))}
                </p>
              </div>
              <div className="max-w-sm rounded-xl bg-emerald-50 p-3 text-xs dark:bg-emerald-950/40">
                <p className="font-bold text-emerald-800 dark:text-emerald-200">Recommended action</p>
                <p className="mt-1 text-emerald-800/80 dark:text-emerald-200/80">{issue.action}</p>
              </div>
            </div>
            <button
              onClick={() => setExpanded(expanded === issue.id ? null : issue.id)}
              className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"
            >
              <CircleHelp size={14} /> Why was this detected?{' '}
              <ChevronDown size={14} className={expanded === issue.id ? 'rotate-180' : ''} />
            </button>
            {expanded === issue.id && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                Rule applied transparently: <strong>{issue.rule}</strong>. Results are estimates
                based on entered values and configurable assumptions.
              </div>
            )}
          </Card>
        ))}
        {!issues.length && (
          <Card>
            <div className="py-10 text-center text-sm text-slate-400">
              No potential wastage patterns found for the selected filters.
            </div>
          </Card>
        )}
      </div>
    </>
  )
}

/* ---------- Recommendations Component ---------- */

function Recommendations({ issues, metrics, settings }: any) {
  return (
    <>
      <Title
        title="Recommendations"
        subtitle="Actions are generated from detected patterns, with estimated impact previews."
      />
      <div className="space-y-3">
        {issues.slice(0, 8).map((i: any) => (
          <Card key={i.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge tone={i.severity === 'High' ? 'amber' : 'green'}>{i.severity} priority</Badge>
                <h2 className="mt-3 font-bold">{i.action}</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Problem: {i.type} • Evidence: {i.evidence}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-right dark:bg-slate-950">
                <p className="text-[10px] uppercase text-slate-400">Estimated impact</p>
                <p className="font-bold text-emerald-700">{formatMetric(i.saving)} kWh saved</p>
                <p className="text-xs text-slate-500">
                  ₹{formatMetric(calculateCost(i.saving, settings))} •{' '}
                  {formatMetric(calculateCarbon(i.saving, settings))} kg CO₂
                </p>
              </div>
            </div>
          </Card>
        ))}
        {!issues.length && (
          <Card>
            <p className="text-sm text-slate-400">
              Recommendations will appear when the detection rules find a pattern.
            </p>
          </Card>
        )}
      </div>
      <Card className="mt-5">
        <h2 className="font-bold">Impact preview</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase text-slate-400">Current</p>
            <p className="mt-1 text-xl font-bold">{formatMetric(metrics.totalEnergy)} kWh</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-400">Potential savings</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {formatMetric(metrics.potentialSavings)} kWh
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-400">Projected cost avoided</p>
            <p className="mt-1 text-xl font-bold">
              ₹{formatMetric(calculateCost(metrics.potentialSavings, settings))}
            </p>
          </div>
        </div>
      </Card>
    </>
  )
}

/* ---------- Simulator Component ---------- */

function Simulator({ sim, setSim, current, after, saved, settings }: any) {
  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSim({ ...sim, [key]: Number(e.target.value) })
  return (
    <>
      <Title
        title="What-If Simulator"
        subtitle="Enter a realistic scenario and immediately compare current versus projected energy."
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="font-bold">Scenario inputs</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ['devices', 'Devices'],
              ['power', 'Power per device (W)'],
              ['hours', 'Current hours/day'],
              ['utilization', 'Current utilization (%)'],
              ['projectedHours', 'Projected hours/day'],
              ['projectedUtilization', 'Projected utilization (%)'],
              ['sleepPower', 'Sleep power (W)'],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max={key.includes('utilization') ? 100 : undefined}
                  value={sim[key]}
                  onChange={update(key)}
                />
              </Field>
            ))}
          </div>
          <details className="mt-5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950">
            <summary className="cursor-pointer font-bold">How is this calculated?</summary>
            <p className="mt-2 leading-relaxed text-slate-500">
              Energy = Power × Quantity × Operating Hours ÷ 1000 × {settings.operatingDays} days.
              Projected power blends sleep power with utilization.
            </p>
          </details>
        </Card>
        <Card>
          <h2 className="font-bold">Impact preview</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
              <p className="text-[10px] uppercase text-slate-400">Current energy</p>
              <p className="mt-2 text-2xl font-bold">{formatMetric(current)} kWh</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
              <p className="text-[10px] uppercase text-emerald-700">Projected energy</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{formatMetric(after)} kWh</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-emerald-200 p-4">
            <p className="text-xs text-slate-500">Potential monthly reduction</p>
            <p className="mt-1 text-3xl font-bold text-emerald-600">{formatMetric(saved)} kWh</p>
            <p className="mt-2 text-xs text-slate-500">
              ₹{formatMetric(calculateCost(saved, settings))} cost •{' '}
              {formatMetric(calculateCarbon(saved, settings))} kg CO₂ avoided
            </p>
          </div>
          <div className="mt-5 h-5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, (after / current) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {current ? Math.round((saved / current) * 100) : 0}% estimated reduction • simulated result
          </p>
        </Card>
      </div>
    </>
  )
}

/* ---------- Infrastructure Component ---------- */

function Infrastructure() {
  const cards = [
    {
      icon: Database,
      title: 'Computing',
      value: '50 workstations',
      detail: 'Generic campus assets; add your own readings below.',
    },
    {
      icon: Database,
      title: 'Storage',
      value: '8.4 TB capacity',
      detail: 'Utilization is estimated from synthetic records.',
    },
    {
      icon: Network,
      title: 'Networking',
      value: '15 network devices',
      detail: 'Switches, routers and access points.',
    },
    {
      icon: Cloud,
      title: 'Cloud',
      value: '10 resources',
      detail: 'Estimated utilization; no provider dependency.',
    },
  ]
  return (
    <>
      <Title
        title="IT Infrastructure"
        subtitle="A simple inventory view for computing, storage, networking and cloud resources."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ icon: Icon, title, value, detail }) => (
          <Card key={title}>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-xs text-slate-400">{value}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{detail}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-5">
        <h2 className="font-bold">Adding your college assets</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          Use Add Energy Reading for measurements. For a fuller inventory, extend the same typed
          data model with asset name, location, rated power, quantity, age, utilization and status.
          No brands or hardware assumptions are required.
        </p>
      </Card>
    </>
  )
}

/* ---------- Sustainability Component ---------- */

function Sustainability({ metrics, settings }: any) {
  return (
    <>
      <Title
        title="Sustainability & Green IT Metrics"
        subtitle="Transparent formulas for academic demonstration and impact analysis."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="PUE"
          value={metrics.pue.toFixed(2)}
          detail="Facility energy / IT energy"
          icon={Gauge}
          color="bg-emerald-100 text-emerald-700"
        />
        <Kpi
          label="DCiE"
          value={`${metrics.dcie.toFixed(1)}%`}
          detail="IT energy / facility energy"
          icon={Activity}
          color="bg-sky-100 text-sky-700"
        />
        <Kpi
          label="Energy intensity"
          value={`${metrics.intensity.toFixed(1)} kWh/m²`}
          detail="Energy / campus area"
          icon={BarChart3}
          color="bg-amber-100 text-amber-700"
        />
        <Kpi
          label="Carbon"
          value={`${formatMetric(metrics.carbon)} kg`}
          detail={`Energy × ${settings.emissionFactor} kg CO₂/kWh`}
          icon={Leaf}
          color="bg-lime-100 text-lime-700"
        />
      </div>
      <Card className="mt-5">
        <h2 className="font-bold">CampusWatt Green IT Readiness — Demonstration Score</h2>
        <div className="mt-5 flex items-center gap-5">
          <div className="grid size-24 place-items-center rounded-full border-8 border-emerald-200 text-2xl font-bold text-emerald-700">
            78
          </div>
          <div>
            <p className="text-sm font-semibold">Strong foundation</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Deterministic demonstration score based on energy efficiency, utilization, storage,
              network, cloud and e-waste practices. It is not an official certification.
            </p>
          </div>
        </div>
        <details className="mt-5 text-xs">
          <summary className="cursor-pointer font-bold">How is this score calculated?</summary>
          <p className="mt-2 text-slate-500">
            Weighted components: energy efficiency 25%, IT utilization 20%, storage 15%, network
            15%, cloud 15%, e-waste 10%.
          </p>
        </details>
      </Card>
    </>
  )
}

/* ---------- Reports Component ---------- */

function Reports({ metrics, issues, onDownload }: any) {
  return (
    <>
      <Title
        title="Impact & Reports"
        subtitle="A concise report view for presentation, viva and stakeholder review."
      />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">CampusWatt impact report</h2>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700"
            >
              <FileText size={14} /> Print
            </button>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase text-slate-400">Current energy</p>
            <p className="mt-1 text-2xl font-bold">{formatMetric(metrics.totalEnergy)} kWh</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-400">Estimated cost</p>
            <p className="mt-1 text-2xl font-bold">₹{formatMetric(metrics.cost)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-slate-400">Carbon</p>
            <p className="mt-1 text-2xl font-bold">{formatMetric(metrics.carbon)} kg CO₂e</p>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
          <p className="text-sm font-bold">Wastage detected</p>
          <p className="mt-1 text-sm text-slate-500">
            {issues.length} potential patterns with estimated recommendations. All results are
            synthetic or manually entered and should be validated before operational use.
          </p>
        </div>
      </Card>
    </>
  )
}

/* ---------- Settings Panel (with Methodology) ---------- */

function SettingsPanel({ settings, setSettings }: any) {
  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings({ ...settings, [key]: Number(e.target.value) })
  return (
    <>
      <Title
        title="Settings"
        subtitle="Configurable assumptions used by every calculation in CampusWatt."
      />
      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['tariff', 'Electricity tariff (₹/kWh)'],
            ['emissionFactor', 'Emission factor (kg CO₂/kWh)'],
            ['operatingDays', 'Operating days/month'],
            ['lowUtilization', 'Low utilization threshold (%)'],
            ['idleThreshold', 'Idle threshold (%)'],
            ['oldAssetYears', 'Old asset threshold (years)'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input className={inputClass} type="number" min="0" value={settings[key]} onChange={update(key)} />
            </Field>
          ))}
        </div>
        <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          These are configurable assumptions for academic demonstration, not official college values.
        </p>
      </Card>

      <Card className="mt-5">
        <details>
          <summary className="cursor-pointer font-bold text-sm">
            📐 Calculation Methodology — How CampusWatt Calculates
          </summary>
          <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <strong>Energy (kWh):</strong> Power (W) × Quantity × Operating Hours ÷ 1000
            </div>
            <div>
              <strong>Monthly Energy:</strong> Daily Energy × Operating Days
            </div>
            <div>
              <strong>Cost (₹):</strong> Energy (kWh) × Tariff (₹/kWh)
            </div>
            <div>
              <strong>Carbon (kg CO₂e):</strong> Energy (kWh) × Emission Factor (kg CO₂/kWh)
            </div>
            <div>
              <strong>Potential Saving:</strong> Current Energy − Projected Energy
            </div>
            <div>
              <strong>PUE:</strong> Total Facility Energy ÷ IT Energy
            </div>
            <div>
              <strong>DCiE:</strong> IT Energy ÷ Total Facility Energy × 100
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <strong>Data Sources:</strong> DEMO (synthetic), USER INPUT (manual entry), COLLEGE
              DATA (imported from Supabase).
            </div>
            <div>
              <strong>Measured vs Estimated:</strong> If a meter reading exists, it takes precedence.
              Otherwise, energy is estimated from rated power × hours.
            </div>
          </div>
        </details>
      </Card>
    </>
  )
}

/* ---------- Reading Form Component ---------- */

function ReadingForm({ form, setForm, onSubmit, onCancel }: any) {
  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({
      ...form,
      [key]: ['powerWatts', 'quantity', 'operatingHours', 'utilization', 'activeHours', 'idleHours', 'age'].includes(
        key,
      )
        ? Number(e.target.value)
        : e.target.value,
    })

  return (
    <Card className="mt-4 border-emerald-200 dark:border-emerald-900">
      <form onSubmit={onSubmit}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold">Add Energy Reading</h3>
            <p className="mt-1 text-xs text-slate-400">
              Saved as USER INPUT and included in all calculations.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Building">
            <select className={inputClass} value={form.building} onChange={update('building')}>
              {buildings.map((b) => (
                <option key={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Room / Area">
            <input
              required
              className={inputClass}
              value={form.room}
              onChange={update('room')}
              placeholder="Computer Lab 1"
            />
          </Field>
          <Field label="Date">
            <input
              required
              type="date"
              className={inputClass}
              value={form.date}
              onChange={update('date')}
            />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={update('category')}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          {[
            ['asset', 'Equipment / Asset'],
            ['powerWatts', 'Rated Power (W)'],
            ['quantity', 'Number of Devices'],
            ['operatingHours', 'Operating Hours / Day'],
            ['utilization', 'Utilization (%)'],
            ['activeHours', 'Active Hours'],
            ['idleHours', 'Idle / Standby Hours'],
            ['age', 'Asset Age (years)'],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className={inputClass}
                type={key === 'asset' ? 'text' : 'number'}
                min="0"
                max={key === 'utilization' ? 100 : undefined}
                value={form[key]}
                onChange={update(key)}
              />
            </Field>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold dark:border-slate-700"
          >
            Cancel
          </button>
          <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white">
            Save reading
          </button>
        </div>
      </form>
    </Card>
  )
}