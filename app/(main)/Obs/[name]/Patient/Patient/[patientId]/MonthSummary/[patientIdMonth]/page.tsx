'use client'

import { useState, useEffect } from 'react'
import { gql } from '@apollo/client'
import { GraphQLClientConnector } from '@/app/lib/API'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts'
import { Paper, Box, CircularProgress, Typography, IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Import the back arrow icon
import { useRouter, usePathname } from 'next/navigation'

// Example data for the Pie charts
const circleData1 = {
  data: [
    { name: 'Item 1', value: 26 },
    { name: 'Item 2', value: 4 }
  ]
}

const circleData2 = {
  data: [
    { name: 'Item 1', value: 20 },
    { name: 'Item 2', value: 20 },
    { name: 'Item 3', value: 20 },
    { name: 'Item 4', value: 20 },
    { name: 'Item 5', value: 20 }
  ]
}

function PatientIdSummary({ params }: { params: { userId: string, name: string } }) {
  const graphQLClient = GraphQLClientConnector()
  const router = useRouter()
  const pathname = usePathname()

  const [patientName, setPatientName] = useState<{ CID: string, Firstname: string, Lastname: string } | null>(null)

  // Fetch the patient’s name using the userId
  useEffect(() => {
    console.log("Patient ID from params:", params.userId);
    const fetchPatientName = async () => {
      try {
        const data = await graphQLClient.request<{ Userinfo: { CID: string, Firstname: string, Lastname: string }[] }>(`
          query GetPatientInfo($cid: String) {
            Userinfo(CID: $cid) {
              CID
              Firstname
              Lastname
            }
          }
        `, {
          cid: params.userId // Ensure this is the correct user ID for the query
        })
  
        if (data.Userinfo && data.Userinfo[0]) {
          setPatientName(data.Userinfo[0]) // Store the patient name
        }
      } catch (error) {
        console.error('Failed to fetch patient name:', error)
      }
    }
  
    fetchPatientName()
  }, [params.userId]) // Dependency on userId to fetch the correct data

  // Function to navigate back to the previous page
  const handleBackClick = () => {
    router.push(`/Obs/${params.name}/Patient/Patient/${params.userId}`); // Correct the navigation path
  }

  // Sample data for missing days and side effects
  const [missingDays, setMissingDays] = useState<string[]>([
    "Date 1 2 2025",
    "Date 1 2 2025",
    "Date 1 2 2025",
    "Date 1 2 2025",
    "Date D/M/Y"
  ])

  const [sideEffects, setSideEffects] = useState<string[]>([
    "Colorblind Date D/M/Y",
    "side effect A Date D/M/Y",
    "side effect B Date D/M/Y",
    "side effect C Date D/M/Y",
    "side effect D Date D/M/Y"
  ])
  // Verify that the correct userId is being passed
  console.log('Expected userId:', params.userId);

// Use this `params.userId` or a correct identifier to fetch data


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
        </IconButton>
        <Typography variant="h6" sx={{ color: "black" }}>Back to Previous</Typography> {/* Text next to the icon */}
      </Box>

      {/* Patient's ID and Name at the top */}
      <Box sx={{ marginBottom: "20px" }}>
        {patientName ? (
          <Typography variant="h5">{`ID: ${patientName.CID} - ${patientName.Firstname} ${patientName.Lastname}`}</Typography>
        ) : (
          <CircularProgress />
        )}
      </Box>

      {/* Container for Pie Charts */}
      <Box sx={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <Box sx={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={circleData1.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#88b7f4" stroke="#000" strokeWidth={3} label>
                <Cell fill="#88b7f4" />
                <Cell fill="#000" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Typography variant="h6" sx={{ marginTop: "8px" }}>ผลรายงานการกินยา</Typography>

          {/* Day Missing Section for Graph 1 */}
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h5" sx={{ marginBottom: 2 }}>วันที่ไม่ได้ทานยา</Typography>
            {missingDays.map((day, index) => (
              <Typography key={index} variant="body1">{day}</Typography>
            ))}
          </Box>
        </Box>

        <Box sx={{ width: "48%", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={circleData2.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#88b7f4" stroke="#000" strokeWidth={3} label>
                <Cell fill="#00bcd4" />
                <Cell fill="#6a1b9a" />
                <Cell fill="#8e24aa" />
                <Cell fill="#7b1fa2" />
                <Cell fill="#0d47a1" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Typography variant="h6" sx={{ marginTop: "8px" }}>ผลข้างเคียงที่เกิดขึ้น</Typography>

          {/* Side Effects Section for Graph 2 */}
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h5" sx={{ marginBottom: 2 }}>วันที่เกิดผลข้างเคียง</Typography>
            {sideEffects.map((effect, index) => (
              <Typography key={index} variant="body1">{effect}</Typography>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default PatientIdSummary
