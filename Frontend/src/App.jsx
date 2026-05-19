import { useEffect, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Console, Dashboard, Analytics, Report, Mould, Performance, Config, Login, TAC, RegisterCom, SoilDashboard } from './Components/pages';
import Register from './Components/pages/login-reg/Register';
import LandingPage from './Components/pages/LandingPage';
import ProtectedRoute from './Components/pages/ProtectedRoute';
import { useSelector } from 'react-redux';
import Filters from './Components/pages/Filters';
import MiniDashboard from './Components/pages/MiniDashboard/MiniDashboard';
import PageNotFound from './Components/pages/PageNotFond';
import Setting from './Components/pages/Settings/Setting';
import Pages from './Pages';
import Operator from './Components/pages/OperatorOption/Operator';
import Thresh from './Components/pages/Thresh/Thresh'
import Operators from "./Components/pages/Configuration/utility/Operator"
import QualityController from "./Components/pages/Configuration/utility/QualityController"
import Supervisor from "./Components/pages/Configuration/Supervisor"


function App() {
  const [isOpen, setIsOpen] = useState((window.innerHeight <= 400) ? false : true);
  const loginstate = useSelector((state) => state.auth.status);

  const toggleSidebar = () => {
    if (window.innerWidth > 600) {
      setIsOpen(!isOpen);
    } else {
      // Mobile: always toggle regardless
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 600) {
        // Phone: force close so hamburger menu takes over
        setIsOpen(false);
      } else if (window.innerWidth <= 900) {
        // Tablet (iPad Mini / iPad Air portrait): collapse to icon-only
        setIsOpen(false);
      }
    };

    // Check on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tac" element={<TAC />} />
        <Route path="/dashboard" element={<ProtectedRoute />} />
        {loginstate && (
          <Route
            path="/app"
            element={<Pages isOpen={isOpen} toggle={toggleSidebar} />}
          >
            {/* <Route path="dashboard" element={<Test />} /> */}
            <Route
              path="dashboard"
              element={<Dashboard isOpen={isOpen} toggle={toggleSidebar} />}
            />
            <Route
              path="register"
              element={<RegisterCom isOpen={isOpen} toggle={toggleSidebar} />}
            />
            <Route
              path="report"
              element={<Report isOpen={isOpen} toggle={toggleSidebar} />}
            />
            <Route
              path="config"
              element={<Config isOpen={isOpen} toggle={toggleSidebar} />}
            />
            <Route
              path="filters"
              element={<Filters isOpen={isOpen} toggle={toggleSidebar} />}
            />
            <Route
              path="miniDash"
              element={<MiniDashboard isOpen={isOpen} toggle={toggleSidebar} />}
            />
            <Route
              path="settings"
              element={<Setting isOpen={isOpen} toggle={toggleSidebar} />}
            />
            <Route
              path="Operator"
              element={<Operator isOpen={isOpen} toggle={toggleSidebar} />}
            />
            {/* <Route
              path="Thresh"
              element={<Thresh isOpen={isOpen} toggle={toggleSidebar}/>}
            /> */}

            {/* Below route is main configuration route */}
            <Route
              path="supervisor"
              element={<Supervisor isOpen={isOpen} toggle={toggleSidebar} />}
            />
            <Route
              path="operatorConfig"
              element={<Operators isOpen={isOpen} toggle={toggleSidebar} />}
            />
            <Route
              path="qualityc"
              element={<QualityController isOpen={isOpen} toggle={toggleSidebar} />}
            />

            <Route path="console" element={<Console />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="mould" element={<Mould />} />
            <Route
              path="soil"
              element={<SoilDashboard />} />
            <Route path="performance" element={<Performance />} />
          </Route>
        )}
        <Route path="*" element={<PageNotFound />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;
