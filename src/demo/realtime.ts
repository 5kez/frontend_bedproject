// In-browser stand-in for the backend's real-time path:
//   MqttService      -> per-patient vitals fed by the synthetic bed model
//   PatientGateway   -> emits 'patientVitalsUpdate' and raises sensor alerts
//   NotificationService / NotificationGateway -> in-memory alerts,
//                       'newNotification' / 'notificationConfirmed' / 'recheckSensorCondition'
// The alert rules are ported from backend src/notification/notification.service.ts.
import { byId, insert, nextId, rows, simulatorProfiles, type Row } from './db'
import { createBedState, step, type BedState } from './vitalsModel'

type Listener = (event: string, payload: unknown) => void
const listeners = new Set<Listener>()
export function onRealtime(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
function emit(event: string, payload: unknown) {
  for (const fn of listeners) fn(event, payload)
}

// ---------------------------------------------------------------- vitals ----
const SENSOR_NAME: Record<number, string> = { 1: 'BedSensor', 2: 'HeartRate', 3: 'SpO2' }
const bedStates = new Map<number, BedState>()
// patient_id -> sensor_type_id -> value (-1 = disconnected / no data)
const vitalMap = new Map<number, Map<number, number>>()

function profileFor(bedId: number) {
  const known = simulatorProfiles.find((p) => p.bed_id === bedId)
  if (known) return known
  return {
    bed_id: bedId,
    hr: 66 + ((bedId * 7) % 26),
    spo2: 94 + (bedId % 5),
    restless: [0.02, 0.05, 0.12][bedId % 3]!,
  }
}

/** MqttService.buildBindings(): which patient each installed sensor reports for. */
function bindings(): { pid: number; sid: number; bedId: number }[] {
  const out: { pid: number; sid: number; bedId: number }[] = []
  for (const s of rows('sensor')) {
    if (!s.mac || !s.bed_id) continue
    const bed = byId('bed', s.bed_id)
    if (!bed?.patient_id) continue
    const sid = Number(s.sensor_type_id) || 1
    if (!SENSOR_NAME[sid]) continue
    out.push({ pid: Number(bed.patient_id), sid, bedId: Number(bed.bed_id) })
  }
  return out
}

export function getVital(pid: number, sid: number): number {
  return vitalMap.get(pid)?.get(sid) ?? -1
}

function readSensors() {
  const binds = bindings()
  const seenBeds = new Set<number>()
  const fresh = new Map<number, Map<number, number>>()
  const readings = new Map<number, ReturnType<typeof step>>()
  for (const b of binds) {
    seenBeds.add(b.bedId)
    if (!bedStates.has(b.bedId)) bedStates.set(b.bedId, createBedState(profileFor(b.bedId)))
    if (!readings.has(b.bedId)) readings.set(b.bedId, step(bedStates.get(b.bedId)!))
    const r = readings.get(b.bedId)!
    const value = b.sid === 1 ? r.posture : b.sid === 2 ? r.heartRate : r.spo2
    if (!fresh.has(b.pid)) fresh.set(b.pid, new Map())
    fresh.get(b.pid)!.set(b.sid, value)
  }
  for (const id of bedStates.keys()) if (!seenBeds.has(id)) bedStates.delete(id)
  vitalMap.clear()
  for (const [k, v] of fresh) vitalMap.set(k, v)
}

// ---------------------------------------------------------- notifications ----
export interface NotificationItem {
  id: number
  patient_id: number
  patient_name: string
  sensor_type_id: number
  sensor_type_name: string
  message: string
  details?: string | undefined
  status: 'unread' | 'read' | 'dismissed'
  user_id?: number | undefined
  room_id?: number | undefined
  bed_id?: number | undefined
  metadata?: Record<string, unknown> | undefined
  created_at: string
  updated_at: string
}

let notifications: NotificationItem[] = []
let idCounter = 1
const nowIso = () => new Date().toISOString()

export const notificationStore = {
  all: () => [...notifications],
  byStatus: (status: string) => notifications.filter((n) => n.status === status),
  byPatient: (pid: number) => notifications.filter((n) => n.patient_id === pid),
  byUser: (uid: number) => notifications.filter((n) => n.user_id === uid),
  one: (id: number) => notifications.find((n) => n.id === id) ?? null,
  byDepartment(departmentId: number, status?: string) {
    return notifications.filter((n) => {
      if (status && n.status !== status) return false
      if (!n.bed_id || n.bed_id <= 0) return false
      const dept = n.metadata?.department_id
      return dept ? dept === departmentId : true
    })
  },
  unreadCount(userId?: number) {
    return notifications.filter((n) => n.status === 'unread' && (!userId || n.user_id === userId))
      .length
  },
  create(dto: Partial<NotificationItem>): NotificationItem {
    const n = {
      ...dto,
      id: idCounter++,
      status: dto.status ?? 'unread',
      created_at: nowIso(),
      updated_at: nowIso(),
    } as NotificationItem
    notifications.unshift(n)
    emit('newNotification', n)
    return n
  },
  setStatus(ids: number[], status: NotificationItem['status']) {
    for (const n of notifications) {
      if (ids.includes(n.id)) {
        n.status = status
        n.updated_at = nowIso()
      }
    }
  },
  markAll(userId?: number) {
    for (const n of notifications) {
      if (n.status === 'unread' && (!userId || n.user_id === userId)) {
        n.status = 'read'
        n.updated_at = nowIso()
      }
    }
  },
  update(id: number, dto: Partial<NotificationItem>) {
    const n = notifications.find((x) => x.id === id)
    if (n) Object.assign(n, dto, { updated_at: nowIso() })
  },
  remove(id: number) {
    notifications = notifications.filter((n) => n.id !== id)
  },
  clearOlderThan(hours: number) {
    const cutoff = Date.now() - hours * 3600_000
    notifications = notifications.filter((n) => Date.parse(n.created_at) > cutoff)
  },
  memoryInfo() {
    return {
      count: notifications.length,
      estimatedSizeKB: Math.round(JSON.stringify(notifications).length / 1024),
    }
  },
}

function findSetting(pid: number, sid: number): Row | undefined {
  return rows('notification_setting').find(
    (s) => Number(s.patient_id) === pid && Number(s.sensor_type_id) === sid,
  )
}

const DEFAULT_CONFIG: Record<number, Row> = {
  1: { alert_positions: [3, 4, 5] },
  2: { threshold_low: 60, threshold_high: 100 },
  3: { threshold_low: 90 },
}

function shouldAlert(value: number, setting: Row): boolean {
  if (value === -1) return true
  const cfg = (setting.config ?? {}) as Record<string, unknown>
  switch (Number(setting.sensor_type_id)) {
    case 1:
      return ((cfg.alert_positions as number[]) || [1, 5]).includes(value)
    case 2: {
      const lo = Number(cfg.threshold_low) || 60
      const hi = Number(cfg.threshold_high) || 100
      return value < lo || value > hi
    }
    case 3:
      return value < (Number(cfg.threshold_low) || 95)
    default:
      return true
  }
}

/** NotificationService.createSensorAlert() */
export function createSensorAlert(
  pid: number,
  patientName: string,
  sid: number,
  alertType: string,
  value: number,
  roomId?: number,
  bedId?: number,
  departmentId?: number,
): NotificationItem | null {
  const sensorName = SENSOR_NAME[sid] ?? 'Sensor'
  if (
    notifications.some(
      (n) => n.patient_id === pid && n.sensor_type_id === sid && n.status === 'unread',
    )
  )
    return null
  if (
    notifications.some(
      (n) =>
        n.patient_id === pid &&
        n.sensor_type_id === sid &&
        Date.now() - Date.parse(n.created_at) < 5000,
    )
  )
    return null

  let setting = findSetting(pid, sid)
  if (!setting) {
    setting = insert('notification_setting', {
      patient_id: pid,
      sensor_type_id: sid,
      enabled: 1,
      config: DEFAULT_CONFIG[sid],
    })
  }
  if (!setting.enabled) return null

  const patient = byId('patient', pid)
  const finalBed = bedId || (patient?.bed_id as number | undefined)
  const finalDept = departmentId || (patient?.department_id as number | undefined)
  if (!finalBed) return null
  if (!shouldAlert(value, setting)) return null

  const cfg = (setting.config ?? {}) as Record<string, number>
  let message = sensorName
  let details = ''
  if (value === -1) {
    details = 'หลุดการเชื่อมต่อ'
  } else if (sid === 1) {
    details = `ตำแหน่ง: ${value}, การแจ้งเตือน: ${alertType}`
  } else if (sid === 2) {
    const lo = cfg.threshold_low ?? 60
    const hi = cfg.threshold_high ?? 100
    details =
      value < lo
        ? `อัตราการเต้นของหัวใจ: ${value} bpm (ต่ำกว่า ${lo} bpm)`
        : `อัตราการเต้นของหัวใจ: ${value} bpm (สูงกว่า ${hi} bpm)`
  } else if (sid === 3) {
    details = `ระดับออกซิเจนในเลือด: ${value}% (ต่ำกว่า ${cfg.threshold_low ?? 90}%)`
  } else {
    message = sensorName
    details = `ค่า: ${JSON.stringify(value)}, ${alertType}`
  }

  return notificationStore.create({
    patient_id: pid,
    patient_name: patientName,
    sensor_type_id: sid,
    sensor_type_name: sensorName,
    message,
    details,
    room_id: roomId,
    bed_id: finalBed,
    metadata: {
      alertType,
      sensorValue: value,
      threshold: { threshold_low: cfg.threshold_low, threshold_high: cfg.threshold_high },
      timestamp: nowIso(),
      setting_id: setting.id,
      department_id: finalDept,
    },
  })
}

function cancelSensorAlert(pid: number, sid: number) {
  const n = notifications.find(
    (x) => x.patient_id === pid && x.sensor_type_id === sid && x.status === 'unread',
  )
  if (n) {
    n.status = 'read'
    n.updated_at = nowIso()
    emit('newNotification', n)
  }
}

/** NotificationService.confirmNotification() */
export function confirmNotification(
  id: number,
  userId?: number,
): { success: boolean; message: string } {
  const n = notifications.find((x) => x.id === id)
  if (!n) return { success: false, message: 'Notification not found' }
  const patient = byId('patient', n.patient_id)
  insert('history_notification', {
    Patient_Id: n.patient_id,
    Noti_time: nowIso(),
    Noti_type: n.sensor_type_name,
    Noti_desc: n.details || n.message,
    Noti_id: n.id,
    Noti_setting_id: (n.metadata?.setting_id as number) || 0,
    Status: 1,
    Sensor_id: n.sensor_type_id,
    Sensor_type: n.sensor_type_name,
    Device_id: '',
    User_id: userId || n.user_id || 0,
    Patient_indate: nowIso(),
    Patient_remark: n.details || '',
    Patient_department: '',
    Patient_room_num: 0,
  })
  void patient
  notificationStore.remove(id)
  emit('notificationConfirmed', {
    patient_id: n.patient_id,
    sensor_type_id: n.sensor_type_id,
    timestamp: nowIso(),
  })
  emit('recheckSensorCondition', { patient_id: n.patient_id, sensor_type_id: n.sensor_type_id })
  // condition still there? raise it again, like the backend's recheck
  setTimeout(() => {
    const setting = findSetting(n.patient_id, n.sensor_type_id)
    const value = getVital(n.patient_id, n.sensor_type_id)
    if (setting && setting.enabled && shouldAlert(value, setting)) {
      createSensorAlert(
        n.patient_id,
        n.patient_name,
        n.sensor_type_id,
        'persistent_condition',
        value,
        undefined,
        n.bed_id,
      )
    }
  }, 2500)
  return { success: true, message: 'Notification confirmed and saved to history' }
}

// ---------------------------------------------------------------- gateway ----
const lastVitals = new Map<number, { position: number; heartRate: number; oxygen: number }>()
const ALERT_TYPE: Record<number, string> = {
  1: 'position_check',
  2: 'heartrate_check',
  3: 'oxygen_check',
}

export function vitalsSnapshot() {
  return rows('patient').map((p) => {
    const pid = Number(p.patient_id)
    return {
      id: pid,
      status: p.status,
      position: getVital(pid, 1),
      heartRate: getVital(pid, 2),
      oxygen: getVital(pid, 3),
    }
  })
}

function tick() {
  readSensors()
  for (const p of rows('patient')) {
    const pid = Number(p.patient_id)
    const bed = rows('bed').find((b) => Number(b.patient_id) === pid)
    if (!bed) continue
    const cur = {
      position: getVital(pid, 1),
      heartRate: getVital(pid, 2),
      oxygen: getVital(pid, 3),
    }
    const last = lastVitals.get(pid)
    const channels: [number, 'position' | 'heartRate' | 'oxygen'][] = [
      [1, 'position'],
      [2, 'heartRate'],
      [3, 'oxygen'],
    ]
    for (const [sid, key] of channels) {
      if (last && last[key] === cur[key]) continue
      if (!vitalMap.get(pid)?.has(sid)) continue // no sensor of this type on the bed
      const v = cur[key]
      const dept = sid === 1 ? Number(p.department_id) : undefined
      if (v === -1) {
        if (!last || last[key] !== -1) {
          createSensorAlert(
            pid,
            String(p.name),
            sid,
            'connection_lost',
            -1,
            Number(p.room_id),
            Number(bed.bed_id),
            dept,
          )
        }
      } else {
        if (last && last[key] === -1) cancelSensorAlert(pid, sid)
        createSensorAlert(
          pid,
          String(p.name),
          sid,
          ALERT_TYPE[sid]!,
          v,
          Number(p.room_id),
          Number(bed.bed_id),
          dept,
        )
      }
    }
    lastVitals.set(pid, cur)
  }
  emit('patientVitalsUpdate', vitalsSnapshot())
}

let timer: ReturnType<typeof setInterval> | null = null
export function startRealtime(intervalMs = 2500): void {
  if (timer) return
  readSensors()
  timer = setInterval(tick, intervalMs)
}

export function resetRealtime(): void {
  notifications = []
  idCounter = 1
  lastVitals.clear()
  bedStates.clear()
  vitalMap.clear()
  readSensors()
}

export { nextId }
