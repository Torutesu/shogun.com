# ---------------------------------------------------------------------------
# Build stage
# ---------------------------------------------------------------------------
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -o /build/agent \
    .

# ---------------------------------------------------------------------------
# Runtime stage
# ---------------------------------------------------------------------------
FROM alpine:latest

RUN apk add --no-cache \
    bash \
    coreutils \
    curl \
    git \
    jq \
    openssh-client \
    tar \
    vim \
    wget

# Create non-root user.
RUN addgroup -g 1000 user && \
    adduser -u 1000 -G user -h /home/user -s /bin/bash -D user

COPY --from=builder /build/agent /usr/local/bin/agent

# Ensure home directory exists with correct permissions.
RUN mkdir -p /home/user && chown -R user:user /home/user

USER user
WORKDIR /home/user

EXPOSE 9000

ENTRYPOINT ["agent"]
