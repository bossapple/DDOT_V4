import {
  Box, Button
} from '@mui/material'

const statusColors: {[key: string] : { bg: string, text: string }} = {
  COMPLETED: {
    bg: '#BFEDC1',
    text: '#004702',
  },
  INCOMPLETED: {
    bg: '#FFC7C7',
    text: '#7A0000'
  },
  UNVERIFIED: {
    bg: '#C7C8CC',
    text: '#000'
  }
}

const getBgStatusColor = (statusColor: string) => {
  return statusColors[statusColor]?.bg
}

const getTextColorStatus = (statusColor: string) => {
  return statusColors[statusColor]?.text
}

export const COMBINE_ACTIVITY_REPORT = (handleClickVideo: (date_: string) => void) => [
  {
    field: 'date_',
    headerClassName: 'super-app-theme--header',
    headerName: 'วัน/เดือน/ปี',
    width: 100,
    minWidth: 100,
    flex: 0.6,
  },
  {
    field: 'pills_no',
    headerClassName: 'super-app-theme--header',
    headerName: 'จำนวนเม็ดยาที่ต้องทาน',
    width: 100,
    minWidth: 100,
    flex: 0.6,
  },
  {
    field: 'pillEaten',
    headerClassName: 'super-app-theme--header',
    headerName: 'จำนวนเม็ดยาที่ทานไปแล้ว',
    width: 100,
    minWidth: 100,
    flex: 0.6
  },
  {
    field: 'isComplete',
    headerClassName: 'super-app-theme--header',
    headerName: 'สถานะต่อวัน',
    width: 100,
    minWidth: 100,
    flex: 0.6,
    renderCell: (params: any) => (
      <Box
        sx={{
          minWidth: '120px',
          textAlign: 'center',
          alignItems: 'center',
          padding: '10px 0px',
          backgroundColor: getBgStatusColor(params.row.isComplete),
          color: getTextColorStatus(params.row.isComplete)
        }}
      >
        {params.row.isComplete}
      </Box>
    ),
  },
  {
    field: 'videoCount',
    headerClassName: 'super-app-theme--header',
    headerName: 'จำนวนวิดีโอต่อวัน',
    width: 100,
    minWidth: 100,
    flex: 0.5
  },
  {
    field: 'videos',
    headerClassName: 'super-app-theme--header',
    headerName: 'ดูรายละเอียดต่อวัน',
    width: 100,
    minWidth: 100,
    flex: 0.6,
    renderCell: (params: any) => (
      <Button
        variant='outlined'
        onClick={() => handleClickVideo(params.row.date_)}
      >
        วิดีโอต่อวัน
      </Button>
    )
  }
]
