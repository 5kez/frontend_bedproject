<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
      <div class="row items-center col-8">
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

        <q-toolbar-title class="form-title">ตั้งค่าเซนเซอร์</q-toolbar-title>
      </div>
    </div>
    <q-separator />
    <br />

    <q-form @submit.prevent="submitForm">
      <div class="row q-col-gutter-md">
        <!-- ส่วนข้อมูลผู้ป่วย -->
        <div class="col-7">
          <div class="row q-mb-md">
            <div
              class="col-3 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ชื่อเซนเซอร์</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="name"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ชื่อ Sensor']"
                dense
                style="margin-top: 15px"
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-3 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">Mac Address</label>
            </div>
            <div class="col-9">
              <q-input
                filled
                v-model="mac"
                lazy-rules
                dense
                :rules="[
                  (val) => !!val || 'กรุณาใส่ Mac Address',
                  (val) =>
                    /^([0-9A-Fa-f]{2}([-:])){5}([0-9A-Fa-f]{2})$/.test(val) || 'รูปแบบไม่ถูกต้อง',
                  (val) => checkMacUnique(val), // rule เช็คซ้ำ
                ]"
                style="margin-top: 15px"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-3 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large; margin-top: 20px">หมายเหตุ</label>
            </div>
            <div class="col-9">
              <q-input filled v-model="desc" dense style="margin-top: 15px" />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-3 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">ประเภทเซนเซอร์</label>
            </div>
            <div class="col-9" style="margin-top: 35px">
              <q-select
                filled
                v-model="sensorsType"
                label="ประเภทเซ็นเซอร์"
                dense
                class="q-mb-md"
                :options="sensorStore.sensorsType"
                option-label="name"
                option-value="id"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาเลือกประเภทเซ็นเซอร์']"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- ปุ่มกด -->
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
import { type Sensor } from 'src/models'
import { type SensorType } from 'src/models'
import { useSensorStore } from 'src/stores/sensorStore/sensorStore'
import { nextTick, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore/authStore'
const sensorStore = useSensorStore()
const authStore = useAuthStore()
const route = useRoute()
const name = ref('')
const mac = ref('')
const desc = ref('')
const sensorsType = ref<SensorType | null>(null)
const router = useRouter()

const cancelForm = () => {
  clearForm()
  router.go(-1)
}

const clearForm = () => {
  name.value = ''
  mac.value = ''
  desc.value = ''
  sensorsType.value = null
}

const submitForm = async () => {
  if (!name.value || !mac.value || !sensorsType.value) {
    return
  }

  const sensorformData: Partial<Sensor> = {
    name: name.value.trim(),
    mac: mac.value.trim(),
    desc: desc.value?.trim(),
    sensorType_Id: sensorsType.value.id,
    site_Id: authStore.currentUser?.site_id ?? null, // เพิ่ม site_Id ที่นี่
  }

  try {
    logger.log(route.query.id)
    if (route.query.id) {
      const sensorId = Number(route.query.id)
      await sensorStore.updateSensor(sensorId, sensorformData) // ต้องมีฟังก์ชันนี้ใน store
    } else {
      await sensorStore.addSensor(sensorformData)
    }
    clearForm()
    await nextTick()
    router.go(-1)
  } catch (error) {
    logger.error('Error adding sensor:', error)
  }
}

onMounted(async () => {
  await sensorStore.getSensorType()
  if (route.query.id) {
    const sensorId = Number(route.query.id)
    const sensor = await sensorStore.getSensorById(sensorId)
    if (sensor) {
      name.value = sensor.name
      mac.value = sensor.mac
      desc.value = sensor.desc
      // ค้นหา SensorType ที่ตรงกับ id
      sensorsType.value =
        sensorStore.sensorsType.find((type) => type.id === sensor.sensorType_Id) || null
    }
  }
})

async function checkMacUnique(val: string) {
  if (!val) return true
  const isUnique = await sensorStore.isMacUnique(val)
  return isUnique || 'Mac Address นี้ถูกใช้แล้ว'
}
</script>

<style scoped>
.black-border {
  border: 1px solid black;
}
.form-title {
  font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
  font-size: 2rem;
  line-height: 2;
}
/* .bg-page {
  background: white;
  font-family: 'Sarabun', sans-serif;
} */
</style>
