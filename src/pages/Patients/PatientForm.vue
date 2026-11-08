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
    </div>

    <q-separator class="q-mb-md" />
    <br />

    <q-form @submit.prevent="submitForm">
      <div class="row q-col-gutter-md">
        <!-- ส่วนข้อมูลผู้ป่วย -->
        <div class="col-7">
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ชื่อ</label>
            </div>
            <div class="col-6">
              <q-input
                filled
                v-if="patientFormData"
                v-model="patientFormData.name"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ชื่อ-นามสกุล']"
                dense
                :disable="isRemarkOnly"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">เพศโดยกำเนิด</label>
            </div>
            <div class="col-8">
              <q-option-group
                v-model="sexModel"
                :options="[
                  { label: 'หญิง', value: 'F' },
                  { label: 'ชาย', value: 'M' },
                ]"
                type="radio"
                size="lg"
                inline
                :error="!!sexError"
                :error-message="sexError"
                :disable="isRemarkOnly"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large; margin-top: 15px">วันเดือนปีเกิด</label>
            </div>
            <div class="col-6" style="margin-top: 15px">
              <q-input
                :disable="isRemarkOnly"
                filled
                v-model="birthDateModel"
                type="date"
                dense
                :max="todayString"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">แผนก</label>
            </div>
            <div class="col-6">
              <q-select
                :disable="isRemarkOnly"
                filled
                v-model="departmentModel"
                :options="departmentStore.departments"
                option-value="id"
                option-label="department_name"
                style="margin-top: 20px"
                emit-value
                map-options
                dense
                class="q-mb-md"
                :error="!!departmentError"
                :error-message="departmentError"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="align-items: center">
              <label style="font-size: large">เลขบัตรประชาชน</label>
            </div>
            <div class="col-6">
              <q-input
                filled
                v-if="patientFormData"
                v-model="patientFormData.thaiId"
                lazy-rules
                :rules="[(val) => (val && val.length === 13) || 'กรุณาใส่เลขบัตรประชาชนให้ถูกต้อง']"
                dense
                :disable="isRemarkOnly"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">เบอร์ญาติ</label>
            </div>
            <div class="col-6">
              <q-input
                :disable="isRemarkOnly"
                filled
                v-if="patientFormData"
                v-model="patientFormData.telFam"
                dense
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large; margin-top: 15px">วันที่เข้ารักษา</label>
            </div>
            <div class="col-6" style="margin-top: 15px">
              <q-input
                :disable="isRemarkOnly"
                filled
                v-model="admitDateModel"
                :max="todayString"
                type="date"
                dense
              />
            </div>
          </div>
        </div>

        <div class="col-4 flex flex-left">
          <q-card :disable="isRemarkOnly" bordered class="upload-container">
            <q-file
              ref="fileInput"
              v-model="file"
              accept="image/*"
              class="upload-box"
              dense
              outlined
              max-file-size="204800"
              @update:model-value="handleFileChange"
            />
            <q-icon
              v-if="!patientImageUrl && !previewUrl"
              name="add"
              class="upload-icon"
              @click.stop="triggerUpload"
            />
            <div class="image-container" v-if="previewUrl || patientImageUrl">
              <q-img
                :src="(previewUrl ?? patientImageUrl) || undefined"
                class="preview-img"
                @click.stop="triggerUpload"
              />
              <div class="hover-overlay" @click="triggerUpload">
                <q-icon name="edit" class="edit-icon" />
              </div>
            </div>
          </q-card>

          <div class="row q-mb-md">
            <div
              class="col-6 text-left q-pr-md flex flex-left"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">หมายเหตุ (ถ้ามี)</label>
            </div>
            <div class="col-12">
              <q-input
                filled
                v-if="patientFormData"
                v-model="patientFormData.remark"
                type="textarea"
                dense
              />
            </div>
          </div>
        </div>
      </div>
      <!-- ปุ่มกด -->
      <div class="row justify-end q-mt-md">
        <q-btn
          label="บันทึก"
          type="submit"
          class="q-mr-sm q-px-lg"
          style="background-color: #222d32; color: white"
        />
        <q-btn
          label="ยกเลิก"
          @click="cancelForm"
          color="white"
          class="black-border q-px-lg"
          text-color="black"
        />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { QFile } from 'quasar'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import { useImagePatientStore } from 'src/stores/patientStore/ImagePatientStore'
import { useRouter, useRoute } from 'vue-router'
import { computed, onMounted, onActivated, ref, watch } from 'vue'
import { type Patient } from 'src/models'
import { useDialogStore } from 'stores/dialogStore/dialogStore'
import { getPatientImageUrl } from 'src/utils/imageUtils'
import { useAuthStore } from 'src/stores/authStore/authStore'
import { useDepartmentStore } from 'src/stores/departmentStore/departmentStore'

// Helper for max date (today)
const todayString = new Date().toISOString().split('T')[0]

const patientStore = usePatientStore()
const imagePatientStore = useImagePatientStore()
const dialogStore = useDialogStore()
const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)
const isAdmit = computed(() => route.query.mode === 'admit')
const sexError = ref('')
const departmentError = ref('')
const roomError = ref('')
const bedError = ref('')
const fileInput = ref<InstanceType<typeof QFile> | null>(null)
const previewUrl = ref<string | null>(null)
const file = ref<File | null>(null)
const patientId = ref<number | null>(null)
const authStore = useAuthStore()
const departmentStore = useDepartmentStore()
const isRemarkOnly = computed(() => authStore.currentUser?.role_id === 2)
const triggerUpload = () => {
  if (!fileInput.value || !fileInput.value.$el) return
  fileInput.value.$el.click()
}

const sexModel = computed({
  get: () => patientFormData.value?.sex ?? null,
  set: (value) => {
    if (patientFormData.value) {
      patientFormData.value.sex = value
    }
  },
})

// ตัวเลือกห้องและเตียง
const roomOptions = ref<{ id: number; name: string }[]>([])
const bedOptions = ref<{ id: number; name: string }[]>([])

// const roomModel = computed({
//   get: () => (patientFormData.value ? patientFormData.value.room_id : null),
//   set: (value) => {
//     if (patientFormData.value) {
//       patientFormData.value.room_id = value
//     }
//   },
// })

// const bedModel = computed({
//   get: () => (patientFormData.value ? patientFormData.value.bed_id : null),
//   set: (value) => {
//     if (patientFormData.value) {
//       patientFormData.value.bed_id = value
//     }
//   },
// })

// โหลดข้อมูลห้องและเตียง
onMounted(() => {
  roomOptions.value = fetchRoomOptions()
  bedOptions.value = fetchBedOptions()
})

// ฟังก์ชันจำลองการดึงข้อมูลจาก API
const fetchRoomOptions = () => {
  return [
    { id: 101, name: '101' },
    { id: 102, name: '102' },
    { id: 103, name: '103' },
  ]
}

const fetchBedOptions = () => {
  return [
    { id: 1, name: 'เตียง 1' },
    { id: 2, name: 'เตียง 2' },
    { id: 3, name: 'เตียง 3' },
  ]
}

const uploadedImage = ref('')

//ref model
const patientFormData = ref<Patient | null>(null)

// ฟังก์ชันสำหรับโหลดข้อมูล
const loadFormData = async () => {
  logger.log('🚀 Loading form data...')
  if (isEdit.value) {
    patientId.value = Number(route.params.id)
    logger.log('📝 Edit mode - Loading patient ID:', patientId.value)
    await patientStore.fetchPatientById(patientId.value)
    if (patientStore.patientData) {
      patientFormData.value = { ...patientStore.patientData }
      uploadedImage.value = patientStore.patientData.image || ''
      logger.log('✅ Patient data loaded for editing')
    }
  } else {
    logger.log('➕ Create mode - Setting empty patient')
    patientFormData.value = patientStore.getEmptyPatient()
  }
}

//load data Edit Mode or Create Mode
onMounted(loadFormData)

onActivated(loadFormData)

// Watch route params เมื่อมีการเปลี่ยน ID
watch(
  () => route.params.id,
  async (newId) => {
    if (newId !== undefined) {
      await loadFormData()
    }
  },
)

onMounted(async () => {
  await imagePatientStore.deleteTempImage()
  await departmentStore.fetchDepartments()
})

const departmentModel = computed({
  get: () => patientFormData.value?.department_id || null,
  set: (value) => {
    if (patientFormData.value) {
      patientFormData.value.department_id = value
    }
  },
})

//เปลี่ยนค่า Date => String => Date
const birthDateModel = computed({
  get: () =>
    patientFormData.value?.birthDate
      ? new Date(patientFormData.value.birthDate).toISOString().split('T')[0]
      : '',
  set: (value) => {
    if (patientFormData.value) {
      patientFormData.value.birthDate = value ? new Date(value) : null
    }
  },
})

const admitDateModel = computed({
  get: () => {
    // ถ้าเป็นโหมด admit
    if (route.query.mode === 'admit') {
      return new Date().toISOString().split('T')[0] //Today
    }
    if (patientFormData.value && patientFormData.value.admitDate) {
      return new Date(patientFormData.value.admitDate).toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0] //Today Default
  },
  set: (value) => {
    if (patientFormData.value) {
      patientFormData.value.admitDate = value ? new Date(value) : null
    }
  },
})

const submitForm = async () => {
  if (!patientFormData.value) return

  // Reset error messages
  sexError.value = ''
  departmentError.value = ''
  roomError.value = ''
  bedError.value = ''

  // let hasError = false

  // if (!sexModel.value) {
  //   sexError.value = 'กรุณาเลือกเพศโดยกำเนิด'
  //   hasError = true
  // }
  // if (!departmentModel.value) {
  //   departmentError.value = 'กรุณาเลือกแผนก'
  //   hasError = true
  // }
  // if (!roomModel.value) {
  //   roomError.value = 'กรุณาเลือกห้อง'
  //   hasError = true
  // }
  // if (!bedModel.value) {
  //   bedError.value = 'กรุณาเลือกเตียง'
  //   hasError = true
  // }

  // if (hasError) return

  try {
    let patientId: number | null = null
    if (isEdit.value) {
      if (ref(patientFormData)) {
        patientFormData.value.update_user_id = authStore.currentUser?.id || 1
      }
      await patientStore.updatePatient(patientFormData.value.patient_id, patientFormData.value)
      patientId = patientFormData.value.patient_id
    }
    if (isAdmit.value) {
      logger.log('Admiting patient...')
      if (ref(patientFormData)) {
        patientFormData.value.update_user_id = authStore.currentUser?.id || 1
      }
      await patientStore.admitPatientUpdate(patientFormData.value.patient_id, patientFormData.value)
      patientId = patientFormData.value.patient_id
    }
    if (!isEdit.value && !isAdmit.value) {
      logger.log(patientFormData.value)
      patientFormData.value.site_id = authStore.currentUser?.site_id || 1
      // room_id / floor_id are NOT NULL in the database but the form has no
      // field for them, so registering a patient failed on MySQL. Use the
      // ward (department_building) of the chosen department.
      const ward = departmentStore.departments.find(
        (d) => d.id === patientFormData.value?.department_id,
      )?.departmentBuildings?.[0]
      // the date field shows today by default but only writes on change
      patientFormData.value.admitDate ??= new Date()
      patientFormData.value.room_id ??= ward?.id ?? 0
      patientFormData.value.floor_id ??= ward?.floor?.id ?? 0
      const newPatient = patientFormData.value
      if (newPatient) {
        newPatient.create_user_id = authStore.currentUser?.id || 1
        newPatient.update_user_id = authStore.currentUser?.id || 1
      }
      newPatient.status = 1 // สถานะ 1 = กำลังรักษา
      const createdPatient = await patientStore.createPatient(newPatient)
      if (createdPatient && createdPatient.patient_id) {
        patientId = createdPatient.patient_id
      } else {
        logger.error('❌ Error: createPatient() ไม่คืนค่า')
      }
    }

    if (patientId && file.value) {
      const finalImageUrl = await imagePatientStore.uploadImage(file.value, patientId)
      if (finalImageUrl) {
        patientFormData.value.image = finalImageUrl
      }
    }

    router.go(-1)
    await dialogStore.openDialog('บันทึกข้อมูลผู้ป่วยสำเร็จ', 'confirm')
  } catch (error) {
    logger.error('❌ Error submitting form:', error)
  }
}

const handleFileChange = (newFile: File | null) => {
  if (newFile) {
    previewUrl.value = URL.createObjectURL(newFile)
    file.value = newFile
  } else {
    previewUrl.value = null
    file.value = null
  }
}

const cancelForm = async () => {
  await imagePatientStore.deleteTempImage()
  router.go(-1)
}

const patientImageUrl = computed(() => {
  const imagePath = patientFormData.value?.image
  return getPatientImageUrl(imagePath)
})
</script>
<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

.upload-container {
  width: 300px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f0f0f0;
}

.upload-box {
  width: 100%;
  height: 100%;
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

/* 🔹 ไอคอน `+` ตอนยังไม่มีรูป */
.upload-icon {
  font-size: 80px;
  color: gray;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.6;
  z-index: 2;
  cursor: pointer;
}

/* 🔹 กรอบรูป */
.image-container {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 🔹 รูปภาพที่อัปโหลด */
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.black-border {
  border: 1px solid black;
}

/* 🔹 ฟิลเตอร์สีเทาและไอคอนดินสอ */
.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  /* ✅ สีเทา */
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  border-radius: 8px;
}

.image-container:hover .hover-overlay {
  opacity: 1;
  /* ✅ แสดงเมื่อ Hover */
}

/* 🔹 ไอคอนดินสอ */
.edit-icon {
  font-size: 48px;
  color: white;
  cursor: pointer;
}
</style>
