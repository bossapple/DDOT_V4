"use client";

import { useState } from "react";

import {
  Box,
  Tab,
  Tabs,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import { TabContext, TabPanel } from "@mui/lab";
import Image from "next/image";

import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import ButtonCompo from "./button";
import AddPatient from "./tabsPage/addPatient";
import AddStaff from "./tabsPage/addStaff";
import AddPillBox from "./tabsPage/addPillBox";
import PairPatientWithBox from "./tabsPage/pairPatientWithBox";
import ReturnPillbox from "./tabsPage/returnPillbox";

function TabsCompo({ role, adminCID }: { role: string, adminCID?: string | undefined }) {

  const [valueTab, setValueTab] = useState("ADD PATIENT");

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValueTab(newValue);
  };

  return (
    <>
      <Box sx={{ boxShadow: 1, borderRadius: "8px" }}>
        {role === "admin" ? (
          <TabContext value={valueTab}>
            <Box
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-evenly",
              }}
            >
              <Box sx={{ width: "100%" }}>
                <Tabs
                  value={valueTab}
                  onChange={handleChange}
                  variant="scrollable"
                  scrollButtons
                  allowScrollButtonsMobile
                >
                  <Tab
                    sx={{ flexGrow: 1, minHeight: "0" }}
                    label="เพิ่มผู้ป่วย"
                    value="ADD PATIENT"
                    icon={
                      <Image
                        src="/images/add-patient-icon.svg"
                        alt="patient"
                        width={24}
                        height={24}
                      />
                    }
                    iconPosition="start"
                  />
                  <Tab
                    sx={{ flexGrow: 1, minHeight: "0" }}
                    label="เพิ่มเจ้าหน้าที่"
                    value="ADD STAFF"
                    icon={
                      <Image
                        src="/images/add-staff-icon.svg"
                        alt="staff"
                        width={20}
                        height={20}
                      />
                    }
                    iconPosition="start"
                  />
                  <Tab
                    sx={{ flexGrow: 1, minHeight: "0" }}
                    label="เพิ่มกล่องยา"
                    value="ADD PILLBOX"
                    icon={
                      <Image
                        src="/images/add-pillbox-icon.svg"
                        alt="pillbox"
                        width={20}
                        height={20}
                      />
                    }
                    iconPosition="start"
                  />
                  <Tab
                    sx={{ flexGrow: 1, minHeight: "0" }}
                    label="จับคู่กล่องยา"
                    value="PARING"
                    icon={
                      <Image
                        src="/images/pairing-icon.svg"
                        alt="staff"
                        width={24}
                        height={24}
                      />
                    }
                    iconPosition="start"
                  />
                  <Tab
                    sx={{ flexGrow: 1, minHeight: "0" }}
                    label="คืนกล่องยา"
                    value="RETURN PILLBOX"
                    icon={
                      <Image
                        src="/images/return-pillbox-icon.svg"
                        alt="return pillbox"
                        width={18}
                        height={18}
                      />
                    }
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
            </Box>
            <TabPanel value="ADD PATIENT">
              <AddPatient />
            </TabPanel>
            <TabPanel value="ADD STAFF">
              <AddStaff adminCID={adminCID} />
            </TabPanel>
            <TabPanel value="ADD PILLBOX">
              <AddPillBox />
            </TabPanel>
            <TabPanel value="PARING">
              <PairPatientWithBox />
            </TabPanel>
            <TabPanel value="RETURN PILLBOX">
              <ReturnPillbox />
            </TabPanel>
          </TabContext>
        ) : (
          <TabContext value={valueTab}>
           <Box sx={{ width: "100%" }}>
                <Tabs
                  value={valueTab}
                  onChange={handleChange}
                  variant="scrollable"
                  scrollButtons
                  allowScrollButtonsMobile
                >
                  <Tab
                    sx={{ flexGrow: 1, minHeight: "0" }}
                    label="เพิ่มผู้ป่วย"
                    value="ADD PATIENT"
                    icon={
                      <Image
                        src="/images/add-patient-icon.svg"
                        alt="patient"
                        width={24}
                        height={24}
                      />
                    }
                    iconPosition="start"
                  />
                  <Tab
                    sx={{ flexGrow: 1, minHeight: "0" }}
                    label="เพิ่มกล่องยา"
                    value="ADD PILLBOX"
                    icon={
                      <Image
                        src="/images/add-pillbox-icon.svg"
                        alt="pillbox"
                        width={20}
                        height={20}
                      />
                    }
                    iconPosition="start"
                  />
                  <Tab
                    sx={{ flexGrow: 1, minHeight: "0" }}
                    label="จับคู่กล่องยา"
                    value="PARING"
                    icon={
                      <Image
                        src="/images/pairing-icon.svg"
                        alt="staff"
                        width={24}
                        height={24}
                      />
                    }
                    iconPosition="start"
                  />
                  <Tab
                    sx={{ flexGrow: 1, minHeight: "0" }}
                    label="คืนกล่องยา"
                    value="RETURN PILLBOX"
                    icon={
                      <Image
                        src="/images/return-pillbox-icon.svg"
                        alt="return pillbox"
                        width={18}
                        height={18}
                      />
                    }
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
            <TabPanel value="ADD PATIENT">
              <AddPatient />
            </TabPanel>
            <TabPanel value="ADD PILLBOX">
              <AddPillBox />
            </TabPanel>
            <TabPanel value="PARING">
              <PairPatientWithBox />
            </TabPanel>
            <TabPanel value="RETURN PILLBOX">
              <ReturnPillbox />
            </TabPanel>
          </TabContext>
        )}
      </Box>
    </>
  );
}

export default TabsCompo;
