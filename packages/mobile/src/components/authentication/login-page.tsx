import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import Icon from 'react-native-vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import CryptoJS from 'crypto-js';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  SlideInUp,
} from 'react-native-reanimated';
import { UserHelpService } from '@in-one/shared-services';
import { UserLoginModel, CommonResponse, CreateUserModel, EmailRequestModel, ResetPassowordModel } from '@in-one/shared-models';

// Define navigation stack param list
type RootStackParamList = {
  Home: undefined;
  Login: undefined;
};

// Define navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 360;

// Dynamic sizing based on screen width
const inputWidth = Math.min(width * 0.9, 400);
const buttonHeight = isSmallScreen ? 48 : 52;
const fontSizeBase = isSmallScreen ? 14 : 16;
const modalWidth = Math.min(width * 0.85, 360);

const LoginScreen: React.FC = () => {
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');
  const [forgotPasswordModal, setForgotPasswordModal] = useState<boolean>(false);
  const [resetPasswordModal, setResetPasswordModal] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureName, setProfilePictureName] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<boolean>(false);

  const userHelpService = new UserHelpService();
  const navigation = useNavigation<NavigationProp>();

  // Animation values
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    const loadEmail = async (): Promise<void> => {
      try {
        const savedEmail = await AsyncStorage.getItem('rememberEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRemember(true);
        }
      } catch (error) {
        console.error('Failed to load email from storage:', error);
      }
    };
    loadEmail();
  }, []);

  const handleImageUpload = (): void => {
    launchImageLibrary({ mediaType: 'photo', includeBase64: true }, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        setSuccessModal(false);
      } else if (response.assets && response.assets[0]) {
        const asset: Asset = response.assets[0];
        setProfilePicture(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri || null);
        setProfilePictureName(asset.fileName || 'profile.jpg');
      }
    });
  };

  const handleRemoveImage = (): void => {
    setProfilePicture(null);
    setProfilePictureName(null);
  };

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      setSuccessModal(false);
      return;
    }

    setLoading(true);
    const secretKey: string = '4e8c6d1f3b5e0a9d2c7f4e8b1a3c5d9f6e2a7b0c4d8e1f3a5b9d6c2e7f2a9b3c';
    const encryptedPassword: string = CryptoJS.AES.encrypt(password, secretKey).toString();
    const loginData: UserLoginModel = { email, password: encryptedPassword };

    try {
      const response: CommonResponse = await userHelpService.loginUser(loginData);
      if (response.status && response.data?.accessToken) {
        await AsyncStorage.setItem('token', response.data.accessToken);
        await AsyncStorage.setItem('username', response.data.user?.username || '');
        await AsyncStorage.setItem('email', response.data.user?.email || '');
        await AsyncStorage.setItem('userId', response.data.user?.id || '');
        await AsyncStorage.setItem('role', response.data.user?.role || '');
        if (remember) {
          await AsyncStorage.setItem('rememberEmail', email);
        } else {
          await AsyncStorage.removeItem('rememberEmail');
        }
        setSuccessModal(true);
        setTimeout(() => {
          setSuccessModal(false);
          navigation.replace('Home');
        }, 1500);
      } else {
        setSuccessModal(false);
      }
    } catch (error: any) {
      setSuccessModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (): Promise<void> => {
    if (!email || !password || !username) {
      setSuccessModal(false);
      return;
    }

    const passwordRegex: RegExp = /^(?=(.*[a-z]){2,})(?=(.*[A-Z]){1,})(?=(.*\d){1,})(?=(.*[@$!%*?&\#_\-\+\/]){1,})[A-Za-z\d@$!%*?&\#_\-\+\/]{8,}$/;
    if (!passwordRegex.test(password)) {
      setSuccessModal(false);
      return;
    }

    setLoading(true);
    const secretKey: string = '4e8c6d1f3b5e0a9d2c7f4e8b1a3c5d9f6e2a7b0c4d8e1f3a5b9d6c2e7f2a9b3c';
    const encryptedPassword: string = CryptoJS.AES.encrypt(password, secretKey).toString();
    const signupData: CreateUserModel = { username, email, password: encryptedPassword };

    try {
      const response: CommonResponse = await userHelpService.createUser(signupData);
      if (response.status) {
        setSuccessModal(true);
        setTimeout(() => {
          setSuccessModal(false);
          setIsSignup(false);
          setEmail('');
          setPassword('');
          setUsername('');
          setProfilePicture(null);
          setProfilePictureName(null);
        }, 1500);
      } else {
        setSuccessModal(false);
      }
    } catch (error: any) {
      setSuccessModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (): Promise<void> => {
    if (!resetEmail) {
      setSuccessModal(false);
      return;
    }

    try {
      const req: EmailRequestModel = { email: resetEmail };
      const response: CommonResponse = await userHelpService.forgotPassword(req);
      if (response.status) {
        setSuccessModal(true);
        setTimeout(() => {
          setSuccessModal(false);
          setForgotPasswordModal(false);
          setResetPasswordModal(true);
        }, 1500);
      } else {
        setSuccessModal(false);
      }
    } catch (error: any) {
      setSuccessModal(false);
    }
  };

  const handleResetPassword = async (): Promise<void> => {
    if (!resetEmail || !otp || !newPassword) {
      setSuccessModal(false);
      return;
    }

    const passwordRegex: RegExp = /^(?=(.*[a-z]){2,})(?=(.*[A-Z]){1,})(?=(.*\d){1,})(?=(.*[@$!%*?&\#_\-\+\/]){1,})[A-Za-z\d@$!%*?&\#_\-\+\/]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setSuccessModal(false);
      return;
    }

    setLoading(true);
    const secretKey: string = '4e8c6d1f3b5e0a9d2c7f4e8b1a3c5d9f6e2a7b0c4d8e1f3a5b9d6c2e7f2a9b3c';
    const encryptedNewPassword: string = CryptoJS.AES.encrypt(newPassword, secretKey).toString();
    const resetData: ResetPassowordModel = { email: resetEmail, newPassword: encryptedNewPassword, otp };

    try {
      const response: CommonResponse = await userHelpService.resetPassword(resetData);
      if (response.status) {
        setSuccessModal(true);
        setTimeout(() => {
          setSuccessModal(false);
          setResetPasswordModal(false);
          setResetEmail('');
          setOtp('');
          setNewPassword('');
        }, 1500);
      } else {
        setSuccessModal(false);
      }
    } catch (error: any) {
      setSuccessModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Button press animation
  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: isSmallScreen ? 15 : 20,
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        entering={FadeIn.duration(600)}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isSmallScreen ? 20 : 30 }}
      >
        <View
          style={{
            width: isSmallScreen ? 50 : 60,
            height: isSmallScreen ? 50 : 60,
            backgroundColor: '#8a2be2',
            borderRadius: isSmallScreen ? 25 : 30,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: isSmallScreen ? 24 : 28,
              fontFamily: Platform.OS === 'ios' ? 'Montserrat-Bold' : 'Montserrat',
            }}
          >
            IN
          </Text>
        </View>
        <Text
          style={{
            fontSize: isSmallScreen ? 24 : 28,
            fontWeight: 'bold',
            color: '#000',
            marginLeft: 8,
            fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
          }}
        >
          One
        </Text>
      </Animated.View>

      <Animated.Text
        entering={FadeIn.duration(600).delay(200)}
        style={{
          fontSize: isSmallScreen ? 22 : 26,
          color: '#000',
          marginBottom: isSmallScreen ? 20 : 30,
          textAlign: 'center',
          fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
        }}
      >
        {isSignup ? 'Create Account' : 'Welcome Back'}
      </Animated.Text>

      {isSignup && (
        <Animated.View
          entering={SlideInUp.duration(600).delay(400)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#D3D3D3',
            borderRadius: 8,
            marginBottom: 20,
            paddingHorizontal: 12,
            backgroundColor: '#F9F9F9',
            width: inputWidth,
            height: isSmallScreen ? 46 : 50,
          }}
        >
          <Icon name="user" size={isSmallScreen ? 20 : 22} color="#8a2be2" style={{ marginRight: 12 }} />
          <TextInput
            style={{
              flex: 1,
              fontSize: fontSizeBase,
              color: '#8a2be2',
              height: '100%',
              fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
            }}
            placeholder="Username"
            placeholderTextColor="#D3D3D3"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </Animated.View>
      )}

      <Animated.View
        entering={SlideInUp.duration(600).delay(600)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#D3D3D3',
          borderRadius: 8,
          marginBottom: 20,
          paddingHorizontal: 12,
          backgroundColor: '#F9F9F9',
          width: inputWidth,
          height: isSmallScreen ? 46 : 50,
        }}
      >
        <Icon name="mail" size={isSmallScreen ? 20 : 22} color="#005566" style={{ marginRight: 12 }} />
        <TextInput
          style={{
            flex: 1,
            fontSize: fontSizeBase,
            color: '#005566',
            height: '100%',
            fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
          }}
          placeholder="Email"
          placeholderTextColor="#D3D3D3"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Animated.View>

      <Animated.View
        entering={SlideInUp.duration(600).delay(800)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#D3D3D3',
          borderRadius: 8,
          marginBottom: 20,
          paddingHorizontal: 12,
          backgroundColor: '#F9F9F9',
          width: inputWidth,
          height: isSmallScreen ? 46 : 50,
        }}
      >
        <Icon name="lock" size={isSmallScreen ? 20 : 22} color="#005566" style={{ marginRight: 12 }} />
        <TextInput
          style={{
            flex: 1,
            fontSize: fontSizeBase,
            color: '#005566',
            height: '100%',
            fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
          }}
          placeholder="Password"
          placeholderTextColor="#D3D3D3"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
      </Animated.View>

      {isSignup && (
        <Animated.View
          entering={SlideInUp.duration(600).delay(1000)}
          style={{ alignItems: 'flex-start', marginBottom: 20, width: inputWidth }}
        >
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#005566',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 8,
            }}
            onPress={handleImageUpload}
          >
            <Icon name="upload" size={isSmallScreen ? 18 : 20} color="#FFFFFF" />
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: fontSizeBase,
                marginLeft: 10,
                fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
              }}
            >
              Upload Profile Picture
            </Text>
          </TouchableOpacity>
          {profilePictureName && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <Text
                style={{
                  fontSize: isSmallScreen ? 12 : 14,
                  color: '#005566',
                  marginRight: 10,
                  fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
                }}
              >
                {profilePictureName}
              </Text>
              <TouchableOpacity onPress={handleRemoveImage}>
                <Icon name="closecircleo" size={isSmallScreen ? 18 : 20} color="#005566" />
              </TouchableOpacity>
            </View>
          )}
          {profilePicture && (
            <Image
              source={{ uri: profilePicture }}
              style={{
                width: isSmallScreen ? 70 : 80,
                height: isSmallScreen ? 70 : 80,
                borderRadius: isSmallScreen ? 35 : 40,
                borderWidth: 2,
                borderColor: '#D3D3D3',
                marginTop: 12,
              }}
            />
          )}
        </Animated.View>
      )}

      <Animated.View
        entering={SlideInUp.duration(600).delay(1200)}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: inputWidth }}
      >
        <Checkbox status={remember ? 'checked' : 'unchecked'} onPress={() => setRemember(!remember)} color="#005566" />
        <Text
          style={{
            fontSize: fontSizeBase,
            color: '#005566',
            marginLeft: 8,
            fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
          }}
        >
          Remember Me
        </Text>
      </Animated.View>

      <Animated.View entering={SlideInUp.duration(600).delay(1400)} style={[buttonAnimatedStyle, { width: inputWidth }]}>
        <TouchableOpacity
          style={{
            backgroundColor: loading ? '#003D4C' : '#8a2be2',
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            height: buttonHeight,
          }}
          onPress={isSignup ? handleSignup : handleLogin}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: isSmallScreen ? 16 : 18,
                fontWeight: 'bold',
                fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
              }}
            >
              {isSignup ? 'Sign Up' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text
        entering={SlideInUp.duration(600).delay(1600)}
        style={{
          fontSize: isSmallScreen ? 12 : 14,
          color: '#005566',
          marginTop: 20,
          textAlign: 'center',
          fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
        }}
      >
        {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        <Text
          style={{
            color: '#D3D3D3',
            fontWeight: 'bold',
            fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
          }}
          onPress={() => setIsSignup(!isSignup)}
        >
          {isSignup ? 'Sign In' : 'Sign Up'}
        </Text>
      </Animated.Text>


      {!isSignup && (
        <Animated.Text
          entering={SlideInUp.duration(600).delay(1800)}
          style={{
            fontSize: isSmallScreen ? 12 : 14,
            color: '#005566',
            marginTop: 15,
            textAlign: 'center',
            fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
          }}
          onPress={() => setForgotPasswordModal(true)}
        >
          Forgot Password?
        </Animated.Text>
      )}


      {/* Success Notification Modal */}
      <Modal visible={successModal} transparent={true} animationType="fade" onRequestClose={() => setSuccessModal(false)}>
        <Animated.View
          entering={FadeIn.duration(600)}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              padding: isSmallScreen ? 20 : 30,
              borderRadius: 12,
              width: modalWidth,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#D3D3D3',
            }}
          >
            <Icon name="checkcircle" size={isSmallScreen ? 40 : 50} color="#005566" style={{ marginBottom: 20 }} />
            <Text
              style={{
                fontSize: isSmallScreen ? 18 : 20,
                color: '#005566',
                fontWeight: 'bold',
                textAlign: 'center',
                fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
              }}
            >
              {isSignup ? 'Account Created!' : 'Login Successful!'}
            </Text>
            <Text
              style={{
                fontSize: fontSizeBase,
                color: '#005566',
                marginTop: 10,
                textAlign: 'center',
                fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
              }}
            >
              {isSignup ? 'You can now sign in.' : 'Redirecting to Home...'}
            </Text>
          </View>
        </Animated.View>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        visible={forgotPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setForgotPasswordModal(false)}
      >
        <Animated.View
          entering={FadeIn.duration(600)}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              padding: isSmallScreen ? 20 : 30,
              borderRadius: 12,
              width: modalWidth,
            }}
          >
            <Text
              style={{
                fontSize: isSmallScreen ? 20 : 22,
                color: '#005566',
                marginBottom: 20,
                textAlign: 'center',
                fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
              }}
            >
              Forgot Password
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D3D3D3',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
                fontSize: fontSizeBase,
                color: '#005566',
                fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
              }}
              placeholder="Enter your email"
              placeholderTextColor="#D3D3D3"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={{
                backgroundColor: '#005566',
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center',
                height: buttonHeight,
              }}
              onPress={handleForgotPassword}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: isSmallScreen ? 16 : 18,
                  fontWeight: 'bold',
                  fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
                }}
              >
                Send OTP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 15, alignItems: 'center' }}
              onPress={() => setForgotPasswordModal(false)}
            >
              <Text
                style={{
                  color: '#005566',
                  fontSize: isSmallScreen ? 12 : 14,
                  fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={resetPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setResetPasswordModal(false)}
      >
        <Animated.View
          entering={FadeIn.duration(600)}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              padding: isSmallScreen ? 20 : 30,
              borderRadius: 12,
              width: modalWidth,
            }}
          >
            <Text
              style={{
                fontSize: isSmallScreen ? 20 : 22,
                color: '#005566',
                marginBottom: 20,
                textAlign: 'center',
                fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
              }}
            >
              Reset Password
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D3D3D3',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
                fontSize: fontSizeBase,
                color: '#005566',
                fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
              }}
              placeholder="Enter OTP"
              placeholderTextColor="#D3D3D3"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
            />
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#D3D3D3',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
                fontSize: fontSizeBase,
                color: '#005566',
                fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
              }}
              placeholder="New Password"
              placeholderTextColor="#D3D3D3"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={{
                backgroundColor: loading ? '#003D4C' : '#005566',
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center',
                height: buttonHeight,
              }}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: isSmallScreen ? 16 : 18,
                    fontWeight: 'bold',
                    fontFamily: Platform.OS === 'ios' ? 'Poppins-Bold' : 'Poppins',
                  }}
                >
                  Reset Password
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 15, alignItems: 'center' }}
              onPress={() => setResetPasswordModal(false)}
            >
              <Text
                style={{
                  color: '#005566',
                  fontSize: isSmallScreen ? 12 : 14,
                  fontFamily: Platform.OS === 'ios' ? 'Poppins-Regular' : 'Poppins',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </ScrollView>
  );
};

export default LoginScreen;