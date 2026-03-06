# DIVA — Lecture synthétique KPI Linky (Go, Fiber)
# SPEC : ZeDocs/web22/SPEC_DIVA_API_v1.0.md
# Plan : ZeDocs/web22/PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md
# Port : 8010 (interne)

FROM golang:1.24-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -ldflags "-s -w" -o /diva ./cmd/diva && \
    CGO_ENABLED=0 go build -ldflags "-s -w" -o /diva-runner ./cmd/diva-runner

# Runtime minimal
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata wget

WORKDIR /app
COPY --from=builder /diva .
COPY --from=builder /diva-runner .

EXPOSE 8010
ENV DIVA_PORT=8010

CMD ["./diva"]
