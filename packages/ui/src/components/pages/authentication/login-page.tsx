import React, { useState, useEffect } from "react";
import { Form, Input, Button, Checkbox, Typography, message, Upload, Modal, Tooltip } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, UploadOutlined, CloseCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { UserLoginModel, CommonResponse, EmailRequestModel, CreateUserModel, ResetPassowordModel } from "@in-one/shared-models";
import { useNavigate } from "react-router-dom";
import { UserHelpService } from "@in-one/shared-services";
import CryptoJS from 'crypto-js';
import "./login-page.css";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(localStorage.getItem("rememberEmail") || "");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [remember, setRemember] = useState(localStorage.getItem("rememberEmail") ? true : false);
  const [resetEmail, setResetEmail] = useState("");
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | undefined>(undefined);
  const [profilePictureName, setProfilePictureName] = useState<string | undefined>(undefined);

  const userService = new UserHelpService();
  const navigate = useNavigate();

  useEffect(() => {
    if (remember) {
      setEmail(localStorage.getItem("rememberEmail") || "");
    }
  }, []);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setProfilePicture(reader.result as string);
    setProfilePictureName(file.name);
    return false;
  };

  const handleRemoveImage = () => {
    setProfilePicture(undefined);
    setProfilePictureName(undefined);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      message.error('Please enter email and password.');
      return;
    }

    setLoading(true);
    const secretKey = '4e8c6d1f3b5e0a9d2c7f4e8b1a3c5d9f6e2a7b0c4d8e1f3a5b9d6c2e7f2a9b3c';
    const encryptedPassword = CryptoJS.AES.encrypt(password, secretKey).toString();
    const loginData = new UserLoginModel(email, encryptedPassword);

    try {
      const response: CommonResponse = await userService.loginUser(loginData);
      if (response.status && response.data?.accessToken) {
        message.success('Login successfully!');
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('username', response.data.user?.username || '');
        localStorage.setItem('email', response.data.user?.email || '');
        localStorage.setItem('userId', response.data.user?.id || '');
        localStorage.setItem('role', response.data.user?.role);
        if (remember) {
          localStorage.setItem('rememberEmail', email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        window.dispatchEvent(new Event('storage'));
        navigate('/home', { replace: true });
      } else {
        message.error(response.internalMessage);
      }
    } catch (error: any) {
      message.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !username) {
      message.error("Please fill in all fields.");
      return;
    }
    const passwordRegex = /^(?=(.*[a-z]){2,})(?=(.*[A-Z]){1,})(?=(.*\d){1,})(?=(.*[@$!%*?&\#_\-\+\/]){1,})[A-Za-z\d@$!%*?&\#_\-\+\/]{8,}$/;
    if (!passwordRegex.test(password)) {
      message.error("Invalid Password Format");
      return;
    }
    setLoading(true);
    try {
      const signupData = new CreateUserModel(username, email, password, profilePicture);
      const response = await userService.createUser(signupData);
      if (response.status) {
        message.success("Sign-up successfully! Please log in.");
        setIsSignup(false);
        setEmail("");
        setPassword("");
        setUsername("");
        setProfilePicture("");
      } else {
        message.error(response.internalMessage);
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      message.error("Please enter your email.");
      return;
    }

    try {
      const req = new EmailRequestModel(resetEmail);
      const response: CommonResponse = await userService.forgotPassword(req);

      if (response.status) {
        message.success("Reset Password Otp sent to your email.");
        setForgotPasswordModal(false);
        setResetPasswordModal(true);
      } else {
        message.error(response.internalMessage || "Email not found.");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !otp || !newPassword) {
      message.error("Please fill in all fields.");
      return;
    }

    const passwordRegex = /^(?=(.*[a-z]){2,})(?=(.*[A-Z]){1,})(?=(.*\d){1,})(?=(.*[@$!%*?&\#_\-\+\/]){1,})[A-Za-z\d@$!%*?&\#_\-\+\/]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      message.error("Invalid Password Format");
      return;
    }

    setLoading(true);
    try {
      const resetData = new ResetPassowordModel(resetEmail, otp, newPassword);
      const response: CommonResponse = await userService.resetPassword(resetData);

      if (response.status) {
        message.success("Password reset successful! Please log in.");
        setResetPasswordModal(false);
        setResetEmail("");
        setOtp("");
        setNewPassword("");
      } else {
        message.error(response.internalMessage || "Invalid OTP or reset failed.");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-image-section"></div>
      <div className="login-box">
        <div className="header-left">
          <div className="sidebar-logo">
            <div className="logo-circle">IN</div>
            <span className="logo-text">One</span>
          </div>
        </div>

        <Title level={3} className="text-center">{isSignup ? "Sign Up" : "Sign In"}</Title>

        <Form layout="vertical" onFinish={isSignup ? handleSignup : handleLogin}>
          {isSignup && (
            <Form.Item label="Username" required>
              <Input prefix={<UserOutlined />} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" style={{ color: "black" }} />
            </Form.Item>
          )}

          <Form.Item label="Email" required>
            <Input prefix={<MailOutlined />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" style={{ color: "black" }} />
          </Form.Item>

          <Form.Item label="Password" required>
            <Input.Password prefix={<LockOutlined />} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" style={{ color: "black" }} autoComplete={isSignup ? "new-password" : "current-password"} />
          </Form.Item>

          {isSignup && (
            <div style={{ textAlign: "left", padding: "10px" }}>
              <Upload beforeUpload={handleImageUpload} showUploadList={false}>
                <Button type="primary" icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>

              {profilePictureName && (
                <div style={{ marginTop: "10px", display: "flex", alignItems: "left", justifyContent: "left" }}>
                  <p style={{ fontSize: "14px", color: "#be92fc" }}>{profilePictureName}</p>
                  <Tooltip title="Remove Image">
                    <CloseCircleOutlined onClick={handleRemoveImage} style={{ fontSize: "18px", color: "#be92fc", cursor: "pointer" }} />
                  </Tooltip>
                </div>
              )}

              {profilePicture && (
                <div style={{ marginTop: "10px", position: "relative", display: "inline-block" }}>
                  <img
                    src={profilePicture}
                    alt="Preview"
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      border: "2px solid #ddd",
                      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
                      transition: "transform 0.2s ease-in-out",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                </div>
              )}
            </div>
          )}
          <Form.Item>
            <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>Remember me</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" block htmlType="submit" loading={loading}>{isSignup ? "Sign Up" : "Sign In"}</Button>
          </Form.Item>
        </Form>

        <Text className="signup-text">
          {isSignup ? (
            <>Already have an account? <a onClick={() => setIsSignup(false)}>Sign in</a></>
          ) : (
            <>Don't have an account? <a onClick={() => setIsSignup(true)}>Sign up</a></>
          )}
        </Text>
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          {!isSignup && (
            <a
              onClick={() => setForgotPasswordModal(true)}
              style={{
                color: '#8a2be2',
                fontSize: '12px',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              <QuestionCircleOutlined />
              Forgot Password?
              <span
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '0',
                  width: '0',
                  height: '2px',
                  backgroundColor: '#8a2be2',
                  transition: 'width 0.3s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.width = '100%')}
                onMouseOut={(e) => (e.currentTarget.style.width = '0')}
              />
            </a>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        title="Forgot Password"
        open={forgotPasswordModal}
        onCancel={() => setForgotPasswordModal(false)}
        footer={null}
        centered
        width={400}
      >
        <Input
          placeholder="Enter your email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          style={{ marginBottom: "15px" }}
        />
        <Button type="primary" block onClick={handleForgotPassword}>
          Send OTP
        </Button>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title="Reset Password"
        open={resetPasswordModal}
        onCancel={() => setResetPasswordModal(false)}
        footer={null}
        centered
        width={400}
      >
        <Input
          placeholder="Enter the OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{ marginBottom: "15px" }}
        />
        <Input.Password
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ marginBottom: "15px" }}
        />
        <Button type="primary" block onClick={handleResetPassword} loading={loading}>
          Reset Password
        </Button>
      </Modal>
    </div>
  );
};

export default LoginPage;
