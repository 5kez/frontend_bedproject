<template>
  <div class="demo-bar" :class="{ collapsed }">
    <q-btn
      dense
      unelevated
      no-caps
      class="demo-chip"
      icon="science"
      :label="collapsed ? '' : 'DEMO · ข้อมูลสมมติ'"
      :aria-label="'Demo mode menu'"
    >
      <q-menu anchor="top left" self="bottom left" :offset="[0, 8]">
        <q-list dense style="min-width: 260px">
          <q-item-label header class="text-weight-bold">โหมดสาธิต (Demo)</q-item-label>
          <q-item>
            <q-item-section class="text-caption text-grey-8">
              ทุกปุ่มทำงานจริงกับข้อมูลสมมติในเบราว์เซอร์นี้ ค่าชีพจร/SpO2/ท่านอนเป็นสัญญาณจำลอง
              ไม่มีข้อมูลผู้ป่วยจริง
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item-label header>สลับบทบาท</q-item-label>
          <q-item
            v-for="r in DEMO_ROLES"
            :key="r.user"
            clickable
            v-close-popup
            @click="switchTo(r.user)"
          >
            <q-item-section avatar><q-icon :name="r.icon" /></q-item-section>
            <q-item-section>
              <q-item-label>{{ r.label }}</q-item-label>
              <q-item-label caption>{{ r.user }} / demo1234</q-item-label>
            </q-item-section>
          </q-item>
          <q-separator />
          <q-item clickable v-close-popup @click="confirmReset = true">
            <q-item-section avatar><q-icon name="restart_alt" color="negative" /></q-item-section>
            <q-item-section>รีเซ็ตข้อมูลเดโม</q-item-section>
          </q-item>
          <q-item
            clickable
            tag="a"
            href="https://github.com/5kez/frontend_bedproject"
            target="_blank"
          >
            <q-item-section avatar><q-icon name="code" /></q-item-section>
            <q-item-section>Source code (GitHub)</q-item-section>
          </q-item>
          <q-item clickable v-close-popup @click="collapsed = !collapsed">
            <q-item-section avatar
              ><q-icon :name="collapsed ? 'unfold_more' : 'unfold_less'"
            /></q-item-section>
            <q-item-section>{{ collapsed ? 'แสดงป้าย' : 'ย่อป้าย' }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <q-dialog v-model="confirmReset">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">รีเซ็ตข้อมูลเดโม?</q-card-section>
        <q-card-section class="q-pt-none">
          สิ่งที่คุณเพิ่ม แก้ไข หรือลบในเดโมนี้จะหายไป และกลับไปใช้ข้อมูลตั้งต้น
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="ยกเลิก" v-close-popup />
          <q-btn unelevated color="negative" label="รีเซ็ต" @click="reset" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/authStore/authStore'
import { resetDemo } from 'src/demo'
import { DEMO_ROLES, HOME_BY_ROLE } from 'src/demo/roles'

const router = useRouter()
const authStore = useAuthStore()
const confirmReset = ref(false)
const collapsed = ref(false)

async function switchTo(user: string) {
  authStore.logout()
  const ok = await authStore.login(user, 'demo1234')
  if (!ok) return
  // full reload so every page/store starts clean for the new role
  const target = HOME_BY_ROLE[authStore.currentUser?.role_id ?? 0] ?? '/'
  await router.push(target)
  window.location.reload()
}

function reset() {
  resetDemo()
  authStore.logout()
  window.location.hash = '#/'
  window.location.reload()
}
</script>

<style scoped>
.demo-bar {
  position: fixed;
  left: 12px;
  bottom: 12px;
  z-index: 6000;
}
.demo-chip {
  background: #ffb300;
  color: #222d32;
  border-radius: 999px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  padding: 2px 12px;
}
.collapsed .demo-chip {
  padding: 2px 6px;
}
</style>
