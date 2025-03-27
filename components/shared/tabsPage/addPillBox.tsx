"use client";

import { useState, useEffect } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  Snackbar,
  Alert,
  InputAdornment,
} from "@mui/material";

import ButtonCompo from "../button";

interface AddPillBoxType {
  boxID: string;
  simNumber: string;
  pillboxStatus: string;
}

function AddPillBox() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [addPillBox, setAddPillBox] = useState<AddPillBoxType>({
    boxID: "",
    simNumber: "",
    pillboxStatus: "EMPTY",
  });
  const [isEmpty, setIsEmpty] = useState(false);
  const [boxIDError, setBoxIDError] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // Tracks if the user is typing

  const ADD_PILLBOX = gql`
    mutation AddPillbox($boxId: String!, $pillboxStatus: String) {
      addPillbox(boxID: $boxId, pillboxStatus: $pillboxStatus) {
        boxID
        localHospitalNumber
        startDate
        lastUpdate
        simNumber
        pillboxStatus
      }
    }
  `;

  const [addPillbox] = useMutation(ADD_PILLBOX);

  const handleAddpillbox = async () => {
    isValidateField();
    if (!isEmpty && !boxIDError) {
      try {
        await addPillbox({
          variables: {
            boxId: addPillBox.boxID,
            simNumber: addPillBox.simNumber,
            pillboxStatus: addPillBox.pillboxStatus,
          },
        });
        setAlertMessage("เพิ่มกล่องสำเร็จ");
        setOpenAlert(true);
        setOpenDialog(false);
        setAddPillBox({
          boxID: "",
          simNumber: "",
          pillboxStatus: "EMPTY",
        });
      } catch (error: any) {
        setAlertMessage("เพิ่มกล่องยาล้มเหลว");
        setOpenAlert(true);
        setOpenDialog(false);
        console.log(`Failed to add pillbox: ${error.message}`);
      }
    }
  };

  const handleChange = (propertyName: string, value: string) => {
    setAddPillBox((prevPillBox) => ({
      ...prevPillBox,
      [propertyName]: value,
    }));

    setIsTyping(true); // Mark user as typing

    if (propertyName === "boxID") {
      // Delay validation to wait until user stops typing
      setTimeout(() => {
        setIsTyping(false); // User has stopped typing
      }, 800);
    }
  };

  // Validate boxID after the user stops typing
  useEffect(() => {
    if (!isTyping) {
      const boxIDPattern = /^Pillbox\d{3}$/; // Must be "Pillbox" + 3 digits
      setBoxIDError(addPillBox.boxID !== "" && !boxIDPattern.test(addPillBox.boxID));
    }
  }, [isTyping, addPillBox.boxID]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseAlert = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenAlert(false);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const isValidateField = () => {
    if (addPillBox.boxID === "" || addPillBox.simNumber === "") {
      setIsEmpty(true);
    } else {
      setIsEmpty(false);
    }
  };

  const handleCancel = () => {
    setAddPillBox({
      boxID: "",
      simNumber: "",
      pillboxStatus: "EMPTY",
    });
  };

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={openAlert}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
      >
        <Alert severity={alertMessage === "เพิ่มกล่องสำเร็จ" ? "success" : "error"}>
          {alertMessage}
        </Alert>
      </Snackbar>

      <Grid container>
        {/* BoxID input eg. Pillbox001 */}
        <Grid item xs={12} md={12} mb={2} sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            label="กรอกรหัสกล่องยา"
            required
            name="boxID"
            sx={{ maxWidth: 508, width: "100%" }}
            value={addPillBox.boxID}
            onChange={(event) => handleChange(event.target.name, event.target.value)}
            error={!isTyping && boxIDError} // Show error only when user stops typing
            helperText={
              !isTyping && boxIDError
                ? "รูปแบบต้องเป็น PillboxXXX (XXX เป็นตัวเลข)"
                : ""
            }
            InputProps={{
              endAdornment: <InputAdornment position="end">📦 ตัวอย่าง: Pillbox001</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12} sx={{ textAlign: "center", my: 1 }}>
          <Typography variant="body2" color="textSecondary">
            โปรดกรอกรหัสชิปที่ถูกต้องเพื่อให้ระบบสามารถระบุอุปกรณ์ได้
          </Typography>
        </Grid>

        {/* simNumber input */}
        <Grid item xs={12} md={12} mb={2} sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            label="กรอกรหัสชิป"
            required
            name="simNumber"
            sx={{ maxWidth: 508, width: "100%" }}
            value={addPillBox.simNumber}
            // onInput={(event) => {
            //   const inputValue = (event.target as HTMLInputElement).value;
            //   const sanitizedValue = inputValue.replace(/\D/g, ''); // Remove non-digit characters
            //   const maxLengthValue = sanitizedValue.slice(0, 13);
            //   (event.target as HTMLInputElement).value = maxLengthValue;
            // }}
            onChange={(event) => handleChange(event.target.name, event.target.value)}
            error={isEmpty}
            helperText={isEmpty ? "กรุณาใส่รหัสชิป" : ""}
            InputProps={{
              endAdornment: <InputAdornment position="end">💾 ตัวอย่าง: 123456789</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12} md={6} sx={{ display: "flex", gap: "16px" }}>
          <Button variant="contained" onClick={handleOpenDialog}>
            เพิ่มกล่องยา
          </Button>
          <Button variant="outlined" onClick={handleCancel}>
            ยกเลิก
          </Button>
        </Grid>
      </Grid>

      <Dialog open={openDialog}>
        <DialogTitle>คุณต้องการจะเพิ่มกล่องนี้หรือไม่</DialogTitle>
        <Box sx={{ display: "flex", paddingLeft: "24px", paddingBottom: "20px" }}>
          <ButtonCompo handleClickOpen={handleAddpillbox} />
          <Box sx={{ marginLeft: "12px" }} />
          <ButtonCompo cancel={true} handleClickClose={handleClose} />
        </Box>
      </Dialog>
    </>
  );
}

export default AddPillBox;
