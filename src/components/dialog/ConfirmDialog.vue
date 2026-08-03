<template>
  <Teleport to="body">
    <div v-if="dialogStore.showDialog" class="dialog-overlay">
      <div class="dialog-box">
        <p class="dialog-message">{{ dialogStore.dialogMessage }}</p>
        <div class="dialog-actions">
          <button class="confirm-btn" @click="dialogStore.confirm">ยืนยัน</button>
          <button
            v-if="dialogStore.dialogMode === 'confirm-cancel'"
            class="cancel-btn"
            @click="dialogStore.cancel"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useDialogStore } from 'stores/dialogStore/dialogStore'

const dialogStore = useDialogStore()
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-box {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 300px;
}

.dialog-message {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
  white-space: pre-line;
}

.dialog-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
}

button {
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: 0.2s;
}

.confirm-btn {
  background-color: #28a745;
  color: white;
}

.cancel-btn {
  background-color: #dc3545;
  color: white;
}

button:hover {
  opacity: 0.8;
}
</style>
