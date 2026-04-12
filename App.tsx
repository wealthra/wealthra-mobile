import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  useColorScheme,
} from "react-native";
import Carousel from "./components/Carousel";
import LandingScreen from "./src/screens/LandingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import { getThemeColors } from "./src/utils/getThemeColors";
import { LanguageProvider } from "./src/context/LanguageContext";
import "./src/i18n/config";
import { I18nextProvider } from "react-i18next";
import i18n from "./src/i18n/config";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import DashboardScreen from "./src/screens/DasboardScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import IncomeScreen from "./src/screens/IncomeScreen";
import ExpenseScreen from "./src/screens/ExpenseScreen";
import BudgetScreen from "./src/screens/BudgetScreen";
import GoalsScreen from "./src/screens/GoalsScreen";
import AnalyticsScreen from "./src/screens/AnalyticsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ChangeCredentials from "./src/screens/ChangeCredentials";
import ChangePassword from "./src/screens/ChangePassword";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import NotificationCenterScreen from "./src/screens/NotificationCenterScreen";
import { NotificationProvider } from "./src/context/NotificationContext";
import { PrivacyProvider } from "./src/context/PrivacyContext";
import { UserProvider } from "./src/context/UserContext";

const Stack = createStackNavigator();
function AppNavigator({
  isDarkMode,
  toggleTheme,
}: {
  isDarkMode: boolean;
  toggleTheme: () => void;
}) {
  const theme = getThemeColors(isDarkMode); // Move theme here so it updates with isDarkMode

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.page_background }, // Add this
      }}
    >
      <Stack.Screen name="Landing">
        {({ navigation }) => (
          <LandingScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {({ navigation }) => (
          <SignUpScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword">
        {({ navigation }) => (
          <ForgotPasswordScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Dashboard">
        {({ navigation }) => (
          <DashboardScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Income">
        {({ navigation }) => (
          <IncomeScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Expenses">
        {({ navigation }) => (
          <ExpenseScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Budget">
        {({ navigation }) => (
          <BudgetScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Goals">
        {({ navigation }) => (
          <GoalsScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Analytics">
        {({ navigation }) => (
          <AnalyticsScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Settings">
        {({ navigation }) => (
          <SettingsScreen
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="changeCredentials">
        {({ navigation }) => (
          <ChangeCredentials
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="changePassword">
        {({ navigation }) => (
          <ChangePassword
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="NotificationCenter">
        {({ navigation }) => (
          <NotificationCenterScreen
            isDarkMode={isDarkMode}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function App() {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceTheme === "dark");

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prevMode) => !prevMode);
  }, []);
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("userLanguage");
        if (savedLanguage) {
          i18n.changeLanguage(savedLanguage);
        }
      } catch (error) {
        console.error("Error loading saved language:", error);
      }
    };

    loadSavedLanguage();
  }, []);

  const theme = getThemeColors(isDarkMode);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <PrivacyProvider>
          <NotificationProvider>
            <UserProvider>
              <NavigationContainer>
              <SafeAreaView
                style={[
                  styles.container,
                  { backgroundColor: theme.page_background },
                ]}
              >
                <AppNavigator
                  isDarkMode={isDarkMode}
                  toggleTheme={toggleTheme}
                />
              </SafeAreaView>
            </NavigationContainer>
            </UserProvider>
          </NotificationProvider>
        </PrivacyProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // This makes the SafeAreaView take the full height of the screen
  },
});

export default App;
