import { logger } from 'src/config/env'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'src/boot/axios'
import { API_ENDPOINTS, buildApiUrl } from 'src/config/api'

export const useImagePatientStore = defineStore('ImagePatientStore', () => {
  const apiUrl = buildApiUrl(API_ENDPOINTS.PATIENT_UPLOAD) // URL สำหรับอัปโหลดรูป
  const uploadedImageUrl = ref<string | undefined>(undefined) // เก็บ URL รูปที่อัปโหลดล่าสุด

  // **🔹 อัปโหลดรูปภาพ**
  async function uploadImage(file: File, patientId?: number): Promise<string | undefined> {
    try {
      const formData = new FormData()
      formData.append('image', file)

      if (patientId) {
        // 👉 อัปโหลดแล้วอัปเดตเลย (ใช้ตอน Edit)
        formData.append('patientId', patientId.toString())
      }

      const response = await api.post<{ imageUrl: string }>(apiUrl, formData)

      // 👉 ถ้าไม่มี patientId (ตอน Create) = เป็น temp preload
      if (!patientId) {
        uploadedImageUrl.value = response.data.imageUrl
      }

      return response.data.imageUrl
    } catch (err) {
      logger.error('❌ Error uploading image:', err)
      return undefined
    }
  }

  // **🔹 ลบรูปภาพจากเซิร์ฟเวอร์**
  async function deleteImage(imagePath?: string): Promise<boolean> {
    const pathToDelete = imagePath ?? uploadedImageUrl.value // ✅ ถ้าไม่มีพาธ ใช้ค่าล่าสุด
    if (!pathToDelete) return false

    try {
      await api.delete(`${apiUrl}?imagePath=${encodeURIComponent(pathToDelete)}`)
      uploadedImageUrl.value = undefined // ✅ รีเซ็ตค่า
      return true
    } catch (err) {
      logger.error('❌ Error deleting image:', err)
      return false
    }
  }

  // **🔹 ลบรูปที่อัปโหลดล่าสุด ถ้ายังไม่ได้บันทึก**
  async function deleteTempImage() {
    if (uploadedImageUrl.value) {
      await deleteImage(uploadedImageUrl.value) // ✅ ลบรูปที่อัปโหลดล่าสุด
    }
  }

  // **🔹 อัปเดตรูปให้ `patientId` ใช้**
  async function setImageForPatient(patientId: number) {
    if (!uploadedImageUrl.value) return false // ✅ ถ้าไม่มีรูปให้ข้ามไปเลย

    try {
      await api.patch(`${buildApiUrl(API_ENDPOINTS.PATIENTS)}/${patientId}/image`, {
        imageUrl: uploadedImageUrl.value, // ✅ อัปเดต URL ของรูปให้ Patient
      })
      return true
    } catch (err) {
      logger.error(`❌ Error updating image for Patient ID ${patientId}:`, err)
      return false
    }
  }

  return {
    uploadedImageUrl,
    uploadImage,
    deleteImage,
    deleteTempImage,
    setImageForPatient,
  }
})
