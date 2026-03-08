import axiosInstance from "../axiosInstance";
import { getStoredToken } from "./authService";
import { ExtractTextResponse } from "../types";

export const extractTextFromImage = async (imageUri: string, mimeType: string = "image/jpeg", fileName: string = "receipt.jpg"): Promise<ExtractTextResponse> => {
   try {
      const token = await getStoredToken();
      if (!token) throw new Error("No authentication token found");

      const formData = new FormData();
      formData.append('file', {
         uri: imageUri,
         type: mimeType,
         name: fileName,
      } as any);

      const response = await axiosInstance.post<ExtractTextResponse>('/api/Ocr/extract', formData, {
         headers: {
            "Content-Type": "multipart/form-data",
         },
      });

      return response.data;
   } catch (error: any) {
      console.error("Failed to extract text from image:", error);
      throw new Error(error.response?.data?.message || "Failed to extract text from image");
   }
};
