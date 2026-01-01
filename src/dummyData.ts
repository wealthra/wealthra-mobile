import { getThemeColors } from "./utils/getThemeColors";
import colors from "./colors";

export const getDummyData = (isDarkMode: boolean) => {
   const themeColors = getThemeColors(isDarkMode);

   return [
      {
         id: 1,
         translationKey: "categoryCard",
         title: {
            firstPart: "Categorize your expenses",
            highlightedPart: "and track them even better",
            highlightColor: themeColors.yellow,
         },
         description: "Categorize spending for clear financial insights and easier progress towards your goals.",
         percentage: "",
         color: isDarkMode ? colors.dark.page_background_dark : colors.light.page_background_light,
         imgUrl:
            "https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
         id: 2,
         translationKey: "discoveryCard",
         title: {
            firstPart: "Discover a new approach",
            highlightedPart: "to tracking your expenses",
            highlightColor: themeColors.blue,
         },
         description: "Stay on top of your wellness with personalized insights and seamless tracking.",
         percentage: "",
         color: isDarkMode ? colors.dark.page_background_dark : colors.light.page_background_light,
         imgUrl:
            "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      {
         id: 3,
         translationKey: "comparisonCard",
         title: {
            firstPart: "See how our users",
            highlightedPart: "save more money with us",
            highlightColor: themeColors.green,
         },
         description: "Users saved 20% more by categorizing expenses and making smarter decisions.",
         percentage: "",
         color: isDarkMode ? colors.dark.page_background_dark : colors.light.page_background_light,
         imgUrl:
            "https://images.unsplash.com/photo-1561414927-6d86591d0c4f?q=80&w=1973&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
   ];
};
