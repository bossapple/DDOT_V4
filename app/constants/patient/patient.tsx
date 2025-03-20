export const PATIENT = [
  {
    imgURL: '/images/icon-home-gray.svg',
    imgClickURL: '/images/click-icon-home.svg',
    label: 'หน้าหลัก',
    route: '/Admin/undefined/Main' // need to be dynaic (Map the data to get admin id)
  },
  {
    imgURL: '/images/icon-staff.svg',
    imgClickURL: '/images/click-icon-staff.svg',
    label: 'ข้อมูลเจ้าหน้าที่ทั้งหมด',
    route: '/Admin/undefined/Obs'
  },
  {
    imgURL: '/images/icon-doctor.svg',
    imgClickURL: '/images/click-icon-doctor.svg',
    label: 'ข้อมูลหมอทั้งหมด',
    route: '/Admin/undefined/Doc'
  },
  {
    imgURL: '/images/icon-patient.svg',
    label: 'ข้อมูลคนไข้ทั้งหมด',
    route: '/Admin/undefined/Patient'
  },
  {
    imgURL: '/images/view-as-icon.svg',
    label: 'มุมมองของผู้ดูแล',
    route: ''
  },
  {
    imgURL: '/images/view-as-icon.svg',
    label: 'มุมมองของหมอ',
    route: ''
  },
  {
    imgURL: '/images/log-out-icon.svg',
    label: 'ออกจากระบบ',
    route: '/'
  }
]