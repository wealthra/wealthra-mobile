import colors from "../colors";

export const getThemeColors = (isDarkMode: boolean) => {
   const extractTheme = (theme: any, suffix: string) => {
      const result: any = {};
      for (const key in theme) {
         // Create a cleaner key by removing the _light or _dark suffix
         const baseKey = key.replace(new RegExp(`_${suffix}$`), "");
         result[baseKey] = theme[key];
      }
      return result;
   };

   const lightTheme = extractTheme(colors.light, "light");
   const darkTheme = extractTheme(colors.dark, "dark");

   return {
      ...(isDarkMode ? darkTheme : lightTheme),
      light: lightTheme,
      dark: darkTheme,
   };
};

