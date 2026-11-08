/* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions -- demo rows are untyped DB records (Record<string, unknown>) holding scalars */
// In-browser port of the NestJS REST API for the demo build.
//
// Routes are declared in the same order Nest registers them (first match
// wins), and each handler mirrors the corresponding backend service so the
// pages receive the same JSON shapes as from the real API. Data lives in
// ./db.ts (localStorage-backed); alerts and vitals live in ./realtime.ts.
import {
  byId,
  entity,
  findBy,
  insert,
  orderKeys,
  remove,
  rows,
  save,
  touch,
  update,
  type Row,
} from './db'
import {
  confirmNotification,
  createSensorAlert,
  getVital,
  notificationStore,
  vitalsSnapshot,
} from './realtime'
import { answerChat, summarizePatient } from './assistant'
import { adminDashboard, nurseDashboard } from './dashboards'

export interface DemoRequest {
  method: string
  path: string
  query: URLSearchParams
  body: Row
  files: Record<string, string> // field name -> data URL
}
export interface DemoResponse {
  status: number
  data: unknown
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message)
  }
}
// same message the backend's exception filter returns for FK violations
const IN_USE = 'ไม่สามารถลบได้ เนื่องจากยังมีข้อมูลอื่นเชื่อมโยงอยู่'
const notFound = (msg: string) => new HttpError(404, msg)
const badRequest = (msg: string) => new HttpError(400, msg)

type Params = Record<string, string>
type Handler = (req: DemoRequest, p: Params) => unknown
const routes: { method: string; parts: string[]; handler: Handler; status?: number | undefined }[] =
  []
function route(method: string, path: string, handler: Handler, status?: number) {
  routes.push({ method, parts: path.split('/').filter(Boolean), handler, status })
}

const n = (v: unknown) => Number(v)
const nowIso = () => new Date().toISOString()

// ------------------------------------------------------------ entity views ----
const E = {
  patient: (r: Row | undefined) => entity('patient', r),
  building: (r: Row | undefined) => entity('building', r),
  floor: (r: Row | undefined) => entity('floor', r),
  department: (r: Row | undefined) => entity('departments', r),
  user: (r: Row | undefined) => entity('user', r),
  sensorType: (r: Row | undefined) => entity('sensor_type', r),
  sensor: (r: Row | undefined) => (r ? orderKeys('sensor', entity('sensor', r)!) : null),
  deptBuilding(
    r: Row | undefined,
    opts: { floor?: boolean | undefined; eager?: boolean | undefined } = {},
  ) {
    if (!r) return null
    const out = entity('department_building', r)!
    if (opts.eager !== false) {
      out.department = E.department(byId('departments', r.department_id))
      out.building = E.building(byId('building', r.building_id))
    }
    if (opts.floor) out.floor = E.floor(byId('floor', r.floor_id))
    return out
  },
  bed(
    r: Row | undefined,
    opts: {
      floor?: boolean | undefined
      sensors?: boolean | undefined
      dbEager?: boolean | undefined
    } = {},
  ) {
    if (!r) return null
    const out: Row = { ...r }
    out.departmentBuilding = E.deptBuilding(byId('department_building', r.department_building_id), {
      floor: opts.floor,
      eager: opts.dbEager !== false,
    })
    out.patient = r.patient_id ? E.patient(byId('patient', r.patient_id)) : null
    if (opts.sensors)
      out.sensors = rows('sensor')
        .filter((s) => s.bed_id == r.bed_id)
        .map((s) => E.sensor(s))
    return out
  },
  patientWithBed(r: Row, extra: { department?: boolean; eagerBed?: boolean } = {}) {
    const out = E.patient(r)!
    const bed = rows('bed').find((b) => b.patient_id == r.patient_id)
    // find({ relations: ['bed'] }) also pulls the bed's eager relations;
    // query-builder endpoints return the bare bed row
    out.bed = bed ? (extra.eagerBed ? E.bed(bed, { dbEager: false }) : { ...bed }) : null
    if (extra.department) out.department = E.department(byId('departments', r.department_id))
    return out
  },
  setting(r: Row | undefined) {
    if (!r) return null
    return {
      ...r,
      patient: E.patient(byId('patient', r.patient_id)),
      sensorType: E.sensorType(byId('sensor_type', r.sensor_type_id)),
    }
  },
  assignment(r: Row, rel: { patient?: boolean; bed?: boolean }) {
    const out: Row = { ...r }
    if (rel.patient) out.patient = E.patient(byId('patient', r.patient_id))
    if (rel.bed) out.bed = E.bed(byId('bed', r.bed_id), { dbEager: false })
    out.assignedByUser = E.user(byId('user', r.assigned_by))
    return out
  },
}

function userPublic(r: Row | undefined) {
  if (!r) return null
  const u = E.user(r)!
  delete u.floor_id // getAllUsers / getUserById select list has no floor_id
  return u
}

function mustFind(table: string, id: unknown, label = table): Row {
  const r = byId(table, id)
  if (!r) throw notFound(`${label} #${id} not found`)
  return r
}

// ------------------------------------------------------------------- auth ----
route(
  'POST',
  '/auth/login',
  (req) => {
    const username = String(req.body.username ?? '')
    const password = String(req.body.password ?? '')
    const user = findBy('user', 'user_name', username)
    if (!user)
      throw new HttpError(401, 'Invalid credentials', {
        status: 401,
        errorType: 'invalid_credentials',
        message: 'Invalid credentials',
      })
    if (!user.status || ['0', 'false'].includes(String(user.status))) {
      throw new HttpError(403, 'User is inactive', {
        status: 403,
        errorType: 403,
        message: 'User is inactive',
      })
    }
    // demo accounts all use "demo1234"; accounts created in the demo keep the password typed in the form
    const expected = user.demo_password ?? 'demo1234'
    if (password !== expected)
      throw new HttpError(401, 'Invalid password', {
        status: 401,
        errorType: 401,
        message: 'Invalid password',
      })
    const data = {
      id: user.user_id,
      profile_id: user.profile_id,
      site_id: user.site_id,
      user_name: user.user_name,
      name: user.name,
      last_name: user.last_name,
      build_id: user.build_id,
      status: user.status,
      role_id: user.role_id,
      roles_code: user.roles_code,
      department_id: user.department_id,
    }
    return { access_token: `demo.${btoa(String(user.user_id))}.token`, data }
  },
  200,
)
route('GET', '/auth/profile', () => ({ sub: 1, user_name: 'demo' }))

// ------------------------------------------------------------------ users ----
route('GET', '/users', () => rows('user').map(userPublic))
route('GET', '/users/:id', (_r, p) => userPublic(byId('user', p.id)))
route('GET', '/users/site/:site_id', (_r, p) => {
  const list = rows('user').filter(
    (u) => u.site_id == p.site_id && [1, 4, 5].includes(n(u.role_id)),
  )
  return list.length ? list.map((u) => E.user(u)) : null
})
route('GET', '/users/staff/:site_id', (_r, p) => {
  const list = rows('user').filter((u) => u.site_id == p.site_id && [1, 4].includes(n(u.role_id)))
  return list.length ? list.map((u) => E.user(u)) : null
})
route(
  'POST',
  '/users',
  (req) => {
    const { user_password, ...rest } = req.body
    const row = insert('user', rest, { status: '1', floor_id: 0 })
    if (user_password) row.demo_password = String(user_password)
    save()
    return userPublic(row)
  },
  201,
)
route('PATCH', '/users/:id', (req, p) => {
  const { user_password, ...rest } = req.body
  const row = mustFind('user', p.id, 'User')
  update('user', p.id, rest)
  if (user_password) {
    row.demo_password = String(user_password)
    save()
  }
  return { generatedMaps: [], raw: [], affected: 1 }
})
route('DELETE', '/users/:id', (_r, p) => {
  const row = mustFind('user', p.id, 'User')
  remove('user', (u) => u === row)
  return userPublic(row)
})

route('GET', '/', () => 'Hello World!')

// ---------------------------------------------------------------- patient ----
route('GET', '/patient', () => rows('patient').map((p) => E.patientWithBed(p, { eagerBed: true })))
route('GET', '/patient/:id', (_r, p) => {
  const row = byId('patient', p.id)
  if (!row) throw notFound(`Patient with id ${p.id} not found`)
  return E.patient(row)
})
route('GET', '/patient/site/:site_id', (_r, p) =>
  rows('patient')
    .filter((x) => x.site_id == p.site_id)
    .map((x) => E.patient(x)),
)
route('GET', '/patient/active/case', () =>
  rows('patient')
    .filter((x) => n(x.status) === 1 && rows('bed').some((b) => b.patient_id == x.patient_id))
    .map((x) => E.patientWithBed(x)),
)
route('GET', '/patient/floor/:floor_id', (_r, p) =>
  rows('patient')
    .filter((x) => x.floor_id == p.floor_id)
    .map((x) => E.patient(x)),
)
route(
  'POST',
  '/patient',
  (req) => {
    const row = insert('patient', req.body, {
      status: 1,
      image: '',
      remark: '',
      telFam: '',
      thaiId: '',
      sex: '',
      bed_id: null,
    })
    for (const st of rows('sensor_type')) {
      const sid = n(st.sensor_type_id)
      insert('notification_setting', {
        patient_id: row.patient_id,
        sensor_type_id: sid,
        enabled: 1,
        config:
          sid === 1
            ? { alert_positions: [3, 4, 5] }
            : sid === 2
              ? { threshold_low: 60, threshold_high: 100 }
              : sid === 3
                ? { threshold_low: 90 }
                : { threshold: { min: 0, max: 100 } },
      })
    }
    insert('history_patient', {
      patient_id: row.patient_id,
      sensors_id: null,
      in_date: nowIso(),
      out_date: null,
      remark: '',
      status: '0',
      create_user_id: row.create_user_id ?? 0,
      update_user_id: row.update_user_id ?? 0,
      created_at: nowIso(),
    })
    return E.patient(row)
  },
  201,
)
route('PUT', '/patient/:id', (req, p) => {
  mustFind('patient', p.id, 'Patient')
  const { sensor_id, ...data } = req.body // eslint-disable-line @typescript-eslint/no-unused-vars
  update('patient', p.id, data)
  return { generatedMaps: [], raw: [], affected: 1 }
})
route('GET', '/patient/department/:department_id', (_r, p) =>
  rows('patient')
    .filter((x) => x.department_id == p.department_id && n(x.status) === 1)
    .map((x) => E.patientWithBed(x, { department: true })),
)
route('GET', '/patient/by-building-department/:building_id/:department_id', (_r, p) => {
  const building = byId('building', p.building_id)
  if (!building) throw new HttpError(500, `Building with id ${p.building_id} not found`)
  return rows('patient')
    .filter(
      (x) =>
        x.site_id == building.site_id &&
        x.department_id == p.department_id &&
        n(x.status) === 1 &&
        rows('bed').some((b) => b.patient_id == x.patient_id),
    )
    .map((x) => E.patientWithBed(x))
})
route('DELETE', '/patient/:id', (_r, p) => {
  const row = mustFind('patient', p.id, 'Patient')
  remove('notification_setting', (s) => s.patient_id == row.patient_id)
  for (const b of rows('bed')) if (b.patient_id == row.patient_id) b.patient_id = null
  remove('bed_assignments', (a) => a.patient_id == row.patient_id)
  remove('patient', (x) => x === row)
  return ''
})
route(
  'POST',
  '/patient/upload',
  (req) => {
    const url = req.files.image
    if (!url) throw new HttpError(500, '❌ No file uploaded')
    if (req.body.patientId) update('patient', req.body.patientId, { image: url })
    return { imageUrl: url }
  },
  201,
)

// ------------------------------------------------------------------- mqtt ----
route('GET', '/mqtt/status', () => {
  const snapshot = vitalsSnapshot().filter(
    (v) => v.position !== -1 || v.heartRate !== -1 || v.oxygen !== -1,
  )
  return {
    connected: true,
    bindingsCount: rows('sensor').filter((s) => s.bed_id && byId('bed', s.bed_id)?.patient_id)
      .length,
    patientsCount: snapshot.length,
    vitalsData: snapshot.map((v) => ({
      patient_id: v.id,
      vitals: { 1: v.position, 2: v.heartRate, 3: v.oxygen },
    })),
  }
})
route('GET', '/mqtt/reload', () => ({ message: 'reloaded' }))

// --------------------------------------------------- notification-setting ----
route(
  'POST',
  '/notification-setting',
  (req) => insert('notification_setting', req.body, { enabled: 1 }),
  201,
)
route('GET', '/notification-setting', () => rows('notification_setting').map((s) => E.setting(s)))
route('GET', '/notification-setting/:id', (_r, p) => {
  const s = byId('notification_setting', p.id)
  if (!s) throw notFound(`Notification setting with id ${p.id} not found`)
  return E.setting(s)
})
route('GET', '/notification-setting/department/:department_id', (_r, p) =>
  rows('notification_setting')
    .filter((s) => byId('patient', s.patient_id)?.department_id == p.department_id)
    .map((s) => E.setting(s)),
)
route('GET', '/notification-setting/patient/:patient_id', (_r, p) =>
  rows('notification_setting')
    .filter((s) => s.patient_id == p.patient_id)
    .map((s) => E.setting(s)),
)
route('GET', '/notification-setting/patient/:patient_id/sensor-type/:sensor_type_id', (_r, p) => {
  const s = rows('notification_setting').find(
    (x) => x.patient_id == p.patient_id && x.sensor_type_id == p.sensor_type_id,
  )
  if (!s)
    throw notFound(
      `Notification setting for patient ${p.patient_id} and sensor type ${p.sensor_type_id} not found`,
    )
  return E.setting(s)
})
route('PATCH', '/notification-setting/:id', (req, p) => {
  update('notification_setting', p.id, req.body)
  return ''
})
route('DELETE', '/notification-setting/:id', (_r, p) => {
  remove('notification_setting', (s) => s.id == p.id)
  return ''
})

// ----------------------------------------------------------- notification ----
route('POST', '/notification', (req) => notificationStore.create(req.body as never), 201)
route('GET', '/notification', (req) => {
  const status = req.query.get('status')
  return status ? notificationStore.byStatus(status) : notificationStore.all()
})
route('GET', '/notification/department/:department_id', (req, p) =>
  notificationStore.byDepartment(n(p.department_id), req.query.get('status') ?? undefined),
)
route(
  'POST',
  '/notification/test/:department_id',
  (_r, p) => [
    notificationStore.create({
      patient_id: 999,
      patient_name: 'ผู้ป่วยทดสอบ Real-time',
      sensor_type_id: 1,
      sensor_type_name: 'BedSensor',
      message: 'การแจ้งเตือนทดสอบระบบ Real-time',
      details: 'นี่คือการทดสอบระบบแจ้งเตือนแบบ Real-time - ไม่ต้องกด F5!',
      room_id: 1,
      bed_id: 1,
      metadata: { alertType: 'real_time_test', department_id: n(p.department_id) },
    }),
  ],
  201,
)
route(
  'POST',
  '/notification/sensor-alert',
  (req) => {
    const b = req.body
    return createSensorAlert(
      n(b.patient_id),
      String(b.patient_name),
      n(b.sensor_type_id),
      String(b.alertType),
      n(b.sensorValue),
    )
  },
  201,
)
route('GET', '/notification/count/unread', (req) =>
  notificationStore.unreadCount(req.query.get('user_id') ? n(req.query.get('user_id')) : undefined),
)
route('GET', '/notification/patient/:patient_id', (_r, p) =>
  notificationStore.byPatient(n(p.patient_id)),
)
route('GET', '/notification/user/:user_id', (_r, p) => notificationStore.byUser(n(p.user_id)))
route('GET', '/notification/:id', (_r, p) => {
  const found = notificationStore.one(n(p.id))
  if (!found) throw notFound(`Notification with id ${p.id} not found`)
  return found
})
route('PATCH', '/notification/:id', (req, p) => {
  notificationStore.update(n(p.id), req.body as never)
  return ''
})
route('PATCH', '/notification/:id/read', (_r, p) => {
  notificationStore.setStatus([n(p.id)], 'read')
  return ''
})
route('PATCH', '/notification/read/bulk', (req) => {
  notificationStore.setStatus(((req.body.ids as number[]) ?? []).map(Number), 'read')
  return ''
})
route('PATCH', '/notification/read/all', (req) => {
  notificationStore.markAll(req.query.get('user_id') ? n(req.query.get('user_id')) : undefined)
  return ''
})
route('PATCH', '/notification/:id/dismiss', (_r, p) => {
  notificationStore.setStatus([n(p.id)], 'dismissed')
  return ''
})
route('DELETE', '/notification/:id', (_r, p) => {
  notificationStore.remove(n(p.id))
  return ''
})
route('GET', '/notification/memory/info', () => notificationStore.memoryInfo())
route('DELETE', '/notification/memory/cleanup', (req) => {
  notificationStore.clearOlderThan(Number(req.query.get('hours') ?? 24))
  return { message: 'Old notifications cleared successfully' }
})
route(
  'POST',
  '/notification/:id/confirm',
  (req, p) => confirmNotification(n(p.id), req.body.user_id ? n(req.body.user_id) : undefined),
  201,
)
route(
  'POST',
  '/notification/confirm/bulk',
  (req) => {
    const ids = ((req.body.ids as number[]) ?? []).map(Number)
    const results = ids.map((id) => ({
      id,
      ...confirmNotification(id, req.body.user_id ? n(req.body.user_id) : undefined),
    }))
    const ok = results.filter((r) => r.success).length
    return {
      success: ok === results.length,
      message: `Confirmed ${ok} notifications, ${results.length - ok} failed`,
      results,
    }
  },
  201,
)

// --------------------------------------------------- history-notification ----
route('POST', '/history-notification', (req) => insert('history_notification', req.body), 201)
const newestFirst = (a: Row, b: Row) => String(b.Noti_time).localeCompare(String(a.Noti_time))
route('GET', '/history-notification', () =>
  [...rows('history_notification')].sort(newestFirst).map((h) => ({ ...h })),
)
route('GET', '/history-notification/:id', (_r, p) => {
  const h = byId('history_notification', p.id)
  return h ? { ...h } : ''
})
route('GET', '/history-notification/site/:site_id', (_r, p) =>
  rows('history_notification')
    .filter((h) => byId('patient', h.Patient_Id)?.site_id == p.site_id)
    .sort(newestFirst)
    .map((h) => ({ ...h })),
)

// ----------------------------------------------------------------- sensors ----
const sensorWithBed = (s: Row, dbEager = true) => {
  const out = E.sensor(s)!
  out.bed = s.bed_id ? E.bed(byId('bed', s.bed_id), { dbEager }) : null
  return orderKeys('sensor', out)
}
route('GET', '/sensors', () => rows('sensor').map((s) => sensorWithBed(s)))
route('GET', '/sensors/:id', (_r, p) => {
  const s = byId('sensor', p.id)
  return s ? sensorWithBed(s) : ''
})
route('GET', '/sensors/site/:siteId', (_r, p) =>
  rows('sensor')
    .filter((s) => s.site_Id == p.siteId)
    .map((s) => E.sensor(s)),
)
route(
  'POST',
  '/sensors',
  (req) => E.sensor(insert('sensor', req.body, { bed_id: null, hash: null })),
  201,
)
route('PUT', '/sensors/:id', (req, p) => {
  mustFind('sensor', p.id, 'Sensor')
  const { patient_id, patient, ...data } = req.body // eslint-disable-line @typescript-eslint/no-unused-vars
  return E.sensor(update('sensor', p.id, data))
})
route('DELETE', '/sensors/:id', (_r, p) => {
  const s = mustFind('sensor', p.id, 'Sensor')
  remove('sensor_profile', (x) => x.sensorId == s.sensor_id)
  remove('bed_sensors', (x) => x.sensor_id == s.sensor_id)
  remove('sensor', (x) => x === s)
  return ''
})
route(
  'POST',
  '/sensors/:id/assign-bed/:bedId',
  (_r, p) => {
    const s = byId('sensor', p.id)
    if (!s) throw notFound('ไม่พบ sensor')
    const clash = rows('sensor').find(
      (x) => x.bed_id == p.bedId && x.sensor_type_id == s.sensor_type_id && x !== s,
    )
    if (clash) throw badRequest('เตียงนี้มี sensor type เดียวกันแล้ว')
    s.bed_id = n(p.bedId)
    touch(s)
    return { message: `ผูก sensor ID ${p.id} กับเตียง ID ${p.bedId} เรียบร้อยแล้ว` }
  },
  201,
)
route(
  'POST',
  '/sensors/:id/remove-from-bed',
  (_r, p) => {
    const s = byId('sensor', p.id)
    if (!s) throw notFound('ไม่พบ sensor')
    s.bed_id = null
    touch(s)
    return { message: `ลบการผูก sensor ID ${p.id} กับเตียงเรียบร้อยแล้ว` }
  },
  201,
)
route('GET', '/sensors/bed/:bedId', (_r, p) =>
  rows('sensor')
    .filter((s) => s.bed_id == p.bedId)
    .map((s) => sensorWithBed(s)),
)
route('GET', '/sensors/available/list', () =>
  rows('sensor')
    .filter((s) => !s.bed_id)
    .map((s) => E.sensor(s)),
)
route('GET', '/sensors/check/:mac', (_r, p) => ({
  exists: !findBy('sensor', 'mac', decodeURIComponent(p.mac!)),
}))

// --------------------------------------------------------- patient-history ----
const hist = (r: Row | undefined) => entity('history_patient', r)
route(
  'POST',
  '/patient-history',
  (req) => hist(insert('history_patient', req.body, { created_at: nowIso() })),
  201,
)
route('GET', '/patient-history', () =>
  rows('history_patient')
    .filter((h) => h.status === '1')
    .map(hist),
)
route('GET', '/patient-history/active-case', () =>
  rows('history_patient')
    .filter((h) => h.status === '0')
    .map(hist),
)
route('GET', '/patient-history/:id', (_r, p) => hist(byId('history_patient', p.id)) ?? '')
route('PUT', '/patient-history/:id', (req, p) => {
  update('history_patient', p.id, req.body)
  return { generatedMaps: [], raw: [], affected: 1 }
})
route('DELETE', '/patient-history/:id', (_r, p) => {
  const c = remove('history_patient', (h) => h.history_id == p.id)
  return { raw: [], affected: c }
})

// --------------------------------------------------------------------- llm ----
route(
  'POST',
  '/llm/summary/:id',
  (_r, p) => {
    const patient = byId('patient', p.id)
    if (!patient) throw new HttpError(500, `User with id ${p.id} not found`)
    const pid = n(patient.patient_id)
    return { summary: summarizePatient(patient, getVital(pid, 2), getVital(pid, 3)) }
  },
  201,
)
route(
  'POST',
  '/llm/message',
  (req) => ({ geminiMessage: answerChat(String(req.body.message ?? '')) }),
  201,
)
route('GET', '/llm/summary', () => ({ message: 'all patient summaries' }))

// ----------------------------------------------------------- master-status ----
const status = (r: Row | undefined) => (r ? { ...r } : null)
route('GET', '/master-status', () => rows('master_status').map(status))
route('GET', '/master-status/:id', (_r, p) => status(byId('master_status', p.id)) ?? '')
route(
  'POST',
  '/master-status',
  (req) =>
    status(
      insert('master_status', req.body, {
        active: '1',
        status_group: 1,
        create_userlogin: 0,
        update_userlogin: 0,
      }),
    ),
  201,
)
route('PUT', '/master-status/:id', (req, p) => {
  mustFind('master_status', p.id, 'Sensor')
  return status(update('master_status', p.id, req.body))
})
route('DELETE', '/master-status/:id', (_r, p) => {
  const r = mustFind('master_status', p.id, 'Sensor')
  remove('master_status', (x) => x === r)
  return ''
})
route(
  'POST',
  '/master-status/upload',
  (req) => {
    const url = req.files.image
    if (!url) throw new HttpError(500, '❌ No file uploaded')
    const id = req.body.statusId ?? req.body.status_id ?? req.body.id
    if (id) update('master_status', id, { name_img: url })
    return { imageUrl: url }
  },
  201,
)

// -------------------------------------------------------- sensor templates ----
const tpl = (r: Row | undefined) => entity('sensor_template', r)
route('GET', '/sensor-templates', () => rows('sensor_template').map(tpl))
route('GET', '/sensor-templates/:id', (_r, p) => tpl(byId('sensor_template', p.id)) ?? '')
route('POST', '/sensor-templates', (req) => tpl(insert('sensor_template', req.body)), 201)
route('PUT', '/sensor-templates/:id', (req, p) => {
  mustFind('sensor_template', p.id, 'Template')
  return tpl(update('sensor_template', p.id, req.body))
})
route('DELETE', '/sensor-templates/bySensor/:id', (_r, p) => {
  remove('sensor_template', (x) => x.sensor_template_id == p.id)
  return ''
})

// ---------------------------------------------------------- sensor profile ----
const prof = (r: Row | undefined) => entity('sensor_profile', r)
route('GET', '/sensor-profile', () => rows('sensor_profile').map(prof))
route('GET', '/sensor-profile/:id', (_r, p) => prof(byId('sensor_profile', p.id)) ?? '')
route('GET', '/sensor-profile/bySensor/:sensorId', (_r, p) => {
  const r = rows('sensor_profile').find((x) => x.sensorId == p.sensorId)
  if (!r) return ''
  const out = prof(r)!
  const s = byId('sensor', r.sensorId)
  out.sensor = s ? sensorWithBed(s, false) : null
  return out
})
route(
  'POST',
  '/sensor-profile',
  (req) => {
    const { sensor, sensorId, ...rest } = req.body
    const sid = sensorId ?? (sensor as Row | undefined)?.id ?? null
    return prof(insert('sensor_profile', { ...rest, sensorId: sid }))
  },
  201,
)
route('PUT', '/sensor-profile/:id', (req, p) => {
  mustFind('sensor_profile', p.id, 'Sensor')
  const { sensor, ...rest } = req.body // eslint-disable-line @typescript-eslint/no-unused-vars
  return prof(update('sensor_profile', p.id, rest))
})
route('DELETE', '/sensor-profile/bySensor/:id', (_r, p) => {
  remove('sensor_profile', (x) => x.sensorId == p.id)
  return ''
})

// ------------------------------------------------------------- sensor type ----
route('POST', '/sensor-type', (req) => E.sensorType(insert('sensor_type', req.body)), 201)
route('GET', '/sensor-type', () => rows('sensor_type').map(E.sensorType))
route('GET', '/sensor-type/:id', (_r, p) => E.sensorType(byId('sensor_type', p.id)) ?? '')
route('PUT', '/sensor-type/:id', (req, p) => E.sensorType(update('sensor_type', p.id, req.body)))
route('DELETE', '/sensor-type/:id', (_r, p) => {
  remove('sensor_type', (x) => x.sensor_type_id == p.id)
  return ''
})

// ------------------------------------------------------------------- sites ----
const siteFull = (r: Row) => ({
  ...entity('sites', r)!,
  buildings: rows('building')
    .filter((b) => b.site_id == r.site_id)
    .map((b) => ({
      ...E.building(b)!,
      floors: rows('floor')
        .filter((f) => f.building_id == b.building_id)
        .map((f) => E.floor(f)),
    })),
})
route(
  'POST',
  '/sites',
  (req) => entity('sites', insert('sites', req.body, { name_img: null, site_global: 1 })),
  201,
)
route('GET', '/sites', () => rows('sites').map(siteFull))
route('GET', '/sites/:id', (_r, p) => siteFull(mustFind('sites', p.id, 'Site')))
route('PUT', '/sites/:id', (req, p) => {
  mustFind('sites', p.id, 'Site')
  return siteFull(update('sites', p.id, req.body)!)
})
route(
  'DELETE',
  '/sites/:id',
  (_r, p) => {
    const s = mustFind('sites', p.id, 'Site')
    if (rows('building').some((b) => b.site_id == s.site_id)) throw new HttpError(409, IN_USE)
    remove('sites', (x) => x === s)
    return ''
  },
  204,
)
route(
  'POST',
  '/sites/upload',
  (req) => {
    const url = req.files.image
    if (!url) throw new HttpError(500, '❌ No file uploaded')
    if (req.body.siteId) update('sites', req.body.siteId, { name_img: url })
    return { imageUrl: url }
  },
  201,
)

// -------------------------------------------------------------- sites-type ----
const siteType = (r: Row | undefined) => entity('sites_type', r)
route('POST', '/sites-type', (req) => siteType(insert('sites_type', req.body)), 201)
route('GET', '/sites-type', () => rows('sites_type').map(siteType))
route('GET', '/sites-type/:id', (_r, p) => siteType(byId('sites_type', p.id)) ?? '')
route('PATCH', '/sites-type/:id', (req, p) => siteType(update('sites_type', p.id, req.body)))
route('DELETE', '/sites-type/:id', (_r, p) => {
  remove('sites_type', (x) => x.site_type_id == p.id)
  return ''
})

// --------------------------------------------------------------- buildings ----
route(
  'POST',
  '/building',
  (req) => E.building(insert('building', req.body, { floor_count: 1, global_id: 0 })),
  201,
)
route('GET', '/building', () => rows('building').map(E.building))
route('GET', '/building/site/:siteId', (_r, p) =>
  rows('building')
    .filter((b) => b.site_id == p.siteId)
    .map(E.building),
)
route('GET', '/building/:id', (_r, p) => E.building(mustFind('building', p.id, 'Building')))
route('PUT', '/building/:id', (req, p) => {
  mustFind('building', p.id, 'Building')
  return E.building(update('building', p.id, req.body))
})
route('DELETE', '/building/:id', (_r, p) => {
  const b = mustFind('building', p.id, 'Building')
  if (rows('department_building').some((d) => d.building_id == b.building_id)) {
    throw new HttpError(409, IN_USE)
  }
  remove('floor', (f) => f.building_id == b.building_id)
  remove('building', (x) => x === b)
  return ''
})

// ------------------------------------------------------------------ floors ----
const floorWithBuilding = (f: Row) => ({
  ...E.floor(f)!,
  building: E.building(byId('building', f.building_id)),
})
route(
  'POST',
  '/floors',
  (req) => {
    const b = req.body
    const row = insert('floor', {
      floor_name: b.floor_name,
      floor_name_en: b.floor_name_en,
      remark: b.remark ?? null,
      building_id: b.building_id,
    })
    return floorWithBuilding(row)
  },
  201,
)
route('GET', '/floors', () => rows('floor').map(floorWithBuilding))
route('GET', '/floors/:id', (_r, p) => floorWithBuilding(mustFind('floor', p.id, 'Floor')))
route('PATCH', '/floors/:id', (req, p) => {
  const f = mustFind('floor', p.id, 'Floor')
  const { building_id, ...rest } = req.body
  update('floor', p.id, rest)
  if (building_id !== undefined) f.building_id = building_id
  save()
  return floorWithBuilding(f)
})
route('DELETE', '/floors/:id', (_r, p) => {
  const f = mustFind('floor', p.id, 'Floor')
  remove('floor', (x) => x === f)
  return ''
})

// --------------------------------------------------------------- provinces ----
const prov = (r: Row | undefined) => entity('province', r)
route('POST', '/provinces', (req) => prov(insert('province', req.body)), 201)
route('GET', '/provinces', () => rows('province').map(prov))
route('GET', '/provinces/:id', (_r, p) => prov(byId('province', p.id)) ?? '')
route('PATCH', '/provinces/:id', (req, p) => prov(update('province', p.id, req.body)))
route('DELETE', '/provinces/:id', (_r, p) => {
  remove('province', (x) => x.province_id == p.id)
  return ''
})

// ------------------------------------------------------------------- roles ----
const role = (r: Row | undefined) => entity('roles', r)
route(
  'POST',
  '/roles',
  (req) => role(insert('roles', req.body, { created_at: nowIso(), updated_at: nowIso() })),
  201,
)
route('GET', '/roles', () => rows('roles').map(role))
route('GET', '/roles/:id', (_r, p) => role(byId('roles', p.id)) ?? '')
route('PATCH', '/roles/:id', (req, p) => role(update('roles', p.id, req.body)))
route('DELETE', '/roles/:id', (_r, p) => {
  remove('roles', (x) => x.role_id == p.id)
  return ''
})

// ----------------------------------------------------------------- profile ----
const profile = (r: Row | undefined) => entity('profile', r)
route(
  'POST',
  '/profile',
  (req) => profile(insert('profile', req.body, { line_id: '', photo: '', created_at: nowIso() })),
  201,
)
route('GET', '/profile', () => rows('profile').map(profile))
route('GET', '/profile/:id', (_r, p) => profile(mustFind('profile', p.id, 'Profile')))
route('PATCH', '/profile/:id', (req, p) => {
  mustFind('profile', p.id, 'Profile')
  return profile(update('profile', p.id, req.body))
})
route('DELETE', '/profile/:id', (_r, p) => {
  remove('profile', (x) => x.profile_id == p.id)
  return ''
})
route(
  'POST',
  '/profile/upload',
  (req) => {
    const url = req.files.image
    if (!url) throw new HttpError(500, '❌ No file uploaded')
    const id = req.body.profileId ?? req.body.profile_id ?? req.body.id
    if (id) update('profile', id, { photo: url })
    return { imageUrl: url }
  },
  201,
)

// ------------------------------------------------------------- departments ----
function deptFull(r: Row) {
  return {
    ...E.department(r)!,
    departmentBuildings: rows('department_building')
      .filter((d) => d.department_id == r.department_id)
      .map((d) => E.deptBuilding(d, { floor: true })),
  }
}
function syncMappings(deptId: number, mappings: Row[]) {
  // The backend used to delete every mapping and recreate them, which failed
  // with a foreign-key error as soon as a ward had beds. Keep unchanged
  // mappings, add new ones, and refuse to drop a ward that still has beds.
  const wanted = mappings.map((m) => ({
    building_id: n(m.building_id),
    floor_number: m.floor_number == null ? null : n(m.floor_number),
  }))
  const existing = rows('department_building').filter((d) => n(d.department_id) === deptId)
  for (const d of existing) {
    const keep = wanted.find(
      (w) =>
        w.building_id === n(d.building_id) &&
        w.floor_number === (d.floor_number == null ? null : n(d.floor_number)),
    )
    if (!keep) {
      if (rows('bed').some((b) => b.department_building_id == d.department_building_id)) {
        throw badRequest(
          'ไม่สามารถนำอาคาร/ชั้นนี้ออกได้ เนื่องจากยังมีเตียงอยู่ในแผนก กรุณาย้ายหรือลบเตียงก่อน',
        )
      }
      remove('department_building', (x) => x === d)
    }
  }
  for (const w of wanted) {
    if (
      !existing.some(
        (d) =>
          n(d.building_id) === w.building_id &&
          (d.floor_number == null ? null : n(d.floor_number)) === w.floor_number,
      )
    ) {
      const floor = rows('floor').filter((f) => n(f.building_id) === w.building_id)[
        (w.floor_number ?? 1) - 1
      ]
      insert('department_building', {
        department_id: deptId,
        building_id: w.building_id,
        floor_number: w.floor_number,
        floor_id: floor?.floor_id ?? null,
      })
    }
  }
}
route(
  'POST',
  '/departments',
  (req) => {
    const row = insert('departments', { name: req.body.department_name })
    syncMappings(n(row.department_id), (req.body.mappings as Row[]) ?? [])
    return deptFull(row)
  },
  201,
)
route('GET', '/departments', () => rows('departments').map(deptFull))
route('GET', '/departments/:id', (_r, p) => deptFull(mustFind('departments', p.id, 'Department')))
route('PUT', '/departments/:id', (req, p) => {
  const row = mustFind('departments', p.id, 'Department')
  if (req.body.department_name) update('departments', p.id, { name: req.body.department_name })
  syncMappings(n(row.department_id), (req.body.mappings as Row[]) ?? [])
  return deptFull(row)
})
route('DELETE', '/departments/:id', (_r, p) => {
  const row = mustFind('departments', p.id, 'Department')
  const id = row.department_id
  const wardIds = rows('department_building')
    .filter((d) => d.department_id == id)
    .map((d) => d.department_building_id)
  if (
    rows('user').some((u) => u.department_id == id) ||
    rows('patient').some((x) => x.department_id == id) ||
    rows('bed').some((b) => wardIds.includes(b.department_building_id))
  ) {
    throw badRequest(
      'ไม่สามารถลบแผนกนี้ได้ เนื่องจากมีผู้ใช้งานที่เชื่อมโยงอยู่ กรุณาลบหรือย้ายผู้ใช้งานออกจากแผนกนี้ก่อน',
    )
  }
  remove('department_building', (d) => d.department_id == id)
  remove('departments', (x) => x === row)
  return ''
})

// ---------------------------------------------------- department-buildings ----
route(
  'POST',
  '/department-buildings',
  (req) => E.deptBuilding(insert('department_building', req.body), { eager: false }),
  201,
)
route('GET', '/department-buildings', () =>
  rows('department_building').map((d) => E.deptBuilding(d)),
)
route('GET', '/department-buildings/:id', (_r, p) =>
  E.deptBuilding(mustFind('department_building', p.id, 'DepartmentBuilding')),
)
route('PATCH', '/department-buildings/:id', (req, p) => {
  mustFind('department_building', p.id, 'DepartmentBuilding')
  return E.deptBuilding(update('department_building', p.id, req.body))
})
route('DELETE', '/department-buildings/:id', (_r, p) => {
  const d = mustFind('department_building', p.id, 'DepartmentBuilding')
  if (rows('bed').some((b) => b.department_building_id == d.department_building_id))
    throw new HttpError(409, IN_USE)
  remove('department_building', (x) => x === d)
  return ''
})

// --------------------------------------------------------------- dashboards ----
route('GET', '/dashboard/stats', (req) => nurseDashboard.stats(req.query))
route('GET', '/dashboard/charts/gender', (req) => nurseDashboard.gender(req.query))
route('GET', '/dashboard/charts/age-groups', (req) => nurseDashboard.ageGroups(req.query))
route('GET', '/dashboard/charts/admit-trend', (req) => nurseDashboard.admitTrend(req.query))
route('GET', '/dashboard/charts/inout-trend', (req) => nurseDashboard.inOutTrend(req.query))
route('GET', '/dashboard/charts/alert-trend', (req) => nurseDashboard.alertTrend(req.query))
route('GET', '/dashboard/charts/avg-stay-trend', (req) => nurseDashboard.avgStayTrend(req.query))
route('GET', '/admin-dashboard/stats', () => adminDashboard.stats())
route('GET', '/admin-dashboard/sensors/pie', () => adminDashboard.sensorPie())
route('GET', '/admin-dashboard/notifications/daily', (req) =>
  adminDashboard.perDay(Number(req.query.get('days') ?? 7)),
)
route('GET', '/admin-dashboard/notifications/hourly', (req) =>
  adminDashboard.perHour(Number(req.query.get('days') ?? 30)),
)
route('GET', '/admin-dashboard/notifications/categories', (req) =>
  adminDashboard.categories(req.query),
)
route('GET', '/admin-dashboard/notifications/signals', (req) => adminDashboard.signals(req.query))
route('GET', '/admin-dashboard/sensors/usage-trend', (req) => adminDashboard.usageTrend(req.query))

// -------------------------------------------------------------------- beds ----
const bedFull = (b: Row) => E.bed(b, { floor: true, sensors: true })
route('POST', '/beds', (req) => ({ ...insert('bed', req.body, { patient_id: null }) }), 201)
route('GET', '/beds', () => rows('bed').map(bedFull))
route('GET', '/beds/department/:departmentId', (_r, p) =>
  rows('bed')
    .filter(
      (b) => byId('department_building', b.department_building_id)?.department_id == p.departmentId,
    )
    .map(bedFull),
)
route('GET', '/beds/:id', (_r, p) => bedFull(mustFind('bed', p.id, 'Bed')))
route('PATCH', '/beds/:id', (req, p) => {
  const bed = mustFind('bed', p.id, 'Bed')
  const before = bed.patient_id
  update('bed', p.id, req.body)
  // database triggers keep patient.bed_id in sync with bed.patient_id
  if (before !== bed.patient_id) {
    if (before) update('patient', before, { bed_id: null })
    if (bed.patient_id) update('patient', bed.patient_id, { bed_id: bed.bed_id })
  }
  return bedFull(bed)
})
route('DELETE', '/beds/:id', (_r, p) => {
  const bed = mustFind('bed', p.id, 'Bed')
  if (bed.patient_id) update('patient', bed.patient_id, { bed_id: null })
  for (const s of rows('sensor')) if (s.bed_id == bed.bed_id) s.bed_id = null
  remove('bed_assignments', (a) => a.bed_id == bed.bed_id)
  remove('bed_sensors', (a) => a.bed_id == bed.bed_id)
  remove('bed', (x) => x === bed)
  return ''
})

// --------------------------------------------------------- bed assignments ----
function createAssignment(body: Row): Row {
  if (!byId('bed', body.bed_id)) throw notFound(`Bed with ID ${body.bed_id} not found`)
  if (!byId('patient', body.patient_id))
    throw notFound(`Patient with ID ${body.patient_id} not found`)
  if (rows('bed_assignments').some((a) => a.bed_id == body.bed_id && a.status === 'active'))
    throw badRequest(`Bed ${body.bed_id} is already occupied`)
  const mine = rows('bed_assignments').find(
    (a) => a.patient_id == body.patient_id && a.status === 'active',
  )
  if (mine) throw badRequest(`Patient ${body.patient_id} is already assigned to bed ${mine.bed_id}`)
  return insert('bed_assignments', {
    ...body,
    assigned_at: body.assigned_at ? new Date(String(body.assigned_at)).toISOString() : nowIso(),
    status: body.status || 'active',
    transferred_at: null,
    notes: body.notes ?? null,
  })
}
route('POST', '/bed-assignments', (req) => ({ ...createAssignment(req.body) }), 201)
route('GET', '/bed-assignments', (req) => {
  const list =
    req.query.get('status') === 'active'
      ? rows('bed_assignments').filter((a) => a.status === 'active')
      : rows('bed_assignments')
  return list.map((a) => E.assignment(a, { patient: true, bed: true }))
})
route('GET', '/bed-assignments/patient/:patientId', (_r, p) =>
  rows('bed_assignments')
    .filter((a) => a.patient_id == p.patientId)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((a) => E.assignment(a, { bed: true })),
)
route('GET', '/bed-assignments/bed/:bedId', (_r, p) =>
  rows('bed_assignments')
    .filter((a) => a.bed_id == p.bedId)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .map((a) => E.assignment(a, { patient: true })),
)
route('PATCH', '/bed-assignments/:id', (req, p) => {
  mustFind('bed_assignments', p.id, 'Assignment')
  const { transferred_at, ...rest } = req.body
  const a = update('bed_assignments', p.id, rest)!
  if (transferred_at) a.transferred_at = new Date(String(transferred_at)).toISOString()
  save()
  return E.assignment(a, { patient: true, bed: true })
})
route(
  'POST',
  '/bed-assignments/:id/transfer',
  (req, p) => {
    const cur = rows('bed_assignments').find(
      (a) => a.assignment_id == p.id && a.status === 'active',
    )
    if (!cur) throw notFound(`Active assignment with ID ${p.id} not found`)
    const newBed = req.body.new_bed_id
    if (!byId('bed', newBed)) throw notFound(`Bed with ID ${newBed} not found`)
    if (rows('bed_assignments').some((a) => a.bed_id == newBed && a.status === 'active'))
      throw badRequest(`Bed ${newBed} is already occupied`)
    const note = req.body.transfer_notes ? String(req.body.transfer_notes) : ''
    update('bed_assignments', p.id, {
      status: 'transferred',
      transferred_at: nowIso(),
      notes: `${cur.notes ?? ''}${note ? ` | Transfer: ${note}` : ''}`,
    })
    return {
      ...createAssignment({
        patient_id: cur.patient_id,
        bed_id: newBed,
        assigned_at: nowIso(),
        assigned_by: req.body.transferred_by,
        notes: `Transferred from bed ${cur.bed_id}${note ? ` - ${note}` : ''}`,
      }),
    }
  },
  201,
)
route(
  'POST',
  '/bed-assignments/:id/discharge',
  (_r, p) => {
    const cur = rows('bed_assignments').find(
      (a) => a.assignment_id == p.id && a.status === 'active',
    )
    if (!cur) throw notFound(`Active assignment with ID ${p.id} not found`)
    update('bed_assignments', p.id, { status: 'discharged', transferred_at: nowIso() })
    return ''
  },
  201,
)
route('DELETE', '/bed-assignments/:id', (_r, p) => {
  const a = mustFind('bed_assignments', p.id, 'Assignment')
  remove('bed_assignments', (x) => x === a)
  return ''
})

// image cleanup calls the frontend makes after replacing a picture (no-op here)
for (const path of [
  '/patient/upload',
  '/profile/upload',
  '/master-status/upload',
  '/sites/upload',
]) {
  route('DELETE', path, () => ({ message: 'deleted' }))
}

// ------------------------------------------------------------------ dispatch ----
export function handle(req: DemoRequest): DemoResponse {
  const parts = req.path
    .split('/')
    .filter(Boolean)
    .map((s) => decodeURIComponent(s))
  const lower = parts.map((s) => s.toLowerCase()) // Express routes are case-insensitive (/Profile)
  for (const r of routes) {
    if (r.method !== req.method || r.parts.length !== parts.length) continue
    const params: Params = {}
    let ok = true
    for (let i = 0; i < r.parts.length; i++) {
      const seg = r.parts[i]!
      if (seg.startsWith(':')) params[seg.slice(1)] = parts[i]!
      else if (seg.toLowerCase() !== lower[i]) {
        ok = false
        break
      }
    }
    if (!ok) continue
    try {
      const data = r.handler(req, params)
      return {
        status: r.status ?? (req.method === 'POST' ? 201 : 200),
        data: data === undefined ? '' : data,
      }
    } catch (e) {
      if (e instanceof HttpError) {
        return {
          status: e.status,
          data: e.body ?? { statusCode: e.status, message: e.message, path: req.path },
        }
      }
      console.error('[demo api]', req.method, req.path, e)
      return {
        status: 500,
        data: { statusCode: 500, message: 'Internal server error', path: req.path },
      }
    }
  }
  return {
    status: 404,
    data: { statusCode: 404, message: `Cannot ${req.method} ${req.path}`, error: 'Not Found' },
  }
}
