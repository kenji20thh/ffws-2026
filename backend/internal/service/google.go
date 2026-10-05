package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type GoogleIdentity struct {
	Sub   string
	Email string // lowercased
}

type tokenInfo struct {
	Aud           string `json:"aud"`
	Iss           string `json:"iss"`
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"` // Google returns "true"/"false" as a string here
}

// VerifyGoogleIDToken asks Google to validate the ID token (signature + expiry), then checks
// it was issued for OUR client id and carries a verified email.
func VerifyGoogleIDToken(ctx context.Context, idToken, clientID string) (*GoogleIdentity, error) {
	if clientID == "" {
		return nil, errors.New("google sign-in is not configured")
	}

	ctx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()

	endpoint := "https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(idToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("google verification failed: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, errors.New("invalid google token")
	}

	var info tokenInfo
	if err := json.NewDecoder(res.Body).Decode(&info); err != nil {
		return nil, errors.New("invalid google token")
	}
	if info.Aud != clientID {
		return nil, errors.New("google token was issued for a different app")
	}
	if info.Iss != "accounts.google.com" && info.Iss != "https://accounts.google.com" {
		return nil, errors.New("invalid google token issuer")
	}
	if info.Sub == "" || info.Email == "" || info.EmailVerified != "true" {
		return nil, errors.New("google account has no verified email")
	}
	return &GoogleIdentity{Sub: info.Sub, Email: strings.ToLower(strings.TrimSpace(info.Email))}, nil
}

// UsernameBase turns an email into a username candidate: "Amine.B@gmail.com" -> "amine.b".
// Allowed characters are a-z 0-9 . _ - ; anything else is dropped. Short results are padded.
func UsernameBase(email string, minLen, maxLen int) string {
	local := email
	if i := strings.LastIndex(email, "@"); i >= 0 {
		local = email[:i]
	}
	var b strings.Builder
	for _, r := range strings.ToLower(local) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '.' || r == '_' || r == '-' {
			b.WriteRune(r)
		}
	}
	base := b.String()
	for len(base) < minLen {
		base += "user"
	}
	if len(base) > maxLen {
		base = base[:maxLen]
	}
	return base
}
