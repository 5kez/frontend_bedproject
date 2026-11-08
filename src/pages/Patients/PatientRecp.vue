<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
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
        จัดการข้อมูลผู้ป่วย
      </q-toolbar-title>
      <!-- //enter key event -->
      <div class="row items-center">
        <q-input
          outlined
          dense
          v-model="search"
          type="text"
          placeholder="ค้นหาเลขบัตรประชาชน"
          class="q-mx-md"
          style="width: 330px"
          @keyup.enter="searchPatient(search)"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Template -->
      <q-btn
        class="q-px-md bg-white text-black"
        flat
        style="border: 1px solid #ccc"
        @click="goToPatientForm"
      >
        <div class="row items-center no-wrap">
          <span class="q-mr-sm">เพิ่มผู้ป่วย</span>
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
    </div>

    <!-- Table -->
    <div>
      <q-table
        :rows="rows"
        :columns="filteredColumns"
        row-key="id"
        separator="cell"
        class="global-table"
        flat
        bordered
        :rows-per-page-options="[5, 10, 13]"
        :pagination="{ rowsPerPage: 13, page: 1 }"
        :pagination-label="getPaginationLabel"
        rows-per-page-label="จำนวนต่อหน้า:"
      >
        <!-- ปุ่ม Action -->
        <template v-slot:body-cell-manage="props">
          <q-td :props="props">
            <q-btn
              dense
              text-color="white"
              icon="search"
              label="ข้อมูลผู้ป่วย"
              class="q-mr-xs q-mb-xs"
              size="sm"
              style="min-width: 120px; border-radius: 4px; background-color: #222d32"
              ><q-menu>
                <q-list style="min-width: 150px">
                  <q-item clickable @click="showPatientDetail(props.row)" v-close-popup>
                    <q-item-section>ข้อมูลเพิ่มเติม</q-item-section>
                  </q-item>
                  <q-item clickable @click="editData(props.row.patient_id)" v-close-popup>
                    <q-item-section>แก้ไขข้อมูล</q-item-section>
                  </q-item>

                  <q-item
                    v-if="authStore.currentUser?.role_id !== 1"
                    clickable
                    v-close-popup
                    @click="confirmDelete(props.row.patient_id)"
                  >
                    <q-item-section>ลบข้อมูล</q-item-section>
                  </q-item>
                </q-list>
              </q-menu></q-btn
            >
            <q-btn
              dense
              text-color="white"
              icon="folder_open"
              label="ประวัติการรักษา"
              class="q-mr-xs q-mb-xs"
              size="sm"
              @click="showPatientHistory(props.row)"
              style="min-width: 140px; border-radius: 4px; background-color: #222d32"
              ><!-- ประวัติรักษา -->
              <q-menu anchor="bottom right" self="top right">
                <q-list style="min-width: 450px">
                  <q-item-label
                    header
                    class="text-bold text-white q-pa-sm row justify-between items-center"
                    style="background-color: #222d32"
                  >
                    <span>ประวัติการรักษา</span>

                    <q-btn flat dense round icon="close" color="white" v-close-popup />
                  </q-item-label>

                  <q-separator />
                  <q-list style="padding-bottom: 100px">
                    <!-- ส่วนข้อมูลหลัก -->
                    <q-item-section>
                      <div class="row justify-between">
                        <q-td :props="props">
                          <q-expansion-item
                            v-for="(historyMed, idx) in historyMed.filter(
                              (item) => item.patient_id === props.row.patient_id,
                            )"
                            :key="idx"
                            expand-separator
                            icon="event"
                            :label="
                              historyMed.in_date
                                ? new Date(historyMed.in_date).toLocaleString('th-TH')
                                : '-'
                            "
                            header-class="bg-grey-2 text-dark"
                            style="width: 450px"
                          >
                            <q-card>
                              <q-card-section>
                                <div><b>รหัสการรักษา:</b> {{ historyMed.id }}</div>
                                <div>
                                  <b>ชื่อผู้ป่วย:</b> {{ getPatient(historyMed.patient_id) }}
                                </div>
                                <div>
                                  <b>วันที่เข้ารักษา:</b>
                                  {{
                                    historyMed.in_date
                                      ? new Date(historyMed.in_date).toLocaleString('th-TH')
                                      : '-'
                                  }}
                                </div>
                                <div>
                                  <b>วันที่ออก:</b>
                                  {{
                                    historyMed.out_date
                                      ? new Date(historyMed.out_date).toLocaleString('th-TH')
                                      : '-'
                                  }}
                                </div>
                                <div><b>หมายเหตุ:</b> {{ historyMed.remark || '-' }}</div>
                                <div>
                                  <b>ยืนยันการรักษาโดย:</b> {{ getUser(historyMed.update_user_id) }}
                                </div>
                              </q-card-section>
                            </q-card>
                          </q-expansion-item>
                        </q-td>
                      </div>
                    </q-item-section>

                    <div style="height: 350px"></div>
                  </q-list>
                </q-list> </q-menu
            ></q-btn>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { QTableProps } from 'quasar'
import { useRouter } from 'vue-router'
import { useDialogStore } from 'src/stores/dialogStore/dialogStore'
import type { PatientHistory, Patient, User } from 'src/models'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import { useAuthStore } from 'src/stores/authStore/authStore'
import { useHistoryPatientStore } from 'src/stores/patientStore/patientHistoryStore'
import { useUserStore } from 'src/stores/userStore/userStore'
// Import your patient store
const patientStore = usePatientStore()
const dialogStore = useDialogStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const historyPatientStore = useHistoryPatientStore()
const router = useRouter()

const goToPatientForm = () => router.push('/patientform-page') // Update redirect
const editData = (patient_id: number) => router.push(`/patientform-page/${patient_id}`) // edit
const admitData = (patient_id: number) => router.push(`/patientform-page/${patient_id}?mode=admit`) // admit
const search = ref('') // ค้นหา Patient
const historyMed = ref<PatientHistory[]>([])
const patients = ref<Patient[]>([])
const users = ref<User[]>([])

const confirmDelete = async (patient_id: number) => {
  const isConfirmed = await dialogStore.openDialog(
    'คุณต้องการลบข้อมูลนี้ใช่หรือไม่?',
    'confirm-cancel',
  )

  if (isConfirmed) {
    await patientStore.deletePatient(patient_id)
    await patientStore.fetchAllPatients()
    patients.value = patientStore.patients
  }
}

const rows = computed(() => {
  if (!search.value) return patients.value
  const keyword = search.value.toLowerCase()
  return patients.value.filter((row) => {
    const searchableFields = [row.patient_id?.toString(), row.name, row.thaiId].filter(Boolean)
    return searchableFields.join(' ').toLowerCase().includes(keyword)
  })
})

function getPaginationLabel(firstRowIndex: number, endRowIndex: number, totalRowsNumber: number) {
  return `${firstRowIndex}-${endRowIndex} จากทั้งหมด ${totalRowsNumber}`
}

async function searchPatient(thaiId: string) {
  const patient = patients.value.find((patient) => patient.thaiId === thaiId) //ต้องถูกต้องทุกตัวอักษร
  search.value = ''
  if (patient) {
    await admitData(patient.patient_id)
  } else {
    await dialogStore.openDialog('ไม่พบผู้ป่วยในระบบ', 'confirm-cancel')
  }
}

onMounted(async () => {
  // If role_id is 3, fetch all patients. Otherwise, fetch by floor.
  users.value = await userStore.fetchAllUsers()
  await historyPatientStore.getAllPatientHistorys()
  historyMed.value = historyPatientStore.PatientHistorys
  if (authStore.currentUser?.role_id === 3) {
    patientStore.patients = []
    await patientStore.fetchAllPatients()
    patients.value = patientStore.patients
  }
  if (authStore.currentUser?.role_id === 4) {
    const site = authStore.currentUser?.site_id
    if (site) {
      await patientStore.fetchAllPatientsBySite(site)
      patients.value = patientStore.patients
    } else {
      patients.value = []
    }
  }
})
const showStatusColumn = computed(() => authStore.currentUser?.role_id === 3)

const columns: QTableProps['columns'] = [
  {
    name: 'patient_id',
    label: 'รหัสผู้ป่วย',
    field: 'patient_id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'name',
    label: 'ชื่อ-นามสกุล',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'age',
    label: 'อายุ',
    field: 'birthDate',
    align: 'left',
    sortable: true,
    format: (val: string) => {
      if (!val) return '-'
      const birth = new Date(val)
      const diff = Date.now() - birth.getTime()
      const age = new Date(diff).getUTCFullYear() - 1970
      return age
    },
  },
  {
    name: 'sex',
    label: 'เพศ',
    field: 'sex',
    align: 'left',
    sortable: true,
    format: (val: string) => {
      if (val === 'M') return 'ชาย'
      if (val === 'F') return 'หญิง'
      return '-'
    },
  },
  {
    name: 'room_id',
    label: 'ห้อง',
    field: 'room_id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'tel',
    label: 'เบอร์ติดต่อญาติ',
    field: 'telFam',
    align: 'left',
    sortable: true,
    format: (val: string) => val || '-',
  },
  {
    name: 'active_case',
    label: 'สถานะ',
    field: 'status',
    align: 'left',
    sortable: true,
    format: (val: number) => (val === 1 ? 'รักษาอยู่' : 'ออกแล้ว'),
  },
  {
    name: 'manage',
    label: 'จัดการ',
    field: 'manage',
    align: 'left',
    sortable: false,
  },
]

function getPatient(patientId: number): string {
  const p = patients.value.find((x) => x.patient_id === patientId)
  return p ? p.name : '-'
}

function getUser(userId: number): string {
  const p = users.value.find((x) => x.id === userId)
  return p ? p.name + ' ' + p.last_name : '-'
}

// Use QTableProps and filter columns for status
const filteredColumns = computed<QTableProps['columns']>(() => {
  if (showStatusColumn.value) {
    return columns
  }
  return columns.filter((col) => col.name !== 'status')
})

async function showPatientDetail(row: Patient) {
  await router.push(`/patientinfo-page/${row.patient_id}`)
}

function showPatientHistory(row: Patient) {
  return row
}
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

/* .bg-page {
  background: white;
  font-family: 'Sarabun', sans-serif;
} */

.button {
  width: 100px;
  border: 1px solid black;
  border-radius: 0%;
}

.card_template {
  border: 1px solid black;
  border-radius: 2;
}

/* ✅ บังคับให้ทุกข้อความในตารางอยู่ตรงกลาง - เฉพาะหน้า PatientRecp */

:deep(.sensor-table thead tr) {
  background-color: #222d32;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  box-sizing: border-box !important;
}

:deep(.sensor-table thead th) {
  color: white;
  font-size: 16px;
  font-weight: bold;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 12px;
  text-align: center !important;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  box-sizing: border-box !important;
  vertical-align: middle;
}

:deep(.sensor-table thead th:first-child),
:deep(.sensor-table tbody td:first-child) {
  border-left: 1px solid #000;
}

:deep(.sensor-table tbody td) {
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 12px;
  text-align: center !important;
  font-size: 14px !important;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  box-sizing: border-box !important;
  vertical-align: middle;
}

:deep(.sensor-table .q-table__middle tbody tr) {
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  box-sizing: border-box !important;
  border-bottom: 1px solid #000;
}

/* ✅ เพิ่ม zebra striping - สลับสีเทา-ขาว */
:deep(.sensor-table .q-table__middle tbody tr:nth-child(even)) {
  background-color: #f5f5f5;
}

:deep(.sensor-table .q-table__middle tbody tr:nth-child(odd)) {
  background-color: #ffffff;
}

:deep(.sensor-table .q-table__middle tbody tr:hover) {
  background-color: #e3f2fd !important;
}

/* ✅ Pagination controls */
:deep(.sensor-table .q-table__bottom) {
  display: flex;
  justify-content: flex-end;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

:deep(.sensor-table .q-table__bottom .q-table__control) {
  justify-content: flex-end;
}

/* ✅ ลบกรอบของ dropdown pagination */
:deep(.sensor-table .q-table__bottom .q-field--outlined .q-field__control) {
  border: none;
}

:deep(.sensor-table .q-table__bottom .q-field__control:before) {
  border: none;
}

:deep(.sensor-table .q-table__bottom .q-field__control:after) {
  border: none;
}

/* ✅ ซ่อน scrollbar ทั้งหมด */
:deep(*) {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

:deep(*::-webkit-scrollbar) {
  width: 0px;
  background: transparent; /* Chrome/Safari/Webkit */
}

/* ✅ บังคับให้ทุกข้อความในตารางอยู่ตรงกลาง - เฉพาะหน้า PatientRecp */
:deep(.global-table td),
:deep(.global-table th),
:deep(.global-table .q-td),
:deep(.global-table .text-left),
:deep(.global-table .text-right),
:deep(.global-table .sortable) {
  text-align: center !important;
}

:deep(.global-table thead th) {
  text-align: center !important;
  font-size: 20px !important;
  font-weight: 900 !important;
}

:deep(.global-table tbody td) {
  text-align: center !important;
  font-size: 16px !important;
  font-weight: 400 !important;
}

/* ✅ Remove pagination border - PatientRecp - NUCLEAR METHOD */
:deep(.q-table__bottom) {
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* ✅ Remove table container border - THIS IS THE MAIN CULPRIT */
:deep(.q-table__container) {
  border: none !important;
}

:deep(.q-table--bordered) {
  border: none !important;
}

:deep(.global-table.q-table--bordered) {
  border: none !important;
}

/* ✅ Force remove all borders from pagination area and ALL child elements */
:deep(.q-table .q-table__bottom *) {
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
  box-shadow: none !important;
  outline: none !important;
}

/* ✅ Target ALL specific classes in pagination */
:deep(.q-table__bottom),
:deep(.q-table__control),
:deep(.q-table__separator),
:deep(.q-table__bottom-item),
:deep(.q-field--borderless),
:deep(.q-select),
:deep(.q-field),
:deep(.q-field__inner),
:deep(.q-field__control),
:deep(.q-field__control-container),
:deep(.q-field__native),
:deep(.q-field__append),
:deep(.q-select__focus-target) {
  border: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

/* ✅ Hide the separator line completely */
:deep(.q-table__separator) {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}
</style>
