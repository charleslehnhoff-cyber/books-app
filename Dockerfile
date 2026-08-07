# Stage 1: Build Next.js static export inside Node Debian
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# Stage 2: Build Spring Boot backend with embedded static resources
FROM maven:3.9-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/pom.xml .
COPY backend/src ./src

# Copy Next.js static export directly into Spring Boot static resources
COPY --from=frontend-builder /app/frontend/out ./src/main/resources/static/

# Build executable Spring Boot jar
RUN mvn clean package -DskipTests

# Stage 3: Final JRE Runtime
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=backend-builder /app/backend/target/books-0.0.1-SNAPSHOT.jar app.jar

ENV PORT=8080
ENV JAVA_TOOL_OPTIONS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8 -Dio.grpc.netty.shaded.io.netty.handler.ssl.noOpenSsl=true"
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
