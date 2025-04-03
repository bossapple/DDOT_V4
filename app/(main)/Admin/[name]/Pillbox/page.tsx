"use client";

import { gql } from "@apollo/client";
import React, { useEffect, useState } from "react";
import { GraphQLClientConnector } from "../../../../lib/API";
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  IconButton,
  Avatar,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SearchBar from "@/components/shared/searchBar";
import DataGridTable from "@/components/shared/dataGridTable";
import { PILLBOX_DATAGRID } from "@/app/constants/admin/adminBoxDataGrid"; // Ensure this import is correct

// Example query to fetch Pillbox data
const GET_PILLBOX_DATA = gql`
  query {
    Pillbox {
      boxID
      localHospitalNumber
      simNumber
      pillboxStatus
      startDate
      lastUpdate
      currentLocation
    }
  }
`;

function PillboxPage() {
  const param = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const graphQLClient = GraphQLClientConnector();

  const [pillboxData, setPillboxData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminUsername, setAdminUsername] = useState<any[]>([]);

  const GET_ADMIN_USERNAME = gql`
    query ExampleQuery($cid: String) {
      Userinfo(CID: $cid) {
        CID
        Firstname
        Lastname
      }
    }
  `;

  useEffect(() => {
    if (!param?.name) {
      console.error("❌ No CID found in params!");
      return;
    }

    const cleanedCID = decodeURIComponent(
      Array.isArray(param.name) ? param.name[0] : param.name
    ).replace(/\s+/g, "");

    console.log("🚀 Cleaned Admin CID:", cleanedCID);

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Pillbox data
        console.log("🔍 Fetching pillbox data...");
        const getPillboxData = await graphQLClient.request<{ PillboxData: any[] }>(
          GET_PILLBOX_DATA
        );

        if (getPillboxData.PillboxData && getPillboxData.PillboxData.length > 0) {
          setPillboxData(getPillboxData.PillboxData);
        } else {
          setPillboxData([]);
        }

        console.log("✅ Pillbox data fetched:", pillboxData);

        // Fetch Admin Username
        console.log("🔍 Fetching admin username...");
        const getAdminUsername = await graphQLClient.request<{ Userinfo: any[] }>(
          GET_ADMIN_USERNAME,
          { cid: cleanedCID }
        );

        if (getAdminUsername.Userinfo && getAdminUsername.Userinfo.length > 0) {
          setAdminUsername(getAdminUsername.Userinfo);
        } else {
          setAdminUsername([]);
        }

        console.log("✅ Admin Info Fetched:", adminUsername);

      } catch (error: any) {
        console.error("❌ Failed to fetch pillbox or admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [param.name]); // ✅ Runs when `param.name` changes

  const handleOnEdit = (params: { row: { boxID: string } }) => {
    router.push(`${pathname}/edit/${params.row.boxID}`);
  };

  const handleOnDelete = (params: { row: { boxID: string } }) => {
    // Handle delete logic here
    console.log("Delete Pillbox ID:", params.row.boxID);
    // Add confirmation and delete functionality (API call to remove the record)
  };

  // Handle avatar click to navigate to edit profile page
  const handleAvatarClick = () => {
    const userId = adminUsername[0]?.CID;
    router.push(`/Admin/${param.name}/Main/${userId}`);
  };

  return (
    <>
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography mr="12px" variant="h6">
          ชื่อผู้ใช้:
        </Typography>
        <Typography variant="h6" mr="12px">
          {adminUsername[0]?.Firstname || "ไม่พบชื่อ"}
        </Typography>
        <Typography variant="h6">
          {adminUsername[0]?.Lastname || "ไม่พบนามสกุล"}
        </Typography>
        </Box>

        {/* Circular Profile Button */}
        <IconButton
          sx={{ bgcolor: "grey.300", width: 40, height: 40 }}
          onClick={handleAvatarClick}
        >
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            <AccountCircleIcon />
          </Avatar>
        </IconButton>
      </Box>

      <Paper sx={{ minHeight: "90vh", padding: "28px", maxWidth: "1080px" }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "70vh",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            <SearchBar />
            {/* Pass pillboxData to DataGridTable */}
            <DataGridTable
              row={pillboxData || []} // Ensures pillboxData is not undefined
              column={PILLBOX_DATAGRID.columns(handleOnEdit, handleOnDelete)}
            />
          </>
        )}
      </Paper>
    </>
  );
}

export default PillboxPage;
