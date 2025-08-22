# Stage 1: Build React (Vite/CRA อะไรก็ได้)
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
# ถ้าโค้ด Go อยู่โฟลเดอร์เดียวกับ frontend ให้ย้ายส่วนที่ไม่เกี่ยวออก หรือ .dockerignore ให้เรียบร้อย
# สมมติ frontend อยู่ที่ ./web และมีสคริปต์ build ออกที่ web/dist
WORKDIR /app
RUN yarn build

# Stage 2: Build Go
FROM golang:1.23.1-alpine AS gobuild
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
# คัดลอก dist จาก stage แรกเข้า /app/dist เพื่อให้ embed เจอ
COPY --from=frontend /app/dist ./dist
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags "-s -w -X main.buildTime=$(date -u +%FT%TZ)" -o server

# Stage 3: Runtime (เล็ก เบา)
FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=gobuild /app/server ./server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["./server"]
