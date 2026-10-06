package service

import "strings"

// Region is a fantasy league a player is placed in automatically, based on the
// country they enter when creating their fantasy team. Players never pick it.
type Region struct {
	Slug string `json:"slug"`
	Name string `json:"name"`
}

// GlobalLeagueSlug is the league every player belongs to, whatever their region.
const GlobalLeagueSlug = "global"

const (
	RegionSoutheastAsia = "southeast-asia"
	RegionBrazil        = "brazil"
	RegionLatam         = "latam"
	RegionMENA          = "mena"
	RegionAfrica        = "africa"
	RegionNepal         = "nepal"
	RegionPakistan      = "pakistan"
	RegionIndia         = "india"
	RegionBangladesh    = "bangladesh"
	RegionNorthAmerica  = "north-america"
)

// Regions lists every region league, in display order.
var Regions = []Region{
	{RegionSoutheastAsia, "Southeast Asia"},
	{RegionBrazil, "Brazil"},
	{RegionLatam, "Latam"},
	{RegionMENA, "MENA"},
	{RegionAfrica, "Africa"},
	{RegionNepal, "Nepal"},
	{RegionPakistan, "Pakistan"},
	{RegionIndia, "India"},
	{RegionBangladesh, "Bangladesh"},
	{RegionNorthAmerica, "North America"},
}

// countriesByRegion is the single source of truth for who lands where.
// Country names use the same spelling as the frontend's COUNTRY_FLAGS keys.
// To move a country, or to add a new region, edit only this table (and Regions above).
//
// Countries not listed anywhere (e.g. France, Japan, Sri Lanka) get no region:
// those players are only in the Global league.
var countriesByRegion = map[string][]string{
	RegionSoutheastAsia: {
		"Indonesia", "Thailand", "Vietnam", "Philippines", "Malaysia", "Singapore",
		"Cambodia", "Laos", "Myanmar", "Brunei", "TimorLeste", "Taiwan",
	},
	RegionBrazil:       {"Brazil"},
	RegionNorthAmerica: {"UnitedStates", "Canada"},
	RegionNepal:        {"Nepal"},
	RegionPakistan:     {"Pakistan"},
	RegionIndia:        {"India"},
	RegionBangladesh:   {"Bangladesh"},
	// Latam = the rest of the Americas (everything except US, Canada and Brazil).
	RegionLatam: {
		"Mexico", "Argentina", "Chile", "Colombia", "Peru", "Venezuela", "Ecuador",
		"Bolivia", "Paraguay", "Uruguay", "CostaRica", "Panama", "Guatemala",
		"Honduras", "ElSalvador", "Nicaragua", "DominicanRepublic", "Cuba", "Haiti",
		"Belize", "Guyana", "Suriname", "Jamaica", "Bahamas", "Barbados",
		"TrinidadAndTobago", "AntiguaAndBarbuda", "Dominica", "Grenada",
		"SaintKittsAndNevis", "SaintLucia", "SaintVincentAndTheGrenadines",
	},
	RegionMENA: {
		"Morocco", "Algeria", "Tunisia", "Libya", "Egypt", "Sudan", "Mauritania",
		"SaudiArabia", "UnitedArabEmirates", "Qatar", "Kuwait", "Bahrain", "Oman",
		"Yemen", "Iraq", "Syria", "Jordan", "Lebanon", "Palestine",
	},
	RegionAfrica: {
		"Angola", "Benin", "Botswana", "BurkinaFaso", "Burundi", "CaboVerde",
		"Cameroon", "CentralAfricanRepublic", "Chad", "Comoros", "Congo", "Djibouti",
		"EquatorialGuinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
		"Ghana", "Guinea", "GuineaBissau", "IvoryCoast", "Kenya", "Lesotho",
		"Liberia", "Madagascar", "Malawi", "Mali", "Mauritius", "Mozambique",
		"Namibia", "Niger", "Nigeria", "Rwanda", "SaoTomeAndPrincipe", "Senegal",
		"Seychelles", "SierraLeone", "Somalia", "SouthAfrica", "SouthSudan",
		"Tanzania", "Togo", "Uganda", "Zambia", "Zimbabwe",
	},
}

// regionByCountry is countriesByRegion flipped, keyed by normalised country name.
var regionByCountry = func() map[string]string {
	m := make(map[string]string)
	for region, countries := range countriesByRegion {
		for _, c := range countries {
			m[normalizeCountry(c)] = region
		}
	}
	return m
}()

var regionNames = func() map[string]string {
	m := make(map[string]string, len(Regions))
	for _, r := range Regions {
		m[r.Slug] = r.Name
	}
	return m
}()

// normalizeCountry makes "Saudi Arabia", "saudiarabia" and "SaudiArabia" all match.
func normalizeCountry(country string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(country) {
		switch r {
		case ' ', '-', '_', '\'', '.':
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

// RegionForCountry returns the region slug for a country, or "" when the country
// is not part of any region league.
func RegionForCountry(country string) string {
	return regionByCountry[normalizeCountry(country)]
}

// RegionName returns the display name for a region slug ("" if unknown).
func RegionName(slug string) string {
	return regionNames[slug]
}
