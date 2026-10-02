FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY mycric/ mycric/

RUN chmod +x mycric/mvnw
RUN cd mycric && ./mvnw clean package -DskipTests

EXPOSE 8081

CMD ["java", "-jar", "mycric/target/CricketTournament-0.0.1-SNAPSHOT.jar"]