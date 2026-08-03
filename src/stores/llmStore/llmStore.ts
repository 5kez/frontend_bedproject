import { api } from 'src/boot/axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { buildApiUrl } from 'src/config/api'

export const usellmStore = defineStore('llmStore', () => {
  // API
  const apiUrlAnalyseLLM = buildApiUrl('/llm')
  const error = ref<string | null>(null)
  const loading = ref(false)
  const Message = ref<string | null>(null)

  async function sendChatToLLM(userMessage: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await api.post(`${apiUrlAnalyseLLM}/message`, {
        message: userMessage,
      })
      Message.value = (response.data.geminiMessage as string).trim().replace(/^"(.*)"$/, '$1')
      return true
    } catch {
      error.value = 'Failed to send chat message.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    sendChatToLLM,

    // val
    Message,
  }
})
