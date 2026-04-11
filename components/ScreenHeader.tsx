import React from "react";
import { View, StyleSheet } from "react-native";
import SideDrawer from "./SideDrawer";
import NotificationBell from "./NotificationBell";
import { horizontalScale, verticalScale } from "../src/utils/scaling";

interface ScreenHeaderProps {
   isDarkMode: boolean;
   onNavigate: (screen: string) => void;
   currentRoute: string;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ isDarkMode, onNavigate, currentRoute }) => {
   return (
      <View style={styles.headerContainer}>
         <SideDrawer isDarkMode={isDarkMode} onNavigate={onNavigate} currentRoute={currentRoute} />
         <View style={styles.rightContainer}>
            <NotificationBell isDarkMode={isDarkMode} />
         </View>
      </View>
   );
};

const styles = StyleSheet.create({
   headerContainer: {
      width: "100%",
      height: verticalScale(60),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", // Changed from flex-start
      paddingHorizontal: horizontalScale(20),
      marginTop: verticalScale(40), // Standardized top margin
   },
   rightContainer: {
      flexDirection: "row",
      alignItems: "center",
   },
});

export default ScreenHeader;
