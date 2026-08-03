<!-- eslint-disable @typescript-eslint/restrict-template-expressions -->
<template>
  <q-dialog v-model="dialogModel" persistent style="font-family: 'Sarabun', sans-serif">
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center">
        <div class="text-h6">Export ข้อมูล</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="q-pb-md">
          <div class="text-subtitle2 q-pb-sm">เลือกรูปแบบการ Export</div>
          <q-btn-toggle
            v-model="exportType"
            :options="[
              { label: 'Excel', value: 'excel' },
              { label: 'CSV', value: 'csv' },
            ]"
            spread
            class="full-width"
          />
        </div>

        <div class="q-py-md">
          <div class="text-subtitle2 q-pb-sm">เลือกคอลัมน์ที่ต้องการ Export</div>
          <q-option-group
            v-model="selectedColumns"
            :options="columnOptions"
            type="checkbox"
            dense
          />
        </div>

        <div class="q-py-md">
          <div class="text-subtitle2 q-pb-sm">
            เลือกข้อมูล
            <span class="text-caption">({{ selectedRows.length }} รายการที่เลือก)</span>
          </div>
          <q-option-group v-model="selectedRows" :options="rowOptions" type="checkbox" dense />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="ยกเลิก" color="grey" v-close-popup />
        <q-btn flat label="Export" color="primary" @click="handleExport" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import * as XLSX from 'xlsx'

const props = defineProps<{
  show: boolean
  columns: { name: string; label: string }[]
  rows: Record<string, unknown>[]
}>()

const emit = defineEmits(['update:show'])

const dialogModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const exportType = ref('excel')
const selectedColumns = ref<string[]>([])
const selectedRows = ref<number[]>([])

// Generate options for columns
const columnOptions = computed(() => {
  return props.columns.map((col) => ({
    label: col.label,
    value: col.name,
  }))
})

// Generate options for rows
const rowOptions = computed(() => {
  return props.rows.map((row, index) => ({
    label: `${row.name as string} (${row.room as string})`,
    value: index,
  }))
})

// Reset selections when dialog opens
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      selectedColumns.value = props.columns.map((col) => col.name)
      selectedRows.value = props.rows.map((_, index) => index)
    }
  },
)

const handleExport = () => {
  // Filter data based on selections
  const filteredData = selectedRows.value.map((rowIndex) => {
    const row = props.rows[rowIndex]
    if (!row) return {} // Handle cases where row might be undefined
    const newRow: Partial<Record<string, string | number | boolean | null>> = {}
    selectedColumns.value.forEach((colName: string) => {
      const column = props.columns.find((col) => col.name === colName) as
        | { name: string; label: string }
        | undefined
      if (column && row[colName] !== undefined && row[colName] !== null) {
        // Ensure row[colName] is not undefined before casting
        newRow[column.label] = row[colName] as string | number | boolean
      }
    })
    return newRow
  })

  // Export based on selected type
  if (exportType.value === 'excel') {
    const ws = XLSX.utils.json_to_sheet(filteredData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, 'patient_data.xlsx')
  } else {
    // CSV Export
    const headers = selectedColumns.value
      .map((colName) => props.columns.find((col) => col.name === colName)?.label)
      .join(',')
    const rows = filteredData.map((row) => Object.values(row).join(',')).join('\n')
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'patient_data.csv'
    link.click()
  }

  dialogModel.value = false
}
</script>
