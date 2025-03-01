// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Button, Typography, Input, message, Spin } from 'antd';
// import { UserLoginModel, CreateUserModel } from '@in-one/shared-models';
// import './login-page.css';
// import logo from '../../../assets/images/chat.png';
// import { UserHelpService } from '../../../../../libs/shared-services/src/authentication/user-help-service';

// const { Title, Text } = Typography;

// const LoginPage: React.FC = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [username, setUsername] = useState('');
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [isSignup, setIsSignup] = useState(false);
//   const navigate = useNavigate();
//   const userService = new UserHelpService();

//   const handleAuth = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       if (isSignup) {
//         const createUserDto: CreateUserModel = { username, password, profilePicture };
//         const response = await userService.createUser(createUserDto);
        
//         if (response === true) {
//           message.success('Signup successful! Please log in.');
//           setIsSignup(false);
//         } else {
//           setError(response.status || 'Signup failed. Please try again.');
//           message.error(response.staus || 'Signup failed. Please try again.');
//         }
//       } else {
//         const userLoginDto: UserLoginModel = { email, password };
//         const response = await userService.loginUser(userLoginDto);
        
//         if (response.success) {
//           localStorage.setItem('userId', response.data.id);
//           localStorage.setItem('username', response.data.username);
//           navigate('/home/welcome');
//         } else {
//           setError(response.message || 'Login failed. Please try again.');
//           message.error(response.message || 'Login failed. Please try again.');
//         }
//       }
//     } catch (err) {
//       setError('An error occurred. Please try again.');
//       message.error('An error occurred. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-container">
//       <div className="left-side">
//         <img src={logo} alt="Logo" className="logo" />
//         <Title level={2} className="login-title">{isSignup ? 'Sign Up' : 'Welcome to Connect'}</Title>
//         {error && <Text type="danger" className="error-text">{error}</Text>}
//         {isSignup && (
//           <Input 
//             placeholder="Username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             className="login-input"
//           />
//         )}
//         <Input 
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="login-input"
//         />
//         <Input.Password
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="login-input"
//         />
//         <Button className="login-btn" onClick={handleAuth} disabled={loading}>
//           {loading ? <Spin size="small" /> : isSignup ? 'Sign Up' : 'Login'}
//         </Button>
//         <Text className="toggle-text" onClick={() => setIsSignup(!isSignup)}>
//           {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
//         </Text>
//         <Text className="terms-text">
//           By signing in, you agree to our <a href="#">Terms & Privacy Policy</a>.
//         </Text>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;
