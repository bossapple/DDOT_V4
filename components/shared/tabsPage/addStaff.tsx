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

interface AddObserverType {
  userRole: string;
  localHospitalNumber: string;
  username: string;
  CID: string;
  password: string;
  confirmPassword?: string
  telephone: string
  Gender: string
  dob: Date | string | null
  email: string
  homeAddress: string
  province: string | number
  amphoe: string | number
  tambon: string | number
  createdBy: string
  Firstname: string
  Lastname: string
}

function AddStaff({ adminCID }: { adminCID: string | undefined }) {
  const graphQLClient = GraphQLClientConnector()

  const [provinces, setProvinces] = useState<ProvinceType[]>([]);
  const [amphures, setAmphures] = useState<AmphureType[]>([]);
  const [tambons, setTambons] = useState<TambonType[]>([]);
  const [localHospitals, setLocalHospital] = useState<LocalHospitalType[]>([])

  const [openDialog, setOpenDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [openAlert, setOpenAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const [addObserver, setAddObserver] = useState<AddObserverType>({
    userRole: 'OBSERVER',
    localHospitalNumber: '',
    username: '',
    CID: '',
    password: '',
    confirmPassword: '',
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

  const CREATE_OBSERVER = gql`
  mutation Mutation($userInfo: UserAccountInput!, $localHospitalNumber: String!) {
    createUser(userInfo: $userInfo, localHospitalNumber: $localHospitalNumber) {
      username
      password
      createdBy
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
    }
  }
`

  const [createObserver] = useMutation(CREATE_OBSERVER)

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

  const handleDateChange = (propertyName: string, date: Date | null) => {
    const formattedDate = date ? date.toISOString() : ''
    handleChangeValue(propertyName, formattedDate)
  }

  const handleChangeValue = (propertyName: string, value: string | number) => {
    setAddObserver((prevObserver) => ({
      ...prevObserver,
      [propertyName]: value
    }))
  }

  const handleLogData = () => {
    console.log('Log data: ', addObserver)
    console.log('admin CID: ', adminCID)
  }

  const handleCreateObserver = async (): Promise<void> => {
    const finalProvince = convertProvice(addObserver.province as number) as string;
    const finalAmphure = convertAmphure(addObserver.amphoe as number) as string;
    const finalTambon = convertTambon(addObserver.tambon as number) as string;

    try {
      const { data, errors } = await createObserver({
        variables: {
          userInfo: {
            CID: addObserver.CID,
            Firstname: addObserver.Firstname,
            Lastname: addObserver.Lastname,
            Gender: addObserver.Gender,
            dob: addObserver.dob,
            telephone: addObserver.telephone,
            password: addObserver.password,
            tambon: finalTambon,
            amphoe: finalAmphure,
            province: finalProvince,
            homeAddress: addObserver.homeAddress,
            email: addObserver.email,
            userRole: addObserver.userRole,
            createdBy: adminCID,
            username: addObserver.username,
          },
          localHospitalNumber: addObserver.localHospitalNumber,
        },
      });
      if (errors) {
        console.log(`Failed to create staff" ${errors}`)
        setAlertMessage('Failed to create observer')
        setOpenAlert(true)
      } else {
        console.log(`Create staff successfully: ${data}`)
        setAlertMessage('Create staff successful')
        setOpenAlert(true)
        setTimeout(() => {
          window.location.reload()
        }, 700)
      }
    } catch (error: any) {
      console.log(`Failed to create staff: ${error.message}`)
      setAlertMessage('Failed to create staff')
      setOpenAlert(true)
    } finally {
      setOpenDialog(false)
    }
  }

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
  }

  const handleCancel = () => {
    setAddObserver({
      userRole: 'OBSERVER',
      localHospitalNumber: '',
      username: '',
      CID: '',
      password: '',
      confirmPassword: '',
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
    <>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={openAlert}
        autoHideDuration={5000}
      >
        <Alert severity={alertMessage === 'Create staff successful' ? 'success' : 'error'}>
          {alertMessage}
        </Alert>
      </Snackbar>
      <Grid container>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>สังกัดโรงพญาบาล</Typography>
          <FormControl sx={{ maxWidth: 508, width: "100%" }}>
            <InputLabel>กรุณาเลือกโรงพญาบาล</InputLabel>
            <Select
              name='localHospitalNumber'
              label='กรุณาเลือกโรงพญาบาล'
              value={addObserver.localHospitalNumber}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            >
              {localHospitals.map((hospital) => (
                <MenuItem key={hospital.localHospitalNumber} value={hospital.localHospitalNumber}>
                  {hospital.localHospitalname}
                </MenuItem>
              ))
              }
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>ชื่อจริง</Typography>
          <TextField
            label="ชื่อจริง"
            sx={{ maxWidth: 508, width: "100%" }}
            name='Firstname'
            value={addObserver.Firstname}
            onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>นามสกุล</Typography>
          <TextField
            label="นามสกุล"
            sx={{ maxWidth: 508, width: '100%' }}
            name='Lastname'
            value={addObserver.Lastname}
            onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>ชื่อผู้ใช้</Typography>
          <TextField
            label="ชื่อผู้ใช้"
            sx={{ maxWidth: 508, width: '100%' }}
            name='username'
            value={addObserver.username}
            onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>เลขบัตรประชาชน</Typography>
          <TextField
            label="เลขบัตรประชาชน"
            type='number'
            sx={{ maxWidth: 508, width: '100%' }}
            name='CID'
            value={addObserver.CID}
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
              value={addObserver.Gender}
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
            <DemoContainer components={['DatePicker']} >
              <DatePicker
                sx={{ width: "100%", maxWidth: 508 }}
                name='dob'
                value={addObserver.dob}
                onChange={(date) => handleDateChange('dob', date as Date)}
              />
            </DemoContainer>
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>รหัสผ่าน</Typography>
          <TextField
            label="รหัสผ่าน"
            name='password'
            sx={{ maxWidth: 508, width: '100%' }}
            value={addObserver.password}
            type="password"
            onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>อีเมล</Typography>
          <TextField
            label="อีเมล"
            sx={{ maxWidth: 508, width: '100%' }}
            name='email'
            value={addObserver.email}
            onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>เบอร์โทรศัพท์</Typography>
          <TextField
            label="เบอร์โทรศัพท์"
            name='telephone'
            type="number"
            sx={{ maxWidth: 508, width: '100%' }}
            value={addObserver.telephone}
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
              value={addObserver.province}
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
              value={addObserver.amphoe}
              disabled={addObserver.province === ''}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            >
              {amphures
                .filter((amphoe) => addObserver.province === amphoe.province_id)
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
              value={addObserver.tambon}
              disabled={addObserver.amphoe === ''}
              onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
            >
              {tambons
                .filter((tambon) => addObserver.amphoe === tambon.amphure_id)
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
          <Typography mb={1}>ที่อยู่</Typography>
          <TextField
            variant="outlined"
            name='homeAddress'
            value={addObserver.homeAddress}
            sx={{ maxWidth: 508, width: '100%' }}
            label='ที่อยู่'
            onChange={(event) => handleChangeValue(event.target.name, event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: "flex", gap: "16px" }}>
          <Button variant="contained" onClick={handleOpenDialog}>
            ยืนยัน
          </Button>
          <Button variant='outlined' onClick={handleCancel}>
            ยกเลิก
          </Button>
        </Grid>
      </Grid>
      <Dialog
        open={openDialog}
      >
        <DialogTitle>คุณต้องการสร้างเจ้าหน้าที่คนนี้ใช่หรือไม่</DialogTitle>
        <Box
          sx={{
            display: "flex",
            paddingLeft: "24px",
            paddingBottom: "20px",
          }}
        >
          <ButtonCompo handleClickOpen={handleCreateObserver} />
          <Box sx={{ marginLeft: '12px' }} />
          <ButtonCompo cancel={true} handleClickClose={handleClose} />
        </Box>
      </Dialog>
    </>
  )
}

export default AddStaff