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
      <q-toolbar-title class="form-title">เพิ่มชั้น (Floor)</q-toolbar-title>
    </div>
    <q-separator />
    <br /><br />

    <q-form @submit.prevent="submitForm" class="form-full">
      <div class="row q-col-gutter-md">
        <div class="col-7">
          <!-- ชื่อ -->
          <div class="row q-mb-md align-items-center">
            <div class="col-3 text-left form-label">
              <label>ชื่อ</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="floorForm.name"
                dense
                class="q-mb-md"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณากรอกชื่อ']"
              />
            </div>
          </div>
          <!-- ชื่อภาษาอังกฤษ -->
          <div class="row q-mb-md align-items-center">
            <div class="col-3 text-left form-label">
              <label>ชื่อ ภาษาอังกฤษ</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="floorForm.nameEn"
                dense
                class="q-mb-md"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณากรอกชื่อภาษาอังกฤษ']"
              />
            </div>
          </div>
          <!-- หมายเหตุ -->
          <div class="row q-mb-md align-items-start">
            <div class="col-3 text-left form-label" style="padding-top: 8px">
              <label>หมายเหตุ</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="floorForm.remark"
                type="textarea"
                autogrow
                class="q-mb-md"
                style="min-height: 0px; width: 100%"
                placeholder="กรอกหมายเหตุ"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ปุ่ม -->

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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useFloorStore } from 'src/stores/locationStore/floorStore'

const router = useRouter()
const route = useRoute()
const floorStore = useFloorStore()
const editingId = ref<number | null>(null)

const floorForm = ref({
  name: '',
  nameEn: '',
  remark: '',
  buildId: null as number | null, // เก็บ id อาคาร
})

// อ่าน build_id จาก query string ตอนโหลดหน้า
onMounted(async () => {
  const buildIdParam = route.query.build_id
  if (typeof buildIdParam === 'string') {
    const parsedBuildId = parseInt(buildIdParam)
    if (!isNaN(parsedBuildId)) {
      floorForm.value.buildId = parsedBuildId
    }
  }

  // โหมดแก้ไข ถ้ามี params.id
  if (route.params.id) {
    const floorId = Number(route.params.id)
    if (!isNaN(floorId)) {
      editingId.value = floorId
      const floor = await floorStore.fetchFloorById(floorId)
      if (floor) {
        floorForm.value = {
          name: floor.floor_name,
          nameEn: floor.floor_name_en,
          remark: floor.remark || '',
          buildId: floor.building?.id || null,
        }
      }
    }
  }
})

const cancelForm = () => {
  router.go(-1)
}

const submitForm = async () => {
  if (!floorForm.value.name || !floorForm.value.nameEn) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }
  if (!floorForm.value.buildId) {
    alert('ไม่พบข้อมูลอาคาร กรุณากลับไปเลือกอาคารก่อนเพิ่มชั้น')
    return
  }

  const payload = {
    floor_name: floorForm.value.name.trim(),
    floor_name_en: floorForm.value.nameEn.trim(),
    remark: floorForm.value.remark?.trim() || '',
    building_id: floorForm.value.buildId,
  }

  try {
    if (editingId.value) {
      // แก้ไขข้อมูล
      await floorStore.updateFloor(editingId.value, payload)
    } else {
      // สร้างใหม่
      await floorStore.createFloor(payload)
    }
    router.back()
  } catch (error) {
    logger.error('Error creating floor:', error)
    alert('เกิดข้อผิดพลาดในการเพิ่มชั้น')
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
.form-label {
  font-size: 1.25rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
  display: flex;
  align-items: center;
  min-height: 40px;
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
</style>
