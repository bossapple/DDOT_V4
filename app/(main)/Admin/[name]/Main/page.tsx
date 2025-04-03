"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { gql } from "@apollo/client";
import { GraphQLClientConnector } from "@/app/lib/API";
import { useRouter, useParams, usePathname } from "next/navigation"; // useRouter for navigation
import {
  Box,
  CircularProgress,
  Typography,
  Avatar,
  IconButton,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import TabsCompo from "@/components/shared/tabs";

//import { UserInfoType } from "../Obs/page";
import { debug } from "console";

const graphQLClient = GraphQLClientConnector();

export interface UserInfoType {
  CID: number;
  Firstname: string;
  Lastname: string;
};

// Updated query to fetch additional fields
const GET_USERINFO = gql`
  query GetAdminUserinfo($cid: String) {
    Userinfo(CID: $cid) {
      CID
      Firstname
      Lastname
    }
  }
`;

function Main() {
  const params = useParams();
  const router = useRouter(); // Access the router for navigation
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState<UserInfoType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const cleanedCID = decodeURIComponent(
        Array.isArray(params.name) ? params.name[0] : params.name
      ).replace(/\s+/g, "").trim();

      try {
        setLoading(true);
        const getUserinfo = await graphQLClient.request<{ Userinfo: UserInfoType[] }>(
          GET_USERINFO,
          { cid: cleanedCID }
        );
        setUserInfo(getUserinfo?.Userinfo || []);
        if (getUserinfo?.Userinfo?.[0]) {
          const fetchedUser = getUserinfo.Userinfo[0];
        }
      } catch (error: any) {
        console.error("Failed to get userinfo:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.name]);


  // Handle avatar click to navigate to edit profile page
   const handleAvatarClick  = () => {
     // Navigate to the admin edit profile page with the userId
     //router.push(`/Admin/${params.name}/Main/${params.userId}`);
     const userId = userInfo[0].CID;
     router.push(`${pathname}/${userId}`);
   };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Main interface
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography mr="12px" variant="h6">
            ชื่อผู้ใช้:
          </Typography>
          <Typography variant="h6" mr="12px">
            {userInfo[0]?.Firstname || "ไม่พบชื่อ"}
          </Typography>
          <Typography variant="h6">
            {userInfo[0]?.Lastname || "ไม่พบนามกุล"}
          </Typography>
        </Box>
        <IconButton sx={{ bgcolor: "grey.300", width: 40, height: 40 }} onClick={handleAvatarClick}>
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            <AccountCircleIcon />
          </Avatar>
        </IconButton>
      </Box>
      <Box>
        <TabsCompo role="admin" adminCID={params.name as string} />
      </Box>
    </>
  );
}

export default Main;
