import React, { useState, useRef, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, Animated, Image } from "react-native";
import { getDummyData } from "../src/dummyData";
import { getThemeColors } from "../src/utils/getThemeColors";
import fonts from "../src/fonts";
import { ChevronUp } from "../src/assets/icons/ChevronUp";
import { ChevronDown } from "../src/assets/icons/ChevronDown";
import { useTranslation } from "react-i18next";
import { horizontalScale, verticalScale, moderateScale } from "../src/utils/scaling";

export interface SlideData {
   id: number;
   translationKey?: string;
   title:
      | string
      | {
           firstPart: string;
           highlightedPart: string;
           highlightColor?: string;
        };
   description: string;
   percentage?: string;
   color: string;
   imgUrl?: string;
   isApiData?: boolean;
}

const { width: windowWidth } = Dimensions.get("window");

interface CarouselProps {
   isDarkMode: boolean;
   data?: SlideData[];
   renderItem?: (item: SlideData) => React.ReactNode;
}

/**
 * Individual slide component - Renders content based on SlideData
 */
function Slide({ data, themeColors }: { data: SlideData; themeColors: any }) {
   const { t } = useTranslation();
   const hasPercentage = !!data.percentage;
   const hasImage = !!data.imgUrl;
   const isSplitTitle = typeof data.title === "object" && !data.isApiData;
   const shouldCenter = !hasImage && !hasPercentage;

   // Render API data format
   if (data.isApiData) {
      return (
         <View style={styles.slideWrapper}>
            <View style={styles.slideOuter}>
               <View style={[styles.slide, { backgroundColor: data.color }]}>
                  <View style={styles.apiSlideContent}>
                     <Text style={styles.apiTitle}>{typeof data.title === "string" ? data.title : ""}</Text>
                     <Text style={styles.apiAmount}>{data.description}</Text>
                     {hasPercentage && (
                        <View style={[styles.percentageContainer, { backgroundColor: themeColors.percentage_background }]}>
                           <View style={styles.percentageWrapper}>
                              {parseFloat(data.percentage?.replace("%", "") || "0") >= 0 ? (
                                 <ChevronUp color={themeColors.green} size={16} />
                              ) : (
                                 <ChevronDown color={themeColors.red} size={16} />
                              )}
                              <Text
                                 style={[
                                    styles.percentage,
                                    {
                                       color: parseFloat(data.percentage?.replace("%", "") || "0") >= 0 ? themeColors.green : themeColors.red,
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
   }

   const getTranslatedContent = () => {
      if (isSplitTitle) {
         return {
            firstPart: t(`cards.${data.translationKey}.firstPart`),
            highlightedPart: t(`cards.${data.translationKey}.highlightedPart`),
            description: t(`cards.${data.translationKey}.description`),
         };
      }
      return {
         title: t(`cards.${data.translationKey}.title`),
         description: t(`cards.${data.translationKey}.description`),
      };
   };

   const translatedContent = getTranslatedContent();

   return (
      <View style={styles.slideWrapper}>
         <View
            style={[
               styles.slideOuter,
               hasImage && {
                  borderWidth: 1,
                  borderColor: themeColors.frame_stroke,
                  overflow: "hidden",
               },
            ]}>
            <View style={[styles.slide, { backgroundColor: data.color }]}>
               <View
                  style={[
                     styles.textContainer,
                     hasImage
                        ? styles.textContainerBesideImage
                        : hasPercentage
                        ? styles.textContainerWithPercentage
                        : styles.textContainerWithoutPercentage,
                  ]}>
                  {isSplitTitle ? (
                     <View style={styles.titleWrapper}>
                        <Text style={[styles.titleWithImage, { color: hasImage ? themeColors.card_title : themeColors.card_text }]}>
                           {translatedContent.firstPart}
                        </Text>
                        <Text style={[styles.titleWithImage, { color: (data.title as any).highlightColor || themeColors.blue }]}>
                           {translatedContent.highlightedPart}
                        </Text>
                     </View>
                  ) : (
                     <Text style={[styles.title, { color: themeColors.card_text }, shouldCenter && styles.centeredText]}>
                        {translatedContent.title}
                     </Text>
                  )}
                  <Text
                     style={[
                        styles.description,
                        { color: hasImage ? themeColors.card_description : themeColors.card_text },
                        shouldCenter && styles.centeredText,
                        hasImage && styles.descriptionWithImage,
                     ]}>
                     {translatedContent.description}
                  </Text>

                  {hasPercentage && (
                     <View
                        style={[
                           styles.percentageContainer,
                           { backgroundColor: themeColors.percentage_background },
                           hasImage ? styles.percentageBesideImage : styles.percentageDefaultPosition,
                        ]}>
                        <View style={styles.percentageWrapper}>
                           {parseFloat(data.percentage?.replace("%", "") || "0") >= 0 ? (
                              <ChevronUp color={themeColors.green} size={16} />
                           ) : (
                              <ChevronDown color={themeColors.red} size={16} />
                           )}
                           <Text style={[styles.percentage, { color: themeColors.green }]}>{data.percentage}</Text>
                        </View>
                     </View>
                  )}
               </View>
               {hasImage && <Image source={{ uri: data.imgUrl }} style={styles.imageStyle} resizeMode="cover" />}
            </View>
         </View>
      </View>
   );
}

/**
 * Main carousel component using dummyData
 */
const Carousel: React.FC<CarouselProps> = ({ isDarkMode, data, renderItem }) => {
   const themeColors = getThemeColors(isDarkMode);
   const slideList: SlideData[] = data || getDummyData(isDarkMode);

   const [currentIndex, setCurrentIndex] = useState(0);
   const flatListRef = useRef<FlatList>(null);
   const scrollX = useRef(new Animated.Value(0)).current;

   const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false });

   const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
         setCurrentIndex(viewableItems[0].index);
      }
   }).current;

   const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

   const getItemLayout = useCallback(
      (_data: ArrayLike<SlideData> | null | undefined, index: number) => ({
         length: windowWidth,
         offset: windowWidth * index,
         index,
      }),
      []
   );

   const renderDots = () => {
      return (
         <View style={styles.dotsContainer}>
            {slideList.map((_, index) => {
               const opacity = currentIndex === index ? 1 : 0.4;
               const dotColor = currentIndex === index ? themeColors.green : themeColors.dot_background;
               return <Animated.View key={index} style={[styles.dot, { opacity, backgroundColor: dotColor }]} />;
            })}
         </View>
      );
   };

   if (!slideList || slideList.length === 0) {
      return (
         <View style={[styles.carouselContainer, styles.centered]}>
            <Text style={{ color: themeColors.card_text }}>No data available.</Text>
         </View>
      );
   }

   return (
      <View style={[styles.carouselContainer]}>
         <FlatList
            ref={flatListRef}
            data={slideList}
            renderItem={({ item }) => {
               if (renderItem) {
                  const renderedItem = renderItem(item);
                  return React.isValidElement(renderedItem) ? renderedItem : null;
               }
               return <Slide data={item} themeColors={themeColors} />;
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled={true}
            bounces={false}
            style={styles.flatList}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onViewableItemsChanged={viewableItemsChanged}
            viewabilityConfig={viewConfig}
            getItemLayout={getItemLayout}
            initialScrollIndex={currentIndex}
            keyExtractor={(item) => String(item.id)}
         />
         {renderDots()}
      </View>
   );
};

const styles = StyleSheet.create({
   carouselContainer: {
      alignItems: "center",
      justifyContent: "center",
      height: verticalScale(200),
      marginBottom: verticalScale(30),
   },
   centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
   },
   flatList: {
      width: windowWidth,
   },
   slideWrapper: {
      width: windowWidth,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: verticalScale(10),
   },
   slideOuter: {
      width: horizontalScale(320),
      maxWidth: horizontalScale(340),
      height: verticalScale(154),
      borderRadius: moderateScale(15),
      overflow: "visible",
   },
   slide: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: moderateScale(15),
      overflow: "hidden",
   },
   slideWithImage: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
   },
   imageStyle: {
      width: horizontalScale(100),
      height: verticalScale(120),
      borderRadius: moderateScale(20),
      backgroundColor: "rgba(0,0,0,0.1)",
      position: "absolute",
      right: horizontalScale(15),
   },
   textContainer: {
      flex: 1,
      height: "100%",
      justifyContent: "center",
   },
   textContainerBesideImage: {
      flex: 1,
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingRight: horizontalScale(120), // Space for image
      paddingLeft: horizontalScale(10), // Add left padding
      paddingTop: verticalScale(10), // Add top padding
      maxWidth: "100%",
   },
   textContainerWithPercentage: {
      width: "100%",
      alignItems: "flex-start", // Keep left alignment for items with percentage
      justifyContent: "flex-start",
      paddingLeft: horizontalScale(15),
      paddingTop: verticalScale(15),
      paddingRight: horizontalScale(15),
   },
   textContainerWithoutPercentage: {
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: horizontalScale(15),
   },
   centeredText: {
      textAlign: "center",
      width: "100%",
   },
   title: {
      fontSize: moderateScale(16),
      fontFamily: fonts.card_title,
      marginBottom: verticalScale(5),
      flexWrap: "wrap",
      width: "100%",
      minHeight: verticalScale(40),
   },
   titleWithImage: {
      fontWeight: "bold",
      fontSize: moderateScale(16),
      flexShrink: 1,
   },
   titleWrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
      width: "100%",
      marginBottom: verticalScale(5),
      paddingRight: 0,
   },
   description: {
      fontSize: moderateScale(28),
      fontFamily: fonts.management_header,
      fontWeight: "bold",
      lineHeight: moderateScale(34),
   },
   descriptionWithImage: {
      fontSize: moderateScale(14),
      fontWeight: "normal",
      lineHeight: moderateScale(20),
      marginTop: verticalScale(4),
   },
   percentageContainer: {
      borderRadius: moderateScale(20),
      paddingHorizontal: horizontalScale(10),
      paddingVertical: verticalScale(5),
      alignSelf: "flex-start",
   },
   percentageDefaultPosition: {
      position: "absolute",
      bottom: verticalScale(15),
      left: horizontalScale(20),
   },
   percentageBesideImage: {
      marginTop: verticalScale(8),
   },
   percentageWrapper: {
      flexDirection: "row",
      alignItems: "center",
   },
   percentage: {
      fontSize: moderateScale(14),
      fontWeight: "600",
      marginLeft: horizontalScale(4),
   },
   dotsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      position: "absolute",
      bottom: verticalScale(-5),
      alignSelf: "center",
   },
   dot: {
      width: horizontalScale(8),
      height: horizontalScale(8),
      borderRadius: horizontalScale(4),
      marginHorizontal: horizontalScale(4),
   },
   apiSlideContent: {
      padding: moderateScale(20),
      width: "100%",
      height: "100%",
   },
   apiTitle: {
      fontSize: moderateScale(20),
      color: "#333333",
      marginBottom: verticalScale(8),
      fontFamily: fonts.card_title,
   },
   apiAmount: {
      fontSize: moderateScale(32),
      fontWeight: "bold",
      color: "#333333",
      marginBottom: verticalScale(16),
      fontFamily: fonts.management_header,
   },
});

export default Carousel;
