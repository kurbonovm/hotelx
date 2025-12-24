# Multi-stage build for smaller image
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and source
COPY pom.xml .
COPY src ./src

# Build with retries in case Maven Central has issues
RUN mvn clean package -DskipTests -B || \
    (sleep 10 && mvn clean package -DskipTests -B) || \
    (sleep 30 && mvn clean package -DskipTests -B)

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app

# Download and install AWS DocumentDB CA certificate bundle
RUN apt-get update && apt-get install -y openssl && \
    curl -o /tmp/global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem && \
    csplit -sz /tmp/global-bundle.pem '/-BEGIN CERTIFICATE-/' '{*}' && \
    for CERT in xx*; do \
        keytool -import -trustcacerts -keystore $JAVA_HOME/lib/security/cacerts \
        -storepass changeit -noprompt -alias documentdb-$CERT -file $CERT || true; \
    done && \
    rm -f /tmp/global-bundle.pem xx* && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Add non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Change ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
