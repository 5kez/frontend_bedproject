<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
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
      <q-toolbar-title class="form-title">จัดการสถานที่</q-toolbar-title>

      <div class="row items-center">
        <q-input
          outlined
          dense
          v-model="search"
          placeholder="ค้นหา"
          class="q-mr-sm"
          style="width: 330px"
          bg-color="white"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-btn
          class="q-px-md bg-white text-black"
          flat
          style="border: 1px solid #ccc"
          @click="$router.push('/sites-form')"
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
    </div>
    <q-separator />
    <br />

    <div class="row q-col-gutter-md" style="min-height: 75vh">
      <!-- ซ้าย: รายการ site -->
      <div class="col-12 col-md-4" style="max-height: 80vh; overflow-y: auto">
        <div v-for="(site, idx) in filteredSites" :key="site.id" class="q-mb-md my-location-card">
          <!-- Header ของ card -->
          <div class="my-site-header row justify-between items-center">
            <div class="site-title">{{ site.sites_name }}</div>
            <q-btn flat round dense icon="more_vert" @click.stop>
              <q-menu>
                <q-list>
                  <q-item
                    clickable
                    v-close-popup
                    @click="() => router.push(`/sites-form/${site.id}`)"
                  >
                    <q-item-section>แก้ไขสถานที่</q-item-section>
                  </q-item>
                  <!-- ส่ง site.id ไปด้วย เพื่อแก้ไขอาคารเฉพาะ site นั้น -->
                  <q-item
                    clickable
                    v-close-popup
                    @click="() => router.push(`/building-management?site_id=${site.id}`)"
                  >
                    <q-item-section>แก้ไขอาคาร</q-item-section>
                  </q-item>

                  <q-item clickable v-close-popup @click="handleDeleteSite(site.id)">
                    <q-item-section class="text-red">ลบ Site</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>

          <!-- รูป -->
          <img
            :src="getSiteImage(site)"
            alt="site"
            style="width: 100%; height: 300px; object-fit: cover; cursor: pointer"
            @click="showMap(idx)"
          />

          <!-- bottom stats -->
          <div class="q-pa-sm bg-grey-2 row justify-around my-site-stats">
            <div><q-icon name="personal_injury" size="22px" /> {{ site.patientCount }}</div>
            <div><q-icon name="person" size="22px" /> {{ site.userCount }}</div>
            <div><q-icon name="apartment" size="22px" /> {{ site.buildingCount }}</div>
          </div>
        </div>
      </div>

      <!-- ขวา: แผนที่ -->
      <div class="col-12 col-md-8">
        <div
          style="
            background: #fff;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07);
            height: 82vh;
            min-height: 380px;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <iframe
            v-if="selectedSiteIndex !== null"
            :src="googleMapUrl()"
            width="100%"
            height="100%"
            frameborder="0"
            style="border: 0; border-radius: 18px; min-height: 380px"
            allowfullscreen
          ></iframe>
          <div v-else class="q-pa-lg text-grey-5" style="width: 100%; text-align: center">
            กรุณาเลือก Site เพื่อดูแผนที่
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteStore } from 'src/stores/locationStore/siteStore'
import { useBuildingStore } from 'src/stores/locationStore/buildingStore'
import { useUserStore } from 'stores/userStore/userStore'
import { useDialogStore } from 'stores/dialogStore/dialogStore'
import { usePatientStore } from 'stores/patientStore/patientStore'
import { type Site } from 'src/models'
import { getLocationImageUrl } from 'src/utils/imageUtils'

const router = useRouter()
const search = ref('')
const selectedSiteIndex = ref<number | null>(null)
const dialogStore = useDialogStore()
const siteStore = useSiteStore()
const buildingStore = useBuildingStore()
const patientStore = usePatientStore()
const userStore = useUserStore()

// ดึงข้อมูลจาก backend เมื่อ component โหลด
onMounted(async () => {
  await Promise.all([
    siteStore.fetchSites(),
    buildingStore.fetchBuildings(),
    userStore.fetchAllUsers(),
    patientStore.fetchAllPatients(),
  ])
})

// รวมข้อมูล site + จำนวน building/user/sensor (mock sensor เป็น 0)
const sites = computed(() => {
  return siteStore.sites.map((site) => {
    const buildingCount = buildingStore.buildings.filter((b) => b.site_id === site.id).length
    const userCount = userStore.users.filter((u) => u.site_id === site.id).length
    const patientCount = patientStore.patients.filter((p) => p.site_id === site.id).length

    return {
      ...site,
      userCount,
      buildingCount,
      patientCount,
    }
  })
})

function showMap(index: number) {
  selectedSiteIndex.value = index
}

function googleMapUrl(): string {
  const idx = selectedSiteIndex.value
  const site = typeof idx === 'number' ? sites.value[idx] : undefined
  return site
    ? `https://maps.google.com/maps?q=${site.lat},${site.lng}&hl=th&z=16&output=embed`
    : ''
}

const filteredSites = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return sites.value
  return sites.value.filter(
    (s) => s.sites_name.toLowerCase().includes(term) || String(s.id).includes(term),
  )
})

const handleDeleteSite = async (id: number) => {
  const confirmed = await dialogStore.openDialog(
    'คุณแน่ใจหรือไม่ว่าต้องการลบ Site นี้?',
    'confirm-cancel',
  )
  if (confirmed) {
    const ok = await siteStore.deleteSite(id)
    if (!ok) {
      // the delete used to fail silently when the site still has buildings
      await dialogStore.openDialog(
        'ลบ Site ไม่ได้ เนื่องจากยังมีอาคารอยู่ใน Site นี้ กรุณาลบอาคารก่อน',
        'confirm',
      )
    }
  }
}

function getSiteImage(site: Site) {
  return site.name_img
    ? getLocationImageUrl(site.name_img) // <-- แปลง path ถ้า backend ส่งมาเป็น path
    : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&display=swap');

.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

/* .bg-page {
  background: white;
  font-family: 'Sarabun', sans-serif;
} */

.my-location-card {
  position: relative;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07);
  overflow: hidden;
}

.my-site-header {
  background-color: #222d32;
  color: white;
  padding: 8px;
}

.site-title {
  font-size: 20px; /* หรือใช้ rem เช่น 1.25rem */
}

.my-site-stats {
  font-size: 1rem;
}
</style>
