<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
      <div class="row items-center col-8">
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
        <q-toolbar-title style="vertical-align: middle" class="form-title">
          {{ isEditMode ? 'แก้ไขข้อมูล' : 'เพิ่มผู้ใช้' }}
        </q-toolbar-title>
      </div>
    </div>

    <q-separator class="q-mb-md" />

    <q-form @submit.prevent="submitForm">
      <div class="row q-col-gutter-md">
        <!-- ส่วนข้อมูลผู้ป่วย -->
        <div class="col-7">
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ชื่อ</label>
            </div>
            <div class="col-6">
              <q-input
                filled
                v-if="UserFormData"
                v-model="UserFormData.name"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ชื่อ']"
                dense
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">นามสกุล</label>
            </div>
            <div class="col-6">
              <q-input
                filled
                v-if="UserFormData"
                v-model="UserFormData.last_name"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่นามสกุล']"
                dense
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ชื่อผู้ใช้</label>
            </div>
            <div class="col-6">
              <q-input
                filled
                v-if="UserFormData"
                v-model="UserFormData.user_name"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ Username']"
                dense
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">{{
                isEditMode ? 'รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)' : 'รหัสผ่าน'
              }}</label>
            </div>
            <div class="col-6">
              <q-input
                filled
                v-if="UserFormData"
                v-model="UserFormData.user_password"
                type="password"
                :placeholder="isEditMode ? 'ใส่รหัสผ่านใหม่ถ้าต้องการเปลี่ยน' : 'กรุณาใส่รหัสผ่าน'"
                lazy-rules
                :rules="isEditMode ? [] : [(val) => !!val || 'กรุณาใส่รหัสผ่าน']"
                dense
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">อีเมล</label>
            </div>
            <div class="col-6">
              <q-input
                filled
                v-if="ProfileFormData"
                v-model="ProfileFormData.email"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ Email']"
                dense
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div
              class="col-2 text-left q-pr-md"
              style="display: flex; justify-content: left; align-items: center"
            >
              <label style="font-size: large">ไอดีไลน์</label>
            </div>
            <div class="col-6">
              <q-input
                filled
                v-if="ProfileFormData"
                v-model="ProfileFormData.line_id"
                lazy-rules
                :rules="[(val) => !!val || 'กรุณาใส่ Id Line']"
                dense
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">ตำแหน่ง</label>
            </div>
            <div class="col-6">
              <q-select
                filled
                v-model="rolesModel"
                label="ตำแหน่ง"
                :options="rolesOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                dense
                class="q-mb-md"
                :error="!!rolesError"
                :error-message="rolesError"
              />
            </div>
          </div>

          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">สถานที่</label>
            </div>
            <div class="col-6">
              <q-select
                filled
                v-model="siteModel"
                label="สถานที่"
                :options="sitesOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                dense
                class="q-mb-md"
                :error="!!siteError"
                :error-message="siteError"
                :readonly="isSiteReadonly"
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">อาคาร</label>
            </div>
            <div class="col-6">
              <q-select
                filled
                v-model="buildingModel"
                label="อาคาร"
                :options="buildingOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                dense
                class="q-mb-md"
                :error="!!buildingError"
                :error-message="buildingError"
                :disable="isBuildingDisabled"
              />
            </div>
          </div>
          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">แผนก</label>
            </div>
            <div class="col-6">
              <q-select
                filled
                v-model="departmentModel"
                label="แผนก"
                :options="departmentOptions"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                dense
                class="q-mb-md"
                :error="!!departmentError"
                :error-message="departmentError"
                :disable="isDepartmentDisabled"
              />
            </div>
          </div>

          <!-- <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">เลขห้อง</label>
            </div>
            <div class="col-6">
              <q-select
                filled
                v-model="roomModel"
                label="เลือกเลขห้อง"
                :options="roomOptions"
                option-value="id"
                option-label="name"
                emit-value
                map-options
                dense
                :error="!!roomError"
                :error-message="roomError"
              />
            </div>
          </div> -->
          <!--
          <div class="row q-mb-md">
            <div class="col-2 text-left q-pr-md" style="display: flex; align-items: center">
              <label style="font-size: large">เลขเตียง</label>
            </div> -->
          <!-- <div class="col-6">
              <q-select
                filled
                v-model="bedModel"
                label="เลือกเลขเตียง"
                :options="bedOptions"
                option-value="id"
                option-label="name"
                emit-value
                map-options
                dense
                :error="!!bedError"
                :error-message="bedError"
              />
            </div> -->
        </div>

        <div class="col-4 flex flex-left">
          <q-card bordered class="upload-container">
            <q-file
              ref="fileInput"
              v-model="file"
              accept="image/*"
              class="upload-box"
              dense
              outlined
              max-file-size="204800"
              @update:model-value="handleFileChange"
            />
            <q-icon
              v-if="!previewUrl && !userImageUrl"
              name="add"
              class="upload-icon"
              @click.stop="triggerUpload"
            />
            <div class="image-container" v-if="previewUrl || userImageUrl">
              <q-img
                :src="(previewUrl ?? userImageUrl) || undefined"
                class="preview-img"
                @click.stop="triggerUpload"
              />
              <div class="hover-overlay" @click="triggerUpload">
                <q-icon name="edit" class="edit-icon" />
              </div>
            </div>
          </q-card>
        </div>
      </div>
      <!-- ปุ่มกด -->
      <div class="row justify-end q-mt-md">
        <q-btn
          label="บันทึก"
          type="submit"
          class="q-mr-sm q-px-lg"
          style="background-color: #222d32; color: white"
        />
        <q-btn
          label="ยกเลิก"
          @click="cancelForm"
          color="white"
          class="black-border q-px-lg"
          text-color="black"
        />
      </div>
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { QFile } from 'quasar'
import { useImagePatientStore } from 'src/stores/patientStore/ImagePatientStore'
import { useRouter, useRoute } from 'vue-router'
import { computed, onMounted, ref, onUnmounted, watch } from 'vue'
import { type Profile, type User } from 'src/models'
import { useDialogStore } from 'stores/dialogStore/dialogStore'
import { useUserStore } from 'stores/userStore/userStore'
import { useRoleStore } from 'stores/roleStore/roleStore'
import { useSiteStore } from 'src/stores/locationStore/siteStore'
import { useBuildingStore } from 'src/stores/locationStore/buildingStore' // Add this import if you have a building store
import { useProfileStore } from 'stores/profileStore/profileStore'
import { useImageprofileStore } from 'src/stores/profileStore/ImageProfileStore'
import { getProfileImageUrl } from 'src/utils/imageUtils'
import { useDepartmentBuildingStore } from 'src/stores/departmentBuildingStore/departmentBuildingStore'
import { useDepartmentStore } from 'src/stores/departmentStore/departmentStore'
import { useAuthStore } from 'src/stores/authStore/authStore'

const authStore = useAuthStore()
const departmentBuildingStore = useDepartmentBuildingStore()
const departmentStore = useDepartmentStore()
const profileStore = useProfileStore()
const imageProfileStore = useImageprofileStore()
const buildingStore = useBuildingStore() // Add this if you have a building store
const buildingOptions = ref<Array<{ label: string; value: number }>>([]) // For dynamic departments
const roleStore = useRoleStore()
const siteStore = useSiteStore()
const rolesOptions = ref<Array<{ label: string; value: number }>>([])
const sitesOptions = ref<Array<{ label: string; value: number }>>([])
const userStore = useUserStore()
const imagePatientStore = useImagePatientStore()
const dialogStore = useDialogStore()
const router = useRouter()
const route = useRoute()
const isEditMode = computed(() => !!route.params.id)
const sexError = ref('')
const rolesError = ref('')
const roomError = ref('')
const bedError = ref('')
const departmentError = ref('')
const siteError = ref('')
const buildingError = ref('')
const fileInput = ref<InstanceType<typeof QFile> | null>(null)
const previewUrl = ref<string | null>(null)
const file = ref<File | null>(null)
const UserId = ref<number | null>(null)
const siteModel = ref<number | null>(null)
const isDepartmentDisabled = computed(() => !buildingModel.value)
const buildingModel = ref<number | null>(null)
const isFirstSiteWatch = ref(true)

const triggerUpload = () => {
  if (!fileInput.value || !fileInput.value.$el) return
  fileInput.value.$el.click()
}
/* Removed duplicate departmentOptions declaration to fix redeclaration error */
const uploadedImage = ref('')
const ProfileFormData = ref<Profile | null>(null)

//ref model
const UserFormData = ref<User | null>(null)
const departmentModel = computed({
  get: () => UserFormData.value?.department_id ?? null,
  set: (value: number | null) => {
    if (UserFormData.value) {
      UserFormData.value.department_id = value
    }
  },
})
//load data Edit Mode or Create Mode
onMounted(async () => {
  await siteStore.getsites()
  await roleStore.getRoles()
  rolesOptions.value = roleStore.roles
    .filter((role) => role.id !== 3 || authStore.currentUser?.role_id === 3)
    .map((role) => ({
      label: role.roles_name,
      value: role.id,
    }))
  sitesOptions.value = siteStore.sites.map((site) => ({
    label: site.sites_name,
    value: site.id,
  }))
  await Promise.all([
    buildingStore.fetchBuildings(),
    departmentStore.fetchDepartments(),
    departmentBuildingStore.fetchAllDepartmentBuildings(),
  ])
  if (isEditMode.value) {
    UserId.value = Number(route.params.id)
    await userStore.fetchUserById(UserId.value)
    if (userStore.userData) {
      UserFormData.value = { ...userStore.userData }
      UserFormData.value.user_password = ''
      await profileStore.getProfileById(UserFormData.value.profile_id)
      ProfileFormData.value = profileStore.profileData
      uploadedImage.value = ''
      siteModel.value = UserFormData.value.site_id ?? null
      if (siteModel.value) {
        await buildingStore.fetchBuildingsBySiteId(siteModel.value)
        buildingOptions.value = buildingStore.buildings.map((bui) => ({
          label: bui.build_name,
          value: bui.id,
        }))
      }
      buildingModel.value = UserFormData.value.build_id ?? null
      departmentModel.value = UserFormData.value.department_id ?? null
      if (ProfileFormData.value && ProfileFormData.value.photo) {
        uploadedImage.value = getProfileImageUrl(ProfileFormData.value.photo) || ''
      } else {
        uploadedImage.value = ''
      }
    }
  } else {
    UserFormData.value = userStore.getEmptyUser()
    ProfileFormData.value = await profileStore.getEmptyprofile()
    siteModel.value = authStore.currentUser?.site_id || 1
    await buildingStore.fetchBuildingsBySiteId(siteModel.value)
    buildingOptions.value = buildingStore.buildings.map((bui) => ({
      label: bui.build_name,
      value: bui.id,
    }))
    buildingModel.value = null
    watch(
      siteModel,
      async (siteId) => {
        if (isFirstSiteWatch.value && isEditMode.value) {
          isFirstSiteWatch.value = false
          if (siteId) {
            await buildingStore.fetchBuildingsBySiteId(siteId)
            buildingOptions.value = buildingStore.buildings.map((bui) => ({
              label: bui.build_name,
              value: bui.id,
            }))
          }
          return
        }
        if (UserFormData.value) {
          UserFormData.value.site_id = siteId
        }
        if (siteId) {
          await buildingStore.fetchBuildingsBySiteId(siteId)
          buildingOptions.value = buildingStore.buildings.map((bui) => ({
            label: bui.build_name,
            value: bui.id,
          }))
          buildingModel.value = null
          departmentModel.value = null
        } else {
          buildingOptions.value = []
          buildingModel.value = null
          departmentModel.value = null
        }
      },
      { immediate: true },
    )
  }
})

const isSiteReadonly = computed(() => authStore.currentUser?.role_id !== 3)

onUnmounted(async () => {
  await imagePatientStore.deleteTempImage()
})

const rolesModel = computed({
  get: () => UserFormData.value?.role_id ?? null,
  set: (value: number) => {
    if (UserFormData.value) {
      UserFormData.value.role_id = value
    }
  },
})
const departmentOptions = computed(() => {
  const links = departmentBuildingStore.departmentBuildings ?? []
  // Debug: log the links and buildingModel
  logger.log('links:', links, 'buildingModel:', buildingModel.value)
  if (!buildingModel.value) return []
  const relatedDeptIds = new Set(
    links
      .filter((link) => link.building_id === buildingModel.value)
      .map((link) => link.department_id),
  )
  // Debug: log the related department IDs
  logger.log('relatedDeptIds:', Array.from(relatedDeptIds))
  // Debug: log all departments
  logger.log('departments:', departmentStore.departments)
  return departmentStore.departments
    .filter((d) => relatedDeptIds.has(d.id))
    .map((d) => ({ label: d.department_name, value: d.id }))
})
// const siteModel = computed({
//   get: () => UserFormData.value?.site_id ?? null,
//   set: (value: number) => {
//     if (UserFormData.value) {
//       UserFormData.value.site_id = value
//     }
//   },
// })

// watch(siteModel, (val) => {
//   if (UserFormData.value) {
//     UserFormData.value.site_id = val
//   }
// })

// // ถ้าเปลี่ยน site แล้วค่าแผนกเดิมไม่ถูกต้อง ให้เคลียร์
// watch(siteModel, () => {
//   const allowed = new Set(departmentOptions.value.map(o => o.value))
//   if (departmentModel.value && !allowed.has(departmentModel.value)) {
//     departmentModel.value = null
//   }
// })

const isBuildingDisabled = computed(() => !siteModel.value)

watch(buildingModel, (val) => {
  if (UserFormData.value) {
    UserFormData.value.build_id = val
  }
})
watch(
  () => UserFormData.value?.build_id,
  (val) => {
    if (val !== buildingModel.value) {
      buildingModel.value = val ?? null
    }
  },
)

// Watch buildingModel: clear department if not valid for selected building
watch(buildingModel, () => {
  const allowed = new Set(departmentOptions.value.map((o) => o.value))
  if (departmentModel.value && !allowed.has(departmentModel.value)) {
    departmentModel.value = null
  }
})

const submitForm = async () => {
  if (!UserFormData.value) return

  // Reset error messages
  sexError.value = ''
  rolesError.value = ''
  roomError.value = ''
  bedError.value = ''
  departmentError.value = ''

  let hasError = false

  if (!rolesModel.value) {
    rolesError.value = 'กรุณาเลือกตำแหน่ง'
    hasError = true
  }
  if (!departmentModel.value) {
    departmentError.value = 'กรุณาเลือกแผนก'
    hasError = true
  }

  if (hasError) return

  try {
    await roleStore.getRoles()
    if (UserFormData.value && UserFormData.value.role_id) {
      const matchedRole = roleStore.roles.find((r) => r.id === UserFormData.value!.role_id)
      UserFormData.value.roles_code = matchedRole ? matchedRole.roles_code : ''
    }
    // let UserId: number | null = null
    let ProfileId: number | null = null
    if (ProfileFormData.value) {
      UserFormData.value.profile_id = ProfileFormData.value.id
    } else {
      UserFormData.value.profile_id = 1
    }
    if (isEditMode.value) {
      // 🔒 ถ้าเป็นโหมดแก้ไขและรหัสผ่านว่าง ไม่ต้องส่งข้อมูลรหัสผ่าน
      let updateData
      if (!UserFormData.value.user_password || UserFormData.value.user_password.trim() === '') {
        // ใช้ destructuring เพื่อแยก user_password ออก
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user_password: _, ...dataWithoutPassword } = UserFormData.value
        updateData = dataWithoutPassword
      } else {
        updateData = { ...UserFormData.value }
      }
      await userStore.updateUser(UserFormData.value.id, updateData)
      if (ProfileFormData.value) {
        ProfileFormData.value.name = UserFormData.value.name
        ProfileFormData.value.surname = UserFormData.value.last_name
        ProfileFormData.value.site_id = UserFormData.value.site_id
        await profileStore.updateprofile(ProfileFormData.value.id, ProfileFormData.value)
        ProfileId = ProfileFormData.value.id
        await profileStore.getCurrentProfileById(ProfileId)
      }
      // UserId = UserFormData.value.id
    } else {
      const newUser = await userStore.createUser(UserFormData.value)
      let newProfile = null
      if (ProfileFormData.value) {
        ProfileFormData.value.name = UserFormData.value.name
        ProfileFormData.value.surname = UserFormData.value.last_name
        ProfileFormData.value.site_id = UserFormData.value.site_id
        newProfile = await profileStore.createprofile(ProfileFormData.value)
      }
      if (newUser && newUser.id) {
        if (newProfile && newProfile.id) {
          ProfileId = newProfile.id
        }
      } else {
        logger.error('❌ Error: createUser() ไม่คืนค่า')
      }
    }

    if (ProfileId && file.value) {
      const finalImageUrl = await imageProfileStore.uploadImage(file.value, ProfileId)
      if (finalImageUrl && ProfileFormData.value) {
        ProfileFormData.value.photo = finalImageUrl
        // Update profile in backend with new photo
        await profileStore.updateprofile(ProfileFormData.value.id, {
          ...ProfileFormData.value,
          photo: finalImageUrl,
        })
      }
    }

    router.go(-1)
    await dialogStore.openDialog('บันทึกข้อมูลผู้ใช้สำเร็จ', 'confirm')
  } catch (error) {
    logger.error('❌ Error submitting form:', error)
  }
}

const handleFileChange = (newFile: File | null) => {
  if (newFile) {
    previewUrl.value = URL.createObjectURL(newFile)
    file.value = newFile
  } else {
    previewUrl.value = null
    file.value = null
  }
}

const cancelForm = async () => {
  await imagePatientStore.deleteTempImage()
  router.go(-1)
}

const userImageUrl = computed(() => {
  const photoPath = ProfileFormData.value?.photo
  return getProfileImageUrl(photoPath)
})
</script>
<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

.upload-container {
  width: 300px;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f0f0f0;
}

.upload-box {
  width: 100%;
  height: 100%;
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

/* 🔹 ไอคอน `+` ตอนยังไม่มีรูป */
.upload-icon {
  font-size: 80px;
  color: gray;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.6;
  z-index: 2;
  cursor: pointer;
}

/* 🔹 กรอบรูป */
.image-container {
  width: 100%;
  height: 100%;
  position: relative;
}

/* 🔹 รูปภาพที่อัปโหลด */
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

/* 🔹 ฟิลเตอร์สีเทาและไอคอนดินสอ */
.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  /* ✅ สีเทา */
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  border-radius: 8px;
}

.image-container:hover .hover-overlay {
  opacity: 1;
  /* ✅ แสดงเมื่อ Hover */
}

/* 🔹 ไอคอนดินสอ */
.edit-icon {
  font-size: 48px;
  color: white;
  cursor: pointer;
}

.black-border {
  border: 1px solid black;
}
</style>
