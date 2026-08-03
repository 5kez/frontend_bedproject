<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center">
        <q-icon name="hotel" size="md" class="q-mr-sm" />
        <div class="text-h6">{{ isEditMode ? 'แก้ไข' : 'เพิ่ม' }}การจัดเตียงผู้ป่วย</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-card-section>
          <div class="row q-gutter-md">
            <!-- Patient Selection -->
            <div class="col-12">
              <q-select
                v-model="formData.patient_id"
                :options="patientOptions"
                option-value="patient_id"
                option-label="patient_name"
                label="ผู้ป่วย *"
                outlined
                :disable="isEditMode"
                clearable
                use-input
                @filter="filterPatients"
                :rules="[(val) => val || 'กรุณาเลือกผู้ป่วย']"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey"> ไม่พบข้อมูลผู้ป่วย </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Bed Selection -->
            <div class="col-12">
              <q-select
                v-model="formData.bed_id"
                :options="availableBedOptions"
                option-value="bed_id"
                option-label="bed_display"
                label="เตียง *"
                outlined
                :disable="isEditMode"
                :rules="[(val) => val || 'กรุณาเลือกเตียง']"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ scope.opt.bed_display }}</q-item-label>
                      <q-item-label caption>
                        {{ scope.opt.department_name }} - {{ scope.opt.building_name }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge :color="scope.opt.is_occupied ? 'red' : 'green'">
                        {{ scope.opt.is_occupied ? 'ไม่ว่าง' : 'ว่าง' }}
                      </q-badge>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Assigned Date -->
            <div class="col-12">
              <q-input
                v-model="formData.assigned_at"
                label="วันที่เข้าพัก *"
                outlined
                type="datetime-local"
                :rules="[(val) => val || 'กรุณาระบุวันที่เข้าพัก']"
              />
            </div>

            <!-- Status (for edit mode) -->
            <div class="col-12" v-if="isEditMode">
              <q-select v-model="formData.status" :options="statusOptions" label="สถานะ" outlined />
            </div>

            <!-- Notes -->
            <div class="col-12">
              <q-input
                v-model="formData.notes"
                label="หมายเหตุ"
                outlined
                type="textarea"
                rows="3"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="ยกเลิก" @click="closeDialog" />
          <q-btn
            type="submit"
            color="primary"
            :label="isEditMode ? 'อัพเดท' : 'บันทึก'"
            :loading="loading"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { API_ENDPOINTS } from 'src/config/api'
import { useAuthStore } from 'src/stores/authStore/authStore'

interface Patient {
  patient_id: number
  patient_name: string
  patient_code?: string
}

interface Bed {
  bed_id: number
  bed_display: string
  department_name?: string
  building_name?: string
  is_occupied: boolean
}

interface BedAssignment {
  assignment_id?: number
  patient_id: number
  bed_id: number
  status: string
  assigned_at: string
  notes?: string
  assigned_by: number
}

const props = defineProps<{
  show: boolean
  assignment?: BedAssignment | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  saved: []
}>()

const $q = useQuasar()
const authStore = useAuthStore()
const currentUserId = () => authStore.getCurrentUser()?.id ?? 0

// Reactive data
const loading = ref(false)
const patients = ref<Patient[]>([])
const beds = ref<Bed[]>([])
const patientOptions = ref<Patient[]>([])

const statusOptions = [
  { label: 'ใช้งาน', value: 'active' },
  { label: 'ย้าย', value: 'transferred' },
  { label: 'จำหน่าย', value: 'discharged' },
]

const formData = ref<BedAssignment>({
  patient_id: 0,
  bed_id: 0,
  status: 'active',
  assigned_at: new Date().toISOString().slice(0, 16),
  notes: '',
  assigned_by: currentUserId(),
})

// Computed
const showDialog = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const isEditMode = computed(() => !!props.assignment?.assignment_id)

const availableBedOptions = computed(() => {
  if (isEditMode.value) {
    return beds.value.filter((bed) => bed.bed_id === formData.value.bed_id || !bed.is_occupied)
  }
  return beds.value.filter((bed) => !bed.is_occupied)
})

// Methods
const loadPatients = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.PATIENTS)
    patients.value = response.data
    patientOptions.value = patients.value
  } catch (error) {
    logger.error('Error loading patients:', error)
    $q.notify({
      type: 'negative',
      message: 'ไม่สามารถโหลดข้อมูลผู้ป่วยได้',
    })
  }
}

const loadBeds = async () => {
  try {
    const response = await api.get(`${API_ENDPOINTS.BEDS}?with_occupancy=true`)

    interface BedResponse {
      bed_id: number
      current_patient_id?: number
      [key: string]: unknown
    }

    beds.value = response.data.map((bed: BedResponse) => ({
      ...bed,
      bed_display: `เตียง ${bed.bed_id}`,
      is_occupied: bed.current_patient_id !== null,
    }))
  } catch (error) {
    logger.error('Error loading beds:', error)
    $q.notify({
      type: 'negative',
      message: 'ไม่สามารถโหลดข้อมูลเตียงได้',
    })
  }
}

const filterPatients = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    if (val === '') {
      patientOptions.value = patients.value
    } else {
      const needle = val.toLowerCase()
      patientOptions.value = patients.value.filter(
        (patient) =>
          patient.patient_name.toLowerCase().includes(needle) ||
          patient.patient_code?.toLowerCase().includes(needle),
      )
    }
  })
}

const resetForm = () => {
  formData.value = {
    patient_id: 0,
    bed_id: 0,
    status: 'active',
    assigned_at: new Date().toISOString().slice(0, 16),
    notes: '',
    assigned_by: currentUserId(),
  }
}

const closeDialog = () => {
  showDialog.value = false
  resetForm()
}

const onSubmit = async () => {
  loading.value = true
  try {
    if (isEditMode.value) {
      await api.patch(`${API_ENDPOINTS.BED_ASSIGNMENTS}/${props.assignment?.assignment_id}`, {
        status: formData.value.status,
        notes: formData.value.notes,
      })
      $q.notify({
        type: 'positive',
        message: 'อัพเดทการจัดเตียงเรียบร้อยแล้ว',
      })
    } else {
      await api.post(API_ENDPOINTS.BED_ASSIGNMENTS, formData.value)
      $q.notify({
        type: 'positive',
        message: 'จัดเตียงผู้ป่วยเรียบร้อยแล้ว',
      })
    }

    emit('saved')
    closeDialog()
  } catch (error: unknown) {
    logger.error('Error saving bed assignment:', error)

    interface ErrorResponse {
      response?: {
        data?: {
          message?: string
        }
      }
    }

    const apiError = error as ErrorResponse
    $q.notify({
      type: 'negative',
      message: apiError.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึก',
    })
  } finally {
    loading.value = false
  }
}

// Watchers
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      void loadPatients()
      void loadBeds()

      if (props.assignment) {
        Object.assign(formData.value, {
          ...props.assignment,
          assigned_at: props.assignment.assigned_at?.slice(0, 16) || '',
        })
      }
    }
  },
)

onMounted(() => {
  if (props.show) {
    void loadPatients()
    void loadBeds()
  }
})
</script>
