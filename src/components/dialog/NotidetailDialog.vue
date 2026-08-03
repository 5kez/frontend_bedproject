<template>
  <q-dialog :model-value="show" @update:model-value="closeDialog" persistent>
    <q-card class="dialog-card">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6 text-center full-width">ข้อมูลการแจ้งเตือน</div>
        <q-btn icon="close" flat round dense @click="closeDialog" class="close-button" />
      </q-card-section>

      <q-card-section class="q-pt-none notification-details">
        <div v-for="(value, key) in details" :key="key" class="q-mb-sm row">
          <div class="col-5 text-weight-bold field-label">{{ key }}</div>
          <div class="col-7 field-value">{{ value }}</div>
        </div>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          label="ยืนยัน"
          class="confirm-button"
          @click="
            () => {
              emit('confirm-noti', details['รหัสผู้ป่วย'])
              closeDialog()
            }
          "
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
const { show, details } = defineProps<{
  show: boolean
  details: Record<string, string | number>
}>()

const emit = defineEmits(['update:show', 'confirm-noti'])

const closeDialog = () => {
  emit('update:show', false)
}
</script>

<style scoped>
.dialog-card {
  width: 600px;
  max-width: 95vw;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  text-align: left;
  position: relative;
}

.notification-details div {
  margin-bottom: 8px;
}

/* ✅ จัดตำแหน่งเครื่องหมาย : ให้เท่ากัน */
.field-label {
  text-align: left !important;
  padding-right: 16px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  position: relative !important;
}

.field-label::after {
  content: ' :';
  position: absolute !important;
  right: 16px !important;
}

.field-value {
  padding-left: 8px !important;
}

.confirm-button {
  background-color: #222d32;
  color: white;
  width: 450px;
  font-size: 20px;
  font-weight: bold;
  padding: 8px 20px;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
