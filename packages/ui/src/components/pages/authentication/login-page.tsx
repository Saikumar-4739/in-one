import React, { useState, useEffect } from "react";
import { Form, Input, Button, Checkbox, Typography, message, Upload, Modal } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, UploadOutlined } from "@ant-design/icons";
import { UserLoginModel, CommonResponse, EmailRequestModel, CreateUserModel } from "@in-one/shared-models";
import "./login-page.css";
import { useNavigate } from "react-router-dom";
import { UserHelpService } from "@in-one/shared-services";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(localStorage.getItem("rememberEmail") || "");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [remember, setRemember] = useState(localStorage.getItem("rememberEmail") ? true : false);
  const [profilePicture, setProfilePicture] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);

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
  };

  const handleLogin = async () => {
    if (!email || !password) {
      message.error("Please enter email and password.");
      return;
    }
  
    setLoading(true);
    const loginData = new UserLoginModel(email, password);
  
    try {
      const response: CommonResponse = await userService.loginUser(loginData);
  
      if (response.status && response.data?.accessToken) {
        message.success("Login successful!");
  
        // Store user details in localStorage
        localStorage.setItem("token", response.data.accessToken);
        localStorage.setItem("username", response.data.user?.username || "");
        localStorage.setItem("email", response.data.user?.email || "");
        localStorage.setItem("userId", response.data.user?.id || "");
        localStorage.setItem("profilePicture", response.data.user?.profilePicture || "");
  
        // Handle "Remember Me" feature
        if (remember) {
          localStorage.setItem("rememberEmail", email);
        } else {
          localStorage.removeItem("rememberEmail");
        }
  
        // Trigger authentication state update
        window.dispatchEvent(new Event("storage"));
  
        // Navigate to home page
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

    setLoading(true);

    try {
      const signupData = new CreateUserModel(username, email, password, profilePicture);
      const response: CommonResponse = await userService.createUser(signupData);
      if (response.status) {
        message.success("Sign-up successful! Please log in.");
        setIsSignup(false); // Switch back to login
        setEmail("");  // Reset fields
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

    try {
      const req = new EmailRequestModel(resetEmail); // Fix here
      const response: CommonResponse = await userService.forgotPassword(req);

      if (response.status) {
        message.success("Password reset link sent to your email.");
        setForgotPasswordModal(false);
        setResetEmail("");
      } else {
        message.error(response.internalMessage || "Email not found.");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
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
            <Input.Password prefix={<LockOutlined />} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" style={{ color: "black" }} />
          </Form.Item>

          {isSignup && (
            <Form.Item label="Profile Picture">
              <Upload
                beforeUpload={(file) => {
                  handleImageUpload(file);
                  return false;
                }}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
              {profilePicture && (
                <img src={profilePicture} alt="Preview" className="profile-preview" />
              )}
            </Form.Item>
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

        {/* <Text className="forgotPassoword-text">
          Click here to reset 😢.{" "}
          <a
            className="forgotPassoword-text"
            onClick={() => setForgotPasswordModal(true)}
          >
            Forgot Password?
          </a>
        </Text> */}
      </div>

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
          Reset Password
        </Button>
      </Modal>

    </div>
  );
};

export default LoginPage;
