'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

import { GraphQLClientConnector } from '@/app/lib/API'
import { useMutation, gql } from '@apollo/client'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

import { COUNT_COLOR_BLIND_REPORT } from '@/app/constants/colorBlind/countColorBlind'

import {
  Paper,
  Box,
  Typography,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Button,
  Dialog,
  DialogTitle,
  Alert,
  Snackbar,
  CircularProgress,
  Tab,
  Tabs,
} from "@mui/material";

import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ButtonCompo from "@/components/shared/button";
import { UserInfoType } from '../../Obs/page'
import ReportTable from '@/components/shared/reportTabe'

import { countColorblindResult, millisecondsToTime } from '@/app/lib/utility'
import { TabContext, TabPanel } from '@mui/lab'
import CancelIcon from '@mui/icons-material/Cancel';

import { ProvinceType, AmphureType, TambonType } from '@/app/register/page'
import { DataGrid } from '@mui/x-data-grid'

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
  dob: Date | string
  email: string
  homeAddress: string
  province: string | null | number
  amphoe: string | null | number
  tambon: string | null | number
  telephone: string
  useRole: string
  colorBlinds: ColorBlindType[]
  sideEffects: SideEffectType[]
}

function EditPatientId({ params }: { params: { userId: string, name: string } }) {

  const GET_PATIENT = gql`
    query Userinfo($cid: String) {
      Userinfo(CID: $cid) {
        CID
        Firstname
        Gender
        Lastname
        amphoe
        dob
        email
        homeAddress
        province
        tambon
        telephone
        userRole
      }
    }
  `

  const GET_ALL_INFO = gql`
    query Query($cid: String!) {
      getPatientAllInfo(CID: $cid) {
        Firstname
        CID
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
          colorBlindID
          patientCID
          colorBlindDate
          colorBlindTime
          correct
          incorrect
        }
        sideEffects {
          sideEffectID
          patientCID
          effectDate
          effectTime
          effectDesc
        }
      }
    }
  `

  const UPDATE_PATIENT = gql`
    mutation UpdateUser($cid: String!, $edits: EditUserInput!) {
      updateUser(CID: $cid, edits: $edits) {
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
      }
    }
  `

  const router = useRouter()
  const graphQLClient = GraphQLClientConnector()

  
  const [editPatient, setEditPatient] = useState<EditPatientType[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [patientData, setPatientData] = useState<EditPatientType[]>([])
  const [tabValue, setTabValue] = useState('EDIT')

  const [provinces, setProvinces] = useState<ProvinceType[]>([])
  const [amphoes, setAmphoes] = useState<AmphureType[]>([])
  const [tambons, setTambons] = useState<TambonType[]>([])

  const { totalCount, passCount, failedCount } = countColorblindResult(patientData[0]?.colorBlinds)

  const rows = [
    { id: 1, totalCount: totalCount, passCount: passCount, failedCount: failedCount }
  ]

  const [updatePatient] = useMutation(UPDATE_PATIENT)

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [provinceRes, tambonRes, amphureRes] = await Promise.all([
          fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json'),
          fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json'),
          fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json'),
        ]);

        const [provinceData, tambonData, amphoeData] = await Promise.all([
          provinceRes.json(),
          tambonRes.json(),
          amphureRes.json(),
        ]);

        setProvinces(provinceData);
        setTambons(tambonData);
        setAmphoes(amphoeData);

        const getData = await graphQLClient.request<{ Userinfo: EditPatientType[] }>(
          GET_PATIENT, {
          cid: params.userId
        }
        )

        let patientData = getData.Userinfo

        const formattedData = patientData.map((prevPatient) => ({
          ...prevPatient,
          province: provinceData.find((provinceId: any) => provinceId.name_th === prevPatient.province)?.id || null,
          amphoe: amphoeData.find((amphoeId: any) => amphoeId.name_th === prevPatient.amphoe)?.id || null,
          tambon: tambonData.find((tambonId: any) => tambonId.name_th === prevPatient.tambon)?.id || null
        }))

        patientData = formattedData

        setEditPatient(patientData);

      } catch (error: any) {
        console.log(`Failed to fetch patient data: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const getData = await graphQLClient.request<{ getPatientAllInfo: EditPatientType[] }>(GET_ALL_INFO, {
          cid: params.userId
        })

        let patientData = getData.getPatientAllInfo

        const formattedData: EditPatientType[] = patientData.map((prevPatient) => ({
          ...prevPatient,
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
        }))

        patientData = formattedData

        setPatientData(patientData)
      } catch (error: any) {
        console.log(`Failed to fetch patient data: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleClickOpen = () => {
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target
    setEditPatient((prevPatient) => [
      {
        ...prevPatient[0],
        [name]: value
      }
    ])
  }

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target
    setEditPatient((prevPatient) => [
      {
        ...prevPatient[0],
        [name]: value
      }
    ])
  }

  const handleDateChange = (date: Date | null | undefined) => {
    setEditPatient((prevPatient) => [
      {
        ...prevPatient[0],
        dob: date ? dayjs(date).format("YYYY-MM-DDTHH:mm:ss.SSSZ") : "",
      }
    ])
  }

  const handleUpdatePatient = async (): Promise<void> => {
    try {
      const finalProvince = convertProvice(editPatient[0]?.province as number) as string;
      const finalAmphoe = convertAmphure(editPatient[0]?.amphoe as number) as string;
      const finalTambon = convertTambon(editPatient[0]?.tambon as number) as string;
      const cid = editPatient[0].CID

      const { data, errors } = await updatePatient({
        variables: {
          cid: cid,
          edits: {
            Firstname: editPatient[0]?.Firstname,
            Lastname: editPatient[0]?.Lastname,
            Gender: editPatient[0]?.Gender,
            dob: editPatient[0]?.dob,
            telephone: editPatient[0]?.telephone,
            homeAddress: editPatient[0]?.homeAddress,
            email: editPatient[0]?.email,
            tambon: finalTambon,
            amphoe: finalAmphoe,
            province: finalProvince,
          },
        }
      })

      if (errors) {
        console.log("GraphQL errors:", errors);
        setOpenDialog(false);
        setAlertMessage("เกิดข้อผิดพลากในการแก้ไขข้อมูลจากหลังบ้าน");
        setOpenAlert(true)
      } else {
        setOpenDialog(false);
        setOpenAlert(true);
        setAlertMessage("แก้ไขข้อมูลคนไข้ที่สำเร็จ");
        setTimeout(() => {
          router.push(`/Admin/${params.name}/Patient`);
        }, 600)
      }
    } catch (error: any) {
      console.log(`Failed to update patient info: ${error.mesesage}`)
      setAlertMessage("เกิดข้อผิดพลากในการแก้ไขข้อมูล");
    }
  }

  const convertProvice = (provinceId: number) => {
    const findProvinceName = provinces.find((p) => (
      p.id === provinceId
    ))
    return findProvinceName?.name_th
  }

  const convertAmphure = (amphureId: number) => {
    const finalamphuresName = amphoes.find((a) => (
      a.id === amphureId
    ))
    return finalamphuresName?.name_th
  }

  const convertTambon = (tambonId: number) => {
    const finalTambonName = tambons.find((t) => (
      t.id === tambonId
    ))
    return finalTambonName?.name_th
  }

  const handleOnChangeProvince = (propertyName: string, value: string | number) => {
    setEditPatient((prevPatient) => {
      const updatedPatient: EditPatientType = { ...prevPatient[0] };
      if (propertyName === 'province') {
        updatedPatient['province'] = value;
      } else if (propertyName === 'amphoe') {
        updatedPatient['amphoe'] = value
      } else if (propertyName === 'tambon') {
        updatedPatient['tambon'] = value
      }
      return [updatedPatient];
    });
  }

  return (
    <Paper
      sx={{
        minHeight: '90vh',
        padding: '28px',
        maxWidth: '1080px'
      }}
    >
      {
        loading ? (
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
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Tabs
                      value={tabValue}
                      onChange={handleTabChange}
                    >
                      <Tab
                        sx={{ flexGrow: 1, minHeight: "0" }}
                        label='ข้อมูลคนไข้'
                        value='EDIT'
                      />
                      <Tab
                        sx={{ flexGrow: 1, minHeight: "0" }}
                        label='ตาบอดสี'
                        value='COLOR BLIND'
                      />
                      <Tab
                        sx={{ flexGrow: 1, minHeight: "0" }}
                        label='ผลข้างเคียง'
                        value='SIDE EFFECT'
                      />
                    </Tabs>
                  </Box>
                </Box>
                <TabPanel value='EDIT'>
                  <>
                    <Snackbar
                      anchorOrigin={{ vertical: "top", horizontal: "center" }}
                      open={openAlert}
                      autoHideDuration={5000}
                      onClose={handleClose}
                    >
                      <Alert severity={alertMessage ? "success" : "error"}>
                        {alertMessage || "Success"}
                      </Alert>
                    </Snackbar>
                    <Typography variant="h5">แก้ไขข้อมูลคนไข้</Typography>
                    <Grid container spacing={2} mt={3}>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>เลขบัตรประจำตัวประชาชน</Typography>
                        <TextField
                          variant="outlined"
                          name="CID"
                          // label='ใส่เลขบัตรประจำตัวประชาชน 13 หลัก'
                          fullWidth
                          value={editPatient[0]?.CID || ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>อีเมล</Typography>
                        <TextField
                          variant="outlined"
                          name="email"
                          fullWidth
                          value={editPatient[0]?.email || ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>ชื่อจริง</Typography>
                        <TextField
                          variant="outlined"
                          name="Firstname"
                          fullWidth
                          value={editPatient[0]?.Firstname || ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>นามสกุล</Typography>
                        <TextField
                          variant="outlined"
                          name="Lastname"
                          fullWidth
                          value={editPatient[0]?.Lastname || ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>เพศ</Typography>
                        <FormControl fullWidth>
                          {/* <InputLabel>เลือกเพศ</InputLabel> */}
                          <Select
                            name="Gender"
                            value={`${editPatient[0]?.Gender}` || ""}
                            onChange={(e) => handleSelectChange(e)}
                          >
                            <MenuItem value={"ชาย       "}>ชาย</MenuItem>
                            <MenuItem value={"หญิง"}>หญิง</MenuItem>
                            <MenuItem value={"อื่นๆ"}>อื่นๆ</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography>วันเกิด</Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DemoContainer components={["DataPicker"]}>
                            <DatePicker
                              format="DD-MM-YYYY"
                              sx={{ width: "100%" }}
                              name="dob"
                              value={dayjs(editPatient[0]?.dob) || ""}
                              onChange={(date) => handleDateChange(date?.toDate())}
                            />
                          </DemoContainer>
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>โรงพยาบาล</Typography>
                        <FormControl fullWidth>
                          <InputLabel>โรงพยาบาล</InputLabel>
                          <Select label="โรงพยาบาล">
                            <MenuItem value={"mock1"}>Mock1</MenuItem>
                            <MenuItem value={"mock2"}>Mock2</MenuItem>
                            <MenuItem value={"mock3"}>Mock3</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>เบอร์โทรศัพท์</Typography>
                        <TextField
                          variant="outlined"
                          // label='กรอกเบอร์โทรศัพท์'
                          name="telephone"
                          fullWidth
                          value={editPatient[0]?.telephone || ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>ที่อยู่</Typography>
                        <TextField
                          variant="outlined"
                          // label='กรอกที่อยู่'
                          name="homeAddress"
                          fullWidth
                          value={editPatient[0]?.homeAddress || ""}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>จังหวัด</Typography>
                        <FormControl fullWidth>
                          <InputLabel>จังหวัด</InputLabel>
                          <Select
                            label="จังหวัด"
                            value={`${editPatient[0]?.province}` || ""}
                            name='province'
                            onChange={(event) => handleOnChangeProvince(event.target.name, event.target.value)}
                          >
                            {provinces
                              .sort((a, b) => a.name_th.localeCompare(b.name_th))
                              .map((province) => (
                                <MenuItem key={province.id} value={province.id}>
                                  {province.name_th}
                                </MenuItem>
                              ))

                            }
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>อำเภอ</Typography>
                        <FormControl fullWidth>
                          <InputLabel>อำเภอ</InputLabel>
                          <Select
                            label="อำเภอ"
                            value={`${editPatient[0]?.amphoe}` || ""}
                            name='amphoe'
                            onChange={(event) => handleOnChangeProvince(event.target.name, event.target.value)}
                          >
                            {amphoes
                              .filter((amphoe) => amphoe.province_id === editPatient[0]?.province)
                              .map((amphoe) => (
                                <MenuItem key={amphoe.id} value={amphoe.id}>
                                  {amphoe.name_th}
                                </MenuItem>
                              ))

                            }
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography mb={1}>ตำบล</Typography>
                        <FormControl fullWidth>
                          <InputLabel>ตำบล</InputLabel>
                          <Select
                            label="ตำบล"
                            value={`${editPatient[0]?.tambon}` || ""}
                            name='tambon'
                            onChange={(event) => handleOnChangeProvince(event.target.name, event.target.value)}
                          >
                            {tambons
                              .filter((tambon) => tambon.amphure_id === editPatient[0]?.amphoe)
                              .map((tambon) => (
                                <MenuItem key={tambon.id} value={tambon.id}>
                                  {tambon.name_th}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid
                        item
                        xs={12}
                        md={6}
                        sx={{ display: "flex", gap: "16px", mt: "12px" }}
                      >
                        <ButtonCompo
                          handleClickOpen={handleClickOpen}
                        />
                        <ButtonCompo cancel={true} />
                      </Grid>
                    </Grid>
                  </>
                </TabPanel>
                <TabPanel value='COLOR BLIND'>

                  <Grid item xs={12} md={12}>
                    {!loading && patientData[0]?.colorBlinds.length === 0 ? (
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
                    ) : (
                      <>
                        <Typography mb={2} variant='h5'>ผลสรุปตาบอดสี</Typography>
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
                        <Typography mt={2} variant='h5'>ทดสอบตาบอดสี</Typography>
                        <ReportTable
                          report="colorBlind"
                          row={patientData[0]?.colorBlinds as ColorBlindType[] || []}
                        />
                      </>
                    )
                    }
                  </Grid>
                </TabPanel>
                <TabPanel value='SIDE EFFECT'>
                  <Grid item xs={12} md={12}>
                    {patientData[0]?.sideEffects.length === 0 ? (
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
                    ) : (
                      <>
                        <Typography mt={2} variant='h5'>ผลข้างเคียง</Typography>
                        <ReportTable
                          report='sideEffect'
                          row={patientData[0]?.sideEffects as SideEffectType[] || []}
                        />
                      </>
                    )
                    }
                  </Grid>
                </TabPanel>
              </TabContext>
            </Box>
            <Dialog open={openDialog}>
              <DialogTitle>{"คุณต้องการแก้ไขข้อมูลหรือไม่"}</DialogTitle>
              <Box
                sx={{
                  display: "flex",
                  paddingLeft: "24px",
                  paddingBottom: "20px",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleUpdatePatient}
                >
                  ยืนยัน
                </Button>
                <Button
                  sx={{
                    marginLeft: "12px",
                  }}
                  variant="outlined"
                  onClick={handleClose}
                >
                  ยกเลิก
                </Button>
              </Box>
            </Dialog>
          </>
        )
      }
    </Paper>
  )
}

export default EditPatientId