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
  InputAdornment,
} from "@mui/material";

import ButtonCompo from '../button';

interface ReturnPillboxType {
  patientCID: string
  boxID: string
  unpairDetail: string
}

function ReturnPillbox() {
  const [openDialog, setOpenDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [returnPillbox, setReturnPillbox] = useState<ReturnPillboxType>({
    patientCID: '',
    boxID: '',
    unpairDetail: '',
  })
  const [isEmpty, setIsEmpty] = useState({
    patientCID: false,
    boxID: false,
    unpairDetail: false,
  })

  const UNPAIR_PILLBOX = gql`
    mutation UnpairBox($patientCid: String!, $boxId: String!, $unpairDetail: String!) {
      unpairBox(patientCID: $patientCid, boxID: $boxId, unpairDetail: $unpairDetail) {
        unpairID
        patientCID
        boxID
        activityDate
        unpairDetail
      }
    }
  `
  const [unpairPillbox] = useMutation(UNPAIR_PILLBOX)

  const handleChange = (propertyName: string, value: string) => {
    setReturnPillbox((prevReturn) => ({
      ...prevReturn,
      [propertyName]: value
    }))
    setIsEmpty((prevIsEmpty) => ({
      ...prevIsEmpty,
      [propertyName]: false
    }));
  }

  const handleUnpairPillbox = async(): Promise<void> => {
    if(validateField()) {
      try {
        await unpairPillbox({
          variables: {
            patientCid: returnPillbox.patientCID,
            boxId: returnPillbox.boxID,
            unpairDetail: returnPillbox.unpairDetail,
          }
        })
        setAlertMessage('ยกเลิกการจับคู่สำเร็จ')
        setOpenAlert(true)
        setReturnPillbox({
          patientCID: '', 
          boxID: '',
          unpairDetail: ''
        })
      } catch(error: any) {
        console.log(`Failed to unapir pillbox: ${error.message}`)
        setAlertMessage('ล้มเหลวในการยกเลิกการจับคู่')
        setOpenAlert(true)
      }
    }
    setOpenDialog(false)
  }

  const validateField = () => {
    const newEmpty = {
      patientCID: returnPillbox.patientCID === '',
      boxID: returnPillbox.boxID === '',
      unpairDetail: returnPillbox.unpairDetail === ''
    }

    setIsEmpty(newEmpty)

    return Object.values(newEmpty).every((value) => !value);
  }

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
    setReturnPillbox({
      patientCID: '', 
      boxID: '',
      unpairDetail: ''
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
        <Alert severity={alertMessage === 'ยกเลิกการจับคู่สำเร็จ' ? 'success' : 'error'}>
          {alertMessage}
        </Alert>
      </Snackbar>
      <Grid container>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>เลขบัตรประจำตัวประชาชนผู้ป่วย</Typography>
          <TextField
            label="กรอกเลขประจำตัวประชาชนผู้ป่วย"
            sx={{ maxWidth: 508, width: "100%" }}
            name='patientCID'
            type='number'
            value={returnPillbox.patientCID}
            onChange={(event) => handleChange(event.target.name, event.target.value)}
            onInput={(event) => {
              const inputValue = (event.target as HTMLInputElement).value;
              const sanitizedValue = inputValue.replace(/\D/g, ''); // Remove non-digit characters
              const maxLengthValue = sanitizedValue.slice(0, 13);
              (event.target as HTMLInputElement).value = maxLengthValue;
            }}
            error={isEmpty.patientCID}
            helperText={isEmpty.patientCID ? 'กรุณากรอกเลขบัตรประชาชนผูเป่วย' : ' '}
          />
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>รหัสกล่องยา</Typography>
          <TextField
            label="กรอกรหัสเลขกล่องยา"
            sx={{ maxWidth: 508, width: "100%" }}
            name='boxID'
            value={returnPillbox.boxID}
            onChange={(event) => handleChange(event.target.name, event.target.value)}
            error={isEmpty.boxID}
            helperText={isEmpty.boxID ? 'กรุณากรอกรหัสเลขกล่องยา' : ' '}
            InputProps={{
              endAdornment: <InputAdornment position="end">📦 ตัวอย่าง: pb0001</InputAdornment>,
            }}
          />
        </Grid>
        <Grid item xs={12} md={12} mb={2}>
          <Typography mb={1}>สาเหตุการคืน</Typography>
          <TextField
            label="กรอกสาเหตุการคืน"
            sx={{ maxWidth: 508, width: "100%" }}
            name='unpairDetail'
            value={returnPillbox.unpairDetail}
            onChange={(event) => handleChange(event.target.name, event.target.value)}
            error={isEmpty.unpairDetail}
            helperText={isEmpty.unpairDetail ? 'กรุณากรอกสาเหตุการคืน' : ' '}
          />
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: "flex", gap: "16px" }}>
          <Button variant='contained' onClick={handleOpenDialog}>
            ยืนยัน
          </Button>
          <Button variant='outlined' onClick={handleCancel}>
            ยกเลิก
          </Button>
        </Grid>
      </Grid>
      <Dialog open={openDialog}>
        <DialogTitle>คุณต้องการยกเลิกการจับคู่หรือไม่</DialogTitle>
        <Box
          sx={{
            display: 'flex',
            paddingLeft: '24px',
            paddingBottom: '20px',
          }}
        >
          <ButtonCompo handleClickOpen={handleUnpairPillbox} />
          <Box sx={{ marginLeft: '12px' }}/>
          <ButtonCompo cancel={true} handleClickClose={handleClose}/> 
        </Box>
      </Dialog>
    </>
  )
}

export default ReturnPillbox