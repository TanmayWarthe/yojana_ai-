import type { Language } from "@/types";

export const LANG_MAP: Record<Language, { dg: string; tts: string }> = {
  English:  { dg: "en-IN", tts: "en" },
  "हिंदी":  { dg: "hi",    tts: "hi" },
  "தமிழ்": { dg: "ta",    tts: "ta" },
  "తెలుగు":{ dg: "te",    tts: "te" },
  "मराठी":  { dg: "mr",    tts: "mr" },
  "বাংলা":  { dg: "bn",    tts: "bn" },
  "ਪੰਜਾਬੀ": { dg: "pa",    tts: "pa" },
  "ગુજરાતી":{ dg: "gu",    tts: "gu" },
  "ಕನ್ನಡ":  { dg: "kn",    tts: "kn" },
};

export const LANGUAGES = Object.keys(LANG_MAP) as Language[];

export const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry",
];

export const OCCUPATIONS = [
  "Farmer / Kisan","Daily Wage Worker","Self-Employed",
  "Government Employee","Private Employee","Student","Homemaker",
  "Unemployed","Retired / Senior Citizen","Fisherman","Artisan / Craftsman",
  "Construction Worker","Domestic Worker","Auto / Rickshaw Driver","Small Trader",
];

export const CATEGORIES = [
  "All","Agriculture","Health","Education","Housing",
  "Women & Child","Business & Finance","Employment",
  "Social Welfare","Insurance","Food Security","Digital & Tech",
];

export const LIFE_EVENTS: Record<string, string[]> = {
  "New Baby 👶":          ["women","health","child","maternity","nutrition"],
  "Started Farming 🌾":   ["farmer","agriculture","kisan","crop"],
  "Lost Job 😔":          ["employment","skill","rozgar","wage"],
  "Child in College 🎓":  ["student","scholarship","education","loan"],
  "Start Business 💼":    ["entrepreneur","loan","mudra","startup"],
  "Building House 🏠":    ["housing","construction","awas"],
  "Health Help 🏥":       ["health","hospital","insurance","ayushman"],
};

export const CAT_META: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  "Agriculture":      { icon: "🌾", color: "#1a7a4a", bg: "#e8f5ee", border: "#a8d9b8" },
  "Health":           { icon: "🏥", color: "#1565c0", bg: "#e3effe", border: "#90b8f8" },
  "Education":        { icon: "🎓", color: "#6a1f8a", bg: "#f3e5f5", border: "#c49de0" },
  "Housing":          { icon: "🏠", color: "#bf360c", bg: "#fbe9e7", border: "#f4a58a" },
  "Women & Child":    { icon: "👩", color: "#880e4f", bg: "#fce4ec", border: "#f48fb1" },
  "Business & Finance":{ icon: "💼", color: "#006064", bg: "#e0f7fa", border: "#80deea" },
  "Employment":       { icon: "⚙️", color: "#e65100", bg: "#fff3e0", border: "#ffcc80" },
  "Social Welfare":   { icon: "🤝", color: "#4e342e", bg: "#efebe9", border: "#bcaaa4" },
  "Insurance":        { icon: "🛡️", color: "#283593", bg: "#e8eaf6", border: "#9fa8da" },
  "Food Security":    { icon: "🍚", color: "#33691e", bg: "#f1f8e9", border: "#aed581" },
  "Digital & Tech":   { icon: "💻", color: "#01579b", bg: "#e1f5fe", border: "#81d4fa" },
  "Environment":      { icon: "🌿", color: "#2e7d32", bg: "#e8f5e9", border: "#a5d6a7" },
  "General":          { icon: "📋", color: "#37474f", bg: "#eceff1", border: "#b0bec5" },
};

export const QUICK_ACCESS = [
  { icon: "🌾", title: "Farmer Schemes",      sub: "PM-KISAN · PMFBY · KCC · e-NAM",      cat: "Agriculture" },
  { icon: "🎓", title: "Student Scholarships", sub: "NSP · INSPIRE · PMRF · Post-Matric",  cat: "Education" },
  { icon: "🏥", title: "Health Schemes",       sub: "Ayushman Bharat · NHM · JSSY",        cat: "Health" },
  { icon: "🏠", title: "Housing Schemes",      sub: "PMAY-G · PMAY-U · PMGSY",             cat: "Housing" },
  { icon: "👩", title: "Women & Child",         sub: "Ujjwala · Sukanya · PMMVY",           cat: "Women & Child" },
  { icon: "💼", title: "Business Loans",        sub: "MUDRA · PMEGP · Startup India",       cat: "Business & Finance" },
];
