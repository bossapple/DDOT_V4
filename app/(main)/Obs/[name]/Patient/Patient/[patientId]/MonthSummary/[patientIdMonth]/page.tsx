'use client'

import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import { GraphQLClientConnector } from '@/app/lib/API'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts'
import { Paper, Box, CircularProgress, Typography, IconButton, Select, MenuItem, InputLabel, FormControl } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter, useParams } from 'next/navigation'



interface PatientNameType {
  CID: string
  Firstname: string
  Lastname: string
}



function PatientIdSummary() {
  const graphQLClient = GraphQLClientConnector()
  const router = useRouter()

  // Use useParams to extract parameters from the URL
  const { name, patientId, patientIdMonth } = useParams() // Extract dynamic params from the URL

  // State to store the patient's name and ID
  const [patientName, setPatientName] = useState<PatientNameType | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-01')

  const [circleData, setCircleData] = useState<{ name: string; value: number }[]>([]);
  const [unverifiedDates, setUnverifiedDates] = useState<string[]>([]);
  const [incompleteDates, setIncompleteDates] = useState<string[]>([]);
  const [missingDays, setMissingDays] = useState<string[]>([])

  const [barData, setBarData] = useState<{ name: string; value: number }[]>([]);
  const [colorBlindList, setColorBlindList] = useState<string[]>([]);
  const [sideEffectList, setSideEffectList] = useState<string[]>([]);



  
  

  // GraphQL query to fetch patient info
  const GET_USER = gql`
    query Userinfo($cid: String) {
      Userinfo(CID: $cid) {
        CID
        Firstname
        Lastname
      }
    }
  `;

  const GET_DAY_ACTIVITY_HISTORY = gql`
    query GetDayActivity($patientCID: String!, $month: Int!, $year: Int!) {
    getDayActivityHistory(patientCID: $patientCID, month: $month, year: $year) {
      date_
      isComplete
      pills_no
      cid
    }
  }
`
const GET_COLOR_BLIND_HISTORY = gql`
  query GetColorBlindHistory($patientCID: String!, $month: Int!, $year: Int!) {
    getColorBlindHistory(patientCID: $patientCID, month: $month, year: $year) {
      colorBlindDate
    }
  }
`;

const GET_SIDE_EFFECT_HISTORY = gql`
  query GetSideEffectHistory($patientCID: String!, $month: Int!, $year: Int!) {
    getSideEffectHistory(patientCID: $patientCID, month: $month, year: $year) {
      effectDate
      effectDesc
    }
  }
`;



  // Function to navigate back to the previous page
  const handleBackClick = () => {
    router.push(`/Obs/${name}/Patient/Patient/${patientId}`); // Correct the navigation path
  }

  const formatDateOnly = (timestamp: string | number): string => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp));
    return new Intl.DateTimeFormat('th-TH', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };
  

  // Fetch patient information based on userId passed from the URL
  useEffect(() => {
    if (!patientId) return // If patientId is not provided, do not run the query

    const fetchPatientName = async () => {
      try {

        const { Userinfo } = await graphQLClient.request<{ Userinfo: PatientNameType[] }>(GET_USER, {
          cid: patientId // Pass the correct patientId to the query
        })

        if (Userinfo && Userinfo[0]) {
          console.log('Fetched patient:', Userinfo[0]) // Debug: Log fetched data
          setPatientName(Userinfo[0]) // Set the patient's information
        }
      } catch (error) {
        console.error('Failed to fetch patient name:', error)
      }
    }

    fetchPatientName()
  }, [patientId]); // Fetch when `patientId` changes

  //Get DayActivity
  useEffect(() => {
    if (!patientId || !selectedMonth) return;
  
    const [year, month] = selectedMonth.split('-').map(Number);
    console.log('Selected Year:', year, 'Selected Month:', month);
  
    const fetchDayActivity = async () => {
      try {
        const result = await graphQLClient.request<{ getDayActivityHistory: any[] }>(
          GET_DAY_ACTIVITY_HISTORY,
          {
            patientCID: patientId,
            month,
            year,
          }
        );
    
        const activities = result?.getDayActivityHistory || [];
    
        // Step 1: Get all days in the month
        const daysInMonth = new Date(year, month, 0).getDate();
    
        // Step 2: Create a map of day -> activity
        const activityMap = new Map<number, { date: string; status: string }>();
        const unverified: string[] = [];
        const incomplete: string[] = [];
    
        activities.forEach(item => {
          const date = new Date(Number(item.date_));
          const day = date.getDate();
          const formatted = formatDateOnly(item.date_);
          const status = (item.isComplete ?? 'UNVERIFIED').toUpperCase();
    
          activityMap.set(day, { date: formatted, status });
    
          if (status === 'UNVERIFIED') unverified.push(formatted);
          if (status === 'INCOMPLETED') incomplete.push(formatted);
        });
    
        // Step 3: Determine missing days
        const missing: string[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
          if (!activityMap.has(d)) {
            const dateObj = new Date(year, month - 1, d); // month - 1 because JS Date months are 0-based
            missing.push(formatDateOnly(dateObj.getTime()));

          }
        }
    
        // Step 4: Count values for pie chart
        const statusCount = {
          MISSING: missing.length,
          UNVERIFIED: unverified.length,
          INCOMPLETED: incomplete.length,
          COMPLETED: activities.filter(item => item.isComplete === 'COMPLETED').length,
        };
    
        // Update states
        setMissingDays(missing);
        setUnverifiedDates(unverified);
        setIncompleteDates(incomplete);
    
        // Update Pie Chart
        setCircleData([
          { name: 'ไม่ได้ส่งวิดีโอ', value: statusCount.MISSING },
          { name: 'ยังไม่ตรวจสอบ', value: statusCount.UNVERIFIED },
          { name: 'ทานยาไม่ครบ', value: statusCount.INCOMPLETED },
          { name: 'ทานยาครบถ้วน', value: statusCount.COMPLETED },
        ]);
      } catch (error) {
        console.error('❌ Failed to fetch day activity:', error);
      }
    };
    
  
    fetchDayActivity();
  }, [patientId, selectedMonth]);

  //Get Color Blind & Side Effects
  useEffect(() => {
    if (!patientId || !selectedMonth) return;
  
    const [year, month] = selectedMonth.split("-").map(Number);
  
    const fetchSideEffectData = async () => {
      try {
        const [colorBlindRes, sideEffectRes] = await Promise.all([
          graphQLClient.request<{ getColorBlindHistory: { colorBlindDate: string }[] }>(
            GET_COLOR_BLIND_HISTORY,
            { patientCID: patientId, month, year }
          ),
          graphQLClient.request<{ getSideEffectHistory: { effectDate: string; effectDesc: string }[] }>(
            GET_SIDE_EFFECT_HISTORY,
            { patientCID: patientId, month, year }
          )
        ]);
  
        const colorBlindDates = colorBlindRes.getColorBlindHistory.map(cb =>
          formatDateOnly(cb.colorBlindDate)
        );
  
        const sideEffectDescriptions = sideEffectRes.getSideEffectHistory.map(se =>
          `${se.effectDesc}: ${formatDateOnly(se.effectDate)}`
        );
  
        setColorBlindList(colorBlindDates);
        setSideEffectList(sideEffectDescriptions);
  
        // Bar Chart
        const effectCounts: Record<string, number> = {};
        sideEffectRes.getSideEffectHistory.forEach(se => {
          if (se.effectDesc) {
            effectCounts[se.effectDesc] = (effectCounts[se.effectDesc] || 0) + 1;
          }
        });
  
        const barChartData = Object.entries(effectCounts).map(([name, value]) => ({ name, value }));
        if (colorBlindDates.length > 0) {
          barChartData.push({ name: "ตาบอดสี", value: colorBlindDates.length });
        }
  
        setBarData(barChartData);
  
      } catch (err) {
        console.error("❌ Failed to fetch side effects or color blindness data:", err);
      }
    };
  
    fetchSideEffectData();
  }, [patientId, selectedMonth]);  
  
  
  
  
  

  const handleMonthChange = (event: any) => {
    setSelectedMonth(event.target.value)
    // Trigger data reload for the selected month
    console.log('Selected Month:', event.target.value) // Log the selected month
    // You can now fetch the corresponding data based on the selected month
  }

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: '4px',
          }}
        >
          <Typography variant="body2">
            {`จำนวนครั้งที่เกิดอาการ : ${payload[0].value} ครั้ง`}
          </Typography>
        </Box>
      );
    }
  
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: '4px',
          }}
        >
          <Typography variant="body2">
            {`${payload[0].name} : ${payload[0].value} วัน`}
          </Typography>
        </Box>
      );
    }
  
    return null;
  };
  
  

  return (
    <Paper sx={{ minHeight: "90vh", padding: "28px", maxWidth: "1080px" }}>
      {/* Back Icon Button at the top-right corner with text */}
      <Box sx={{ position: "absolute", top: 16, right: 16, display: "flex", alignItems: "center" }}>
        <IconButton
          onClick={handleBackClick}
          aria-label="go-back"
          sx={{ color: "black", marginRight: 1 }} // Add margin to separate the icon and text
        >
          <ArrowBackIcon fontSize="large" />
        <Typography variant="h6" sx={{ color: "black" }}>ย้อนกลับ</Typography> {/* Text next to the icon */}
        </IconButton>
      </Box>
      {/* Month Selection */}
      <Box sx={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>เลือกเดือน</InputLabel>
          <Select
            value={selectedMonth}
            label="เลือกเดือน"
            onChange={handleMonthChange}
          >
            {/* Example months, you can generate this dynamically based on available data */}
            <MenuItem value="2025-01">มกราคม 2025</MenuItem>
            <MenuItem value="2025-02">กุมภาพันธ์ 2025</MenuItem>
            <MenuItem value="2025-03">มีนาคม 2025</MenuItem>
            <MenuItem value="2025-04">เมษายน 2025</MenuItem>
            {/* Add more months as needed */}
          </Select>
        </FormControl>
      </Box>
      {/* Patient's ID and Name at the top */}
      <Box sx={{ marginBottom: "20px" }}>
        {patientName ? (
          <Typography variant="h5">{`ชื่อ: ${patientName.Firstname} นามสกุล: ${patientName.Lastname}`}</Typography>
        ) : (
          <CircularProgress />
        )}
      </Box>

      {/* Container for Pie Charts */}
      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <Box sx={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
            <Pie data={circleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#88b7f4" stroke="#000" strokeWidth={3} label>
              {circleData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={['#000', '#f39c12', '#e74c3c', '#2ecc71'][index % 4]} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <Typography variant="h5" sx={{ marginTop: "8px" }}>ผลรายงานการกินยา</Typography>

          {/* Day Missing Section for Graph 1 */}
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>วันที่ไม่ได้ส่งวิดีโอ</Typography>
            {missingDays.map((day, index) => (
              <Typography key={index} variant="body1">{day}</Typography>
            ))}

            <Typography variant="h6" sx={{ marginTop: 3, marginBottom: 2 }}>วันที่ยังไม่ตรวจสอบ</Typography>
            {unverifiedDates.map((day, index) => (
              <Typography key={index} variant="body1">{day}</Typography>
            ))}

            <Typography variant="h6" sx={{ marginTop: 3, marginBottom: 2 }}>วันที่ทานยาไม่ครบ</Typography>
            {incompleteDates.map((day, index) => (
              <Typography key={index} variant="body1">{day}</Typography>
            ))}
          </Box>
        </Box>

        <Box sx={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip content={<CustomBarTooltip />} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="จำนวนครั้งที่เกิดอาการ" />
          </BarChart>
        </ResponsiveContainer>
          <Typography variant="h5" sx={{ marginTop: "8px" }}>ผลข้างเคียงที่เกิดขึ้น</Typography>

          {/* Side Effects Section for Graph 2 */}
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6" sx={{ marginBottom: 2 }}>วันที่เกิดตาบอดสี</Typography>
            {colorBlindList.map((day, index) => (
              <Typography key={index} variant="body1">ตาบอดสี: {day}</Typography>
            ))}

            <Typography variant="h6" sx={{ marginTop: 3, marginBottom: 2 }}>วันที่เกิดผลข้างเคียงอื่น</Typography>
            {sideEffectList.map((effect, index) => (
              <Typography key={index} variant="body1">{effect}</Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default PatientIdSummary
