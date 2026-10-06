package service

import (
	"crypto/rand"
	"math/big"
	"strings"
)

// leagueCodeAlphabet drops the look-alike characters (0/O, 1/I/L) so codes survive
// being read aloud or typed from a screenshot. 31 symbols ^ 8 chars ≈ 8.5e11 codes.
const leagueCodeAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

// LeagueCodeLength is the number of characters in a code (without the display dash).
const LeagueCodeLength = 8

// GenerateLeagueCode returns a random invite code from crypto/rand.
func GenerateLeagueCode() (string, error) {
	max := big.NewInt(int64(len(leagueCodeAlphabet)))
	b := make([]byte, LeagueCodeLength)
	for i := range b {
		n, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		b[i] = leagueCodeAlphabet[n.Int64()]
	}
	return string(b), nil
}

// NormalizeLeagueCode turns what a person typed ("abcd-efgh ", "ABCD EFGH") into the
// stored form. It does not validate; use IsValidLeagueCode for that.
func NormalizeLeagueCode(input string) string {
	var sb strings.Builder
	for _, r := range strings.ToUpper(input) {
		if r == ' ' || r == '-' || r == '_' {
			continue
		}
		sb.WriteRune(r)
	}
	return sb.String()
}

// IsValidLeagueCode reports whether a normalised code has the right shape.
func IsValidLeagueCode(code string) bool {
	if len(code) != LeagueCodeLength {
		return false
	}
	for _, r := range code {
		if !strings.ContainsRune(leagueCodeAlphabet, r) {
			return false
		}
	}
	return true
}

// FormatLeagueCode adds a dash in the middle for display: "ABCD2345" -> "ABCD-2345".
func FormatLeagueCode(code string) string {
	if len(code) != LeagueCodeLength {
		return code
	}
	return code[:LeagueCodeLength/2] + "-" + code[LeagueCodeLength/2:]
}
