import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { AddMembers, CropMaster, Members, UserDetails, UserProfile, FarmSettings } from './utility';
import DeviceSettings from './DeviceSettings';

const Component = styled(Box)`
  margin-top: 9%;
  margin-left: 1%;
  justify-content: center;
  height: auto;
  margin-bottom: 2% !important;

  @media (max-width: 768px) {
    margin-top: 72px;
    margin-left: 0;
    padding: 0 4px;
  }

  @media (max-width: 480px) {
    margin-top: 62px;
  }
`;

const Header = styled(Box)`
  margin: 3%;
  border-bottom: 2px solid lightgray;

  @media (max-width: 768px) {
    margin: 12px 12px 0 12px;
  }
`;

const MidSection = styled(Box)`
  margin: 3%;

  @media (max-width: 768px) {
    margin: 16px 12px;
  }
`;

/* Scrollable tab strip — hides scrollbar visually but remains functional */
const Navbar = styled(Box)`
  display: flex;
  gap: 30px;
  color: gray;
  margin-top: 2%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 6px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 600px) {
    gap: 18px;
    margin-top: 10px;
  }
`;

const NavItem = styled(Typography)`
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
  font-size: 15px;

  ${(props) => props.$isActive ? `
    color: #333;
    font-weight: 600;
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: #333;
    }
  `: ""}

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const navItems = ["User details", "Members", "Add Member", "Crop Master", "User Profile", "Farm Settings", "Device Settings"];

function Setting() {
  const location = useLocation();
  const initialSelectedItem = navItems[location.state?.selectedItem] || navItems[0];

  const [selectedItem, setSelectedItem] = useState(initialSelectedItem);

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  return (
    <Component>
      <Header>
        <Typography sx={{ fontSize: { xs: 22, sm: 30 }, fontWeight: 600 }}>Settings</Typography>
        <Navbar>
          {navItems.map((item, index) => (
            <NavItem
              key={index}
              $isActive={selectedItem === item}
              onClick={() => handleItemClick(item)}
            >
              {item}
            </NavItem>
          ))}
        </Navbar>
      </Header>
      <MidSection>
        {selectedItem === 'User details' && <UserDetails />}
        {selectedItem === 'Members' && <Members />}
        {selectedItem === 'Add Member' && <Box sx={{ justifyContent: 'center', display: 'flex' }}><AddMembers /></Box>}
        {selectedItem === 'Crop Master' && <CropMaster />}
        {selectedItem === 'User Profile' && <UserProfile />}
        {selectedItem === 'Farm Settings' && <FarmSettings />}
        {selectedItem === 'Device Settings' && <DeviceSettings />}
      </MidSection>
    </Component>
  );
}

export default Setting;
