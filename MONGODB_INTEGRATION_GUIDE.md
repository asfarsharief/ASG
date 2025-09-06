# MongoDB Integration Guide

This guide explains how to run the integrated frontend and backend application with MongoDB as the NoSQL database.

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (MongoDB + Backend + Mongo Express)
cd backend/player-service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Local Development

1. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   
   # Or install MongoDB locally
   # Windows: Download from https://www.mongodb.com/try/download/community
   # macOS: brew install mongodb-community
   # Linux: sudo apt-get install mongodb
   ```

2. **Start Backend**
   ```bash
   cd backend/player-service
   
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

## 🔧 Services Overview

### MongoDB Database
- **Port**: 27017
- **Database**: asg_db
- **Collections**: players, teams, games, player_game_stats
- **Web UI**: Mongo Express on http://localhost:8081

### Backend API
- **Port**: 8080
- **Base URL**: http://localhost:8080/api/v1
- **Health Check**: http://localhost:8080/api/v1/health

### Frontend
- **Port**: 3000
- **URL**: http://localhost:3000

## 📊 MongoDB Schema

### Players Collection
```javascript
{
  _id: ObjectId,
  name: String,
  photoUrl: String,
  band: Number (1-10),
  status: String ("available" | "sold"),
  soldTo: String,
  soldPrice: Number,
  soldInRound: Number,
  soldFromBand: Number,
  soldFromBandName: String,
  soldFromBandBasePrice: Number,
  skipped: Boolean,
  basketballStats: {
    winPercentage: Number,
    pointsAverage: Number,
    fieldGoalPercentage: Number,
    threePointPercentage: Number,
    freeThrowPercentage: Number,
    reboundsAverage: Number,
    assistsAverage: Number,
    stealsAverage: Number,
    blocksAverage: Number,
    turnoversAverage: Number,
    gamesPlayed: Number,
    minutesPerGame: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Teams Collection
```javascript
{
  _id: ObjectId,
  name: String,
  captain: String,
  viceCaptain: String,
  budget: Number,
  remainingBudget: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Games Collection
```javascript
{
  _id: ObjectId,
  gameName: String,
  gameDate: String,
  homeTeamId: String,
  homeTeamName: String,
  awayTeamId: String,
  awayTeamName: String,
  homeScore: Number,
  awayScore: Number,
  gameResult: String ("home_win" | "away_win"),
  createdAt: Date,
  updatedAt: Date
}
```

### Player Game Stats Collection
```javascript
{
  _id: ObjectId,
  playerId: String,
  playerName: String,
  teamId: String,
  teamName: String,
  gameId: String,
  minutesPlayed: Number,
  points: Number,
  fieldGoalsMade: Number,
  fieldGoalsAttempted: Number,
  threePointersMade: Number,
  threePointersAttempted: Number,
  freeThrowsMade: Number,
  freeThrowsAttempted: Number,
  rebounds: Number,
  assists: Number,
  steals: Number,
  blocks: Number,
  turnovers: Number,
  personalFouls: Number,
  plusMinus: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing the Integration

### Run Integration Test
```bash
node test-mongodb-integration.js
```

### Manual API Testing

1. **Health Check**
   ```bash
   curl http://localhost:8080/api/v1/health
   ```

2. **Create Player**
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
         "fieldGoalPercentage": 0.50
       }
     }'
   ```

3. **Get All Players**
   ```bash
   curl http://localhost:8080/api/v1/players
   ```

4. **Create Team**
   ```bash
   curl -X POST http://localhost:8080/api/v1/teams \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Lakers",
       "captain": "LeBron James",
       "budget": 100000.0
     }'
   ```

5. **Create Game**
   ```bash
   curl -X POST http://localhost:8080/api/v1/games \
     -H "Content-Type: application/json" \
     -d '{
       "gameName": "Lakers vs Warriors",
       "gameDate": "2024-01-15",
       "homeTeamId": "team_id",
       "homeTeamName": "Lakers",
       "awayTeamId": "team_id",
       "awayTeamName": "Warriors",
       "homeScore": 110,
       "awayScore": 105
     }'
   ```

## 🔍 MongoDB Web Interface

Access Mongo Express at http://localhost:8081

- **Username**: admin
- **Password**: admin123

This provides a web-based interface to:
- View all collections and documents
- Run MongoDB queries
- Monitor database performance
- Manage indexes

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   failed to connect to MongoDB
   ```
   **Solutions**:
   - Ensure MongoDB is running: `docker ps | grep mongo`
   - Check connection string: `MONGODB_URI=mongodb://localhost:27017/asg_db`
   - Verify MongoDB logs: `docker-compose logs mongodb`

2. **Backend Won't Start**
   ```
   listen tcp :8080: bind: address already in use
   ```
   **Solutions**:
   - Change port in main.go
   - Stop conflicting service: `lsof -ti:8080 | xargs kill -9`
   - Use different port: `PORT=8081 go run main.go`

3. **Frontend Can't Connect**
   ```
   Failed to fetch
   ```
   **Solutions**:
   - Check backend is running: `curl http://localhost:8080/api/v1/health`
   - Verify CORS configuration
   - Check network connectivity

4. **Docker Issues**
   ```
   docker-compose up fails
   ```
   **Solutions**:
   - Check Docker is running
   - Verify docker-compose.yml syntax
   - Check port conflicts
   - Run: `docker-compose down && docker-compose up -d`

### Debug Commands

```bash
# Check MongoDB status
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb

# Check backend logs
docker-compose logs player-service

# Test MongoDB connection
docker exec -it asg-mongodb mongosh

# Check if ports are open
netstat -tulpn | grep :27017
netstat -tulpn | grep :8080

# Test API endpoints
curl -v http://localhost:8080/api/v1/health
```

## 📈 Performance Considerations

### MongoDB Optimization

1. **Indexes**: Add indexes for frequently queried fields
   ```javascript
   // Example indexes
   db.players.createIndex({ "band": 1 })
   db.players.createIndex({ "status": 1 })
   db.games.createIndex({ "gameDate": -1 })
   db.player_game_stats.createIndex({ "gameId": 1 })
   ```

2. **Connection Pooling**: MongoDB driver handles connection pooling automatically

3. **Query Optimization**: Use projection to limit returned fields
   ```javascript
   // Only return necessary fields
   db.players.find({}, { name: 1, band: 1, status: 1 })
   ```

### Backend Optimization

1. **Pagination**: Use limit and offset for large datasets
2. **Caching**: Implement Redis for frequently accessed data
3. **Compression**: Enable gzip compression for API responses

## 🔒 Security Considerations

1. **MongoDB Authentication**: Enable authentication in production
2. **Network Security**: Use VPN or private networks
3. **API Security**: Implement rate limiting and authentication
4. **Data Validation**: Validate all input data
5. **HTTPS**: Use HTTPS in production

## 🚀 Production Deployment

### Environment Variables
```bash
MONGODB_URI=mongodb://username:password@host:port/database
MONGODB_DATABASE=asg_db
PORT=8080
```

### Docker Production
```bash
# Build production image
docker build -t player-service:latest .

# Run with production settings
docker run -d \
  -p 8080:8080 \
  -e MONGODB_URI=mongodb://prod-host:27017/asg_db \
  player-service:latest
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: player-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: player-service
  template:
    metadata:
      labels:
        app: player-service
    spec:
      containers:
      - name: player-service
        image: player-service:latest
        ports:
        - containerPort: 8080
        env:
        - name: MONGODB_URI
          value: "mongodb://mongodb-service:27017/asg_db"
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Go MongoDB Driver](https://docs.mongodb.com/drivers/go/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)

## ✅ Integration Checklist

- [ ] MongoDB running on port 27017
- [ ] Backend API running on port 8080
- [ ] Frontend running on port 3000
- [ ] Health check endpoint responding
- [ ] Player CRUD operations working
- [ ] Team CRUD operations working
- [ ] Game CRUD operations working
- [ ] Player stats working
- [ ] Frontend-backend communication working
- [ ] Error handling working
- [ ] Loading states working

The MongoDB integration is now complete and ready for development! 🎉
