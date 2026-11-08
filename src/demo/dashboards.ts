/* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions -- demo rows are untyped DB records (Record<string, unknown>) holding scalars */
// JavaScript ports of the dashboard SQL in backend src/dashboard/*.service.ts.
// Dates are bucketed in the visitor's local time zone, the way MySQL's
// CURDATE()/DATE() work in the server's time zone.
import { byId, findBy, rows, type Row } from './db'

const DAY_MS = 86_400_000
const n = (v: unknown) => Number(v)
const pad = (v: number) => String(v).padStart(2, '0')
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
const hourKey = (d: Date) => `${dayKey(d)} ${pad(d.getHours())}:00`
const startOfToday = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}
const daysAgo = (k: number) => {
  const d = startOfToday()
  d.setDate(d.getDate() - k)
  return d
}
const date = (v: unknown) => new Date(String(v))

interface Scope {
  siteId: number
  departmentId?: number | undefined
  buildingId?: number | undefined
}
function scopeFor(q: URLSearchParams): { user: Row; scope: Scope; siteWide: boolean } | null {
  const user = findBy('user', 'user_name', q.get('username') ?? '')
  if (!user) return null
  const siteWide = q.get('siteWide') === 'true'
  return {
    user,
    siteWide,
    scope: {
      siteId: n(user.site_id),
      departmentId: !siteWide && user.department_id ? n(user.department_id) : undefined,
      buildingId: !siteWide && user.build_id ? n(user.build_id) : undefined,
    },
  }
}

/** p / db / bl join chain used by the raw queries (patient -> bed -> ward -> building). */
function patientArea(p: Row) {
  const bed = byId('bed', p.bed_id)
  const ward = bed ? byId('department_building', bed.department_building_id) : undefined
  return { bed, ward, buildingId: ward ? n(ward.building_id) : null }
}
function inRawScope(p: Row, s: Scope): boolean {
  if (n(p.site_id) !== s.siteId) return false
  if (s.departmentId && n(p.department_id) !== s.departmentId) return false
  if (s.buildingId) {
    const b = patientArea(p).buildingId
    if (b !== null && b !== s.buildingId) return false
  }
  return true
}

const AGE_BANDS: [number, number, string][] = [
  [0, 17, '0-17'],
  [18, 29, '18-29'],
  [30, 44, '30-44'],
  [45, 59, '45-59'],
  [60, 74, '60-74'],
]
function ageBand(birth: unknown): string {
  if (!birth) return 'ไม่ทราบ'
  const b = date(birth)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  if (
    now.getMonth() < b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())
  )
    age--
  return AGE_BANDS.find(([lo, hi]) => age >= lo && age <= hi)?.[2] ?? '75+'
}

function dateSeries(days: number): Date[] {
  const out: Date[] = []
  for (let k = days; k >= 0; k--) out.push(daysAgo(k))
  return out
}

export const nurseDashboard = {
  stats(q: URLSearchParams) {
    const ctx = scopeFor(q)
    if (!ctx)
      return {
        patientCount: 0,
        availableBeds: 0,
        totalBeds: 0,
        notifications: 0,
        completedPatients: 0,
      }
    const s = ctx.scope
    const patients = rows('patient').filter(
      (p) =>
        n(p.site_id) === s.siteId && (!s.departmentId || n(p.department_id) === s.departmentId),
    )
    const beds = rows('bed').filter((b) => {
      const ward = byId('department_building', b.department_building_id)
      const bl = ward ? byId('building', ward.building_id) : undefined
      if (!bl || n(bl.site_id) !== s.siteId) return false
      if (s.buildingId && n(bl.building_id) !== s.buildingId) return false
      if (s.departmentId && n(ward!.department_id) !== s.departmentId) return false
      return true
    })
    const notifications = rows('history_notification').filter((h) => {
      const p = byId('patient', h.Patient_Id)
      if (!p || n(p.site_id) !== s.siteId) return false
      if (s.departmentId && n(p.department_id) !== s.departmentId) return false
      if (s.buildingId && patientArea(p).buildingId !== s.buildingId) return false
      return true
    }).length
    return {
      patientCount: patients.filter((p) => n(p.status) === 1).length,
      availableBeds: beds.filter((b) => !b.patient_id).length,
      totalBeds: beds.length,
      notifications,
      completedPatients: patients.filter((p) => n(p.status) !== 1).length,
    }
  },

  gender(q: URLSearchParams) {
    const ctx = scopeFor(q)
    if (!ctx) return []
    const s = ctx.scope
    const counts = new Map<string, number>()
    for (const p of rows('patient')) {
      if (n(p.status) !== 1 || n(p.site_id) !== s.siteId) continue
      if (s.departmentId && n(p.department_id) !== s.departmentId) continue
      const label = p.sex === 'M' ? 'ชาย' : p.sex === 'F' ? 'หญิง' : 'ไม่ระบุ'
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    return [...counts].map(([gender_label, patient]) => ({ gender_label, patient }))
  },

  ageGroups(q: URLSearchParams) {
    const ctx = scopeFor(q)
    if (!ctx) return []
    const s = ctx.scope
    const groups = new Map<
      string,
      { department_name?: string; age_band: string; patients: number }
    >()
    for (const p of rows('patient')) {
      if (n(p.status) !== 1 || n(p.site_id) !== s.siteId) continue
      if (s.departmentId && n(p.department_id) !== s.departmentId) continue
      const band = ageBand(p.birthDate)
      if (ctx.siteWide) {
        const g = groups.get(band) ?? { age_band: band, patients: 0 }
        g.patients++
        groups.set(band, g)
      } else {
        const dept = byId('departments', p.department_id)
        if (!dept) continue
        const key = `${dept.department_name}|${band}`
        const g = groups.get(key) ?? {
          department_name: String(dept.department_name),
          age_band: band,
          patients: 0,
        }
        g.patients++
        groups.set(key, g)
      }
    }
    return [...groups.values()].map((g) => ({ ...g, patients: String(g.patients) }))
  },

  admitTrend(q: URLSearchParams) {
    const ctx = scopeFor(q)
    if (!ctx) return []
    const days = Number(q.get('days')) || 30
    const counts = new Map<string, number>()
    const from = daysAgo(days).getTime()
    for (const h of rows('history_patient')) {
      const p = byId('patient', h.patient_id)
      if (!p || !inRawScope(p, ctx.scope)) continue
      const t = date(h.in_date)
      if (t.getTime() < from || t.getTime() >= startOfToday().getTime() + DAY_MS) continue
      counts.set(dayKey(t), (counts.get(dayKey(t)) ?? 0) + 1)
    }
    return dateSeries(days).map((d) => ({
      date: d.toISOString(),
      cnt: String(counts.get(dayKey(d)) ?? 0),
    }))
  },

  inOutTrend(q: URLSearchParams) {
    const ctx = scopeFor(q)
    if (!ctx) return { labels: [], series: { Admit: [], Discharge: [] } }
    const wardId = Number(q.get('dept_building_id')) || 0
    let ward: Row | undefined
    if (!ctx.siteWide && wardId > 0) {
      ward = byId('department_building', wardId)
      if (!ward) return { labels: [], series: { Admit: [], Discharge: [] } }
    }
    const matches = (p: Row) => {
      if (!inRawScope(p, ctx.scope)) return false
      if (!ward) return true
      const area = patientArea(p)
      if (area.ward) return n(area.ward.department_building_id) === wardId
      return (
        n(p.department_id) === n(ward.department_id) &&
        (ward.floor_id == null || n(p.floor_id) === n(ward.floor_id))
      )
    }
    const from = daysAgo(30).getTime()
    const to = startOfToday().getTime() + DAY_MS
    const admits = new Map<string, number>()
    const discharges = new Map<string, number>()
    for (const h of rows('history_patient')) {
      const p = byId('patient', h.patient_id)
      if (!p || !matches(p)) continue
      const i = date(h.in_date)
      if (i.getTime() >= from && i.getTime() < to)
        admits.set(dayKey(i), (admits.get(dayKey(i)) ?? 0) + 1)
      if (h.out_date) {
        const o = date(h.out_date)
        if (o.getTime() >= from && o.getTime() < to)
          discharges.set(dayKey(o), (discharges.get(dayKey(o)) ?? 0) + 1)
      }
    }
    const days = dateSeries(30)
    return {
      labels: days.map((d) => d.toISOString()),
      series: {
        Admit: days.map((d) => admits.get(dayKey(d)) ?? 0),
        Discharge: days.map((d) => discharges.get(dayKey(d)) ?? 0),
      },
    }
  },

  alertTrend(q: URLSearchParams) {
    const user = findBy('user', 'user_name', q.get('username') ?? '')
    if (!user) return []
    const siteMode = q.get('siteWide') === 'true'
    const from = daysAgo(30).getTime()
    const to = startOfToday().getTime() + DAY_MS
    // date -> bed -> sensor -> count
    const buckets = new Map<string, Map<number, Map<string, number>>>()
    for (const h of rows('history_notification')) {
      const t = date(h.Noti_time)
      if (t.getTime() < from || t.getTime() >= to) continue
      const bed = rows('bed').find((b) => b.patient_id == h.Patient_Id)
      if (!bed) continue
      const ward = byId('department_building', bed.department_building_id)
      const bl = ward ? byId('building', ward.building_id) : undefined
      if (!ward || !bl || n(bl.site_id) !== n(user.site_id)) continue
      if (!siteMode) {
        if (user.department_id && n(ward.department_id) !== n(user.department_id)) continue
        if (user.floor_id && n(ward.floor_id) !== n(user.floor_id)) continue
        if (user.build_id && n(bl.building_id) !== n(user.build_id)) continue
      }
      const d = dayKey(t)
      if (!buckets.has(d)) buckets.set(d, new Map())
      const byBed = buckets.get(d)!
      if (!byBed.has(n(bed.bed_id))) byBed.set(n(bed.bed_id), new Map())
      const bySensor = byBed.get(n(bed.bed_id))!
      const type = String(h.Sensor_type)
      bySensor.set(type, (bySensor.get(type) ?? 0) + 1)
    }
    const out: Row[] = []
    for (const d of [...buckets.keys()].sort()) {
      const byBed = buckets.get(d)!
      for (const bedId of [...byBed.keys()].sort((a, b) => a - b)) {
        const bySensor = [...byBed.get(bedId)!].sort((a, b) => b[1] - a[1])
        const total = bySensor.reduce((s, [, c]) => s + c, 0)
        out.push({
          alert_date: new Date(`${d}T00:00:00`).toISOString(),
          bed_name: `เตียง ${bedId}`,
          top_sensor: bySensor[0]![0],
          top_sensor_alerts: String(bySensor[0]![1]),
          total_alerts: String(total),
        })
      }
    }
    return out
  },

  avgStayTrend(q: URLSearchParams) {
    const ctx = scopeFor(q)
    if (!ctx) return []
    const months = new Map<string, number[]>()
    for (const h of rows('history_patient')) {
      if (!h.out_date) continue
      const p = byId('patient', h.patient_id)
      if (!p || !inRawScope(p, ctx.scope)) continue
      const i = date(h.in_date)
      const o = date(h.out_date)
      const inDay = new Date(i.getFullYear(), i.getMonth(), i.getDate()).getTime()
      const outDay = new Date(o.getFullYear(), o.getMonth(), o.getDate()).getTime()
      const k = monthKey(i)
      if (!months.has(k)) months.set(k, [])
      months.get(k)!.push(Math.round((outDay - inDay) / DAY_MS))
    }
    return [...months.keys()].sort().map((month) => {
      const v = months.get(month)!
      return {
        month,
        avgStayDays: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100,
      }
    })
  },
}

// ----------------------------------------------------------------- admin ----
function normalizeType(raw: unknown): string {
  const k = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (k === 'spo2' || k === 'sp02' || k === 'spo₂') return 'SpO2'
  if (k === 'bedsensor' || k === 'bed') return 'BedSensor'
  if (k === 'heartrate' || k === 'hr' || k === 'heart rate') return 'HeartRate'
  if (!k) return 'Unknown'
  const s = String(raw)
  return s[0]!.toUpperCase() + s.slice(1)
}

/** history rows joined to a patient that currently has a bed (INNER JOIN bed b ON b.bed_id = p.bed_id) */
function alertsWithWard(q: URLSearchParams, start: string, end: string) {
  const wardId = Number(q.get('dept_building_id')) || 0
  const from = new Date(`${start}T00:00:00`).getTime()
  const to = new Date(`${end}T00:00:00`).getTime()
  return rows('history_notification').filter((h) => {
    const t = date(h.Noti_time).getTime()
    if (t < from || t >= to) return false
    const p = byId('patient', h.Patient_Id)
    const bed = p ? byId('bed', p.bed_id) : undefined
    if (!bed) return false
    return !(wardId > 0 && n(bed.department_building_id) !== wardId)
  })
}

function defaultRange(q: URLSearchParams) {
  const past = new Date()
  past.setDate(past.getDate() - 7)
  const tomorrow = startOfToday()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return {
    startDate: q.get('start_date') || dayKey(past),
    endDate: q.get('end_date') || dayKey(tomorrow),
  }
}

export const adminDashboard = {
  stats() {
    return {
      patientCount: rows('patient').length,
      sensorsOnline: rows('sensor').filter((s) => s.bed_id).length,
      totalSensors: rows('sensor').length,
      usersCount: rows('user').length,
      notificationsCount: rows('history_notification').length,
    }
  },

  sensorPie() {
    const assigned = rows('sensor').filter((s) => s.bed_id).length
    return { assigned, unassigned: rows('sensor').length - assigned }
  },

  perDay(days: number) {
    const from = daysAgo(days).getTime()
    const labels: string[] = []
    for (let i = days; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      labels.push(d.toISOString().slice(0, 10))
    }
    const counts = new Map<string, Map<string, number>>()
    for (const h of rows('history_notification')) {
      const t = date(h.Noti_time)
      if (t.getTime() < from) continue
      const type = normalizeType(h.Noti_type)
      if (!counts.has(type)) counts.set(type, new Map())
      counts.get(type)!.set(dayKey(t), (counts.get(type)!.get(dayKey(t)) ?? 0) + 1)
    }
    const series: Record<string, number[]> = {}
    for (const type of [...counts.keys()].sort())
      series[type] = labels.map((l) => counts.get(type)!.get(l) ?? 0)
    return { labels, series }
  },

  perHour(days: number) {
    const from = daysAgo(days).getTime()
    const counts = new Map<string, Map<string, number>>()
    const labelSet = new Set<string>()
    for (const h of rows('history_notification')) {
      const t = date(h.Noti_time)
      if (t.getTime() < from) continue
      const type = normalizeType(h.Noti_type)
      const k = hourKey(t)
      labelSet.add(k)
      if (!counts.has(type)) counts.set(type, new Map())
      counts.get(type)!.set(k, (counts.get(type)!.get(k) ?? 0) + 1)
    }
    const labels = [...labelSet].sort()
    const series: Record<string, number[]> = {}
    for (const type of [...counts.keys()].sort())
      series[type] = labels.map((l) => counts.get(type)!.get(l) ?? 0)
    return { labels, series }
  },

  categories(q: URLSearchParams) {
    const { startDate, endDate } = defaultRange(q)
    const counts = new Map<string, number>()
    for (const h of alertsWithWard(q, startDate, endDate)) {
      const desc = String(h.Noti_desc ?? '')
      const cat = desc.includes('หลุดการเชื่อมต่อ')
        ? 'Disconnect'
        : String(h.Noti_type ?? '').trim()
          ? String(h.Noti_type)
          : 'Other'
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    const sorted = [...counts].sort((a, b) => b[1] - a[1])
    return {
      labels: sorted.map(([k]) => normalizeType(k)),
      values: sorted.map(([, v]) => v),
      total: sorted.reduce((s, [, v]) => s + v, 0),
      startDate,
      endDate,
    }
  },

  signals(q: URLSearchParams) {
    const { startDate, endDate } = defaultRange(q)
    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T00:00:00`)
    let granularity = q.get('granularity') as 'hour' | 'day' | 'month' | 'year' | null
    if (!granularity || !['hour', 'day', 'month', 'year'].includes(granularity)) {
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / DAY_MS)
      const monthsDiff =
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      granularity = 'day'
      if (diffDays > 30) granularity = 'month'
      if (monthsDiff > 12) granularity = 'year'
    }
    const fmt = {
      hour: hourKey,
      day: dayKey,
      month: monthKey,
      year: (d: Date) => String(d.getFullYear()),
    }[granularity]
    const labels: string[] = []
    const cursor = new Date(start)
    if (granularity === 'month') cursor.setDate(1)
    if (granularity === 'year') cursor.setMonth(0, 1)
    while (cursor < end) {
      labels.push(fmt(cursor))
      if (granularity === 'hour') cursor.setHours(cursor.getHours() + 1)
      else if (granularity === 'day') cursor.setDate(cursor.getDate() + 1)
      else if (granularity === 'month') cursor.setMonth(cursor.getMonth() + 1)
      else cursor.setFullYear(cursor.getFullYear() + 1)
    }
    const primary = ['HeartRate', 'SpO2', 'BedSensor']
    const series: Record<string, number[]> = {}
    const totals: Record<string, number> = {}
    for (const t of [...primary, 'Other']) {
      series[t] = labels.map(() => 0)
      totals[t] = 0
    }
    const index = new Map(labels.map((l, i) => [l, i]))
    for (const h of alertsWithWard(q, startDate, endDate)) {
      const idx = index.get(fmt(date(h.Noti_time)))
      if (idx === undefined) continue
      const norm = normalizeType(h.Noti_type)
      const type = primary.includes(norm) ? norm : 'Other'
      series[type]![idx]!++
      totals[type]!++
    }
    if (!totals.Other) {
      delete series.Other
      delete totals.Other
    }
    return { labels, series, totals, startDate, endDate, granularity }
  },

  usageTrend(q: URLSearchParams) {
    const months = Math.min(Math.max(Number(q.get('months')) || 12, 1), 24)
    const wardId = Number(q.get('dept_building_id')) || 0
    const labels: string[] = []
    const first = new Date()
    first.setDate(1)
    first.setMonth(first.getMonth() - (months - 1))
    for (let i = 0; i < months; i++) {
      const d = new Date(first.getFullYear(), first.getMonth() + i, 1)
      labels.push(monthKey(d))
    }
    const since = new Date()
    since.setHours(0, 0, 0, 0)
    since.setMonth(since.getMonth() - months)
    const series = {
      Installations: labels.map(() => 0),
      Maintenances: labels.map(() => 0),
      Issues: labels.map(() => 0),
    }
    const bump = (key: keyof typeof series, v: unknown) => {
      if (!v) return
      const d = date(v)
      if (d < since) return
      const idx = labels.indexOf(monthKey(d))
      if (idx >= 0) series[key][idx]!++
    }
    for (const bs of rows('bed_sensors')) {
      const bed = byId('bed', bs.bed_id)
      if (!bed) continue
      if (wardId && n(bed.department_building_id) !== wardId) continue
      bump('Installations', bs.installation_date)
      bump('Maintenances', bs.last_maintenance)
      if (['inactive', 'maintenance', 'error'].includes(String(bs.status)))
        bump('Issues', bs.updated_at)
    }
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
    return {
      labels,
      series,
      totals: {
        Installations: sum(series.Installations),
        Maintenances: sum(series.Maintenances),
        Issues: sum(series.Issues),
      },
      months,
    }
  },
}
