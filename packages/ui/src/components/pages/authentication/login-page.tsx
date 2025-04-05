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
      message.error("Please enter email and password.");
      return;
    }

    setLoading(true);
    const secretKey = '4e8c6d1f3b5e0a9d2c7f4e8b1a3c5d9f6e2a7b0c4d8e1f3a5b9d6c2e7f2a9b3c';
    const encryptedPassword = CryptoJS.AES.encrypt(password, secretKey).toString();
    const loginData = new UserLoginModel(email, encryptedPassword);

    try {
      const response = await userService.loginUser(loginData);
      if (response.status && response.data?.accessToken) {
        message.success("Login successful!");
        localStorage.setItem("token", response.data.accessToken);
        localStorage.setItem("username", response.data.user?.username || "");
        localStorage.setItem("email", response.data.user?.email || "");
        localStorage.setItem("userId", response.data.user?.id || "");
        localStorage.setItem("profilePicture", response.data.user?.profilePicture || "");
        if (remember) {
          localStorage.setItem("rememberEmail", email);
        } else {
          localStorage.removeItem("rememberEmail");
        }
        window.dispatchEvent(new Event("storage"));
        navigate("/home", { replace: true });
      } else {
        message.error(response.internalMessage || "Invalid credentials.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      message.error("An error occurred. Please try again.");
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
      message.error("Password must be at least 8 characters with 2 lowercase, 1 uppercase, 1 number, and 1 special character.");
      return;
    }
    setLoading(true);
    try {
      const signupData = new CreateUserModel(username, email, password, profilePicture);
      const response = await userService.createUser(signupData);
      if (response.status) {
        message.success("Sign-up successful! Please log in.");
        setIsSignup(false);
        setEmail("");
        setPassword("");
        setUsername("");
        setProfilePicture("");
      } else {
        message.error(response.internalMessage || "Sign-up failed.");
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

    setLoading(true);
    try {
      const req = new EmailRequestModel(resetEmail);
      const response: CommonResponse = await userService.forgotPassword(req);

      if (response.status) {
        message.success("OTP sent to your email!");
        setForgotPasswordModal(false);
        setResetPasswordModal(true);
      } else {
        message.error(response.internalMessage || "Email not found.");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!resetEmail) {
      message.error("Please enter your email first in the forgot password modal.");
      setResetPasswordModal(false);
      setForgotPasswordModal(true);
      return;
    }

    setLoading(true);
    try {
      const req = new EmailRequestModel(resetEmail);
      const response: CommonResponse = await userService.forgotPassword(req);
      if (response.status) {
        message.success("OTP resent to your email!");
      } else {
        message.error(response.internalMessage || "Failed to resend OTP.");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !otp || !newPassword) {
      message.error("Please fill in all fields.");
      return;
    }

    const passwordRegex = /^(?=(.*[a-z]){2,})(?=(.*[A-Z]){1,})(?=(.*\d){1,})(?=(.*[@$!%*?&\#_\-\+\/]){1,})[A-Za-z\d@$!%*?&\#_\-\+\/]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      message.error("Password must be at least 8 characters with 2 lowercase, 1 uppercase, 1 number, and 1 special character.");
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
            <Form.Item label={<Text strong>Username</Text>} required>
              <Input prefix={<UserOutlined />} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
            </Form.Item>
          )}

          <Form.Item label={<Text strong>Email</Text>} required>
            <Input prefix={<MailOutlined />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
          </Form.Item>

          <Form.Item label={<Text strong>Password</Text>} required>
            <Input.Password prefix={<LockOutlined />} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete={isSignup ? "new-password" : "current-password"} />
          </Form.Item>

          {isSignup && (
            <div>
              <Upload beforeUpload={handleImageUpload} showUploadList={false}>
                <Button type="primary" icon={<UploadOutlined />}>Upload Profile Picture</Button>
              </Upload>
              {profilePictureName && (
                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Text>{profilePictureName}</Text>
                  <Tooltip title="Remove Image">
                    <CloseCircleOutlined onClick={handleRemoveImage} style={{ cursor: "pointer" }} />
                  </Tooltip>
                </div>
              )}
              {profilePicture && (
                <div style={{ marginTop: "10px" }}>
                  <img src={profilePicture} alt="Preview" style={{ width: "60px", height: "60px", borderRadius: "50%" }} />
                </div>
              )}
            </div>
          )}

          <Form.Item>
            <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>Remember me</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" block htmlType="submit" loading={loading}>
              {isSignup ? "Sign Up" : "Sign In"}
            </Button>
          </Form.Item>
        </Form>

        <Text className="signup-text">
          {isSignup ? (
            <>Already have an account? <a onClick={() => setIsSignup(false)}>Sign in</a></>
          ) : (
            <>Don't have an account? <a onClick={() => setIsSignup(true)}>Sign up</a></>
          )}
        </Text>

        {!isSignup && (
          <div style={{ marginTop: "12px", textAlign: "center" }}>
            <a
              onClick={() => setForgotPasswordModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px", cursor: "pointer" }}
            >
              <QuestionCircleOutlined />
              Forgot Password?
            </a>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0 }}>Forgot Password</Title>}
        open={forgotPasswordModal}
        onCancel={() => setForgotPasswordModal(false)}
        footer={null}
        centered
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label={<Text strong>Email</Text>} required>
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </Form.Item>
          <Button type="primary" block onClick={handleForgotPassword} loading={loading}>
            Send OTP
          </Button>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title={<Title level={4} style={{ margin: 0 }}>Reset Password</Title>}
        open={resetPasswordModal}
        onCancel={() => setResetPasswordModal(false)}
        footer={null}
        centered
        width={400}
      >
        <Form layout="vertical">
          <Form.Item label={<Text strong>OTP</Text>} required>
            <Input
              placeholder="Enter the OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </Form.Item>
          <Form.Item label={<Text strong>New Password</Text>} required>
            <Input.Password
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Item>
          <Button type="primary" block onClick={handleResetPassword} loading={loading} style={{ marginBottom: "10px" }}>
            Reset Password
          </Button>
          <Button type="link" block onClick={handleResendOtp} disabled={loading}>
            Resend OTP
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default LoginPage;