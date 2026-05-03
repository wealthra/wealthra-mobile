export interface RecommendationSignalDto {
  source: string;
  severity: string;
  reasonCode: string;
  evidence: string;
  categoryId: number;
  categoryName: string;
}

export interface CollaborativeSuggestionDto {
  categoryId: number;
  categoryName: string;
  score: number;
  evidence: string;
}

export interface SemanticTipDto {
  tipId: number;
  topic: string;
  body: string;
  locale: string;
  matchReason: string;
}

export interface PersonalizedRecommendationsDto {
  signals: RecommendationSignalDto[];
  collaborativeSuggestions: CollaborativeSuggestionDto[];
  semanticTips: SemanticTipDto[];
}
