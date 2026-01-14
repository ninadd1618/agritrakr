import React, { useEffect, useRef, useState } from "react";
import { Box, Grid, IconButton, Badge, styled, Typography } from "@mui/material";
import { DropButton } from "../pages/containts/index.js";
import { useSelector, useDispatch } from "react-redux";
import { Navbar as BootstrapNavbar } from "react-bootstrap";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Notification from "./Utility/Notification.jsx";
import { FaUserPlus, FaUser } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import barData from "../pages/api/barData.js";
import { logout } from "../../redux/authSlice";
import axios from "axios";

/* ================= STYLES (UNCHANGED) ================= */

const Icons = styled(Grid)`
  display: flex;
  align-items: right;
  float: right;
  margin-left: auto;

  @media (max-width: 700px) {
    max-width: 38%;
    height: 32px;
  }
`;

const Header = styled(Grid)`
  display: flex;
  width: 100%;
  margin-left: auto;
  align-content: center;
  margin-top: 0.3%;
  z-index: 1;

  @media (max-width: 480px) {
    margin-right: 0;
    width: 96% !important;
  }
`;

const Container = styled(Box)(({ isOpen }) => ({
  position: "fixed",
  display: "block",
  zIndex: 7,
  width: isOpen ? "87%" : "98%",
  "@media (max-width: 480px)": {
    width: "90% !important",
    height: "51px",
    marginLeft: "20px",
  },
}));

const TitleText = styled(Typography)`
  font-size: 28px;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

/* ================= COMPONENT ================= */

const Home = ({ isOpen }) => {
  const userData = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [miniData, setMiniData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const dropdownRef = useRef(null);
  const downNote = useRef(null);

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    try {
      await axios.post(
        "/api/v1/auth/logout",
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      dispatch(logout());
      navigate("/");
    }
  };

  /* ================= CLICK OUTSIDE (FIXED) ================= */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setVisible(false);
      }
      if (downNote.current && !downNote.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("click", handleClickOutside); // ✅ FIX
    return () =>
      document.removeEventListener("click", handleClickOutside);
  }, []);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await barData();
        setMiniData(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  /* ================= USER ================= */

  useEffect(() => {
    if (userData) {
      setUsername(userData.username);
    }
  }, [userData]);

  /* ================= MACHINE STATUS ================= */

  useEffect(() => {
    if (!miniData || JSON.stringify(miniData) === JSON.stringify(previousData))
      return;

    setPreviousData(miniData);

    const currentTime = new Date();
    const timestamp = new Date(miniData[0]?.timestamp);
    const durationMs = currentTime - timestamp;
    const isMachineDown = miniData[0]?.MdownS === 1;

    const hrs = Math.floor(durationMs / (1000 * 60 * 60));
    const mins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    setNotifications([
      {
        id: Date.now(),
        message: isMachineDown ? "Machine Down" : "Machine Running",
        duration: isMachineDown ? `${hrs} hr ${mins} min ago` : "",
        date: `${timestamp
          .getDate()
          .toString()
          .padStart(2, "0")}/${(timestamp.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${timestamp.getFullYear()}`,
      },
    ]);
  }, [miniData, previousData]);

  /* ================= UI ================= */

  return (
    <Container isOpen={isOpen} className="header">
      <BootstrapNavbar expand="lg">
        <Header container alignItems="center" justifyContent="space-between">
          <Grid item lg={10} md={8} sm={7} xs={7} sx={{ color: "#fff" }}>
            <TitleText>{userData?.companyName}</TitleText>
          </Grid>

          <Icons item lg={1} md={2} sm={4} xs={4} ref={dropdownRef}>
            {userData?.role === "Admin" && (
              <IconButton
                sx={{ color: "#1b5e20" }}
                onClick={() =>
                  navigate("setting", { state: { selectedItem: 2 } })
                }
              >
                <FaUserPlus />
              </IconButton>
            )}

            <IconButton sx={{ color: "#1b5e20" }} onClick={() => setVisible(p => !p)}>
              <FaUser />
            </IconButton>

            <IconButton
              sx={{ color: "#1b5e20" }}
              onClick={() => setShowNotifications(p => !p)}
            >
              <Badge badgeContent={notifications.length} color="error">
                {showNotifications ? (
                  <NotificationsActiveIcon sx={{ fontSize: 30 }} />
                ) : (
                  <NotificationsIcon sx={{ fontSize: 30 }} />
                )}
              </Badge>
            </IconButton>
          </Icons>
        </Header>
      </BootstrapNavbar>

      <DropButton
        username={username}
        show={visible}
        onLogout={handleLogout}
      />

      <div ref={downNote}>
        {showNotifications && (
          <Notification
            notifications={notifications}
            setNotifications={setNotifications}
          />
        )}
      </div>
    </Container>
  );
};

export default Home;
