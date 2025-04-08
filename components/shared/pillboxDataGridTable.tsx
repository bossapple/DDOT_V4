import { useState, useContext } from 'react'
import { DataGrid, GridCellParams, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useRouter } from 'next/navigation'

import {
  Box,
} from '@mui/material'

import { ThemeContext } from '@/app/(main)/shareContext';

import { UserInfoType } from '@/app/(main)/Admin/[name]/Obs/page';
import { ColumnType } from '@/app/constants/admin/adminDataGrid';
import { Pillbox } from '@/app/(main)/Admin/[name]/Pillbox/page';
// interface DataGridTableType {
//   handleOnCellClick: (params: GridCellParams) => void;
//   row: Array<{ CID: number; firstName: string; lastName: string; gender: string; dob: string; role: string; province: string }>
// }

interface DataGridTableType {
  handleOnCellClick? : (params: GridCellParams) => void,
  row: Pillbox[],
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
        getRowId={(row)=> row.boxID}
      />
    </Box>
  )
}

export default DataGridTable;