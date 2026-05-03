import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getThemeColors } from "../utils/getThemeColors";
import { horizontalScale, verticalScale, moderateScale } from "../utils/scaling";
import { useTranslation } from "react-i18next";
import { getMyTickets, createTicket } from "../api/services/supportService";
import { SupportTicketDto, SupportTicketStatus } from "../api/types/support.types";

interface SupportTicketsScreenProps {
  isDarkMode: boolean;
  navigation: any;
}

const SupportTicketsScreen: React.FC<SupportTicketsScreenProps> = ({
  isDarkMode,
  navigation,
}) => {
  const [tickets, setTickets] = useState<SupportTicketDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  const theme = getThemeColors(isDarkMode);
  const { t } = useTranslation();

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyTickets();
      setTickets(data);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      Alert.alert(t("common.error"), t("support.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newBody.trim()) {
      Alert.alert(t("common.error"), t("alert.invalidInputs"));
      return;
    }

    try {
      setIsSubmitting(true);
      await createTicket({
        subject: newSubject,
        body: newBody,
      });
      Alert.alert(t("common.success"), t("support.createSuccess"));
      setNewSubject("");
      setNewBody("");
      setIsModalVisible(false);
      fetchTickets();
    } catch (error) {
      console.error("Failed to create ticket:", error);
      Alert.alert(t("common.error"), t("support.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStyles = (status: SupportTicketStatus) => {
    switch (status) {
      case SupportTicketStatus.Open:
        return { label: t("support.statusOpen"), color: theme.blue, bgColor: theme.blue + "15" };
      case SupportTicketStatus.InProgress:
        return { label: t("support.statusInProgress"), color: theme.yellow, bgColor: theme.yellow + "15" };
      case SupportTicketStatus.Resolved:
        return { label: t("support.statusResolved"), color: theme.green, bgColor: theme.green + "15" };
      case SupportTicketStatus.Closed:
        return { label: t("support.statusClosed"), color: theme.red, bgColor: theme.red + "15" };
      default:
        return { label: "Unknown", color: theme.card_description, bgColor: theme.card_description + "15" };
    }
  };

  const renderTicketItem = ({ item }: { item: SupportTicketDto }) => {
    const statusConfig = getStatusStyles(item.status);
    const isExpanded = expandedTicketId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.ticketCard,
          { backgroundColor: isDarkMode ? theme.card_background : "#FFFFFF" },
        ]}
        onPress={() => setExpandedTicketId(isExpanded ? null : item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.subjectContainer}>
            <Text style={[styles.ticketSubject, { color: theme.card_title }]}>
              {item.subject}
            </Text>
            <Text style={styles.ticketDate}>
              {new Date(item.createdOn).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            <Text style={[styles.bodyLabel, { color: theme.card_description }]}>{t("support.body")}:</Text>
            <Text style={[styles.ticketBody, { color: theme.card_title }]}>{item.body}</Text>
            
            {item.adminReply && (
              <View style={[styles.replyContainer, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "#f8f9fa" }]}>
                <View style={styles.replyHeader}>
                  <MaterialCommunityIcons name="account-tie" size={18} color={theme.green} />
                  <Text style={[styles.replyLabel, { color: theme.green }]}>{t("support.adminReply")}</Text>
                </View>
                <Text style={[styles.replyBody, { color: theme.card_title }]}>{item.adminReply}</Text>
              </View>
            )}
            
            <View style={styles.footerInfo}>
              <Text style={styles.lastModifiedText}>
                {t("support.lastModified")}: {new Date(item.lastModifiedOn).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        
        {!isExpanded && (
           <View style={styles.expandHint}>
              <Ionicons name="chevron-down" size={20} color={theme.card_description} />
           </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.page_background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={theme.card_title}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.card_title }]}>
          {t("support.title")}
        </Text>
        <TouchableOpacity
          onPress={() => fetchTickets()}
          style={styles.refreshButton}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={theme.card_title}
          />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.green} />
        </View>
      ) : tickets.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="ticket-outline"
            size={80}
            color={theme.card_description}
            style={{ opacity: 0.3 }}
          />
          <Text style={[styles.emptyText, { color: theme.card_description }]}>
            {t("support.noTickets")}
          </Text>
          <TouchableOpacity
            style={[styles.createFirstButton, { backgroundColor: theme.green }]}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={styles.createFirstButtonText}>{t("support.newTicket")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onRefresh={() => {
            setRefreshing(true);
            fetchTickets();
          }}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {tickets.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.green }]}
          onPress={() => setIsModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="white" />
        </TouchableOpacity>
      )}

      {/* New Ticket Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card_background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.card_title }]}>
                {t("support.newTicket")}
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.card_title} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.card_description }]}>
                  {t("support.subject")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      color: theme.card_title, 
                      borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#eeeeee",
                      backgroundColor: isDarkMode ? "rgba(0,0,0,0.2)" : "#fafafa" 
                    }
                  ]}
                  placeholder={t("support.subjectPlaceholder")}
                  placeholderTextColor="#999"
                  value={newSubject}
                  onChangeText={setNewSubject}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.card_description }]}>
                  {t("support.body")}
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    { 
                      color: theme.card_title, 
                      borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "#eeeeee",
                      backgroundColor: isDarkMode ? "rgba(0,0,0,0.2)" : "#fafafa" 
                    }
                  ]}
                  placeholder={t("support.bodyPlaceholder")}
                  placeholderTextColor="#999"
                  value={newBody}
                  onChangeText={setNewBody}
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.green, opacity: isSubmitting ? 0.7 : 1 }
                ]}
                onPress={handleCreateTicket}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>{t("support.submit")}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(10),
    marginTop: verticalScale(40),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
  },
  backButton: {
    padding: horizontalScale(5),
  },
  refreshButton: {
    padding: horizontalScale(5),
  },
  listContent: {
    paddingHorizontal: horizontalScale(20),
    paddingBottom: verticalScale(100),
    paddingTop: verticalScale(10),
  },
  ticketCard: {
    borderRadius: horizontalScale(16),
    marginBottom: verticalScale(16),
    padding: horizontalScale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  subjectContainer: {
    flex: 1,
    marginRight: horizontalScale(10),
  },
  ticketSubject: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    marginBottom: verticalScale(4),
  },
  ticketDate: {
    fontSize: moderateScale(12),
    color: "#888",
  },
  statusBadge: {
    paddingHorizontal: horizontalScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(8),
  },
  statusText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  expandHint: {
    alignItems: "center",
    marginTop: verticalScale(8),
  },
  expandedContent: {
    marginTop: verticalScale(12),
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.1)",
    marginBottom: verticalScale(12),
  },
  bodyLabel: {
    fontSize: moderateScale(12),
    fontWeight: "600",
    marginBottom: verticalScale(4),
    textTransform: "uppercase",
  },
  ticketBody: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
    marginBottom: verticalScale(16),
  },
  replyContainer: {
    padding: horizontalScale(12),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(4),
  },
  replyLabel: {
    fontSize: moderateScale(13),
    fontWeight: "bold",
    marginLeft: horizontalScale(6),
  },
  replyBody: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    fontStyle: "italic",
  },
  footerInfo: {
    alignItems: "flex-end",
    marginTop: verticalScale(8),
  },
  lastModifiedText: {
    fontSize: moderateScale(10),
    color: "#999",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: verticalScale(100),
  },
  emptyText: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(15),
    marginBottom: verticalScale(20),
  },
  createFirstButton: {
    paddingHorizontal: horizontalScale(24),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(24),
  },
  createFirstButtonText: {
    color: "white",
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: verticalScale(30),
    right: horizontalScale(20),
    width: horizontalScale(60),
    height: horizontalScale(60),
    borderRadius: horizontalScale(30),
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    padding: horizontalScale(24),
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(24),
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
  },
  inputGroup: {
    marginBottom: verticalScale(20),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    marginBottom: verticalScale(8),
  },
  input: {
    height: verticalScale(50),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    paddingHorizontal: horizontalScale(16),
    fontSize: moderateScale(16),
  },
  textArea: {
    height: verticalScale(120),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(16),
  },
  submitButton: {
    height: verticalScale(55),
    borderRadius: moderateScale(28),
    justifyContent: "center",
    alignItems: "center",
    marginTop: verticalScale(10),
    marginBottom: verticalScale(30),
  },
  submitButtonText: {
    color: "white",
    fontSize: moderateScale(18),
    fontWeight: "bold",
  },
});

export default SupportTicketsScreen;
