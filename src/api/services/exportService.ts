import axiosInstance, { API_URL } from "../axiosInstance";
import * as FileSystem from "expo-file-system/legacy";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export interface ExportParams {
  startDate: string;
  endDate: string;
  format: "pdf" | "excel";
  currency: string;
  lang: "en" | "tr";
}

const saveToDeviceAndroid = async (fileUri: string, filename: string, mimeType: string) => {
  try {
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      console.log("❌ Permission not granted");
      return;
    }

    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      filename,
      mimeType
    );

    await FileSystem.writeAsStringAsync(newFileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log("✅ File saved to device via SAF!");
  } catch (err) {
    console.error("❌ SAF Save error:", err);
    throw err;
  }
};

export const exportData = async (params: ExportParams): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem("jwToken");

    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      format: params.format,
      currency: params.currency,
      lang: params.lang,
    }).toString();

    const url = `${API_URL}/api/Export?${queryParams}`;
    const filename = `wealthra_export_${Date.now()}.${params.format === "pdf" ? "pdf" : "xlsx"}`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    console.log(`🚀 [Export] Downloading from: ${url}`);

    const result = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (result.status === 200) {
      console.log(`✅ [Export] Downloaded to: ${result.uri}`);
      
      const mimeType = params.format === "pdf" 
        ? "application/pdf" 
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      if (Platform.OS === 'android') {
        await saveToDeviceAndroid(result.uri, filename, mimeType);
      } else {
        // iOS still works best with Sharing
        if (await isAvailableAsync()) {
          await shareAsync(result.uri, {
            mimeType,
            UTI: params.format === "pdf" ? "com.adobe.pdf" : "org.openxmlformats.spreadsheetml.sheet",
            dialogTitle: "Wealthra Data Export",
          });
        }
      }
    } else {
      throw new Error(`Failed to download file: Status ${result.status}`);
    }
  } catch (error) {
    console.error("❌ [Export] Error:", error);
    throw error;
  }
};
