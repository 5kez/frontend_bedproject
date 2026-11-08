/* eslint-disable @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions -- demo rows are untyped DB records (Record<string, unknown>) holding scalars */
// Offline stand-in for the backend's Gemini features (HealthMate chat and the
// per-patient "analyse" summary). The real backend sends these to Google
// Generative AI (and turns questions into SQL); the demo has no API key, so it
// answers a handful of common questions from the demo data with simple rules.
// Every answer is labelled so nobody mistakes it for model output.
import { byId, rows, type Row } from './db'
import { notificationStore } from './realtime'

const TAG = '(โหมดสาธิต: คำตอบจำลอง ไม่ได้ใช้ AI จริง)'
const n = (v: unknown) => Number(v)

function activePatients(): Row[] {
  return rows('patient').filter((p) => n(p.status) === 1)
}

function todayAlerts(): Row[] {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return rows('history_notification').filter(
    (h) => Date.parse(String(h.Noti_time)) >= start.getTime(),
  )
}

export function answerChat(message: string): string {
  const m = message.toLowerCase()
  const has = (...words: string[]) => words.some((w) => m.includes(w))

  if (has('เตียงว่าง', 'available bed', 'free bed')) {
    const free = rows('bed').filter((b) => !b.patient_id)
    const list = free.map((b) => `เตียง ${b.bed_id}`).join(', ')
    return `ตอนนี้มีเตียงว่าง ${free.length} เตียง${list ? ` (${list})` : ''} ${TAG}`
  }
  if (has('ผู้ป่วย', 'patient', 'คนไข้') && has('กี่', 'จำนวน', 'how many', 'count')) {
    const byDept = new Map<string, number>()
    for (const p of activePatients()) {
      const d = String(byId('departments', p.department_id)?.department_name ?? '-')
      byDept.set(d, (byDept.get(d) ?? 0) + 1)
    }
    const detail = [...byDept].map(([d, c]) => `${d} ${c} คน`).join(', ')
    return `มีผู้ป่วยที่รักษาอยู่ ${activePatients().length} คน (${detail}) ${TAG}`
  }
  if (has('แจ้งเตือน', 'alert', 'notification')) {
    const live = notificationStore.byStatus('unread')
    const today = todayAlerts()
    const top = live
      .slice(0, 3)
      .map((x) => `${x.patient_name} (${x.sensor_type_name})`)
      .join(', ')
    return `วันนี้ยืนยันการแจ้งเตือนไปแล้ว ${today.length} ครั้ง และยังมีแจ้งเตือนที่รอยืนยัน ${live.length} รายการ${top ? ` เช่น ${top}` : ''} ${TAG}`
  }
  if (has('ออกซิเจน', 'spo2', 'หัวใจ', 'heart', 'ชีพจร')) {
    return `ค่าชีพจรและ SpO2 แสดงแบบเรียลไทม์ในหน้า "ข้อมูลผู้ป่วย" ระบบจะแจ้งเตือนเมื่อค่าออกนอกช่วงที่ตั้งไว้ในหน้า "จัดการแจ้งเตือน" ${TAG}`
  }
  if (has('สวัสดี', 'hello', 'hi')) {
    return `สวัสดีค่ะ ฉันคือ HealthMate ลองถามเช่น "มีผู้ป่วยกี่คน", "เตียงว่างกี่เตียง" หรือ "มีแจ้งเตือนอะไรบ้าง" ${TAG}`
  }
  return `ในระบบจริง HealthMate จะแปลงคำถามเป็น SQL แล้วตอบจากฐานข้อมูลด้วย Gemini ในเดโมนี้ลองถามเช่น "มีผู้ป่วยกี่คน", "เตียงว่างกี่เตียง" หรือ "มีแจ้งเตือนอะไรบ้าง" ${TAG}`
}

export function summarizePatient(patient: Row, heartRate: number, oxygen: number): string {
  const notes: string[] = []
  if (patient.remark) notes.push(String(patient.remark))
  if (heartRate !== -1 && (heartRate < 60 || heartRate > 100))
    notes.push(`ชีพจร ${heartRate} bpm ผิดปกติ`)
  if (oxygen !== -1 && oxygen < 92) notes.push(`SpO2 ${oxygen}% ต่ำ`)
  if (heartRate === -1 || oxygen === -1) notes.push('มีเซ็นเซอร์ขาดการเชื่อมต่อ')
  const text = notes.length ? `ควรเฝ้าระวัง: ${notes.join(' / ')}` : 'ไม่มีอาการน่าสงสัย'
  return `${text} ${TAG}`
}
