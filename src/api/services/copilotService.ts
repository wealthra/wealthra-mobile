import axiosInstance from "../axiosInstance";

export interface ChatRequestDto {
  message: string;
}

export interface CopilotChatResponse {
  type: string;
  message: string;
  language: string;
  payload: Record<string, any>;
  ui_hints: Record<string, any>;
}

export const sendCopilotMessage = async (
  message: string,
  language: string = "en"
): Promise<CopilotChatResponse> => {
  try {
    // Send the exact expected payload
    const response = await axiosInstance.post<CopilotChatResponse>("/api/Copilot/chat", {
      message,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message to Copilot API:", error);
    throw error;
  }
};
