export interface User {
  id: number
  role_id: number | null
  name: string
  user_password: string
  site_id: number | null
  user_name: string
  last_name: string
  build_id: number | null
  status: number
  roles_code: string
  floor_id: number | null
  profile_id: number
  department_id: number | null
}

export interface Sensor {
  sensor_id: number
  sensor_type_id: number
  mac: string
  name: string
  description?: string
  hash?: string
  created_at: Date
  updated_at: Date
}

export interface Notification {
  id: number
  patient_id?: number
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  created_at: Date
  updated_at: Date
}
export interface Site {
  id: number
  sites_name: string
  lat: number
  lng: number
  address: string
  sites_type_id: number | null
  prov_id: number | null
  name_img: string | null
}
export interface SiteType {
  id: number
  name: string
  remark?: string
  active: boolean
}
export interface Building {
  id: number
  build_name: string
  building_name?: string
  building_name_en?: string
  lat: number
  lng: number
  site_id: number | null
  global_id: number
  floor_count?: number
  remark?: string
}
export interface Profile {
  id: number
  name: string
  surname: string
  email: string
  line_id: string
  photo: string
  site_id: number | null
}

export interface Floor {
  id: number
  floor_name: string
  floor_name_en: string
  remark?: string
  building_id: number | null
  building?: Building | null
}
export interface HistoryNotification {
  Id: number
  Patient_Id: number | null
  Noti_time: string | null
  Noti_type: string
  Noti_desc: string
  Noti_id: number | null
  Noti_setting_id: number | null
  Status: number | null
  Sensor_id: number | null
  Sensor_type: string | null
  Device_id: string | null
  User_id: number
  Patient_indate: string | null
  Patient_remark: string
  Patient_department: string
  Patient_room_num: number | null
}

export interface Patient {
  patient_id: number
  bed_id: number | null // This comes from bed.bed_id via join (not from patient table)
  room_id: number | null
  floor_id: number | null
  site_id: number | null
  name: string
  thaiId: string
  birthDate: Date | null
  admitDate: Date | null
  status: 0 | 1
  telFam: string
  image: string
  position: 1 | 2 | 3 | 4 | 5
  sex: 'F' | 'M' | null
  remark: string | null
  oxygen: number
  heartRate: number
  create_user_id: number | null
  update_user_id: number | null
  sensor_id: number | null
  department_id: number | null
}

export interface PatientStatus {
  id: number
  name: string
  name_img: string
  status_group: number | null
  active: boolean
  create_userlogin: number | null
  update_userlogin: number | null
}

export interface Sensor {
  id: number
  name: string
  mac: string
  desc: string
  sensorType_Id: number
  sensorStatus: string
  patientId?: number | null
  patient?: Patient | null
  bed?: Bed | null
  bed_id?: number | null
  site_Id?: number | null
}

export interface SensorType {
  id: number
  name: string
}

//profile
export interface SensorPose {
  name: string
  name_img: string
  active: boolean
  delay: number
  repeat: number
  sensitivity: number
}

export interface SensorProfileConfig {
  poses: SensorPose[]
  globalSensitivity: number
}

export interface SensorProfile {
  id: number
  sensor?: Sensor
  sensorType_Id: number
  config: SensorProfileConfig
}

export interface SensorTemplate {
  id: number
  name: string
  sensorType_Id: number | null
  config: SensorProfileConfig
}
//

export interface Role {
  id: number
  roles_name: string
  desc: string
  roles_code: string
}

export interface Notification {
  id: number
  userId: number
  patientId: number
  notificationType: number
  notificationInfo: string
  isActive: boolean
  patientName?: string
  sensorTypeName?: string
  details?: string
  createdAt: string // ✅ เปลี่ยนจาก optional เป็น required
  notificationTitle?: string
  patientbed_id?: number
  patientroom_id?: number
  userName?: string
}

export interface NotificationSetting {
  heartRate: { minValue: number; maxValue: number; duration: number }
  oxygen: { minValue: number; maxValue: number; duration: number }
  position: { allowedValues: number[]; duration: number }
}

export interface SensorStatus {
  id: number
  sensor_id: number
  status: string
  timestamp: Date
  data: Record<string, unknown>
}

export interface PatientHistory {
  id: number
  patient_id: number
  sensors_id: number | null
  in_date: Date
  out_date: Date | null
  remark: string
  status: string
  create_user_id: number
  update_user_id: number
}

//ใช้ตัวนี้เป็นตัวหลักแทน Department table จริงใน DB
export interface Department {
  id: number
  department_name: string
  created_at?: string
  updated_at?: string
}

//ใช้เวลา join กับ Building/Floor
export interface DepartmentBuilding {
  id: number
  department_id: number
  building_id: number
  floor_id: number
  created_at?: string
  updated_at?: string
  department?: Department
  building?: Building
  floor?: Floor
}

//DTO เวลากลับจาก API (response)
export interface DepartmentBuildingDTO {
  id: number
  building: { id: number; build_name: string }
  floor: { id: number; floor_name: string }
  floor_number?: number | null // ✅ New floor system
}

export interface DepartmentBuildingMappingResponse {
  id: number
  department_id: number
  building_id: number
  floor_id: number
  created_at?: string
  updated_at?: string
  department?: Department
  building?: { id?: number; build_name?: string }
  floor?: { id?: number; floor_name?: string }
}

export interface DepartmentDTO {
  id: number
  name: string // ✅ Property from backend entity
  department_name: string // Legacy support
  departmentBuildings: DepartmentBuildingDTO[]
}

//DTO เวลา request (payload ส่งไป create/update)
export interface DepartmentFormPayload {
  department_name: string
  building_ids?: number[]
  floor_ids?: number[]
  mappings?: { building_id: number; floor_id?: number; floor_number?: number }[]
}

export interface DepartmentMappingResponse {
  id: number
  department_id: number
  department: { id: number; name: string }
  building?: { id?: number; build_name?: string }
  floor?: { id?: number; floor_name?: string }
  floor_number?: number | null // ✅ New floor system
}

export interface Bed {
  bed_id: number
  department_building_id: number
  patient_id?: number | null
  sensor_id?: number | null
  created_at?: string
  updated_at?: string

  // relation join
  departmentBuilding?: {
    id: number
    department?: { id: number; name: string }
    building?: { id: number; build_name: string }
    floor?: { id: number; floor_name: string } // deprecated, for backward compatibility
    floor_number?: number | null // ✅ New floor system
  }
}

export interface BedRow {
  bed_id: number
  department_building_id?: number
  department_id?: number // ✅ เพิ่ม department_id
  department_name?: string
  building_name?: string
  floor_name?: string
  departmentBuilding?: {
    department?: { name: string }
    building?: { build_name: string }
    floor?: { floor_name: string }
  }
  sensor?: { name?: string }
  patient?: { name?: string }
}
