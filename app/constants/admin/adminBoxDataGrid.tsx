import { Button } from '@mui/material';
import { ColumnType } from './adminDataGrid';

export const PILLBOX_DATAGRID = {
  columns: (
    onClickEdit: (params: { row: { boxID: string } }) => void,
    onClickDelete?: (params: { row: { boxID: string, pillboxStatus: string } }) => void
  ): ColumnType[] => {
    const formmatedColumns: ColumnType[] = [
    {
      field: 'boxID',
      headerClassName: 'super-app-theme--header',
      headerName: 'ID กล่องยา',
      width: 150,
      minWidth: 100,
      flex: 1
    },
    // {
    //   field: 'localHospitalNumber',
    //   headerClassName: 'super-app-theme--header',
    //   headerName: 'Hospital Number',
    //   width: 180,
    //   minWidth: 150,
    //   flex: 1
    // },
    {
      field: 'simNumber',
      headerClassName: 'super-app-theme--header',
      headerName: 'เลขซิมการ์ด',
      width: 150,
      minWidth: 120,
      flex: 1
    },
    {
      field: 'pillboxStatus',
      headerClassName: 'super-app-theme--header',
      headerName: 'สถาณะกล่อง',
      width: 100,
      minWidth: 100,
      flex: 1
    },
    // {
    //   field: 'startDate',
    //   headerClassName: 'super-app-theme--header',
    //   headerName: 'วันที่เริ่มใช้',
    //   width: 100,
    //   minWidth: 100,
    // },
    // {
    //   field: 'lastUpdate',
    //   headerClassName: 'super-app-theme--header',
    //   headerName: 'อัปเดตสถาณะครั้งล่าสุด',
    //   width: 120,
    //   minWidth: 100,
    // },
    {
      field: 'currentLocation',
      headerClassName: 'super-app-theme--header',
      headerName: 'ตำแหน่งปัจจุบัน',
      width: 150,
      minWidth: 120,
      flex: 1
    },
    {
      field: 'edit',
      headerClassName: 'super-app-theme--header',
      headerName: 'แก้ไข',
      width: 80,
      minWidth: 80,
      flex: 0.5,
      renderCell: (params: any) => (
        <Button variant="outlined" onClick={() => onClickEdit(params)}>
          แก้ไข
        </Button>
      )
    },
  ]
  if(onClickDelete) {
    formmatedColumns.push(({
      field: 'delete',
      headerClassName: 'super-app-theme--header',
      headerName: 'ลบกล่องนี้',
      width: 80,
      minWidth: 80,
      flex: 0.5,
      renderCell: (params: any) => (
        <Button
          variant='outlined'
          sx={{
            backgroundColor: 'rgb(204,51,0)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgb(240,44,44)',
            },
          }}
          onClick={() => onClickDelete(params)}
        >
          ลบ
        </Button>
      ),
    }))
  }
  return formmatedColumns
}
};
