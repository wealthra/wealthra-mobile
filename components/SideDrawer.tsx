import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import { data } from "../src/utils/data";
import { SvgXml } from "react-native-svg";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../src/utils/scaling";

interface SideDrawerProps {
  isDarkMode: boolean;
  onNavigate: (screen: string) => void;
  currentRoute: string;
}

const DRAWER_WIDTH = horizontalScale(250);

const SideDrawer: React.FC<SideDrawerProps> = ({
  isDarkMode,
  onNavigate,
  currentRoute,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const themeColors = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  const [animation] = useState(new Animated.Value(0));

  const menuItems = [
    { icon: data[5].dashboardIcon, label: "Dashboard", route: "Dashboard" },
    { icon: data[6].incomeIcon, label: "Income", route: "Income" },
    { icon: data[7].expensesIcon, label: "Expenses", route: "Expenses" },
    { icon: data[8].budgetIcon, label: "Budget", route: "Budget" },
    { icon: data[9].goalsIcon, label: "Goals", route: "Goals" },
    { icon: data[10].analyticsIcon, label: "Analytics", route: "Analytics" },
    //{ icon: data[7].expensesIcon, label: "Categories", route: "Categories" },
    { icon: data[11].settingsIcon, label: "Settings", route: "Settings" },
  ];

  const toggleDrawer = () => {
    const toValue = isExpanded ? 0 : DRAWER_WIDTH;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {!isExpanded && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              { backgroundColor: themeColors.page_background },
            ]}
            onPress={toggleDrawer}
          >
            <SvgXml
              xml={data[12].drawerIcon ?? null}
              width={24}
              height={24}
              color={themeColors.card_title}
            />
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [
              {
                translateX: animation.interpolate({
                  inputRange: [0, DRAWER_WIDTH],
                  outputRange: [-DRAWER_WIDTH, 0],
                }),
              },
            ],
            backgroundColor: themeColors.page_background,
            borderColor: themeColors.frame_stroke,
          },
        ]}
      >
        <View
          style={[
            styles.menuContainer,
            { backgroundColor: themeColors.page_background },
          ]}
        >
          {/* Chevron to collapse drawer */}
          {isExpanded && (
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <SvgXml xml={data[0].logo ?? null} width={40} height={40} />
                <SvgXml
                  xml={data[1].logotext ?? null}
                  width={100}
                  height={30}
                  style={[{ marginLeft: 8 }, { marginTop: 5 }]}
                />
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={toggleDrawer}
              >
                <SvgXml
                  xml={data[13].chevronLeft ?? null}
                  width={30}
                  height={30}
                  color={themeColors.card_title}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { backgroundColor: themeColors.page_background },
                currentRoute === item.route && {
                  backgroundColor: isDarkMode
                    ? "rgba(46, 204, 113, 0.2)" // Higher opacity for dark mode
                    : "rgba(46, 204, 113, 0.1)", // Lower opacity for light mode
                  borderRadius: 8,
                  width: "90%",
                  alignSelf: "center",
                },
              ]}
              onPress={() => onNavigate(item.route)}
            >
              <SvgXml
                xml={item.icon ?? null}
                width={24}
                height={24}
                color={
                  currentRoute === item.route
                    ? themeColors.green
                    : themeColors.card_title
                }
              />
              <Text
                style={[
                  styles.menuText,
                  {
                    color:
                      currentRoute === item.route
                        ? themeColors.green
                        : themeColors.card_title,
                    fontWeight: currentRoute === item.route ? "600" : "normal",
                  },
                ]}
              >
                {t(`navigation.${item.label.toLowerCase()}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    zIndex: 1000,
  },
  toggleButton: {
    width: horizontalScale(40),
    height: horizontalScale(40),
    justifyContent: "center",
    alignItems: "center",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 999,
    borderRightWidth: 1,

    height: Dimensions.get("window").height,
  },
  menuContainer: {
    flex: 1,
    paddingTop: verticalScale(20),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    height: verticalScale(50),
    paddingHorizontal: horizontalScale(16),
    justifyContent: "flex-start",
    marginVertical: verticalScale(8),
    marginHorizontal: horizontalScale(16),
    borderRadius: moderateScale(8),
  },
  menuText: {
    marginLeft: horizontalScale(16),
    fontSize: moderateScale(16),
  },
  closeButton: {
    position: "absolute",
    right: 10,
    zIndex: 1001,
    padding: 8,
  },
  headerContainer: {
    width: "100%",
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(20),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default SideDrawer;
