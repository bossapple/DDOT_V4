'use client'

import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import { GraphQLClientConnector } from '@/app/lib/API'
import { useMutation } from '@apollo/client/react'

import {
  Paper,
  Tab,
  Box,
  Tabs,
  CircularProgress,
  Typography,
  IconButton
} from '@mui/material'
import EventNoteIcon from '@mui/icons-material/EventNote';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReportTable from '@/components/shared/reportTabe'

import CancelIcon from '@mui/icons-material/Cancel';
import { TabPanel, TabContext } from '@mui/lab'
import { ColorBlindType, SideEffectType } from '@/app/(main)/Admin/[name]/Patient/[userId]/page'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { millisecondsToTime } from '@/app/lib/utility'
import { DataGrid } from '@mui/x-data-grid'
import { COUNT_COLOR_BLIND_REPORT } from '@/app/constants/colorBlind/countColorBlind'

import { countColorblindResult } from '@/app/lib/utility'
import { VIDEO_REPORT } from '@/app/constants/video/videoReport'

export interface SlotActivityType {
  date_: string | Date
  isComplete: string
  pills_no: string
}

interface PatientReportType {
  colorBlinds?: ColorBlindType[]
  sideEffects?: SideEffectType[]
  slotActivities?: SlotActivityType[]
}

interface PatientNameType {
  CID: string
  Firstname: string
  Lastname: string
  dob: Date
}

interface GroupedActivities {
  [key: string]: {
    month: string;
    isPass: boolean | string;
    completePillTaken?: number;
    incompletePillTaken?: number;
  };
}

interface AdmissionType {
  admissionID: string
  startDate: string | Date
  endDate: string
}

export interface DayActivityType {
  cid: string
  date_: string | Date
  isComplete: string
  pills_no: string
}

export interface DotActivityType {
  ActivityID: string
  date_: string | Date
  time_: string
  videoLink: string
  pillEaten: number
  cid: string
}

export interface CombineDayAndDotType {
  cid: string
  date_: string | Date
  isComplete: boolean | string
  pills_no: string
  pillEaten: number
  videoCount: number
}

function PatientId({ params }: { params: { patientId: string } }) {
  const graphQLClient = GraphQLClientConnector()
  const router = useRouter()
  const pathname = usePathname()
  const { name} = useParams()

  const [valueTab, setValueTab] = useState('COLOR BLIND')
  const [loading, setLoading] = useState(true)
  const [patientReport, setPatientReport] = useState<PatientReportType>({
    colorBlinds: [],
    sideEffects: [],
    slotActivities: [],
  });
  const [currentDate, setCurrentDate] = useState<string>("");
  const [patientName, setPatientName] = useState<PatientNameType[]>([])
  const [admission, setAdmission] = useState<AdmissionType>({
    admissionID: '',
    startDate: '',
    endDate: '',
  })

  const [dayActivity, setDayActivity] = useState<DayActivityType[]>([])
  const [combineDayAndDot, setCombineDayAndDot] = useState<CombineDayAndDotType[]>([])

  const { totalCount, passCount, failedCount } = countColorblindResult(patientReport?.colorBlinds)
  const rows = [
    { id: 1, totalCount: totalCount, passCount: passCount, failedCount: failedCount }
    
  ]

  const GET_COLOR_SIDE = gql`
    query GetColorBlind($patientCid: String!, $getSideEffectPatientCid2: String!) {
      getColorBlind(patientCID: $patientCid) {
        colorBlindID
        patientCID
        colorBlindDate
        colorBlindTime
        correct
        incorrect
      }
      getSideEffect(patientCID: $getSideEffectPatientCid2) {
        sideEffectID
        patientCID
        effectDate
        effectTime
        effectDesc
      }
    }
  `

  const GET_ACTIVITY = gql`
    query Query($patientCid: String!) {
      activitiesByPatientCID(patientCID: $patientCid) {
        activityID
        patientCID
        boxID
        activityDate
        activityTime
        purpose
        youtubeLink
        isDotCompleted
        isChecked
      }
    }
  `

  const GET_PATIENT_NAME = gql`
    query Userinfo($cid: String) {
      Userinfo(CID: $cid) {
        CID
        Firstname
        Lastname
        dob
      }
    }
  `

  const GET_ADMISSION = gql`
    query Query($input: AdmissionInput) {
      getAdmission(input: $input) {
        admissionID
        startDate
        endDate
      }
    }
  `

  const GET_DAYACTIVITY = gql`
    query GetDayActivity($patientCid: String!) {
      getDayActivity(patientCID: $patientCid) {
        cid
        date_
        isComplete
        pills_no
      }
    }
  `

  const GET_DOTACTIVITY = gql`
    query GetDotActivity($cid: String) {
      getDotActivity(cid: $cid) {
        date_
        time_
        videoLink
        pillEaten
      }
    }
  `

  const UPDATE_VIDEO_STATUS = gql`
    mutation UpdateStatusFotFistTime($date: String!, $edit: dayActivityStatusInput, $cid: String!) {
      updateStatusFotFistTime(date_: $date, edit: $edit, cid: $cid) {
        date_
        pills_no
        isComplete
        cid
      }
    }
  `

  const [updateVideoStatus] = useMutation(UPDATE_VIDEO_STATUS) 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const getDayActivity = await graphQLClient.request<{ getDayActivity: DayActivityType[] }>(GET_DAYACTIVITY, {
          patientCid: params?.patientId
        });
  
        const getDotActivity = await graphQLClient.request<{ getDotActivity: DotActivityType[] }>(GET_DOTACTIVITY, {
          cid: params?.patientId
        });
  
        const pillsByDate: { [date: string]: number } = {};
        const videosByDate: { [date: string]: number } = {};
  
        getDotActivity.getDotActivity.forEach(dot => {
          let dateKey = '';
          if (dot.date_ instanceof Date) {
            const date = dot.date_;
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear());
            dateKey = `${day}/${month}/${year}`;
          } else {
            const parsedDate = new Date(parseInt(dot.date_));
            const day = String(parsedDate.getDate()).padStart(2, '0');
            const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const year = String(parsedDate.getFullYear());
            dateKey = `${day}/${month}/${year}`;
          }
  
          const pillCount = Number(dot.pillEaten);

          const videoCount = 1;
  
          pillsByDate[dateKey] = (pillsByDate[dateKey] || 0) + pillCount;
          videosByDate[dateKey] = (videosByDate[dateKey] || 0) + videoCount;
        });
  
        const combineData: CombineDayAndDotType[] = getDayActivity.getDayActivity.map(day => {
          const dateObj = day.date_ instanceof Date ? day.date_ : new Date(parseInt(day.date_));
          const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
  
          return {
            cid: day.cid,
            date_: formattedDate,
            isComplete: day.isComplete,
            pills_no: String(day.pills_no),
            pillEaten: pillsByDate[formattedDate] || 0,
            videoCount: videosByDate[formattedDate] || 0
          };
        });
  
        setCombineDayAndDot(combineData);

        const formattedData = getDayActivity.getDayActivity.map(dayActivity => {
          const dateObj = dayActivity.date_ instanceof Date
            ? dayActivity.date_
            : new Date(parseInt(dayActivity.date_));
          
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
        
          const formattedDate = `${day}/${month}/${year}`;
          
          return {
            ...dayActivity,
            date_: formattedDate
          };
        });

        setDayActivity(formattedData);

      } catch (error: any) {
        console.log('Failed to fetch dayActivity: ', error.message);
      } finally {
        setLoading(false)
      }
    };
    fetchData();
  }, []); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const colorSideData = await graphQLClient.request<{ getColorBlind?: ColorBlindType[], getSideEffect?: SideEffectType[] }>(GET_COLOR_SIDE, {
          patientCid: params.patientId,
          getSideEffectPatientCid2: params.patientId
        });

        const activityData = await graphQLClient.request<{ activitiesByPatientCID: SlotActivityType[] }>(GET_ACTIVITY, {
          patientCid: params.patientId
        });

        // const patientName = await graphQLClient.request<{ Userinfo: PatientNameType[] }>(GET_PATIENT_NAME, {
        //   cid: params.patientId
        // })
        
        setPatientReport((prevReport) => ({
          ...prevReport,
          colorBlinds: colorSideData?.getColorBlind?.map((colorBlind) => ({
            ...colorBlind,
            colorBlindDate: colorBlind.colorBlindDate instanceof Date
              ? colorBlind.colorBlindDate.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              })
              : new Date(parseInt(colorBlind.colorBlindDate)).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              }),
            colorBlindTime: Number(colorBlind.colorBlindTime) === 0 ? '0:00:00' : millisecondsToTime(colorBlind.colorBlindTime)
          })),
          sideEffects: colorSideData?.getSideEffect?.map((sideEffect) => ({
            ...sideEffect,
            effectDate: sideEffect.effectDate instanceof Date
              ? sideEffect.effectDate.toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              })
              : new Date(parseInt(sideEffect.effectDate)).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              }),
            effectTime: Number(sideEffect.effectTime) === 0 ? '0:00:00' : millisecondsToTime(sideEffect.effectTime)
          }))
        }));

        //setPatientName(patientName.Userinfo)

      } catch (error: any) {
        console.log(`Failed to fetch patient report: ${error.message}`);
      } finally {
        setLoading(false)
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const getData = await graphQLClient.request<{ getAdmission: AdmissionType }>(GET_ADMISSION, {
          input: { patientCID: params?.patientId }
        })

        let cloneAdmission = { ...getData.getAdmission }

        cloneAdmission.startDate = cloneAdmission.startDate instanceof Date
          ? cloneAdmission.startDate.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          : new Date(parseInt(cloneAdmission?.startDate)).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

        setAdmission(cloneAdmission)

      } catch (error: any) {
        console.log(`Failed to get admission: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const date = new Date();
    const formattedDate = date.toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setCurrentDate(formattedDate); // Set the formatted date to state
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValueTab(newValue);
  };

  useEffect(() => {
    const fetchPatientName = async () => {
      try {
        const graphQLClient = GraphQLClientConnector();  // Initialize GraphQL client
        const patientNameData = await graphQLClient.request<{ Userinfo: PatientNameType[] }>(GET_PATIENT_NAME, {
          cid: params.patientId
        });
  
        // Process the patient data to format DOB
        const patientData = patientNameData.Userinfo[0];  // Assuming we only have one patient in the array
  
        // Format DOB if it's available
        // if (patientData?.DOB) {
        //   let formattedDOB;
        //   if (patientData.DOB instanceof Date) {
        //     formattedDOB = patientData.DOB.toLocaleDateString('th-TH', {
        //       year: 'numeric',
        //       month: 'long',
        //       day: 'numeric',
        //     });
        //   } else {
        //     // If DOB is a string or timestamp, convert it to Date
        //     formattedDOB = new Date(parseInt(patientData.DOB)).toLocaleDateString('th-TH', {
        //       year: 'numeric',
        //       month: 'long',
        //       day: 'numeric',
        //     });
        //   }
  
          // Update the DOB field in the patientData (for rendering)
        //   patientData.DOB = formattedDOB;
        // }
  
        // Set the patient name data in the state
        setPatientName(patientNameData.Userinfo);
      } catch (error) {
        console.error('Failed to fetch patient name:', error);
      } finally {
        setLoading(false); // Set loading state to false after fetching data
      }
    };
  
    fetchPatientName(); // Call the function to fetch data
  }, []);  // Empty dependency array means this will run only once when the component mounts




  const handleVideoClick = async(videoDate: string) => {
    const formattedVideoDate = videoDate.replaceAll('-', '/').split('/').reverse().join('/')
    const filterVideo = combineDayAndDot.filter(video => video.date_ === formattedVideoDate)
    if(filterVideo.length > 0){
      const video = filterVideo[0]
      if(video.isComplete === 'UNVERIFIED') {
        await updateVideoStatus({
          variables: {
            cid: video.cid,
            date: videoDate,
            edit: {
              isComplete: 'INCOMPLETED'
            }
          }
        })
        router.push(`${pathname}/${videoDate}`)
      }
    } 
    router.push(`${pathname}/${videoDate}`)
  }
  const handleMonthDataClick = () => {
    // Include the patientId in the URL
    router.push(`${pathname}/MonthSummary/${params.patientId}`);
  }

  let dayActivityTable: GroupedActivities | undefined = {}

  dayActivityTable = dayActivity?.reduce((acc, curr) => {
    let dayActivityDate: string
    if(typeof curr.date_ === 'string') {
      dayActivityDate = curr.date_
    } else {
      dayActivityDate = curr.date_.toDateString()
    }
  
    const [day, month, year] = dayActivityDate.split('/')
    const monthKey = `${month}-${year}`
  
    if (acc[monthKey]) {
      if (curr.isComplete === 'COMPLETED') {
        acc[monthKey].completePillTaken = (acc[monthKey].completePillTaken || 0) + 1;
      } else if (curr.isComplete === 'INCOMPLETED') {
        acc[monthKey].incompletePillTaken = (acc[monthKey].incompletePillTaken || 0) + 1;
        acc[monthKey].isPass = false;
      }
    } else {
      acc[monthKey] = {
        month: `${month}-${year}`,
        isPass: curr.isComplete === 'COMPLETED' ? true : false,
        completePillTaken: curr.isComplete === 'COMPLETED' ? 1 : 0,
        incompletePillTaken: curr.isComplete === 'INCOMPLETED' ? 1 : 0,
      };
    }
  
    return acc
  }, {} as GroupedActivities)  

  const videoReportRows = dayActivityTable ? Object.values(dayActivityTable).map((item, index) => ({
    id: index + 1,
    ...item,
  })) : [];

  const calculateAge = (dob: string | Date) => {
    const birthDate = new Date(dob); // Convert dob to Date if it's a string
    const today = new Date(); // Get today's date
  
    // Calculate age by subtracting birth year from current year
    let age = today.getFullYear() - birthDate.getFullYear();
  
    const monthDifference = today.getMonth() - birthDate.getMonth();
    const dayDifference = today.getDate() - birthDate.getDate();
  
    // Adjust if the birthday has not occurred yet this year
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age--; // Subtract 1 if the birthday hasn't occurred yet
    }
  
    return age;
  };
  const handleBackClick = () => {
    router.push(`/Obs/${name}/Patient`); // Correct the navigation path
  }
  

  return (
    <Paper sx={{ minHeight: "90vh", padding: "28px", maxWidth: "1080px" }}>
      {/* Current Date in the top-right corner */}
      <Box sx={{ position: "absolute", top: 16, left: 300 }}> {/* Adjust this value to match sidebar width + margin */}
      <IconButton
          sx={{
            display: "flex",
            alignItems: "center",
            border: "1px solid rgb(0, 0, 0)",
            borderRadius: "8px",
            padding: "6px 12px",
            color: "black", // default icon + text color
            transition: "all 0.2s ease-in-out", // optional smooth transition
            '&:hover': {
              backgroundColor: 'rgb(0, 0, 0)',
              color: 'white', // turns both icon and text white on hover
              '& .hover-text': {
                color: 'white',
              },
            },
          }}
          onClick={handleMonthDataClick}
          aria-label="view-month-data"
        >
          <EventNoteIcon fontSize="large" />
          <Typography
            variant="body2"
            className="hover-text" // 👈 add this to target on hover
            sx={{
              marginLeft: 1,
              fontSize: "1rem",
              fontWeight: 600,
              color: "black", // default
              fontFamily: "Prompt, sans-serif",
              letterSpacing: "0.5px",
              transition: "color 0.2s ease-in-out",
            }}
          >
            ผลรายงานช่วง 1 เดือน
          </Typography>
        </IconButton>
      </Box>

      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <Typography variant="h6">{currentDate}</Typography>
      <IconButton
          onClick={handleBackClick}
          aria-label="go-back"
          sx={{ color: "black", marginRight: 1 }} // Add margin to separate the icon and text
        >
          <ArrowBackIcon fontSize="large" />
        <Typography variant="h6" sx={{ color: "black" }}>ย้อนกลับ</Typography> {/* Text next to the icon */}
        </IconButton>
      </Box>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh'
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              marginBottom: '10px',
            }}
          >
            <Typography mr={1}>เลขบัตรประชาชน: </Typography>
            <Typography>{patientName[0]?.CID ? patientName[0].CID : 'Loading'}</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <Typography mr={1}>ชื่อคนไข้:</Typography>
            <Typography>{patientName[0]?.Firstname} {patientName[0]?.Lastname}</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <Typography mr={1}>วันที่เริ่มการรักษา:</Typography>
            <Typography>{admission.startDate instanceof Date ? admission.startDate.toLocaleDateString() : admission.startDate}</Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <Typography mr={1}>อายุ: </Typography>
            {/* Code for age calculation*/}
            <Typography sx={{ mr: 1}}>{calculateAge((patientName[0]?.dob))}</Typography>

            <Typography mr={1}>ส่วนสูง: </Typography>
            {/*Display data from query*/}
            <Typography sx={{ mr: 1}}>Height</Typography>

            <Typography mr={1}>น้ำหนัก: </Typography>
            {/*Display data from query*/}
            <Typography sx={{ mr: 1}}>Weight</Typography>
          </Box>
          <Box sx={{ boxShadow: 1, borderRadius: '8px' }}>
            <TabContext value={valueTab}>
              <Box
                sx={{
                  borderColor: "divider",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Tabs
                    value={valueTab}
                    onChange={handleChange}
                  >
                    <Tab
                      sx={{ flexGrow: 1, minHeight: "0" }}
                      label='ตาบอดสี'
                      value='COLOR BLIND'
                    />
                    <Tab
                      sx={{ flexGrow: 1, minHeight: '0' }}
                      label='ผลข้างเคียง'
                      value='SIDE EFFECT'
                    />
                    <Tab
                      sx={{ flexGrow: 1, minHeight: '0' }}
                      label='วีดิโอ'
                      value='VIDEO'
                    />
                  </Tabs>
                </Box>
              </Box>
              {patientReport?.colorBlinds?.length === 0 ? (
                <TabPanel value='COLOR BLIND'>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '70vh',
                    }}
                  >
                    <CancelIcon
                      sx={{
                        color: '#656B73',
                        maxWidth: '200px',
                        maxHeight: '200px',
                        fontSize: 80,
                      }}
                    />
                    <Typography variant='h6' sx={{ color: '#656B73' }}>
                      ไม่มีประวัติการทำแบบทดสอบตาบอดสี
                    </Typography>
                  </Box>
                </TabPanel>
              ) : (
                <>
                  <TabPanel value='COLOR BLIND'>
                    <Typography variant='h5' mb={1}>สรุปผลตาบอดสี</Typography>
                    <DataGrid
                      rows={rows}
                      columns={COUNT_COLOR_BLIND_REPORT}
                      hideFooterPagination
                      hideFooter
                      disableColumnFilter
                      disableColumnSelector
                      disableColumnMenu
                      sx={{
                        maxWidth: '260px',
                        '& .super-app-theme--header': {
                          backgroundColor: '#F4F5FA',
                        },
                      }}
                    />
                    <Typography mt={4} variant='h5'>ผลทดสอบตาบอดสี</Typography>
                    <ReportTable
                      report='colorBlind'
                      row={patientReport?.colorBlinds as ColorBlindType[] || []}
                    />
                  </TabPanel>
                </>
               )
              }
              {patientReport?.sideEffects?.length === 0 ? (
                <TabPanel value='SIDE EFFECT'>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '70vh',
                    }}
                  >
                    <CancelIcon
                      sx={{
                        color: '#656B73',
                        maxWidth: '200px',
                        maxHeight: '200px',
                        fontSize: 80,
                      }}
                    />
                    <Typography variant='h6' sx={{ color: '#656B73' }}>
                      ไม่มีประวัติการส่งผลข้างเคียง
                    </Typography>
                  </Box>
                </TabPanel>
              ) : (
                <>
                  <TabPanel value='SIDE EFFECT'>
                    <ReportTable
                      report='sideEffect'
                      row={patientReport?.sideEffects as SideEffectType[] || []}
                    />
                  </TabPanel>
                </>
                )
              }
              <TabPanel value='VIDEO'>
                {dayActivity?.length === 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '70vh',
                    }}
                  >
                    <CancelIcon
                      sx={{
                        color: '#656B73',
                        maxWidth: '200px',
                        maxHeight: '200px',
                        fontSize: 80,
                      }}
                    />
                    <Typography variant='h6' sx={{ color: '#656B73' }}>
                      ไม่มีการอัดวิดีโอตอนกินยา
                    </Typography>
                  </Box>
                ) : (
                  <>
                   <Typography variant='h5'>ผลสรุปวิดีโอต่อเดือน</Typography>
                   <DataGrid
                      rows={videoReportRows}
                      columns={VIDEO_REPORT}
                      initialState={{
                        pagination: {
                          paginationModel: { pageSize: 25, page: 0 }
                        }
                      }}
                      disableColumnFilter
                      disableColumnSelector
                      disableColumnMenu
                      rowSelection={false}
                      sx={{
                        marginTop: '12px',
                        maxWidth: '460px',
                        '& .super-app-theme--header': {
                          backgroundColor: '#F4F5FA',
                        },
                      }}
                    />
                    <Typography variant='h5' mt={2}>สถานะวิดีโอต่อวัน</Typography>
                    <ReportTable
                      report='dayActivity'
                      row={combineDayAndDot as CombineDayAndDotType[]}
                      onClickVideo={(date_: string) => {
                        const videos = dayActivity?.find(activity => activity.date_ === date_);
                        if(videos) {
                          let formattedDate: string
                          if(typeof videos?.date_ === 'string') {
                            let splitDay: string[] = videos?.date_.split('/')
                            formattedDate = splitDay[2] + '-' + splitDay[1] + '-' + splitDay[0]
                            handleVideoClick(formattedDate)
                          }
                        }
                      }}
                    />
                  </>
                )
                }
              </TabPanel>
            </TabContext>
          </Box>
        </>
      )}
    </Paper>
  )
}

export default PatientId