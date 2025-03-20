'use client'

import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import { GraphQLClientConnector } from '@/app/lib/API'
import { useRouter, usePathname } from 'next/navigation'
import { useMutation } from '@apollo/client'
import {
  Paper,
  Box,
  CircularProgress,
  Typography,
} from '@mui/material'

import CancelIcon from '@mui/icons-material/Cancel';

import { DataGrid } from '@mui/x-data-grid'

import { millisecondsToTime } from '@/app/lib/utility'
import { DOT_ACTIVITY } from '@/app/constants/dotActivity/dotActivity'

export interface DotActivityType {
  ActivityID: string
  date_: string | Date
  time_: string
  videoLink: string
  pillEaten: number
  cid: string
}

function VideoPerDay({ params }: { params: { videosPerDay: string, patientId: string } }) {
  const graphQLClient = GraphQLClientConnector()
  const router = useRouter()
  const pathname = usePathname()

  const [dotActivity, setDotActivity] = useState<DotActivityType[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const GET_DOTACTIVITY = gql`
    query GetDotActivity($cid: String, $date: String) {
      getDotActivity(cid: $cid, date_: $date) {
        ActivityID
        date_
        time_
        videoLink
        pillEaten
        cid
      }
    }
  `

  const CHECK_STATUS = gql`
  mutation Mutation($cid: String!, $date: String!) {
    updateIsCompleteForDay(cid: $cid, date: $date) {
      date_
      pills_no
      isComplete
      cid
      pillEaten
    }
  }
`
const [checkIscomplete] = useMutation(CHECK_STATUS)
const checkStatus = async() => {
  try {
    await checkIscomplete({
      variables: {
        date: params.videosPerDay,
        cid: params.patientId
      }
    })
  } catch(error: any) {
    console.log('Failed to update isComplete status: ', error.message)
  }
}

useEffect(() => {
  checkStatus()
}, [])

useEffect(() => {
  checkStatus()
}, [dotActivity])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const getDotActivity = await graphQLClient.request<{ getDotActivity: DotActivityType[] }>(GET_DOTACTIVITY, {
          cid: params.patientId,
          date: params.videosPerDay
        })

        const formattedDotActivity = getDotActivity?.getDotActivity.map(dotActivity => {
          const dateObj = dotActivity?.date_ instanceof Date
            ? dotActivity?.date_
            : new Date(parseInt(dotActivity?.date_))

          const day = String(dateObj.getDate()).padStart(2, '0')
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const year = dateObj.getFullYear()

          const formattedDate = `${day}/${month}/${year}`;
          const convertTime = Number(dotActivity?.date_) === 0 ? '00:00:00' : millisecondsToTime(dotActivity.time_)
          return {
            ...dotActivity,
            date_: formattedDate,
            time_: convertTime
          };
        })

        setDotActivity(formattedDotActivity)
        
      } catch (error: any) {
        console.log(`Failed to get dot activity: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleViewVideo = (activityID: string) => {
    router.push(`${pathname}/${activityID}`)
  }

  return (
    <Paper
      sx={{
        minHeight: '90vh',
        padding: '28px',
        maxWidth: '1080px',
      }}
    >
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh'
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {dotActivity.length > 0 ? (
            <DataGrid
              rows={dotActivity as DotActivityType[] || []}
              columns={DOT_ACTIVITY(handleViewVideo)}
              getRowId={(row: DotActivityType) => row?.ActivityID}
              sx={{
                '& .super-app-theme--header': {
                  backgroundColor: '#F4F5FA',
                },
              }}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 }
                }
              }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '70vh'
              }}
            >
              <CancelIcon
                sx={{
                  color: '#656B73',
                  maxWidth: '200px',
                  maxHeight: '200px',
                  fontSize: 80
                }}
              />
              <Typography 
                mt={2} 
                variant='h6' 
                sx={{ color: '#656B73' }}
              >
                ไม่มีประวัติการอัดวิดีโอ
              </Typography>
            </Box>
          )}
        </>
      )}
    </Paper>
  )
}

export default VideoPerDay