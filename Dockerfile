# syntax=docker/dockerfile:1

# --- Build stage ---
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy wrapper + pom first so dependency resolution is cached in its own
# layer and only re-runs when pom.xml (or the wrapper) actually changes.
COPY mvnw ./
COPY .mvn/ .mvn/
COPY pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

# Now bring in the sources and build the jar.
COPY src/ src/
RUN ./mvnw -B -DskipTests package

# --- Runtime stage ---
FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
