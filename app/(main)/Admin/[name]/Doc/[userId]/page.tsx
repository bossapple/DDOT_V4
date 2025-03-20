'use client'

import React, { useState, useEffect, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

import { GraphQLClientConnector } from '@/app/lib/API';
import { useMutation, gql } from '@apollo/client'
import dayjs from 'dayjs';
import 'dayjs/locale/th'

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
} from "@mui/material";

import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ButtonCompo from "@/components/shared/button";
import { ProvinceType, AmphureType, TambonType } from '@/app/register/page'

interface EditDcotorType {
  CID: string
  Firstname: string
  Gender: string
  Lastname: string
  amphoe: string | number
  dob: Date | string
  email: string
  homeAddress: string
  province: string | number
  tambon: string | number
  telephone: string
  useRole: string
}

function EditDoctorId({ params } : { params: { userId: string, name: string } }) {

  const GET_DOCTOR  = gql`
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
  const UPDATE_DOCTOR = gql`
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
  `;

  const router = useRouter()

  const [editDoctor, setEditDcotor] = useState<EditDcotorType[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const [provinces, setProvinces] = useState<ProvinceType[]>([])
  const [amphoes, setAmphoes] = useState<AmphureType[]>([])
  const [tambons, setTambons] = useState<TambonType[]>([])

  const graphQLClient = GraphQLClientConnector();

  const [updateDoctor] = useMutation(UPDATE_DOCTOR)

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

        const getData = await graphQLClient.request<{ Userinfo: EditDcotorType[] }>(
          GET_DOCTOR, {
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

        setEditDcotor(patientData);

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
        const getData = await graphQLClient.request<{ Userinfo: EditDcotorType[] }>(
          GET_DOCTOR, {
            cid: `${params.userId}`
          }
        )
        setEditDcotor(getData.Userinfo)
        
      } catch(error: any) {
        console.log(`Failed to fetch data: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleClickOpen = () => {
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target
    setEditDcotor((prevDoc) => [
      {
        ...prevDoc[0],
        [name]: value
      },
    ])
  }

  
  const handleOnChangeProvince = (propertyName: string, value: string | number) => {
    setEditDcotor((prevDoctor) => {
      const updatedPatient: EditDcotorType = { ...prevDoctor[0] };
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

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setEditDcotor((prevDoc) => [
      {
        ...prevDoc[0],
        [name]: value,
      },
      ...prevDoc.slice(1),
    ]);
  };

  const handleDateChange = (date: Date | null | undefined) => {
    setEditDcotor((prevDoc) => [
      {
        ...prevDoc[0],
        dob: date ? dayjs(date).format("YYYY-MM-DDTHH:mm:ss.SSSZ") : "",
      },
    ])
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

  const handleUpdateDoctor = async ():Promise<void> => {
    try {
      const cid = editDoctor[0]?.CID
      const finalProvince = convertProvice(editDoctor[0]?.province as number) as string;
      const finalAmphoe = convertAmphure(editDoctor[0]?.amphoe as number) as string;
      const finalTambon = convertTambon(editDoctor[0]?.tambon as number) as string;

      if(cid === undefined) {
        console.log('CID is undefined. Cannot update user')
        return
      }

      const { data, errors } = await updateDoctor({
        variables: {
          cid: cid,
          edits: {
            Firstname: editDoctor[0]?.Firstname,
            Lastname: editDoctor[0]?.Lastname,
            Gender: editDoctor[0]?.Gender,
            dob: editDoctor[0]?.dob,
            telephone: editDoctor[0]?.telephone,
            homeAddress: editDoctor[0]?.homeAddress,
            email: editDoctor[0]?.email,
            tambon: finalTambon,
            amphoe: finalAmphoe,
            province: finalProvince,
          }
        }
      })
      if(errors) {
        console.log("GraphQL errors:", errors);
        setOpenDialog(false);
        setAlertMessage("เกิดข้อผิดพลากในการแก้ไขข้อมูลจากหลังบ้าน");
        setOpenAlert(true)
      } else {
        setOpenDialog(false);
        setOpenAlert(true);
        setAlertMessage("แก้ไขข้อมูลหมอสำเร็จ");
        setTimeout(() => {
          router.push(`/Admin/${params.name}/Doc`)
        }, 600);
      }
    } catch(error: any) {
      console.log(`Failed to update user ${error.message}`)
    }
  }

  return (
    <Paper
      sx={{
        minHeight: "90vh",
        padding: "28px",
        maxWidth: "1080px", 
      }}
    >
      {loading ?  (
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
            // onClose={handleClose}
          >
            <Alert severity={alertMessage ? "success" : "error"}>
              {alertMessage || "Success"}
            </Alert>
          </Snackbar>
          <Typography variant="h5">แก้ไขข้อมูลหมอ</Typography>
          <Grid container spacing={2} mt={3}>
          <Grid item xs={12} md={6}>
              <Typography mb={1}>เลขบัตรประจำตัวประชาชน</Typography>
              <TextField
                variant="outlined"
                name="CID"
                // label='ใส่เลขบัตรประจำตัวประชาชน 13 หลัก'
                fullWidth
                value={editDoctor[0]?.CID || ""}
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
                value={editDoctor[0]?.email || ""}
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
                value={editDoctor[0]?.Firstname || ""}
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
                value={editDoctor[0]?.Lastname || ""}
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
                  value={`${editDoctor[0]?.Gender}` || ""}
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
                    value={dayjs(editDoctor[0]?.dob) || ""}
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
                value={editDoctor[0]?.telephone || ""}
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
                value={editDoctor[0]?.homeAddress || ""}
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
                  label='จังหวัด' 
                  value={editDoctor[0]?.province || ""}
                  onChange={(event) => handleOnChangeProvince(event.target.name, event.target.value)}
                  name='province'
                >
                  {provinces
                    .sort((a,b) => a.name_th.localeCompare(b.name_th))
                    .map(province => (
                    <MenuItem key={province.id} value={province?.id}>
                      {province?.name_th}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography mb={1}>อำเภอ</Typography>
              <FormControl fullWidth>
                <InputLabel>อำเภอ</InputLabel>
                <Select 
                  label="อำเภอ" 
                  value={`${editDoctor[0]?.amphoe}` || ""}
                  name='amphoe'
                  onChange={(event) => handleOnChangeProvince(event.target.name, event.target.value)}
                >
                  {amphoes
                    .filter((amphoe) => amphoe.province_id === editDoctor[0]?.province)
                    .map(amphoe => (
                      <MenuItem key={amphoe?.id} value={amphoe?.id}>
                        {amphoe?.name_th}
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
                  value={`${editDoctor[0]?.tambon}` || ""}
                  name='tambon'
                  onChange={(event) => handleOnChangeProvince(event.target.name, event.target.value)}
                >
                  {tambons
                    .filter(tambon => tambon?.amphure_id === editDoctor[0]?.amphoe)
                    .map(tambon => (
                      <MenuItem key={tambon?.id} value={tambon?.id}>
                        {tambon?.name_th}
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
                onClick={handleUpdateDoctor}
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
      )}
    </Paper>
  )  
}

export default EditDoctorId

// --------------- V2 code ---------------
//   <>
//   <div className="content">
//     <header>
//       <div id="header-text">
//         <h1 id="header-text-char">d-DOT 2022 by MUICT</h1>
//         <div className="search-container">
//           <form>
//             <input type="text" placeholder="ค้นหาการตั้งค่า..." />
//             <button type="submit">Search</button>
//             <button type="reset">Clear</button>
//           </form>
//         </div>
//       </div>
//     </header>
//     {/* Sidebar */}
//     <div className="sidebar">
//       <h2>Admin</h2>
//       <p>Administrator</p>
//       <form action="C:\Users\Pillbox2022\Desktop\NewWeb\Login\1login.html">
//         <button >ออกจากระบบ</button>
//       </form>
//       <br />
//       <br />
//       <form action="C:\Users\Pillbox2022\Desktop\NewWeb\AdminAllObserverPage\AdminAllOBSPage.html">
//         <button >ข้อมูลเจ้าหน้าที่ทั้งหมด</button>
//       </form>
//       <br />
//       <br />
//       <form action="C:\Users\Pillbox2022\Desktop\NewWeb\AdminAllDoctorPage\AdminAllDoctorPage.html">
//         <button >ข้อมูลหมอทั้งหมด</button>
//       </form>
//       <br />
//       <br />
//       <form action="C:\Users\Pillbox2022\Desktop\NewWeb\AdminAllPatientPage\AdminAllPatientPage.html">
//         <button >ข้อมูลคนไข้ทั้งหมด</button>
//       </form>
//       <br />
//       <br />
//       <form action="C:\Users\Pillbox2022\Desktop\NewWeb\Admin\AdminMainPage.html">
//         <button >กลับหน้าหลัก</button>
//       </form>
//     </div>
//     {/* add more content here */}
//     <div className="Block-body">
//       <h2>รายชื่อเจ้าหน้าที่ทั้งหมด</h2>
//       <table style={{ width: "100%" }}>
//         <tbody>
//           <tr>
//             <th>CID</th>
//             <th>ชื่อ</th>
//             <th>นามสกุล</th>
//             <th>เพศ</th>
//             <th>วันเกิด</th>
//             <th>เบอร์โทรศัพท์</th>
//             <th>ตำบล</th>
//             <th>อำเภอ</th>
//             <th>จังหวัด</th>
//             <th>ที่อยู่</th>
//             <th>อีเมล</th>
//           </tr>
//           <tr>
//             <td>1103702461958</td>
//             <td>จอนนี่</td>
//             <td>อิงลิช</td>
//             <td>ชาย</td>
//             <td>1975-08-15</td>
//             <td>0841001761</td>
//             <td>บ้านใหม่</td>
//             <td>ปากเกร็ด</td>
//             <td>นนทบุรี</td>
//             <td>1/2 หมู่ 3</td>
//             <td>email</td>
//           </tr>
//         </tbody>
//       </table>
//     </div>
//   </div>
// </>