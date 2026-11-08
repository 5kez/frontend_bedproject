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
        จัดการเตียง
      </q-toolbar-title>

      <div class="row items-center">
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

      <!-- ปุ่มเพิ่มเตียงใหม่ (Admin เท่านั้น) -->
      <q-btn
        v-if="isAdmin"
        class="q-px-md bg-white text-black"
        flat
        style="border: 1px solid #ccc"
        @click="$router.push('/bed-form')"
      >
        <div class="row items-center no-wrap">
          <span class="q-mr-sm">เพิ่มเตียงใหม่</span>
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
        :rows="filteredBeds"
        :columns="columns"
        row-key="bed_id"
        separator="cell"
        class="global-table"
        flat
        bordered
        :rows-per-page-options="[5, 10, 13]"
        :pagination="{ rowsPerPage: 13, page: 1 }"
        :pagination-label="getPaginationLabel"
        binary-state-sort
        rows-per-page-label="จำนวนต่อหน้า:"
      >
        <!-- Toggle Status -->
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <q-toggle
              v-model="props.row.status"
              true-value="Active"
              false-value="Inactive"
              color="blue"
            />
          </q-td>
        </template>

        <!-- ปุ่ม Action -->
        <!--เชื่อมผู้ป่วยกับเตียงเฉพาะ-->
        <template v-slot:body-cell-manage="props">
          <q-td :props="props">
            <!-- ปุ่มเชื่อมผู้ป่วย -->
            <q-btn
              round
              dense
              color="primary"
              icon="person_add"
              @click="assignPatient(props.row)"
              class="q-mr-xs"
              v-if="!props.row.patient?.name"
            >
              <q-tooltip>เชื่อมผู้ป่วยกับเตียง</q-tooltip>
            </q-btn>

            <!-- ปุ่มย้ายผู้ป่วย -->
            <q-btn
              round
              dense
              color="orange"
              icon="sync_alt"
              @click="transferPatient(props.row)"
              class="q-mr-xs"
              v-if="props.row.patient?.name"
            >
              <q-tooltip>ย้ายผู้ป่วยไปเตียงอื่น</q-tooltip>
            </q-btn>

            <!-- ปุ่มแก้ไขเตียง (Admin เท่านั้น) -->
            <q-btn
              v-if="isAdmin"
              round
              dense
              color="primary"
              icon="create"
              @click="$router.push(`/bed-form/${props.row.bed_id}`)"
              class="q-mr-xs"
            >
              <q-tooltip>แก้ไขข้อมูลเตียง</q-tooltip>
            </q-btn>

            <!-- ปุ่มลบเตียง (Admin เท่านั้น) -->
            <q-btn
              v-if="isAdmin"
              round
              dense
              color="negative"
              icon="delete"
              @click="deleteBed(props.row)"
            >
              <q-tooltip>ลบเตียง</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- Dialog สำหรับเชื่อมผู้ป่วยกับเตียง -->
    <q-dialog v-model="showAssignDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">เชื่อมผู้ป่วยกับเตียง {{ selectedBed?.bed_id }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-mb-md text-body2 text-grey-7">เลือกผู้ป่วยที่จะเชื่อมกับเตียงนี้:</div>
          <div v-if="availablePatients.length === 0" class="text-center q-pa-md">
            <q-icon name="info" color="grey" size="3em" />
            <div class="text-h6 q-mt-md text-grey">ไม่มีข้อมูลผู้ป่วย</div>
            <div class="text-body2 text-grey-6">
              กรุณาเพิ่มข้อมูลผู้ป่วยในระบบก่อน หรือติดต่อผู้ดูแลระบบ
            </div>
          </div>
          <q-select
            v-else
            v-model="selectedPatient"
            :options="availablePatients"
            option-value="value"
            option-label="label"
            label="เลือกผู้ป่วย"
            outlined
            dense
            class="q-mb-md"
            clearable
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey"> ไม่มีผู้ป่วยที่ยังไม่ได้ใช้งาน </q-item-section>
              </q-item>
            </template>

            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.patient.name }}</q-item-label>
                  <q-item-label caption
                    >{{ scope.opt.patient.hn }} |
                    {{ scope.opt.patient.department_name || '-' }}</q-item-label
                  >
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="ยกเลิก" color="grey" v-close-popup />
          <q-btn
            label="เชื่อม"
            color="primary"
            @click="confirmAssignPatient"
            :disable="!selectedPatient || availablePatients.length === 0"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog สำหรับย้ายผู้ป่วย -->
    <q-dialog v-model="showTransferDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">ย้ายผู้ป่วยจากเตียง {{ selectedBed?.bed_id }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-mb-md">
            <strong>ผู้ป่วยปัจจุบัน:</strong> {{ selectedBed?.patient?.name }}
          </div>
          <q-select
            v-model="targetBedId"
            :options="availableBedsOptions"
            option-value="value"
            option-label="label"
            label="เลือกเตียงปลายทาง"
            outlined
            dense
            class="q-mb-md"
          />
          <div>
            <q-btn
              label="เอาผู้ป่วยออก"
              color="negative"
              @click="removePatientFromTransferDialog"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="ยกเลิก" color="grey" v-close-popup />
          <q-btn
            label="ย้าย"
            color="orange"
            @click="confirmTransferPatient"
            :disable="!targetBedId"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, computed, onMounted } from 'vue'
import type { QTableProps } from 'quasar'
import type { BedRow, Patient } from 'src/models'
import { useBedStore } from 'src/stores/bedStore/bedStore'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import { useAuthStore } from 'src/stores/authStore/authStore'
import { useDialogStore } from 'src/stores/dialogStore/dialogStore'
import { Notify } from 'quasar'

const bedStore = useBedStore()
const patientStore = usePatientStore()
const authStore = useAuthStore()
const dialogStore = useDialogStore()

// Computed properties สำหรับสิทธิ์
const isAdmin = computed(() => {
  return authStore.currentUser?.role_id === 2 || authStore.currentUser?.role_id === 3
})
const beds = ref<BedRow[]>([])

// Patient assignment variables
const showAssignDialog = ref(false)
const showTransferDialog = ref(false)
const selectedBed = ref<BedRow | null>(null)
const selectedPatient = ref<{ label: string; value: number; patient: Patient } | null>(null)
const targetBedId = ref<number | { label: string; value: number } | null>(null)
const isProcessing = ref(false)

// ค้นหา
const search = ref('')
const filteredBeds = computed(() => {
  if (!search.value) return beds.value
  const keyword = search.value.toLowerCase()
  return beds.value.filter((row) => {
    const searchableFields = [
      row.bed_id?.toString(),
      row.department_name,
      row.building_name,
      row.floor_name,
    ].filter(Boolean)
    return searchableFields.join(' ').toLowerCase().includes(keyword)
  })
})

// Available patients (ผู้ป่วยที่ยังไม่ได้อยู่ในเตียงใด และ department ตรงกับเตียง)
const availablePatients = computed(() => {
  // ใช้ข้อมูลผู้ป่วยจาก patient store
  const allPatients = patientStore.patients

  // หาผู้ป่วยที่ถูกใช้แล้วจากระบบ (format: "ผู้ป่วย ID: X")
  const usedPatientIds = beds.value
    .filter((bed) => bed.patient?.name)
    .map((bed) => {
      const match = bed.patient?.name?.match(/ผู้ป่วย ID: (\d+)/)
      return match ? parseInt(match[1] || '0') : null
    })
    .filter((id) => id !== null)

  // ✅ กรองผู้ป่วยที่ยังไม่ได้ใช้ และ department_id ตรงกับเตียงที่เลือก
  return allPatients
    .filter((patient) => {
      if (!patient.patient_id || usedPatientIds.includes(patient.patient_id)) {
        return false
      }
      // ✅ เช็คว่า department_id ของผู้ป่วยตรงกับเตียงหรือไม่
      if (selectedBed.value) {
        return patient.department_id === selectedBed.value.department_id
      }
      return true
    })
    .map((patient) => {
      // ใช้ department_name จากเตียงที่เลือก
      const deptName = selectedBed.value?.department_name || 'ไม่ระบุ'

      return {
        label: `${patient.name} (ID: ${patient.patient_id})`,
        value: patient.patient_id,
        patient: {
          id: patient.patient_id,
          name: patient.name,
          hn: `ID-${patient.patient_id}`,
          department_name: deptName,
        },
      }
    })
})

// Assign patient function
const assignPatient = (bed: BedRow) => {
  selectedBed.value = bed
  showAssignDialog.value = true
  selectedPatient.value = null
}

const transferPatient = (bed: BedRow) => {
  selectedBed.value = bed
  showTransferDialog.value = true
  targetBedId.value = null
}

const removePatient = async (bed: BedRow) => {
  // แสดง confirmation dialog
  const isConfirmed = await dialogStore.openDialog(
    `ต้องการเอาผู้ป่วย "${bed.patient?.name}" ออกจากเตียง ${bed.bed_id} หรือไม่?`,
    'confirm-cancel',
  )

  if (!isConfirmed) return

  isProcessing.value = true
  try {
    // เรียก API เพื่อลบผู้ป่วยออกจากเตียง
    await bedStore.removePatientFromBed(bed.bed_id)

    // อัปเดตข้อมูลใน frontend
    const bedIndex = beds.value.findIndex((b) => b.bed_id === bed.bed_id)
    if (bedIndex !== -1) {
      const currentBed = beds.value[bedIndex]
      if (currentBed) {
        // สร้าง object ใหม่โดยไม่มี patient property
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { patient: _, ...bedWithoutPatient } = currentBed
        beds.value[bedIndex] = bedWithoutPatient as BedRow
      }
    }

    // แสดง notification สำเร็จ
    Notify.create({
      type: 'positive',
      message: `เอาผู้ป่วยออกจากเตียง ${bed.bed_id} เรียบร้อยแล้ว`,
    })
  } catch (error) {
    logger.error('Error removing patient:', error)
    Notify.create({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการเอาผู้ป่วยออก',
    })
  } finally {
    isProcessing.value = false
  }
}

const removePatientFromTransferDialog = async () => {
  if (!selectedBed.value) return

  // ปิด transfer dialog ก่อน
  showTransferDialog.value = false

  // เรียกใช้ function removePatient (มี confirmation dialog อยู่ในนั้นแล้ว)
  await removePatient(selectedBed.value)
}

// Computed สำหรับตัวเลือกเตียงที่ว่าง (และ department ตรงกัน)
const availableBedsOptions = computed(() => {
  const availableBeds = beds.value
    .filter((bed) => {
      const isEmpty = !bed.patient?.name
      const isDifferentBed = bed.bed_id !== selectedBed.value?.bed_id
      // ✅ เช็ค department_id ตรงกันด้วย
      const sameDepartment = selectedBed.value
        ? bed.department_id === selectedBed.value.department_id
        : true
      return isEmpty && isDifferentBed && sameDepartment
    })
    .map((bed) => ({
      label: `เตียง ${bed.bed_id} - ${bed.department_name}`,
      value: bed.bed_id,
    }))

  return availableBeds
})

const confirmTransferPatient = async () => {
  if (!selectedBed.value || !targetBedId.value) return

  isProcessing.value = true
  try {
    // ตรวจสอบ type ของ targetBedId.value
    const targetId =
      typeof targetBedId.value === 'object' && targetBedId.value !== null
        ? (targetBedId.value as { value: number }).value
        : targetBedId.value

    // ✅ หาข้อมูลเตียงปลายทาง
    const targetBed = beds.value.find((b) => b.bed_id === targetId)
    if (!targetBed) {
      Notify.create({
        type: 'negative',
        message: 'ไม่พบข้อมูลเตียงปลายทาง',
      })
      return
    }

    // ✅ เช็คว่า department_id ตรงกันหรือไม่
    const targetDeptId = targetBed.department_id
    const sourceDeptId = selectedBed.value.department_id
    if (targetDeptId !== sourceDeptId) {
      Notify.create({
        type: 'negative',
        message: `ไม่สามารถย้ายได้: เตียงต้นทางอยู่แผนก ${sourceDeptId} ไม่ตรงกับเตียงปลายทางแผนก ${targetDeptId}`,
      })
      return
    }

    // เก็บข้อมูลผู้ป่วยปัจจุบันก่อนย้าย
    const currentPatientInfo = selectedBed.value.patient

    // เรียก API เพื่อย้ายผู้ป่วย
    await bedStore.transferPatient(selectedBed.value.bed_id, targetId)

    // อัปเดตข้อมูลใน frontend
    const sourceBedIndex = beds.value.findIndex((b) => b.bed_id === selectedBed.value!.bed_id)
    const targetBedIndex = beds.value.findIndex((b) => b.bed_id === targetId)

    if (sourceBedIndex !== -1) {
      const sourceBed = beds.value[sourceBedIndex]
      if (sourceBed) {
        // ลบผู้ป่วยจากเตียงต้นทาง
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { patient, ...bedWithoutPatient } = sourceBed
        beds.value[sourceBedIndex] = bedWithoutPatient as BedRow
      }
    }

    if (targetBedIndex !== -1 && currentPatientInfo) {
      const targetBed = beds.value[targetBedIndex]
      if (targetBed) {
        // เพิ่มผู้ป่วยไปเตียงปลายทาง
        beds.value[targetBedIndex] = {
          ...targetBed,
          patient: currentPatientInfo,
        } as BedRow
      }
    }

    showTransferDialog.value = false

    // Reset form
    targetBedId.value = null
  } catch (error) {
    logger.error('Error transferring patient:', error)
  } finally {
    isProcessing.value = false
  }
}

const confirmAssignPatient = async () => {
  if (!selectedBed.value || !selectedPatient.value) return

  isProcessing.value = true
  try {
    // หาข้อมูลผู้ป่วยจาก patient store
    const selectedPatientData = patientStore.patients.find(
      (p) => p.patient_id === selectedPatient.value!.value,
    )
    if (!selectedPatientData) {
      logger.error('ไม่พบข้อมูลผู้ป่วย')
      return
    }

    // ✅ เช็คว่า department_id ตรงกันหรือไม่
    const patientDeptId = selectedPatientData.department_id
    const bedDeptId = selectedBed.value.department_id
    if (patientDeptId !== bedDeptId) {
      Notify.create({
        type: 'negative',
        message: `ไม่สามารถเชื่อมได้: ผู้ป่วยอยู่แผนก ${patientDeptId} ไม่ตรงกับเตียงแผนก ${bedDeptId}`,
      })
      return
    }

    // เรียก API เพื่ออัปเดต database
    await bedStore.assignPatientToBed(selectedBed.value.bed_id, selectedPatientData.patient_id)

    // อัปเดตข้อมูลเตียงใน frontend
    const bedIndex = beds.value.findIndex((b) => b.bed_id === selectedBed.value!.bed_id)
    if (bedIndex !== -1) {
      const currentBed = beds.value[bedIndex]
      if (currentBed) {
        beds.value[bedIndex] = {
          ...currentBed,
          patient_id: selectedPatientData.patient_id,
          patient: { name: `${selectedPatientData.name} (ID: ${selectedPatientData.patient_id})` },
        } as BedRow
      }
    }

    showAssignDialog.value = false

    // Reset form
    selectedPatient.value = null
  } catch (error: unknown) {
    logger.error('Error assigning patient:', error)

    // แสดง error message ที่เหมาะสม
    let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมผู้ป่วย'

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      if (axiosError.response?.data?.message) {
        const message = axiosError.response.data.message
        if (message.includes('already occupied')) {
          errorMessage = 'เตียงนี้มีผู้ป่วยอยู่แล้ว กรุณาเลือกเตียงอื่น'
        } else if (message.includes('not found')) {
          errorMessage = 'ไม่พบข้อมูลเตียงหรือผู้ป่วย'
        } else {
          errorMessage = message
        }
      }
    }

    // แสดง error notification (ใช้ Quasar Notify)
    // $q.notify({
    //   type: 'negative',
    //   message: errorMessage,
    //   position: 'top'
    // })

    alert(errorMessage) // ใช้ alert ชั่วคราว
  } finally {
    isProcessing.value = false
  }
}

const deleteBed = async (bed: BedRow) => {
  if (bed.patient?.name) {
    Notify.create({
      type: 'warning',
      message: 'ไม่สามารถลบเตียงที่มีผู้ป่วยอยู่ได้ กรุณาย้ายผู้ป่วยออกก่อน',
    })
    return
  }

  const isConfirmed = await dialogStore.openDialog(
    `ต้องการลบเตียง ${bed.bed_id} หรือไม่?`,
    'confirm-cancel',
  )

  if (!isConfirmed) return

  isProcessing.value = true
  try {
    await bedStore.deleteBed(bed.bed_id)

    // ลบจาก frontend
    const bedIndex = beds.value.findIndex((b) => b.bed_id === bed.bed_id)
    if (bedIndex !== -1) {
      beds.value.splice(bedIndex, 1)
    }

    Notify.create({
      type: 'positive',
      message: `ลบเตียง ${bed.bed_id} เรียบร้อยแล้ว`,
    })
  } catch (error) {
    logger.error('Error deleting bed:', error)
    Notify.create({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการลบเตียง',
    })
  } finally {
    isProcessing.value = false
  }
}

function getPaginationLabel(firstRowIndex: number, endRowIndex: number, totalRowsNumber: number) {
  return `${firstRowIndex}-${endRowIndex} จากทั้งหมด ${totalRowsNumber}`
}

onMounted(async () => {
  logger.log('🏥 BedManagement onMounted started')
  logger.log('🛒 bedStore:', bedStore)
  logger.log('🛒 bedStore.fetchBeds:', typeof bedStore.fetchBeds)
  try {
    const userDepartmentId = authStore.currentUser?.department_id
    const userRoleId = authStore.currentUser?.role_id
    logger.log('👤 User info:', { userDepartmentId, userRoleId })

    // ถ้าเป็น Admin (role_id 2 หรือ 3) ให้ดึงข้อมูลทั้งหมด
    if (userRoleId === 2 || userRoleId === 3) {
      logger.log('🔑 Loading all data for admin')
      logger.log('📞 Calling bedStore.fetchBeds()...')
      const bedsPromise = bedStore.fetchBeds()
      logger.log('📞 Calling patientStore.fetchAllPatients()...')
      // force: the layout already loaded only the admin's own department, which
      // left beds in other departments with nobody to assign
      const patientsPromise = patientStore.fetchAllPatients(true)
      logger.log('⏳ Waiting for both promises...')
      await Promise.all([bedsPromise, patientsPromise])
      logger.log('✅ Both promises completed')
    } else if (userDepartmentId) {
      // ดึงข้อมูลเฉพาะ department ของ user ที่ login
      logger.log('🏢 Loading data for department:', userDepartmentId)
      await Promise.all([
        bedStore.fetchBedsByDepartment(userDepartmentId),
        patientStore.fetchPatientsByDepartment(userDepartmentId),
      ])
    } else {
      // ถ้าไม่มี department_id และไม่ใช่ Admin ให้ดึงข้อมูลทั้งหมด
      logger.log('📊 Loading all data (fallback)')
      await Promise.all([bedStore.fetchBeds(), patientStore.fetchAllPatients()])
    }

    logger.log('🛏️ Beds from store:', bedStore.beds.length)
    beds.value = bedStore.beds.map((b) => ({
      bed_id: b.bed_id,
      department_building_id: b.department_building_id,
      ...(b.departmentBuilding?.department?.id !== undefined && {
        department_id: b.departmentBuilding.department.id,
      }),
      department_name: b.departmentBuilding?.department?.name ?? '-',
      building_name: b.departmentBuilding?.building?.build_name ?? '-',
      // ✅ แสดง floor_number แทน floor_name
      floor_name: b.departmentBuilding?.floor_number
        ? `ชั้น ${b.departmentBuilding.floor_number}`
        : '-',
      ...(b.patient_id && { patient: { name: `ผู้ป่วย ID: ${b.patient_id}` } }),
    }))
    logger.log('✅ Mapped beds.value:', beds.value.length)
  } catch (error) {
    logger.error('❌ Error loading data:', error)
  }
})

const columns: QTableProps['columns'] = [
  {
    name: 'id',
    label: 'หมายเลขเตียง',
    field: (row: BedRow) => row.bed_id,
    align: 'center',
    sortable: true,
  },
  {
    name: 'department',
    label: 'แผนก',
    field: (row: BedRow) => row.department_name || '-',
    align: 'center',
    sortable: true,
  },
  {
    name: 'building',
    label: 'ตึก',
    field: (row: BedRow) => row.building_name || '-',
    align: 'center',
    sortable: true,
  },
  {
    name: 'floor',
    label: 'ชั้น',
    field: (row: BedRow) => row.floor_name || '-',
    align: 'center',
    sortable: true,
  },
  {
    name: 'patient',
    label: 'ผู้ป่วย',
    field: (row: BedRow) => row.patient?.name || 'ไม่มีผู้ป่วย',
    align: 'center',
    sortable: true,
  },
  {
    name: 'manage',
    label: 'จัดการ',
    field: 'bed_id',
    align: 'center',
  },
]
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

/* ✅ ULTIMATE FORCE - This WILL work */
::v-deep(.q-table thead th) {
  color: white !important;
  font-size: 20px !important;
  font-weight: 900 !important;
  background-color: #222d32 !important;
  text-align: center !important;
}

::v-deep(.q-table tbody td) {
  font-size: 16px !important;
  font-weight: 400 !important;
  text-align: center !important;
}

/* ✅ Hide pagination border in this page */
::v-deep(.q-table__bottom) {
  border: none !important;
  border-top: none !important;
  border-bottom: none !important;
  border-left: none !important;
  border-right: none !important;
}

/* ✅ Remove table container border - BedManagement */
::v-deep(.q-table__container) {
  border: none !important;
}

::v-deep(.q-table--bordered) {
  border: none !important;
}

::v-deep(.global-table.q-table--bordered) {
  border: none !important;
}

/* ✅ Hide the separator line completely */
::v-deep(.q-table__separator) {
  display: none !important;
}

/* ✅ Another approach with higher specificity */
.q-table >>> thead th {
  color: white !important;
  font-size: 20px !important;
  font-weight: 900 !important;
  background-color: #222d32 !important;
  text-align: center !important;
}

.q-table >>> tbody td {
  font-size: 16px !important;
  font-weight: 400 !important;
  text-align: center !important;
}

/* ✅ Remove pagination border */
.q-table >>> .q-table__bottom {
  border: none !important;
}

/* ✅ Global table headers - force large bold text */
:deep(.global-table thead th) {
  color: white !important;
  font-size: 20px !important;
  font-weight: 900 !important;
  background-color: #222d32 !important;
  border-right: 1px solid #000 !important;
  border-bottom: 1px solid #000 !important;
  padding: 12px 16px !important;
  text-align: center !important;
  height: 50px !important;
  vertical-align: middle !important;
}

/* ✅ Global table body content - normal weight */
:deep(.global-table tbody td) {
  border-right: 1px solid #000 !important;
  border-bottom: 1px solid #000 !important;
  padding: 8px 12px !important;
  text-align: center !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  vertical-align: middle !important;
}

/* ✅ Override any Quasar header classes */
:deep(.global-table .q-table__head th),
:deep(.global-table .q-th),
:deep(.global-table thead .q-th) {
  font-size: 20px !important;
  font-weight: 900 !important;
  color: white !important;
  background-color: #222d32 !important;
}

:deep(.bed-table) {
  border: 1px solid #000;
  border-radius: 0;
  width: 100%;
  font-family: 'Sarabun', sans-serif;
  min-height: 600px;
}

:deep(.bed-table thead tr) {
  background-color: #222d32;
}

:deep(.bed-table thead th) {
  color: white;
  font-size: 16px;
  font-weight: bold;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 12px;
  text-align: center !important;
}

:deep(.bed-table tbody tr:nth-child(even)) {
  background-color: #f5f5f5;
}

:deep(.bed-table tbody tr:hover) {
  background-color: #e3f2fd !important;
}

:deep(.bed-table tbody td) {
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 12px;
  text-align: center !important;
  font-size: 14px;
}
</style>
