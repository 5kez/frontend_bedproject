<template>
  <q-page class="q-pa-md bg-page" style="overflow: hidden; font-family: 'Sarabun', sans-serif">
    <div class="row items-center justify-between q-mb-md no-wrap">
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
        จัดการข้อมูลผู้ใช้
      </q-toolbar-title>

      <div class="row items-center">
        <q-input
          outlined
          dense
          v-model="search"
          type="text"
          placeholder="ค้นหา"
          class="q-mx-md"
          style="width: 330px"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Template -->
      <q-btn
        class="q-px-md bg-white text-black"
        flat
        style="border: 1px solid #ccc"
        @click="goToUserForm"
      >
        <div class="row items-center no-wrap">
          <span class="q-mr-sm">เพิ่มผู้ใช้</span>
          <q-btn
            round
            icon="add"
            color="black"
            text-color="white"
            class="q-ml-sm"
            style="width: 2px; height: 2px; font-size: 10px"
          />
        </div>
      </q-btn>
    </div>

    <!-- Table -->
    <div>
      <q-table
        :rows="rows"
        :columns="columns"
        row-key="id"
        separator="cell"
        class="global-table"
        flat
        bordered
        :rows-per-page-options="[5, 10, 13]"
        :pagination="{ rowsPerPage: 13, page: 1 }"
        :pagination-label="getPaginationLabel"
        rows-per-page-label="จำนวนต่อหน้า:"
      >
        <template v-slot:body-cell-status="props">
          <q-td :props="props">
            <!-- status comes back from the API as the string "1"/"0" (varchar
                 column), so compare as numbers or every user looks inactive -->
            <q-toggle
              :model-value="Number(props.row.status)"
              :true-value="1"
              :false-value="0"
              color="blue"
              :label="Number(props.row.status) === 1 ? 'Active' : 'Inactive'"
              @update:model-value="
                (val) => {
                  props.row.status = val
                  updateStatus(props.row, val)
                }
              "
            />
          </q-td>
        </template>

        <!-- ปุ่ม Action -->
        <template v-slot:body-cell-manage="props">
          <q-td :props="props">
            <q-btn
              round
              dense
              color="primary"
              icon="create"
              @click="editData(props.row.id)"
              class="q-mr-xs"
            >
              <q-tooltip>แก้ไขข้อมูลผู้ใช้</q-tooltip>
            </q-btn>
            <q-btn round dense color="negative" icon="delete" @click="confirmDelete(props.row.id)">
              <q-tooltip>ลบผู้ใช้</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>

      <!-- Template Create -->
      <q-dialog v-model="templateDialog">
        <q-card style="width: 600px; height: 280px" class="card_template">
          <q-card-section>
            <div class="text-h4" style="text-align: center">ตั้งชื่อ Template</div>
          </q-card-section>

          <q-card-section>
            <div class="col q-col-gutter-md">
              <div class="col-12">
                <q-input
                  outlined
                  dense
                  v-model="name"
                  placeholder="Template Name"
                  class="q-mx-md"
                  style="width: 500px"
                >
                </q-input>
              </div>
              <div class="col-12" style="margin-left: 17px">
                <q-btn-dropdown style="width: 500px" class="q-pa-xs">
                  <template v-slot:label>
                    <div class="row justify-between items-center full-width">
                      <span class="text-left" style="margin-left: 7px">DROPDOWN BUTTON</span>
                    </div>
                  </template>
                  <q-list>
                    <q-item clickable v-close-popup>
                      <q-item-section>
                        <q-item-label>Photos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup>
                      <q-item-section>
                        <q-item-label>Videos</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup>
                      <q-item-section>
                        <q-item-label>Articles</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="center" style="margin: 12px">
            <q-btn
              class="button"
              label="ยืนยัน"
              color="black"
              v-close-popup
              style="margin-right: 26px"
            />
            <q-btn flat class="button" label="ยกเลิก" color="secondry" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { QTableProps } from 'quasar'
import type { User } from 'src/models'
import { useRouter } from 'vue-router'
import { name } from '@vue/eslint-config-prettier/skip-formatting'
import { useUserStore } from 'src/stores/userStore/userStore'
import { useDialogStore } from 'src/stores/dialogStore/dialogStore'
import { useProfileStore } from 'src/stores/profileStore/profileStore'
import { useRoleStore } from 'src/stores/roleStore/roleStore'
import { useAuthStore } from 'src/stores/authStore/authStore'
const authStore = useAuthStore()
const roleStore = useRoleStore()
const templateDialog = ref(false)
const router = useRouter()
const userStore = useUserStore()
const dialogStore = useDialogStore()
const profileStore = useProfileStore()
const goToUserForm = () => router.push('/user-form')
const users = ref<User[]>([])
const editData = (user_id: number) => router.push(`/user-form/${user_id}`)

const confirmDelete = async (user_id: number) => {
  const isConfirmed = await dialogStore.openDialog(
    'คุณต้องการลบข้อมูลนี้ใช่หรือไม่?',
    'confirm-cancel',
  )

  if (isConfirmed) {
    await userStore.fetchUserById(user_id)
    await profileStore.deleteprofile(userStore.userData?.profile_id || 0)
    await userStore.deleteUser(user_id)
    users.value = await userStore.getUsers()
  }
}
// ค้นหาด้วย Sensor ID
const search = ref('')

const rows = computed(() => {
  if (!search.value) return users.value
  const keyword = String(search.value).toLowerCase()
  return users.value.filter((row) => {
    return (
      String(row.id).includes(keyword) ||
      (row.name && row.name.toLowerCase().includes(keyword)) ||
      (row.last_name && row.last_name.toLowerCase().includes(keyword)) ||
      (row.user_name && row.user_name.toLowerCase().includes(keyword)) ||
      (row.roles_code && row.roles_code.toLowerCase().includes(keyword)) ||
      getRoleName(row.roles_code).toLowerCase().includes(keyword)
    )
  })
})
const updateStatus = async (row: User, newStatus: number) => {
  // Update status in backend
  await userStore.updateUser(row.id, { status: newStatus })
  if (authStore.currentUser?.role_id === 3) {
    // If user is Super Admin, fetch all users
    users.value = await userStore.getUsers()
  } else if (authStore.currentUser?.role_id === 5) {
    users.value = await userStore.fetchStaffAllUsers(authStore.currentUser?.site_id || 0)
  } else {
    users.value = await userStore.fetchAdminAllUsers(authStore.currentUser?.site_id || 0)
  }
}

// ✅ ฟังก์ชันสำหรับแสดงข้อความ pagination เป็นภาษาไทย
function getPaginationLabel(firstRowIndex: number, endRowIndex: number, totalRowsNumber: number) {
  return `${firstRowIndex}-${endRowIndex} จากทั้งหมด ${totalRowsNumber}`
}

onMounted(async () => {
  if (authStore.currentUser?.role_id === 3) {
    // If user is Super Admin, fetch all users
    users.value = await userStore.getUsers()
  } else if (authStore.currentUser?.role_id === 5) {
    users.value = await userStore.fetchStaffAllUsers(authStore.currentUser?.site_id || 0)
  } else {
    users.value = await userStore.fetchAdminAllUsers(authStore.currentUser?.site_id || 0)
  }
  await roleStore.getRoles()
})

// columns Table
const columns: QTableProps['columns'] = [
  {
    name: 'id',
    label: 'รหัสผู้ใช้',
    field: 'id',
    align: 'left',
    sortable: true,
  },
  {
    name: 'name',
    label: 'ชื่อ',
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'last_name',
    label: 'นามสกุล',
    field: 'last_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'user_name',
    label: 'ชื่อผู้ใช้',
    field: 'user_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'roles_code',
    label: 'ตำแหน่ง',
    field: (row) => getRoleName(row.roles_code), // Use the helper here
    align: 'left',
    sortable: true,
  },
  {
    name: 'status',
    label: 'สถานะ',
    field: 'status',
    align: 'center',
    sortable: true,
  },
  {
    name: 'manage',
    label: 'จัดการ',
    field: 'manage',
    align: 'center',
    sortable: false,
  },
]

function getRoleName(code: string) {
  const role = roleStore.roles.find((r) => r.roles_code === code)
  return role ? role.roles_name : code
}
</script>

<style scoped>
.form-title {
  font-size: 2rem;
  font-family: 'Sarabun', 'Prompt', Arial, sans-serif;
}

/* .bg-page {
  background: white;
  font-family: 'Sarabun', sans-serif;
} */

.button {
  width: 100px;
  border: 1px solid black;
  border-radius: 0%;
}

.card_template {
  border: 1px solid black;
  border-radius: 2;
}

/* ✅ ซ่อน scrollbar ทั้งหมด */
:deep(*) {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

:deep(*::-webkit-scrollbar) {
  width: 0px;
  background: transparent; /* Chrome/Safari/Webkit */
}

/* ✅ บังคับให้ทุกข้อความในตารางอยู่ตรงกลาง - เฉพาะหน้า UserManagement */
:deep(.global-table td),
:deep(.global-table th),
:deep(.global-table .q-td),
:deep(.global-table .text-left),
:deep(.global-table .text-right),
:deep(.global-table .sortable) {
  text-align: center !important;
}

:deep(.global-table thead th) {
  text-align: center !important;
  font-size: 20px !important;
  font-weight: 900 !important;
}

:deep(.global-table tbody td) {
  text-align: center !important;
  font-size: 16px !important;
  font-weight: 400 !important;
}

/* ✅ Remove pagination border - UserManagement */
:deep(.q-table__bottom) {
  border: none !important;
}

/* ✅ Remove table container border - UserManagement */
:deep(.q-table__container) {
  border: none !important;
}

:deep(.q-table--bordered) {
  border: none !important;
}

:deep(.global-table.q-table--bordered) {
  border: none !important;
}

/* ✅ Hide the separator line completely */
:deep(.q-table__separator) {
  display: none !important;
}
</style>
