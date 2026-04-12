import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

const PRIVACY_MODE_KEY = "@privacy_mode_enabled";

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  useEffect(() => {
    // Load persisted state
    const loadPrivacyMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(PRIVACY_MODE_KEY);
        if (savedMode !== null) {
          setIsPrivacyMode(JSON.parse(savedMode));
        }
      } catch (error) {
        console.error("Failed to load privacy mode:", error);
      }
    };
    loadPrivacyMode();
  }, []);

  const togglePrivacyMode = async () => {
    try {
      const newMode = !isPrivacyMode;
      setIsPrivacyMode(newMode);
      await AsyncStorage.setItem(PRIVACY_MODE_KEY, JSON.stringify(newMode));
    } catch (error) {
      console.error("Failed to save privacy mode:", error);
    }
  };

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
};
