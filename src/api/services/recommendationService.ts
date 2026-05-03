import axiosInstance from "../axiosInstance";
import { PersonalizedRecommendationsDto } from "../types/recommendation.types";

/**
 * Triggers analysis for a specific month and year.
 * @returns Array of strings containing analysis results.
 */
export const analyzeRecommendations = async (year: number, month: number, language: string = 'en'): Promise<string[]> => {
  const response = await axiosInstance.post<string[]>("/api/Recommendations/analyze", null, {
    params: { year, month, language }
  });
  return response.data;
};

/**
 * Fetches personalized recommendations including signals, collaborative suggestions, and semantic tips.
 */
export const getPersonalizedRecommendations = async (year: number, month: number, language: string = 'en'): Promise<PersonalizedRecommendationsDto> => {
  const response = await axiosInstance.get<PersonalizedRecommendationsDto>("/api/Recommendations/personalized", {
    params: { year, month, language }
  });
  return response.data;
};
