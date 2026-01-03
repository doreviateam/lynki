package main

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	var (
		privateKeyPath = flag.String("key", "/opt/dorevia-vault/keys/private.pem", "Chemin vers la clé privée RSA")
		userID         = flag.String("sub", "rdo18", "User ID (subject)")
		role           = flag.String("role", "operator", "Rôle utilisateur (admin, operator, auditor, viewer)")
		email          = flag.String("email", "", "Email utilisateur (optionnel)")
		expirationDays = flag.Int("exp", 365, "Durée de validité en jours (0 = pas d'expiration)")
	)
	flag.Parse()

	// Charger la clé privée
	privateKey, err := loadPrivateKey(*privateKeyPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Erreur lors du chargement de la clé privée: %v\n", err)
		os.Exit(1)
	}

	// Créer les claims
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":  *userID,
		"role": *role,
		"iat":  now.Unix(),
	}

	if *email != "" {
		claims["email"] = *email
	}

	if *expirationDays > 0 {
		claims["exp"] = now.Add(time.Duration(*expirationDays) * 24 * time.Hour).Unix()
	}

	// Créer et signer le token
	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	tokenString, err := token.SignedString(privateKey)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Erreur lors de la signature du token: %v\n", err)
		os.Exit(1)
	}

	// Afficher le token
	fmt.Println(tokenString)
}

func loadPrivateKey(path string) (*rsa.PrivateKey, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read key file: %w", err)
	}

	block, _ := pem.Decode(data)
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM block")
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		// Essayer PKCS8
		key, err2 := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err2 != nil {
			return nil, fmt.Errorf("failed to parse private key: %w (PKCS1) / %w (PKCS8)", err, err2)
		}
		rsaKey, ok := key.(*rsa.PrivateKey)
		if !ok {
			return nil, fmt.Errorf("key is not RSA")
		}
		return rsaKey, nil
	}

	return privateKey, nil
}

