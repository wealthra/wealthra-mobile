import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Entypo } from "@expo/vector-icons";
import fonts from "../src/fonts";
import Carousel from "./Carousel";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";
import { getThemeColors } from "../src/utils/getThemeColors";

export interface DashboardSlideData {
   id: number;
   title: string;
   description: string;
   percentage?: string;
   color: string;
}

interface DashboardCarouselProps {
   isDarkMode: boolean;
   data: DashboardSlideData[];
}

const DashboardSlide = ({ data, isDarkMode }: { data: DashboardSlideData; isDarkMode: boolean }) => {
   const themeColors = getThemeColors(isDarkMode);

   const getIcon = () => {
      // Mapping titles to icons. In a real app, this should probably come from the data object
      const title = (data.title || "").toLowerCase();
      if (title.includes("net worth") || title.includes("balance")) {
         return <Entypo name="wallet" size={moderateScale(24)} color={themeColors.yellow} />;
      }
      if (title.includes("income")) {
         return <Entypo name="credit-card" size={moderateScale(24)} color={themeColors.green} />;
      }
      if (title.includes("spending") || title.includes("expense")) {
         return <Entypo name="shopping-cart" size={moderateScale(24)} color={themeColors.red} />;
      }
      return <Entypo name="wallet" size={moderateScale(24)} color={data.color} />;
   };

   return (
      <View style={styles.slideWrapper}>
         <View style={[styles.slide, { backgroundColor: themeColors.card_background }]}>
            <View style={styles.textContainer}>
               <Text style={[styles.title, { color: isDarkMode ? "#AAAAAA" : "#777777" }]}>{data.title}</Text>
               <Text style={[styles.amount, { color: isDarkMode ? "#FFFFFF" : "#333333" }]} numberOfLines={1}>
                  {data.description}
               </Text>
            </View>
            <View style={styles.iconContainer}>
               <View style={[styles.iconBox, { backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "#F5F5F5" }]}>{getIcon()}</View>
            </View>
         </View>
      </View>
   );
};

const DashboardCarousel: React.FC<DashboardCarouselProps> = ({ isDarkMode, data }) => {
   const slides = data.map((item) => ({
      ...item,
      isApiData: true,
   }));

   return (
      <Carousel
         isDarkMode={isDarkMode}
         data={slides}
         renderItem={(item) => <DashboardSlide data={item as DashboardSlideData} isDarkMode={isDarkMode} />}
         containerHeight={verticalScale(130)}
      />
   );
};

const { width: windowWidth } = Dimensions.get("window");

const styles = StyleSheet.create({
   slideWrapper: {
      width: windowWidth,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(10),
   },
   slide: {
      width: windowWidth * 0.85,
      maxWidth: horizontalScale(340),
      height: verticalScale(110),
      borderRadius: moderateScale(16),
      flexDirection: "row",
      padding: moderateScale(16),
      alignItems: "center",
      justifyContent: "space-between",
      // Shadow for iOS
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      // Elevation for Android
      elevation: 3,
   },
   textContainer: {
      flex: 1,
      justifyContent: "center",
   },
   title: {
      fontSize: moderateScale(16),
      fontFamily: fonts.card_title,
      marginBottom: verticalScale(4),
   },
   amount: {
      fontSize: moderateScale(30),
      fontWeight: "bold",
      fontFamily: fonts.card_title, // Reusing card_title or standard bold
   },
   iconContainer: {
      marginLeft: horizontalScale(12),
   },
   iconBox: {
      width: moderateScale(54),
      height: moderateScale(54),
      borderRadius: moderateScale(14),
      alignItems: "center",
      justifyContent: "center",
   },
});


export default DashboardCarousel;
