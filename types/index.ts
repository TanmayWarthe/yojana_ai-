export interface Scheme {
  id: string;
  name: string;
  description: string;
  category: string;
  ministry: string;
  state: string;
  eligibility_criteria: string[];
  benefits: string[];
  documents_required: string[];
  tags: string[];
  apply_link: string;
  source_url: string;
  data_quality: "verified" | "scraped" | "wikipedia" | "portal_only";
  eligibility_tags: Record<string, unknown>;
  quality_score: number;
}

export interface SchemeMeta {
  total_schemes: number;
  last_updated: string;
  next_update: string;
  scrape_interval_hours: number;
  categories: Record<string, number>;
  data_quality: Record<string, number>;
}

export interface SchemesDB {
  meta: SchemeMeta;
  schemes: Scheme[];
}

export interface MatchedScheme {
  scheme: Scheme;
  score: number;
  confidence: number;
  reasons: string[];
}

export interface CitizenProfile {
  name: string;
  age: number;
  gender: string;
  state: string;
  occupation: string;
  income: number;
  category: string;
  bpl: boolean;
  has_land: boolean;
  disabled: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type Language =
  | "English"
  | "हिंदी"
  | "தமிழ்"
  | "తెలుగు"
  | "मराठी"
  | "বাংলা"
  | "ਪੰਜਾਬੀ"
  | "ગુજરાતી"
  | "ಕನ್ನಡ";
