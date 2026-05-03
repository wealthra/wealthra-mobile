import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
  Modal,
} from "react-native";
import ConfirmationModal, { ModalButton } from "../../components/ConfirmationModal";
import { Ionicons, MaterialCommunityIcons, Entypo } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getThemeColors } from "../utils/getThemeColors";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../utils/scaling";
import ScreenHeader from "../../components/ScreenHeader";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import {
  extractExpenseFromImage,
  extractExpenseFromAudio,
} from "../services/api";
import ResultReviewModal from "../../components/ResultReviewModal";
import VoiceRecordingModal from "../../components/VoiceRecordingModal";
import { ExpenseDto } from "../api/types";
import {
  bulkAddExpenses,
  sendCopilotMessage,
  getUserUsage,
  getUserCategories,
} from "../services/api";
import { UserUsageDto, CategoryDto } from "../api/types";

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: string;
  type?: "text" | "image" | "audio";
}

const ChatScreen = ({
  isDarkMode,
  navigation,
}: {
  isDarkMode: boolean;
  navigation: any;
}) => {
  const insets = useSafeAreaInsets();
  const theme = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: t("copilot.welcomeMessage"),
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [extractedExpenses, setExtractedExpenses] = useState<ExpenseDto[]>([]);
  const [isImageExtraction, setIsImageExtraction] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [usage, setUsage] = useState<UserUsageDto | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(true);
  const [isUsageModalVisible, setIsUsageModalVisible] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
    onConfirm?: () => void;
    buttons?: ModalButton[];
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (
    title: string, 
    message: string, 
    type: "success" | "error" | "warning" | "info" = "info", 
    onConfirm?: () => void,
    buttons?: ModalButton[]
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, visible: false }))),
      buttons,
    });
  };

  useEffect(() => {
    const fetchUsage = async () => {
      setIsUsageLoading(true);
      try {
        const data = await getUserUsage();
        console.log("DEBUG - AI Usage Data:", data);
        setUsage(data);
      } catch (error) {
        console.error("Failed to fetch AI usage limits", error);
      } finally {
        setIsUsageLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const data = await getUserCategories();
        if (data && data.length > 0) {
          setCategories(data.map((c: any) => ({ 
            id: c.id, 
            name: c.name || c.categoryName || "Miscellaneous" 
          })));
        }
      } catch (error) {
        console.error("Failed to fetch categories in ChatScreen", error);
      }
    };

    fetchUsage();
    fetchCategories();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        if (Platform.OS === "android") {
          setKeyboardHeight(e.endCoordinates.height);
        }
      },
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    if (inputText.trim() === "") return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputText("");
    setIsExtracting(true);

    try {
      const response = await sendCopilotMessage(inputText);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message || t("copilot.errorUnderstanding"),
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error communicating with copilot:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: t("copilot.errorConnecting"),
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsExtracting(false);
    }
  };

  const renderLimit = (limit: any) => {
    if (limit === null || limit === undefined) return "∞";
    const numLimit = Number(limit);
    if (numLimit === 0 || numLimit === -1 || numLimit >= 99999) return "∞";
    return numLimit.toString();
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        const imageMessage: Message = {
          id: Date.now().toString(),
          text: t("copilot.uploadedReceipt"),
          sender: "user",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          type: "image",
        };
        setMessages((prev) => [...prev, imageMessage]);

        setIsExtracting(true);
        setIsImageExtraction(true);
        const expenses = await extractExpenseFromImage(
          asset.uri,
          asset.mimeType || "image/jpeg",
          asset.fileName || "receipt.jpg",
        );
        setExtractedExpenses(expenses);
        setIsReviewModalVisible(true);
      }
    } catch (error) {
      console.error("Image extraction error:", error);
      showAlert(t("copilot.error") || "Error", t("copilot.errorImage") || "Failed to process image", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVoiceRecordComplete = async (uri: string) => {
    setIsVoiceModalVisible(false);

    const audioMessage: Message = {
      id: Date.now().toString(),
      text: t("copilot.uploadedAudio"),
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      type: "audio",
    };
    setMessages((prev) => [...prev, audioMessage]);

    try {
      setIsExtracting(true);
      setIsImageExtraction(false);
      const expenses = await extractExpenseFromAudio(uri);
      setExtractedExpenses(expenses);
      setIsReviewModalVisible(true);
    } catch (error) {
      console.error("Audio extraction error:", error);
      showAlert(t("copilot.error") || "Error", t("copilot.errorAudio") || "Failed to process audio", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmBulkAdd = async (expenses: ExpenseDto[]) => {
    try {
      setIsExtracting(true);
      await bulkAddExpenses(
        expenses.map((e) => ({
          description: e.description,
          amount: e.amount,
          paymentMethod: e.paymentMethod,
          isRecurring: e.isRecurring,
          categoryId: e.categoryId,
          transactionDate: e.transactionDate,
        })),
      );

      setIsReviewModalVisible(false);

      const successMessage: Message = {
        id: Date.now().toString(),
        text: isImageExtraction
          ? t("copilot.successReceipt", { count: expenses.length })
          : t("copilot.successAudio", { count: expenses.length }),
        sender: "bot",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      console.error("Bulk add error:", error);
      showAlert(t("copilot.error") || "Error", t("copilot.errorAddExpenses") || "Failed to add expenses", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.sender === "bot";
    return (
      <View style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}>
        {isBot && (
          <View
            style={[styles.botAvatarContainer, { backgroundColor: "#E8F5E9" }]}
          >
            <MaterialCommunityIcons name="robot" size={20} color="#4CAF50" />
          </View>
        )}
        <View style={styles.messageContent}>
          {isBot && <Text style={styles.botName}>{t("copilot.botName")}</Text>}
          <View
            style={[
              styles.messageBubble,
              isBot
                ? styles.botBubble
                : [styles.userBubble, { backgroundColor: theme.green }],
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isBot ? styles.botText : styles.userText,
              ]}
            >
              {item.text}
            </Text>
          </View>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.page_background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScreenHeader
        isDarkMode={isDarkMode}
        onNavigate={(screen) => navigation.navigate(screen)}
        currentRoute="Chat"
      />

      <View style={styles.copilotHeader}>
        <View style={styles.headerInfo}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="robot" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t("copilot.title")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.headerStatus}>{t("copilot.online")}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setIsUsageModalVisible(true)}
          style={{ padding: 4 }}
        >
          <MaterialCommunityIcons name="information" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isUsageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsUsageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsUsageModalVisible(false)}
        >
          <View
            style={[
              styles.usageModalContent,
              {
                backgroundColor: theme.card_background,
                borderColor: theme.frame_stroke,
              },
            ]}
          >
            <View style={styles.usageModalHeader}>
              <Text
                style={[styles.usageModalTitle, { color: theme.card_title }]}
              >
                {t("copilot.myPlan")}
              </Text>
              <TouchableOpacity onPress={() => setIsUsageModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={theme.card_description}
                />
              </TouchableOpacity>
            </View>

            {isUsageLoading ? (
              <ActivityIndicator
                color={theme.green}
                style={{ marginVertical: 20 }}
              />
            ) : usage ? (
              <View style={styles.usageDetails}>
                <View style={styles.usageRow}>
                  <Text
                    style={[
                      styles.usageLabel,
                      { color: theme.card_description },
                    ]}
                  >
                    {t("copilot.planTier")}
                  </Text>
                  <Text
                    style={[styles.usageValue, { color: theme.card_title }]}
                  >
                    {usage.subscriptionPlanName}
                  </Text>
                </View>
                <View style={styles.usageRow}>
                  <Text
                    style={[
                      styles.usageLabel,
                      { color: theme.card_description },
                    ]}
                  >
                    {t("copilot.ocrLimit")}
                  </Text>
                  <Text
                    style={[styles.usageValue, { color: theme.card_title }]}
                  >
                    {usage.ocrRequestsThisMonth} /{" "}
                    {renderLimit(usage.monthlyOcrLimit)}
                  </Text>
                </View>
                <View style={styles.usageRow}>
                  <Text
                    style={[
                      styles.usageLabel,
                      { color: theme.card_description },
                    ]}
                  >
                    {t("copilot.sttLimit")}
                  </Text>
                  <Text
                    style={[styles.usageValue, { color: theme.card_title }]}
                  >
                    {usage.sttRequestsThisMonth} /{" "}
                    {renderLimit(usage.monthlySttLimit)}
                  </Text>
                </View>
                {usage.lastUsageActivityDate && (
                  <View style={styles.usageRow}>
                    <Text
                      style={[
                        styles.usageLabel,
                        { color: theme.card_description },
                      ]}
                    >
                      {t("copilot.lastActivity")}
                    </Text>
                    <Text
                      style={[styles.usageValue, { color: theme.card_title }]}
                    >
                      {new Date(
                        usage.lastUsageActivityDate,
                      ).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text
                style={[
                  {
                    color: theme.card_description,
                    textAlign: "center",
                    marginVertical: 20,
                  },
                ]}
              >
                {t("copilot.loadError")}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.keyboardView}>
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {isExtracting && (
          <View style={styles.extractingContainer}>
            <ActivityIndicator color={theme.green} size="small" />
            <Text
              style={[styles.extractingText, { color: theme.card_description }]}
            >
              {t("copilot.thinking")}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            {
              borderTopColor: theme.frame_stroke,
              backgroundColor: theme.page_background,
              paddingBottom: Math.max(insets.bottom, verticalScale(15)),
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: isDarkMode ? theme.frame_stroke : "#F5F5F5" },
            ]}
          >
            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.iconButton}
            >
              <Ionicons name="image-outline" size={24} color="#999" />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { color: theme.card_title }]}
              placeholder={t("copilot.placeholder")}
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsVoiceModalVisible(true)}
            >
              <Ionicons name="mic-outline" size={24} color="#999" />
            </TouchableOpacity>
          </View>
          {inputText.length > 0 && (
            <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
              <Ionicons name="send" size={24} color={theme.green} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {Platform.OS === "android" && <View style={{ height: keyboardHeight }} />}

      <ResultReviewModal
        visible={isReviewModalVisible}
        expenses={extractedExpenses}
        onConfirm={handleConfirmBulkAdd}
        onCancel={() => setIsReviewModalVisible(false)}
        isDarkMode={isDarkMode}
        categories={categories}
      />

      <VoiceRecordingModal
        visible={isVoiceModalVisible}
        onClose={() => setIsVoiceModalVisible(false)}
        onRecordingComplete={handleVoiceRecordComplete}
        isDarkMode={isDarkMode}
      />

      <ConfirmationModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        isDarkMode={isDarkMode}
        buttons={alertConfig.buttons}
        onConfirm={() => {
          if (alertConfig.onConfirm) alertConfig.onConfirm();
          setAlertConfig(prev => ({ ...prev, visible: false }));
        }}
        onCancel={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  copilotHeader: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: horizontalScale(15),
    paddingVertical: verticalScale(10),
    marginHorizontal: horizontalScale(10),
    borderRadius: moderateScale(10),
    marginTop: verticalScale(10),
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: horizontalScale(10),
  },
  headerTitle: {
    color: "white",
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  headerStatus: {
    color: "rgba(255,255,255,0.8)",
    fontSize: moderateScale(12),
  },
  messageList: {
    paddingHorizontal: horizontalScale(15),
    paddingVertical: verticalScale(20),
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: verticalScale(20),
    maxWidth: "85%",
  },
  botRow: {
    alignSelf: "flex-start",
  },
  userRow: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  botAvatarContainer: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    overflow: "hidden",
    marginRight: horizontalScale(8),
    marginTop: verticalScale(5),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  messageContent: {
    flex: 1,
  },
  botName: {
    fontSize: moderateScale(12),
    color: "#666",
    marginBottom: verticalScale(4),
    marginLeft: horizontalScale(4),
  },
  messageBubble: {
    padding: moderateScale(12),
    borderRadius: moderateScale(18),
  },
  botBubble: {
    backgroundColor: "#F0F0F0",
    borderTopLeftRadius: 0,
  },
  userBubble: {
    borderTopRightRadius: 0,
  },
  messageText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  botText: {
    color: "#333",
  },
  userText: {
    color: "white",
  },
  timestamp: {
    fontSize: moderateScale(10),
    color: "#999",
    marginTop: verticalScale(4),
    marginHorizontal: horizontalScale(4),
  },
  keyboardView: {
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: horizontalScale(15),
    paddingTop: verticalScale(10),
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: moderateScale(25),
    paddingHorizontal: horizontalScale(10),
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: horizontalScale(10),
    fontSize: moderateScale(14),
  },
  iconButton: {
    padding: moderateScale(5),
  },
  sendButton: {
    marginLeft: horizontalScale(10),
    padding: moderateScale(5),
  },
  extractingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: horizontalScale(20),
    paddingBottom: verticalScale(10),
  },
  extractingText: {
    fontSize: moderateScale(12),
    marginLeft: horizontalScale(8),
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: horizontalScale(20),
  },
  usageModalContent: {
    width: "100%",
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    borderWidth: 1,
  },
  usageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  usageModalTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
  },
  usageDetails: {
    gap: verticalScale(12),
  },
  usageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  usageLabel: {
    fontSize: moderateScale(14),
  },
  usageValue: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
});

export default ChatScreen;
