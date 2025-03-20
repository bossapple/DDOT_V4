"use client";

import { useState, useEffect } from "react";
import { GraphQLClientConnector } from "@/app/lib/API";
import { gql, useMutation } from '@apollo/client'
import { AmphureType, TambonType, ProvinceType, LocalHospitalType, UserRegisterType } from "@/app/register/page";

import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import {
  Box,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import ButtonCompo from "../button";

interface AddPatientType {
  username: string
  password: string
  createdBy: string
  CID: string
  Firstname: string
  Lastname: string
  Gender: string
  dob: string | null | Date
  telephone: string
  province: string | number
  amphoe: string | number
  tambon: string | number
  homeAddress: string
  email: string
  userRole: string
  localHospitalNumber: string
}

function AddPatient() {
  const graphQLClient = GraphQLClientConnector()

  const [provinces, setProvinces] = useState<ProvinceType[]>([]);
  const [amphures, setAmphures] = useState<AmphureType[]>([]);
  const [tambons, setTambons] = useState<TambonType[]>([]);
  const [localHospitals, setLocalHospital] = useState<LocalHospitalType[]>([])
  // Should create in patientRegister so dont have to create this variable
  const [observerCID, setObserverCID] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)

  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const GET_HOSPITALS = gql`
  query LocalHospital {
    LocalHospital {
      localHospitalNumber
      localHospitalname
      tambon
      amphoe
      province
    }
  }
`
  const CREATE_PATIENT = gql`
    mutation Mutation($userInfo: PatientAccountInput!, $startDate: Date!, $localHospitalNumber: String!, $observerCid: String!) {
      createPatient(userInfo: $userInfo, startDate: $startDate, localHospitalNumber: $localHospitalNumber, ObserverCID: $observerCid) {
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
      }
    }
  `

  const [createPatient] = useMutation(CREATE_PATIENT)

  useEffect(() => {
    const fetData = async () => {
      try {
        setLoading(true)
        const getData = await graphQLClient.request<{ LocalHospital: LocalHospitalType[] }>(GET_HOSPITALS)
        setLocalHospital(getData.LocalHospital)
      } catch (error: any) {
        console.log(`Failed to fetch local localHospitalNumber ${error}`)
      } finally {
        setLoading(false)
      }
    }
    fetData()
  }, [])


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const provinceRes = await fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json')
        const tambonRes = await fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json');
        const amphureRes = await fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json');

        const provinceData: ProvinceType[] = await provinceRes.json()
        const tambonData: TambonType[] = await tambonRes.json()
        const amphureData: AmphureType[] = await amphureRes.json()

        setProvinces(provinceData)
        setTambons(tambonData)
        setAmphures(amphureData)

      } catch (error: any) {
        console.log('error: ', error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const [patientRegister, setPatientRegister] = useState<AddPatientType>({
    userRole: 'PATIENT',
    password: '-',
    username: '-',
    localHospitalNumber: '',
    CID: '',
    telephone: '',
    Gender: '',
    dob: null,
    email: '',
    homeAddress: '',
    province: '',
    tambon: '',
    amphoe: '',
    Firstname: '',
    Lastname: '',
    createdBy: '',
  })

  const handleCreatePatient = async (): Promise<void> => {
    const finalProvince = convertProvice(patientRegister.province as number) as string;
    const finalAmphure = convertAmphure(patientRegister.amphoe as number) as string;
    const finalTambon = convertTambon(patientRegister.tambon as number) as string;
    try {
      const { data, errors } = await createPatient({
        variables: {
          userInfo: {
            CID: patientRegister.CID,
            Firstname: patientRegister.Firstname,
            Lastname: patientRegister.Lastname,
            Gender: patientRegister.Gender,
            dob: patientRegister.dob,
            telephone: patientRegister.telephone,
            password: patientRegister.password,
            tambon: finalTambon,
            amphoe: finalAmphure,
            province: finalProvince,
            homeAddress: patientRegister.homeAddress,
            email: patientRegister.email,
            userRole: patientRegister.userRole,
            createdBy: observerCID,
            username: patientRegister.username
          },
          localHospitalNumber: patientRegister.localHospitalNumber,
          observerCid: observerCID,
          startDate: startDate,
        }
      })
      if (errors) {
        setAlertMessage('Failed to create patient');
        setOpenAlert(true)
        setOpenDialog(false)
        console.log(`Failed to create patient: ${errors}`)
      } else {
        setOpenDialog(false)
        setAlertMessage('Create patient successful')
        setOpenAlert(true)
        console.log(`Create patient successful: ${data}`)
        setTimeout(() => {
          window.location.reload()
        }, 700)
      }
    } catch (error: any) {
      setAlertMessage('Failed to create patient');
      setOpenAlert(true)
      setOpenDialog(false)
      console.log(`Failed to crate patient: ${error.message}`)
    }
  }

  const handleDateChange = (propertyName: string, date: Date | null) => {
    const formattedDate = date ? date.toISOString() : ''
    handleChangeValue(propertyName, formattedDate)
  }

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date)
  }

  const handleChangeValue = (propertyName: string, value: string | AddPatientType | number) => {
    setPatientRegister((prevData) => ({
      ...prevData,
      [propertyName]: value
    }))
  }

  const handleChangeObsCID = (value: string) => {
    setObserverCID(value)
  }

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
  }

  const handleCloseAlert = (event: React.SyntheticEvent | Event, reason?: string) => {
    if(reason === 'clickaway') {
      return
    }
    setOpenAlert(false)
  }

  const convertProvice = (provinceId: number) => {
    const findProvinceName = provinces.find((p) => (
      p.id === provinceId
    ))
    return findProvinceName?.name_th
  }

  const convertAmphure = (amphureId: number) => {
    const finalamphuresName = amphures.find((a) => (
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

  const handleCancel = () => {
    setPatientRegister({
      userRole: 'PATIENT',
      localHospitalNumber: '',
      username: '-',
      CID: '',
      password: '-',
      telephone: '',
      Gender: '',
      dob: null,
      email: '',
      homeAddress: '',
      province: '',
      tambon: '',
      amphoe: '',
      Firstname: '',
      Lastname: '',
      createdBy: '',
    })
  }

  return (
    (loading ? (
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
          autoHideDuration={5000}
          onClose={handleCloseAlert}
        >
          <Alert severity={alertMessage === 'Create patient successful' ? 'success' : 'error'}>
            {alertMessage}
          </Alert>
        </Snackbar>
        <Grid container>
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>ชื่อจริง</Typography>
            <TextField
              variant="outlined"
              label="ชื่อจริง"
              sx={{ maxWidth: 508, width: "100%" }}
              name='Firstname'
              value={patientRegister.Firstname}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>นามสกุล</Typography>
            <TextField
              variant='outlined'
              label='นามสกุล'
              sx={{ maxWidth: 508, width: '100%' }}
              name='Lastname'
              value={patientRegister.Lastname}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            />
          </Grid>
          {/* <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>ชื่อผู้ใช้</Typography>
            <TextField
              variant='outlined'
              label='username'
              sx={{ maxWidth: 508, width: '100%' }}
              name='username'
              value={patientRegister.username}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            />
          </Grid> */}
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>สังกัดโรงพญาบาล</Typography>
            <FormControl sx={{ maxWidth: 508, width: "100%" }}>
              <InputLabel>กรุณาเลือกโรงพญาบาล</InputLabel>
              <Select
                name='localHospitalNumber'
                label='กรุณาเลือกโรงพญาบาล'
                value={patientRegister.localHospitalNumber}
                onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
              >
                {localHospitals
                  .map((localHospital) => (
                    <MenuItem key={localHospital.localHospitalNumber} value={localHospital.localHospitalNumber}>
                      {localHospital.localHospitalname}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
          {/* <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>รหัสผ่าน</Typography>
            <TextField
              variant="outlined"
              label="กรอกรหัสผ่าน"
              type="password"
              name='password'
              sx={{ maxWidth: 508, width: "100%" }}
              value={patientRegister.password}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            />
          </Grid> */}
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>เลขบัตรประจำตัวประชาชนผู้ป่วย</Typography>
            <TextField
              variant="outlined"
              label="กรอกเลขประจำตัวประชาชน"
              sx={{ maxWidth: 508, width: "100%" }}
              name='CID'
              value={patientRegister.CID}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>เพศ</Typography>
            <FormControl sx={{ maxWidth: 508, width: "100%" }}>
              <InputLabel>เลือกเพศ</InputLabel>
              <Select
                label="เลือกเพศ"
                name='Gender'
                value={patientRegister.Gender}
                onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
              >
                <MenuItem value="ชาย">ชาย</MenuItem>
                <MenuItem value="หญิง">หญิง</MenuItem>
                <MenuItem value="อื่นๆ">อื่นๆ</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography>เลือกวันเกิด</Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["DatePicker"]}>
                <DatePicker
                  sx={{ width: "100%", maxWidth: 508 }}
                  value={patientRegister.dob}
                  onChange={(date) => handleDateChange('dob', date as Date)}
                />
              </DemoContainer>
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography>วันที่เริ่มต้นการรักษา</Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={["DatePicker"]}>
                <DatePicker
                  sx={{ width: "100%", maxWidth: 508 }}
                  value={startDate}
                  onChange={handleStartDateChange}
                />
              </DemoContainer>
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>เบอร์โทรศัพท์</Typography>
            <TextField
              variant="outlined"
              label="เบอร์โทรศัพท์"
              sx={{ maxWidth: 508, width: "100%" }}
              name='telephone'
              value={patientRegister.telephone}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>อีเมล</Typography>
            <TextField
              variant="outlined"
              label='อีเมล'
              sx={{ maxWidth: 508, width: '100%' }}
              name='email'
              value={patientRegister.email}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>ที่อยู่</Typography>
            <TextField
              variant="outlined"
              label="บ้านเลขที่และหมู่"
              sx={{ maxWidth: 508, width: "100%" }}
              name='homeAddress'
              value={patientRegister.homeAddress}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>กรุณาเลือกจังหวัด</Typography>
            <FormControl sx={{ maxWidth: 508, width: "100%" }}>
              <InputLabel>กรุณาเลือกจังหวัด</InputLabel>
              <Select
                name='province'
                label='กรุณาเลือกจังหวัด'
                value={patientRegister.province}
                onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
              >
                {provinces
                  .slice()
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
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>กรุณาเลือกอำเภอ</Typography>
            <FormControl sx={{ maxWidth: 508, width: "100%" }}>
              <InputLabel>กรุณาเลือกอำเภอ</InputLabel>
              <Select
                name='amphoe'
                label='กรุณาเลือกอำเภอ'
                value={patientRegister.amphoe}
                disabled={patientRegister.province === ''}
                onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
              >
                {amphures
                  .filter((amphoe) => patientRegister.province === amphoe.province_id)
                  .sort((a_name, b_name) => a_name.name_th.localeCompare(b_name.name_th))
                  .map((amphoe) => (
                    <MenuItem key={amphoe.id} value={amphoe.id}>
                      {amphoe.name_th}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>กรุณาเลือกตำบล</Typography>
            <FormControl sx={{ maxWidth: 508, width: "100%" }}>
              <InputLabel>กรุณาเลือกตำบล</InputLabel>
              <Select
                name='tambon'
                label='กรุณาเลือกตำบล'
                value={patientRegister.tambon}
                disabled={patientRegister.amphoe === ''}
                onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
              >
                {tambons
                  .filter((tambon) => patientRegister.amphoe === tambon.amphure_id)
                  .sort((a_name, b_name) => a_name.name_th.localeCompare(b_name.name_th))
                  .map((tambon) => (
                    <MenuItem key={tambon.id} value={tambon.id}>
                      {tambon.name_th}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={12} mb={2}>
            <Typography mb={1}>บัตรประชาชนของผู้ดูแล</Typography>
            <TextField
              variant="outlined"
              label="ใส่บัตรประชาชนของผู้ดูแลคนไข้"
              value={observerCID}
              onChange={(event) => handleChangeObsCID(event.target.value)}
              sx={{ maxWidth: 508, width: '100%' }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: "flex", gap: "16px" }}>
            <Button
              variant='contained'
              onClick={handleOpenDialog}
            >
              ยืนยัน
            </Button>
            <Button
              variant='outlined'
              onClick={handleCancel}
            >
              ยกเลิก
            </Button>
          </Grid>
          <Dialog open={openDialog}>
            <DialogTitle>คุณต้องการสร้างคนไข้และจับคู่กับเจ้าหน้าที่คนนี้หรือไม่</DialogTitle>
            <Box
              sx={{
                display: "flex",
                paddingLeft: "24px",
                paddingBottom: "20px",
              }}
            >
              <ButtonCompo handleClickOpen={handleCreatePatient} />
              <Box
                sx={{
                  marginLeft: "12px",
                }}
              />
              <ButtonCompo cancel={true} handleClickClose={handleClose} />
            </Box>
          </Dialog>
        </Grid>
      </>
    ))
  )
}

export default AddPatient