import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref } from 'vue'

export const useDialogStore = defineStore('dialog', () => {
  const showDialog = ref(false)
  const dialogMessage = ref('')
  const dialogMode = ref<'confirm' | 'confirm-cancel'>('confirm')
  let resolvePromise: ((value: boolean) => void) | null = null

  function openDialog(message: string, mode: 'confirm' | 'confirm-cancel' = 'confirm') {
    dialogMessage.value = message
    dialogMode.value = mode
    showDialog.value = true
    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  function confirm() {
    if (resolvePromise) {
      resolvePromise(true)
      resolvePromise = null
    }
    showDialog.value = false
  }

  function cancel() {
    if (resolvePromise) {
      resolvePromise(false)
      resolvePromise = null
    }
    showDialog.value = false
  }

  function resetStore() {
    showDialog.value = false
    dialogMessage.value = ''
    dialogMode.value = 'confirm'
    resolvePromise = null
  }

  return {
    showDialog,
    dialogMessage,
    dialogMode,
    openDialog,
    confirm,
    cancel,
    resetStore,
  }
})

// HMR Support
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDialogStore, import.meta.hot))
}
