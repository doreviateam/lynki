# Dockerfile pour Dorevia Vault
# Sprint 4 - US-4.1
# Version : 1.0

FROM golang:1.23-alpine AS builder

# Installer les dépendances nécessaires
RUN apk add --no-cache git make

# Définir le répertoire de travail
WORKDIR /build

# Copier les fichiers de dépendances
COPY go.mod go.sum ./
RUN go mod download

# Copier le code source
COPY . .

# Build de l'application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o vault ./cmd/vault

# Image finale
FROM alpine:latest

# Installer les dépendances runtime
RUN apk --no-cache add ca-certificates tzdata wget curl

# Créer un utilisateur non-root
RUN addgroup -g 1000 vault && \
    adduser -D -u 1000 -G vault vault

# Créer les répertoires nécessaires
RUN mkdir -p /opt/dorevia-vault/{storage,ledger,audit,keys} && \
    chown -R vault:vault /opt/dorevia-vault

# Copier le binaire depuis le builder
COPY --from=builder /build/vault /usr/local/bin/vault

# Définir le répertoire de travail
WORKDIR /opt/dorevia-vault

# Utilisateur non-root
USER vault

# Exposer le port (configurable via PORT env var, défaut 8080)
EXPOSE 8080

# Healthcheck (le port sera configuré via variable d'environnement PORT)
# Note: Le healthcheck dans docker-compose override celui du Dockerfile

# Commande par défaut
CMD ["vault"]

