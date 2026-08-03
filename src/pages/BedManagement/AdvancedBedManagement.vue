<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-md">
      <!-- Header -->
      <div class="col-12">
        <div class="row items-center justify-between">
          <div>
            <h4 class="q-my-none">จัดการเตียงผู้ป่วย (ระบบขั้นสูง)</h4>
            <p class="text-grey q-mb-none">ระบบจัดการเตียงพร้อมการติดตาม Assignment และ Transfer</p>
          </div>
          <div class="q-gutter-sm">
            <q-btn
              color="primary"
              icon="add"
              label="จัดเตียงผู้ป่วย"
              @click="showAssignmentDialog = true"
            />
            <q-btn
              color="secondary"
              icon="refresh"
              label="รีเฟรช"
              @click="refreshData"
              :loading="loading"
            />
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="col-12">
        <div class="row q-gutter-md">
          <div class="col-xs-12 col-sm-6 col-md-3">
            <q-card class="bg-blue-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-blue">{{ bedsWithAssignments.length }}</div>
                <div class="text-subtitle2">เตียงทั้งหมด</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-xs-12 col-sm-6 col-md-3">
            <q-card class="bg-green-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-green">{{ occupiedBeds.length }}</div>
                <div class="text-subtitle2">เตียงที่มีผู้ป่วย</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-xs-12 col-sm-6 col-md-3">
            <q-card class="bg-orange-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-orange">{{ availableBeds.length }}</div>
                <div class="text-subtitle2">เตียงว่าง</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-xs-12 col-sm-6 col-md-3">
            <q-card class="bg-purple-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-purple">
                  {{
                    Math.round(
                      (occupiedBeds.length / Math.max(bedsWithAssignments.length, 1)) * 100,
                    )
                  }}%
                </div>
                <div class="text-subtitle2">อัตราการใช้งาน</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Beds Grid -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">แผนผังเตียงผู้ป่วย</div>

            <!-- Filter -->
            <div class="row q-gutter-md q-mb-md">
              <q-select
                v-model="selectedDepartment"
                :options="departmentOptions"
                label="แผนก"
                outlined
                dense
                style="min-width: 200px"
                clearable
              />
              <q-select
                v-model="bedStatusFilter"
                :options="bedStatusOptions"
                label="สถานะเตียง"
                outlined
                dense
                style="min-width: 150px"
              />
            </div>

            <!-- Beds Grid -->
            <div class="row q-gutter-md">
              <div
                v-for="bed in filteredBeds"
                :key="bed.bed_id"
                class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
              >
                <q-card
                  :class="{
                    'bg-green-1': !bed.isOccupied,
                    'bg-red-1': bed.isOccupied,
                    'border-green': !bed.isOccupied,
                    'border-red': bed.isOccupied,
                  }"
                  style="border: 2px solid"
                >
                  <q-card-section>
                    <div class="row items-center justify-between">
                      <div>
                        <div class="text-h6">เตียง {{ bed.bed_id }}</div>
                        <div class="text-caption text-grey">
                          {{ bed.departmentBuilding?.department?.department_name }}
                        </div>
                        <div class="text-caption text-grey">
                          {{ bed.departmentBuilding?.building?.build_name }}
                        </div>
                      </div>
                      <div>
                        <q-badge
                          :color="bed.isOccupied ? 'red' : 'green'"
                          :label="bed.isOccupied ? 'ไม่ว่าง' : 'ว่าง'"
                        />
                      </div>
                    </div>

                    <!-- Current Patient Info -->
                    <div v-if="bed.currentAssignment" class="q-mt-sm">
                      <q-separator class="q-my-sm" />
                      <div class="text-subtitle2">ผู้ป่วยปัจจุบัน:</div>
                      <div>{{ bed.currentAssignment.patient?.patient_name }}</div>
                      <div class="text-caption text-grey">
                        เข้าพัก: {{ formatDate(bed.currentAssignment.assigned_at) }}
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="row q-gutter-sm q-mt-md">
                      <q-btn
                        v-if="bed.isOccupied && bed.currentAssignment"
                        size="sm"
                        color="primary"
                        icon="transfer_within_a_station"
                        label="ย้าย"
                        @click="showTransferDialog(bed.currentAssignment!)"
                      />
                      <q-btn
                        v-if="bed.isOccupied && bed.currentAssignment"
                        size="sm"
                        color="negative"
                        icon="logout"
                        label="จำหน่าย"
                        @click="confirmDischarge(bed.currentAssignment!)"
                      />
                      <q-btn
                        size="sm"
                        color="info"
                        icon="history"
                        label="ประวัติ"
                        @click="showBedHistory(bed.bed_id)"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <!-- No Data -->
            <div v-if="filteredBeds.length === 0" class="text-center q-pa-lg">
              <q-icon name="hotel" size="4rem" class="text-grey-4" />
              <div class="text-h6 text-grey q-mt-md">ไม่พบข้อมูลเตียง</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialogs -->
    <BedAssignmentDialog v-model:show="showAssignmentDialog" @saved="handleAssignmentSaved" />

    <TransferPatientDialog
      v-model:show="showTransferDialog_"
      :assignment="selectedAssignmentForTransfer"
      @transferred="handlePatientTransferred"
    />

    <!-- Bed History Dialog -->
    <q-dialog v-model="showBedHistoryDialog" maximized>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">ประวัติเตียง {{ selectedBedId }}</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showBedHistoryDialog = false" />
        </q-card-section>
        <q-card-section>
          <!-- Bed history content will be loaded here -->
          <div v-if="bedHistoryLoading" class="text-center q-pa-lg">
            <q-spinner size="2rem" />
            <div>กำลังโหลด...</div>
          </div>
          <div v-else>
            <!-- History table or timeline -->
            <q-timeline v-if="bedHistory.length > 0">
              <q-timeline-entry
                v-for="assignment in bedHistory"
                :key="assignment.assignment_id"
                :color="getAssignmentStatusColor(assignment.status)"
                :icon="getAssignmentStatusIcon(assignment.status)"
              >
                <template v-slot:title>
                  {{ assignment.patient?.patient_name }}
                </template>
                <template v-slot:subtitle>
                  {{ formatDateRange(assignment.assigned_at, assignment.transferred_at) }}
                </template>
                <div>สถานะ: {{ getAssignmentStatusText(assignment.status) }}</div>
                <div v-if="assignment.notes" class="text-caption text-grey">
                  หมายเหตุ: {{ assignment.notes }}
                </div>
              </q-timeline-entry>
            </q-timeline>
            <div v-else class="text-center q-pa-lg text-grey">ไม่พบประวัติการใช้งานเตียง</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar, date } from 'quasar'
import { useBedAssignmentStore } from 'src/stores/bedAssignmentStore/bedAssignmentStore'
import type { BedAssignment } from 'src/stores/bedAssignmentStore/bedAssignmentStore'
import { useAuthStore } from 'src/stores/authStore/authStore'
import BedAssignmentDialog from 'src/components/BedManagement/BedAssignmentDialog.vue'
import TransferPatientDialog from 'src/components/BedManagement/TransferPatientDialog.vue'

interface AssignmentWithRelations {
  assignment_id: number
  patient_id: number
  bed_id: number
  status: 'active' | 'transferred' | 'discharged'
  assigned_at: string
  transferred_at?: string
  notes?: string
  assigned_by: number
  created_at: string
  updated_at: string

  // Extended relations
  patient?: {
    patient_name: string
    patient_id: number
  }
  bed?: {
    bed_id: number
    department_building_id: number
  }
}

const $q = useQuasar()
const bedAssignmentStore = useBedAssignmentStore()
const authStore = useAuthStore()

// Reactive data
const showAssignmentDialog = ref(false)
const showTransferDialog_ = ref(false)
const showBedHistoryDialog = ref(false)
const selectedAssignmentForTransfer = ref<AssignmentWithRelations | null>(null)
const selectedBedId = ref<number | null>(null)
const bedHistory = ref<BedAssignment[]>([])
const bedHistoryLoading = ref(false)

// Filters
const selectedDepartment = ref<string | null>(null)
const bedStatusFilter = ref('all')

const departmentOptions = ref<{ label: string; value: string }[]>([])
const bedStatusOptions = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'เตียงว่าง', value: 'available' },
  { label: 'เตียงไม่ว่าง', value: 'occupied' },
]

// Computed
const { bedsWithAssignments, occupiedBeds, availableBeds, loading } = bedAssignmentStore

const filteredBeds = computed(() => {
  let beds = bedsWithAssignments

  // Filter by department
  if (selectedDepartment.value) {
    beds = beds.filter(
      (bed) => bed.departmentBuilding?.department?.department_name === selectedDepartment.value,
    )
  }

  // Filter by bed status
  if (bedStatusFilter.value === 'available') {
    beds = beds.filter((bed) => !bed.isOccupied)
  } else if (bedStatusFilter.value === 'occupied') {
    beds = beds.filter((bed) => bed.isOccupied)
  }

  return beds
})

// Methods
const refreshData = async () => {
  await bedAssignmentStore.fetchBedsWithAssignments()
  await bedAssignmentStore.fetchAssignments('active')
  loadDepartmentOptions()
}

const loadDepartmentOptions = () => {
  const departments = new Set<string>()
  bedsWithAssignments.forEach((bed) => {
    const deptName = bed.departmentBuilding?.department?.department_name
    if (deptName) {
      departments.add(deptName)
    }
  })
  departmentOptions.value = Array.from(departments).map((name) => ({
    label: name,
    value: name,
  }))
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return date.formatDate(new Date(dateString), 'DD/MM/YYYY HH:mm')
}

const formatDateRange = (start?: string, end?: string) => {
  const startDate = formatDate(start)
  const endDate = end ? formatDate(end) : 'ปัจจุบัน'
  return `${startDate} - ${endDate}`
}

const showTransferDialog = (assignment: AssignmentWithRelations) => {
  selectedAssignmentForTransfer.value = assignment
  showTransferDialog_.value = true
}

const confirmDischarge = (assignment: AssignmentWithRelations) => {
  $q.dialog({
    title: 'ยืนยันการจำหน่าย',
    message: `คุณต้องการจำหน่าย ${assignment.patient?.patient_name} จากเตียง ${assignment.bed_id} หรือไม่?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await bedAssignmentStore.dischargePatient(
          assignment.assignment_id,
          authStore.getCurrentUser()?.id ?? 0,
        )
        await refreshData()
      } catch (error) {
        logger.error('Error discharging patient:', error)
      }
    })()
  })
}

const showBedHistory = async (bedId: number) => {
  selectedBedId.value = bedId
  showBedHistoryDialog.value = true
  bedHistoryLoading.value = true

  try {
    bedHistory.value = await bedAssignmentStore.fetchAssignmentsByBed(bedId)
  } catch (error) {
    logger.error('Error loading bed history:', error)
  } finally {
    bedHistoryLoading.value = false
  }
}

const getAssignmentStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'green'
    case 'transferred':
      return 'blue'
    case 'discharged':
      return 'grey'
    default:
      return 'grey'
  }
}

const getAssignmentStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return 'check_circle'
    case 'transferred':
      return 'transfer_within_a_station'
    case 'discharged':
      return 'logout'
    default:
      return 'help'
  }
}

const getAssignmentStatusText = (status: string) => {
  switch (status) {
    case 'active':
      return 'กำลังใช้งาน'
    case 'transferred':
      return 'ย้ายแล้ว'
    case 'discharged':
      return 'จำหน่ายแล้ว'
    default:
      return status
  }
}

const handleAssignmentSaved = () => {
  void refreshData()
}

const handlePatientTransferred = () => {
  void refreshData()
  selectedAssignmentForTransfer.value = null
}

// Lifecycle
onMounted(() => {
  void refreshData()
})

watch(
  bedsWithAssignments,
  () => {
    loadDepartmentOptions()
  },
  { immediate: true },
)
</script>

<style scoped>
.border-green {
  border-color: #4caf50 !important;
}

.border-red {
  border-color: #f44336 !important;
}
</style>
