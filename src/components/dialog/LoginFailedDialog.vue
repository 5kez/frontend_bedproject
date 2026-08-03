<template>
  <q-dialog v-model="isDialogVisible" persistent>
    <q-card style="width: 550px; height: 320px" class="card_template">
      <div class="image_adjust">
        <img src="bedicon\mark.png" style="width: 100px; height: 100px" />
      </div>
      <q-card-section align="center">
        <div v-if="errorType === '403'" class="text-h6">
          บัญชีผู้ใช้นี้ถูกปิดใช้งาน<br />กรุณาติดต่อผู้ดูแลระบบ
        </div>
        <div v-else-if="errorType === '401'" class="text-h6">
          รหัสผ่านไม่ถูกต้อง<br />กรุณาตรวจสอบและลองใหม่อีกครั้ง
        </div>
        <div v-else class="text-h6">กรุณากรอกบัญชีผู้ใช้ หรือ รหัสผ่าน ให้ถูกต้อง</div>
      </q-card-section>
      <q-card-actions align="center" style="margin-top: 5%">
        <q-btn
          label="OK"
          @click="closeDialog"
          style="background-color: #222d32; color: white; width: 120px"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['close'])
const isDialogVisible = ref(true)

const props = defineProps<{ errorType: string }>()

const errorType = props.errorType

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
