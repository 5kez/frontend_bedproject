// Demo accounts from the fictional seed (password for all: demo1234)
export const DEMO_ROLES = [
  { user: 'nurse', label: 'พยาบาล (อายุรกรรม)', icon: 'medical_services' },
  { user: 'admin', label: 'ผู้ดูแลระบบ', icon: 'admin_panel_settings' },
  { user: 'superadmin', label: 'ผู้ดูแลระบบสูงสุด', icon: 'verified_user' },
  { user: 'reception', label: 'ประชาสัมพันธ์', icon: 'support_agent' },
  { user: 'tech', label: 'ช่างเทคนิค', icon: 'build' },
] as const

// same landing pages as LoginPage.vue
export const HOME_BY_ROLE: Record<number, string> = {
  1: '/patients-page',
  2: '/dashboard-admin',
  3: '/dashboard-admin',
  4: '/patient-management-recptionist',
  5: '/sensorsmanagementadmin-page',
}
