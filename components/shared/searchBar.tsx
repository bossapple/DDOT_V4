import { Dispatch, SetStateAction, useContext } from "react";
import {
  Box,
  TextField,
  Typography,
  InputAdornment,
  Button,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

import { ThemeContext } from "@/app/(main)/shareContext";

function SearchBar() {
  const {
    handleSearchChange,
    handleSearchClick,
  } = useContext(ThemeContext)
  return (
    <Box>
      <TextField
        variant="outlined"
        onChange={handleSearchChange}
        sx={{
          "& input": {
            padding: "14px",
          },
          maxWidth: "600px",
          width: "100%",
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ width: "20px", height: "20px" }} />
            </InputAdornment>
          ),
        }}
      />
      <Button
        variant="outlined"
        onClick={handleSearchClick}
        sx={{ padding: "12px 32px", ml: "20px" }}>
        ค้นหา
      </Button>
    </Box>
  );
}

export default SearchBar;
