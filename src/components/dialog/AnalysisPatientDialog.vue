<template>
  <q-dialog v-model="isDialogVisible" persistent>
    <q-card style="width: 550px; height: 350px" class="card_template">
      <div class="image_adjust">
        <q-icon name="emoji_objects" size="50px" color="yellow-8" />
      </div>

      <q-card-section align="center">
        <div class="text-h5">ผลวิเคราะห์ผู้ป่วย {{ patient.name }}</div>

        <div v-if="isLoading" class="q-my-md">
          <q-spinner color="primary" size="40px" />
          <div class="q-mt-sm">กำลังวิเคราะห์...</div>
        </div>

        <div v-else class="text-h6 q-mt-md">
          {{ patientStore.analyseMessage }}
        </div>
      </q-card-section>

      <q-card-actions align="around" style="margin-top: 5%">
        <q-btn
          label="ยืนยัน"
          @click="closeDialog"
          style="background-color: #222d32; color: white; width: 120px"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { type Patient } from 'src/models'
import { usePatientStore } from 'src/stores/patientStore/patientStore'
import { ref } from 'vue'

defineProps<{
  patient: Patient
}>()
const emit = defineEmits(['close'])
const isDialogVisible = ref(true)
const patientStore = usePatientStore()
const isLoading = ref(false)

function closeDialog() {
  isDialogVisible.value = false
  emit('close')
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
</style>
