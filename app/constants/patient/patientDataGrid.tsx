import {
  Button
} from '@mui/material'

export interface ColumnPatientType {
  field: string
  headerClassName: string
  headerName: string
  width: number
  minWidth: number
  flex?: number
  renderCell?: (param: any) => React.ReactNode
}

export const PATIENT_DATAGRID = {
  columns: (
    onClickEdit: (param: { row: { CID: string } }) => void,
  ): ColumnPatientType[] => [
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
      field: 'edit',
      headerClassName: 'super-app-theme--header',
      headerName: 'แก้ไข',
      width: 80,
      minWidth: 80,
      renderCell: (params: any) => (
        <Button variant='outlined' onClick={() => onClickEdit(params)}>
          แก้ไข
        </Button>
      )
    },
    {
      field: 'delete',
      headerClassName: 'super-app-theme--header',
      headerName: 'ลบผู้ใช้นี้',
      width: 80,
      minWidth: 80,
      renderCell: (params: any) => (
        <Button
          variant='outlined'
          sx={{
            backgroundColor: 'rgb(204,51,0)',
            color: 'white',
            '&: hover': {
              backgroundColor: 'rgb(240,44,44)',
            }
          }}
        >
          ลบ
        </Button>
      ),
    },
  ]
}