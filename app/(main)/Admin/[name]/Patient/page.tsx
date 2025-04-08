"use client";

import { gql } from '@apollo/client';

import React, { useEffect, useState } from 'react'
import { GraphQLClientConnector } from "../../../../lib/API";

import { useRouter, usePathname, useParams } from 'next/navigation'
import {
  Box,
  Paper,
  CircularProgress,
  Typography,Avatar,
  IconButton
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SearchBar from '@/components/shared/searchBar';
import DataGridTable from '@/components/shared/dataGridTable';
import { UserInfoType } from '../Obs/page';
import { ADMIN_DATAGRID } from '@/app/constants/admin/adminDataGrid';

function PatientPage() {

  const param = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const graphQLClient = GraphQLClientConnector();

  const [userInfo, setUserInfo] = useState<UserInfoType[]>([])
  const [loading, setLoading] = useState(false)
  const [adminUsername, setAdminUsername] = useState<UserInfoType[]>([])

  const query = gql`
    query {
      Userinfo(Filter: "Patient") {
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

  const GET_ADMIN_USERNAME = gql`
    query ExampleQuery($cid: String) {
      Userinfo(CID: $cid) {
        CID
        Firstname
        Lastname
      }
    }
  `

  useEffect(() => {
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
  
    const fetchData = async () => {
      try {
        setLoading(true);
  
        // 🔍 Fetch Patient Data
        console.log("🔍 Fetching patient data...");
        const getPatientData = await graphQLClient.request<{ Userinfo: UserInfoType[] }>(
          query,
          { Filter: "PATIENT" }
        );
  
        let patientData = getPatientData.Userinfo;
  
        const formattedData: UserInfoType[] = patientData.map((prevPatient) => ({
          ...prevPatient,
          dob: new Date(prevPatient.dob).toLocaleDateString('th-TH', {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          }),
        }));
  
        setUserInfo(formattedData);
        console.log("✅ Patient data fetched:", formattedData);
  
        // 🔍 Fetch Admin Username
        console.log("🔍 Fetching admin username...");
        const getAdminUsername = await graphQLClient.request<{ Userinfo: UserInfoType[] }>(
          GET_ADMIN_USERNAME,
          { cid: cleanedCID }
        );
  
        setAdminUsername(getAdminUsername?.Userinfo);
        console.log("✅ Admin Info Fetched:", getAdminUsername.Userinfo);
  
      } catch (error: any) {
        console.error("❌ Failed to fetch patient or admin data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [param.name]); // ✅ Runs when `param.name` changes
  

  const handleOnEdit = (params: { row: { CID: string } }) => {
    router.push(`${pathname}/${params.row.CID}`)
  }

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
      justifyContent: "space-between", // Pushes button to the right
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
    <IconButton sx={{ bgcolor: "grey.300", width: 40, height: 40 }} onClick={handleAvatarClick}>
      <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
        <AccountCircleIcon />
      </Avatar>
    </IconButton>
  </Box>

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
                minHeight: '70vh',
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <SearchBar />
              <DataGridTable
                row={userInfo}
                column={ADMIN_DATAGRID.columns(handleOnEdit)}
              />
            </>
          )
        }
      </Paper>
    </>
  )
}

export default PatientPage
