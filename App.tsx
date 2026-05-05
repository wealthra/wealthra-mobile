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
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import "./src/i18n/config";
import { I18nextProvider } from "react-i18next";
import i18n from "./src/i18n/config";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import DashboardScreen from "./src/screens/DasboardScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
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
import ChatScreen from "./src/screens/ChatScreen";
import SupportTicketsScreen from "./src/screens/SupportTicketsScreen";
import RecommendationsScreen from "./src/screens/RecommendationsScreen";
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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const theme = getThemeColors(isDarkMode);

  if (isAuthLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.page_background,
        }}
      >
        <Text style={{ color: theme.card_title }}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.page_background },
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Landing">
            {(props) => (
              <LandingScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="SignUp">
            {(props) => (
              <SignUpScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="ForgotPassword">
            {(props) => (
              <ForgotPasswordScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="ResetPassword">
            {(props) => (
              <ResetPasswordScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        <>
          <Stack.Screen name="Dashboard">
            {(props) => (
              <DashboardScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Income">
            {(props) => (
              <IncomeScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Expenses">
            {(props) => (
              <ExpenseScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Budget">
            {(props) => (
              <BudgetScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Goals">
            {(props) => (
              <GoalsScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Analytics">
            {(props) => (
              <AnalyticsScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {(props) => (
              <SettingsScreen
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="changeCredentials">
            {(props) => (
              <ChangeCredentials
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="changePassword">
            {(props) => (
              <ChangePassword
                {...props}
                isDarkMode={isDarkMode}
                onToggleTheme={toggleTheme}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="NotificationCenter">
            {(props) => (
              <NotificationCenterScreen {...props} isDarkMode={isDarkMode} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Chat">
            {(props) => <ChatScreen {...props} isDarkMode={isDarkMode} />}
          </Stack.Screen>
          <Stack.Screen name="SupportTickets">
            {(props) => (
              <SupportTicketsScreen {...props} isDarkMode={isDarkMode} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Recommendations">
            {(props) => (
              <RecommendationsScreen {...props} isDarkMode={isDarkMode} />
            )}
          </Stack.Screen>
        </>
      )}
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
      <AuthProvider>
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
      </AuthProvider>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // This makes the SafeAreaView take the full height of the screen
  },
});

export default App;
