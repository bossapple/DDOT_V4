import {
  Button
} from '@mui/material'

export interface ColumDcoterType {
  field: string
  headerClassName: string
  headerName: string
  width: number
  minWidth: number
  flex?: number
  renderCell?: (param: any) => React.ReactNode
}

export const DOCTOR_DATAGRID = {
  columns: (
    onClickEdit: (params: { row: { CID: string } }) => void,
  ): ColumDcoterType[] => [
      {
        field: 'CID',
        headerClassName: 'super-app-theme--header',
        headerName: 'ID',
        width: 100,
        minWidth: 100,
        flex: 0.6
      },
      {
        field: 'Firstname',
        headerClassName: 'super-app-theme--header',
        headerName: 'ชื่อจริง',
        width: 100,
        minWidth: 100,
        flex: 1
      },
      {
        field: 'Lastname',
        headerClassName: 'super-app-theme--header',
        headerName: 'นามสกุล',
        width: 100,
        minWidth: 100,
        flex: 1
      },
      {
        field: 'Gender',
        headerClassName: 'super-app-theme--header',
        headerName: 'เพศ',
        width: 60,
        minWidth: 60,
      },
      {
        field: 'dob',
        headerClassName: 'super-app-theme--header',
        headerName: 'วันเกิด',
        width: 100,
        minWidth: 100,
      },
      {
        field: 'userRole',
        headerClassName: 'super-app-theme--header',
        headerName: 'ประเภท',
        width: 100,
        minWidth: 100,
      },
      {
        field: 'province',
        headerClassName: 'super-app-theme--header',
        headerName: 'จังหวัด',
        width: 80,
        minWidth: 80,
      },
      {
        field: 'view',
        headerClassName: 'super-app-theme--header',
        headerName: 'ดูข้อมูล',
        width: 80,
        minWidth: 80,
        renderCell: (params: any) => (
          <Button variant='outlined' onClick={() => onClickEdit(params)}>
            ดูข้อมูล
          </Button>
        )
      },
    ]
}