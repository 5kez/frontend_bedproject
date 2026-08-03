<template>
  <q-dialog v-model="isDialogVisible" persistent>
    <q-card style="width: 600px; height: 500px" class="card_template">
      <q-card-section>
        <div class="text-h5 text-center">เลือกโลเคชั่น</div>
      </q-card-section>

      <q-card-section>
        <GoogleMap
          :api-key="apiKey"
          style="width: 100%; height: 350px; border-radius: 18px"
          :center="mapCenter"
          :zoom="16"
          @click="setMarker"
        >
          <Marker v-if="markerPosition" :options="{ position: markerPosition }" />
        </GoogleMap>
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          class="button"
          label="ยืนยัน"
          color="primary"
          v-close-popup
          @click="confirmLocation"
        />
        <q-btn flat class="button card_template" label="ยกเลิก" @click="closeDialog()" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { GoogleMap, Marker } from 'vue3-google-map'
import { type Site } from 'src/models'
import { API_CONFIG } from 'src/config/api'

const props = defineProps<{
  site: Site | undefined
}>()
const emit = defineEmits(['close', 'select'])
const apiKey = API_CONFIG.GOOGLE_MAPS_API_KEY
const isDialogVisible = ref(true)
const markerPosition = ref<{ lat: number; lng: number } | null>(null)

const mapCenter = ref({ lat: 13.736717, lng: 100.523186 }) // default กรุงเทพ

onMounted(() => {
  if (props.site?.lat && props.site?.lng) {
    // edit
    markerPosition.value = { lat: props.site.lat, lng: props.site.lng }
    mapCenter.value = markerPosition.value
  }
})

function setMarker(event: google.maps.MapMouseEvent) {
  if (event.latLng) {
    markerPosition.value = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    }
  }
}

function confirmLocation() {
  if (markerPosition.value) {
    emit('select', markerPosition.value) // ส่ง lat/lng ออกไป
  }
  emit('close', true)
}

function closeDialog() {
  isDialogVisible.value = false
  emit('close', true)
}
</script>

<style scoped>
.image_adjust {
  justify-content: center;
  align-items: center;
  display: flex;
  margin-top: 4%;
}

.card_template {
  border: 1px solid black;
  border-radius: 2;
}

.black-border {
  border: 1px solid black;
}

.btn-save {
  background-color: #222d32;
  color: white;
  font-size: 1.1rem;
}

.btn-cancel {
  background: white;
  border: 1.5px solid #222d32;
  color: #222d32;
  font-size: 1.1rem;
}
</style>
