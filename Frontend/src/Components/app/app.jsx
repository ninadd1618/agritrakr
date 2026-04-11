import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from '../Navbar/SideBar';
import { Analytics, Config, Console, Dashboard, Mould, Product, Report } from '../pages';
import Supervisor from '../pages/Configuration/Supervisor';
import Operator from '../pages/Configuration/utility/Operator';
import QualityController from '../pages/Configuration/utility/QualityController';



function WApp() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsOpen(false);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const sidebarWidth = isMobile ? 0 : (isOpen ? 240 : 64);

  return (
    <BrowserRouter>
      <div className='app-shell'>
        <Sidebar isOpen={isOpen} toggle={toggleSidebar} isMobile={isMobile} />
        <div
          className='app-content'
          style={{
            marginLeft: `${sidebarWidth}px`,
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard isOpen={isOpen} toggle={toggleSidebar} isMobile={isMobile} />} />
            <Route path="/dashboard" element={<Dashboard isOpen={isOpen} toggle={toggleSidebar} isMobile={isMobile} />} />
            <Route path="/console" element={<Console />} />
            <Route path="/report" element={<Report  isOpen={isOpen}/>} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/mould" element={<Mould />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/product" element={<Product />} />
            <Route path="/supervisor" element={<Supervisor  isOpen={isOpen} toggle={toggleSidebar} />} />
            {/* <Route path="/configuration" element={<Config  isOpen={isOpen} toggle={toggleSidebar} />} /> */}
            <Route path="/operatorConfig" element={<Operator  isOpen={isOpen} toggle={toggleSidebar} />} />
            <Route path="/qualityc" element={<QualityController  isOpen={isOpen} toggle={toggleSidebar} />} />
          </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter >
  )
}

export default WApp
