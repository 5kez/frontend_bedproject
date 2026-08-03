<template>
  <q-page class="q-pa-md" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
      <div class="row items-center col-8">
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
        <q-toolbar-title class="form-title"> ตั้งค่าสถานะเซนเซอร์ </q-toolbar-title>
      </div>
    </div>
    <q-separator />
    <br />
    <q-form @submit.prevent="submitForm">
      <div class="row q-col-gutter-md">
        <div class="col-7">
          <div class="row q-mb-md">
            <div
              class="col-3 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ชื่อ สถานะ</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="status.name"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ชื่อ Status']"
                dense
                style="margin-top: 15px"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-3 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">ประเภท</label>
            </div>
            <div class="col-9" style="margin-top: 20px">
              <q-select
                filled
                v-model="status.status_group"
                label="ประเภทเซ็นเซอร์"
                dense
                class="q-mb-md"
                :options="sensorStore.sensorsType"
                option-label="name"
                option-value="id"
                lazy-rules
                emit-value
                :rules="[(val) => !!val || 'กรุณาเลือกประเภทเซ็นเซอร์']"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-3 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large; margin-top: 5px">สถานะ</label>
            </div>
            <div class="col-9" style="margin-top: 5px">
              <q-toggle
                v-model="status.active"
                label="เปิดใช้งาน"
                true-value="1"
                false-value="0"
                color="green"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <label style="font-size: large; margin-top: 25px; margin-bottom: 30px">รูปภาพ</label>
            <div class="col-3 text-left q-pr-md" style="display: flex; align-items: center"></div>
            <div class="col-9">
              <q-card bordered class="upload-container">
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
                  v-if="!statusImageUrl && !previewUrl"
                  name="add"
                  class="upload-icon"
                  @click.stop="upload"
                />
                <div class="image-container" v-if="previewUrl || statusImageUrl">
                  <q-img :src="(previewUrl ?? statusImageUrl) || undefined" class="preview-img" />
                  <div class="hover-overlay" @click="upload">
                    <q-icon name="edit" class="edit-icon" />
                  </div>
                </div>
              </q-card>
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
import { type PatientStatus } from 'src/models'
import { useAuthStore } from 'src/stores/authStore/authStore'
import { useImageStatusStore } from 'src/stores/sensorStore/ImageStatusStore'
import { useSensorStore } from 'src/stores/sensorStore/sensorStore'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { API_CONFIG } from 'src/config/api'

const fileInput = ref<InstanceType<typeof QFile> | null>(null)
const statusFormData = ref<PatientStatus | null>(null)
const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const sensorStore = useSensorStore()
const authStore = useAuthStore()
const imageStatusStore = useImageStatusStore()
const router = useRouter()
if (!authStore.currentUser) {
  throw new Error('No current user')
}
const status = ref<PatientStatus>({
  id: 0,
  name: '',
  name_img: '',
  status_group: null,
  active: false,
  create_userlogin: authStore.currentUser.id,
  update_userlogin: authStore.currentUser.id,
})

const cancelForm = () => {
  clearForm()
  router.go(-1)
}

const clearForm = () => {}

const submitForm = async () => {
  if (file.value) {
    const finalImageUrl = await imageStatusStore.uploadImage(file.value)
    if (finalImageUrl) {
      status.value.name_img = finalImageUrl
      logger.log(status.value)
    }
  }
  await sensorStore.addStatus(status.value)
  router.go(-1)
}

const upload = () => {
  if (!fileInput.value || !fileInput.value.$el) return
  fileInput.value.$el.click()
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

const statusImageUrl = computed(() => {
  const imagePath = statusFormData.value?.name_img
  if (imagePath) {
    // ✅ ตรวจสอบว่าเป็น full URL หรือ relative path
    if (imagePath.startsWith('http')) {
      return imagePath
    } else if (imagePath.startsWith('/uploads/')) {
      return `${API_CONFIG.BASE_URL}${imagePath}`
    } else {
      return `${API_CONFIG.BASE_URL}/uploads/${imagePath}`
    }
  }
  return undefined
})

onMounted(async () => {
  await sensorStore.getSensorType()
})
</script>

<style scoped>
.form-title {
  font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
  font-size: 2rem;
  line-height: 2;
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

.edit-icon {
  font-size: 48px;
  color: white;
  cursor: pointer;
}

.black-border {
  border: 1px solid black;
}
</style>
