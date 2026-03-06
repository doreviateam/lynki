# Dorevia Vault — Build minimal avec route /ui/system/vault-health (Linky Integrity Badge)
# Sprint 4 - US-4.1 + SPEC LINKY LAYOUT v1.3
# Port : 8080

FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -ldflags "-s -w" -o /vault ./cmd/vault

# Runtime minimal
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /vault .

EXPOSE 8080
ENV PORT=8080

CMD ["./vault"]
