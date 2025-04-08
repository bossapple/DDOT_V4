"use client";

import { gql } from "@apollo/client";
// Import useMemo along with other React hooks
import React, { useEffect, useState, useMemo } from "react";
import { GraphQLClientConnector } from "../../../../lib/API"; // Adjust path if necessary
import { useRouter, usePathname, useParams } from "next/navigation";
import {
  Box,
  Paper,
  CircularProgress,
  Typography,
  IconButton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SearchBar from "@/components/shared/searchBar"; // Adjust path if necessary

// Define the interface for Pillbox data
export interface Pillbox {
  boxID: string;
  localHospitalNumber: string;
  simNumber?: string; // Optional based on original query
  pillboxStatus: string;
  startDate: string | Date; // Keep as string or Date based on API response
  lastUpdate: string | Date; // Keep as string or Date based on API response
  currentLocation?: string; // Optional based on original query
}

const transformPillboxDates = (pillboxes: Pillbox[]): Pillbox[] => {
  return pillboxes.map((pillbox) => ({
    ...pillbox,
    startDate: new Date(Number(pillbox.startDate)),
    lastUpdate: new Date(Number(pillbox.lastUpdate)),
  }));
};


// Example query to fetch Pillbox data (ensure field names match the interface)
const GET_PILLBOX_DATA = gql`
  query GetPillboxData {
    # Ensure the query name and fields match your GraphQL schema
    # Using 'Pillbox' as an example based on the original code
    Pillbox {
      boxID
      localHospitalNumber
      pillboxStatus
      startDate
      lastUpdate
    }
  }
`;

// Query to fetch Admin Username
const GET_ADMIN_USERNAME = gql`
  query GetAdminUsername($cid: String) {
    # Ensure the query name and fields match your GraphQL schema
    Userinfo(CID: $cid) {
      CID
      Firstname
      Lastname
    }
  }
`;

// Define the interface for Admin User data
interface AdminUser {
    CID: string;
    Firstname: string;
    Lastname: string;
}


function PillboxPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  // --- CHANGE: Memoize the GraphQL client instance ---
  // This ensures the client is created only once per component instance.
  const graphQLClient = useMemo(() => GraphQLClientConnector(), []);
  // --- END CHANGE ---

  // State definitions
  const [pillboxData, setPillboxData] = useState<Pillbox[]>([]);
  const [loading, setLoading] = useState(true); // Start loading initially
  const [adminUsername, setAdminUsername] = useState<AdminUser[]>([]);

  useEffect(() => {
    const nameParam = params?.name;
    if (!nameParam) {
      console.error("❌ No CID found in params!");
      setLoading(false); // Stop loading if no CID
      return;
    }

    const cleanedCID = decodeURIComponent(
      Array.isArray(nameParam) ? nameParam[0] : nameParam
    ).replace(/\s+/g, "");

    console.log("🚀 Cleaned Admin CID:", cleanedCID);

    let isMounted = true; // Flag to prevent state updates on unmounted component

    const fetchData = async () => {
      // Ensure we only fetch if the component is still mounted
      if (!isMounted) return;

      setLoading(true); // Set loading true when fetch starts

      try {
        // Fetch Pillbox data and Admin Username concurrently
        console.log("🔍 Fetching data...");
        const [pillboxResponse, adminResponse] = await Promise.all([
          graphQLClient.request<{ Pillbox: Pillbox[] }>(GET_PILLBOX_DATA),
          graphQLClient.request<{ Userinfo: AdminUser[] }>(GET_ADMIN_USERNAME, { cid: cleanedCID })
        ]);

        // Check if component is still mounted before updating state
        if (isMounted) {
          // Process Pillbox data
          if (pillboxResponse.Pillbox && pillboxResponse.Pillbox.length > 0) {
            const transformed = transformPillboxDates(pillboxResponse.Pillbox);
            setPillboxData(transformed);
            console.log("✅ Pillbox data transformed and set:", transformed);
          } else {
              setPillboxData([]);
              console.log("ℹ️ No pillbox data found.");
          }

          // Process Admin data
          if (adminResponse.Userinfo && adminResponse.Userinfo.length > 0) {
            setAdminUsername(adminResponse.Userinfo);
            console.log("✅ Admin Info Fetched:", adminResponse.Userinfo);
          } else {
            setAdminUsername([]);
            console.log("ℹ️ No admin user info found.");
          }
        }

      } catch (error: any) {
         // Check if component is still mounted before updating state
        if (isMounted) {
            console.error("❌ Failed to fetch pillbox or admin data:", error);
            setPillboxData([]); // Clear data on error
            setAdminUsername([]); // Clear data on error
        }
      } finally {
         // Check if component is still mounted before updating state
        if (isMounted) {
            setLoading(false); // Set loading false when fetch completes or fails
        }
      }
    };

    fetchData();

    // Cleanup function to set isMounted to false when the component unmounts
    return () => {
      isMounted = false;
    };

    // The effect depends on the admin's CID (params.name) and the stable graphQLClient instance.
  }, [params?.name, graphQLClient]); // graphQLClient is now stable due to useMemo

  // --- Handler Functions (Edit, Delete, Avatar Click) ---

  const handleOnViewInfo = (boxID: string) => {
    console.log("Edit Pillbox ID:", boxID);
    router.push(`${pathname}/${boxID}`);
  };

  const handleOnDelete = (boxID: string) => {
    console.log("Delete Pillbox ID:", boxID);
    // Replace alert with a proper confirmation dialog (e.g., using MUI Dialog)
    if (window.confirm(`Are you sure you want to delete Pillbox ID: ${boxID}?`)) {
        console.log(`Proceeding with deletion of ${boxID}...`);
        // --- Add actual API call for deletion here ---
        // Example:
        // deletePillboxMutation({ variables: { boxID } })
        //   .then(() => {
        //     // Refetch data or update state optimistically
        //     setPillboxData(currentData => currentData.filter(p => p.boxID !== boxID));
        //     console.log(`Successfully deleted ${boxID}`);
        //   })
        //   .catch(error => {
        //     console.error(`Failed to delete ${boxID}:`, error);
        //     // Show error message to user
        //   });
    } else {
        console.log(`Deletion cancelled for ${boxID}.`);
    }
  };

  const handleAvatarClick = () => {
    const userId = adminUsername[0]?.CID;
    const currentAdminCID = Array.isArray(params?.name) ? params.name[0] : params?.name; // Get current admin CID safely

    if (userId && currentAdminCID) {
         // Ensure the path structure matches your application's routing for admin profiles
        router.push(`/Admin/${currentAdminCID}/Main/${userId}`);
    } else {
        console.warn("Cannot navigate to profile: Admin CID or Target User CID not available.", { userId, currentAdminCID });
    }
  };

  const formatThaiDate = (date: Date): string =>
    date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  


  // Helper to safely get admin name parts
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

  // --- JSX Return ---
  return (
    <>
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 2,
          width: "100%",
        }}
      >
        {/* Admin Name Display */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" component="span">
            ชื่อผู้ใช้:
          </Typography>
          <Typography variant="h6" component="span" fontWeight="medium">
            {getAdminName()}
          </Typography>
        </Box>

        {/* Profile Avatar Button */}
        <IconButton
          aria-label="account of current user"
          onClick={handleAvatarClick}
          sx={{ p: 0 }}
          disabled={adminUsername.length === 0} // Disable if no admin data yet
        >
          <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
            <AccountCircleIcon />
          </Avatar>
        </IconButton>
      </Box>

      {/* Main Content Area */}
      <Paper sx={{ minHeight: "85vh", padding: 3, width: '100%', maxWidth: "1080px", margin: '0 auto' }}>
        {loading ? (
          // Loading Indicator
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "70vh",
            }}
          >
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading Pillbox Data...</Typography>
          </Box>
        ) : (
          // Data Display Section
          <>
            <SearchBar /> {/* Include SearchBar */}
            <Box sx={{ my: 5 }}>
              {/* <Typography variant="h5" component="h2" gutterBottom>
                ข้อมูลกล่องโดยรวม
              </Typography> */}
            </Box>
            {/* Table */}
            <TableContainer component={Paper} elevation={2}>
              <Table sx={{ minWidth: 650 }} aria-label="pillbox table">
                <TableHead sx={{ backgroundColor: 'grey.200' }}>
                  <TableRow>
                    <TableCell>ID กล่อง</TableCell>
                    <TableCell>รหัสโรงพยาบาล</TableCell>
                    <TableCell>สถาณะกล่อง</TableCell>
                    <TableCell>วันที่เริ่มใช้งาน</TableCell>
                    <TableCell>วันที่ทำงานล่าสุด</TableCell>  
                    <TableCell align="center">ดูข้อมูล</TableCell> {/* New View Info Column */}
                    <TableCell align="center">ลบกล่องนี้</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pillboxData.length > 0 ? (
                    pillboxData.map((pillbox) => (
                      <TableRow
                        key={pillbox.boxID}
                        hover
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {pillbox.boxID}
                        </TableCell>
                        <TableCell>{pillbox.localHospitalNumber || 'N/A'}</TableCell>
                        <TableCell>{pillbox.pillboxStatus || 'N/A'}</TableCell>
                        <TableCell>{pillbox.startDate ? formatThaiDate(pillbox.startDate as Date) : 'N/A'}</TableCell>
                        <TableCell>{pillbox.lastUpdate ? formatThaiDate(pillbox.lastUpdate as Date) : 'N/A'}</TableCell>

                        {/* 🔍 View Info Button */}
                        <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => handleOnViewInfo(pillbox.boxID)}
                          sx={{
                            borderRadius: '5px', // Rounded corners like the image
                          }}
                        >
                          ดูข้อมูล
                        </Button>
                        </TableCell>
                        {/* ❌ Delete Button */}
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            size="large"
                            onClick={() => handleOnDelete(pillbox.boxID)}
                            sx={{
                              backgroundColor: '#cc3300',
                              color: 'white',
                              borderRadius: '5px',
                              '&:hover': {
                                backgroundColor: '#b52a00',
                              },
                            }}
                          >
                            ลบ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No pillbox data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
    </>
  );
}

export default PillboxPage;