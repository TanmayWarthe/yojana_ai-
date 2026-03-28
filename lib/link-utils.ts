export type LinkStatus = "live" | "myscheme" | "ssl_issue" | "wiki" | "unknown";

export interface LinkMeta {
  status: LinkStatus;
  label: string;
  color: string;
  bg: string;
  emoji: string;
  showWarning: boolean;
  warningMessage: string;
}

export function classifyLink(url: string, urlStatus?: string): LinkMeta {
  if (!url || url === "#") {
    return {
      status: "unknown",
      label: "Link Unavailable",
      color: "#6b7a99",
      bg: "#f0f4ff",
      emoji: "⚫",
      showWarning: false,
      warningMessage: "",
    };
  }

  // Wikipedia link
  if (url.includes("wikipedia")) {
    return {
      status: "wiki",
      label: "Info Only",
      color: "#92400e",
      bg: "#fff8e6",
      emoji: "📖",
      showWarning: true,
      warningMessage:
        "This scheme's official portal link is not available yet. " +
        "Clicking 'Continue' will search for this scheme on MyScheme.gov.in — " +
        "India's official government scheme portal.",
    };
  }

  // MyScheme search fallback
  if (url.includes("myscheme.gov.in/search")) {
    return {
      status: "myscheme",
      label: "Via MyScheme",
      color: "#1565c0",
      bg: "#e3effe",
      emoji: "🔍",
      showWarning: true,
      warningMessage:
        "This scheme will be searched on MyScheme.gov.in — " +
        "India's official unified government scheme portal run by " +
        "Ministry of Electronics & IT.",
    };
  }

  // Known SSL issue domains
  const sslIssues = [
    "vidyalakshmi.co.in",
    "edistrict",
    "mahaonline",
  ];
  if (sslIssues.some((d) => url.includes(d))) {
    return {
      status: "ssl_issue",
      label: "Govt SSL Issue",
      color: "#b45309",
      bg: "#fff3cd",
      emoji: "⚠️",
      showWarning: true,
      warningMessage:
        "This is an official government portal. Your browser may show a " +
        "security warning because the government server's SSL certificate " +
        "has expired — this is a known issue with some NIC-hosted portals " +
        "and is NOT related to YojanaAI. You can safely proceed by clicking " +
        "'Advanced' in your browser.",
    };
  }

  // URL status from scraper
  if (urlStatus === "dead") {
    return {
      status: "myscheme",
      label: "Via MyScheme",
      color: "#1565c0",
      bg: "#e3effe",
      emoji: "🔍",
      showWarning: true,
      warningMessage:
        "The direct link for this scheme appears to be temporarily unavailable. " +
        "Clicking 'Continue' will search for this scheme on MyScheme.gov.in.",
    };
  }

  // Official .gov.in link — best case
  if (url.includes(".gov.in") || url.includes("india.gov")) {
    return {
      status: "live",
      label: "Official Portal",
      color: "#155d2b",
      bg: "#edfbf3",
      emoji: "🟢",
      showWarning: true,
      warningMessage:
        "You are leaving YojanaAI and being redirected to an official " +
        "Government of India portal. Some government websites may load slowly " +
        "or require Aadhaar-based login.",
    };
  }

  // Other external links
  return {
    status: "unknown",
    label: "External Site",
    color: "#374567",
    bg: "#f0f4ff",
    emoji: "🔗",
    showWarning: true,
    warningMessage:
      "You are leaving YojanaAI and being redirected to an external website.",
  };
}

export function getFinalUrl(url: string, schemeName: string): string {
  if (!url || url === "#" || url.includes("wikipedia")) {
    return `https://www.myscheme.gov.in/search?q=${encodeURIComponent(
      schemeName.slice(0, 60)
    )}`;
  }
  return url;
}
