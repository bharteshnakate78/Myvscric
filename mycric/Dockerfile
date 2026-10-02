FROM eclipse-temurin:21-jdk

WORKDIR /app/mycric

COPY mycric/ .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

EXPOSE 8081

CMD ["java", "-jar", "target/CricketTournament-0.0.1-SNAPSHOT.jar"]
