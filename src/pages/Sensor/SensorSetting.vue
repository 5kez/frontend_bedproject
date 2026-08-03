<template>
  <q-page class="q-pa-md bg-page" style="font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
      <div class="col-6 row items-center">
        <q-icon name="info" size="md" class="q-mr-sm" />
        <q-toolbar-title style="vertical-align: middle" class="form-title"
          >ตั้งค่าการแจ้งเตือน</q-toolbar-title
        >
      </div>
      <div class="col-5 row justify-end items-center">
        <div class="q-mr-md">
          <q-toolbar-title class="text-subtitle1">เท็มเพลต</q-toolbar-title>
        </div>
        <div>
          <q-select
            filled
            v-model="template"
            label="เลือกเท็มเพลต"
            dense
            :options="sensorStore.templates"
            option-label="name"
            option-value="id"
            style="width: 350px"
            @update:model-value="templateDialog = true"
          />
        </div>
      </div>
    </div>
    <q-separator />

    <q-dialog v-model="templateDialog" persistent>
      <q-card style="width: 500px; height: 250px" class="card_template">
        <q-card-section align="center" style="margin-top: 40px">
          <div class="text-h4" style="text-align: center">ต้องการใช้ Template นี้ใช่หรือไม่</div>
        </q-card-section>

        <q-card-actions align="center" style="margin-top: 40px">
          <q-btn
            class="button"
            label="ยืนยัน"
            v-close-popup
            style="margin-right: 26px; background-color: #222d32; color: white"
            @click="
              // sensorStore.applyTemplate(templateSelected)
              templateDialog = false
            "
          />
          <q-btn
            flat
            class="button black-border"
            label="ยกเลิก"
            color="secondry"
            v-close-popup
            @click="templateDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Body Setting -->
    <BedSensorSetting v-if="sensorsType?.sensorType_Id === 1" :id="sensorId" />
  </q-page>
</template>

<script setup lang="ts">
import { type Sensor } from 'src/models'
import { useSensorStore } from 'src/stores/sensorStore/sensorStore'
import { onMounted, ref } from 'vue'
import BedSensorSetting from 'src/pages/Sensor/BedSensorSetting.vue'
import { useRoute } from 'vue-router'

const sensorsType = ref<Sensor | null>(null)
const template = ref('')
const sensorStore = useSensorStore()
const route = useRoute()
const sensorId = ref(route.query.id)
const templateDialog = ref(false)
// const templateSelected = ref<SensorTemplate | null>(null)

onMounted(async () => {
  await sensorStore.getSensorType()
  await sensorStore.getTemplates()
  sensorsType.value = (await sensorStore.getSensorById(Number(route.query.id))) || null
})
</script>

<style scoped>
.black-border {
  border: 1px solid black;
}

.bg-page {
  background: white;
  font-family: 'Sarabun', sans-serif;
}

.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}
</style>
