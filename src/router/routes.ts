import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  //Nurse -----
  //login
  {
    path: '/',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      { path: '', name: 'LoginPage', component: () => import('pages/Login/LoginPage.vue') },
    ],
    meta: { requireAuth: false },
  },
  //patients
  {
    path: '/patients-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'PatientsPage',
        component: () => import('pages/Patients/PatientsPage.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/patientinfo-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: ':patient_id',
        name: 'PatientInfo',
        component: () => import('pages/Patients/PatientInfo.vue'),
        meta: { requireAuth: true },
      },
    ],
  },
  {
    path: '/patientform-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'PatientsForm',
        component: () => import('pages/Patients/PatientForm.vue'),
      },
      {
        path: ':id',
        name: 'EditPatient',
        component: () => import('pages/Patients/PatientForm.vue'),
      },
    ],
    meta: { requireAuth: true },
  },

  //Sensor
  {
    path: '/notificationmanagement-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'NotificationManagement',
        component: () => import('pages/Notification/PatientNotificationManagement.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/sensorsetting-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'SensorSetting',
        component: () => import('pages/Sensor/SensorSetting.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/sensorsmanagementadmin-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'SensorAdmin',
        component: () => import('pages/Sensor/SensorAdmin.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/sensorstemplate-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'SensorTemplate',
        component: () => import('pages/Sensor/SensorTemplate.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/sensorsform-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'SensorForm',
        component: () => import('pages/Sensor/SensorForm.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/sensorstatus-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'SensorStatus',
        component: () => import('pages/Sensor/SensorStatus.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/bedsensor-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'BedSensorSetting',
        component: () => import('pages/Sensor/BedSensorSetting.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  //Notification
  {
    path: '/notifications-page',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'NotiNurse',
        component: () => import('pages/Notification/NotiNurse.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/patient-notification-settings',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'PatientNotificationSettings',
        component: () => import('pages/Notification/PatientNotificationSettings.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  //Dashboard
  {
    path: '/dashboard-nurse',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'DashboardNurse',
        component: () => import('pages/Dashboard/DashboardOverviewNurse.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/dashboard-admin',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'DashboardAdmin',
        component: () => import('pages/Dashboard/DashboardOverviewAdmin.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/user-management',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'UserManagement',
        component: () => import('pages/UserManagement/UserM.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/location-management',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Location Management',
        component: () => import('pages/LocationManagement/LocationManagent.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/user-form',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'User Form ',
        component: () => import('src/pages/UserManagement/UserF.vue'),
      },
      {
        path: ':id',
        name: 'Edit User',
        component: () => import('src/pages/UserManagement/UserF.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/building-management',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Building Management',
        component: () => import('pages/LocationManagement/BuildingManagent.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/sites-form',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Sites Form',
        component: () => import('pages/LocationManagement/SitesForm.vue'),
      },
      {
        path: ':id',
        name: 'Edit Site',
        component: () => import('pages/LocationManagement/SitesForm.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/building-form',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Building Form',
        component: () => import('pages/LocationManagement/BuildingForm.vue'),
      },
      {
        path: ':id',
        name: 'Edit Building',
        component: () => import('pages/LocationManagement/BuildingForm.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/floor-form',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Floor Form',
        component: () => import('pages/LocationManagement/FloorForm.vue'),
      },
      {
        path: ':id',
        name: 'Edit Floor',
        component: () => import('pages/LocationManagement/FloorForm.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/notification-history',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Notification History',
        component: () => import('pages/Notification History/NotificationHistory.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/patient-management-recptionist',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Patient Management',
        component: () => import('pages/Patients/PatientRecp.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/bed-management',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Bed Management',
        component: () => import('pages/BedManagement/BedManagementWrapper.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/bed-form/:id?',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Bed Form',
        component: () => import('pages/BedManagement/BedForm.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/department-management',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Department Management',
        component: () => import('pages/Department/DepartmentManagement.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    path: '/department-form/:id?',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'DepartmentForm',
        component: () => import('pages/Department/DepartmentForm.vue'),
      },
    ],
    meta: { requireAuth: true },
  },
  {
    //error page
    path: '/:catchAll(.*)*',
    component: () => import('pages/Permission/ErrorNotFound.vue'),
  },
]

export default routes
