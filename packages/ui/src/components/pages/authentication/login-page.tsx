import React, { useState, useEffect } from "react";
import { Form, Input, Button, Checkbox, Typography, message, Upload } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, UploadOutlined } from "@ant-design/icons";
import { UserLoginModel, CommonResponse } from "@in-one/shared-models";
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
      if (response.status) {
        message.success("Login successful!");
        localStorage.setItem("token", response.data.accessToken);
        localStorage.setItem("username", response.data.user.username);
        localStorage.setItem("email", response.data.user.email);
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("profilePicture", response.data.user.profilePicture || "");

        if (remember) {
          localStorage.setItem("rememberEmail", email);
        } else {
          localStorage.removeItem("rememberEmail");
        }

        navigate("/");
      } else {
        message.error(response.internalMessage || "Invalid credentials.");
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

        <Form layout="vertical" onFinish={handleLogin}>
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
      </div>
    </div>
  );
};

export default LoginPage;
