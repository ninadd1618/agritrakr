import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import Sidebar from './Components/Navbar/SideBar';
import Home from './Components/home/Home';
import { Outlet } from 'react-router-dom';

const PagesContainer = styled(Box)`
  display: flex;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
`;

const MainContent = styled(Box)(({ marginLeft }) => ({
  marginLeft: `${marginLeft}px`,
  flex: 1,
  transition: 'margin-left 0.3s ease',
  overflowX: 'hidden',
  width: '100%',
  boxSizing: 'border-box',
  '@media (max-width: 768px)': {
    marginLeft: '0px',
  },
}));

const HomeComponent = styled(Box)`
  width: 100%;
  box-sizing: border-box;
`;

const NestedComponent = styled(Box)`
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: #e8f5e8;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #66bb6a;
    border-radius: 10px;
    border: 3px solid #e8f5e8;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #4caf50;
  }

  @supports (-ms-overflow-style: none) {
    -ms-overflow-style: -ms-autohiding-scrollbar;
  }

  @media (max-width: 768px) {
    width: 100%;
  }
`;

function Pages({ isOpen, toggle }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate sidebar width based on state
  const sidebarWidth = isMobile ? 0 : (isOpen ? 240 : 64);

  return (
    <PagesContainer>
      <Sidebar isOpen={isOpen} toggle={toggle} isMobile={isMobile} />
      <MainContent marginLeft={sidebarWidth}>
        <HomeComponent>
          <Home isOpen={isOpen} />
        </HomeComponent>
        <NestedComponent>
          <Outlet />
        </NestedComponent>
      </MainContent>
    </PagesContainer>
  );
}

export default Pages;
