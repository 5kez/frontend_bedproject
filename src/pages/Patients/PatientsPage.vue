<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <div>
          <q-icon
            v-for="size in ['md']"
            :key="size"
            :size="size"
            name="info"
            class="text-h5 q-mr-sm"
            style="display: inline-block; vertical-align: middle"
          />
        </div>
        <q-toolbar-title style="vertical-align: middle" class="form-title">
          ข้อมูลผู้ป่วย
        </q-toolbar-title>
      </div>

      <!-- ช่องค้นหา -->

      <!-- ปุ่มเพิ่มผู้ป่วย + เมนูจัดเรียง -->
      <div class="row items-center q-gutter-x-sm">
        <q-input
          outlined
          dense
          v-model="search"
          placeholder="ค้นหา"
          class="q-mr-sm"
          style="width: 330px"
          bg-color="white"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-btn
          v-if="authStore.currentUser?.role_id === 3"
          class="q-px-md bg-white text-black"
          flat
          style="border: 1px solid #ccc"
          @click="goToPatientForm"
        >
          <div class="row items-center no-wrap">
            <span class="q-mr-sm">เพิ่ม</span>
            <q-btn
              round
              icon="add"
              color="black"
              text-color="white"
              class="q-ml-sm"
              style="width: 2px; height: 2px; font-size: 10px"
            />
          </div>
        </q-btn>

        <q-btn-dropdown
          color="white"
          label="จัดเรียงตาม"
          text-color="primary"
          flat
          style="border: 1px solid #ccc"
        >
          <q-list>
            <q-item clickable v-close-popup @click="setSortOrder('asc')">
              <q-item-section>หมายเลขเตียง น้อย-มาก</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setSortOrder('desc')">
              <q-item-section>หมายเลขเตียง มาก-น้อย</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setSortOrderName('asc-name')">
              <q-item-section>ชื่อผู้ป่วย A-Z</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setSortOrderName('desc-name')">
              <q-item-section>ชื่อผู้ป่วย Z-A</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="patientStore.loading" class="text-center q-pa-lg">
      <q-spinner-dots size="50px" color="primary" />
      <div class="q-mt-md">กำลังโหลดข้อมูลผู้ป่วย...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="patientStore.error" class="text-center q-pa-lg">
      <q-icon name="error" size="50px" color="negative" />
      <div class="q-mt-md text-negative">{{ patientStore.error }}</div>
    </div>

    <!-- No Data State -->
    <div v-else-if="!patientStore.hasPatients && !patientStore.loading" class="text-center q-pa-lg">
      <q-icon name="people" size="50px" color="grey" />
      <div class="q-mt-md">ไม่มีข้อมูลผู้ป่วย</div>
    </div>

    <!-- Patient List -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="(patient, index) in displayedPatients" :key="index" class="col-12 col-md-6">
        <div class="patient-container bordered black-border">
          <!-- Header -->
          <div
            class="header-section row items-center q-pa-sm text-white border-bottom"
            style="background-color: #222d32"
          >
            <div class="col" style="font-size: 19px">
              เตียง {{ patient.bed_id }} - {{ patient.name }}
            </div>

            <q-icon v-if="patient.statusLabel === 'Critical'" name="error" color="red" size="sm" />
            <q-space />
            <q-btn dense round flat icon="more_vert">
              <q-menu>
                <q-list style="min-width: 150px">
                  <q-item clickable v-close-popup @click="viewDetails(patient.patient_id)">
                    <q-item-section>ดูข้อมูลเพิ่มเติม</q-item-section>
                  </q-item>
                  <q-item clickable @click="editData(patient.patient_id)">
                    <q-item-section>แก้ไขข้อมูล</q-item-section>
                  </q-item>

                  <q-item
                    v-if="authStore.currentUser?.role_id !== 1"
                    clickable
                    v-close-popup
                    @click="confirmDelete(patient.patient_id)"
                  >
                    <q-item-section>ลบข้อมูล</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <!-- Content -->
          <div class="row no-wrap equal-height">
            <div class="col-6 flex flex-center column q-pa-md border-right image-container">
              <q-img :src="patient.positionImage" alt="position" class="icon-img" contain />
            </div>

            <div class="col-6 flex flex-center column q-pa-md oxygen-container">
              <div class="oxygen-header">ออกซิเจนในเลือด</div>
              <div class="oxygen-number">
                {{ patientStore.getOxygenDisplay(patient.oxygen)
                }}{{
                  patient.oxygen !== -1 && patient.oxygen !== null && patient.oxygen !== undefined
                    ? '%'
                    : ''
                }}
              </div>
            </div>
          </div>

          <!-- BPM Section -->
          <div class="row border-top bmp-section">
            <div
              class="col-6 q-pa-md row items-center justify-center border-right"
              style="min-height: 80px"
            >
              <!-- <div class="text-bold">{{ patient.positionLabel }}</div> -->
              <q-btn
                color="primary"
                class="q-mb-md"
                style="width: auto; height: auto; font-size: 16px; padding: 8px 16px"
                @click="analysePatientWithAI(patient)"
              >
                <template v-slot:default>
                  <q-icon name="medical_information" class="q-mr-sm" />
                  วิเคราะห์ผู้ป่วย
                </template>
              </q-btn>
            </div>
            <div class="col-6 q-pa-md row items-center justify-center" style="min-height: 80px">
              <div class="text-h4">{{ patientStore.getHeartRateDisplay(patient.heartRate) }}</div>
              <q-icon
                v-if="
                  patient.heartRate !== -1 &&
                  patient.heartRate !== null &&
                  patient.heartRate !== undefined
                "
                name="favorite"
                color="red"
                size="md"
                class="q-ml-xs"
              />
              <span
                v-if="
                  patient.heartRate !== -1 &&
                  patient.heartRate !== null &&
                  patient.heartRate !== undefined
                "
                class="text-body1 q-ml-xs"
                >bpm</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    <AnalysisPatientDialog
      v-if="isAnalysisDialog && patientStore.currentPatient"
      :patient="patientStore.currentPatient"
      @close="isAnalysisDialog = false"
    ></AnalysisPatientDialog>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { onMounted, onActivated, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import { useAuthStore } from 'src/stores/authStore/authStore'
import { useDialogStore } from 'stores/dialogStore/dialogStore'
import { useWebSocket } from 'src/composables/useWebSocket'
import AnalysisPatientDialog from 'src/components/dialog/AnalysisPatientDialog.vue'
import type { Patient } from 'src/models'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const dialogStore = useDialogStore()
const patientStore = usePatientStore()
const authStore = useAuthStore()
const router = useRouter()
const search = ref('')
const { patientVitals } = useWebSocket()
const sortOrder = ref('asc') // ค่าเริ่มต้นเป็น A-Z
const isAnalysisDialog = ref(false)

const setSortOrder = (order: 'asc' | 'desc') => {
  sortOrder.value = order
}
const setSortOrderName = (order: 'asc-name' | 'desc-name') => {
  sortOrder.value = order
}

// ฟังก์ชันที่ใช้จัดเรียงชื่อผู้ป่วย

async function analysePatientWithAI(patient: Patient) {
  $q.loading.show({
    message: 'กำลังวิเคราะห์ผู้ป่วย...',
    spinnerColor: 'primary',
    backgroundColor: 'white',
    messageColor: 'black',
  })

  try {
    await patientStore.analysePatient(patient)
    isAnalysisDialog.value = true
  } catch (err) {
    logger.error(err)
  } finally {
    $q.loading.hide()
  }
}

// ฟังก์ชันสำหรับโหลดข้อมูลผู้ป่วย
const loadPatients = async (force = false) => {
  // ตรวจสอบว่า user login หรือยัง
  if (!authStore.isLogin) {
    await router.replace('/')
    return
  }

  try {
    // Debug ข้อมูล user ที่ login
    // logger.log('🔍 Current user:', authStore.currentUser)
    // logger.log('🔍 User role:', authStore.currentUser?.role_id)
    // logger.log('🔍 User department_id:', authStore.currentUser?.department_id)

    // Clear store เฉพาะเมื่อ force refresh
    if (force) {
      patientStore.resetStore()
    }
    if (authStore.currentUser?.role_id === 3) {
      // ถ้าเป็น role 3 (Superadmin) - แสดงผู้ป่วยทั้งหมด
      await patientStore.fetchAllActivePatients()
    } else {
      // ✅ สำหรับ role อื่นๆ ให้กรองตาม department_id ของ user ที่ login
      const departmentId = authStore.currentUser?.department_id
      // logger.log('🔍 Checking department_id:', departmentId)
      // logger.log('🔍 Is departmentId valid?', departmentId && departmentId > 0)

      if (departmentId && departmentId > 0) {
        // logger.log('📞 Calling fetchPatientsByDepartment with department_id:', departmentId)
        await patientStore.fetchPatientsByDepartment(departmentId)
        // logger.log('✅ Loaded patients for department:', departmentId, 'role:', authStore.currentUser?.role_id)
        // logger.log('📊 Total patients loaded:', patientStore.patients.length)
      } else {
        // logger.warn('⚠️ User missing department_id or invalid department_id:', departmentId)
        // logger.log('🔄 Trying to load all active patients as fallback...')
        await patientStore.fetchAllActivePatients()
        // logger.log('📊 Total fallback patients loaded:', patientStore.patients.length)
      }
    }
  } catch {
    // logger.error('Error loading patients:', error)
  }
}

// ใช้ immediate loading เพื่อไม่ให้ผู้ใช้รอ
onMounted(async () => {
  // โหลดข้อมูลทันที ไม่ต้องเช็ค cache เพื่อให้เร็วขึ้น
  await loadPatients(false)
})

onActivated(async () => {
  // ถ้ามีข้อมูลแล้วไม่ต้องโหลดใหม่
  if (patientStore.patients.length > 0) {
    return
  }

  // โหลดข้อมูลทันที
  await loadPatients(false)
})

const filteredPatients = computed(() => {
  // logger.log('🔍 Filtering patients - total:', patientStore.patients.length)
  const filtered = patientStore.patients.filter((patient) => {
    const name = patient.name.toLowerCase()
    const searchTerm = search.value.toLowerCase()
    const nameMatches = name.includes(searchTerm)

    // ✅ เช็คว่าผู้ป่วยมีเตียงโดยดูจาก bed_id (backend จะส่งมาให้แล้วถ้ามี bed)
    const hasBed = patient.bed_id && patient.bed_id > 0

    // logger.log(`👤 Patient: ${patient.name}, bed_id: ${patient.bed_id}, hasBed: ${hasBed}, nameMatches: ${nameMatches}`)

    return nameMatches && hasBed
  })

  // logger.log('✅ Filtered patients count:', filtered.length)
  return filtered
})

const sortedPatients = computed(() => {
  const patients = filteredPatients.value
  return patients.sort((a, b) => {
    const bedA = typeof a.bed_id === 'number' ? a.bed_id : parseInt(String(a.bed_id), 10)
    const bedB = typeof b.bed_id === 'number' ? b.bed_id : parseInt(String(b.bed_id), 10)

    if (sortOrder.value === 'asc') {
      return bedA - bedB
    } else if (sortOrder.value === 'desc') {
      return bedB - bedA
    } else if (sortOrder.value === 'asc-name') {
      return a.name?.localeCompare(b.name ?? '') || 0 // ตรวจสอบให้แน่ใจว่าเป็น string
    } else if (sortOrder.value === 'desc-name') {
      return b.name?.localeCompare(a.name ?? '') || 0 // ตรวจสอบให้แน่ใจว่าเป็น string
    }
    return 0 // กรณีอื่นๆ คืนค่า 0
  })
})

const displayedPatients = computed(() => {
  return sortedPatients.value.map((patient) => {
    // ใช้ข้อมูลจาก database เป็นค่า default ก่อน
    // แล้วค่อย override ด้วยข้อมูล real-time จาก WebSocket (ถ้ามี)
    const liveVitals = patientVitals.value.find((p) => p.id === patient.patient_id)

    // ถ้า WebSocket ยังไม่เชื่อมต่อหรือไม่มีข้อมูล ใช้ข้อมูลจาก database
    const finalVitals = {
      heartRate: liveVitals?.heartRate ?? patient.heartRate,
      oxygen: liveVitals?.oxygen ?? patient.oxygen,
      position: liveVitals?.position ?? patient.position,
      status: liveVitals?.status ?? patient.status,
    }

    // แปลง status ให้เป็น type ที่ถูกต้อง (0 | 1)
    const validStatus: 0 | 1 =
      finalVitals.status === 0 || finalVitals.status === 1 ? finalVitals.status : patient.status

    // แปลง position ให้เป็น type ที่ถูกต้อง (1 | 2 | 3 | 4 | 5)
    const validPosition: 1 | 2 | 3 | 4 | 5 =
      finalVitals.position >= 1 && finalVitals.position <= 5
        ? (finalVitals.position as 1 | 2 | 3 | 4 | 5)
        : patient.position

    const updatedPatient = {
      ...patient,
      heartRate: finalVitals.heartRate,
      oxygen: finalVitals.oxygen,
      position: validPosition,
      status: validStatus,
      positionLabel: patientStore.getPositionLabel(finalVitals.position),
      positionImage: patientStore.getImagePosition(finalVitals.position),
      statusLabel: patientStore.getStatusLabel(finalVitals.status),
      sexLabel: patientStore.getSexLabel(patient.sex),
      age: patientStore.calculateAge(patient.birthDate),
      // เพิ่ม indicator ว่าข้อมูลมาจากไหน (แต่ไม่แสดงใน UI)
      isLiveData: !!liveVitals,
    }
    return updatedPatient
  })
})

// ไปหน้าเพิ่ม
const goToPatientForm = () => router.push('/patientform-page')
// ไปหน้า Details
const viewDetails = (patient_id: number) => router.push(`/patientinfo-page/${patient_id}`)
// ไปหน้า แก้ไข
const editData = (patient_id: number) => router.push(`/patientform-page/${patient_id}`)
// ไปหน้า ลบ
const confirmDelete = async (patient_id: number) => {
  const isConfirmed = await dialogStore.openDialog(
    'คุณต้องการลบข้อมูลนี้ใช่หรือไม่?',
    'confirm-cancel',
  )

  if (isConfirmed) {
    await patientStore.deletePatient(patient_id)
    await router.push('/patients-page')
  }
}
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}
/* ทำให้ทุกกล่องสูงเท่ากัน */
.equal-height {
  display: flex;
  align-items: stretch;
}

/* ป้องกัน BMP Section ไม่เท่ากัน */
.bmp-section {
  display: flex;
  align-items: stretch;
  min-height: 80px;
}

/* เส้นแบ่งระหว่างไอคอนและข้อมูลออกซิเจน */
.border-right {
  border-right: 1px solid #222d32;
  box-sizing: border-box;
}

/* เส้นแบ่งระหว่างออกซิเจนและ bmp */
.border-top {
  border-top: 1px solid #222d32;
  margin-top: 0;
}

/* เส้นแบ่งระหว่าง header กับ content */
.border-bottom {
  border-bottom: 1px solid #222d32;
  margin-bottom: 0;
}

/* เส้นข้างของ bmp */
.border-left {
  border-left: 1px solid #222d32;
  box-sizing: border-box;
}

.bmp-section {
  margin-top: 0;
}

/* กล่องข้อมูล */
.patient-container {
  border: 1px solid #222d32;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  width: 100%;
  box-sizing: border-box;
}

/* กล่องออกซิเจน */
.status-box {
  border: 1px solid #222d32;
  text-align: center;
  margin: 8px;
}

/* bpm อยู่ตรงกลาง */
.row.items-center.justify-center {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.patient-img {
  width: 110px;
  /* หรือปรับขนาดตามต้องการ */
  height: auto;
  border-radius: 8px;
}

.image-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 220px;
  /* ปรับขนาดให้เท่ากัน */
  max-height: 200px;
}

/* ปรับขนาดรูปภาพให้ไม่ซูมและเท่ากัน */
.icon-img {
  width: 150%;
  max-width: 200px;
  height: auto;
  object-fit: contain;
  /* ป้องกันการซูม */
}

/* ส่วนหัวข้อ "ออกซิเจนในเลือด" */
.oxygen-header {
  font-size: 18px;
  background: #222d32;
  color: white;
  padding: 5px 10px;
  text-align: center;
  border-radius: 8px 8px 0 0;
  width: 100%;
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.2);
  /* เพิ่มเงาด้านล่าง */
}

/* ข้อมูล %SpO2 */
.oxygen-value {
  font-size: 28px;
  font-weight: bold;
  margin: 8px 0;
  margin-bottom: 12;
}

/* ทำให้กล่องออกซิเจนมีกรอบ */
.oxygen-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #333;
  /* เพิ่มเส้นกรอบ */
  border-radius: 8px;
  padding: 0px;
  background: white;
  width: 45%;
  margin: auto;
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.2);
  /* เพิ่มเงา */
}

.oxygen-number {
  font-size: 36px;

  margin-bottom: 10px;
  /* เพิ่ม margin ล่าง */
}

.black-border {
  border: 1px solid black;
}
</style>
