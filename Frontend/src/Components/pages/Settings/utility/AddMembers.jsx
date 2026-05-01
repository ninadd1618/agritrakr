import { Box, Button, Grid, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { InputField, PasswordInput, checkPassword } from '../../login-reg/Utility';
import apiClient from '@config/api';
//icons
import { TbMailFilled } from "react-icons/tb";
import { FaUser } from "react-icons/fa";
import { BiSolidLock } from "react-icons/bi";
import { CgPassword } from 'react-icons/cg';
import { FaUserEdit } from "react-icons/fa";
import { useSelector } from 'react-redux';
//componets_Style
const Component = styled(Box)`
height: auto;
width:63%;
margin-left: 8%;
border-radius: 10px;
box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
padding: 20px
`



const RoleField = styled(Box)`
margin-top:2%;
`
const Select = styled('select')`
    margin-top: 2%;
    height:25px;
    text-align: center;
    border-radius: 7px;
    width: 38%;
    box-shadow: rgb(100 100 111 / 28%) 0px 7px 29px 0px;
    background-color: #ffffff87;

`
const TeamField = styled(Box)`
margin-top:3%;
`
const AddBtn = styled('button')`
margin-bottom:0px !important;
  background-color: #ffff;
  border-radius:10px;
  border: 1px solid #7a7acb;
  display:flex;
  &:hover {
    background-color: #5353f9;
  }
`;
const DeletBtn = styled('button')`
    background-color: #ffff;
    border-radius: 10px;
    border: 1px solid #f11f0f;
    float:right;
     &:hover {
    background-color: #f11f0f;
    
  }
`
const PassField = styled(Grid)`
display:flex;
margin-top: 5%;

`


function AddMembers() {
    const URL = "http://172.104.242.7:3000";
    const [perfPass, setPerfPass] = useState(false);
    const [matchPassword, setMatchPassword] = useState(false);
    const navigate = useNavigate();
    const adminID = useSelector((state) => state.auth.userData._id);
    // console.log(adminID)
    const [obj, setObj] = useState({
        firstname: '',
        lastname: '',
        username: '',
        email: '',
        role: '',
        teamMembers: [
            { name: '', email: '', role: '' }
        ],
        password: '',
        CPassword: '',
        adminId:adminID
    });
    const teamMemberOptions = obj.role === 'Manager' ? ['Supervisor', 'Operator'] : ['Operator'];
    const handleOnChange = (event) => {
        const { name, value } = event.target;
        setObj({
            ...obj,
            [name]: value
        });
    };

    const handleTeamMemberChange = (index, event) => {
        const { name, value } = event.target;
        const updatedTeamMembers = [...obj.teamMembers];
        updatedTeamMembers[index][name] = value;
        setObj({
            ...obj,
            teamMembers: updatedTeamMembers
        });
    };

    const addTeamMember = () => {
        setObj({
            ...obj,
            teamMembers: [...obj.teamMembers, { name: '', email: '', role: '' }]
        });
    };

    const removeTeamMember = (index) => {
        const updatedTeamMembers = [...obj.teamMembers];
        updatedTeamMembers.splice(index, 1);
        setObj({
            ...obj,
            teamMembers: updatedTeamMembers
        });
    };

    const handleOnSetPass = (event) => {
        const { name, value } = event.target;
        setObj({
            ...obj,
            [name]: value
        });
        const password = event.target.value;
        setPerfPass(checkPassword(password));
        console.log(checkPassword(password))
        if (password.length < 0) {
            setObj({
                ...obj,
                CPassword: ''
            });
        }
    };

    const handleCPassword = (event) => {
        const { name, value } = event.target;
        setObj({
            ...obj,
            [name]: value
        });
        setMatchPassword(value === obj.password);
    };

    const handleOnSubmit = async () => {
        if (!obj.firstname ||!obj.lastname ||!obj.username || !obj.email || !obj.role || !obj.password || !obj.CPassword) {
            alert('Please fill in all fields before registering.');
            return;
        }
        if (!matchPassword) {
            alert('Passwords do not match.');
            return;
        }

        try {
            await apiClient.post('/api/v1/auth/register', obj);
            console.log('Register Successfully', obj);
            setObj({
                firstname: '',
                lastname: '',
                username: '',
                email: '',
                role: '',
                teamMembers: [
                    { name: '', email: '', role: '' }
                ],
                password: '',
                CPassword: ''
            });
            setPerfPass(false);
            // navigate('/login');
            alert('Registerd Successfully... please Login')
        } catch (error) {
            console.log('Register Error: ', error.response ? error.response.data : error.message);
            alert('Registration failed, please try again.');
        }
        console.log(obj);
    };


    return (
        <Component className="justify-content-center align-items-center">
            {/*<-------First , Lastname-------------> */}
            <Grid container columnSpacing={4}  >
                <Grid item lg={6} md={6} sm={6} xs={12}>
                    <Typography>Firstname</Typography>
                    <Box sx={{ margin: '10px 5px 0px  0px' }}>
                        <InputField icon={FaUserEdit} type='text' placeholder="Enter firstname *" name="firstname" value={obj.firstname} onChange={handleOnChange} />
                    </Box>
                </Grid>
                <Grid item lg={6} md={6} sm={6} xs={12}>
                    <Typography>Lastname</Typography>
                    <Box sx={{ margin: '10px 5px 0px  0px' }}>
                        <InputField icon={FaUserEdit} type='email' placeholder="Enter lastname *" name="lastname" value={obj.lastname} onChange={handleOnChange} />
                    </Box>
                </Grid>

            </Grid>
            {/*<---------usernmae, Email------------> */}
            <Grid container columnSpacing={4} sx={{ marginTop: '3%' }} >
                <Grid item lg={6} md={6} sm={6} xs={12}>
                    <Typography>Username</Typography>
                    <Box sx={{ margin: '10px 5px 0px  0px' }}>
                        <InputField icon={FaUser} type='text' placeholder="Enter username *" name="username" value={obj.username} onChange={handleOnChange} />
                    </Box>
                </Grid>
                <Grid item lg={6} md={6} sm={6} xs={12}>
                    <Typography>Email</Typography>
                    <Box sx={{ margin: '10px 5px 0px  0px' }}>
                        <InputField icon={TbMailFilled} type='email' placeholder="Enter Email *" name="email" value={obj.email} onChange={handleOnChange} />
                    </Box>
                </Grid>

            </Grid>
            {/*<------------Role---------> */}
            <RoleField>
                <Typography>Role</Typography>
                <Select name="role" value={obj.role} onChange={handleOnChange} style={{textAlign:'left'}}>
                    <option value="">Select Role</option>
                    <option value="Manager">Manager</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Operator">Operator</option>
                </Select>
            </RoleField>
            {/*<-------------Team Members---------> */}
            {(obj.role === 'Manager' || obj.role === "Supervisor") &&
                <TeamField>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Typography>Team Members</Typography>
                        {(obj.role === 'Manager' || obj.role === "Supervisor") && (
                            <AddBtn variant="secondary" onClick={addTeamMember} style={{ marginBottom: '20px' }}><Typography>+</Typography>&nbsp;Add</AddBtn>
                        )}

                    </Box>
                    {
                        obj.teamMembers.map((member, index) => (
                            <Box sx={{ display: 'inline-block', border: '1px solid grey', borderRadius: '9px', padding: "10px 13px 15px 15px", width: '80%', marginTop: '2%' }}>
                                <DeletBtn variant="danger" onClick={() => removeTeamMember(index)} style={{ marginTop: '10px' }}>Delete</DeletBtn>
                                <Typography sx={{ fontSize: '14px' }}>role </Typography>
                                <Select name="role" value={member.role} onChange={(event) => handleTeamMemberChange(index, event)} style={{textAlign:'left'}}>
                                    <option value="">Select Role</option>
                                    {teamMemberOptions.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </Select>
                                <Grid container columnSpacing={1}>
                                  <Grid item lg={6} md={6} sm={6} xs={12}sx={{ marginTop: '5%' }}>
                                        <Typography sx={{ fontSize: '14px' }}>Name</Typography>
                                        <input type="text"
                                            placeholder="Enter name"
                                            name="name"
                                            value={member.name}
                                            onChange={(event) => handleTeamMemberChange(index, event)}

                                            style={{
                                                borderRadius: '10px',
                                                borderColor: '#80808052',
                                                backgroundColor: '#ffff',
                                                padding: '2px 10px',
                                                marginTop: '2%'
                                            }} />
                                    </Grid>
                                    <Grid item lg={6} md={6} sm={6} xs={12}sx={{ marginTop: '5%' }}>
                                        <Typography sx={{ fontSize: '14px' }}>Email</Typography>
                                        <input type="text"
                                            placeholder="Enter email"
                                            name="email"
                                            value={member.email}
                                            onChange={(event) => handleTeamMemberChange(index, event)}

                                            style={{
                                                borderRadius: '10px',
                                                borderColor: '#80808052',
                                                backgroundColor: '#ffff',
                                                padding: '2px 10px',
                                                marginTop: '2%'
                                            }} />
                                    </Grid>
                                </Grid>

                            </Box>
                        ))
                    }

                </TeamField>

            }
            {/*<------------Password---------> */}
            <PassField container columnSpacing={4}>
                <Grid item lg={6} md={6} sm={6} xs={12}>
                    <Typography>Enter Password</Typography>
                    <PasswordInput
                        placeholder='Enter password'
                        value={obj.password}
                        name='password'
                        onChange={handleOnSetPass}
                        disabled={false}
                        indicator={perfPass}
                        icon={BiSolidLock}
                    />
                </Grid>
                <Grid item lg={6} md={6} sm={6} xs={12}>
                    <Typography>Confirm Password</Typography>
                    <PasswordInput
                        placeholder='Confirm password'
                        value={obj.CPassword}
                        name='CPassword'
                        onChange={handleCPassword}
                        indicator={matchPassword}
                        disabled={!perfPass}
                        icon={CgPassword}
                    />
                </Grid>

            </PassField>
            <div style={{ display: 'flex', justifyContent: 'left', marginTop: '5%   ' }}>
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
        </Component >
    )
}

export default AddMembers
