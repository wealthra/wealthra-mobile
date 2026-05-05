import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../src/utils/scaling";

interface SpendingData {
  name: string;
  amount: number;
  color: string;
}

interface SpendingChartProps {
  isDarkMode: boolean;
  data: SpendingData[];
}
const { width: windowWidth } = Dimensions.get("window");

const SpendingChart: React.FC<SpendingChartProps> = ({ isDarkMode, data }) => {
  const themeColors = getThemeColors(isDarkMode);
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - horizontalScale(40);
  const chartHeight = verticalScale(180);
  const { t } = useTranslation();

  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useSharedValue(0);

  const chartConfig = {
    backgroundGradientFrom: themeColors.card_background,
    backgroundGradientTo: themeColors.card_background,
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
  };

  // Sort data for the list (already sorted from dashboard, but let's be sure)
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);

  // Data for the pie chart (limit to top 4)
  const pieData = sortedData.slice(0, 4).map((item) => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: themeColors.card_title,
    legendFontSize: moderateScale(12),
  }));

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    flipAnim.value = withTiming(isFlipped ? 0 : 180, { duration: 600 });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnim.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      backfaceVisibility: "hidden",
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnim.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      backfaceVisibility: "hidden",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.container}>
        {/* Front Side: Pie Chart */}
        <Animated.View
          style={[
            styles.cardSide,
            frontAnimatedStyle,
            {
              backgroundColor: themeColors.card_background,
              borderColor: isDarkMode ? themeColors.frame_stroke : "#E0E0E0",
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleFlip}
            style={styles.frontTouchArea}
          >
            <Text style={[styles.title, { color: themeColors.card_title }]}>
              {t("spendingsDonutChartTitle")}
            </Text>
            <View style={styles.chartWrapper}>
              <PieChart
                data={pieData}
                width={chartWidth}
                height={chartHeight}
                chartConfig={{
                  ...chartConfig,
                  backgroundGradientFrom: themeColors.card_background,
                  backgroundGradientTo: themeColors.card_background,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft={horizontalScale(-88).toString()}
                absolute
                center={[chartWidth / 2, 0]}
                hasLegend={false}
              />
            </View>
            <View style={styles.legendContainer}>
              {pieData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      { color: themeColors.card_title },
                    ]}
                  >
                    {t(
                      `categories.${item.name.toLowerCase().replace(/\s+/g, "_")}`,
                    )}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Back Side: List of Categories */}
        <Animated.View
          style={[
            styles.cardSide,
            backAnimatedStyle,
            {
              backgroundColor: themeColors.card_background,
              borderColor: isDarkMode ? themeColors.frame_stroke : "#E0E0E0",
            },
          ]}
        >
          <TouchableOpacity onPress={handleFlip} style={styles.backHeaderTouch}>
            <Text style={[styles.title, { color: themeColors.card_title }]}>
              {t("dashboard.allSpendings") || "All Spendings"}
            </Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.backScrollView}
            contentContainerStyle={styles.backScrollContent}
          >
            {sortedData.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.05)"
                      : "#f8f9fa",
                    borderColor: themeColors.frame_stroke,
                  },
                ]}
              >
                <View
                  style={[
                    styles.categoryColorBar,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text
                  style={[
                    styles.categoryCardName,
                    { color: themeColors.card_title },
                  ]}
                  numberOfLines={1}
                >
                  {t(
                    `categories.${item.name.toLowerCase().replace(/\s+/g, "_")}`,
                  )}
                </Text>
                <Text
                  style={[
                    styles.categoryCardAmount,
                    { color: themeColors.card_title },
                  ]}
                >
                  {item.amount.toLocaleString()}
                </Text>
                <View
                  style={[
                    styles.rankBadge,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.05)",
                    },
                  ]}
                >
                  <Text
                    style={[styles.rankText, { color: themeColors.card_title }]}
                  >
                    #{index + 1}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={handleFlip}
            style={styles.backFooterTouch}
          ></TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: windowWidth * 0.85,
    marginTop: verticalScale(20),
  },
  container: {
    width: "100%",
    height: verticalScale(330), // Increased height for better spacing
  },
  cardSide: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: moderateScale(15),
    padding: moderateScale(15),
  },
  frontTouchArea: {
    width: "100%",
    height: "100%",
    alignItems: "center",
  },
  backHeaderTouch: {
    width: "100%",
    alignItems: "center",
  },
  backFooterTouch: {
    width: "100%",
    alignItems: "center",
    paddingVertical: verticalScale(10),
    position: "absolute",
    bottom: 0,
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    marginBottom: verticalScale(10),
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: verticalScale(10), // More space
    paddingHorizontal: horizontalScale(5),
    minHeight: verticalScale(40),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: horizontalScale(12),
    marginBottom: verticalScale(6),
  },
  legendDot: {
    width: horizontalScale(10),
    height: horizontalScale(10),
    borderRadius: horizontalScale(5),
    marginRight: horizontalScale(6),
  },
  legendText: {
    fontSize: moderateScale(12),
  },
  flipHint: {
    fontSize: moderateScale(11),
    position: "absolute",
    bottom: verticalScale(10),
    opacity: 0.7,
  },
  backScrollView: {
    width: "100%",
    marginTop: verticalScale(10),
  },
  backScrollContent: {
    paddingHorizontal: horizontalScale(5),
    alignItems: "center",
    paddingBottom: verticalScale(20),
  },
  categoryCard: {
    width: horizontalScale(120),
    height: verticalScale(140),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    marginHorizontal: horizontalScale(8),
    padding: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
  },
  categoryColorBar: {
    width: "60%",
    height: verticalScale(4),
    borderRadius: verticalScale(2),
    marginBottom: verticalScale(15),
  },
  categoryCardName: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: verticalScale(5),
  },
  categoryCardAmount: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  rankBadge: {
    position: "absolute",
    top: moderateScale(8),
    right: moderateScale(8),
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: horizontalScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(8),
  },
  rankText: {
    fontSize: moderateScale(10),
    fontWeight: "bold",
  },
});

export default SpendingChart;
