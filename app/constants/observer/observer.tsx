
export interface ObserverRouteType {
  imgURL: string;
  imgClickURL?: string;
  label: string;
  route: string;
}

export const OBSERVER = [
  {
    imgURL: '/images/icon-patient.svg',
    imgClickURL: '/images/click-icon-patient.svg',
    label: 'คนไข้ภายใต้การดูแล',
    route: '/Obs/undefined/Patient'
  }
]

export const getDynamicObserver = (CID: string): ObserverRouteType[] => {
  const clonedObserver = [...OBSERVER]
  for(let i = 0; i < clonedObserver.length; i++) {
    clonedObserver[i].route = clonedObserver[i].route.replace('/Obs/undefined', `/Obs/${CID}`)
  }
  return clonedObserver
}