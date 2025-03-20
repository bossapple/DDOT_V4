"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { GraphQLClientConnector } from "@/app/lib/API";
import { useMutation, gql } from "@apollo/client";
import dayjs from "dayjs";
import "dayjs/locale/th";

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

interface EditAdminType {
  CID?: string;
  Firstname: string;
  Gender: string;
  Lastname: string;
  amphoe: string | number;
  dob: Date | string;
  email: string;
  homeAddress: string;
  province: string | number;
  tambon: string | number;
  telephone: string;
  userRole: string;
}

function EditAdminId({ params }: { params: { userId: string, name: string } }) {
  const GET_USER = gql`
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
  `;

  const UPDATE_USER = gql`
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
  const router = useRouter();
 
  const [editAdmin, setEditAdmin] = useState<EditAdminType[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [updateUser] = useMutation(UPDATE_USER);

  const graphQLClient = GraphQLClientConnector();

  const [provinces, setProvinces] = useState<ProvinceType[]>([])
  const [amphoes, setAmphoes] = useState<AmphureType[]>([])
  const [tambons, setTambons] = useState<TambonType[]>([])

  const GET_USERINFO = gql`
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

  const handleClickOpen = () => {
    setOpenDialog(true);
  };

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenDialog(false);
    setOpenAlert(false);
    router.push(`/Admin/${params.name}/Main`);
  };

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

        const getData = await graphQLClient.request<{ Userinfo: EditAdminType[] }>(
          GET_USERINFO, {
          cid: params.userId
        }
        )
        
        console.log("Fetched Data:", getData);



        let adminData = getData.Userinfo

        const formattedData = adminData.map((prevAdmin) => ({
          ...prevAdmin,
          province: provinceData.find((provinceId: any) => provinceId.name_th === prevAdmin.province)?.id || null,
          amphoe: amphoeData.find((amphoeId: any) => amphoeId.name_th === prevAdmin.amphoe)?.id || null,
          tambon: tambonData.find((tambonId: any) => tambonId.name_th === prevAdmin.tambon)?.id || null
        }))

        adminData = formattedData

        setEditAdmin(adminData);

      } catch (error: any) {
        console.log(`Failed to fetch patient data: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.userId])


  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditAdmin((prevEdits) => [
      {
        ...prevEdits[0],
        [name]: value,
      },
      ...prevEdits.slice(1),
    ]);
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setEditAdmin((prevEdits) => [
      {
        ...prevEdits[0],
        [name]: value,
      },
      ...prevEdits.slice(1),
    ]);
  };

  const handleDateChange = (date: Date | null | undefined) => {
    setEditAdmin((prevEdits) => [
      {
        ...prevEdits[0],
        dob: date ? dayjs(date).format("YYYY-MM-DDTHH:mm:ss.SSSZ") : "",
      },
      ...prevEdits.slice(1),
    ]);
  };

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

  const handleUpdateUser = async (): Promise<void> => {
    try {
      const cid = editAdmin[0]?.CID;
      const finalProvince = convertProvice(editAdmin[0]?.province as number) as string;
      const finalAmphoe = convertAmphure(editAdmin[0]?.amphoe as number) as string;
      const finalTambon = convertTambon(editAdmin[0]?.tambon as number) as string;

      if (cid === undefined) {
        console.log("CID is undefined. Cannot update user.");
        return;
      }

      const { data, errors } = await updateUser({
        variables: {
          cid: cid,
          edits: {
            Firstname: editAdmin[0]?.Firstname,
            Lastname: editAdmin[0]?.Lastname,
            Gender: editAdmin[0]?.Gender,
            dob: editAdmin[0]?.dob,
            telephone: editAdmin[0]?.telephone,
            homeAddress: editAdmin[0]?.homeAddress,
            email: editAdmin[0]?.email,
            tambon: finalTambon,
            amphoe: finalAmphoe,
            province: finalProvince,
          },
        },
      });

      if (errors) {
        console.log("GraphQL errors:", errors);
        setOpenDialog(false);
        setAlertMessage("เกิดข้อผิดพลากในการแก้ไขข้อมูลจากหลังบ้าน");
        setOpenAlert(true)
      } else {
        setOpenDialog(false);
        setOpenAlert(true);
        setAlertMessage("แก้ไขข้อมูลเจ้าหน้าที่สำเร็จ");
        setTimeout(() => {
          router.push(`/Admin/${params.name}/Main`);
        }, 600)
      }
    } catch (error: any) {
      console.log("Failed to update user data: ", error);
      setAlertMessage("เกิดข้อผิดพลากในการแก้ไขข้อมูล");
    }
  };

  const handleOnChangeProvince = (propertyName: string, value: string | number) => {
    setEditAdmin((prevObserver) => {
      const updatedAdmin: EditAdminType = { ...prevObserver[0] };
      if (propertyName === 'province') {
        updatedAdmin['province'] = value;
      } else if (propertyName === 'amphoe') {
        updatedAdmin['amphoe'] = value
      } else if (propertyName === 'tambon') {
        updatedAdmin['tambon'] = value
      }
      return [updatedAdmin];
    });
  }

  return (
    <Paper
      sx={{
        minHeight: "90vh",
        padding: "28px",
        maxWidth: "1080px",
      }}
    >
      {loading ? (
        <Box sx={{
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
            onClose={handleClose}
          >
            <Alert severity={alertMessage ? "success" : "error"}>
              {alertMessage || "Success"}
            </Alert>
          </Snackbar>
          <Typography variant="h5">แก้ไขข้อมูลเจ้าหน้าที่</Typography>
          <Grid container spacing={2} mt={3}>
            <Grid item xs={12} md={6}>
              <Typography mb={1}>เลขบัตรประจำตัวประชาชน</Typography>
              <TextField
                variant="outlined"
                name="CID"
                // label='ใส่เลขบัตรประจำตัวประชาชน 13 หลัก'
                fullWidth
                value={editAdmin[0]?.CID || ""}
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
                value={editAdmin[0]?.email || ""}
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
                value={editAdmin[0]?.Firstname || ""}
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
                value={editAdmin[0]?.Lastname || ""}
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
                  value={`${editAdmin[0]?.Gender}` || ""}
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
                    value={dayjs(editAdmin[0]?.dob) || ""}
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
                value={editAdmin[0]?.telephone || ""}
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
                value={editAdmin[0]?.homeAddress || ""}
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
                  value={editAdmin[0]?.province || ""}
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
                  value={`${editAdmin[0]?.amphoe}` || ""}
                  name='amphoe'
                  onChange={(event) => handleOnChangeProvince(event.target.name, event.target.value)}
                >
                  {amphoes
                    .filter((amphoe) => amphoe.province_id === editAdmin[0]?.province)
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
                  value={`${editAdmin[0]?.tambon}` || ""}
                  name='tambon'
                  onChange={(event) => handleOnChangeProvince(event.target.name, event.target.value)}
                >
                  {tambons
                    .filter(tambon => tambon?.amphure_id === editAdmin[0]?.amphoe)
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
              <ButtonCompo handleClickOpen={handleClickOpen} />
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
              <Button variant="contained" onClick={handleUpdateUser}>
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
  );
}

export default EditAdminId;
