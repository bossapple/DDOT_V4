import { useState, useContext } from 'react'
import { DataGrid, GridCellParams, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation'

import {
  Box,
} from '@mui/material'

import { ThemeContext } from '@/app/(main)/shareContext';

import { UserInfoType } from '@/app/(main)/Admin/[name]/Obs/page';
import { ColumnType } from '@/app/constants/admin/adminDataGrid';
// interface DataGridTableType {
//   handleOnCellClick: (params: GridCellParams) => void;
//   row: Array<{ CID: number; firstName: string; lastName: string; gender: string; dob: string; role: string; province: string }>
// }

interface DataGridTableType {
  handleOnCellClick? : (params: GridCellParams) => void,
  row: UserInfoType[],
  column: ColumnType[]
}

function DataGridTable({
  handleOnCellClick,
  row,
  column,
} : DataGridTableType) {

  const {
    searchData,
    applyFilter,
  } = useContext(ThemeContext)

  const router = useRouter()

  const mockUpRows = [
    { CID: 1, firstName: 'FN1', lastName: 'LN1', gender: 'หญิง', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 2, firstName: 'FN2', lastName: 'LN2', gender: 'ชาย', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 3, firstName: 'FN3', lastName: 'LN3', gender: 'หญิง', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 4, firstName: 'FN4', lastName: 'LN4', gender: 'ชาย', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 5, firstName: 'FN5', lastName: 'LN5', gender: 'หญิง', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 6, firstName: 'FN6', lastName: 'LN6', gender: 'อื่นๆ', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 7, firstName: 'FN7', lastName: 'LN7', gender: 'อื่นๆ', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 8, firstName: 'FN8', lastName: 'LN8', gender: 'ชาย', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 9, firstName: 'FN9', lastName: 'LN9', gender: 'ชาย', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 10, firstName: 'FN10', lastName: 'LN10', gender: 'ชาย', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 11, firstName: 'FN11', lastName: 'LN11', gender: 'ชาย', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 12, firstName: 'FN12', lastName: 'LN12', gender: 'ชาย', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 13, firstName: 'ชื่อเทส13', lastName: 'นามสกุล13', gender: 'ชาย', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
    { CID: 14, firstName: 'ชื่อเทส14', lastName: 'นามสกุล14', gender: 'ชาย', dob: '10/11/1234', role: 'เจ้าหน้าที่', province: 'กรุงเทพมหานคร' },
  ]

  const filteredRows = applyFilter
  ? row.filter((row) =>
      Object.values(row).some(
        (value) =>
          typeof value === 'string' && value.toLowerCase().includes(searchData.toLowerCase())
      )
    )
  : row;

  return (
    <Box
      sx={{
        width: '100%',
        mt: '36px',
        '& .super-app-theme--header': {
          backgroundColor: '#F4F5FA',
        },
      }}
    >
      <DataGrid
        rows={filteredRows}
        columns={column}
        rowSelection={false}
        // onCellClick={handleOnCellClick}
        getRowId={(row)=> row.CID}
      />
    </Box>
  )
}

export default DataGridTable;