<template>
  <router-view />
  <ConfirmDialog />
  <NotidetailDialog :show="false" :details="{}" />
</template>

<script setup lang="ts">
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue'
import NotidetailDialog from './components/dialog/NotidetailDialog.vue'
import { useAuthStore } from 'src/stores/authStore/authStore'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import { useRouter } from 'vue-router'
import { watch } from 'vue'
import 'leaflet/dist/leaflet.css'
const authStore = useAuthStore()
const patientStore = usePatientStore()
const router = useRouter()

// โหลด auth state จาก localStorage
authStore.loadLocalStorage()

// Reset patient store เมื่อเปลี่ยน route เพื่อป้องกัน loading ติดค้าง
watch(
  () => router.currentRoute.value.path,
  (newPath, oldPath) => {
    if (newPath !== oldPath) {
      // Reset เฉพาะ loading state เพื่อป้องกันการติดค้าง
      patientStore.forceResetLoading()

      // หากออกจากหน้า patients ให้ reset store เฉพาะเมื่อมีปัญหา
      if (oldPath === '/patients-page' && newPath !== '/patients-page' && patientStore.loading) {
        patientStore.resetStore()
      }
    }
  },
  { immediate: false },
) // ไม่ต้อง immediate เพื่อลดการ reset
</script>
