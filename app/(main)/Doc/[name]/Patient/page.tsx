"use client";

import React, { useState, useEffect } from 'react';
import { GraphQLClientConnector } from "../../../../lib/API";
import { gql } from '@apollo/client';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Box, Paper, CircularProgress, Typography, Avatar, IconButton } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchBar from '@/components/shared/searchBar';
import DataGridTable from '@/components/shared/dataGridTable';
import { DOCTOR_DATAGRID } from '@/app/constants/doctor/doctorDataGrid';

// should create in other folder
import { UserInfoType } from '@/app/(main)/Admin/[name]/Obs/page';

// Define GraphQL query for fetching user info
const GET_USERINFO = gql`
  query GetUserinfo($cid: String) {
    Userinfo(CID: $cid) {
      CID
      Firstname
      Lastname
    }
  }
`;

function ObsPatientPage() {
  const graphQLClient = GraphQLClientConnector();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams(); // Access URL parameters
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<UserInfoType[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfoType | null>(null);

  const GEL_PATIENT = gql`
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
  `;

  // Fetch user info and patient data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetching user info for the admin or doctor
      const cleanedCID = decodeURIComponent(
        Array.isArray(params.name) ? params.name[0] : params.name
      ).replace(/\s+/g, "").trim();

      const userInfoData = await graphQLClient.request<{ Userinfo: UserInfoType[] }>(
        GET_USERINFO,
        { cid: cleanedCID }
      );
      setUserInfo(userInfoData?.Userinfo[0] || null);

      // Fetch patient data
      const getData = await graphQLClient.request<{ Userinfo: UserInfoType[] }>(
        GEL_PATIENT, { Filter: 'PATIENT' }
      );
      
      let getPatients = getData.Userinfo;

      const formattedData: UserInfoType[] = getPatients.map((prevPatient) => ({
        ...prevPatient,
        dob: new Date(prevPatient.dob).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      }));

      setPatientData(formattedData);

    } catch (error: any) {
      console.log(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.name]); // Reload data when the CID changes

  const handleOnEdit = (params: { row: { CID: string } }) => {
    router.push(`${pathname}/${params.row.CID}`);
  };

  const handleAvatarClick = () => {
    const userId = userInfo?.CID;
    router.push(`/Doc/${params.name}/Main/${userId}`);
  };

  return (
    <Paper sx={{ minHeight: '90vh', padding: '28px', maxWidth: '1080px' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Display user info */}
          {userInfo && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography mr="12px" variant="h6">
                  ชื่อผู้ใช้:
                </Typography>
                <Typography variant="h6" mr="12px">
                  {userInfo.Firstname || "ไม่พบชื่อ"}
                </Typography>
                <Typography variant="h6">
                  {userInfo.Lastname || "ไม่พบข้อมูล"}
                </Typography>
              </Box>
              <IconButton sx={{ bgcolor: "grey.300", width: 40, height: 40 }} onClick={handleAvatarClick}>
                <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                  <AccountCircleIcon />
                </Avatar>
              </IconButton>
            </Box>
          )}

          {/* Search bar and data grid */}
          <SearchBar />
          <DataGridTable 
            row={patientData}
            column={DOCTOR_DATAGRID.columns(handleOnEdit)}
          />
        </>
      )}
    </Paper>
  );
}

export default ObsPatientPage;
