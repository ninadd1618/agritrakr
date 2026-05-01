import React, { useState } from 'react';
import { Col, Container, Form, Row, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '@config/api';
import { Box } from '@mui/material';
import { TbMailFilled } from "react-icons/tb";
import { FaUser } from "react-icons/fa";
import { BiSolidLock } from "react-icons/bi";
import { CgPassword } from 'react-icons/cg';
import { InputField, PasswordInput, checkPassword } from './Utility';

export default function Register() {
  // Use Vite dev proxy (configured in vite.config.js) to reach backend
  const URL = "";
  const [perfPass, setPerfPass] = useState(false);  // State to check password strength
  const [matchPassword, setMatchPassword] = useState(false);  // State to check if passwords match
  const navigate = useNavigate();  // Hook to navigate to different routes
  const [obj, setObj] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    role: '',
    companyName: '',
    teamMembers: [
      { name: '', role: '' }
    ],
    password: '',
    CPassword: ''
  });  // State to manage form input values

  // Handle change for regular input fields
  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setObj({
      ...obj,
      [name]: value
    });
  };

  // Handle change for team member fields
  const handleTeamMemberChange = (index, event) => {
    const { name, value } = event.target;
    const updatedTeamMembers = [...obj.teamMembers];
    updatedTeamMembers[index][name] = value;
    setObj({
      ...obj,
      teamMembers: updatedTeamMembers
    });
  };

  // Add a new team member field
  const addTeamMember = () => {
    setObj({
      ...obj,
      teamMembers: [...obj.teamMembers, { name: '', role: '' }]
    });
  };

  // Remove a team member field
  const removeTeamMember = (index) => {
    const updatedTeamMembers = [...obj.teamMembers];
    updatedTeamMembers.splice(index, 1);
    setObj({
      ...obj,
      teamMembers: updatedTeamMembers
    });
  };

  // Handle change for the password field
  const handleOnSetPass = (event) => {
    const { name, value } = event.target;
    setObj({
      ...obj,
      [name]: value
    });
    const password = event.target.value;
    setPerfPass(checkPassword(password));  // Check if the password is strong
    if (password.length < 0) {
      setObj({
        ...obj,
        CPassword: ''
      });
    }
  };

  // Handle change for the confirm password field
  const handleCPassword = (event) => {
    const { name, value } = event.target;
    setObj({
      ...obj,
      [name]: value
    });
    setMatchPassword(value === obj.password);  // Check if passwords match
  };

  // Handle form submission
  const handleOnSubmit = async () => {
    if (!obj.firstname || !obj.lastname || !obj.username || !obj.email || !obj.role || !obj.password || !obj.CPassword) {
      alert('Please fill in all fields before registering.');
      return;
    }
    if (!matchPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      const teamMembersFiltered = (obj.role === 'Manager' || obj.role === 'Supervisor')
        ? obj.teamMembers.filter(tm => tm && tm.name && tm.role)
        : [];

      const payload = {
        fullName: `${obj.firstname} ${obj.lastname}`.trim(),
        username: obj.username,
        email: obj.email,
        password: obj.password,
        role: obj.role,
        companyName: obj.companyName || undefined,
        ...(teamMembersFiltered.length > 0 ? { teamMembers: teamMembersFiltered } : {})
      };

      await apiClient.post(`/api/v1/auth/register`, payload);
      console.log('Register Successfully');
      // Reset the form state after successful registration
      setObj({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        role: '',
        companyName: '',
        teamMembers: [
          { name: '', role: '' }
        ],
        password: '',
        CPassword: ''
      });
      setPerfPass(false);
      navigate('/login');  // Navigate to the login page
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Registration failed, please try again.';
      console.log('Register Error: ', error.response ? error.response.data : error.message);
      alert(msg);
    }
    console.log(obj);
  };

  // Define the options for team member roles based on the selected role
  const teamMemberOptions = obj.role === 'Manager' ? ['Supervisor', 'Operator'] : ['Operator'];

  return (
    <Container
      className="justify-content-center align-items-center"
      style={{
        height: 'auto',
        width: '500px',
        marginTop: '3%',
        borderRadius: '10px',
        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
        padding: '20px'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1>Sign Up</h1>
      </div>

      <Form>
        <Form.Group>
          <InputField icon={FaUser} type='text' placeholder="Enter first name *" name="firstname" value={obj.firstname} onChange={handleOnChange} />
        </Form.Group>
        <Form.Group>
          <InputField icon={FaUser} type='text' placeholder="Enter last name *" name="lastname" value={obj.lastname} onChange={handleOnChange} />
        </Form.Group>
        <Form.Group>
          <InputField icon={FaUser} type='text' placeholder="Enter username *" name="username" value={obj.username} onChange={handleOnChange} />
        </Form.Group>
        <Form.Group>
          <InputField icon={TbMailFilled} type='email' placeholder="Enter Email *" name="email" value={obj.email} onChange={handleOnChange} />
        </Form.Group>
        <Form.Group>
          <InputField icon={FaUser} type='text' placeholder="Company name (optional)" name="companyName" value={obj.companyName} onChange={handleOnChange} />
        </Form.Group>
        <Row style={{ marginBottom: '20px' }}>
          <Form.Group as={Col}>
            <Form.Label>Role</Form.Label>
            <Form.Select name="role" value={obj.role} onChange={handleOnChange}>
              <option value="">Select Role</option>
              <option value="Manager">Manager</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Operator">Operator</option>
            </Form.Select>
          </Form.Group>
        </Row>
        {(obj.role === 'Manager' || obj.role === "Supervisor") && obj.teamMembers.map((member, index) => (
          <Row key={index} style={{ marginBottom: '20px' }}>
            <Form.Group as={Col} md={6}>
              <Form.Label>Team Member Role</Form.Label>
              <Form.Select name="role" value={member.role} onChange={(event) => handleTeamMemberChange(index, event)}>
                <option value="">Select Role</option>
                {teamMemberOptions.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group as={Col} md={6}>
              <Form.Label>Team Member Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter name"
                name="name"
                value={member.name}
                onChange={(event) => handleTeamMemberChange(index, event)}
              />
              <Button variant="danger" onClick={() => removeTeamMember(index)} style={{ marginTop: '10px' }}>Remove</Button>
            </Form.Group>
          </Row>
        ))}
        {(obj.role === 'Manager' || obj.role === "Supervisor") && (
          <Button variant="secondary" onClick={addTeamMember} style={{ marginBottom: '20px' }}>Add Team Member</Button>
        )}
        <Box sx={{ padding: '10px' }}>
          <Form.Group>
            <PasswordInput
              placeholder='Enter password'
              value={obj.password}
              name='password'
              onChange={handleOnSetPass}
              disabled={false}
              indicator={perfPass}
              icon={BiSolidLock}
            />
          </Form.Group>
          <Form.Group style={{ marginTop: '10px' }}>
            <PasswordInput
              placeholder='Confirm password'
              value={obj.CPassword}
              name='CPassword'
              onChange={handleCPassword}
              indicator={matchPassword}
              disabled={!perfPass}
              icon={CgPassword}
            />
          </Form.Group>
        </Box>

        <Form.Group style={{ fontSize: '13px', marginTop: '10px' }}>
          <Form.Check type="checkbox" label="Accept the " />&nbsp;
          <u onClick={() => navigate('/tac')} style={{ color: '#0d6efd', cursor: 'pointer' }}>Terms and Conditions</u>
        </Form.Group>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <Button
            variant="primary"
            style={{
              borderRadius: '2rem',
              width: '140px',
              height: '46px',
              border: 'none',
              boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
            }}
            onClick={handleOnSubmit}
          >
            Register
          </Button>
        </div>
      </Form>
    </Container>
  );
}
