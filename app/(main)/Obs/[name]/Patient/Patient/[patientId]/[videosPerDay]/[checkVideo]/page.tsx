'use client'

import { GraphQLClientConnector } from '@/app/lib/API'
import { useState, useEffect } from 'react'
import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'

import {
  Paper,
  Box,
  CircularProgress,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  Alert,
  Snackbar,
} from '@mui/material'

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { DotActivityType } from '../page'
import { millisecondsToTime } from '@/app/lib/utility'

function CheckVideo({ params }: { params: { videosPerDay: string, checkVideo: string, patientId: string, name: string } }) {
  const graphQLClient = GraphQLClientConnector()
  const router = useRouter()

  const [dotActivity, setDotActivity] = useState<DotActivityType[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const GET_DOTACTIVITY = gql`
    query GetDotActivity($activityId: String) {
      getDotActivity(ActivityID: $activityId) {
        ActivityID
        videoLink
        time_
        pillEaten
        date_
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

  const UPDATED_PILLEATEN = gql`
    mutation UpdatePillEaten($activityId: String!, $edit: dotActivityInput!) {
      updatePillEaten(ActivityID: $activityId, edit: $edit) {
        ActivityID
        date_
        time_
        videoLink
        pillEaten
        cid
      }
    }
  `

  const [updatePillEaten] = useMutation(UPDATED_PILLEATEN)
  const [checkIscomplete] = useMutation(CHECK_STATUS)

  useEffect(() => {
    const fetchDot = async () => {
      try {
        const getDot = await graphQLClient.request<{ getDotActivity: DotActivityType[] }>(GET_DOTACTIVITY, {
          activityId: params.checkVideo
        })

        const dot = getDot.getDotActivity;

        const formatted = dot.map(dot => {
          const dateObj = dot?.date_ instanceof Date
            ? dot?.date_
            : new Date(parseInt(dot?.date_))

          const day = String(dateObj.getDate()).padStart(2, '0')
          const month = String(dateObj.getMonth() + 1).padStart(2, '0')
          const year = dateObj.getFullYear()

          const formattedDate = `${day}/${month}/${year}`;
          const convertTime = Number(dot?.date_) === 0 ? '00:00:00' : millisecondsToTime(dot.time_)
          return {
            ...dot,
            date_: formattedDate,
            time_: convertTime
          };
        })

        setDotActivity(formatted)

      } catch (error: any) {
        console.log('Failed to get do activiyty: ', error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDot()
  }, [])

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

  const handleIncrementDecrementPillEaten = (add: boolean) => {
    setDotActivity(dotActivity.map(prevDot => ({
      ...prevDot,
      pillEaten: add
        ? Math.min(Number(prevDot?.pillEaten) + 1, 13)
        : Math.max(Number(prevDot?.pillEaten) - 1, 0)
    })))
  }

  const handleUpdatePillEaten = async (): Promise<void> => {
    try {
      await updatePillEaten({
        variables: {
          activityId: params.checkVideo,
          edit: {
            pillEaten: String(dotActivity[0]?.pillEaten)
          }
        }
      })
      setOpenDialog(false)
      setOpenAlert(true)
      setAlertMessage('อัพเดทสำเร็จ')
      setTimeout(() => {
        router.push(`/Obs/${params?.name}/Patient/${params?.patientId}/${params?.videosPerDay}`)
      }, 800)

    } catch (error: any) {
      console.log('Failed to update pillEaten: ', error.message)
      setAlertMessage('ล้มเหลวในการอัพเดท')
    }
  }

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleCancelDialog = () => {
    setOpenDialog(false)
  }

  const repleaceTimeInVideo = (currentTime: string) => {
    if(currentTime) {
      const newTimeFormat = currentTime.replaceAll(':', '-')
      return newTimeFormat
    } else {
      console.log('Connet read undefined time')
      return
    }
  }

  const handleCloseAlert = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenAlert(false);
  };

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
          <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            open={openAlert}
            autoHideDuration={2000}
            onClose={handleCloseAlert}
          >
            <Alert severity={alertMessage === "อัพเดทสำเร็จ" ? 'success' : "error"}>
              {alertMessage}
            </Alert>
          </Snackbar>
          <Grid container>
            <Grid item xs={12} md={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <CalendarMonthIcon />
                <Typography variant='h6' ml={1}>วันที่บันทึก: {`${dotActivity[0]?.date_}`}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <AccessTimeIcon />
                <Typography variant='h6' ml={1}>เวลาที่บันทึก: {`${dotActivity[0]?.time_}`}</Typography>
              </Box>
            </Grid>
          </Grid>
          <Grid
            container
            sx={{
              // display: 'flex',
              // flexDirection: 'column',
              justifyContent: 'center',
              alignContent: 'center',
            }}
          >
            <Grid item xs={12} md={6}>
              <video width='500' height='300' controls
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}>
                <source src={`${`http://10.34.112.53:3500/`}/videos/${dotActivity[0]?.videoLink}`} type='video/mp4' />
              </video>
            </Grid>
            <Grid item xs={12} md={6} sx={{ justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant='h6'>กดปุ่ม -, + เพื่อนับจำนวนยาที่คนไข้รับประทาน</Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '12px',
                  marginBottom: '12px',
                  justifyContent: 'center',
                  marginTop: '16px'
                }}
              >
                <Typography variant='h4'>{`${dotActivity[0]?.pillEaten}`}</Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginLeft: '12px',
                    marginBottom: '12px'
                  }}
                >
                  <Button
                    variant='outlined'
                    onClick={() => handleIncrementDecrementPillEaten(true)}
                    sx={{
                      fontSize: 20,
                      // color: '#000',
                      maxheight: '40px',
                      padding: '0px 40px',
                      marginBottom: '12px'
                    }}
                  >
                    +
                  </Button>
                  <Button
                    variant='outlined'
                    name='minus'
                    onClick={() => handleIncrementDecrementPillEaten(false)}
                    sx={{
                      fontSize: 20,
                      // color: '#000',
                      maxheight: '40px',
                      padding: '0px 40px'
                    }}
                  >
                    -
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: "flex", gap: "16px", justifyContent: 'center', marginTop: '24px' }}>
              <Button
                variant='contained'
                sx={{
                  padding: '10px 30px'
                }}
                onClick={handleOpenDialog}
              >
                ยืนยัน
              </Button>
              <Button
                variant='outlined'
                sx={{
                  padding: '10px 30px'
                }}
              // onClick={handleCancel}
              >
                ยกเลิก
              </Button>
            </Grid>
          </Grid>
          <Dialog open={openDialog}>
            <DialogTitle>คุณค้องการจะแก้ไขจำนวนการกินยาของคนไข้คนนี้หรือไม่</DialogTitle>
            <Box
              sx={{
                display: "flex",
                paddingLeft: "24px",
                paddingBottom: "20px",
              }}
            >
              <Button
                variant="contained"
                onClick={handleUpdatePillEaten}
              >
                ยืนยัน
              </Button>
              <Button
                sx={{
                  marginLeft: "12px",
                }}
                variant="outlined"
                onClick={handleCancelDialog}
              >
                ยกเลิก
              </Button>
            </Box>
          </Dialog>
        </>
      )}
    </Paper>
  )
}

export default CheckVideo
