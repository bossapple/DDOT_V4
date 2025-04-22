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
import { useParams } from 'next/navigation';

// Importing PieChart from recharts
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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

interface SideEffectType {
  sideEffectID: string;
  patientCID: string;
  effectDate: Date | string;
  effectTime: string;
  effectDesc: string;
}

interface ColorBlindType {
  colorBlindID: number;
  patientCID: string;
  colorBlindDate: Date | string;
  colorBlindTime: string;
  correct: number;
  incorrect: number;
}

interface DayActivityType {
  date_: Date | string;
  pills_no: string;
  isComplete: string;
  cid: string;
}
interface GetDayActivityResponse {
  getDayActivityForObserver: DayActivityType[];
}





function ObsPatientPage(params: { params: { name: string | string[] } }) {
  const { observerCID } = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const [patientInfo, setPatientInfo] = useState<PatientinfoType[]>([]);
  const [observerInfo, setObserverInfo] = useState<ObserverInfoType | null>(null);
  const [loading, setLoading] = useState(false);
  const [sideEffects, setSideEffects] = useState<SideEffectType[]>([]); // Store side effects here
  const [sideEffectData, setSideEffectData] = useState<{ effectName: string; patientCount: number }[]>([]);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [patientCount, setPatientCount] = useState<number>(0);
  const [colorBlindData, setColorBlindData] = useState<ColorBlindType[]>([]);
  const [colorBlindCount, setColorBlindCount] = useState<number>(0);
  const [dayActivities, setDayActivities] = useState<DayActivityType[]>([]);
  const [dayActivityCount, setDayActivityCount] = useState<number>(0);








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

  const GET_SIDEEFFECT = gql`
    query GetSideEffectsForObserver($observerCID: String!) {
      getSideEffectsForObserver(observerCID: $observerCID) {
        sideEffectID
        patientCID
        effectDate
        effectTime
        effectDesc
      }
    }
  `

  const GET_COLORBLIND = gql`
    query GetColorBlindForObserver($observerCID: String!) {
      getColorBlindForObserver(observerCID: $observerCID) {
        colorBlindID
        patientCID
        colorBlindDate
        colorBlindTime
        correct
        incorrect
      }
    }
  `;
  const GET_DAY_ACTIVITY = gql`
  query GetDayActivityForObserver($observerCID: String!) {
    getDayActivityForObserver(observerCID: $observerCID) {
      date_
      pills_no
      isComplete
      cid
    }
  }
`;




  //For getting patient side effects
  useEffect(() => {
    if (!params?.params?.name) {
      return;
    }
  
    const cleanedCID = decodeURIComponent(
      Array.isArray(params.params.name) ? params.params.name[0] : params.params.name
    )
      .replace(/\s+/g, "")
      .trim();
  
    const fetchSideEffectChartData = async () => {
      try {
        setLoading(true);
  
        const getData = await graphQLClient.request<{
          getSideEffectsForObserver: SideEffectType[];
        }>(GET_SIDEEFFECT, {
          observerCID: cleanedCID,
        });
  
        const formatted = getData.getSideEffectsForObserver.map(effect => {
          const date = new Date(Number(effect.effectDate));
          return {
            ...effect,
            effectDate: date.toLocaleDateString("en-EN", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            }),
          };
        });
  
        // Count occurrences of each effectDesc
        const counts: Record<string, number> = {};
        formatted.forEach(effect => {
          const desc = effect.effectDesc.trim();
          counts[desc] = (counts[desc] || 0) + 1;
        });
  
        const chartData = Object.entries(counts).map(([effectName, patientCount]) => ({
          effectName,
          patientCount,
        }));
  
        setSideEffectData(chartData);
        console.log("📊 SideEffect Chart Data:", chartData);
      } catch (error: any) {
        console.error(`❌ Failed to fetch side effects data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    fetchSideEffectChartData();
  }, [params.params.name]);
  

  //For getting paitent color blind
  useEffect(() => {
    if (!params?.params?.name) {
      console.error("❌ No observerCID found for ColorBlind data!");
      return;
    }
  
    const cleanedCID = decodeURIComponent(
      Array.isArray(params.params.name) ? params.params.name[0] : params.params.name
    )
      .replace(/\s+/g, "")
      .trim();
  
    const fetchColorBlindData = async () => {
      try {
        //console.log("🔍 Fetching ColorBlind data for observerCID:", cleanedCID);
  
        const getData = await graphQLClient.request<{ getColorBlindForObserver: ColorBlindType[] }>(
          GET_COLORBLIND,
          { observerCID: cleanedCID }
        );
  
        const formattedColorBlind = getData.getColorBlindForObserver.map(item => {
          const formattedDate = new Date(Number(item.colorBlindDate)).toLocaleDateString("en-EN", {
            year: "numeric",
            month: "numeric",
            day: "numeric"
          });
  
          const formattedTime = new Date("1970-01-01T" + item.colorBlindTime).toLocaleTimeString("en-EN", {
            hour: "2-digit",
            minute: "2-digit",
          });
  
          const formattedItem = {
            ...item,
            colorBlindDate: formattedDate,
            colorBlindTime: formattedTime,
          };
  
          //console.log("📅 Formatted ColorBlind Entry:", formattedItem);
          return formattedItem;
        });
  
        setColorBlindData(formattedColorBlind);
        setColorBlindCount(formattedColorBlind.length);
        console.log("✅ Formatted Color Blind", formattedColorBlind);
        console.log("🧠 Total Patients with Color Blindness Data:", formattedColorBlind.length);

      } catch (error: any) {
        console.error(`❌ Failed to fetch color blindness data: ${error.message}`);
      }
    };
  
    fetchColorBlindData();
  }, [params.params.name]);
  
  // For DayActivity
  useEffect(() => {
    if (!params?.params?.name) {
      console.error("❌ No observerCID found for DayActivity data!");
      return;
    }
  
    const cleanedCID = decodeURIComponent(
      Array.isArray(params.params.name) ? params.params.name[0] : params.params.name
    )
      .replace(/\s+/g, "")
      .trim();
  
    const fetchDayActivityData = async () => {
      try {
        const getData = await graphQLClient.request<GetDayActivityResponse>(
          GET_DAY_ACTIVITY,
          { observerCID: cleanedCID }
        );
  
        const formattedDayActivities = getData.getDayActivityForObserver.map(item => {
          let formattedDate: string;
  
          // Check if it's a number (like 1713916800000), convert to Date directly
          if (typeof item.date_ === "number" || !isNaN(Number(item.date_))) {
            const parsed = new Date(Number(item.date_));
            formattedDate = parsed.toLocaleDateString("en-EN", {
              year: "numeric",
              month: "numeric",
              day: "numeric"
            });
          } else {
            formattedDate = String(item.date_); // fallback if it's a weird string
            console.warn("⚠️ Could not parse date, using raw value:", item.date_);
          }
  
          return {
            ...item,
            date_: formattedDate
          };
        });
  
        setDayActivities(formattedDayActivities);
        setDayActivityCount(formattedDayActivities.length);
        console.log("✅ Formatted DayActivity:", formattedDayActivities);
        console.log("📅 Total DayActivity Count:", formattedDayActivities.length);
  
      } catch (error: any) {
        console.error(`❌ Failed to fetch DayActivity data: ${error.message}`);
      }
    };
  
    fetchDayActivityData();
  }, [params.params.name]);
  
  
  
  
  // For patient data
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
        setPatientCount(formattedData.length); // Patient count
        //console.log("Patient count:", formattedData.length);



        //console.log("🔍 Fetching Observer info...");
        const getObserver = await graphQLClient.request<{ Userinfo: ObserverInfoType[] }>(
          GET_OBSERVER_INFO,
          { observerCid: cleanedCID }
        );

        setObserverInfo(getObserver?.Userinfo?.[0] || null);
        //console.log("✅ Observer Info Fetched:", getObserver?.Userinfo?.[0]);
      } catch (error: any) {
        console.error(`❌ Failed to fetch patient or observer data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.params.name]);

  //For current Date
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
graph input: 1 = การ์ฟกินยา,  2 = การ์ฟตาบอดสี
complete input: 1 = จำนวนผู้ที่กินยา, 2 = จำนวนผู้ที่มีอาการตสบอดสี
 */
const createGraphData = (graph: number, completed: number, total: number) => {
  if (total === 0) {
    return {
      data: [{ name: "ไม่มีข้อมูลผู้ป่วย", value: 1 }],
      label: "ไม่มีข้อมูลผู้ป่วย",
      isEmpty: true // ✅ flag for custom rendering
    };
  }

  const inProgress = total - completed;
  let completedLabel;
  let inProgressLabel;
  let label;

  if (graph === 1) {
    completedLabel = `ผู้ป่วยทานยา ${completed} คน`;
    inProgressLabel = `ผู้ป่วยไม่ทานยา ${inProgress} คน`;
    label = `ผู้ป่วยไม่ทานยา ${inProgress} คนจาก ${total} คน`;
  } else{
    completedLabel = `ผู้ป่วยมีอาการตาบอดสี ${completed} คน`;
    inProgressLabel = `ผู้ป่วยไม่มีอาการตาบอดสี ${inProgress} คน`;
    label = `ผู้ป่วยมีอาการตาบอดสี ${completed} คนจาก ${total} คน`;
  }

  return {
    data: [
      { name: completedLabel, value: completed },
      { name: inProgressLabel, value: inProgress }
    ],
    label: label,
    isEmpty: false
  };
};

// Count how many patients have each type of side effect
// const countSideEffectDescriptions = (effects: SideEffectType[]) => {
//   const counts: Record<string, number> = {};

//   effects.forEach(effect => {
//     const desc = effect.effectDesc.trim(); // Normalize
//     counts[desc] = (counts[desc] || 0) + 1;
//   });

//   return Object.entries(counts).map(([name, count]) => ({ name, count }));
// };



// Input data to the graphs
const  circleData1 = createGraphData(1, dayActivityCount, patientCount);
const  circleData2 = createGraphData(2, colorBlindCount, patientCount);

//Example Data of side effect chart
// const sideEffectData = [
//   { effectName: 'Nausea', patientCount: 7 },
//   { effectName: 'Headache', patientCount: 5 },
//   { effectName: 'Rash', patientCount: 3 },
//   { effectName: 'Dizziness', patientCount: 6 },
//   { effectName: 'Vomiting', patientCount: 4 },
//   { effectName: 'Fatigue', patientCount: 2 },
//   { effectName: 'Fever', patientCount: 5 },
//   { effectName: 'Cough', patientCount: 1 },
//   { effectName: 'Shortness of breath', patientCount: 3 },
//   { effectName: 'Chest pain', patientCount: 2 },
// ];




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
          {/* Graph 1 */}
          <Box sx={{ width: "30%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Typography variant="h6" sx={{ mt: 1, textAlign: "center" }}>
              {circleData1.label}
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={circleData1.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  stroke="#000"
                  strokeWidth={3}
                  label
                >
                  {circleData1.isEmpty ? (
                    <Cell fill="#cccccc" />
                  ) : (
                    <>
                      <Cell fill="#88b7f4" />
                      <Cell fill="#000" />
                    </>
                  )}
                </Pie>
                <Label position="center" fontSize="16px" fill="#000" />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* <Typography variant="h6" sx={{ mt: 1, textAlign: "center" }}>
              {circleData1.label}
            </Typography> */}
          </Box>

          {/* Graph 2 */}
          <Box sx={{ width: "30%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Typography variant="h6" sx={{ mt: 1, textAlign: "center" }}>
              {circleData2.label}
            </Typography>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={circleData2.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  stroke="#000"
                  strokeWidth={3}
                  label
                >
                  {circleData2.isEmpty ? (
                    <Cell fill="#cccccc" />
                  ) : (
                    <>
                      <Cell fill="#000" />
                      <Cell fill="#9c6a91" />
                    </>
                  )}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* <Typography variant="h6" sx={{ mt: 1, textAlign: "center" }}>
              {circleData2.label}
            </Typography> */}
          </Box>

          {/* Graph 3 */}
          <Box sx={{ width: "30%", display: "flex", flexDirection: "column", alignItems: "center",}}>
            <Typography variant="h6" sx={{ mt: 1, textAlign: "center" }}>
              ผู้ป่วยที่มีอาการแพ้ยาอื่นๆ
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={sideEffectData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="effectName"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={80}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, patientCount]}
                />
                <Tooltip />
                <Bar dataKey="patientCount" fill="#e85a5a" name="จำนวนผู้ป่วย" />
              </BarChart>
            </ResponsiveContainer>
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
