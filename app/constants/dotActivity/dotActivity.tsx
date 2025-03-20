import {
  Box,
  Button
} from '@mui/material'

import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';

export const DOT_ACTIVITY = (handleViewVideo: (activityID: string) => void) => [
  {
    field: 'ActivityID',
    headerClassName: 'super-app-theme--header',
    headerName: 'ไอดี',
    width: 100,
    height: 100,
    flex: 0.3
  },
  {
    field: 'date_',
    headerClassName: 'super-app-theme--header',
    headerName: 'วัน/เดือน/ปี',
    width: 100,
    height: 100,
    flex: 0.6
  },
  {
    field: 'time_',
    headerClassName: 'super-app-theme--header',
    headerName: 'เวลาที่อัดวิดีโอ',
    width: 100,
    height: 100,
    flex: 0.6
  },
  {
    field: 'pillEaten',
    headerClassName: 'super-app-theme--header',
    headerName: 'จำนวนเม็ดยาที่กินต่อวิดีโอ',
    width: 100,
    height: 100,
    flex: 0.6
  },
  {
    field: 'videoLink',
    headerClassName: 'super-app-theme--header',
    headerName: 'ดูวิดีโอ',
    width: 100,
    minWidth: 100,
    renderCell: (params: any) => (
      <Button
        onClick={() => handleViewVideo(params.row.ActivityID)}
      >
        <PlayCircleOutlinedIcon />
      </Button>
    )
  }
]