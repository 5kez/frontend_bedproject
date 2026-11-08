// In-browser stand-in for the MySQL database used by the demo build.
//
// Rows are stored with the real column names from db/init/01-schema.sql and
// seeded from the same fictional dataset as the self-hosted stack
// (backend db/seed/build-seed.mjs -> dataset.json). Every change is saved to
// localStorage, so a visitor's edits survive a reload until they press
// "reset demo data".
import dataset from './dataset.json'

export type Row = Record<string, unknown>
type Tables = Record<string, Row[]>

const STORAGE_KEY = 'smartbed-demo-db-v1'

function resolveDates(value: unknown, now: number): unknown {
  if (Array.isArray(value)) return value.map((v) => resolveDates(v, now))
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (typeof obj.$ago === 'number') return new Date(now - obj.$ago * 60_000).toISOString()
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) out[k] = resolveDates(v, now)
    return out
  }
  return value
}

function seedTables(): Tables {
  const tables = resolveDates(dataset.tables, Date.now()) as Tables
  // MySQL DATE columns come back as midnight timestamps
  for (const p of tables.patient ?? []) {
    if (typeof p.birthDate === 'string' && p.birthDate.length === 10) {
      p.birthDate = new Date(`${p.birthDate}T00:00:00`).toISOString()
    }
  }
  return tables
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

function load(): Tables {
  const ls = storage()
  try {
    const saved = ls?.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as Tables
  } catch {
    // corrupted or blocked storage: start fresh
  }
  return seedTables()
}

let tables: Tables = load()
let saveTimer: ReturnType<typeof setTimeout> | null = null

export function save(): void {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    try {
      storage()?.setItem(STORAGE_KEY, JSON.stringify(tables))
    } catch {
      // storage full or blocked: the demo keeps working in memory
    }
  }, 50)
}

export function resetDatabase(): void {
  tables = seedTables()
  try {
    storage()?.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function rows(table: string): Row[] {
  if (!tables[table]) tables[table] = []
  return tables[table]
}

export const PK: Record<string, string> = {
  province: 'province_id',
  sites_type: 'site_type_id',
  sites: 'site_id',
  building: 'building_id',
  floor: 'floor_id',
  departments: 'department_id',
  department_building: 'department_building_id',
  roles: 'role_id',
  profile: 'profile_id',
  user: 'user_id',
  sensor_type: 'sensor_type_id',
  master_status: 'id',
  sensor_template: 'sensor_template_id',
  patient: 'patient_id',
  bed: 'bed_id',
  bed_assignments: 'assignment_id',
  history_patient: 'history_id',
  sensor: 'sensor_id',
  sensor_profile: 'sensor_profile_id',
  bed_sensors: 'bed_sensor_id',
  notification_setting: 'id',
  history_notification: 'Id',
}

// entity property name -> column name, where they differ (mirrors the
// @PrimaryGeneratedColumn({ name }) / @Column({ name }) mappings in the entities)
export const COLUMN_OF: Record<string, Record<string, string>> = {
  sites_type: { id: 'site_type_id' },
  sites: { id: 'site_id' },
  building: { id: 'building_id' },
  floor: { id: 'floor_id' },
  departments: { id: 'department_id', name: 'department_name' },
  department_building: { id: 'department_building_id' },
  province: { id: 'province_id' },
  roles: { id: 'role_id', desc: 'description' },
  profile: { id: 'profile_id' },
  user: { id: 'user_id' },
  sensor_type: { id: 'sensor_type_id' },
  sensor_template: { id: 'sensor_template_id' },
  sensor_profile: { id: 'sensor_profile_id' },
  sensor: { id: 'sensor_id', desc: 'description', sensorType_Id: 'sensor_type_id' },
  patient: { created_date: 'created_at', updated_date: 'updated_at' },
  history_patient: { id: 'history_id' },
}

// columns that exist in the table but are not entity properties (relation FKs)
const HIDDEN: Record<string, string[]> = {
  floor: ['building_id'],
  sensor_profile: ['sensorId'],
  user: ['user_password', 'demo_password'],
}

// order in which TypeORM serialises properties (entity declaration order)
const ORDER: Record<string, string[]> = {
  sensor: [
    'id',
    'bed',
    'bed_id',
    'mac',
    'name',
    'desc',
    'hash',
    'site_Id',
    'sensorType_Id',
    'created_at',
    'updated_at',
  ],
}

/** Column row -> entity JSON (what TypeORM would serialise). */
export function entity(table: string, row: Row | undefined | null): Row | null {
  if (!row) return null
  const colOf = COLUMN_OF[table] ?? {}
  const propOf: Record<string, string> = {}
  for (const [prop, col] of Object.entries(colOf)) propOf[col] = prop
  const hidden = HIDDEN[table] ?? []
  const out: Row = {}
  for (const [col, value] of Object.entries(row)) {
    if (hidden.includes(col)) continue
    out[propOf[col] ?? col] = value
  }
  return out
}

/** Entity-shaped body (DTO) -> column row; unknown keys are dropped. */
export function toColumns(table: string, body: Row): Row {
  const colOf = COLUMN_OF[table] ?? {}
  const known = new Set(Object.keys(rows(table)[0] ?? {}))
  const out: Row = {}
  for (const [key, value] of Object.entries(body ?? {})) {
    const col = colOf[key] ?? key
    if (known.size === 0 || known.has(col)) out[col] = value
  }
  return out
}

export function orderKeys(table: string, obj: Row): Row {
  const order = ORDER[table]
  if (!order) return obj
  const out: Row = {}
  for (const k of order) if (k in obj) out[k] = obj[k]
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k]
  return out
}

export function nextId(table: string): number {
  const pk = PK[table]!
  return rows(table).reduce((m, r) => Math.max(m, Number(r[pk]) || 0), 0) + 1
}

export function findBy(table: string, col: string, value: unknown): Row | undefined {
  return rows(table).find((r) => r[col] == value)
}

export function byId(table: string, id: unknown): Row | undefined {
  return findBy(table, PK[table]!, id)
}

const nowIso = () => new Date().toISOString()

export function insert(table: string, body: Row, defaults: Row = {}): Row {
  const pk = PK[table]!
  const template = rows(table)[0] ?? {}
  const row: Row = {}
  for (const k of Object.keys(template)) row[k] = null
  Object.assign(row, defaults, toColumns(table, body))
  row[pk] = nextId(table)
  if ('created_at' in template && !row.created_at) row.created_at = nowIso()
  if ('updated_at' in template) row.updated_at = nowIso()
  rows(table).push(row)
  save()
  return row
}

export function update(table: string, id: unknown, body: Row): Row | undefined {
  const row = byId(table, id)
  if (!row) return undefined
  const cols = toColumns(table, body)
  delete cols[PK[table]!]
  Object.assign(row, cols)
  if ('updated_at' in row) row.updated_at = nowIso()
  save()
  return row
}

export function remove(table: string, predicate: (r: Row) => boolean): number {
  const list = rows(table)
  let removed = 0
  for (let i = list.length - 1; i >= 0; i--) {
    if (predicate(list[i]!)) {
      list.splice(i, 1)
      removed++
    }
  }
  if (removed) save()
  return removed
}

export function touch(row: Row): void {
  if ('updated_at' in row) row.updated_at = nowIso()
  save()
}

export const simulatorProfiles = dataset.simulator as {
  bed_id: number
  patient_id: number
  hr: number
  spo2: number
  restless: number
}[]
