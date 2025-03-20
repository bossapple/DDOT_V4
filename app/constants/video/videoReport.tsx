import {
  Box
} from '@mui/material'

export const VIDEO_REPORT = [
  {
    field: 'month',
    headerClassName: 'super-app-theme--header',
    headerName: 'เดือน-ปี',
    width: 100,
    minWidth: 100,
    flex: 0.6,
  },
  {
    field: 'isPass',
    headerClassName: 'super-app-theme--header',
    headerName: 'สถานะต่อเดือน',
    width: 100,
    minWidth: 100,
    flex: 0.6,
    renderCell: (params: any) => (
      <Box
        sx={{
          minWidth: '80px',
          textAlign: 'center',
          padding: '10px 0px',
          backgroundColor: params.row.isPass ? '#BFEDC1' : '#FFC7C7',
          color: params.row.isPass ? '#004702' : '#7A0000'
        }}
      >
        {params.row.isPass ? 'ผ่าน' : 'ไม่ผ่าน' }
      </Box>
    )
  },
  {
    field: 'completePillTaken',
    headerClassName: 'super-app-theme--header',
    headerName: 'ทานครบ(วัน)',
    width: 100,
    minWidth: 100,
    flex: 0.6,
  },
  {
    field: 'incompletePillTaken',
    headerClassName: 'super-app-theme--header',
    headerName: 'ทานไม่ครบ(วัน)',
    width: 100, 
    minWidth: 100,
    flex: 0.6
  }
]