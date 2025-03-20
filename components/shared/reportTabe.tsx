import { ColorBlindType, SideEffectType } from '@/app/(main)/Admin/[name]/Patient/[userId]/page'
import { COLOR_BLIND_REPORT } from '@/app/constants/admin/colorBlindReport'
import { SIDE_EFFECT_REPORT } from '@/app/constants/admin/sideEffectReport'
import { COMBINE_ACTIVITY_REPORT } from '@/app/constants/admin/slotActivityReport'
import { DayActivityType } from '@/app/(main)/Obs/[name]/Patient/[patientId]/page'
import { CombineDayAndDotType } from '@/app/(main)/Obs/[name]/Patient/[patientId]/page'

import {
  Box
} from '@mui/material'

import {
  DataGrid,
  GridCellParams
} from '@mui/x-data-grid'

interface ReportTableProps  {
  report: string
  row: (ColorBlindType | SideEffectType | CombineDayAndDotType)[]
  onClickVideo?: (date_: string) => void
}

function ReportTable({
    report,
    row,
    onClickVideo
  }: ReportTableProps 
) {

  switch(report) {
    case('colorBlind'): {
      return (
        <Box
          sx={{
            width: '100%',
            mt: '12px',
            '& .super-app-theme--header': {
              backgroundColor: '#F4F5FA',
            },
          }}
        >
          {row && (
            <DataGrid 
              rows={row as ColorBlindType[]}
              columns={COLOR_BLIND_REPORT}
              getRowId={(row: ColorBlindType) => row.colorBlindID}
              getRowClassName={(params: any) => 
                params.row.incorrect > 2 ? 'red-row' : 'normal-row'
              }
              sx={{ 
                '&.custom-data-grid .red-row': {
                  backgroundColor: '#FCD2D3',
                  color: '#831110',
                },
                '&.custom-data-grid .normal-row': {
                  backgroundColor: 'inherit',
                  color: 'inherit',
                },
              }}
              className={'custom-data-grid'}
            />
          )}
      </Box>
      )
    }
    case('sideEffect'): {
      return (
        <Box
          sx={{
            width: '100%',
            mt: '12px',
            '& .super-app-theme--header': {
              backgroundColor: '#F4F5FA',
            },
          }}
        >
          {row && (
            <DataGrid 
              rows={row as SideEffectType[]}
              columns={SIDE_EFFECT_REPORT}
              getRowId={(row: SideEffectType) => row.sideEffectID}
            />
          )}
      </Box>
      )
    }
    case('dayActivity'): {
      return (
        <Box
          sx={{
            width: '100%',
            mt: '12px',
            '& .super-app-theme--header': {
              backgroundColor: '#F4F5FA',
            },
          }}
        >
          {row && (
            <DataGrid 
              rows={row as CombineDayAndDotType[]}
              columns={COMBINE_ACTIVITY_REPORT(onClickVideo || (() => {}))}
              getRowId={(row: CombineDayAndDotType) => row.date_.toString()}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 50, page: 0 }
                }
              }}
            />
          )}
        </Box>
      )
    }
    default: {
      return (
        <>
          Something wrong with table report :P
        </>
      )
    }
  }
}

export default ReportTable