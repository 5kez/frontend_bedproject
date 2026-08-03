<template>
  <q-page class="q-pa-md bg-page">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <q-icon
        v-for="size in ['md']"
        :key="size"
        :size="size"
        name="info"
        class="text-h5 q-mr-sm"
        style="display: inline-block; vertical-align: middle"
      />
      <q-toolbar-title class="form-title">
        {{ editingId ? 'แก้ไขเตียง' : 'เพิ่มเตียง' }}
      </q-toolbar-title>
    </div>
    <q-separator class="q-mb-md" />

    <q-form @submit.prevent="submitForm" class="form-full">
      <div class="row q-col-gutter-md">
        <!-- Form -->
        <div class="col-7">
          <!-- Department -->
          <div class="row q-mb-md">
            <div class="col-3 flex items-center">
              <label style="font-size: large">แผนก</label>
            </div>
            <div class="col-9">
              <q-select
                v-model="form.departmentId"
                :options="departments"
                option-label="name"
                option-value="id"
                emit-value
                map-options
                filled
                dense
                :rules="[(val) => !!val || 'กรุณาเลือกแผนก']"
              />
            </div>
          </div>

          <!-- Building -->
          <div class="row q-mb-md">
            <div class="col-3 flex items-center">
              <label style="font-size: large">ตึก</label>
            </div>
            <div class="col-9">
              <q-select
                v-model="form.buildingId"
                :options="filteredBuildings"
                option-label="name"
                option-value="id"
                filled
                dense
                emit-value
                map-options
                :disable="!form.departmentId"
                :rules="[(val) => !!val || 'กรุณาเลือกตึก']"
              />
            </div>
          </div>

          <!-- Floor -->
          <div class="row q-mb-md">
            <div class="col-3 flex items-center">
              <label style="font-size: large">ชั้น</label>
            </div>
            <div class="col-9">
              <q-select
                v-model="form.floorNumber"
                :options="filteredFloors"
                option-label="name"
                option-value="value"
                emit-value
                map-options
                :disable="!form.buildingId"
                filled
                dense
                :rules="[(val) => val != null || 'กรุณาเลือกชั้น']"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="row justify-end q-mt-md">
        <q-btn label="บันทึก" type="submit" class="q-mr-sm q-px-lg" color="primary" />
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDepartmentStore } from 'src/stores/departmentStore/departmentStore'
import { useBedStore } from 'src/stores/bedStore/bedStore'

const router = useRouter()
const route = useRoute()

// Stores
const departmentStore = useDepartmentStore()
const bedStore = useBedStore()

const editingId = ref<number | null>(null)

interface BedForm {
  departmentId: number | null
  buildingId: number | null
  floorNumber: number | null
}

const form = ref<BedForm>({
  departmentId: null,
  buildingId: null,
  floorNumber: null,
})

// Load data
const departments = ref<{ id: number; name: string }[]>([])
const buildings = ref<{ id: number; name: string; departmentId: number }[]>([])

const departmentBuildings = ref<
  Array<{
    id: number
    department: { id: number; department_name: string }
    building: { id: number; build_name: string }
    floor_number: number | null
  }>
>([])

onMounted(async () => {
  try {
    // 1) load from backend
    await departmentStore.fetchDepartments()
    logger.log('fetchDepartments done, count=', departmentStore.departments.length)
    logger.log(
      '📋 All department IDs:',
      departmentStore.departments.map((d) => d.id),
    )

    // 2) build departments array for select
    departments.value = departmentStore.departments.map((d) => ({
      id: d.id,
      name: d.department_name, //
    }))
    logger.log('departments mapped:', departments.value)

    // 3) build departmentBuildings safely - now using floor_number
    departmentBuildings.value = departmentStore.departments.flatMap((d) =>
      (d.departmentBuildings || [])
        .filter((db) => db.building && db.floor_number != null) // floor_number can be 0
        .map((db) => ({
          id: db.id,
          department: { id: d.id, department_name: d.department_name },
          building: db.building,
          floor_number: db.floor_number as number, // TypeScript: after filter, it's guaranteed to be number
        })),
    )
    logger.log('departmentBuildings:', departmentBuildings.value)

    // 4) build unique buildings
    buildings.value = departmentBuildings.value
      .map((db) => ({
        id: db.building.id,
        name: db.building.build_name,
        departmentId: db.department.id,
      }))
      .filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i)

    // edit mode: load bed
    if (route.params.id) {
      const bedId = Number(route.params.id)
      logger.log('📝 Edit mode: loading bed ID:', bedId)
      const bed = await bedStore.fetchBedById(bedId)
      logger.log('🛏️ Loaded bed data:', bed)
      logger.log('🔗 departmentBuilding:', bed?.departmentBuilding)

      if (bed && bed.departmentBuilding) {
        const deptBuilding = bed.departmentBuilding
        const deptBuildingId = deptBuilding.id

        // Check if this department_building exists in our list
        logger.log('🔍 Looking for department_building_id:', deptBuildingId)
        const matchingDeptBuilding = departmentBuildings.value.find(
          (db) => db.id === deptBuildingId,
        )
        logger.log('📋 Found in departmentBuildings:', matchingDeptBuilding)

        // If not found, add it to the list (data inconsistency case)
        if (!matchingDeptBuilding && deptBuilding.department && deptBuilding.building) {
          logger.log('⚠️ Department building not in list, adding it...')

          // Add department if not exists
          const deptId = deptBuilding.department.id
          if (!departments.value.find((d) => d.id === deptId)) {
            departments.value.push({
              id: deptId,
              name: deptBuilding.department.name,
            })
          }

          // Add to departmentBuildings
          departmentBuildings.value.push({
            id: deptBuilding.id,
            department: {
              id: deptBuilding.department.id,
              department_name: deptBuilding.department.name,
            },
            building: {
              id: deptBuilding.building.id,
              build_name: deptBuilding.building.build_name,
            },
            floor_number: deptBuilding.floor_number ?? null,
          })

          logger.log('✅ Added missing department_building')
        }

        editingId.value = bedId
        form.value.departmentId = deptBuilding.department?.id ?? null
        form.value.buildingId = deptBuilding.building?.id ?? null
        form.value.floorNumber = deptBuilding.floor_number ?? null
        logger.log('✅ Form populated:', {
          departmentId: form.value.departmentId,
          buildingId: form.value.buildingId,
          floorNumber: form.value.floorNumber,
        })

        // Wait a bit for computed to update
        await nextTick()
        logger.log('🔍 After nextTick:')
        logger.log('  - filteredBuildings:', filteredBuildings.value)
        logger.log('  - filteredFloors:', filteredFloors.value)
        logger.log('  - form values:', {
          departmentId: form.value.departmentId,
          buildingId: form.value.buildingId,
          floorNumber: form.value.floorNumber,
        })

        // Force trigger filteredFloors computed to see logs
        if (filteredFloors.value.length === 0) {
          logger.log('❌ filteredFloors is empty, checking why...')
          logger.log('  - departmentBuildings.value length:', departmentBuildings.value.length)
          logger.log(
            '  - Matching dept+building:',
            departmentBuildings.value.filter(
              (db) =>
                db.department.id === form.value.departmentId &&
                db.building.id === form.value.buildingId,
            ),
          )
        }
      }
    }
  } catch (err) {
    logger.error('onMounted error:', err)
  }
})

const filteredBuildings = computed(() => {
  if (!form.value.departmentId) return []
  return departmentBuildings.value
    .filter((db) => db.department.id === form.value.departmentId)
    .map((db) => ({ id: db.building.id, name: db.building.build_name }))
    .filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i)
})

const filteredFloors = computed(() => {
  if (!form.value.buildingId || !form.value.departmentId) return []

  logger.log('🔍 Filtering floors for:', {
    departmentId: form.value.departmentId,
    buildingId: form.value.buildingId,
    allDepartmentBuildings: departmentBuildings.value,
  })

  // Get unique floor numbers for selected department AND building
  const filtered = departmentBuildings.value.filter((db) => {
    const match =
      db.department.id === form.value.departmentId &&
      db.building.id === form.value.buildingId &&
      db.floor_number != null
    logger.log('Checking db:', {
      dbId: db.id,
      deptId: db.department.id,
      buildId: db.building.id,
      floorNum: db.floor_number,
      match,
    })
    return match
  })

  logger.log('✅ Filtered departmentBuildings:', filtered)

  const floorNumbers = filtered
    .map((db) => db.floor_number as number)
    .filter((v, i, a) => a.indexOf(v) === i) // unique values
    .sort((a, b) => a - b) // sort numerically

  logger.log('🏢 Found floor numbers:', floorNumbers)

  return floorNumbers.map((num) => ({
    value: num,
    name: `ชั้น ${num}`,
  }))
})

watch(
  () => form.value.departmentId,
  (val, oldVal) => {
    logger.log('🔔 Watch departmentId:', { val, oldVal })
    // Only reset if user actually changed it (not from null to value during load)
    if (oldVal !== null && oldVal !== val) {
      logger.log('  → Resetting buildingId and floorNumber')
      form.value.buildingId = null
      form.value.floorNumber = null
    }
  },
)
watch(
  () => form.value.buildingId,
  (val, oldVal) => {
    logger.log('🔔 Watch buildingId:', { val, oldVal })
    // Only reset if user actually changed it (not from null to value during load)
    if (oldVal !== null && oldVal !== val) {
      logger.log('  → Resetting floorNumber')
      form.value.floorNumber = null
    }
  },
)

// Form submit
const submitForm = async () => {
  try {
    if (!form.value.departmentId || !form.value.buildingId || form.value.floorNumber == null) {
      alert('กรุณาเลือกข้อมูลให้ครบถ้วน')
      return
    }

    logger.log('🔍 Searching for department_building with:')
    logger.log('  - Department ID:', form.value.departmentId)
    logger.log('  - Building ID:', form.value.buildingId)
    logger.log('  - Floor Number:', form.value.floorNumber)
    logger.log('📋 Available departmentBuildings:', departmentBuildings.value)

    // หา department_building_id ที่ตรงกับ Department + Building + Floor Number
    const selectedDepartmentBuilding = departmentBuildings.value.find((db) => {
      logger.log('Checking:', {
        dbDeptId: db.department.id,
        dbBuildId: db.building.id,
        dbFloorNum: db.floor_number,
        match:
          db.department.id === form.value.departmentId &&
          db.building.id === form.value.buildingId &&
          db.floor_number === form.value.floorNumber,
      })
      return (
        db.department.id === form.value.departmentId &&
        db.building.id === form.value.buildingId &&
        db.floor_number === form.value.floorNumber
      )
    })

    logger.log('✅ Found:', selectedDepartmentBuilding)

    if (!selectedDepartmentBuilding) {
      alert('ไม่พบข้อมูล Department/Building/Floor ที่เลือก')
      return
    }

    const payload = {
      department_building_id: selectedDepartmentBuilding.id,
      // patient_id และ sensor_id จะเพิ่มทีหลัง
    }

    if (editingId.value) {
      await bedStore.updateBed(editingId.value, payload)
    } else {
      await bedStore.createBed(payload)
    }

    // ✅ ใช้ await หรือ void เพื่อไม่ให้ eslint ฟ้อง
    await router.push('/bed-management')
  } catch (error) {
    logger.error('Error submitting bed form:', error)
    alert('เกิดข้อผิดพลาดในการบันทึกเตียง')
  }
}

const cancelForm = () => {
  router.go(-1)
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
</style>
