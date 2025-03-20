export interface DoctorRouteType {
  imgURL: string
  imgClickURL?: string
  label: string
  route: string
}

export const DOCTOR = [
  {
    imgURL: '/images/icon-home-gray.svg',
    imgClickURL: '/images/click-icon-home.svg',
    label: 'หน้าหลัก',
    route: '/Doc/undefined/Main'
  },
  {
    imgURL: '/images/icon-patient.svg',
    imgClickURL: '/images/click-icon-patient.svg',
    label: 'ข้อมูลคนไข้ทั้งหมด',
    route: '/Doc/undefined/Patient'
  },
  //Hospital search page deleted from V4
  // {
  //   imgURL: '/images/icon-hospital.svg',
  //   label: 'ข้อมูลโรงพยาบาล',
  //   route: '/Doc/undefined/Hospital',
  // },
]

export const getDynamicDoctor = (CID: string): DoctorRouteType[] => {
  const cloneDoctor = [...DOCTOR]
  for(let i = 0; i < cloneDoctor.length; i++) {
    cloneDoctor[i].route = cloneDoctor[i].route.replace('/Doc/undefined', `/Doc/${CID}`)
  }
  return cloneDoctor
}