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
      <q-toolbar-title class="form-title">จัดการอาคาร</q-toolbar-title>
      <div class="row items-center">
        <q-input
          outlined
          dense
          v-model="search"
          placeholder="ค้นหา"
          class="q-mr-sm"
          style="width: 220px"
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
          @click="$router.push('/building-form')"
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

    <!-- Main: Building List + Table -->
    <div class="row q-col-gutter-md q-mb-md" style="height: calc(100vh - 170px)">
      <!-- Left: Building List -->
      <div class="col-12 col-md-3" style="height: 100%">
        <div
          class="table-section-header"
          style="
            border-radius: 8px 8px 0 0;
            border: 1px solid #bbb;
            font-size: 1.3rem;
            text-align: center;
          "
        >
          Building
        </div>
        <div
          style="
            background: #fff;
            border-radius: 0 0 8px 8px;
            border: 1px solid #bbb;
            border-top: none;
            height: calc(100% - 48px);
            padding: 18px 0;
            overflow-y: auto;
          "
        >
          <div
            v-for="building in filteredBuildings"
            :key="building.id"
            class="row items-center q-mx-md q-mb-md q-pa-sm transition"
            :class="['building-btn', { selected: currentBuildingId === building.id }]"
            @click="selectBuilding(building.id)"
            style="user-select: none"
          >
            <span class="q-pl-md" style="flex: 1; font-size: 1.1rem">{{
              building.build_name
            }}</span>
            <q-btn flat round dense icon="more_vert" @click.stop>
              <q-menu>
                <q-list>
                  <q-item
                    clickable
                    v-close-popup
                    @click="router.push(`/building-form/${building.id}`)"
                  >
                    <q-item-section>แก้ไขตึก</q-item-section>
                  </q-item>

                  <q-item clickable v-close-popup @click="handleDeleteBuilding(building.id)">
                    <q-item-section class="text-red">ลบตึก</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Right: Building Details -->
      <div class="col-12 col-md-9" style="height: 100%">
        <div class="building-details-card">
          <div v-if="selectedBuilding" class="q-gutter-lg">
            <div class="text-h5 text-weight-medium text-primary q-mb-md">
              <q-icon name="apartment" class="q-mr-sm" />
              ข้อมูลอาคาร
            </div>

            <!-- Building Name Card -->
            <q-card flat bordered class="detail-card">
              <q-card-section>
                <div class="text-caption text-grey-7 q-mb-xs">
                  <q-icon name="business" size="xs" class="q-mr-xs" />
                  ชื่ออาคาร
                </div>
                <div class="text-h6 text-weight-medium">{{ selectedBuilding.build_name }}</div>
              </q-card-section>
            </q-card>

            <!-- Floor Count and Remark Cards -->
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-card flat bordered class="detail-card floor-card">
                  <q-card-section>
                    <div class="text-caption text-grey-7 q-mb-sm">
                      <q-icon name="layers" size="xs" class="q-mr-xs" />
                      จำนวนชั้น
                    </div>
                    <div class="text-h4 text-primary text-weight-bold q-mb-xs">
                      {{ selectedBuilding.floor_count || 1 }} ชั้น
                    </div>
                    <div class="text-caption text-grey-6">
                      <q-icon name="arrow_upward" size="xs" class="q-mr-xs" />
                      ชั้น 1 ถึงชั้น {{ selectedBuilding.floor_count || 1 }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-6">
                <q-card flat bordered class="detail-card">
                  <q-card-section>
                    <div class="text-caption text-grey-7 q-mb-xs">
                      <q-icon name="comment" size="xs" class="q-mr-xs" />
                      หมายเหตุ
                    </div>
                    <div class="text-body1">
                      {{ selectedBuilding.remark || '-' }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <q-icon name="apartment" size="80px" color="grey-4" />
            <div class="text-h6 text-grey-5 q-mt-md">กรุณาเลือกอาคารเพื่อดูรายละเอียด</div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBuildingStore } from 'src/stores/locationStore/buildingStore'
import { storeToRefs } from 'pinia'
import { useDialogStore } from 'stores/dialogStore/dialogStore'

const route = useRoute()
const router = useRouter()
const dialogStore = useDialogStore()
const buildingStore = useBuildingStore()
const { buildings } = storeToRefs(buildingStore)
const siteId = ref<number | null>(null)
const currentBuildingId = ref<number | null>(null)
const search = ref('')

onMounted(async () => {
  siteId.value = Number(route.query.site_id)

  await buildingStore.fetchBuildings()

  // เลือก building แรกของ site เป็น default
  const buildingsForSite = buildings.value.filter((b) => b.site_id === siteId.value)
  if (buildingsForSite.length > 0) {
    currentBuildingId.value = buildingsForSite[0]?.id ?? null
  }
})

// Buildings ที่กรองด้วย siteId และ search
const filteredBuildings = computed(() => {
  const buildingsList = buildings.value.filter((b) => b.site_id === siteId.value)
  if (!search.value) return buildingsList
  const term = search.value.toLowerCase()
  return buildingsList.filter((b) => b.build_name.toLowerCase().includes(term))
})

// Building ที่ถูกเลือก
const selectedBuilding = computed(() => {
  return buildings.value.find((b) => b.id === currentBuildingId.value)
})

function selectBuilding(id: number) {
  currentBuildingId.value = id
}

const handleDeleteBuilding = async (id: number) => {
  const confirmed = await dialogStore.openDialog('คุณต้องการลบตึกนี้หรือไม่?', 'confirm-cancel')
  if (confirmed) {
    const ok = await buildingStore.deleteBuilding(id)
    if (!ok) {
      // the delete used to fail silently when departments/beds still use the building
      await dialogStore.openDialog(
        'ลบตึกไม่ได้ เนื่องจากยังมีแผนกหรือเตียงอยู่ในตึกนี้ กรุณาย้ายหรือลบออกก่อน',
        'confirm',
      )
    }
  }
}
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

.bg-page {
  background: white;
}
.table-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.building-btn {
  border-radius: 22px;
  background: #263238;
  color: #fff;
  font-weight: 400;
  transition: background 0.18s;
  min-height: 40px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}
.building-btn.selected {
  background: #999999 !important;
  color: #fff;
  box-shadow: 2px 4px 12px rgba(0, 0, 0, 0.13);
}
.table-section-header {
  background: #222d32 !important;
  color: #fff !important;
  min-height: 60px;
  font-size: 1.12rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  padding: 0 16px;
  letter-spacing: 1px;
}
.table-header {
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 1px;
}
.table-body .table-row:hover {
  background: #ececec;
}

/* Building Details Styling */
.building-details-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 24px;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.detail-card {
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
}

.detail-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.floor-card {
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  border: 1px solid #d0e4ff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}
</style>
