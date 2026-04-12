import { View, StyleSheet, TouchableOpacity } from "react-native";
import SideDrawer from "./SideDrawer";
import NotificationBell from "./NotificationBell";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";
import { usePrivacy } from "../src/context/PrivacyContext";
import { Ionicons } from "@expo/vector-icons";

interface ScreenHeaderProps {
   isDarkMode: boolean;
   onNavigate: (screen: string) => void;
   currentRoute: string;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ isDarkMode, onNavigate, currentRoute }) => {
   const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

   return (
      <View style={styles.headerContainer}>
         <SideDrawer isDarkMode={isDarkMode} onNavigate={onNavigate} currentRoute={currentRoute} />
         <View style={styles.rightContainer}>
            <TouchableOpacity onPress={togglePrivacyMode} style={styles.iconButton} activeOpacity={0.7}>
               <Ionicons
                  name={isPrivacyMode ? "eye-off-outline" : "eye-outline"}
                  size={moderateScale(28)}
                  color={isDarkMode ? "#FFFFFF" : "#333333"}
               />
            </TouchableOpacity>
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
   iconButton: {
      marginRight: horizontalScale(15),
      padding: horizontalScale(5),
   },
});

export default ScreenHeader;
