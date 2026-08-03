<template>
  <q-page class="q-pa-md" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center q-mb-lg no-wrap q-gutter-x-md">
      <div class="col-6 row items-center">
        <q-icon name="info" size="md" class="q-mr-sm" />
        <q-toolbar-title class="text-h5">ตั้งค่า Template</q-toolbar-title>
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
          />
        </div>
      </div>
    </div>
    <q-separator />

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

onMounted(async () => {
  await sensorStore.getSensorType()
  await sensorStore.getTemplates()
  sensorsType.value = (await sensorStore.getSensorById(Number(route.query.id))) || null
})
</script>

<style scoped></style>
