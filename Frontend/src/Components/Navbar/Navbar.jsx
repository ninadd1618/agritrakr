import { Typography, Box, Grid } from "@mui/material";
import Datepicker from "../DateTimePicker/DatePicker";

const Navbar = ({ title = "Dashboard" }) => {
  return (
    <Grid
      container
      columnSpacing={2}
      alignItems="center"
      sx={{ width: "100%", flexWrap: "wrap" }}
    >
      {/* Page title */}
      <Grid item xs={12} sm={7} lg={7} sx={{ display: "flex", alignItems: "center" }}>
        <Typography
          style={{
            color: "#1b5e20",
            fontWeight: 800,
            marginLeft: "1rem",
            fontSize: "clamp(14px, 2vw, 20px)",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
      </Grid>

      {/* Date range picker */}
      <Grid
        item
        xs={12}
        sm={5}
        lg={5}
        sx={{
          display: "flex",
          justifyContent: { xs: "flex-start", sm: "flex-end" },
          alignItems: "center",
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            color: "#2e7d32",
            "& .ant-picker": {
              maxWidth: "100%",
            },
          }}
        >
          <Datepicker />
        </Box>
      </Grid>
    </Grid>
  );
};

export default Navbar;
