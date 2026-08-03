<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Main Page -->
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
          <q-toolbar-title style="vertical-align: middle" class="form-title">
            แดรชบอร์ด
          </q-toolbar-title>
        </div>
      </div>

      <q-card class="q-mb-md bg-cyan-1 text-black" @click="goToSleepPage" clickable bordered>
        <q-card-section class="row items-center justify-between" style="font-size: 20px">
          <div>สุขภาพการนอน</div>
          <q-icon name="bed" size="md" />
        </q-card-section>
      </q-card>

      <q-card class="q-mb-md bg-pink-2 text-black">
        <q-card-section class="row items-center justify-between" style="font-size: 20px">
          <div>อัตราการเต้นหัวใจ</div>
          <q-icon name="favorite" color="red" size="md" />
        </q-card-section>
      </q-card>

      <q-card class="bg-yellow-2 text-black">
        <q-card-section class="row items-center justify-between" style="font-size: 20px">
          <div>การแจ้งเตือน</div>
          <q-icon name="warning" color="yellow-10" size="md" />
        </q-card-section>
      </q-card>
    </q-page>
  </q-layout>
</template>

<style scoped>
.q-avatar {
  background-color: #ddd;
}

.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}
</style>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const goToSleepPage = () => router.push('/sleep-dashboard')
</script>
