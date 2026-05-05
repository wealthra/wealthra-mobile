import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import { setAnnouncementsShown } from "../api/services/announcementService";

interface AuthContextType {
   isAuthenticated: boolean;
   isLoading: boolean;
   jwToken: string | null;
   refreshToken: string | null;
   login: (token: string, refreshToken: string, userId: string) => Promise<void>;
   logout: () => Promise<void>;
   updateTokens: (token: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [isLoading, setIsLoading] = useState(true);
   const [jwToken, setJwToken] = useState<string | null>(null);
   const [refreshToken, setRefreshToken] = useState<string | null>(null);

   const loadTokens = useCallback(async () => {
      try {
         setIsLoading(true);
         const token = await AsyncStorage.getItem("jwToken");
         const refresh = await AsyncStorage.getItem("refreshToken");
         
         if (token && refresh) {
            setJwToken(token);
            setRefreshToken(refresh);
            setIsAuthenticated(true);
         } else {
            setIsAuthenticated(false);
         }
      } catch (error) {
         console.error("Failed to load tokens from storage:", error);
      } finally {
         setIsLoading(false);
      }
   }, []);

   useEffect(() => {
      loadTokens();
   }, [loadTokens]);

   useEffect(() => {
      const subscription = DeviceEventEmitter.addListener('forceLogout', async () => {
         console.warn("🔔 [Auth] Force logout event received!");
         await logout();
      });

      return () => {
         subscription.remove();
      };
   }, [logout]);

   const login = async (token: string, refresh: string, userId: string) => {
      setJwToken(token);
      setRefreshToken(refresh);
      setIsAuthenticated(true);
      await AsyncStorage.multiSet([
         ["jwToken", token],
         ["refreshToken", refresh],
         ["userId", userId],
      ]);
   };

   const updateTokens = async (token: string, refresh: string) => {
      setJwToken(token);
      setRefreshToken(refresh);
      await AsyncStorage.multiSet([
         ["jwToken", token],
         ["refreshToken", refresh],
      ]);
   };

   const logout = async () => {
      setJwToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      setAnnouncementsShown(false);
      await AsyncStorage.multiRemove([
        "userId",
        "jwToken",
        "refreshToken",
        "userRoles",
        "preferredCurrency",
        "lastSeenAnnouncementId",
      ]);
   };

   return (
      <AuthContext.Provider value={{ 
         isAuthenticated, 
         isLoading, 
         jwToken, 
         refreshToken, 
         login, 
         logout,
         updateTokens
      }}>
         {children}
      </AuthContext.Provider>
   );
};

export const useAuth = () => {
   const context = useContext(AuthContext);
   if (context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider");
   }
   return context;
};
