import { Container } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { Box, styled } from '@mui/material';
import { FaUser } from "react-icons/fa";
import { BiSolidLock } from "react-icons/bi";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import apiClient from '@config/api';
import { login, logout } from '../../../redux/authSlice';
import { Popup } from '../containts';

//Icons
import { IoEyeOutline } from "react-icons/io5";
import { PiEyeClosedBold } from "react-icons/pi";


const EmailBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'active',
})(({ active }) => ({
    display: 'flex',
    boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px',
    borderRadius: '16px',
    alignItems: 'center',
    margin: '34px 11px 5px 7px !important',
    padding: '0px 1px 0px 11px',
    outline: active ? '2px solid rgb(163 163 163)' : 'none',
}));

function Login() {
    const [activeBox, setActiveBox] = useState(null);
    const [hidePass, setHidePass] = useState(true);
    const emailBoxRef = useRef(null);
    const navigate = useNavigate();
    const [obj, setObj] = useState({ email: '', password: '' });
    const [rememberMe, setRememberMe] = useState(false);
    const dispatch = useDispatch();
    const autoLoginTriedRef = useRef(false);

    const [toast, setToast] = useState(false);
    const [alert, setAlert] = useState(false);
    const [error, setError] = useState(false);

    const togglePasswordVisibility = () => {
        setHidePass(!hidePass);
    };

    //<--------Tost Timmer section 
    useEffect(() => {
        const interval = setInterval(() => {
            setToast(false);
        }, 3000);
        return () => clearInterval(interval);
    }, [toast]);



    const handleEmailChange = (event) => {
        setObj({ ...obj, email: event.target.value });
    };

    const handlePasswordChange = (event) => {
        setObj({ ...obj, password: event.target.value });
    };

    const performLogin = async (credentials, isAuto = false, shouldRemember = rememberMe) => {
        try {
            const result = (await apiClient.post(`/api/v1/auth/login`, credentials)).data;
            dispatch(login({ userData: result.data?.user, role: result.data.user?.role }));
            if (!isAuto) {
                // Successful manual login re-enables future auto-login.
                localStorage.removeItem('disableAutoLogin');
            }
            if (shouldRemember) {
                localStorage.setItem('rememberedEmail', credentials.email);
                localStorage.setItem('rememberedPassword', credentials.password);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
            }
            if (!isAuto) setToast(true)
            navigate('/app/Dashboard');
            setObj({ email: '', password: '' });

        } catch (error) {
            if (!isAuto) {
                setToast(true);
                setAlert(true);
                setError(true)
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
                setRememberMe(false);
            }
            console.error('Login error: ', error?.response?.data || error);
        }
    };

    //<--------handle BropButton---------->
    useEffect(() => {

        dispatch(logout())
        const rememberedEmail = localStorage.getItem('rememberedEmail') || '';
        const rememberedPassword = localStorage.getItem('rememberedPassword') || '';
        const hasRememberedCredentials = rememberedEmail && rememberedPassword;
        const disableAutoLogin = localStorage.getItem('disableAutoLogin') === '1';

        if (hasRememberedCredentials) {
            const rememberedObj = { email: rememberedEmail, password: rememberedPassword };
            setObj(rememberedObj);
            setRememberMe(true);
            if (!disableAutoLogin && !autoLoginTriedRef.current) {
                autoLoginTriedRef.current = true;
                performLogin(rememberedObj, true, true);
            }
        }

        const handleClickOutside = (event) => {
            if (emailBoxRef.current && !emailBoxRef.current.contains(event.target)) {
                setActiveBox(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };


    }, []);
    //<-----------Handle Login------------->
    const handleLogin = async () => {
        await performLogin(obj, false);
    };

    return (
        <Container className="justify-content-center align-items-center"
            style={{
                height: 'auto',
                width: '400px',
                marginTop: '10%',
                borderRadius: '10px',
                boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px'
            }}>
            <div style={{ textAlign: 'center', padding: '15px 0px 0px 0px' }}>
                <h1>Welcome!</h1>
            </div>
            {/**<------------Toast-----------> */}
            {toast && (
                <div
                    style={{
                        zIndex: 10,
                        position: "fixed",
                        right: "0px",
                        marginTop: "-9%",
                    }}
                >
                    <Popup
                        setToast={setToast}
                        alert={alert}
                        subMesg={error ? "Invalid credentials" : "Login Successful"}
                        backgroundColor="red" // Pass error message conditionally
                    />
                </div>
            )}
            {/*<------------Form-------------> */}
            <Form style={{ margin: '8% 13px 11px 14px' }} className="justify-content-center align-items-center">
                <Form.Group className="my-3" controlId="formGroupEmail">
                    <EmailBox ref={emailBoxRef} active={activeBox === 1} onClick={() => setActiveBox(1)}>
                        <FaUser style={{ fontSize: '16px', textAlign: 'center', marginRight: '9px' }} />
                        <input
                            type='email'
                            placeholder='Enter email'
                            value={obj.email}
                            onChange={handleEmailChange}
                            style={{
                                border: 'none',
                                height: '41px',
                                width: '95%',
                                borderRadius: '16px',
                                outline: 'none'
                            }}
                        />
                    </EmailBox>
                </Form.Group>
                <Form.Group className="mt-4" controlId="formGroupPassword">
                    <EmailBox active={activeBox === 2} onClick={() => setActiveBox(2)}>
                        <BiSolidLock style={{ fontSize: '20px', textAlign: 'center', marginRight: '9px' }} />
                        <input
                            type={hidePass ? 'password' : 'text'}
                            placeholder='Enter password'
                            value={obj.password}
                            onChange={handlePasswordChange}
                            style={{
                                border: 'none',
                                height: '41px',
                                width: '95%',
                                borderRadius: '16px',
                                outline: 'none'
                            }}
                        />
                        {
                            hidePass ?
                                <PiEyeClosedBold style={{ fontSize: '20px', marginRight: '2%' }} onClick={togglePasswordVisibility} />
                                :
                                <IoEyeOutline style={{ fontSize: '20px', marginRight: '2%' }} onClick={togglePasswordVisibility} />
                        }
                    </EmailBox>
                    <div style={{ display: 'flex', margin: '10px', fontSize: '13px' }}>
                        <Form.Check
                            label="Remember me"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <p style={{ float: 'right', marginLeft: 'auto' }}>Forgot password?</p>
                    </div>
                </Form.Group>
            </Form>

            {/*<---------Footer---------> */}
            <div style={{ padding: '2px 0px 7px 0px' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button className='bg-neutral-200 hover:bg-neutral-400' style={{
                        borderRadius: '2rem',
                        width: '140px',
                        height: '46px',
                        border: 'none',
                        boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px'
                    }} onClick={handleLogin}>Login</button>
                </div>
                <div className='d-flex justify-content-center mt-3 text-sm'>
                    Don't have an account? &nbsp; <p className='text-sky-500 hover:text-sky-600 hover:font-semibold' onClick={() => navigate('/register')} style={{ cursor: 'pointer' }}> Create</p>
                </div>
                <div className='text-center text-sm' style={{ padding: '11px 0px' }}>
                    <div className='d-flex justify-content-center mt-2'>
                        <div style={{ display: 'flex' }}>
                            <img className='me-2' src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                                alt="facebook" style={{ height: '23px', margin: '3px' }} />
                            <img className='me-1' src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                                alt="Google" />
                            <img className='me-2' src="https://upload.wikimedia.org/wikipedia/commons/a/ae/Github-desktop-logo-symbol.svg" alt="github" style={{ height: '28px' }} />
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
}

export default Login;
