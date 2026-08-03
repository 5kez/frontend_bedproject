<template>
  <div>
    <!-- แท็บขอบขวา -->
    <div class="chat-tab" @click="toggleChat">
      <q-icon :name="open ? 'chevron_right' : 'chat'" size="18px" color="white" />
    </div>

    <!-- กล่องแชท -->
    <transition name="slide-chat">
      <div v-if="open" class="chatbox">
        <q-card
          style="
            width: 350px;
            height: 500px;
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          "
        >
          <q-card-section class="row items-center q-pb-none" style="background-color: #00aed6">
            <div class="text-h6 q-mb-md" style="color: white">HealthMate</div>
            <q-space />
          </q-card-section>
          <q-separator />
          <q-card-section style="height: 380px; overflow-y: auto">
            <div v-for="(msg, i) in messages" :key="i">
              <b>{{ msg.role }}</b>
              <template v-if="msg.text">: {{ msg.text }}</template>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-actions align="right" class="q-pa-sm" style="background-color: #f5f5f5">
            <q-input
              dense
              outlined
              v-model="input"
              placeholder="พิมพ์ข้อความ..."
              @keyup.enter="send"
              style="flex: 1"
            />
            <q-btn class="q-ml-xs" icon="arrow_forward_ios" color="primary" round @click="send" />
          </q-card-actions>
        </q-card>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { usellmStore } from 'src/stores/llmStore/llmStore'
import { useAuthStore } from 'src/stores/authStore/authStore'
import { ref } from 'vue'

const authStore = useAuthStore()
const llmStore = usellmStore()
const open = ref(false)
const user = authStore.currentUser
const input = ref('')
const userMessage = ref('')

const messages = ref([{ role: '', text: '' }])

function toggleChat() {
  open.value = !open.value
}

async function send() {
  if (!input.value) return
  userMessage.value = input.value
  input.value = ''
  messages.value.push({ role: user?.name ?? 'user', text: userMessage.value })
  await llmStore.sendChatToLLM(userMessage.value).then(() => {
    if (llmStore.Message) {
      messages.value.push({ role: 'HealthMate', text: llmStore.Message })
    }
  })
}
</script>

<style scoped>
.chat-tab {
  position: fixed;
  top: 92%;
  right: 0;
  transform: translateY(-50%);
  background-color: #222d32;
  padding: 10px;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  z-index: 5000;
}

.chatbox {
  position: fixed;
  bottom: 0px; /* อยู่เหนือ tab นิดหน่อย */
  right: 3px; /* ระยะห่างพอดีกับ tab */
  transform: translateY(-20%);
  z-index: 4999;
}

/* Animation slide */
.slide-chat-enter-active,
.slide-chat-leave-active {
  transition: all 0.3s ease;
}
.slide-chat-enter-from,
.slide-chat-leave-to {
  transform: translateX(120%);
  opacity: 0;
}
</style>
