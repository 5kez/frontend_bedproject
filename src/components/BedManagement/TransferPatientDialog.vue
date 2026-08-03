<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px">
      <q-card-section class="row items-center">
        <q-icon name="transfer_within_a_station" size="md" class="q-mr-sm" />
        <div class="text-h6">ย้ายผู้ป่วย</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <!-- Current Assignment Info -->
        <div class="q-mb-md">
          <q-banner class="bg-blue-1 text-primary">
            <div class="text-subtitle2">ข้อมูลปัจจุบัน</div>
            <div>ผู้ป่วย: {{ currentAssignment?.patient?.patient_name }}</div>
            <div>เตียงปัจจุบัน: เตียง {{ currentAssignment?.bed_id }}</div>
            <div>เข้าพักเมื่อ: {{ formatDate(currentAssignment?.assigned_at) }}</div>
          </q-banner>
        </div>
      </q-card-section>

      <q-form @submit="onTransfer" class="q-gutter-md">
        <q-card-section>
          <div class="row q-gutter-md">
            <!-- New Bed Selection -->
            <div class="col-12">
              <q-select
                v-model="transferData.new_bed_id"
                :options="availableBedOptions"
                option-value="bed_id"
                option-label="bed_display"
                label="เตียงใหม่ *"
                outlined
                :rules="[(val) => val || 'กรุณาเลือกเตียงใหม่']"
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
                      <q-badge color="green">ว่าง</q-badge>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Transfer Notes -->
            <div class="col-12">
              <q-input
                v-model="transferData.transfer_notes"
                label="เหตุผลการย้าย"
                outlined
                type="textarea"
                rows="3"
                placeholder="ระบุเหตุผลที่ต้องย้ายเตียง..."
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="ยกเลิก" @click="closeDialog" />
          <q-btn
            type="submit"
            color="primary"
            label="ย้ายเตียง"
            :loading="loading"
            icon="transfer_within_a_station"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar, date } from 'quasar'
import { api } from 'src/boot/axios'
import { API_ENDPOINTS } from 'src/config/api'
import { useAuthStore } from 'src/stores/authStore/authStore'

interface Bed {
  bed_id: number
  bed_display: string
  department_name?: string
  building_name?: string
  is_occupied: boolean
}

interface BedAssignment {
  assignment_id: number
  patient_id: number
  bed_id: number
  patient?: {
    patient_name: string
  }
  assigned_at: string
}

interface TransferData {
  new_bed_id: number | null
  transfer_notes: string
  transferred_by: number
}

const props = defineProps<{
  show: boolean
  assignment: BedAssignment | null
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  transferred: []
}>()

const $q = useQuasar()
const authStore = useAuthStore()
const currentUserId = () => authStore.getCurrentUser()?.id ?? 0

// Reactive data
const loading = ref(false)
const beds = ref<Bed[]>([])

const transferData = ref<TransferData>({
  new_bed_id: null,
  transfer_notes: '',
  transferred_by: currentUserId(),
})

// Computed
const showDialog = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const currentAssignment = computed(() => props.assignment)

const availableBedOptions = computed(() => {
  return beds.value.filter(
    (bed) => !bed.is_occupied && bed.bed_id !== currentAssignment.value?.bed_id,
  )
})

// Methods
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

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return date.formatDate(new Date(dateString), 'DD/MM/YYYY HH:mm')
}

const resetForm = () => {
  transferData.value = {
    new_bed_id: null,
    transfer_notes: '',
    transferred_by: currentUserId(),
  }
}

const closeDialog = () => {
  showDialog.value = false
  resetForm()
}

const onTransfer = async () => {
  if (!currentAssignment.value?.assignment_id || !transferData.value.new_bed_id) {
    return
  }

  loading.value = true
  try {
    const endpoint = API_ENDPOINTS.BED_TRANSFER_PATIENT(currentAssignment.value.assignment_id)
    await api.post(endpoint, transferData.value)

    $q.notify({
      type: 'positive',
      message: 'ย้ายผู้ป่วยเรียบร้อยแล้ว',
    })

    emit('transferred')
    closeDialog()
  } catch (error: unknown) {
    logger.error('Error transferring patient:', error)

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
      message: apiError.response?.data?.message || 'เกิดข้อผิดพลาดในการย้ายผู้ป่วย',
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
      void loadBeds()
    }
  },
)

onMounted(() => {
  if (props.show) {
    void loadBeds()
  }
})
</script>
