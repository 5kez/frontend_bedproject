<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <!-- Header -->
    <div class="row items-center q-mb-md">
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
      <q-toolbar-title class="form-title">เพิ่มสถานที่</q-toolbar-title>
    </div>
    <q-separator />
    <br /><br />

    <q-form @submit.prevent="submitForm" class="form-full">
      <div class="row q-col-gutter-md">
        <!-- ด้านซ้าย: ฟอร์ม -->
        <div class="col-7">
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ชื่อ</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="form.sites_name"
                dense
                class="q-mb-md"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณากรอกชื่อ']"
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ที่อยู่</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="form.address"
                dense
                class="q-mb-md"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณากรอกที่อยู่']"
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ละติจูด</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="form.lat"
                max="90"
                min="-90"
                dense
                class="q-mb-md"
                lazy-rules
                :rules="[
                  (val) => (val !== null && val !== '') || 'กรุณากรอกละติจูด',
                  (val) => (val >= -90 && val <= 90) || 'ละติจูดต้องอยู่ระหว่าง -90 ถึง 90',
                ]"
                @click="showMap = true"
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ลองจิจูด</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="form.lng"
                max="180"
                min="-180"
                dense
                class="q-mb-md"
                lazy-rules
                :rules="[
                  (val) => (val !== null && val !== '') || 'กรุณากรอกลองจิจูด',
                  (val) => (val >= -180 && val <= 180) || 'ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180',
                ]"
                @click="showMap = true"
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ประเภท</label>
            </div>
            <div class="col-9">
              <q-select
                v-model="form.sites_type_id"
                :options="siteStore.siteTypes"
                option-label="name"
                option-value="id"
                filled
                dense
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาเลือกประเภท']"
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">จังหวัด</label>
            </div>
            <div class="col-9">
              <q-select
                v-model="form.prov_id"
                :options="provinceStore.provinces"
                option-label="prov_name_th"
                option-value="id"
                filled
                dense
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาเลือกจังหวัด']"
              />
            </div>
          </div>
        </div>

        <!-- ด้านขวา: upload image of site -->
        <div class="col-4 flex flex-left">
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
              v-if="!ImageUrl && !previewUrl"
              name="add"
              class="upload-icon"
              @click.stop="triggerUpload"
            />
            <div class="image-container" v-if="previewUrl || ImageUrl">
              <q-img
                :src="(previewUrl ?? ImageUrl) || undefined"
                class="preview-img"
                @click.stop="triggerUpload"
              />
              <div class="hover-overlay" @click="triggerUpload">
                <q-icon name="edit" class="edit-icon" />
              </div>
            </div>
          </q-card>
        </div>

        <!-- ปุ่ม -->
        <div class="row justify-end q-mt-md full-width">
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
      </div>
    </q-form>
    <PicklocationDialog
      v-if="showMap"
      :site="site"
      @select="handleLocationSelect"
      @close="showMap = false"
    />
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSiteStore } from 'src/stores/locationStore/siteStore'
import { useProvinceStore } from 'src/stores/locationStore/provinceStore'
import { QFile } from 'quasar'
import { getLocationImageUrl } from 'src/utils/imageUtils'
import PicklocationDialog from 'src/components/dialog/PicklocationDialog.vue'
import { type Site } from 'src/models'
import { useImageLocationStore } from 'src/stores/locationStore/ImagelocationStore'

const router = useRouter()
const route = useRoute()
const siteStore = useSiteStore()
const provinceStore = useProvinceStore()
const imageSiteStore = useImageLocationStore()
const editingId = ref<number | null>(null)
const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const fileInput = ref<InstanceType<typeof QFile> | null>(null)
const showMap = ref(false)
const site = ref<Site>()

// ประกาศ interface ให้ถูกต้องตาม type ที่ใช้จริง
interface SiteType {
  id: number
  name: string
  remark?: string
}

interface Province {
  id: number
  prov_code: number
  prov_name: string
  prov_name_th: string
}

interface SiteForm {
  sites_name: string
  address: string
  lat: number | null
  lng: number | null
  sites_type_id: SiteType | null
  prov_id: Province | null
  name_img?: string | null
}

// ใส่ type ให้ form เพื่อให้ typescript เข้าใจ
const form = ref<SiteForm>({
  sites_name: '',
  address: '',
  lat: null,
  lng: null,
  sites_type_id: null,
  prov_id: null,
  name_img: null,
})

const cancelForm = () => {
  router.go(-1)
}

const handleLocationSelect = (sitelocation: Site) => {
  if (site.value) {
    site.value.lat = sitelocation.lat
    site.value.lng = sitelocation.lng
  }
  form.value.lat = sitelocation.lat
  form.value.lng = sitelocation.lng
}

const submitForm = async () => {
  try {
    if (!form.value.sites_type_id?.id || !form.value.prov_id?.id) {
      alert('กรุณาเลือกประเภทสถานที่และจังหวัดให้ครบถ้วน')
      return
    }
    if (file.value) {
      const finalImageUrl = await imageSiteStore.uploadImage(file.value, editingId.value!)
      if (finalImageUrl) {
        form.value.name_img = finalImageUrl
        site.value = { ...site.value, name_img: finalImageUrl } as Site
      }
    }
    const payload = {
      ...form.value,
      sites_type_id: form.value.sites_type_id?.id || null,
      prov_id: form.value.prov_id?.id || null,
      lat: form.value.lat ?? 0, // ใช้ค่าเริ่มต้น 0 ถ้าเป็น undefined
      lng: form.value.lng ?? 0, // ใช้ค่าเริ่มต้น 0 ถ้าเป็น undefined,
      name_img: site.value?.name_img || null,
    }

    logger.log('Submit Payload:', payload)

    if (editingId.value) {
      // แก้ไข
      await siteStore.updateSite(editingId.value, payload)
    } else {
      // เพิ่มใหม่
      await siteStore.createSite(payload)
    }
    await router.push('/location-management')
  } catch (error) {
    logger.error('Error submitting form:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
  }
}

const triggerUpload = () => {
  if (!fileInput.value || !fileInput.value.$el) return
  fileInput.value.$el.click()
}

const ImageUrl = computed(() => {
  const imagePath = form.value?.name_img
  return getLocationImageUrl(imagePath)
})

onMounted(async () => {
  await siteStore.fetchSiteTypes()
  await provinceStore.fetchProvinces()

  if (route.params.id) {
    const siteId = Number(route.params.id)
    site.value = await siteStore.fetchSiteById(siteId)
    if (site.value) {
      editingId.value = site.value.id
      form.value = {
        sites_name: site.value.sites_name,
        address: site.value.address,
        lat: site.value.lat,
        lng: site.value.lng,
        sites_type_id:
          siteStore.siteTypes.find((type) => type.id === site.value?.sites_type_id) || null,
        prov_id: provinceStore.provinces.find((prov) => prov.id === site.value?.prov_id) || null,
        name_img: site.value.name_img || null,
      }
    }
  }
})

const handleFileChange = (newFile: File | null) => {
  if (newFile) {
    previewUrl.value = URL.createObjectURL(newFile)
    file.value = newFile
  } else {
    previewUrl.value = null
    file.value = null
  }
}
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}
.black-border {
  border: 1px solid black;
}
.btn-save {
  background-color: #222d32;
  color: white;
  font-size: 1.1rem;
}
.btn-cancel {
  background: white;
  border: 1.5px solid #222d32;
  color: #222d32;
  font-size: 1.1rem;
}
.page-no-scroll {
  overflow: hidden;
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
</style>
