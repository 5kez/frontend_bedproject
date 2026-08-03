import { api as http } from 'src/boot/axios'
import { buildApiUrl, API_ENDPOINTS } from 'src/config/api'

// ✅ รวมทุก API ที่ใช้ในระบบ Dashboard
export const api = {
  // 🔹 Dashboard พยาบาล
  getDashboardStats: (username: string, siteWide?: boolean) =>
    http.get(buildApiUrl('/dashboard/stats'), { params: { username, siteWide } }),

  getDashboardGender: (username: string, siteWide?: boolean) =>
    http.get(buildApiUrl('/dashboard/charts/gender'), { params: { username, siteWide } }),

  getDashboardAgeGroups: (username: string, siteWide?: boolean) =>
    http.get(buildApiUrl('/dashboard/charts/age-groups'), { params: { username, siteWide } }),

  getDashboardAdmitTrend: (username: string, days = 7, siteWide?: boolean) =>
    http.get(buildApiUrl('/dashboard/charts/admit-trend'), {
      params: { username, days, siteWide },
    }),

  getDashboardInOutTrend: (username: string, deptBuildingId: number, siteWide?: boolean) =>
    http.get(buildApiUrl('/dashboard/charts/inout-trend'), {
      params: { username, dept_building_id: deptBuildingId, siteWide },
    }),

  getDashboardAlertHeatmap: (username: string, siteWide?: boolean) =>
    http.get(buildApiUrl('/dashboard/charts/alert-trend'), {
      params: { username, siteWide },
    }),

  getAvgStayTrend: (username: string, siteWide?: boolean) =>
    http.get(buildApiUrl('/dashboard/charts/avg-stay-trend'), {
      params: { username, siteWide },
    }),

  // 🔹 Dashboard แอดมิน
  getAdminDashboardStats: () => http.get(buildApiUrl('/admin-dashboard/stats')),
  getAdminSensorPie: () => http.get(buildApiUrl('/admin-dashboard/sensors/pie')),
  getAdminNotificationsPerDay: () => http.get(buildApiUrl('/admin-dashboard/notifications/daily')),
  getAdminNotificationsPerHour: () =>
    http.get(buildApiUrl('/admin-dashboard/notifications/hourly')),
  getAdminNotificationCategories: (params?: {
    dept_building_id?: number | null
    start_date?: string
    end_date?: string
  }) => http.get(buildApiUrl('/admin-dashboard/notifications/categories'), { params }),
  getAdminNotificationSignalVolume: (params?: {
    dept_building_id?: number | null
    start_date?: string
    end_date?: string
    granularity?: 'hour' | 'day' | 'month' | 'year'
  }) => http.get(buildApiUrl('/admin-dashboard/notifications/signals'), { params }),
  getAdminSensorUsageTrend: (params?: { months?: number; dept_building_id?: number | null }) =>
    http.get(buildApiUrl('/admin-dashboard/sensors/usage-trend'), { params }),

  // 🔹 Shared
  getDepartmentBuildings: () => http.get(buildApiUrl(API_ENDPOINTS.DEPARTMENT_BUILDINGS)),
}

export default api
