import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { ChevronUp } from "../src/assets/icons/ChevronUp";
import { ChevronDown } from "../src/assets/icons/ChevronDown";
import fonts from "../src/fonts";
import Carousel from "./Carousel";

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

const DashboardSlide = ({ data }: { data: DashboardSlideData }) => {
   const hasPercentage = !!data.percentage;

   // Add this dynamic font size calculation for amount
   const getAmountFontSize = () => {
      if (hasPercentage) return 36; // Keep default size for amounts with percentage

      const amountLength = data.description.replace(/[^0-9]/g, "").length;

      // Adjust font size based on number length
      if (amountLength <= 3) return 36; // Standard size for small numbers
      if (amountLength === 4) return 32; // Slightly smaller for 4 digits
      if (amountLength === 5) return 28; // Even smaller for 5 digits
      return 24; // Smallest size for very large numbers
   };

   return (
      <View style={styles.slideWrapper}>
         <View style={styles.slideOuter}>
            <View style={[styles.slide, { backgroundColor: data.color }]}>
               <View style={[styles.content, !hasPercentage && styles.contentSimple]}>
                  <Text style={[styles.title, hasPercentage && styles.titleWithPercentage]}>{data.title}</Text>
                  <Text
                     style={[styles.amount, hasPercentage && styles.amountWithPercentage, { fontSize: getAmountFontSize() }]}
                     adjustsFontSizeToFit={true} // Add this to auto-adjust
                     numberOfLines={1} // Ensure it's a single line
                  >
                     {data.description}
                  </Text>
                  {hasPercentage && (
                     <View style={styles.percentageContainer}>
                        <View style={styles.percentageWrapper}>
                           {parseFloat(data.percentage?.replace("%", "") || "0") >= 0 ? (
                              <ChevronUp color="#4CAF50" size={16} />
                           ) : (
                              <ChevronDown color="#F44336" size={16} />
                           )}
                           <Text
                              style={[
                                 styles.percentage,
                                 {
                                    color: parseFloat(data.percentage?.replace("%", "") || "0") >= 0 ? "#4CAF50" : "#F44336",
                                 },
                              ]}>
                              {data.percentage}
                           </Text>
                        </View>
                     </View>
                  )}
               </View>
            </View>
         </View>
      </View>
   );
};

const DashboardCarousel: React.FC<DashboardCarouselProps> = ({ isDarkMode, data }) => {
   const slides = data.map((item) => ({
      ...item,
      isApiData: true, // Add this flag to match SlideData interface
   }));

   return <Carousel isDarkMode={isDarkMode} data={slides} renderItem={(item) => <DashboardSlide data={item as DashboardSlideData} />} />;
};

const { width: windowWidth } = Dimensions.get("window");

const styles = StyleSheet.create({
   slideWrapper: {
      width: windowWidth,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
   },
   slideOuter: {
      width: windowWidth * 0.85,
      maxWidth: 340,
      height: 154,
      borderRadius: 15,
      overflow: "hidden",
   },
   slide: {
      width: "100%",
      height: "100%",
      borderRadius: 15,
   },
   content: {
      padding: 20,
      width: "100%",
      height: "100%",
   },
   contentSimple: {
      justifyContent: "center",
      alignItems: "center",
      width: "100%", // Ensure content uses full width
   },
   title: {
      fontSize: 20,
      color: "#333333",
      marginBottom: 16,
      textAlign: "center",
      fontFamily: fonts.card_title,
      flexWrap: "wrap",
      width: "100%",
   },
   titleWithPercentage: {
      textAlign: "left",
      marginBottom: 8,
      fontSize: 18,
   },
   amount: {
      fontSize: 36, // This will be overridden by the dynamic size
      fontWeight: "bold",
      color: "#333333",
      textAlign: "center",
      width: "100%", // Add this to ensure full width
   },
   amountWithPercentage: {
      textAlign: "left",
   },
   percentageContainer: {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignSelf: "flex-start",
      marginTop: 12,
   },
   percentageWrapper: {
      flexDirection: "row",
      alignItems: "center",
   },
   percentage: {
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 4,
   },
});

export default DashboardCarousel;
