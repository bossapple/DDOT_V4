"use client";

import { useState, useEffect } from 'react'
import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie';

import {
  Typography,
  TextField,
  Box,
  Grid,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  Snackbar,
  Alert,
} from "@mui/material";

import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { GraphQLClientConnector } from '../lib/API';

export interface UserRegisterType {
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

export interface ProvinceType {
  id: number;
  name_th: string;
  name_en: string
  geography_id: number
  created_at: string
  updated_at: string
  deleted_at: null
}

export interface AmphureType {
  id: number;
  name_th: string;
  name_en: string;
  province_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
}

export interface TambonType {
  id: number;
  zip_code: number;
  name_th: string;
  name_en: string;
  amphure_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
}

export interface LocalHospitalType {
  localHospitalNumber: string
  localHospitalname: string
  tambon: string
  amphoe: string
  province: string
}

function RegisterPage() {
  const graphQLClient = GraphQLClientConnector()
  const router = useRouter()

  const [provinces, setProvinces] = useState<ProvinceType[]>([]);
  const [amphures, setAmphures] = useState<AmphureType[]>([]);
  const [tambons, setTambons] = useState<TambonType[]>([]);
  const [localHospitals, setLocalHospital] = useState<LocalHospitalType[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  const [userRegister, setUserRegister] = useState<UserRegisterType>({
    userRole: '',
    localHospitalNumber: '',
    username: '',
    CID: '',
    password: '',
    confirmPassword: '',
    telephone: '',
    Gender: '',
    dob: '',
    email: '',
    homeAddress: '',
    province: '',
    tambon: '',
    amphoe: '',
    Firstname: '',
    Lastname: '',
    createdBy: '6288081628808',
  })

  const [error, setError] = useState<Record<keyof UserRegisterType, boolean>>({
    userRole: false,
    localHospitalNumber: false,
    username: false,
    CID: false,
    password: false,
    confirmPassword: false,
    telephone: false,
    Gender: false,
    dob: false,
    email: false,
    homeAddress: false,
    province: false,
    amphoe: false,
    tambon: false,
    createdBy: true,
    Firstname: false,
    Lastname: false
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

  const CREATE_USER = gql`
    mutation Mutation($userInfo: UserAccountInput!, $localHospitalNumber: String!) {
      createUser(userInfo: $userInfo, localHospitalNumber: $localHospitalNumber) {
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
        password
        username
      }
    }
  `
  const [createUser] = useMutation(CREATE_USER)

  const handleCreateUser = async (): Promise<void> => {
    const isValid = validateFields()
    if(isValid) {
      const finalProvince = convertProvice(userRegister.province as number) as string;
      const finalAmphure = convertAmphure(userRegister.amphoe as number) as string;
      const finalTambon = convertTambon(userRegister.tambon as number) as string;
  
      try {
        const { data, errors } = await createUser({
          variables: {
            userInfo: {
              CID: userRegister.CID,
              Firstname: userRegister.Firstname,
              Lastname: userRegister.Lastname,
              Gender: userRegister.Gender,
              dob: userRegister.dob,
              telephone: userRegister.telephone,
              password: userRegister.password,
              tambon: finalTambon,
              amphoe: finalAmphure,
              province: finalProvince,
              homeAddress: userRegister.homeAddress,
              email: userRegister.email,
              userRole: userRegister.userRole,
              createdBy: userRegister.createdBy,
              username: userRegister.username,
            },
            localHospitalNumber: userRegister.localHospitalNumber,
          },
        });

        if (errors) {
          console.log('Failed to create user: ', errors);
          setAlertMessage('ล้มเหลวในการสร้างบัญชี')
          setOpenDialog(false)
          setOpenAlert(true)
        } else  {
          setAlertMessage('สร้างบัญชีสำเร็จ')
          setOpenDialog(false)
          setOpenAlert(true)
          setTimeout(() => {
            router.push('/')
          }, 600)
        }
      } catch (error) {
        console.log('Error during user creation:', error);
      }
    }
  };

  useEffect(() => {
    const fetData = async () => {
      try {
        const getData = await graphQLClient.request<{ LocalHospital: LocalHospitalType[] }>(GET_HOSPITALS)
        setLocalHospital(getData.LocalHospital)
      } catch (error: any) {
        console.log(`Failed to fetch local localHospitalNumber ${error}`)
      }
    }
    fetData()
    Cookies.remove('user', { path: '/'} )
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
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
      }
    }
    fetchData()
  }, [])

  const handleChange = (propertyName: string, value: string | UserRegisterType | number) => {
    setUserRegister((prevUserRegister) => ({
      ...prevUserRegister,
      [propertyName]: value
    }))

    setError((prevError) => ({
      ...prevError,
      [propertyName]: false
    }))

    if (propertyName === 'confirmPassword' && userRegister.password !== value) {
      setError((prevError) => ({
        ...prevError,
        confirmPassword: true
      }))
    }

    if (propertyName === 'email') {
      const isValidEmail = validateEmail(value as string)
      setError((prevError) => ({
        ...prevError,
        email: !isValidEmail
      }))
    }
  }

  const validateFields = () => {
    let isValid = true;
  
    for (const key in userRegister) {
      if (!userRegister[key as keyof UserRegisterType] || userRegister[key as keyof UserRegisterType] === null) {
        setError((prevError) => ({
          ...prevError,
          [key]: true,
        }));
        isValid = false;
      }
    }
  
    if (userRegister.confirmPassword !== userRegister.password) {
      setError((prevError) => ({
        ...prevError,
        confirmPassword: true,
      }));
      isValid = false;
    }
  
    if (userRegister.dob === null) {
      setError((prevError) => ({
        ...prevError,
        dob: true,
      }));
      isValid = false;
    }
  
    return isValid;
  };  

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return emailRegex.test(email)
  }

  const handleDateChange = (propertyName: string, date: Date | null) => {
    const formattedDate = date ? date.toISOString() : ''
    handleChange(propertyName, formattedDate)
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

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenDialog(false);
    setOpenAlert(false);
  };

  const handleCancel = () => {
    router.push('/login')
  }

  return (
    <> 
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={openAlert}
        autoHideDuration={5000}
        onClose={handleClose}
      >
        <Alert severity={alertMessage ? 'success' : 'error'}>
          {alertMessage}
        </Alert>
      </Snackbar>
      <Box sx={{ padding: "30px 40px", backgroundColor: "#F4F5FA" }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={12} sx={{ textAlign: "center" }}>
            <Typography variant="h4">สร้างบัญชี</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>ตำแหน่ง</Typography>
            <FormControl fullWidth required>
              <InputLabel>กรุณาเลือกตำแหน่ง</InputLabel>
              <Select
                value={userRegister.userRole}
                name='userRole'
                label="กรุณาเลือกตำแหน่ง"
                onChange={(event) => handleChange(event.target.name, event.target.value as string)}
                error={error.userRole}
              >
                <MenuItem value={"ADMIN"}>Admin</MenuItem>
                <MenuItem value={"HOSPITAL"}>Doctor</MenuItem>
              </Select>
              {error.userRole && <FormHelperText sx={{ visibility: 'visible', color: 'red' }}>กรุณาเลือกตำแหน่ง</FormHelperText>}
              {!error.userRole && <FormHelperText sx={{ visibility: 'hidden' }}> </FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>สังกัดโรงพญาบาล</Typography>
            <FormControl fullWidth required>
              <InputLabel>กรุณาเลือกโรงพญาบาล</InputLabel>
              <Select
                value={userRegister.localHospitalNumber}
                name='localHospitalNumber'
                label='กรุณาเลือกโรงพญาบาล'
                error={error.localHospitalNumber}
                onChange={(event) => handleChange(event.target.name, event.target.value)}
              >
                {localHospitals
                  .map((localHospital) => (
                    <MenuItem key={localHospital.localHospitalNumber} value={localHospital.localHospitalNumber}>
                      {localHospital.localHospitalname}
                    </MenuItem>
                  ))
                }
              </Select>
              {error.localHospitalNumber && <FormHelperText sx={{ visibility: 'visible', color: 'red' }}>กรุณาเลือกโรงพญาบาล</FormHelperText>}
              {!error.localHospitalNumber && <FormHelperText sx={{ visibility: 'hidden' }}> </FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>ชื่อจริง</Typography>
            <TextField
              required
              value={userRegister.Firstname}
              name='Firstname'
              fullWidth
              error={error.Firstname}
              helperText={error.Firstname ? 'กรุณากรอกชื่อจริง' : ' '}
              onChange={(event) => handleChange(event.target.name, event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>นามสกุล</Typography>
            <TextField
              required
              value={userRegister.Lastname}
              name='Lastname'
              fullWidth
              error={error.Lastname}
              helperText={error.Lastname ? 'กรุณากรอกนามสกุล' : ' '}
              onChange={(event) => handleChange(event.target.name, event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>ชื่อผู้ใช้</Typography>
            <TextField
              required
              value={userRegister.username}
              name='username'
              onChange={(event) => handleChange(event.target.name, event.target.value)}
              variant="outlined"
              fullWidth
              error={error.username}
              helperText={error.username ? 'กรุณากรอกชื่อ' : ' '}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>เลขบัตรประชาชน</Typography>
            <TextField
              required
              value={userRegister.CID}
              name='CID'
              variant="outlined"
              fullWidth
              type='number'
              onInput={(event) => {
                const inputValue = (event.target as HTMLInputElement).value;
                const sanitizedValue = Math.max(0, parseInt(inputValue, 10)).toString().slice(0, 13);
                (event.target as HTMLInputElement).value = sanitizedValue;
              }}
              onChange={(event) => handleChange(event.target.name, event.target.value)}
              error={error.CID}
              helperText={error.CID ? 'กรุณากรอกบัตรประชาชน' : ' '}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>รหัสผ่าน</Typography>
            <TextField
              value={userRegister.password}
              name='password'
              variant="outlined"
              fullWidth
              type='password'
              onChange={(event) => handleChange(event.target.name, event.target.value)}
              error={error.password}
              helperText={error.password ? 'กรุณากรอกรหัสผ่าน' : ' '}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>ยืนยันรหัสผ่าน</Typography>
            <TextField
              value={userRegister.confirmPassword}
              name='confirmPassword'
              variant="outlined"
              fullWidth
              type='password'
              onChange={(event) => handleChange(event.target.name, event.target.value)}
              error={error.confirmPassword}
              helperText={error.confirmPassword ? 'กรุณากรอกรหัสผ่านให้ตรงกัน' : ' '}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography mb={1}>เบอร์โทรศัพท์</Typography>
            <TextField
              value={userRegister.telephone}
              name='telephone'
              variant="outlined"
              fullWidth
              type='number'
              onChange={(event) => handleChange(event.target.name, event.target.value)}
              error={error.telephone}
              helperText={error.telephone ? 'กรุณากรอกเบอร์โทรศัพท์' : ' '}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography mb={1}>เลือกเพศ</Typography>
            <FormControl fullWidth>
              <InputLabel>กรุณาเลือกเพศ</InputLabel>
              <Select
                value={userRegister.Gender}
                name='Gender'
                label="กรุณาเลือกเพศ"
                onChange={(event) => handleChange(event.target.name, event.target.value)}
                error={error.Gender}
              >
                <MenuItem value={'ชาย'}>ชาย</MenuItem>
                <MenuItem value={'หญิง'}>หญิง</MenuItem>
                <MenuItem value={'อื่นๆ'}>อื่นๆ</MenuItem>
              </Select>
              {error.Gender && <FormHelperText sx={{ visibility: 'visible', color: 'red' }}>กรุณาเลือกเพศ</FormHelperText>}
              {!error.Gender && <FormHelperText sx={{ visibility: 'hidden' }}> </FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography>เลือกวันเกิด</Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DemoContainer components={['DatePicker']} >
                <DatePicker
                  sx={{ width: '100%' }}
                  value={userRegister.dob}
                  name='dob'
                  onChange={(date) => handleDateChange('dob', date as Date)}
                  disableFuture={userRegister.dob === null}
                />
                {error.dob && (
                  <FormHelperText
                    sx={{
                      visibility: error.dob ? 'visible' : 'hidden',
                      color: 'red',
                      position: 'absolute',
                    }}
                  >
                    กรุณาระบุวันเกิด
                  </FormHelperText>
                )}
              </DemoContainer>
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>อีเมล</Typography>
            <TextField
              value={userRegister.email}
              name='email'
              variant="outlined"
              fullWidth
              onChange={(event) => handleChange(event.target.name, event.target.value)}
              error={error.email}
              helperText={error.email ? 'อีเมลไม่ถูกต้อง' : ' '}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>จังหวัด</Typography>
            <FormControl fullWidth>
              <InputLabel>กรุณาเลือกจังหวัด</InputLabel>
              <Select
                name='province'
                label='กรุณาเลือกจังหวัด'
                value={userRegister.province}
                onChange={(event) => handleChange(event.target.name, event.target.value)}
                error={error.province}
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
              {error.province && <FormHelperText sx={{ visibility: 'visible', color: 'red' }}>กรุณาเลือกจังหวัด</FormHelperText>}
              {!error.province && <FormHelperText sx={{ visibility: 'hidden' }}> </FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>อำเภอ</Typography>
            <FormControl fullWidth>
              <InputLabel>กรุณาเลือกอำเภอ</InputLabel>
              <Select
                name='amphoe'
                label='กรุณาเลือกอำเภอ'
                disabled={userRegister.province === ''}
                onChange={(event) => handleChange(event.target.name, event.target.value)}
                value={userRegister.amphoe}
                error={error.amphoe}
              >
                {amphures
                  .filter((amphoe) => userRegister.province === amphoe.province_id)
                  .sort((a_name, b_name) => a_name.name_th.localeCompare(b_name.name_th))
                  .map((amphoe) => (
                    <MenuItem key={amphoe.id} value={amphoe.id}>
                      {amphoe.name_th}
                    </MenuItem>
                  ))
                }
              </Select>
              {error.amphoe && <FormHelperText sx={{ visibility: 'visible', color: 'red' }}>กรุณาเลือกอำเภอ</FormHelperText>}
              {!error.amphoe && <FormHelperText sx={{ visibility: 'hidden' }}> </FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography mb={1}>ตำบล</Typography>
            <FormControl fullWidth>
              <InputLabel>กรุณาเลือกตำบล</InputLabel>
              <Select
                name='tambon'
                label='กรุณาเลือกตำบล'
                disabled={userRegister.amphoe === ''}
                onChange={(event) => handleChange(event.target.name, event.target.value)}
                value={userRegister.tambon}
                error={error.tambon}
              >
                {tambons
                  .filter((tambon) => userRegister.amphoe === tambon.amphure_id)
                  .sort((a_name, b_name) => a_name.name_th.localeCompare(b_name.name_th))
                  .map((tambon) => (
                    <MenuItem key={tambon.id} value={tambon.id}>
                      {tambon.name_th}
                    </MenuItem>
                  ))
                }
              </Select>
              {error.tambon && <FormHelperText sx={{ visibility: 'visible', color: 'red' }}>กรุณาเลือกตำบล</FormHelperText>}
              {!error.tambon && <FormHelperText sx={{ visibility: 'hidden' }}> </FormHelperText>}
            </FormControl>
          </Grid>
          <Grid item xs={12} md={12}>
            <Typography mb={1}>ที่อยู่</Typography>
            <TextField
              variant="outlined"
              name='homeAddress'
              fullWidth
              value={userRegister.homeAddress}
              onChange={(event) => handleChange(event.target.name, event.target.value)}
              error={error.homeAddress}
            />
            {error.homeAddress && <FormHelperText sx={{ visibility: 'visible', color: 'red' }}>กรุณาระบุที่อยู่</FormHelperText>}
            {!error.homeAddress && <FormHelperText sx={{ visibility: 'hidden' }}> </FormHelperText>}
          </Grid>
        </Grid>
        <Grid container sx={{ display: "flex", marginTop: "30px" }} spacing={3}>
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              textAlign: "end",
              marginBottom: 2,
            }}
          >
            <Button
              type='submit'
              variant="contained"
              sx={{ padding: "12px 44px" }}
              onClick={handleOpenDialog}
            >
              บันทึก
            </Button>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: "start" }} onClick={handleCancel}>
            <Button
              variant="outlined"
              sx={{ padding: "12px 44px" }}
            >
              ยกเลิก
            </Button>
          </Grid>
        </Grid>
        <Dialog
          open={openDialog}
        >
          <DialogTitle>คุณต้องการสร้างบัญชีคนนี้หรือไม่</DialogTitle>
          <Box
            sx={{
              display: "flex",
              paddingLeft: "24px",
              paddingBottom: "20px",
            }}
          >
            <Button variant='contained' onClick={handleCreateUser}>
            ยืนยัน
            </Button>
            <Button
              sx={{
                marginLeft: "12px",
              }}
              variant='outlined'
              onClick={handleClose}
            >
              ยกเลิก
            </Button>
          </Box>
        </Dialog>
      </Box>
    </>
  );
}

export default RegisterPage;
