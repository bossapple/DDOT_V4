"use client";

import React, { useEffect, useState } from "react";
import { GraphQLClientConnector } from "@/app/lib/API";
import {
  Paper,
  Box,
  CircularProgress,
  Typography,
  Avatar,
  IconButton
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { gql } from "graphql-request";

import SearchBar from "@/components/shared/searchBar";
import DataGridTable from "@/components/shared/dataGridTable";
import { OBSERVER_DATAGRID } from "@/app/constants/observer/observerDataGrid";
import { useRouter, usePathname } from "next/navigation";

// Importing PieChart from recharts
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from "recharts";

const graphQLClient = GraphQLClientConnector();

interface PatientinfoType {
  CID: number;
  Firstname: string;
  Lastname: string;
  Gender: string;
  dob: string;
  province: string | null;
  userRole: string;
}

interface ObserverInfoType {
  CID: number;
  Firstname: string;
  Lastname: string;
}

interface DayActivityType {
  cid: string;
  date_: string;
  pills_no: number;
  isComplete: string; // ✅ string instead of boolean
}

interface PatientWithActivitiesType {
  patientCID: string;
  Firstname: string;
  Lastname: string;
  DayActivities: DayActivityType[];
}

interface ObservationType {
  patient: PatientWithActivitiesType;
}


function ObsPatientPage(params: { params: { name: string | string[] } }) {
  const router = useRouter();
  const pathname = usePathname();

  const [patientInfo, setPatientInfo] = useState<PatientinfoType[]>([]);
  const [observerInfo, setObserverInfo] = useState<ObserverInfoType | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [patientsWithActivities, setPatientsWithActivities] = useState<PatientWithActivitiesType[]>([]);



  const GET_OBSERVER_PATIENT = gql`
    query Userinfo($observerCid: String) {
      Userinfo(ObserverCID: $observerCid) {
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
  `;

  const GET_OBSERVER_INFO = gql`
    query GetObserverInfo($observerCid: String) {
      Userinfo(CID: $observerCid) {
        CID
        Firstname
        Lastname
      }
    }
  `;

  const Test = gql`
    query GetDayActivitiesByObserver($observerCid: String) {
      Patient(observerCID: $observerCid) {
        patientCID
        Firstname
        Lastname
        DayActivities(cid: $patientCID) {
          cid
          date_
          pills_no
          isComplete
        }
      }
    }

  `
  useEffect(() => {
    if (!params?.params?.name) {
      console.error("❌ No CID found in params!");
      return;
    }
  
    const cleanedCID = decodeURIComponent(
      Array.isArray(params.params.name) ? params.params.name[0] : params.params.name
    ).replace(/\s+/g, "").trim();
  
    const fetchDayActivities = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching day activity data for Observer CID:", cleanedCID);
  
        const result = await graphQLClient.request<{
          observation: {
            patient: {
              patientCID: string;
              Firstname: string;
              Lastname: string;
              DayActivities: {
                cid: string;
                date_: string;
                pills_no: number;
                isComplete: string; // ✅ string, not boolean
              }[];
            };
          }[];
        }>(Test, { observerCid: cleanedCID });
  
        const formatted = result.observation.map(obs => ({
          ...obs.patient,
          DayActivities: obs.patient.DayActivities.map(act => ({
            ...act,
            date_: new Date(act.date_).toLocaleDateString('th-TH', {
              year: "numeric",
              month: "long",
              day: "2-digit"
            })
          }))
        }));
  
        setPatientsWithActivities(formatted);
        console.log("✅ Day Activity data fetched:", formatted);
      } catch (error: any) {
        console.error(`❌ Failed to fetch day activity data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    fetchDayActivities();
  }, [params.params.name]);
  
  
  useEffect(() => {
    if (!params?.params?.name) {
      console.error("❌ No CID found in params!");
      return;
    }

    // Ensure `params.params.name` is always a clean string
    const cleanedCID = decodeURIComponent(
      Array.isArray(params.params.name) ? params.params.name[0] : params.params.name
    )
      .replace(/\s+/g, "") // Remove ALL spaces (leading, trailing, and middle)
      .trim();

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("🔍 Fetching patient data for Observer CID:", cleanedCID);
        const getData = await graphQLClient.request<{ Userinfo: PatientinfoType[] }>(
          GET_OBSERVER_PATIENT,
          { observerCid: cleanedCID }
        );

        let patientData = getData.Userinfo;

        const formattedData: PatientinfoType[] = patientData.map((prevPatient) => ({
          ...prevPatient,
          dob: new Date(prevPatient.dob).toLocaleDateString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          })
        }));

        setPatientInfo(formattedData);

        console.log("🔍 Fetching Observer info...");
        const getObserver = await graphQLClient.request<{ Userinfo: ObserverInfoType[] }>(
          GET_OBSERVER_INFO,
          { observerCid: cleanedCID }
        );

        setObserverInfo(getObserver?.Userinfo?.[0] || null);
        console.log("✅ Observer Info Fetched:", getObserver?.Userinfo?.[0]);
      } catch (error: any) {
        console.error(`❌ Failed to fetch patient or observer data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.params.name]);

  useEffect(() => {
    const date = new Date();
    const formattedDate = date.toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setCurrentDate(formattedDate); // Set the formatted date to state
  }, []);


  const handleClick = (params: { row: { CID: string } }) => {
    // Navigate to the patient page
    router.push(`${pathname}/Patient/${params.row.CID}`);  //CID is the patientId
  };

  const handleAvatarClick = () => {
    if (observerInfo) {
      // Navigate to the observer page
      const userId = observerInfo.CID;
      router.push(`/Obs/${params.params.name}/Patient/ObsEdit/${userId}`);
    } else {
      console.error("Observer info is missing, cannot navigate.");
    }
  };

// Function to generate graph data.
// Data meaning 
/*
graph input: 1 = การ์ฟกินยา,  2 = การ์ฟตาบอดสี, 3 = การ์ฟอาการแพ้ยาอื่นๆ
complete input: 1 = จำนวนผู้ที่กินยา, 2 = จำนวนผู้ที่มีอาการตสบอดสี, 3 = จำนวนผู้ที่มีอาการแพ้ยาอื่นๆ
 */
const createGraphData = (graph: number, completed: number, total: number) => {
  const inProgress = total - completed;
  var completedLabel;
  var inProgressLabel;
  var label

  // 1 for ผู้ป่วยทานยา, 2 ผู้ป่วยมีอาการตาบอดสี, 3 ผู้ป่วยมีอาการแพ้อื่นๆ
  if(graph == 1){
    completedLabel = `ผู้ป่วยทานยา ${completed} คน`;
    inProgressLabel = `ผู้ป่วยไม่ทานยา ${inProgress} คน`;
    label = `ผู้ป่วยไม่ทานยา ${inProgress} คน`;

  }else if(graph == 2){
    completedLabel = `ผู้ป่วยมีอาการตาบอดสี ${completed} คน`;
    inProgressLabel = `ผู้ป่วยไม่มีอาการตาบอดสี ${inProgress} คน`;
    label = `ผู้ป่วยมีอาการตาบอดสี ${completed} คน`;

  }else{
    completedLabel = `ผู้ป่วยมีอาการแพ้ยาอื่นๆ ${completed} คน`;
    inProgressLabel = `ผู้ป่วยไม่มีอาการแพ้ยาอื่นๆ ${inProgress} คน`;
    label = `ผู้ป่วยมีอาการแพ้ยาอื่น ${completed} คน`;
  }

  return {
    data: [
      { name: completedLabel, value: completed },
      { name: inProgressLabel, value: inProgress }
    ],
    label: label
  };

};

// Example usage
const circleData1 = createGraphData(1, 8, 10);
const circleData2 = createGraphData(2, 1, 10);
const circleData3 = createGraphData(3, 1, 10);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name } = payload[0]; // Extract name only, not the value
    return (
      <Box sx={{ backgroundColor: "white", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}>
        <Typography variant="body2">{name}</Typography> {/* Display only the name */}
      </Box>
    );
  }
  return null;
};


  return (
    <Paper sx={{ minHeight: "90vh", padding: "28px", maxWidth: "1080px" }}>
      {/* Current Date in the top-right corner */}
      <Box
      sx={{
        position: "absolute",
        top: 16,
        right: 16,
        display: "flex",          // enables flex layout
        flexDirection: "column", // stacks vertically
        alignItems: "center",     // centers horizontally
        gap: 1                    // space between text and icon
      }}
    >
      <Typography variant="h6">{currentDate}</Typography>
      <IconButton
        sx={{
          bgcolor: "grey.300",
          width: 40,
          height: 40,
          p: 0
        }}
        onClick={handleAvatarClick}
      >
        <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
          <AccountCircleIcon />
        </Avatar>
      </IconButton>
    </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Observer Name Section */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography mr="12px" variant="h6">ชื่อผู้ใช้:</Typography>
              <Typography variant="h6" mr="12px">{observerInfo?.Firstname || "ไม่พบชื่อ"}</Typography>
              <Typography variant="h6">{observerInfo?.Lastname || "ไม่พบข้อมูล"}</Typography>
            </Box>
            {/* <IconButton sx={{ bgcolor: "grey.300", width: 40, height: 40 }} onClick={handleAvatarClick}>
              <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton> */}
          </Box>

          {/* Report dashboard graph */}
          <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <Box sx={{ width: "30%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={circleData1.data}
                  dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} 
                  stroke="#000" strokeWidth={3}
                  label
                >
                  <Cell fill="#88b7f4" />
                  <Cell fill="#000" />
                </Pie>
                <Label position="center" fontSize="16px" fill="#000" />
                <Tooltip content={<CustomTooltip />} />
              </PieChart> 
              </ResponsiveContainer>
              <Typography variant="h6" sx={{ marginTop: "8px" }}>{circleData1.label}</Typography>
            </Box>

            <Box sx={{ width: "30%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={circleData2.data}
                    dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} 
                    stroke="#000" strokeWidth={3}
                    label
                  >
                    <Cell fill="#000" />
                    <Cell fill="#9c6a91" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <Typography variant="h6" sx={{ marginTop: "8px" }}>{circleData2.label}</Typography>
            </Box>

            <Box sx={{ width: "30%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={circleData3.data}
                    dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} 
                    stroke="#000" strokeWidth={3}
                    label
                  >
                    <Cell fill="#000" />
                    <Cell fill="#e85a5a" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <Typography variant="h6" sx={{ marginTop: "8px" }}>{circleData3.label}</Typography>
            </Box>
          </Box>


          {/* Search Bar */}
          <SearchBar />
          {/* Patient data table*/}
          <DataGridTable row={patientInfo} column={OBSERVER_DATAGRID.columns(handleClick)} />
        </>
      )}
    </Paper>
  );
}

export default ObsPatientPage;
