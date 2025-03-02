import React, { useState } from "react";
import { Form, Input, Button, Typography, message, Upload } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, PictureOutlined, UploadOutlined } from "@ant-design/icons";
import { UserLoginModel, CreateUserModel, GlobalResponseObject } from "@in-one/shared-models"; // Import models
import "./login-page.css";
import { UserHelpService } from "../../../../../libs/shared-services/src/authentication/user-help-service";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false); // Toggle between Login & Signup
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState(""); // Optional profile picture URL
  const userService = new UserHelpService(); // Initialize user service
  const navigate = useNavigate();

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setProfilePicture(reader.result as string);
    }
}


const handleLogin = async () => {
  if (!email || !password) {
    message.error("Please enter email and password.");
    return;
  }

  setLoading(true);
  const loginData = new UserLoginModel(email, password);

  try {
    const response: GlobalResponseObject = await userService.loginUser(loginData);
    if (response.status) { // ✅ Use 'status' instead of 'success'
      message.success("Login successful!");
      
      // Storing token in localStorage
      localStorage.setItem("token", response.data.accessToken);
      
      // Set user data in localStorage or state
      const { username, email, id, profilePicture } = response.data.user;
      localStorage.setItem("username", username);
      localStorage.setItem("email", email);
      localStorage.setItem("userId", id);
      localStorage.setItem("profilePicture", profilePicture || "");

      console.log(response);

      navigate("/"); // Redirect to dashboard or app layout
    } else {
      message.error(response.internalMessage || "Invalid credentials.");
    }
  } catch (error) {
    message.error("An error occurred. Please try again.");
  } finally {
    setLoading(false);
  }
};

  
  const handleSignup = async () => {
    if (!email || !password || !username) {
      message.error("Please fill all required fields.");
      return;
    }
  
    setLoading(true);
    const signupData = new CreateUserModel(username, password, email, profilePicture);
  
    try {
      const response: GlobalResponseObject = await userService.createUser(signupData);
      if (response.status) { // ✅ Use 'status' instead of 'success'
        message.success("Signup successful! You can now log in.");
        setIsSignup(false); // Switch back to login mode
      } else {
        message.error(response.internalMessage || "Signup failed.");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
  

  return (
    <div className="login-container">
      {/* Left Section (80%) */}
      <div className="login-image-section"></div>

      {/* Right Section (20%) */}
      <div className="login-box">
        <div className="header-left">
          <div className="sidebar-logo">
            <div className="logo-circle">IN</div>
            <span className="logo-text">One</span> {/* White text ensured */}
          </div>
        </div>

        <Title level={3} className="text-center">
          {isSignup ? "Sign Up" : "Sign In"}
        </Title>

        <Form layout="vertical" onFinish={isSignup ? handleSignup : handleLogin}>
          {/* Username Field for Signup */}
          {isSignup && (
            <Form.Item label="Username" required>
              <Input
                prefix={<UserOutlined className="input-icon" />}
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </Form.Item>
          )}

          {/* Email Field */}
          <Form.Item label="Email" required>
            <Input
              prefix={<MailOutlined className="input-icon" />}
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </Form.Item>

          {/* Password Field */}
          <Form.Item label="Password" required>
            <Input.Password
              prefix={<LockOutlined className="input-icon" />}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </Form.Item>

          {/* Profile Picture URL Field (Optional) */}
          {isSignup && (
            <Form.Item label="Profile Picture (Optional)">
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

          {/* Submit Button */}
          <Form.Item>
            <Button type="primary" block htmlType="submit" loading={loading}>
              {isSignup ? "Sign Up" : "Sign In"}
            </Button>
          </Form.Item>
        </Form>

        {/* Toggle Between Sign In & Sign Up */}
        <Text className="signup-text">
          {isSignup ? (
            <>
              Already have an account? <a onClick={() => setIsSignup(false)}>Sign in</a>
            </>
          ) : (
            <>
              Don't have an account? <a onClick={() => setIsSignup(true)}>Sign up</a>
            </>
          )}
        </Text>
      </div>
    </div>
  );
};

export default LoginPage;
