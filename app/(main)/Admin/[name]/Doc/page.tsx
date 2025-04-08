"use client";

import { GraphQLClientConnector } from '@/app/lib/API';
import React, { useEffect, useState } from 'react'
import "dayjs/locale/th";
import { useRouter, usePathname, useParams } from 'next/navigation'

import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  Alert,
  Snackbar,
  Button,
  Avatar,
  IconButton
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import SearchBar from '@/components/shared/searchBar';
import DataGridTable from '@/components/shared/dataGridTable';
import { UserInfoType } from '../Obs/page';
import { useMutation, gql } from '@apollo/client';
import { ADMIN_DATAGRID } from '@/app/constants/admin/adminDataGrid';

const graphQLClient = GraphQLClientConnector();

function DoctorPage() {

  const query = gql`
    query {
      Userinfo(Filter: "HOSPITAL") {
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
  const DELETE_DOCTOR = gql`
    mutation DeleteUser($deleteUserInput: deleteUserInput!) {
      deleteUser(deleteUserInput: $deleteUserInput) {
        Status
      }
    }
  `

  const GET_ADMIN_USERNAME = gql`
    query ExampleQuery($cid: String) {
      Userinfo(CID: $cid) {
        CID
        Firstname
        Lastname
      }
    }
  `
  const param = useParams()
  const router = useRouter()
  const pathname = usePathname()

  const [userInfo, setUserInfo] = useState<UserInfoType[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [confirmationData, setConfirmationData] = useState<{ CID: string; userRole: string } | null>(null);
  const [alertStatus, setAlertStatus] = useState<'success' | 'error'>('success')
  const [adminUsername, setAdminUsername] = useState<UserInfoType[]>([])
  const [deleteUser] = useMutation(DELETE_DOCTOR)

  useEffect(() => {
    const fetchData = async () => {
      if (!param?.name) {
        console.error("❌ No CID found in params!");
        return;
      }
  
      // ✅ Ensure `param.name` is always a clean string
      const cleanedCID = decodeURIComponent(
        Array.isArray(param.name) ? param.name[0] : param.name
      )
        .replace(/\s+/g, "") // Remove ALL spaces (leading, trailing, and middle)
        .trim();
  
      console.log("🚀 Cleaned Admin CID:", cleanedCID);
  
      try {
        setLoading(true);
  
        // 🔍 Fetch Doctor Data
        console.log("🔍 Fetching doctor data...");
        const getDoctorData = await graphQLClient.request<{ Userinfo: UserInfoType[] }>(
          query,
          { Filter: "HOSPITAL" }
        );
  
        let doctorData = getDoctorData.Userinfo;
  
        const formattedData: UserInfoType[] = doctorData.map((prevDoc) => ({
          ...prevDoc,
          dob: new Date(prevDoc.dob).toLocaleDateString('th-TH', {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          }),
        }));
  
        setUserInfo(formattedData);
        console.log("✅ Doctor data fetched:", formattedData);
  
        // 🔍 Fetch Admin Username
        console.log("🔍 Fetching admin username...");
        const getAdminUsername = await graphQLClient.request<{ Userinfo: UserInfoType[] }>(
          GET_ADMIN_USERNAME,
          { cid: cleanedCID }
        );
  
        setAdminUsername(getAdminUsername.Userinfo);
        console.log("✅ Admin Info Fetched:", getAdminUsername.Userinfo);
        
      } catch (error: any) {
        console.error("❌ Failed to fetch doctor or admin data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [param.name]); // ✅ Runs when `param.name` changes
  

  const handleOnEdit = (params: { row: { CID: string } }) => {
    router.push(`${pathname}/${params.row.CID}`)
  }

  const handleDelete = (params: { row: { CID: string, userRole: string } }) => {
    setConfirmationData(params.row)
    setOpenDialog(true)
  }

  const handleDeleteConfirmation = async (): Promise<void> => {
    try {
      if (!confirmationData) {
        console.log('Confirmation data is null')
        return
      }
      const { data, errors } = await deleteUser({
        variables: {
          deleteUserInput: {
            CID: confirmationData?.CID,
            userRole: confirmationData?.userRole,
          }
        }
      })
      if (errors) {
        console.log(`Failed to delete this observer ${errors}`);
        setAlertStatus('error')
      } else {
        console.log(`Deleted observer successfully: ${data?.deleteUser?.Status}`);
        setOpenAlert(true)
        setAlertStatus('success')
        console.log(`openAlert status: ${openAlert}`)
        setAlertStatus('success')
        setTimeout(() => {
          window.location.reload()
        }, 700)
      }
    } catch (error: any) {
      console.log(`Failed to delete user ${error}`)
    } finally {
      setConfirmationData(null);
      setOpenDialog(false);
      // setOpenAlert(false)
    }
  }

  const handleCancelDelete = (): void => {
    setOpenDialog(false);
  };
  // Handle avatar click to navigate to edit profile page
  const handleAvatarClick  = () => {
    // Navigate to the admin edit profile page with the userId
    const userId = adminUsername[0].CID;
    router.push(`${pathname}/${userId}`);
  };

  const formatThaiDateLong = (date: Date): string => {
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAdminName = () => {
    if (loading && adminUsername.length === 0) {
        return "กำลังโหลด..."; // Indicate loading specifically for the name
    }
    if (adminUsername.length > 0) {
      const admin = adminUsername[0];
      // Provide fallbacks for potentially missing names
      const firstName = admin.Firstname || "ไม่พบชื่อ";
      const lastName = admin.Lastname || "ไม่พบนามสกุล";
      return `${firstName} ${lastName}`;
    }
    return "ไม่พบข้อมูลผู้ใช้"; // Clearer message if fetch completed but no data
  };

  return (
    <>
    <Box
    sx={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      width: '100%',
      padding: '12px 24px',
      boxSizing: 'border-box',
    }}>
      <Typography variant="h6" color="text.primary">
        {formatThaiDateLong(new Date())}
      </Typography>
    </Box>
      <Box
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // Ensures profile button stays on the right
    marginBottom: "12px",
    width: "100%", // Ensures full width
  }}
>
  {/* Admin Name Section */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="h6" component="span">
        ชื่อผู้ใช้:
      </Typography>
      <Typography variant="h6" component="span" fontWeight="medium">
        {getAdminName()}
      </Typography>
    </Box>

  {/* Circular Profile Button */}
    <IconButton sx={{ bgcolor: "grey.300", width: 40, height: 40 } }onClick={handleAvatarClick}>
      <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
        <AccountCircleIcon />
      </Avatar>
    </IconButton>
  </Box>

      <Paper
        sx={{
          minHeight: '90vh',
          padding: '28px',
          maxWidth: "1080px"
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
              <Snackbar
                open={openAlert}
                autoHideDuration={7000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              >
                <Alert severity={alertStatus}>
                  {alertStatus === 'success' ? 'Deleted successfully' : 'Failed to delete'}
                </Alert>
              </Snackbar>
              <SearchBar />
              <DataGridTable
                row={userInfo}
                column={ADMIN_DATAGRID.columns(handleOnEdit, handleDelete)}
              />
              <Dialog open={openDialog} onClose={handleCancelDelete}>
                <DialogTitle>คุณต้องการลบข้อมูลนี้หรือไม่</DialogTitle>
                <Box
                  sx={{
                    display: 'flex',
                    paddingLeft: '24px',
                    paddingBottom: '20px',
                  }}
                >
                  <Button onClick={handleDeleteConfirmation} variant='contained'>
                    ตกลง
                  </Button>
                  <Button
                    onClick={handleCancelDelete}
                    variant='outlined'
                    sx={{ marginLeft: '12px' }}
                  >
                    ยกเลิก
                  </Button>
                </Box>
              </Dialog>
            </>
          )
        }
      </Paper>
    </>
  )
}

export default DoctorPage