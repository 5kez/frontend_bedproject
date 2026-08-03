<template>
  <q-page class="flex flex-center login-container">
    <q-card class="login-card">
      <q-card-section class="text-center">
        <!-- โลโก้ -->
        <div>
          <img src="/bedicon/iconlogin.png" class="logo-image" />
        </div>

        <!-- ข้อความแนะนำ -->
        <div class="text-body2 text-grey-8 q-mt-sm">
          กรุณากรอกชื่อบัญชีผู้ใช้และรหัสผ่าน <br />
          เพื่อเข้าสู่แผงควบคุมผู้ดูแลระบบ
        </div>
      </q-card-section>

      <q-card-section>
        <!-- ฟอร์มล็อกอิน -->
        <q-form class="q-gutter-md" @submit.prevent="btnLogin">
          <q-input
            v-model="email"
            label="ชื่อบัญชีผู้ใช้"
            outlined
            dense
            lazy-rules
            :rules="[(val) => !!val || 'กรุณากรอกชื่อบัญชีผู้ใช้']"
            prepend-icon="person"
          />
          <q-input
            v-model="password"
            label="รหัสผ่าน"
            :type="hidePass ? 'password' : 'text'"
            outlined
            dense
            lazy-rules
            :rules="[(val) => !!val || 'กรุณากรอกรหัสผ่าน']"
            prepend-icon="lock"
          >
            <template v-slot:append>
              <q-icon
                :name="hidePass ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="hidePass = !hidePass"
              />
            </template>
          </q-input>
          <q-card-section class="q-pa-none">
            <q-btn
              label="เข้าสู่ระบบ"
              unelevated
              type="summit"
              class="full-width login-btn"
              style="background-color: #222d32; color: white"
            />
          </q-card-section>
        </q-form>
      </q-card-section>
      <LoginFailedDialog v-if="showDialog" :error-type="errorType" @close="showDialog = false" />
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { logger } from 'src/config/env'
import { useAuthStore } from 'src/stores/authStore/authStore'
import LoginFailedDialog from 'src/components/dialog/LoginFailedDialog.vue'
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
const errorType = ref<'401' | '403' | 'other'>('other')

const router = useRouter()
const email = ref('')
const password = ref('')
const authStore = useAuthStore()
const hidePass = ref(true)
const showDialog = ref(false)
async function btnLogin() {
  if (email.value && password.value) {
    try {
      const isLogin = await authStore.login(email.value, password.value)
      if (isLogin) {
        // ให้เวลา auth state ตั้งค่าให้เสร็จ และ DOM อัพเดทก่อน
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (authStore.currentUser?.role_id == 1) {
          await router.push('/patients-page')
        }
        if (authStore.currentUser?.role_id == 2) {
          await router.push('/dashboard-admin')
        }
        if (authStore.currentUser?.role_id == 3) {
          await router.push('/dashboard-admin')
        }
        if (authStore.currentUser?.role_id == 4) {
          await router.push('/patient-management-recptionist')
        }
        if (authStore.currentUser?.role_id == 5) {
          await router.push('/sensorsmanagementadmin-page')
        }
      } else {
        // Check error from authStore or response
        if (authStore.errorType === '403') {
          errorType.value = '403'
        } else if (authStore.errorType === '401') {
          errorType.value = '401'
        } else {
          errorType.value = 'other'
        }
        showDialog.value = true
      }
    } catch (e: unknown) {
      // Type narrowing for error object
      if (typeof e === 'object' && e !== null && 'response' in e) {
        const err = e as { response?: { status?: number } }
        if (err.response?.status === 403) {
          errorType.value = '403'
        } else if (err.response?.status === 401) {
          errorType.value = '401'
        } else {
          errorType.value = 'other'
        }
      } else {
        errorType.value = 'other'
      }
      showDialog.value = true
      logger.error('Error to login:', e)
    }
  }
}
</script>

<style scoped>
.rounded-card {
  border-radius: 16px;
}

/* พื้นหลังเป็นรูปห้องผู้ป่วย */
.login-container {
  position: relative;
  background-image: url('/bedicon/bed.jpg');
  background-size: cover;
  background-position: center;
  height: 100vh;
}
/* Layer สีดำโปร่งแสงคลุมพื้นหลัง */
.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

/* กล่องล็อกอิน */
.login-card {
  position: relative;
  z-index: 1;
  width: 500px;
  /* ขนาด Card คงที่ */
  padding: 30px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

/* ปุ่มเข้าสู่ระบบ */
.login-btn {
  height: 45px;
  font-size: 16px;
}

.logo-image {
  width: 200px;
  height: auto;
  object-fit: contain;
}
</style>
