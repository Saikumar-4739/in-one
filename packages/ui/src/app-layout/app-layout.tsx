import React, { useEffect, useState, useCallback } from "react";
import { Layout, Button, Spin, Avatar, Modal, Typography } from "antd";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ProjectOutlined,
    LineChartOutlined,
    DollarOutlined,
    PictureOutlined,
    CalendarOutlined,
    MessageOutlined,
    FileOutlined,
    BulbOutlined,
    NotificationOutlined,
    PoweroffOutlined,
    AppstoreAddOutlined,
    VideoCameraOutlined,
    GlobalOutlined,
    UserOutlined,
} from "@ant-design/icons";
import "./app-layout.css";
import { UserHelpService } from "@in-one/shared-services";

interface User {
    id: string;
    username: string;
    email: string;
    profilePicture?: string;
    status?: string;
    role?: string;
}

const { Content } = Layout;
const { Title, Text } = Typography;

const AppLayout: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const userService = new UserHelpService();
    const navigate = useNavigate();

    const logoutUser = useCallback(async () => {
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) throw new Error("User ID not found");
            await userService.logoutUser(userId);
            localStorage.clear();
            window.dispatchEvent(new Event("storage"));
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }, [navigate]);

    // useEffect(() => {
    //     const fetchUserDetails = async () => {
    //         const userId = localStorage.getItem("userId");
    //         if (!userId) return;
    //         setLoading(true);
    //         try {
    //             const response = await userService.getUserById({ userId });
    //             if (response.status && response.data) setUser(response.data);
    //         } catch (error) {
    //             console.error("Failed to fetch user details:", error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     fetchUserDetails();
    // }, []);

    // useEffect(() => {
    //     let blobUrl: string | null = null;
    //     if (user?.profilePicture) {
    //         try {
    //             const byteCharacters = atob(user.profilePicture);
    //             const byteNumbers = new Array(byteCharacters.length);
    //             for (let i = 0; i < byteCharacters.length; i++) {
    //                 byteNumbers[i] = byteCharacters.charCodeAt(i);
    //             }
    //             const byteArray = new Uint8Array(byteNumbers);
    //             const blob = new Blob([byteArray]);
    //             blobUrl = URL.createObjectURL(blob);
    //             setImageSrc(blobUrl);
    //         } catch (error) {
    //             console.error("Error converting Base64 to Blob:", error);
    //         }
    //     }
    //     return () => {
    //         if (blobUrl) {
    //             URL.revokeObjectURL(blobUrl);
    //         }
    //     };
    // }, [user?.profilePicture]);

    const navItems = [
        { key: "1", icon: <ProjectOutlined />, label: "HomePage", path: "/home" },
        { key: "1", icon: <ProjectOutlined />, label: "Dashboard", path: "/dashboard" },
        { key: "2", icon: <MessageOutlined />, label: "Chat", path: "/chat" },
        { key: "3", icon: <MessageOutlined />, label: "Groups", path: "/groups" },
        { key: "4", icon: <FileOutlined />, label: "Notes", path: "/notes" },
        { key: "5", icon: <CalendarOutlined />, label: "Calendar", path: "/calendar" },
        { key: "6", icon: <BulbOutlined />, label: "AI Bot", path: "/ai-bot" },
        { key: "7", icon: <VideoCameraOutlined />, label: "Videos", path: "/videos" },
        { key: "8", icon: <PictureOutlined />, label: "Photos", path: "/photos" },
        // { key: "9", icon: <DollarOutlined />, label: "Reels", path: "/reels" },
        { key: "9", icon: <LineChartOutlined />, label: "News", path: "/latest-news" },
        // { key: "10", icon: <GlobalOutlined />, label: "Tech", path: "/technology-news" },
        { key: "10", icon: <AppstoreAddOutlined />, label: "Plugins", path: "/plugins" },
    ];

    const navVariants = {
        hidden: { x: "-100%", opacity: 0, skewX: "20deg" },
        visible: { x: 0, opacity: 1, skewX: "0deg", transition: { type: "spring", stiffness: 100, damping: 15 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: (i: number) => ({
            opacity: 1,
            x: 0,
            transition: { delay: i * 0.1, duration: 0.3 },
        }),
    };

    return (
        <Layout className="app-layout">
            <motion.div
                className="custom-header"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onClick={() => setIsNavOpen(!isNavOpen)}
                whileHover={{ cursor: "pointer" }}
            >
                <div className="header-container">
                    <div className="header-circle">IN</div>
                    <Title level={3} className="header-title">One</Title>
                </div>
                <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Button
                        type="text"
                        icon={<PoweroffOutlined style={{ color: "#8a2be2" }} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            logoutUser();
                        }}
                        style={{
                            color: "#8a2be2",
                            fontWeight: "bold",
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "4px 12px",
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </motion.div>

            <AnimatePresence>
                {isNavOpen && (
                    <motion.div
                        className="side-nav"
                        variants={navVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                    >
                        <div className="nav-items">
                            {navItems.map((item, index) => (
                                <motion.div
                                    key={item.key}
                                    custom={index}
                                    variants={itemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="nav-item"
                                >
                                    <Link to={item.path} onClick={() => setIsNavOpen(false)}>
                                        <span className="nav-icon">{item.icon}</span>
                                        <span className="nav-label">{item.label}</span>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content with dynamic margin */}
            <Content
                className="content-container"
                style={{
                    marginLeft: isNavOpen ? "300px" : "0", // Match the side-nav width
                    transition: "margin-left 0.3s ease", // Smooth transition
                }}
            >
                {loading ? <Spin size="large" /> : <Outlet />}
            </Content>

            <Modal
                title={<Title level={4}>User Profile</Title>}
                open={isProfileModalVisible}
                onCancel={() => setIsProfileModalVisible(false)}
                centered
            >
                {loading ? (
                    <Spin tip="Loading user details..." />
                ) : user ? (
                    <div style={{ textAlign: "center" }}>
                        <Avatar src={imageSrc} size={100} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
                        <Text strong style={{ display: "block", fontSize: 18 }}>{user.username}</Text>
                        <Text type="secondary">{user.email}</Text>
                        <div style={{ marginTop: 16 }}>
                            <Text><strong>Status:</strong> {user.status || "Active"}</Text><br />
                            <Text><strong>Role:</strong> {user.role || "User"}</Text>
                        </div>
                    </div>
                ) : (
                    <Text type="danger">Unable to load user details.</Text>
                )}
            </Modal>
        </Layout>
    );
};

export default AppLayout;