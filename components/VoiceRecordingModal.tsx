import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getThemeColors } from "../src/utils/getThemeColors";
import { useTranslation } from "react-i18next";
import {
  horizontalScale,
  verticalScale,
  moderateScale,
} from "../src/utils/scaling";

interface VoiceRecordingModalProps {
  visible: boolean;
  onClose: () => void;
  onRecordingComplete: (uri: string) => void;
  isDarkMode: boolean;
}

const VoiceRecordingModal: React.FC<VoiceRecordingModalProps> = ({
  visible,
  onClose,
  onRecordingComplete,
  isDarkMode,
}) => {
  const themeColors = getThemeColors(isDarkMode);
  const { t } = useTranslation();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    if (visible) {
      setTimer(0);
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        alert(t("common.micPermission"));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecording(recording);
      setIsRecording(true);
      setTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async (shouldComplete = true) => {
    // Check both ref and state to be safe
    const currentRecording = recordingRef.current || recording;
    if (!currentRecording) return;

    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    try {
      await currentRecording.stopAndUnloadAsync();
      const uri = currentRecording.getURI();
      
      // Clear references
      recordingRef.current = null;
      setRecording(null);

      if (uri && shouldComplete) {
        onRecordingComplete(uri);
      }
      
      // If we're not completing, reset the timer immediately
      if (!shouldComplete) {
        setTimer(0);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
      recordingRef.current = null;
      setRecording(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleClose = async () => {
    if (isRecording || recordingRef.current) {
      await stopRecording(false);
    }
    setTimer(0); // Ensure timer is reset on close
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: themeColors.page_background },
          ]}
        >
          <Text style={[styles.title, { color: themeColors.card_title }]}>
            {t("voice.recordingTitle") || "Voice Command"}
          </Text>
          
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: themeColors.card_title }]}>
              {formatTime(timer)}
            </Text>
            {isRecording && (
                <View style={[styles.recordingIndicator, { backgroundColor: themeColors.red }]} />
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.recordButton,
              { backgroundColor: isRecording ? themeColors.red : themeColors.green },
            ]}
            onPress={() => (isRecording ? stopRecording() : startRecording())}
          >
            <MaterialCommunityIcons
              name={isRecording ? "stop" : "microphone"}
              size={48}
              color="white"
            />
          </TouchableOpacity>

          <Text style={[styles.instruction, { color: themeColors.card_description }]}>
            {isRecording
              ? t("voice.stopInstruction") || "Tap to stop recording"
              : t("voice.startInstruction") || "Tap to start recording"}
          </Text>

          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={[styles.closeButtonText, { color: themeColors.green }]}>
              {t("common.cancel") || "Cancel"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: moderateScale(30),
    borderTopLeftRadius: moderateScale(30),
    borderTopRightRadius: moderateScale(30),
    alignItems: "center",
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    marginBottom: verticalScale(20),
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(30),
  },
  timerText: {
    fontSize: moderateScale(48),
    fontWeight: "300",
    fontFamily: "monospace",
  },
  recordingIndicator: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginLeft: horizontalScale(10),
  },
  recordButton: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  instruction: {
    marginTop: verticalScale(20),
    fontSize: moderateScale(16),
  },
  closeButton: {
    marginTop: verticalScale(30),
    padding: moderateScale(10),
  },
  closeButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
});

export default VoiceRecordingModal;
