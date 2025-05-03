import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Avatar, Button, Text } from 'react-native-elements';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import {
  HomeIcon,
  ChatBubbleLeftIcon,
  PhotoIcon,
  UserIcon,
  PowerIcon,
} from 'react-native-heroicons/outline';
import { UserHelpService } from '@in-one/shared-services';
import { UserIdRequestModel } from '@in-one/shared-models';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  status?: string;
  role?: string;
}

interface NavItem {
  key: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { key: '1', icon: HomeIcon, label: 'Home', path: 'Home' },
  { key: '2', icon: ChatBubbleLeftIcon, label: 'Messages', path: 'Chat' },
  { key: '3', icon: PhotoIcon, label: 'Feed', path: 'Photos' },
  { key: '4', icon: UserIcon, label: 'Profile', path: 'Profile' },
];

const AppLayout: React.FC = () => {
  const [isProfileModalVisible, setIsProfileModalVisible] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('Home');

  const navigation = useNavigation<any>();
  const userService = new UserHelpService();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const modalOpacity = useSharedValue(0);

  // Header animation
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  // Modal animation
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isProfileModalVisible ? 1 : 0, { duration: 300 }),
    transform: [{ scale: withSpring(isProfileModalVisible ? 1 : 0.8, { stiffness: 100 }) }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: withTiming(headerOpacity.value === 1 ? 0 : -50, { duration: 500 }) }],
  }));

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      // Mock response for now
      setUser({
        id: userId,
        username: 'John Doe',
        email: 'john.doe@example.com',
        profilePicture: 'https://example.com/profile.jpg',
        status: 'Active',
        role: 'User',
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userService]);

  const logoutUser = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('User ID not found');
      await userService.logoutUser(new UserIdRequestModel(userId));
      await AsyncStorage.clear();
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [navigation, userService]);

  const handleProfileClick = () => {
    setIsProfileModalVisible(true);
    if (!user) {
      fetchUserProfile();
    }
  };

  const handleTabPress = (item: NavItem) => {
    setActiveTab(item.path);
    navigation.navigate(item.path);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle, tw`bg-white shadow-md`]}>
        <View style={tw`flex-row items-center`}>
          <Text h3 style={tw`text-blue-600 font-bold`}>OneApp</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <Avatar
            size={36}
            rounded
            source={user?.profilePicture ? { uri: user.profilePicture } : undefined}
            icon={{ name: 'user', type: 'antdesign' }}
            containerStyle={tw`bg-gray-200 mr-3`}
            onPress={handleProfileClick}
          />
          <Button
            icon={<PowerIcon size={20} color="white" />}
            loading={isLoggingOut}
            buttonStyle={tw`bg-red-500 rounded-full w-10 h-10 p-0`}
            onPress={logoutUser}
          />
        </View>
      </Animated.View>

      {/* Content */}
      <View style={tw`flex-1`}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={tw`flex-1 justify-center`} />
        ) : (
          <View style={tw`flex-1`}>{/* Content rendered by React Navigation */}</View>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, tw`bg-white shadow-lg border-t border-gray-200`]}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={tw`flex-1 items-center justify-center py-3`}
            onPress={() => handleTabPress(item)}
          >
            <item.icon size={24} color={activeTab === item.path ? '#007AFF' : '#666'} />
            <Text style={tw`text-xs mt-1 ${activeTab === item.path ? 'text-blue-500' : 'text-gray-600'}`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Profile Modal */}
      <Modal visible={isProfileModalVisible} transparent animationType="none">
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <Animated.View style={[styles.modal, modalAnimatedStyle, tw`bg-white rounded-2xl shadow-xl`]}>
            <Text h4 style={tw`text-center mb-4 font-semibold text-gray-800`}>Profile</Text>
            {user ? (
              <View style={tw`items-center p-4`}>
                <Avatar
                  size={80}
                  rounded
                  source={user.profilePicture ? { uri: user.profilePicture } : undefined}
                  icon={{ name: 'user', type: 'antdesign' }}
                  containerStyle={tw`bg-gray-200 mb-4`}
                />
                <Text style={tw`text-lg font-bold text-gray-800`}>{user.username}</Text>
                <Text style={tw`text-gray-500 mb-2`}>{user.email}</Text>
                <Text style={tw`text-gray-600`}>Status: {user.status || 'Active'}</Text>
                <Text style={tw`text-gray-600`}>Role: {user.role || 'User'}</Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#007AFF" style={tw`my-4`} />
            )}
            <Button
              title="Close"
              buttonStyle={tw`bg-blue-500 mt-4 rounded-full px-6 py-2`}
              titleStyle={tw`text-white font-medium`}
              onPress={() => setIsProfileModalVisible(false)}
            />
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: { paddingTop: 8 },
      android: { paddingTop: 12 },
    }),
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
  },
  modal: {
    width: width * 0.85,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
});

export default AppLayout;