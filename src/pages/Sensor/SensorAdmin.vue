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
      <q-toolbar-title class="form-title"> จัดการเซนเซอร์</q-toolbar-title>

      <div class="rowcol-2">
        <q-input
          outlined
          dense
          v-model="search"
          placeholder="ค้นหา"
          class="q-mx-md"
          style="width: 330px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Add Sensor -->
      <div class="rowcol-2">
        <q-btn
          class="q-px-md bg-white text-black"
          flat
          style="border: 1px solid #ccc"
          @click="router.push('/sensorsform-page')"
        >
          <span class="q-mr-sm">เพิ่ม</span>
          <q-btn
            round
            icon="add"
            color="black"
            text-color="white"
            class="q-ml-sm"
            style="width: 2px; height: 2px; font-size: 10px"
          >
          </q-btn>
        </q-btn>
      </div>
    </div>

    <!-- Table -->
    <div>
      <q-table
        :rows="rows"
        :columns="columns"
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
              round
              dense
              color="primary"
              class="q-mr-xs"
              icon="link"
              @click="openPairDialog(props.row)"
              v-if="!props.row.bed_id"
            >
              <q-tooltip>เชื่อมต่อกับเตียง</q-tooltip>
            </q-btn>
            <q-btn
              round
              dense
              color="orange"
              class="q-mr-xs"
              icon="sync_alt"
              @click="openTransferDialog(props.row)"
              v-if="props.row.bed_id"
            >
              <q-tooltip>ย้ายไปเตียงอื่น</q-tooltip>
            </q-btn>
            <q-btn
              round
              dense
              color="primary"
              class="q-mr-xs"
              icon="create"
              @click="router.push({ name: 'SensorForm', query: { id: props.row.id } })"
            >
              <q-tooltip>แก้ไข</q-tooltip>
            </q-btn>
            <q-btn round dense color="negative" icon="delete" @click="confirmDelete(props.row.id)">
              <q-tooltip>ลบ</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>

      <!-- Pair Sensor with Bed Dialog -->
      <q-dialog v-model="pairSensorBedDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">เชื่อมเซนเซอร์กับเตียง</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <div class="q-mb-md" v-if="selectedSensorForPair">
              <strong>เซนเซอร์:</strong> {{ selectedSensorForPair.name }}
            </div>
            <div class="q-mb-md text-body2 text-grey-7">เลือกเตียงที่จะเชื่อมกับเซนเซอร์นี้:</div>
            <q-select
              v-model="pairTargetBedId"
              :options="availableBedsForPair"
              option-value="value"
              option-label="label"
              label="เลือกเตียง"
              outlined
              dense
              emit-value
              map-options
            />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="ยกเลิก" color="grey" v-close-popup />
            <q-btn
              label="เชื่อม"
              color="primary"
              @click="confirmPair"
              :disable="!pairTargetBedId"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Transfer Sensor Dialog -->
      <q-dialog v-model="transferDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">ย้ายเซนเซอร์ไปเตียงอื่น</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>

          <q-card-section>
            <div class="q-mb-md" v-if="selectedSensorForTransfer">
              <strong>เซนเซอร์:</strong> {{ selectedSensorForTransfer.name }}
            </div>
            <q-select
              v-model="transferTargetBedId"
              :options="availableBedsForTransfer"
              option-value="value"
              option-label="label"
              label="เลือกเตียงปลายทาง"
              outlined
              dense
              emit-value
              map-options
              class="q-mb-md"
            />
            <div>
              <q-btn
                label="ยกเลิกการเชื่อมต่อ"
                color="negative"
                @click="unpairFromTransferDialog"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="ยกเลิก" color="grey" v-close-popup />
            <q-btn
              label="ย้าย"
              color="orange"
              @click="confirmTransfer"
              :disable="!transferTargetBedId"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <confirmDialog v-if="showDialog" @close="showDialog = false" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, computed, onMounted } from 'vue'
import type { QTableProps } from 'quasar'
import type { Sensor } from 'src/models'
import confirmDialog from 'src/components/dialog/ConfirmDialog.vue'
import { useRouter } from 'vue-router'
import { useSensorStore } from 'src/stores/sensorStore/sensorStore'
import { useDialogStore } from 'src/stores/dialogStore/dialogStore'
import { useBedStore } from 'src/stores/bedStore/bedStore'
import { useAuthStore } from 'src/stores/authStore/authStore'

const authStore = useAuthStore()
const pairSensorBedDialog = ref(false)
const transferDialog = ref(false)
const showDialog = ref(false)
const router = useRouter()
const sensorStore = useSensorStore()
const dialogStore = useDialogStore()
const bedStore = useBedStore()
const sensors = ref<Sensor[]>([])
const selectedSensorForPair = ref<Sensor | null>(null)
const selectedSensorForTransfer = ref<Sensor | null>(null)
const transferTargetBedId = ref<number | null>(null)
const pairTargetBedId = ref<number | null>(null)

// Computed for available beds for transfer
const availableBedsForTransfer = computed(() => {
  if (!selectedSensorForTransfer.value) return []

  return bedStore.beds
    .filter((bed) => {
      // ไม่แสดงเตียงปัจจุบันที่เซนเซอร์เชื่อมอยู่
      const currentBedId =
        selectedSensorForTransfer.value?.bed_id ?? selectedSensorForTransfer.value?.bed?.bed_id
      if (bed.bed_id === currentBedId) return false

      // ตรวจสอบว่าเตียงนั้นมี sensor type เดียวกันแล้วหรือไม่
      const existingSensorsOfSameType = sensors.value.filter(
        (sensor) =>
          // sensors from /sensors/site/:id carry bed_id but no `bed` relation,
          // so this check never matched and every bed was offered
          (sensor.bed_id ?? sensor.bed?.bed_id) === bed.bed_id &&
          sensor.sensorType_Id === selectedSensorForTransfer.value?.sensorType_Id,
      )

      return existingSensorsOfSameType.length === 0
    })
    .map((bed) => ({
      label: `เตียง ${bed.bed_id} - ${bed.departmentBuilding?.department?.name || 'ไม่มีแผนก'}`,
      value: bed.bed_id,
    }))
})

// Computed for available beds for pairing
const availableBedsForPair = computed(() => {
  if (!selectedSensorForPair.value) return []

  return bedStore.beds
    .filter((bed) => {
      // ตรวจสอบว่าเตียงนั้นมี sensor type เดียวกันแล้วหรือไม่
      const existingSensorsOfSameType = sensors.value.filter(
        (sensor) =>
          // sensors from /sensors/site/:id carry bed_id but no `bed` relation,
          // so this check never matched and every bed was offered
          (sensor.bed_id ?? sensor.bed?.bed_id) === bed.bed_id &&
          sensor.sensorType_Id === selectedSensorForPair.value?.sensorType_Id,
      )

      return existingSensorsOfSameType.length === 0
    })
    .map((bed) => ({
      label: `เตียง ${bed.bed_id} - ${bed.departmentBuilding?.department?.name || 'ไม่มีแผนก'}`,
      value: bed.bed_id,
    }))
})

// ค้นหา Sensor
const search = ref('')
const rows = computed(() => {
  if (!search.value) return sensors.value
  const keyword = search.value.toString().toLowerCase()
  return sensors.value.filter((row) => {
    // สร้าง searchable string จาก fields ที่เป็น primitive values
    const searchableFields = [
      row.id?.toString(),
      row.name,
      row.mac,
      row.desc,
      row.sensorStatus,
      row.patientId?.toString(),
      row.patient?.name,
      row.patient?.patient_id?.toString(),
    ].filter(Boolean) // กรองค่า null/undefined ออก

    const rowString = searchableFields.join(' ').toLowerCase()
    return rowString.includes(keyword)
  })
})

const confirmDelete = async (id: number) => {
  const isConfirmed = await dialogStore.openDialog(
    'คุณต้องการลบข้อมูลนี้ใช่หรือไม่?',
    'confirm-cancel',
  )
  if (isConfirmed) {
    await sensorStore.deleteSensor(id)
    await sensorStore.getSensorsBySite(authStore.currentUser?.site_id || 0)
    sensors.value = sensorStore.sensors
  }
}

const openPairDialog = (sensor: Sensor) => {
  selectedSensorForPair.value = sensor
  pairTargetBedId.value = null
  pairSensorBedDialog.value = true
}

const confirmPair = async () => {
  if (!selectedSensorForPair.value || !pairTargetBedId.value) return

  try {
    const success = await sensorStore.assignToBed(
      selectedSensorForPair.value.id,
      pairTargetBedId.value,
    )

    if (success) {
      await sensorStore.getSensorsBySite(authStore.currentUser?.site_id || 0)
      sensors.value = sensorStore.sensors
      pairSensorBedDialog.value = false
      pairTargetBedId.value = null
      selectedSensorForPair.value = null
    }
  } catch (error) {
    logger.error('Error pairing sensor to bed:', error)
  }
}

const unpairFromBed = async (sensor: Sensor) => {
  const isConfirmed = await dialogStore.openDialog(
    `ต้องการยกเลิกการเชื่อมต่อเซนเซอร์ "${sensor.name}" กับเตียงหรือไม่?`,
    'confirm-cancel',
  )

  if (!isConfirmed) return

  try {
    await sensorStore.removeFromBed(sensor.id)
    await sensorStore.getSensorsBySite(authStore.currentUser?.site_id || 0)
    sensors.value = sensorStore.sensors
  } catch (error) {
    logger.error('Error unpairing sensor from bed:', error)
  }
}

const unpairFromTransferDialog = async () => {
  if (!selectedSensorForTransfer.value) return

  // ปิด transfer dialog ก่อน
  transferDialog.value = false

  // เรียกใช้ function unpairFromBed (มี confirmation dialog อยู่ในนั้นแล้ว)
  await unpairFromBed(selectedSensorForTransfer.value)
}

const openTransferDialog = (sensor: Sensor) => {
  // logger.log('🔍 Sensor object for transfer:', sensor)
  // logger.log('🔍 Sensor.bed:', sensor.bed)
  selectedSensorForTransfer.value = sensor
  transferTargetBedId.value = null
  transferDialog.value = true
}

const closeTransferDialog = () => {
  transferDialog.value = false
  selectedSensorForTransfer.value = null
  transferTargetBedId.value = null
}

const confirmTransfer = async () => {
  if (!selectedSensorForTransfer.value || !transferTargetBedId.value) return

  try {
    // ใช้ API assignToBed เพื่อย้ายไปเตียงใหม่
    const success = await sensorStore.assignToBed(
      selectedSensorForTransfer.value.id,
      transferTargetBedId.value,
    )

    if (success) {
      await sensorStore.getSensorsBySite(authStore.currentUser?.site_id || 0)
      sensors.value = sensorStore.sensors
      closeTransferDialog()
    }
  } catch (error) {
    logger.error('Error transferring sensor to bed:', error)
  }
}

// ✅ ฟังก์ชันสำหรับแสดงข้อความ pagination เป็นภาษาไทย
function getPaginationLabel(firstRowIndex: number, endRowIndex: number, totalRowsNumber: number) {
  return `${firstRowIndex}-${endRowIndex} จากทั้งหมด ${totalRowsNumber}`
}

onMounted(async () => {
  await sensorStore.getSensorsBySite(authStore.currentUser?.site_id || 0)
  await sensorStore.getSensorType()
  await bedStore.fetchBeds() // เพิ่มการโหลดข้อมูลเตียง
  sensors.value = sensorStore.sensors

  // logger.log('📊 Sensors data:', sensors.value)
  // logger.log('🔍 First sensor:', sensors.value[0])

  // Check if sensors have bed relationships
  const sensorsWithBeds = sensors.value.filter((s) => s.bed)
  // logger.log('🏥 Sensors with beds:', sensorsWithBeds.length)
  if (sensorsWithBeds.length > 0) {
    // logger.log('🏥 Example sensor with bed:', sensorsWithBeds[0])
  }
})

// columns Table
const columns: QTableProps['columns'] = [
  {
    name: 'id',
    label: 'รหัสเซนเซอร์',
    field: 'id',
    align: 'center',
    sortable: true,
  },
  {
    name: 'name',
    label: 'ชื่อเซนเซอร์',
    field: 'name',
    align: 'center',
    sortable: true,
  },
  {
    name: 'mac',
    label: 'Mac Address',
    field: 'mac',
    align: 'center',
    sortable: true,
  },
  {
    name: 'sensorType_Id',
    label: 'ประเภทเซนเซอร์',
    field: 'sensorType_Id',
    align: 'center',
    sortable: true,
    format: (val) => {
      const type = sensorStore.sensorsType.find((t) => t.id === val)
      return type ? type.name : '-'
    },
  },
  {
    name: 'bedInfo',
    label: 'เตียงที่เชื่อมต่อ',
    field: (row) => {
      // ตรวจสอบจาก bed_id ก่อน
      if (row.bed_id) {
        // ถ้ามี bed relation object
        if (row.bed && row.bed.bed_id) {
          const deptName = row.bed.departmentBuilding?.department?.name || 'ไม่มีแผนก'
          return `เตียง ${row.bed.bed_id} - ${deptName}`
        }
        // ถ้ามีแค่ bed_id
        return `เตียง ${row.bed_id}`
      }
      return 'ยังไม่ได้เชื่อมต่อ'
    },
    align: 'center',
    sortable: true,
  },
  {
    name: 'manage',
    label: 'จัดการ',
    field: 'id',
    align: 'center',
    sortable: false,
  },
]
</script>

<style scoped>
.button {
  width: 100px;
  border: 1px solid black;
  border-radius: 0%;
}

.card_template {
  border: 1px solid black;
  border-radius: 2;
}

/* .bg-page {
  background: white;
  font-family: 'Sarabun', sans-serif;
} */

.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

/* ✅ เพิ่ม styling เหมือน sensor table - คัดลอกจาก NotificationHistory */
:deep(.sensor-table) {
  border: 1px solid #000;
  border-radius: 0;
  width: 100%;
  font-family: 'Sarabun', sans-serif;
  min-height: 600px;
}

:deep(.sensor-table thead tr) {
  background-color: #222d32;
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
  vertical-align: middle;
  box-sizing: border-box;
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
  vertical-align: middle;
  box-sizing: border-box !important;
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

/* ✅ Remove table container border - SensorAdmin */
:deep(.q-table__container) {
  border: none !important;
}

:deep(.q-table--bordered) {
  border: none !important;
}

:deep(.global-table.q-table--bordered) {
  border: none !important;
}

/* ✅ Remove pagination border - SensorAdmin */
:deep(.q-table__bottom) {
  border: none !important;
}

/* ✅ Hide the separator line completely */
:deep(.q-table__separator) {
  display: none !important;
}

/* ✅ Make headers larger and bolder */
:deep(.global-table thead th) {
  font-size: 20px !important;
  font-weight: 900 !important;
}

:deep(.global-table tbody td) {
  font-size: 16px !important;
  font-weight: 400 !important;
}
</style>
