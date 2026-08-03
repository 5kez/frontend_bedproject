<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
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
      <q-toolbar-title class="form-title">{{ pageTitle }}</q-toolbar-title>
    </div>
    <q-separator />
    <br /><br />

    <q-form @submit.prevent="submitForm" class="form-full">
      <div class="row q-col-gutter-md">
        <div class="col-7">
          <div class="row q-mb-lg form-row">
            <div class="col-3 form-label">
              <label>ชื่อ</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="name"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ชื่ออาคาร']"
                dense
                class="form-input"
              />
            </div>
          </div>
          <div class="row q-mb-lg form-row">
            <div class="col-3 form-label">
              <label>ละติจูด</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="lat"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ละติจูด']"
                dense
                class="form-input"
              />
            </div>
          </div>
          <div class="row q-mb-lg form-row">
            <div class="col-3 form-label">
              <label>ลองติจูด</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="lng"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ลองติจูด']"
                dense
                class="form-input"
              />
            </div>
          </div>
          <div class="row q-mb-lg form-row">
            <div class="col-3 form-label">
              <label>จำนวนชั้น</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model.number="floorCount"
                type="number"
                lazy-rules
                :rules="[
                  (val) => !!val || 'กรุณาใส่จำนวนชั้น',
                  (val) => val > 0 || 'จำนวนชั้นต้องมากกว่า 0',
                  (val) => val <= 100 || 'จำนวนชั้นไม่ควรเกิน 100',
                ]"
                dense
                class="form-input"
                hint="ระบุจำนวนชั้นทั้งหมดของอาคาร"
              />
            </div>
          </div>
          <div class="row q-mb-lg form-row">
            <div class="col-3 form-label">
              <label>โลเคชั่น</label>
            </div>
            <div class="col-9">
              <q-select
                filled
                v-model="selectedSite"
                label="เลือกโลเคชั่น"
                dense
                class="form-input"
                :options="siteStore.sites"
                option-label="sites_name"
                option-value="id"
                emit-value
                map-options
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาเลือกโลเคชั่น']"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- ปุ่มล่างสุดขวา -->

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
import { useRouter, useRoute } from 'vue-router'
import { useBuildingStore } from 'src/stores/locationStore/buildingStore'
import { useSiteStore } from 'src/stores/locationStore/siteStore'
import { ref, onMounted, computed } from 'vue'

const route = useRoute()
const siteStore = useSiteStore()
const selectedSite = ref<number | null>(null)
const editingId = ref<number | null>(null)

const isEditMode = computed(() => !!editingId.value)
const pageTitle = computed(() => (isEditMode.value ? 'แก้ไขอาคาร' : 'เพิ่มอาคาร (Building)'))

onMounted(async () => {
  await siteStore.fetchSites()

  if (route.params.id) {
    const buildingId = Number(route.params.id)
    const building = await buildingStore.fetchBuildingById(buildingId) // ต้องมีใน store
    if (building) {
      editingId.value = building.id
      name.value = building.build_name
      lat.value = String(building.lat)
      lng.value = String(building.lng)
      selectedSite.value = building.site_id
      globalId.value = building.global_id
      floorCount.value = building.floor_count || 1
    }
  }
})

const router = useRouter()
const buildingStore = useBuildingStore()

const name = ref('')
const lat = ref('')
const lng = ref('')
const floorCount = ref<number>(1) // จำนวนชั้น default = 1
const globalId = ref<number>(1) // หรือ ref เป็นค่าที่ต้องการ

const cancelForm = () => {
  router.go(-1)
}

const submitForm = async () => {
  if (!name.value || !lat.value || !lng.value || !selectedSite.value || !floorCount.value) {
    alert('กรุณากรอกข้อมูลให้ครบ')
    return
  }

  const payload = {
    build_name: name.value.trim(),
    lat: parseFloat(lat.value),
    lng: parseFloat(lng.value),
    site_id: selectedSite.value,
    global_id: globalId.value,
    floor_count: floorCount.value, // ✅ ส่งจำนวนชั้น
  }

  try {
    if (editingId.value) {
      // ถ้ามี id แปลว่าแก้ไข (update)
      await buildingStore.updateBuilding(editingId.value, payload)
    } else {
      // ไม่มี id แปลว่าเพิ่มใหม่ (create)
      await buildingStore.createBuilding(payload)
    }
    await router.push({
      path: '/building-management',
      query: { site_id: String(selectedSite.value) },
    })
  } catch (error) {
    logger.error('Error creating building:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลอาคาร')
  }
}
</script>

<style scoped>
/* .bg-page {
  background: white;
  font-family: 'Sarabun', sans-serif;
} */
.black-border {
  border: 1px solid black;
}
.page-no-scroll {
  /* เพิ่มกัน scroll ซ้ำอีกชั้น */
  overflow: hidden !important;
}
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
  margin-bottom: 8px;
}
.form-label {
  font-size: 1.25rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
  font-weight: 500;
  align-items: center;
  display: flex;
  min-width: 90px;
}
.form-input :deep(.q-field__control) {
  font-size: 1.1rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}
.form-row {
  min-height: 64px;
}

.form-full {
  position: relative;
  min-height: 70vh;
}
</style>
