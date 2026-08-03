export interface Site {
  id: string
  name: string
  remark?: string
  code: string
  active: boolean
  sites_type_id: number
}

export interface SiteType {
  id: number
  name: string
  remark?: string
  active: boolean
}
export interface Province {
  id: number
  name: string
}
