"use client";

import React, { useState } from "react";

import { Grid, Box, TextField, Typography, Snackbar, Alert } from "@mui/material";

import Button from "@mui/material/Button";

import { useRouter } from "next/navigation";
import { useMutation, gql } from "@apollo/client";

import { getDynamicAdmin } from "../constants/admin/admin";
import { getDynamicObserver } from "../constants/observer/observer";
import { getDynamicDoctor } from "../constants/doctor/doctor";
import { setLoginStatus } from "@/middleware";

import Cookies from "js-cookie";

interface UserLoginType {
  username: string
  passwordHased: string
}

interface RouteType {
  imgURL: string;
  imgClickURL?: string;
  label: string;
  route: string;
}

const LOGIN_MUTATION = gql`
  mutation Mutation($input: LoginInput) {
    loginUser(input: $input) {
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

function Login() {

  const [userLogin, setUserLogin] = useState<UserLoginType>({
    username: '',
    passwordHased: '',
  })

  const [openAlert, setOpenAlert] = useState(false)

  const router = useRouter();

  const routerUserRole = (userRole: string, CID: string, updatedRoute: RouteType[]) => {
    switch (userRole) {
      case ('ADMIN'): {
        const adminRoute = updatedRoute.find((item) => (item.label === 'หน้าหลัก'))
        if (adminRoute && CID) {
          router.push(adminRoute.route.replace('undefined', CID));
        }
      }
      case ('OBSERVER'): {
        const observerRoute = updatedRoute.find((item) => item.label === 'คนไข้ภายใต้การดูแล')
        if (observerRoute && CID) {
          router.push(observerRoute.route.replace('undefined', CID))
        }
      }
      case ('HOSPITAL'): {
        const hospitalRoute = updatedRoute.find((item) => item.label === 'หน้าหลัก')
        if (hospitalRoute && CID) {
          router.push(hospitalRoute.route.replace('undefined', CID))
        }
      }
    }
  }

  const [loginUser] = useMutation(LOGIN_MUTATION)

  const handleOnChange = (name: string, value: string) => {
    setUserLogin((prevLogin) => ({
      ...prevLogin,
      [name]: value
    }))
  }

  const handleLogin = async () => {
    try {
      const data = await loginUser({
        variables: {
          input: userLogin
        }
      })
      setLoginStatus(true)
      Cookies.set('user', JSON.stringify(userLogin))
      if (data && data.data.loginUser) {
        const getLoginData = data.data.loginUser
        if (getLoginData.userRole === 'ADMIN') {
          const updateRouteAdmin = getDynamicAdmin(getLoginData.CID)
          routerUserRole(getLoginData.userRole, getLoginData.CID, updateRouteAdmin)
        } else if (getLoginData.userRole === 'OBSERVER') {
          const updateRouteObserver = getDynamicObserver(getLoginData.CID)
          routerUserRole(getLoginData.userRole, getLoginData.CID, updateRouteObserver)
        } else if (getLoginData.userRole === 'HOSPITAL') {
          const updateRouteDoctor = getDynamicDoctor(getLoginData.CID)
          routerUserRole(getLoginData.userRole, getLoginData.CID, updateRouteDoctor)
        }
        else {
          setOpenAlert(true)
        }
      }

    } catch (error: any) {
      setOpenAlert(true)
      console.log(`Failed to login: ${error.message}`)
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: '68px'
      }}
    >
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={openAlert}
        autoHideDuration={7000}
      >
        <Alert severity="error">
          username หรือ password ไม่ถูกต้อง
        </Alert>
      </Snackbar>
      <Grid
        container
        sx={{
          boxShadow: 3,
          borderRadius: "32px",
          maxWidth: 1300,
        }}
      >
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            background: "#559CFF",
            borderTopLeftRadius: "32px",
            borderBottomLeftRadius: "32px",
            padding: "24px",
            textAlign: "center",
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography variant="h3" fontWeight="bold" color="#fff">
            D-DOT 2024 <br />
            by MUICT
          </Typography>
          <Typography variant="h5" mt={2} color="#fff">
            สร้างบัญชีเพื่อเข้าใช้ระบบ
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            background: "#fff",
            borderTopRightRadius: "32px",
            borderBottomRightRadius: "32px",
            padding: "64px",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" fontWeight="bold">
              ลงชื่อเพื่อเข้าใช้
            </Typography>
            <Typography variant="h6" mb={4}>
              Hello! Let&lsquo;s get started
            </Typography>
          </Box>
          <Grid item xs={12} md={12}>
            <Typography mb={1}>ลงชื่อผู้ใช้</Typography>
            <TextField
              variant="outlined"
              label="กรอกชื่อผู้ใช้/username"
              fullWidth
              name='username'
              value={userLogin?.username}
              onChange={(event) => handleOnChange(event.target.name, event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography mb={1} mt={2}>
              รหัสผ่าน
            </Typography>
            <TextField
              variant="outlined"
              label="กรอกรหัสผ่าน"
              fullWidth
              type="password"
              name='passwordHased'
              value={userLogin?.passwordHased}
              onChange={(event) => handleOnChange(event.target.name, event.target.value)}
            />
          </Grid>
          <Box sx={{ marginTop: '64px' }}>
            <Button
              variant="contained"
              fullWidth size="large"
              onClick={handleLogin}
            >
              เข้าสู่ระบบ{" "}
            </Button>
            <Box mt={2} />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Login;
