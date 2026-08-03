<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
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
      <q-toolbar-title class="form-title"> จัดการแผนก</q-toolbar-title>

      <!-- Search -->
      <div class="rowcol-2">
        <q-input
          outlined
          dense
          v-model="search"
          placeholder="ค้นหาแผนก"
          class="q-mx-md"
          style="width: 330px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Add Department -->
      <q-btn
        class="q-px-md bg-white text-black"
        flat
        style="border: 1px solid #ccc"
        @click="$router.push({ name: 'DepartmentForm' })"
      >
        <div class="row items-center no-wrap">
          <span class="q-mr-sm">เพิ่ม</span>
          <q-btn
            round
            icon="add"
            color="black"
            text-color="white"
            class="q-ml-sm"
            style="width: 2px; height: 2px; font-size: 10px"
          />
        </div>
      </q-btn>
    </div>

    <!-- Table -->
    <div>
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        separator="cell"
        class="global-table"
        flat
        bordered
        :rows-per-page-options="[5, 10, 13]"
        :pagination="{ rowsPerPage: 13, page: 1 }"
        :pagination-label="getPaginationLabel"
        rows-per-page-label="จำนวนต่อหน้า:"
      >
        <!-- ปุ่ม Action -->
        <template v-slot:body-cell-manage="props">
          <q-td :props="props">
            <q-btn
              round
              dense
              color="primary"
              icon="create"
              style="margin-right: 4px"
              @click="router.push({ name: 'DepartmentForm', params: { id: props.row.id } })"
            >
              <q-tooltip>แก้ไขแผนก</q-tooltip>
            </q-btn>
            <q-btn round dense color="negative" icon="delete" @click="confirmDelete(props.row.id)">
              <q-tooltip>ลบแผนก</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDepartmentStore } from 'src/stores/departmentStore/departmentStore'
import { useDialogStore } from 'src/stores/dialogStore/dialogStore'
import { storeToRefs } from 'pinia'
import type { DepartmentDTO } from 'src/models'
import { isAxiosError } from 'axios'

const router = useRouter()
const departmentStore = useDepartmentStore()
const dialogStore = useDialogStore()

// ✅ ผูก reactive กับ store โดยตรง (เลิกก็อปใส่ ref แยก เพื่อลด bug)
const { departments } = storeToRefs(departmentStore)

const search = ref('')

const rows = computed<DepartmentDTO[]>(() => {
  const list = departments.value || []
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter((d) => (d.department_name || '').toLowerCase().includes(q))
})

const confirmDelete = async (id: number) => {
  const isConfirmed = await dialogStore.openDialog(
    'คุณต้องการลบข้อมูลนี้ใช่หรือไม่?',
    'confirm-cancel',
  )
  if (isConfirmed) {
    try {
      await departmentStore.deleteDepartment(id)
      // ไม่ต้องเซ็ต rows เอง เพราะ rows อ่านจาก store โดยตรง
    } catch (error: unknown) {
      // Show error message to user
      const errorMessage = isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message || error.message
        : 'เกิดข้อผิดพลาดในการลบแผนก'
      await dialogStore.openDialog(errorMessage || 'เกิดข้อผิดพลาดในการลบแผนก', 'confirm')
    }
  }
}

onMounted(async () => {
  await departmentStore.fetchDepartments()
})

const getPaginationLabel = (start: number, end: number, total: number) =>
  `${start} - ${end} จากทั้งหมด ${total}`

const columns = [
  {
    name: 'name',
    label: 'ชื่อแผนก',
    field: (row: DepartmentDTO) => row.department_name,
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'location',
    label: 'ตำแหน่ง',
    field: (row: DepartmentDTO) => {
      if (row.departmentBuildings && row.departmentBuildings.length) {
        // Group by building
        const buildingMap = new Map<number, { name: string; floors: number[] }>()

        row.departmentBuildings.forEach((b) => {
          const buildingId = b.building.id
          const buildingName = b.building.build_name
          const floorNum = b.floor_number

          if (!buildingMap.has(buildingId)) {
            buildingMap.set(buildingId, { name: buildingName, floors: [] })
          }

          if (floorNum != null) {
            buildingMap.get(buildingId)!.floors.push(floorNum)
          }
        })

        // Format output: "ตึกอายุรกรรม ชั้น 2,4,6,7"
        return Array.from(buildingMap.values())
          .map((b) => {
            if (b.floors.length === 0) return `${b.name} -`
            // Sort floors numerically
            const sortedFloors = b.floors.sort((a, b) => a - b)
            return `${b.name} ชั้น ${sortedFloors.join(',')}`
          })
          .join(', ')
      }
      return '-'
    },
    align: 'center' as const,
    sortable: false,
  },
  {
    name: 'manage',
    label: 'จัดการ',
    field: 'id',
    align: 'center' as const,
    sortable: false,
  },
]
</script>

<style scoped>
.button {
  width: 100px;
  border: 1px solid black;
  border-radius: 0%;
}

.card_template {
  border: 1px solid black;
  border-radius: 2;
}

/* .bg-page {
  background: white;
  font-family: 'Sarabun', sans-serif;
} */

.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

/* ✅ เพิ่ม styling เหมือน sensor table - คัดลอกจาก NotificationHistory */
:deep(.bed-table) {
  border: 1px solid #000;
  border-radius: 0;
  width: 100%;
  font-family: 'Sarabun', sans-serif;
  min-height: 600px;
}

:deep(.bed-table thead tr) {
  background-color: #222d32;
}

:deep(.bed-table thead th) {
  color: white;
  font-size: 16px;
  font-weight: bold;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 12px;
  text-align: center !important;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  vertical-align: middle;
  box-sizing: border-box;
}

:deep(.bed-table thead th:first-child),
:deep(.bed-table tbody td:first-child) {
  border-left: 1px solid #000;
}

:deep(.bed-table tbody td) {
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  padding: 8px 12px;
  text-align: center !important;
  font-size: 14px !important;
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  vertical-align: middle;
  box-sizing: border-box !important;
}

:deep(.bed-table .q-table__middle tbody tr) {
  height: 50px !important;
  max-height: 50px !important;
  min-height: 50px !important;
  box-sizing: border-box !important;
  border-bottom: 1px solid #000;
}

/* ✅ เพิ่ม zebra striping - สลับสีเทา-ขาว */
:deep(.bed-table .q-table__middle tbody tr:nth-child(even)) {
  background-color: #f5f5f5;
}

:deep(.bed-table .q-table__middle tbody tr:nth-child(odd)) {
  background-color: #ffffff;
}

:deep(.bed-table .q-table__middle tbody tr:hover) {
  background-color: #e3f2fd !important;
}

/* ✅ Pagination controls */
:deep(.bed-table .q-table__bottom) {
  display: flex;
  justify-content: flex-end;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

:deep(.bed-table .q-table__bottom .q-table__control) {
  justify-content: flex-end;
}

/* ✅ ลบกรอบของ dropdown pagination */
:deep(.bed-table .q-table__bottom .q-field--outlined .q-field__control) {
  border: none;
}

:deep(.bed-table .q-table__bottom .q-field__control:before) {
  border: none;
}

:deep(.bed-table .q-table__bottom .q-field__control:after) {
  border: none;
}

/* ✅ ซ่อน scrollbar ทั้งหมด */
:deep(*) {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

:deep(*::-webkit-scrollbar) {
  width: 0px;
  background: transparent; /* Chrome/Safari/Webkit */
}

/* ✅ Remove table container border - DepartmentManagement */
:deep(.q-table__container) {
  border: none !important;
}

:deep(.q-table--bordered) {
  border: none !important;
}

:deep(.global-table.q-table--bordered) {
  border: none !important;
}

/* ✅ Remove pagination border - DepartmentManagement */
:deep(.q-table__bottom) {
  border: none !important;
}

/* ✅ Hide the separator line completely */
:deep(.q-table__separator) {
  display: none !important;
}

/* ✅ Make headers larger and bolder */
:deep(.global-table thead th) {
  font-size: 20px !important;
  font-weight: 900 !important;
}

:deep(.global-table tbody td) {
  font-size: 16px !important;
  font-weight: 400 !important;
}
</style>
