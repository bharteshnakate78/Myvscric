# 🏏 Cricket Score App

A comprehensive cricket scoring application with three user roles: Admin, User, and Viewer. Built with React, Spring Boot, and MySQL.

## Features

### 📋 User Roles

- **Admin**: Full control over tournaments, teams, matches, and users
- **User**: Create tournaments, manage teams & players, schedule matches, update live scores
- **Viewer**: View tournaments, matches, and live scores in real-time

### 🎯 Core Features

- **Tournament Management**: Create and manage multiple tournaments (T20, ODI, Test, T10)
- **Team Management**: Add teams with player rosters and captain assignments
- **Player Management**: Manage player details, roles, and statistics
- **Match Scheduling**: Schedule matches with date, time, venue, and teams
- **Live Scoring**: Ball-by-ball updates with:
  - Batsmen and bowler tracking
  - Runs and wickets recording
  - Various ball types (dot, single, four, six, wicket, wide, no-ball)
  - Commentary for each ball
  - Real-time scorecard updates
- **Live Viewer**: View all matches with filtering and real-time updates

## Tech Stack

### Backend

- **Java 17 & Spring Boot 3.1.0** - REST API server
- **MySQL** - Database
- **Spring Data JPA** - ORM for MySQL
- **Spring Security** - Authentication & authorization
- **JWT** - Token-based authentication
- **BCrypt** - Password hashing
- **Maven** - Build tool

### Frontend

- **React 19** - UI framework
- **Redux Toolkit** - State management
- **React Router v7** - Navigation
- **Axios** - HTTP client
- **Vite** - Build tool

## Project Structure

```
CricketScoreApp/
├── JavaBackend/
│   ├── src/main/java/com/cricketscore/
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── TournamentController.java
│   │   │   └── HealthController.java
│   │   ├── model/
│   │   │   ├── User.java
│   │   │   ├── Tournament.java
│   │   │   ├── Team.java
│   │   │   ├── Player.java
│   │   │   ├── Match.java
│   │   │   ├── Innings.java
│   │   │   └── BallUpdate.java
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   ├── TournamentRepository.java
│   │   │   ├── TeamRepository.java
│   │   │   ├── PlayerRepository.java
│   │   │   ├── MatchRepository.java
│   │   │   └── BallUpdateRepository.java
│   │   ├── service/
│   │   │   ├── UserService.java
│   │   │   └── UserServiceImpl.java
│   │   ├── security/
│   │   │   ├── SecurityConfig.java
│   │   │   ├── JwtUtil.java
│   │   │   └── JwtAuthenticationFilter.java
│   │   └── CricketScoreAppApplication.java
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── pom.xml
│   └── README.md
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── NotificationContainer.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TournamentList.jsx
│   │   │   ├── TournamentDetail.jsx
│   │   │   ├── CreateTournament.jsx
│   │   │   ├── ManageTeams.jsx
│   │   │   ├── ManagePlayers.jsx
│   │   │   ├── MatchSchedule.jsx
│   │   │   ├── LiveScorecard.jsx
│   │   │   └── Viewer.jsx
│   │   ├── store/
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js
│   │   │       ├── uiSlice.js
│   │   │       └── tournamentSlice.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
```

## Setup Instructions

### Prerequisites

- **Java 17 or higher** - [Download from Oracle](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) or [OpenJDK](https://openjdk.org/)
- **MySQL 8.0 or higher** - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- **Maven 3.6+** - [Download Maven](https://maven.apache.org/download.cgi)
- **Node.js (v14+)** for frontend - [Download Node.js](https://nodejs.org/)

### Environment Setup

1. **Install Java 17:**
   - Download and install JDK 17
   - Set `JAVA_HOME` environment variable
   - Add Java to your PATH

2. **Install Maven:**
   - Download and extract Maven
   - Set `MAVEN_HOME` environment variable
   - Add Maven's `bin` directory to your PATH

3. **Install MySQL:**
   - Download and install MySQL Server
   - Create database: `cricket_score_app`
   - Note your MySQL username and password

### Backend Setup (Java Spring Boot)

1. **Install MySQL** and create database:

```sql
CREATE DATABASE cricket_score_app;
```

2. **Navigate to Java Backend folder:**

```bash
cd "CricketScoreApp\JavaBackend"
```

3. **Configure database credentials** in `src/main/resources/application.properties`:

```properties
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
```

4. **Build and run the backend:**

```bash
# Windows
../run-java-backend.bat

# Linux/Mac
chmod +x ../run-java-backend.sh
../run-java-backend.sh
```

Or manually:

```bash
mvn clean install
mvn spring-boot:run
```

✅ **Backend running on:** `http://localhost:5001`

### Frontend Setup

1. **Navigate to Frontend folder:**

```bash
cd "CricketScoreApp\Frontend"
```

2. **Install dependencies:**

```bash
npm install
```

3. **Start the development server:**

```bash
npm run dev
```

✅ **Frontend running on:** `http://localhost:5174`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)

### Tournaments

- `GET /api/tournaments` - Get all tournaments
- `POST /api/tournaments` - Create tournament (Admin/User only)
- `GET /api/tournaments/{id}` - Get tournament by ID

### Health Check

- `GET /api/health` - Health check endpoint

## Database Schema

The application uses JPA with automatic table creation. Main entities:

- `users` - User accounts with roles (ADMIN, USER, VIEWER)
- `tournaments` - Cricket tournaments (T20, ODI, TEST, LEAGUE)
- `teams` - Cricket teams with players
- `players` - Cricket players with roles and details
- `matches` - Match schedules and results
- `innings` - Match innings data
- `ball_updates` - Ball-by-ball scoring data

## Security

- JWT-based authentication with Spring Security
- Role-based authorization (ADMIN, USER, VIEWER)
- CORS enabled for frontend integration
- Password encryption with BCrypt

## Testing the Application

1. **Open** http://localhost:5174 in your browser
2. **Sign up** as an Admin or User
3. **Login** with your credentials
4. **Create a tournament** from the dashboard
5. **Explore** the features!

## Development

### Running Tests

```bash
# Backend tests
cd JavaBackend
mvn test

# Frontend tests (if available)
cd Frontend
npm test
```

### Building for Production

```bash
# Backend
cd JavaBackend
mvn clean package

# Frontend
cd Frontend
npm run build
```

- `GET /api/players/:id` - Get player details
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Matches

- `GET /api/matches` - Get all matches
- `POST /api/matches` - Schedule match (User/Admin)
- `GET /api/matches/:id` - Get match details
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match (Admin)

### Scores

- `POST /api/scores/innings` - Create innings
- `POST /api/scores/ball-update` - Add ball update (live score)
- `GET /api/scores/match/:matchId` - Get match scorecard
- `GET /api/scores/innings/:inningsId` - Get innings details

## User Workflow

### Admin/User Flow

1. Sign up with role selection
2. Create/Select tournament
3. Create teams for tournament
4. Add players to teams
5. Schedule matches
6. Update live scores during match
7. View scorecard and statistics

### Viewer Flow

1. Sign up as Viewer
2. View all tournaments
3. View match schedules
4. Watch live scores and updates
5. View completed matches results

## Default User Roles

- **viewer**: Can only view tournaments and scores
- **user**: Can create tournaments, teams, manage players, schedule matches, update scores
- **admin**: Full administrative access

## Customization

### Adding More Match Types

Edit the Tournament model to add new types:

```javascript
type: {
  type: String,
  enum: ['T20', 'ODI', 'Test', 'T10', 'Custom', 'Your_Type'],
  required: true
}
```

### Extending Player Statistics

Modify the Player model's stats object to track additional metrics like:

- Strike rate
- Average
- Centuries/Half-centuries
- 4s/6s

### Adding WebSocket for Real-time Updates

Install Socket.io and implement real-time live score updates for viewers

## Future Enhancements

- WebSocket integration for real-time live scores
- Player performance analytics
- Tournament standings and leaderboards
- Email notifications for matches
- Mobile app (React Native)
- Advanced filtering and search
- Player fantasy cricket league
- Payment gateway for premium features

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please contact the development team.
#   M y v s c r i c  
 