'use client'

import React, { useState, useEffect } from 'react'

import { GraphQLClientConnector } from '@/app/lib/API'
import { gql } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

import {
  Paper,
  Box,
  Typography,
  TextField,
  Grid,
  CircularProgress,
  Tab,
  Tabs,
} from "@mui/material";

import { DataGrid } from '@mui/x-data-grid'

import { TabPanel, TabContext } from '@mui/lab'

import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { TambonType, AmphureType, ProvinceType } from '@/app/register/page'
import ReportTable from '@/components/shared/reportTabe'
import { millisecondsToTime } from '@/app/lib/utility'

import CancelIcon from '@mui/icons-material/Cancel';
import { countColorblindResult } from '@/app/lib/utility'
import { COUNT_COLOR_BLIND_REPORT } from '@/app/constants/colorBlind/countColorBlind'

export interface ColorBlindType {
  colorBlindID: string
  patientCID: string
  colorBlindDate: string | Date
  colorBlindTime: string
  correct: number
  incorrect: number
}

export interface SideEffectType {
  sideEffectID: string
  patientCID: string
  effectDate: string | Date
  effectTime: string
  effectDesc: string
}

interface EditPatientType {
  CID?: string
  Firstname: string
  Gender: string
  Lastname: string
  amphoe: string | null | number
  dob: Date | string
  email: string
  homeAddress: string
  province: string | null | number
  tambon: string | null | number
  telephone: string
  useRole: string
  colorBlinds: ColorBlindType[]
  sideEffects: SideEffectType[]
}

function ViewPatientDataPage({ params }: { params: { userId: string, name: string } }) {
  const graphQLClient = GraphQLClientConnector()
  const [provinces, setProvinces] = useState<ProvinceType[]>([])
  const [amphoes, setAmphoes] = useState<AmphureType[]>([])
  const [tambons, setTambons] = useState<TambonType[]>([])
  const [loading, setLoading] = useState(true)

  const [tabValue, setTabValue] = useState('USERINFO')

  const GET_ALL_INFO = gql`
    query GetPatientAllInfo($cid: String!) {
      getPatientAllInfo(CID: $cid) {
        CID
        Firstname
        Lastname
        Gender
        dob
        telephone
        tambon
        amphoe
        province
        homeAddress
        email
        userRole
        createdBy
        colorBlinds {
          patientCID
          colorBlindID
          colorBlindDate
          colorBlindTime
          correct
          incorrect
        }
        sideEffects {
          patientCID
          sideEffectID
          effectTime
          effectDesc
          effectDate
        }
      }
    }
  `

  const [editPatient, setEditPatient] = useState<EditPatientType[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [provinceRes, tambonRes, amphureRes] = await Promise.all([
          fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json'),
          fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json'),
          fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json'),
        ]);

        const [provinceData, tambonData, amphureData] = await Promise.all([
          provinceRes.json(),
          tambonRes.json(),
          amphureRes.json(),
        ]);

        setProvinces(provinceData);
        setTambons(tambonData);
        setAmphoes(amphureData);

        const getData = await graphQLClient.request<{ getPatientAllInfo: EditPatientType[] }>(
          GET_ALL_INFO, {
          cid: params.userId
        }
        );

        let patientData = getData.getPatientAllInfo;

        const formattedData = patientData.map((prevPatient) => ({
          ...prevPatient,
          Gender: prevPatient.Gender.trim(),
          dob: prevPatient.dob instanceof Date
            ? prevPatient.dob
            : new Date(parseInt(prevPatient.dob)),
          province: provinceData.find((p: any) => p.name_th === prevPatient.province)?.id || null,
          amphoe: amphureData.find((amphoeId: any) => amphoeId.name_th === prevPatient.amphoe)?.id || null,
          tambon: tambonData.find((tambonId: any) => tambonId.name_th === prevPatient.tambon)?.id || null,
          colorBlinds: prevPatient.colorBlinds.map((colorBlind) => ({
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
          sideEffects: prevPatient.sideEffects.map((sideEffect) => ({
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

        setEditPatient(formattedData);
      } catch (error: any) {
        console.log(`Failed to fetch data: ${error.message}`);
      } finally {
        setLoading(false)
      }
    };

    fetchData();
  }, []);

  const convertToName = () => {
    const findProvinceName = provinces.find(province => province.id === editPatient[0]?.province)?.name_th
    const findAmphoeName = amphoes.find(amphoe => amphoe.id === editPatient[0]?.amphoe)?.name_th
    const findTambonName = tambons.find(tambon => tambon.id === editPatient[0]?.tambon)?.name_th
    return { findProvinceName, findAmphoeName, findTambonName }
  }

  const { findProvinceName, findAmphoeName, findTambonName } = convertToName()
  const { totalCount, passCount, failedCount } = countColorblindResult(editPatient[0]?.colorBlinds)
  const rows = [
    { id: 1, totalCount: totalCount, passCount: passCount, failedCount: failedCount}
  ]
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  return (
    <Paper
      sx={{
        minHeight: '90vh',
        padding: '28px',
        maxWidth: '1080px'
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
          <Box sx={{ boxShadow: 1, borderRadius: '8px' }}>
            <TabContext value={tabValue}>
              <Box
                sx={{
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-evenly',
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Tabs
                    value={tabValue}
                    onChange={handleChange}
                  >
                    <Tab
                      sx={{ flexGrow: 1, minHeight: '0' }}
                      label='ข้อมูลคนไข้'
                      value='USERINFO'
                    />
                    <Tab
                      sx={{ flexGrow: 1, minHeight: '0' }}
                      label='ทดสอบตาบอดสี'
                      value='COLORBLIND'
                    />
                    <Tab
                      sx={{ flexGrow: 1, minHeight: '0' }}
                      label='ผลข้างเคียง'
                      value='SIDEEFFECT'
                    />
                  </Tabs>
                </Box>
              </Box>
              <TabPanel value='USERINFO'>
                <Grid container spacing={2} mt={3}>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>เลขบัตรประจำตัวประชาชน</Typography>
                    <TextField
                      variant="outlined"
                      name="CID"
                      fullWidth
                      value={editPatient[0]?.CID || ""}
                      disabled
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>อีเมล</Typography>
                    <TextField
                      variant="outlined"
                      name="email"
                      fullWidth
                      value={editPatient[0]?.email || "-"}
                      disabled
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>ชื่อจริง</Typography>
                    <TextField
                      variant="outlined"
                      name="Firstname"
                      fullWidth
                      value={editPatient[0]?.Firstname || ""}
                      disabled
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>นามสกุล</Typography>
                    <TextField
                      variant="outlined"
                      name="Lastname"
                      fullWidth
                      value={editPatient[0]?.Lastname || ''}
                      disabled
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>เพศ</Typography>
                    <TextField
                      variant="outlined"
                      name='Gender'
                      value={editPatient[0]?.Gender || ''}
                      fullWidth
                      disabled
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography>วันเกิด</Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={["DataPicker"]}>
                        <DatePicker
                          format="DD-MM-YYYY"
                          sx={{
                            width: "100%",
                            "& .MuiInputBase-input.Mui-disabled": {
                              WebkitTextFillColor: "#000",
                            },
                          }}
                          name="dob"
                          value={dayjs(editPatient[0]?.dob) || null}
                          disabled
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>โรงพยาบาล</Typography>
                    <TextField
                      label='This field does not work YET!'
                      fullWidth
                      disabled
                    />
                    {/* <FormControl fullWidth>
                      <InputLabel>โรงพยาบาล</InputLabel>
                      <Select
                        label="โรงพยาบาล"
                      // Not able to update YET!!
                      >
                        {localHospital
                          .map((hospital) => (
                            <MenuItem key={hospital.localHospitalNumber} value={hospital.localHospitalNumber}>
                              {hospital.localHospitalname}
                            </MenuItem>
                          ))
                        }
                      </Select>
                    </FormControl> */}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>เบอร์โทรศัพท์</Typography>
                    <TextField
                      variant="outlined"
                      name="telephone"
                      fullWidth
                      value={editPatient[0]?.telephone || ''}
                      disabled
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>ที่อยู่</Typography>
                    <TextField
                      variant="outlined"
                      name="homeAddress"
                      fullWidth
                      value={editPatient[0]?.homeAddress || ''}
                      disabled
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>จังหวัด</Typography>
                    <TextField
                      name='province'
                      value={findProvinceName}
                      disabled
                      fullWidth
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>อำเภอ</Typography>
                    <TextField
                      name='amphoe'
                      value={findAmphoeName}
                      disabled
                      fullWidth
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography mb={1}>ตำบล</Typography>
                    <TextField
                      name='tambon'
                      value={findTambonName}
                      disabled
                      fullWidth
                      sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#000",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </TabPanel>
              <TabPanel value='COLORBLIND'>
                {
                  editPatient[0]?.colorBlinds.length > 0 ? (
                    <>
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
                      <Grid item xs={12} md={12}>
                        <Typography mt={4} variant='h5'>ผลทดสอบตาบอดสี</Typography>
                        {
                          editPatient[0]?.colorBlinds.length > 0 ? (
                            <>
                              <ReportTable
                                report="colorBlind"
                                row={editPatient[0]?.colorBlinds as ColorBlindType[] || []}
                              />
                            </>
                          ) : (
                            <>
                              <Box mt={2}>
                                ยังไม่มีการบันทึกทดสอบตาบอดสี
                              </Box>
                            </>
                          )
                        }
                      </Grid>
                    </>
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
                      <Typography mt={2} variant='h6' sx={{ color: '#656B73' }}>ไม่มีประวัติการทำแบบทดสอบตาบอดสี</Typography>
                    </Box>
                  )
                }
              </TabPanel>
              <TabPanel value='SIDEEFFECT'>
                {
                  editPatient[0]?.sideEffects.length > 0 ? (
                    <Grid item xs={12} md={12}>
                      <Typography mt={2} variant='h5'>ผลข้างเคียง</Typography>
                      {
                        editPatient[0]?.sideEffects.length > 0 ? (
                          <>
                            <ReportTable
                              report='sideEffect'
                              row={editPatient[0]?.sideEffects as SideEffectType[] || []}
                            />
                          </>
                        ) : (
                          <Box mt={2}>
                            ยังไม่มีการบันทึกผลข้างเคียง
                          </Box>
                        )
                      }
                    </Grid>
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
                      <Typography mt={2} variant='h6' sx={{ color: '#656B73' }}>ไม่มีประวัติการส่งผลข้างเคียง</Typography>
                    </Box>
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

export default ViewPatientDataPage