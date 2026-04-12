import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUserInfo } from "../api/services/accountService";
import { UserDto } from "../api/types";

interface UserContextType {
   userInfo: UserDto | null;
   preferredCurrency: string;
   isLoading: boolean;
   refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [userInfo, setUserInfo] = useState<UserDto | null>(null);
   const [preferredCurrency, setPreferredCurrency] = useState<string>("USD");
   const [isLoading, setIsLoading] = useState(true);

   const refreshUser = useCallback(async () => {
      try {
         setIsLoading(true);
         const user = await getUserInfo();
         setUserInfo(user);
         if (user.preferredCurrency) {
            setPreferredCurrency(user.preferredCurrency);
         }
      } catch (error) {
         console.error("Failed to fetch user info in context:", error);
      } finally {
         setIsLoading(false);
      }
   }, []);

   useEffect(() => {
      refreshUser();
   }, [refreshUser]);

   return (
      <UserContext.Provider value={{ userInfo, preferredCurrency, isLoading, refreshUser }}>
         {children}
      </UserContext.Provider>
   );
};

export const useUser = () => {
   const context = useContext(UserContext);
   if (context === undefined) {
      throw new Error("useUser must be used within a UserProvider");
   }
   return context;
};
