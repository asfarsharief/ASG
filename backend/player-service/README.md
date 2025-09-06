# Player Service - MongoDB Backend

A Go-based microservice for managing basketball players, teams, and games with MongoDB as the NoSQL database.

## Features

- **MongoDB Integration**: Uses MongoDB as the primary database
- **RESTful API**: Complete CRUD operations for all entities
- **Docker Support**: Easy deployment with Docker Compose
- **CORS Support**: Frontend integration ready
- **Comprehensive Error Handling**: Robust error management
- **Type Safety**: Full TypeScript support for frontend

## Tech Stack

- **Backend**: Go 1.22+
- **Database**: MongoDB 7.0
- **API**: RESTful with Gorilla Mux
- **Containerization**: Docker & Docker Compose
- **Frontend**: React with TypeScript

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (MongoDB + Backend)
docker-compose up -d

# View logs
docker-compose logs -f player-service

# Stop services
docker-compose down
```

### Option 2: Local Development

1. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   
   # Or using MongoDB locally
   mongod --port 27017
   ```

2. **Start Backend**
   ```bash
   # Windows
   start-backend.bat
   
   # Linux/Mac
   MONGODB_URI=mongodb://localhost:27017/asg_db go run main.go
   ```

3. **Start Frontend**
   ```bash
   cd src
   npm install
   npm start
   ```

## API Endpoints

### Players

- `GET /api/v1/players` - Get all players (with optional filtering)
- `GET /api/v1/players/{id}` - Get a specific player
- `POST /api/v1/players` - Create a new player
- `PUT /api/v1/players/{id}` - Update a player
- `DELETE /api/v1/players/{id}` - Delete a player

### Teams

- `GET /api/v1/teams` - Get all teams (with optional filtering)
- `GET /api/v1/teams/{id}` - Get a specific team
- `GET /api/v1/teams/{id}?with_players=true` - Get team with players
- `POST /api/v1/teams` - Create a new team
- `PUT /api/v1/teams/{id}` - Update a team
- `DELETE /api/v1/teams/{id}` - Delete a team
- `GET /api/v1/teams/{id}/players` - Get team players
- `POST /api/v1/teams/{id}/players` - Add player to team
- `DELETE /api/v1/teams/{id}/players/{playerId}` - Remove player from team

### Games

- `GET /api/v1/games` - Get all games (with optional filtering)
- `GET /api/v1/games/{id}` - Get a specific game
- `GET /api/v1/games/{id}?with_stats=true` - Get game with player statistics
- `POST /api/v1/games` - Create a new game
- `PUT /api/v1/games/{id}` - Update a game
- `DELETE /api/v1/games/{id}` - Delete a game
- `GET /api/v1/games/{id}/stats` - Get game player statistics
- `POST /api/v1/games/{id}/stats` - Add player statistics to game
- `PUT /api/v1/games/{id}/stats/{statId}` - Update player statistics
- `DELETE /api/v1/games/{id}/stats/{statId}` - Delete player statistics

### Health Check

- `GET /api/v1/health` - Health check endpoint

## Query Parameters

### GET /api/v1/players

- `status` - Filter by player status (available, sold)
- `band` - Filter by player band (1-10)
- `limit` - Limit number of results
- `offset` - Offset for pagination

### GET /api/v1/teams

- `limit` - Limit number of results
- `offset` - Offset for pagination

### GET /api/v1/games

- `team_id` - Filter by team ID (home or away team)
- `date` - Filter by game date
- `limit` - Limit number of results
- `offset` - Offset for pagination

## Database Schema

### Players Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "photoUrl": "string",
  "band": "number",
  "status": "string",
  "soldTo": "string",
  "soldPrice": "number",
  "soldInRound": "number",
  "soldFromBand": "number",
  "soldFromBandName": "string",
  "soldFromBandBasePrice": "number",
  "skipped": "boolean",
  "basketballStats": {
    "winPercentage": "number",
    "pointsAverage": "number",
    "fieldGoalPercentage": "number",
    "threePointPercentage": "number",
    "freeThrowPercentage": "number",
    "reboundsAverage": "number",
    "assistsAverage": "number",
    "stealsAverage": "number",
    "blocksAverage": "number",
    "turnoversAverage": "number",
    "gamesPlayed": "number",
    "minutesPerGame": "number"
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Teams Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "captain": "string",
  "viceCaptain": "string",
  "budget": "number",
  "remainingBudget": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Games Collection
```json
{
  "_id": "ObjectId",
  "gameName": "string",
  "gameDate": "string",
  "homeTeamId": "string",
  "homeTeamName": "string",
  "awayTeamId": "string",
  "awayTeamName": "string",
  "homeScore": "number",
  "awayScore": "number",
  "gameResult": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Player Game Stats Collection
```json
{
  "_id": "ObjectId",
  "playerId": "string",
  "playerName": "string",
  "teamId": "string",
  "teamName": "string",
  "gameId": "string",
  "minutesPlayed": "number",
  "points": "number",
  "fieldGoalsMade": "number",
  "fieldGoalsAttempted": "number",
  "threePointersMade": "number",
  "threePointersAttempted": "number",
  "freeThrowsMade": "number",
  "freeThrowsAttempted": "number",
  "rebounds": "number",
  "assists": "number",
  "steals": "number",
  "blocks": "number",
  "turnovers": "number",
  "personalFouls": "number",
  "plusMinus": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

## Environment Variables

- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017/asg_db)
- `MONGODB_DATABASE` - Database name (default: asg_db)

## Development

### Prerequisites

- Go 1.22 or later
- MongoDB 7.0 or later
- Docker (optional)

### Running Tests

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test ./internal/handlers
```

### Building

```bash
# Build for current platform
go build -o player-service main.go

# Build for Linux
GOOS=linux GOARCH=amd64 go build -o player-service main.go

# Build with Docker
docker build -t player-service .
```

## Docker Services

### MongoDB
- **Port**: 27017
- **Username**: admin
- **Password**: password123
- **Database**: asg_db

### Mongo Express (Web UI)
- **Port**: 8081
- **Username**: admin
- **Password**: admin123
- **URL**: http://localhost:8081

### Player Service
- **Port**: 8080
- **URL**: http://localhost:8080/api/v1

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   failed to connect to MongoDB
   ```
   **Solution**: Ensure MongoDB is running and accessible

2. **Port Already in Use**
   ```
   listen tcp :8080: bind: address already in use
   ```
   **Solution**: Change port or stop conflicting service

3. **Docker Build Error**
   ```
   failed to build image
   ```
   **Solution**: Check Dockerfile syntax and dependencies

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs player-service
docker-compose logs mongodb

# Follow logs in real-time
docker-compose logs -f player-service
```

## API Examples

### Create Player
```bash
curl -X POST http://localhost:8080/api/v1/players \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LeBron James",
    "band": 1,
    "status": "available",
    "basketballStats": {
      "winPercentage": 0.75,
      "pointsAverage": 25.0,
      "fieldGoalPercentage": 0.50,
      "reboundsAverage": 7.5,
      "assistsAverage": 7.0
    }
  }'
```

### Create Team
```bash
curl -X POST http://localhost:8080/api/v1/teams \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Lakers",
    "captain": "LeBron James",
    "viceCaptain": "Anthony Davis",
    "budget": 100000.0
  }'
```

### Create Game
```bash
curl -X POST http://localhost:8080/api/v1/games \
  -H "Content-Type: application/json" \
  -d '{
    "gameName": "Lakers vs Warriors",
    "gameDate": "2024-01-15",
    "homeTeamId": "team_id_here",
    "homeTeamName": "Lakers",
    "awayTeamId": "team_id_here",
    "awayTeamName": "Warriors",
    "homeScore": 110,
    "awayScore": 105
  }'
```

## License

This project is licensed under the MIT License.
