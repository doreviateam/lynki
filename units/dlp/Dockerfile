# DLP — Decision Link Performance (Go, Fiber)
# SPEC : ZeDocs/web31/SPEC_DLP_v0.3.md
# Port : 8020

FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -ldflags "-s -w" -o /dlp ./cmd/dlp

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /dlp .
COPY migrations/ ./migrations/

EXPOSE 8020
ENV PORT=8020

CMD ["./dlp"]
