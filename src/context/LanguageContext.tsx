import React, { createContext, useContext, useState } from "react";

type Language = "en" | "tr";

interface LanguageContextType {
   language: Language;
   toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
   const [language, setLanguage] = useState<Language>("en");

   const toggleLanguage = () => {
      setLanguage((prev) => (prev === "en" ? "tr" : "en"));
   };

   return <LanguageContext.Provider value={{ language, toggleLanguage }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
   const context = useContext(LanguageContext);
   if (context === undefined) {
      throw new Error("useLanguage must be used within a LanguageProvider");
   }
   return context;
};
