import { Button } from "@mui/material";

function ButtonCompo({
  cancel,
  handleClickOpen,
  handleClickClose,
}: {
  cancel?: boolean;
  handleClickOpen? : () => void;
  handleClickClose?: () => void
}) {
  return cancel ? (
    <Button
      variant="outlined"
      sx={{
        padding: "8px 24px",
        maxWidth: "104px ",
        width: "100%"
      }}
      onClick={handleClickClose}
    >
      ยกเลิก
    </Button>
  ) : (
    <Button
      variant="contained"
      sx={{
        padding: "8px 24px",
        maxWidth: "104px ",
        width: "100%"
      }}
      onClick={handleClickOpen}
    >
      บันทึก
    </Button>
  );
}

export default ButtonCompo;
