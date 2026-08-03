<template>
  <q-page class="q-pa-md bg-page">
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
      <q-toolbar-title class="form-title">{{
        editingId ? 'แก้ไขแผนก' : 'เพิ่มแผนก'
      }}</q-toolbar-title>
    </div>
    <q-separator />
    <br /><br />

    <q-form @submit.prevent="submitForm" class="form-full">
      <div class="row q-col-gutter-md">
        <!-- ด้านซ้าย: ฟอร์ม -->
        <div class="col-7">
          <!-- ชื่อแผนก -->
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ชื่อแผนก</label>
            </div>
            <div class="col-9">
              <q-input v-model="form.department_name" label="ชื่อแผนก" filled dense />
            </div>
          </div>

          <!-- เลือกตึก -->
          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">เลือกตึก</label>
            </div>
            <div class="col-9">
              <q-select
                v-model="selectedBuildings"
                :options="availableBuildings"
                option-label="build_name"
                option-value="id"
                filled
                dense
                multiple
                emit-value
                map-options
                @update:model-value="onBuildingSelected"
                :rules="[(val) => val?.length > 0 || 'กรุณาเลือกตึก']"
                hint="หลังจากเลือกตึกแรก จะแสดงเฉพาะตึกใน site เดียวกัน"
              />
            </div>
          </div>

          <!-- เลือกชั้น -->
          <div v-for="bId in selectedBuildings" :key="bId" class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">{{ getBuildingName(bId) }} ชั้น</label>
            </div>
            <div class="col-9">
              <q-select
                v-model="buildingFloorMap[bId]"
                :options="getFloorOptions(bId)"
                filled
                dense
                multiple
                emit-value
                :rules="[(val) => val?.length > 0 || 'กรุณาเลือกชั้น']"
                hint="เลือกหมายเลขชั้น (1, 2, 3, ...)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ปุ่มบันทึก/ยกเลิก -->
      <div class="row justify-end q-mt-md">
        <q-btn label="บันทึก" type="submit" color="primary" class="q-mr-sm" />
        <q-btn label="ยกเลิก" @click="cancelForm" flat />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBuildingStore } from 'src/stores/locationStore/buildingStore'
import { useFloorStore } from 'src/stores/locationStore/floorStore'
import { useDepartmentStore } from 'src/stores/departmentStore/departmentStore'
import type { DepartmentFormPayload } from '@/models'

const router = useRouter()
const route = useRoute()
const buildingStore = useBuildingStore()
const floorStore = useFloorStore()
const departmentStore = useDepartmentStore()
const form = reactive({ department_name: '' })
const selectedBuildings = ref<number[]>([])
const buildingFloorMap = reactive<Record<number, number[]>>({})
const editingId = ref<number | null>(null)

// กรองตึกให้เหลือแค่ site เดียวกัน
const availableBuildings = computed(() => {
  // ถ้ายังไม่เลือกตึกไหน ให้แสดงทั้งหมด
  if (selectedBuildings.value.length === 0) {
    return buildingStore.buildings
  }

  // หา site_id ของตึกแรกที่เลือก
  const firstBuildingId = selectedBuildings.value[0]
  const firstBuilding = buildingStore.buildings.find((b) => b.id === firstBuildingId)
  const siteId = firstBuilding?.site_id

  if (!siteId) return buildingStore.buildings

  // กรองให้เหลือแค่ตึกที่มี site_id เดียวกัน
  return buildingStore.buildings.filter((b) => b.site_id === siteId)
})

// เมื่อเลือกตึก → โหลดชั้นที่สัมพันธ์กับตึก
const onBuildingSelected = (bIds: number[]) => {
  // ลบตึกที่ไม่ได้เลือกออก
  Object.keys(buildingFloorMap).forEach((k) => {
    if (!bIds.includes(Number(k))) delete buildingFloorMap[Number(k)]
  })

  // เพิ่มตึกใหม่
  bIds.forEach((bId) => {
    if (!buildingFloorMap[bId]) buildingFloorMap[bId] = []
  })
}

// สร้าง floor options ตามจำนวนชั้นของแต่ละตึก
const getFloorOptions = (buildingId: number) => {
  const building = buildingStore.buildings.find((b) => b.id === buildingId)
  const floorCount = building?.floor_count || 1
  const options = []
  for (let i = 1; i <= floorCount; i++) {
    options.push({
      label: `ชั้น ${i}`,
      value: i,
    })
  }
  return options
}

const cancelForm = () => router.go(-1)

const getBuildingName = (bId: number) =>
  buildingStore.buildings.find((b) => b.id === bId)?.build_name ?? ''

// watch selectedBuildings เพื่อ init array
watch(
  selectedBuildings,
  (newVal) => {
    newVal.forEach((bId) => {
      if (!buildingFloorMap[bId]) buildingFloorMap[bId] = []
    })
    Object.keys(buildingFloorMap).forEach((k) => {
      const id = Number(k)
      if (!newVal.includes(id)) delete buildingFloorMap[id]
    })
  },
  { immediate: true },
)

const submitForm = async () => {
  if (!form.department_name) return alert('กรุณากรอกชื่อแผนก')
  if (!selectedBuildings.value.length) return alert('กรุณาเลือกตึก')

  for (const bId of selectedBuildings.value) {
    if (!buildingFloorMap[bId]?.length) {
      return alert(`กรุณาเลือกชั้นสำหรับตึก ${getBuildingName(bId)}`)
    }
  }

  const mappings = selectedBuildings.value.flatMap((bId) =>
    (buildingFloorMap[bId] ?? []).map((floorNum) => ({
      building_id: bId,
      floor_number: floorNum, // ✅ ใช้ floor_number แทน floor_id
    })),
  )

  const payload: DepartmentFormPayload = { department_name: form.department_name, mappings }

  try {
    if (editingId.value) {
      await departmentStore.updateDepartment(editingId.value, payload)
    } else {
      await departmentStore.createDepartment(payload)
    }
    // หน่วงเวลา 500ms ก่อนย้อนกลับ
    await new Promise((resolve) => setTimeout(resolve, 500))
    router.back()
  } catch (err) {
    logger.error(err)
    alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
  }
}

onMounted(async () => {
  await buildingStore.fetchBuildings()
  await floorStore.fetchFloors()

  const id = route.params.id ? Number(route.params.id) : null
  if (id) {
    editingId.value = id
    const dept = await departmentStore.fetchDepartmentById(id)
    logger.log('🔍 Fetched department:', dept)
    if (dept) {
      // ✅ API returns 'name' property, not 'department_name'
      form.department_name = dept.name
      logger.log('📝 Set department_name to:', dept.name)

      // clear ก่อน
      selectedBuildings.value = []
      Object.keys(buildingFloorMap).forEach((k) => delete buildingFloorMap[Number(k)])

      // ✅ preload ทุก mapping - ใช้ floor_number แทน floor.id
      dept.departmentBuildings.forEach((db) => {
        logger.log('🏢 Processing building:', db.building.build_name, 'floor:', db.floor_number)
        const bId = db.building.id
        const floorNum = db.floor_number

        if (!selectedBuildings.value.includes(bId)) selectedBuildings.value.push(bId)
        if (!buildingFloorMap[bId]) buildingFloorMap[bId] = []
        if (floorNum != null && !buildingFloorMap[bId].includes(floorNum)) {
          buildingFloorMap[bId].push(floorNum)
        }
      })
      logger.log('✅ selectedBuildings:', selectedBuildings.value)
      logger.log('✅ buildingFloorMap:', buildingFloorMap)
    } else {
      logger.log('❌ Department not found')
    }
  }
})
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
/* .bg-page {
  background: white;
  font-family: 'Sarabun', sans-serif;
} */
</style>
