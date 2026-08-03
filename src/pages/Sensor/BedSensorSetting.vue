<template>
  <q-page class="q-pa-md">
    <!-- แสดงข้อมูลเซนเซอร์และผู้ป่วย -->
    <div class="row q-mb-md">
      <q-card class="col-12 q-pa-md" flat bordered>
        <div class="row items-center">
          <div class="col-6">
            <div class="text-h6 q-mb-sm">ข้อมูลเซนเซอร์</div>
            <div class="text-subtitle1">
              <strong>ชื่อเซนเซอร์:</strong> {{ profile?.sensor?.name || 'ไม่ระบุ' }}
            </div>
            <div class="text-subtitle1">
              <strong>MAC Address:</strong> {{ profile?.sensor?.mac || 'ไม่ระบุ' }}
            </div>
          </div>
          <div class="col-6">
            <div class="text-h6 q-mb-sm">ข้อมูลผู้ป่วย</div>
            <div class="text-subtitle1">
              <strong>รหัสผู้ป่วย:</strong> {{ profile?.sensor?.patientId || 'ยังไม่ได้กำหนด' }}
            </div>
            <div class="text-subtitle1" v-if="profile?.sensor?.patient">
              <strong>ชื่อผู้ป่วย:</strong> {{ profile.sensor.patient.name }}
            </div>
            <div
              class="text-subtitle1"
              v-if="!profile?.sensor?.patient && profile?.sensor?.patientId"
            >
              <q-icon name="warning" color="orange" class="q-mr-xs" />
              <span class="text-orange">ไม่พบข้อมูลผู้ป่วย</span>
            </div>
          </div>
        </div>
      </q-card>
    </div>

    <div class="row q-gutter-md">
      <div
        v-for="(pose, index) in configList"
        :key="index"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card bordered class="q-pa-sm text-center q-pa-md card-color black-border">
          <!-- เปิด ปิดท่า -->
          <q-toggle v-model="pose.active" color="green" />
          <div label-class="text-subtitle2" class="text-h5">{{ pose.name }}</div>

          <!-- ระยะเวลา -->
          <div class="q-mt-sm">
            <q-input
              v-model.number="pose.delay"
              type="number"
              label="ระยะเวลา"
              suffix="วินาที"
              min="1"
              dense
              outlined
              class="q-mt-xs text-subtitle1"
            >
              <template v-slot:append>
                <q-icon name="hourglass_empty" size="sm" class="q-mt-xs" color="primary" />
              </template>
            </q-input>
          </div>

          <!-- จำนวนรอบ -->
          <div class="q-mt-sm">
            <q-input
              v-model.number="pose.repeat"
              type="number"
              label="วนซ้ำ"
              suffix="ครั้ง"
              min="1"
              dense
              outlined
              class="q-mt-xs text-subtitle1"
              ><template v-slot:append>
                <q-icon name="loop" size="sm" class="q-mt-xs" color="primary" /> </template
            ></q-input>
          </div>

          <!-- ความไว -->
          <div class="q-mt-sm text-subtitle1">
            <div>Sensitivity</div>
            <div class="row items-center justify-center">
              <q-btn
                round
                dense
                flat
                icon="remove"
                @click="pose.sensitivity = Math.max(1, pose.sensitivity - 1)"
              />
              <div class="q-mx-md text-subtitle1">{{ pose.sensitivity }}</div>
              <q-btn round dense flat icon="add" @click="pose.sensitivity = pose.sensitivity + 1" />
            </div>
          </div>
        </q-card>
      </div>
    </div>
    <!-- ปุ่มกด -->
    <div class="row justify-end q-mt-md">
      <q-btn
        label="บันทึก"
        type="submit"
        class="q-mr-sm q-px-lg"
        style="background-color: #222d32; color: white"
        @click="submitForm()"
      />
      <q-btn
        label="ยกเลิก"
        @click="router.go(-1)"
        color="white"
        class="black-border q-px-lg"
        text-color="black"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { type SensorPose, type SensorProfile } from 'src/models'
import { useSensorStore } from 'src/stores/sensorStore/sensorStore'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const sensorStore = useSensorStore()
const configList = ref<SensorPose[]>([])
const profile = ref<SensorProfile | null>(null)

const submitForm = () => {
  if (profile.value?.id != null) {
    sensorStore
      .updateSensorProfile(profile.value?.id, profile.value)
      .then(() => {
        router.go(-1)
      })
      .catch((error) => {
        logger.error('Error updating sensor profile:', error)
      })
  }
}

onMounted(async () => {
  await sensorStore.getSensorType()

  profile.value = await sensorStore.getSensorProfileBySensorID(Number(route.query.id))
  // ตรวจว่า profile และ config.poses มีจริงก่อน
  if (profile.value!.config) {
    configList.value = profile.value!.config.poses
  }

  logger.log('Sensor profile with patient info:', profile.value)
})
</script>

<style scoped>
.black-border {
  border: 1px solid black;
}

.card-color {
  color: 'primary';
  /* background-color: #d9e5ff; */
  opacity: 0.85;
}

.custom-icon-adjust {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
