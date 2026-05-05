import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  StatusBar,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ScreenHeader from "../../components/ScreenHeader";
import { getThemeColors } from "../utils/getThemeColors";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";
import { useTranslation } from "react-i18next";
import { getPersonalizedRecommendations } from "../api/services/recommendationService";
import { 
  PersonalizedRecommendationsDto, 
  RecommendationSignalDto, 
  CollaborativeSuggestionDto, 
  SemanticTipDto 
} from "../api/types/recommendation.types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;

interface RecommendationsScreenProps {
  isDarkMode: boolean;
  navigation: any;
}

const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({
  isDarkMode,
  navigation,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PersonalizedRecommendationsDto | null>(null);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [tempYear, setTempYear] = useState(selectedDate.getFullYear());

  const theme = getThemeColors(isDarkMode);
  const { t, i18n } = useTranslation();

  const monthNames = Array.from({ length: 12 }, (_, i) => {
    return new Intl.DateTimeFormat(i18n.language, { month: "long" }).format(
      new Date(2022, i)
    );
  });

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const lang = i18n.language.split("-")[0]; // Normalize 'tr-TR' to 'tr'
      const result = await getPersonalizedRecommendations(year, month, lang);
      console.log("DEBUG - Recommendations Data:", result);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, i18n.language]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  const formatReasonCode = (code: string) => {
    return code
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderSignalCard = ({ item }: { item: RecommendationSignalDto }) => {
    const isHigh = item.severity.toLowerCase() === "high";
    const isMedium = item.severity.toLowerCase() === "medium";
    
    return (
      <View style={[styles.signalCard, { 
        backgroundColor: isDarkMode ? theme.card_background : "#fff",
        borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#eee"
      }]}>
        <View style={styles.signalHeader}>
           <View style={[styles.severityIcon, { backgroundColor: isHigh ? "rgba(231, 76, 60, 0.15)" : isMedium ? "rgba(241, 196, 15, 0.15)" : "rgba(52, 152, 219, 0.15)" }]}>
              <MaterialCommunityIcons 
                name={isHigh ? "alert-circle" : "alert"} 
                size={22} 
                color={isHigh ? theme.red : isMedium ? theme.yellow : theme.blue} 
              />
           </View>
           <View style={[styles.severityBadge, { backgroundColor: isHigh ? theme.red : isMedium ? theme.yellow : theme.blue }]}>
              <Text style={styles.severityText}>
                {t(`recommendations.${item.severity.toLowerCase()}`)}
              </Text>
           </View>
        </View>
        
        <Text style={[styles.signalTitle, { color: theme.card_title }]}>
          {formatReasonCode(item.reasonCode)}
        </Text>
        
        <View style={styles.signalMeta}>
          <Text style={[styles.metaText, { color: theme.card_description }]}>{item.categoryName}</Text>
          <Text style={[styles.metaDot, { color: theme.card_description }]}>•</Text>
          <Text style={[styles.metaText, { color: theme.card_description }]}>{t("recommendations.source")} {item.source}</Text>
        </View>
        
        <View style={[styles.analysisContainer, { backgroundColor: isDarkMode ? "rgba(0,0,0,0.3)" : "#f8f9fa" }]}>
          <Text style={[styles.analysisLabel, { color: theme.card_description }]}>{t("recommendations.analysis")}</Text>
          <Text style={[styles.analysisText, { color: theme.card_title }]}>{item.evidence}</Text>
        </View>
      </View>
    );
  };

  const renderTipCard = ({ item }: { item: SemanticTipDto }) => (
    <View style={[styles.tipCard, { 
      backgroundColor: isDarkMode ? theme.card_background : "#fff",
      borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#eee"
    }]}>
       <View style={[styles.tipIconContainer, { backgroundColor: "rgba(241, 196, 15, 0.15)" }]}>
          <MaterialCommunityIcons name="lightbulb-on" size={24} color={theme.yellow} />
       </View>
       <View style={styles.tipContent}>
          <Text style={[styles.tipTitle, { color: theme.card_title }]}>{item.topic}</Text>
          <Text style={[styles.tipBody, { color: theme.card_description }]}>{item.body}</Text>
       </View>
    </View>
  );

  const renderSuggestionCard = ({ item }: { item: CollaborativeSuggestionDto }) => (
    <View style={[styles.suggestionCard, { 
      backgroundColor: isDarkMode ? theme.card_background : "#fff",
      borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#eee"
    }]}>
      <View style={styles.suggestionHeader}>
        <Text style={[styles.suggestionCategory, { color: theme.card_title }]}>{item.categoryName}</Text>
        <Text style={[styles.suggestionScore, { color: theme.green }]}>{(item.score * 100).toFixed(0)}%</Text>
      </View>
      <Text style={[styles.suggestionEvidence, { color: theme.card_description }]}>{item.evidence}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.page_background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScreenHeader isDarkMode={isDarkMode} onNavigate={(route) => navigation.navigate(route)} currentRoute="Recommendations" />
      
      <View style={styles.pageHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.card_title }]}>{t("recommendations.title")}</Text>
          <Text style={[styles.subtitle, { color: theme.card_description }]}>{t("recommendations.subtitle")}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            setTempYear(selectedDate.getFullYear());
            setIsDatePickerVisible(true);
          }}
          style={[styles.dateSelector, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#f0f0f0" }]}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.card_title} style={{ marginRight: 8 }} />
          <Text style={[styles.dateText, { color: theme.card_title }]}>
            {selectedDate.toLocaleString(i18n.language, { month: 'long' })} | {selectedDate.getFullYear()}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.card_description} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isDatePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsDatePickerVisible(false)}
        >
          <View style={[styles.pickerContainer, { backgroundColor: theme.card_background, borderColor: theme.frame_stroke }]}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setTempYear(tempYear - 1)}>
                <Ionicons name="chevron-back" size={24} color={theme.card_title} />
              </TouchableOpacity>
              <Text style={[styles.pickerYearText, { color: theme.card_title }]}>{tempYear}</Text>
              <TouchableOpacity onPress={() => setTempYear(tempYear + 1)}>
                <Ionicons name="chevron-forward" size={24} color={theme.card_title} />
              </TouchableOpacity>
            </View>

            <View style={styles.monthGrid}>
              {monthNames.map((month, index) => {
                const isSelected = selectedDate.getMonth() === index && selectedDate.getFullYear() === tempYear;
                return (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthItem,
                      isSelected && { backgroundColor: theme.green }
                    ]}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(tempYear);
                      newDate.setMonth(index);
                      setSelectedDate(newDate);
                      setIsDatePickerVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.monthText,
                      { color: isSelected ? "#fff" : theme.card_title }
                    ]}>
                      {month.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.green} size="large" />
            <Text style={{ color: theme.card_title, marginTop: 10 }}>{t("common.loadingRecommendations")}</Text>
          </View>
        ) : (
          <>
            {/* Active Signals Section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.iconTag}>
                  <MaterialCommunityIcons name="shield-check" size={18} color={theme.green} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.card_title }]}>{t("recommendations.activeSignals")}</Text>
                {data?.signals.length ? (
                   <View style={[styles.countBadge, { backgroundColor: theme.green }]}>
                      <Text style={styles.countText}>{data.signals.length}</Text>
                   </View>
                ) : null}
              </View>
              
              <FlatList
                data={data?.signals || []}
                renderItem={renderSignalCard}
                keyExtractor={(item, index) => `signal-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + 16}
                decelerationRate="fast"
                contentContainerStyle={styles.carouselContainer}
                ListEmptyComponent={
                   <View style={[styles.emptyCard, { backgroundColor: isDarkMode ? theme.card_background : "#fff", borderColor: theme.frame_stroke }]}>
                      <Text style={[styles.emptyCardText, { color: theme.card_description }]}>No active signals for this period.</Text>
                   </View>
                }
              />
            </View>

            {/* Collaborative Suggestions Section */}
            <View style={styles.section}>
               <View style={styles.sectionTitleRow}>
                  <View style={[styles.iconTag, { backgroundColor: "rgba(52, 152, 219, 0.15)" }]}>
                    <MaterialCommunityIcons name="account-group" size={18} color={theme.blue} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: theme.card_title }]}>{t("recommendations.collaborativeSuggestions")}</Text>
               </View>
               
               {data?.collaborativeSuggestions.length === 0 ? (
                 <View style={[styles.placeholderBox, { backgroundColor: isDarkMode ? theme.card_background : "#fff", borderColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#eee" }]}>
                    <MaterialCommunityIcons name="account-group-outline" size={48} color={theme.card_description} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <Text style={[styles.placeholderTitle, { color: theme.card_title }]}>{t("recommendations.noSuggestions")}</Text>
                    <Text style={[styles.placeholderDesc, { color: theme.card_description }]}>{t("recommendations.noSuggestionsDesc")}</Text>
                 </View>
               ) : (
                 <FlatList
                    data={data?.collaborativeSuggestions || []}
                    renderItem={renderSuggestionCard}
                    keyExtractor={(item, index) => `suggestion-${index}`}
                    scrollEnabled={false}
                 />
               )}
            </View>

            {/* Smart Tips Section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={[styles.iconTag, { backgroundColor: "rgba(241, 196, 15, 0.15)" }]}>
                  <MaterialCommunityIcons name="lightbulb-on" size={18} color={theme.yellow} />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.card_title }]}>{t("recommendations.smartTips")}</Text>
                {data?.semanticTips.length ? (
                   <View style={[styles.countBadge, { backgroundColor: theme.yellow }]}>
                      <Text style={styles.countText}>{data.semanticTips.length}</Text>
                   </View>
                ) : null}
              </View>
              
              <View style={styles.tipsList}>
                {data?.semanticTips.map((tip, index) => (
                  <React.Fragment key={`tip-${index}`}>
                    {renderTipCard({ item: tip })}
                  </React.Fragment>
                ))}
                {(!data?.semanticTips || data.semanticTips.length === 0) && (
                   <View style={[styles.emptyCard, { width: '100%', backgroundColor: isDarkMode ? theme.card_background : "#fff" }]}>
                      <Text style={[styles.emptyCardText, { color: theme.card_description }]}>No smart tips available for this period.</Text>
                   </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: horizontalScale(20),
    marginTop: verticalScale(15),
    marginBottom: verticalScale(10),
  },
  titleContainer: {
    flex: 1,
    marginRight: horizontalScale(10),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontSize: moderateScale(13),
    opacity: 0.8,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(12),
    borderRadius: moderateScale(12),
  },
  dateNav: {
    padding: horizontalScale(4),
  },
  dateText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginHorizontal: horizontalScale(8),
    textTransform: "capitalize",
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  loadingContainer: {
    marginTop: verticalScale(100),
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginTop: verticalScale(25),
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: horizontalScale(20),
    marginBottom: verticalScale(15),
  },
  iconTag: {
    width: horizontalScale(32),
    height: horizontalScale(32),
    borderRadius: moderateScale(8),
    backgroundColor: "rgba(46, 204, 113, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: horizontalScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(17),
    fontWeight: "bold",
    marginRight: horizontalScale(8),
  },
  countBadge: {
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(10),
  },
  countText: {
    color: "#fff",
    fontSize: moderateScale(10),
    fontWeight: "bold",
  },
  carouselContainer: {
    paddingHorizontal: horizontalScale(20),
    paddingBottom: verticalScale(10),
  },
  signalCard: {
    width: CARD_WIDTH,
    borderRadius: moderateScale(20),
    padding: horizontalScale(20),
    marginRight: horizontalScale(16),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  signalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(15),
  },
  severityIcon: {
    width: horizontalScale(40),
    height: horizontalScale(40),
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
  },
  severityBadge: {
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
  },
  severityText: {
    color: "#fff",
    fontSize: moderateScale(10),
    fontWeight: "bold",
  },
  signalTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    marginBottom: verticalScale(6),
    textTransform: "capitalize",
  },
  signalMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(15),
  },
  metaText: {
    fontSize: moderateScale(12),
    opacity: 0.7,
  },
  metaDot: {
    marginHorizontal: horizontalScale(6),
    fontSize: moderateScale(12),
  },
  analysisContainer: {
    padding: horizontalScale(15),
    borderRadius: moderateScale(12),
  },
  analysisLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    marginBottom: verticalScale(4),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  analysisText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  placeholderBox: {
    marginHorizontal: horizontalScale(20),
    padding: verticalScale(40),
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    marginBottom: verticalScale(8),
  },
  placeholderDesc: {
    fontSize: moderateScale(14),
    textAlign: "center",
    opacity: 0.6,
    lineHeight: moderateScale(20),
  },
  tipsList: {
    paddingHorizontal: horizontalScale(20),
  },
  tipCard: {
    flexDirection: "row",
    borderRadius: moderateScale(16),
    padding: horizontalScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    alignItems: "center",
  },
  tipIconContainer: {
    width: horizontalScale(48),
    height: horizontalScale(48),
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
    marginRight: horizontalScale(16),
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: moderateScale(15),
    fontWeight: "bold",
    marginBottom: verticalScale(2),
  },
  tipBody: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
  suggestionCard: {
    marginHorizontal: horizontalScale(20),
    padding: horizontalScale(16),
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
  },
  suggestionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  suggestionCategory: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  suggestionScore: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
  },
  suggestionEvidence: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
  emptyCard: {
    padding: horizontalScale(20),
    borderRadius: moderateScale(16),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    height: verticalScale(100),
  },
  emptyCardText: {
    fontSize: moderateScale(14),
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    width: width * 0.85,
    borderRadius: moderateScale(24),
    padding: horizontalScale(20),
    borderWidth: 1,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(20),
    paddingHorizontal: horizontalScale(10),
  },
  pickerYearText: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthItem: {
    width: "30%",
    aspectRatio: 1.5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(10),
  },
  monthText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    textTransform: "capitalize",
  },
});

export default RecommendationsScreen;
