const COUNTRY_FLAGS: Record<string, string> = {
  Morocco: "🇲🇦", Algeria: "🇩🇿", Tunisia: "🇹🇳", Egypt: "🇪🇬", "Saudi Arabia": "🇸🇦",
  Indonesia: "🇮🇩", Vietnam: "🇻🇳", Thailand: "🇹🇭", Malaysia: "🇲🇾", Singapore: "🇸🇬",
  Philippines: "🇵🇭", India: "🇮🇳", Brazil: "🇧🇷", Mexico: "🇲🇽", Turkey: "🇹🇷",
  France: "🇫🇷", Pakistan: "🇵🇰", Bangladesh: "🇧🇩", Nepal: "🇳🇵", Chile: "🇨🇱", Argentina: "🇦🇷",
};

export function countryFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? "🌐";
}