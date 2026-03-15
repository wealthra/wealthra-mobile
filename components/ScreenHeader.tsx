import React from "react";
import { View, StyleSheet } from "react-native";
import SideDrawer from "./SideDrawer";
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
      </View>
   );
};

const styles = StyleSheet.create({
   headerContainer: {
      width: "100%",
      height: verticalScale(60),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingHorizontal: horizontalScale(20),
      marginTop: verticalScale(40), // Standardized top margin
   },
});

export default ScreenHeader;
