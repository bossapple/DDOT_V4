'use client'

import { useState } from 'react'
import { gql, useMutation } from '@apollo/client'

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
} from "@mui/material";

import ButtonCompo from "../button";

interface PairingType {
  patientCID: string
  boxID: string
}

function PairPatientWithBox() {

  const [openDialog, setOpenDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [pairingPatientBox, setPairingPatientBox] = useState<PairingType>({
    patientCID: '',
    boxID: '',
  })

  const [isEmpty, setIsEmpty] = useState({
    patientCID: false,
    boxID: false
  })

  const PAIRING = gql`
    mutation PairPatientWithBox($patientCid: String!, $boxId: String!) {
      pairPatientWithBox(patientCID: $patientCid, boxID: $boxId) {
        patientCID
        tbNumber
        daysTakenPill
        lastVisitedDate
        registeredBy
        boxID
      }
    }
  `

  const [pairing] = useMutation(PAIRING)

  const handleChange = (propertyName: string, value: string) => {
    setPairingPatientBox((prevPairing) => ({
      ...prevPairing,
      [propertyName]: value
    }))
  }

  const handlePairing = async (): Promise<void> => {
    if (validateField()) {
      try {
        await pairing({
          variables: {
            patientCid: pairingPatientBox.patientCID,
            boxId: pairingPatientBox.boxID,
          }
        })
        setOpenDialog(false)
        setOpenAlert(true)
        setAlertMessage('จับคู่สำเร็จ')
        setPairingPatientBox({
          patientCID: '',
          boxID: '',
        })
        console.log('Pairing successully')
      } catch (error: any) {
        setOpenDialog(false)
        setOpenAlert(true)
        setAlertMessage('ล้มเหลวในการจับคุ่')
        console.log(`Failed to pair patient with boxID: ${error.message}`)
      }
    }
  }

  const validateField = (): boolean => {
    let isValid = true;
  
    if (pairingPatientBox.patientCID === '') {
      setIsEmpty((prevIsEmpty) => ({
        ...prevIsEmpty,
        patientCID: true
      }));
      isValid = false;
    } else {
      setIsEmpty((prevIsEmpty) => ({
        ...prevIsEmpty,
        patientCID: false
      }));
    }
  
    if (pairingPatientBox.boxID === '') {
      setIsEmpty((prevIsEmpty) => ({
        ...prevIsEmpty,
        boxID: true
      }));
      isValid = false;
    } else {
      setIsEmpty((prevIsEmpty) => ({
        ...prevIsEmpty,
        boxID: false
      }));
    }
  
    return isValid;
  };
  

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleClose = () => {
    setOpenDialog(false)
  }

  const handleCloseAlert = (event: React.SyntheticEvent | Event, reason?: string) => {
    if(reason === 'clickaway') {
      return
    }
    setOpenAlert(false)
  }

  const handleCancel = () => {
    setPairingPatientBox({
      patientCID: '',
      boxID: '',
    })
  }

  return (
    <>
      <Snackbar
         anchorOrigin={{ vertical: "top", horizontal: "center" }}
         open={openAlert}
         autoHideDuration={5000}
         onClose={handleCloseAlert}
      >
        <Alert severity={alertMessage === 'จับคู่สำเร็จ' ? 'success' : 'error'}>
          {alertMessage}
        </Alert>
      </Snackbar>
      <Grid container>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>เลขบัตรประจำตัวประชาชนผู้ป่วย</Typography>
          <TextField
            label="กรอกเลขประจำตัวประชาชนผู้ป่วย"
            type='number'
            sx={{ maxWidth: 508, width: "100%" }}
            value={pairingPatientBox.patientCID}
            name='patientCID'
            onKeyPress={(event) => {
              const isNumeric = /^[0-9]*$/;
              if (!isNumeric.test(event.key)) {
                event.preventDefault();
              }
            }}
            onInput={(event) => {
              const inputValue = (event.target as HTMLInputElement).value;
              const sanitizedValue = inputValue.replace(/\D/g, ''); // Remove non-digit characters
              const maxLengthValue = sanitizedValue.slice(0, 13);
              (event.target as HTMLInputElement).value = maxLengthValue;
            }}
            onChange={(event) => handleChange(event.target.name, event.target.value)}
            error={isEmpty.patientCID}
            helperText={isEmpty.patientCID ? 'กรุณากรอกเลขบัตรประชาชนของผู้ป่วย' : ' '}
          />
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>รหัสกล่องยา</Typography>
          <TextField
            label="กรอกรหัสกล่องยา"
            inputProps={{ inputMode: 'numeric' }}
            sx={{ maxWidth: 508, width: "100%" }}
            value={pairingPatientBox.boxID}
            name='boxID'
            onChange={(event) => handleChange(event.target.name, event.target.value)}
            error={isEmpty.boxID}
            helperText={isEmpty.boxID ? 'กรุณากรอกรหัสกล่องยา' : ' '}
          />
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: "flex", gap: "16px" }}>
          <Button variant='contained' onClick={handleOpenDialog}>
            จับคู่กล่องยา
          </Button>
          <Button variant='outlined' onClick={handleCancel}>
            ยกเลิก
          </Button>
        </Grid>
      </Grid>
      <Dialog open={openDialog}>
        <DialogTitle>คุณต้องการจับคู่กล่องกับคนไข้หรือไม่</DialogTitle>
        <Box
          sx={{
            display: "flex",
            paddingLeft: "24px",
            paddingBottom: "20px",
          }}
        >
            <ButtonCompo handleClickOpen={handlePairing}/>
            <Box sx={{ marginLeft: '12px' }} />
            <ButtonCompo cancel={true} handleClickClose={handleClose} />
        </Box>
      </Dialog>
    </>
  )
}

export default PairPatientWithBox