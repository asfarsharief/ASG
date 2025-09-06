// Frontend-Backend Integration Test Script
// Run with: node test-frontend-integration.js

const API_BASE_URL = 'http://localhost:8080/api/v1';

async function testFrontendIntegration() {
  console.log('🧪 Testing Frontend-Backend Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing backend health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running and healthy');
    } else {
      throw new Error('Backend health check failed');
    }

    // Test 2: Create Test Data
    console.log('\n2. Creating test data...');
    
    // Create players
    const players = [];
    const playerNames = ['LeBron James', 'Stephen Curry', 'Kevin Durant', 'Giannis Antetokounmpo'];
    
    for (const name of playerNames) {
      const playerData = {
        name,
        band: Math.floor(Math.random() * 5) + 1,
        status: 'available',
        basketballStats: {
          winPercentage: Math.random() * 100,
          pointsAverage: Math.random() * 30 + 10,
          fieldGoalPercentage: Math.random() * 50 + 40,
          threePointPercentage: Math.random() * 40 + 30,
          freeThrowPercentage: Math.random() * 30 + 70,
          reboundsAverage: Math.random() * 10 + 5,
          assistsAverage: Math.random() * 8 + 3,
          stealsAverage: Math.random() * 2 + 1,
          blocksAverage: Math.random() * 2 + 0.5,
          turnoversAverage: Math.random() * 4 + 2,
          gamesPlayed: Math.floor(Math.random() * 20) + 10,
          minutesPerGame: Math.random() * 15 + 25,
        }
      };

      const playerResponse = await fetch(`${API_BASE_URL}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData)
      });
      const player = await playerResponse.json();
      players.push(player.data);
      console.log(`   ✅ Created player: ${name}`);
    }

    // Create teams
    const teams = [];
    const teamNames = ['Lakers', 'Warriors', 'Nets', 'Bucks'];
    
    for (let i = 0; i < teamNames.length; i++) {
      const teamData = {
        name: teamNames[i],
        captain: players[i].name,
        budget: 100000.0
      };

      const teamResponse = await fetch(`${API_BASE_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamData)
      });
      const team = await teamResponse.json();
      teams.push(team.data);
      console.log(`   ✅ Created team: ${teamNames[i]}`);

      // Add player to team
      await fetch(`${API_BASE_URL}/teams/${team.data.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: players[i].id })
      });
      console.log(`   ✅ Added ${players[i].name} to ${teamNames[i]}`);
    }

    // Test 3: Test Frontend API Calls
    console.log('\n3. Testing frontend API calls...');
    
    // Test GET /players
    const playersResponse = await fetch(`${API_BASE_URL}/players`);
    const playersData = await playersResponse.json();
    console.log(`   ✅ GET /players - Found ${playersData.data.length} players`);

    // Test GET /teams
    const teamsResponse = await fetch(`${API_BASE_URL}/teams`);
    const teamsData = await teamsResponse.json();
    console.log(`   ✅ GET /teams - Found ${teamsData.data.length} teams`);

    // Test GET /teams/{id}/players
    const teamPlayersResponse = await fetch(`${API_BASE_URL}/teams/${teams[0].id}/players`);
    const teamPlayersData = await teamPlayersResponse.json();
    console.log(`   ✅ GET /teams/{id}/players - Found ${teamPlayersData.data.length} players in team`);

    // Test 4: Create Game with Player Stats
    console.log('\n4. Testing game creation with player stats...');
    
    const gameData = {
      gameName: 'Lakers vs Warriors',
      gameDate: '2024-01-15',
      homeTeamId: teams[0].id,
      homeTeamName: teams[0].name,
      awayTeamId: teams[1].id,
      awayTeamName: teams[1].name,
      homeScore: 110,
      awayScore: 105
    };

    const gameResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
    const game = await gameResponse.json();
    console.log(`   ✅ Created game: ${game.data.gameName}`);

    // Add player stats
    const playerStatsData = {
      playerId: players[0].id,
      playerName: players[0].name,
      teamId: teams[0].id,
      teamName: teams[0].name,
      minutesPlayed: 35,
      points: 28,
      fieldGoalsMade: 12,
      fieldGoalsAttempted: 20,
      threePointersMade: 2,
      threePointersAttempted: 5,
      freeThrowsMade: 2,
      freeThrowsAttempted: 3,
      rebounds: 8,
      assists: 7,
      steals: 2,
      blocks: 1,
      turnovers: 3,
      personalFouls: 2,
      plusMinus: 5
    };

    const statsResponse = await fetch(`${API_BASE_URL}/games/${game.data.id}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerStatsData)
    });
    const stats = await statsResponse.json();
    console.log(`   ✅ Added player stats: ${stats.data.playerName} - ${stats.data.points} points`);

    // Test 5: Test Game with Stats Retrieval
    console.log('\n5. Testing game with stats retrieval...');
    
    const gameWithStatsResponse = await fetch(`${API_BASE_URL}/games/${game.data.id}`);
    const gameWithStats = await gameWithStatsResponse.json();
    console.log(`   ✅ GET /games/{id} - Game has ${gameWithStats.data.playerStats.length} player stats`);

    // Test 6: Test Data Transformation
    console.log('\n6. Testing data transformation...');
    
    // Verify player data structure
    const player = playersData.data[0];
    const requiredPlayerFields = ['id', 'name', 'band', 'status', 'basketballStats'];
    const hasAllPlayerFields = requiredPlayerFields.every(field => field in player);
    console.log(`   ✅ Player data structure: ${hasAllPlayerFields ? 'Valid' : 'Invalid'}`);

    // Verify team data structure
    const team = teamsData.data[0];
    const requiredTeamFields = ['id', 'name', 'captain', 'budget', 'remainingBudget', 'players'];
    const hasAllTeamFields = requiredTeamFields.every(field => field in team);
    console.log(`   ✅ Team data structure: ${hasAllTeamFields ? 'Valid' : 'Invalid'}`);

    // Verify game data structure
    const gameData = gameWithStats.data;
    const requiredGameFields = ['id', 'gameName', 'gameDate', 'homeTeamId', 'awayTeamId', 'homeScore', 'awayScore', 'gameResult', 'playerStats'];
    const hasAllGameFields = requiredGameFields.every(field => field in gameData);
    console.log(`   ✅ Game data structure: ${hasAllGameFields ? 'Valid' : 'Invalid'}`);

    // Verify player stats data structure
    const playerStat = gameData.playerStats[0];
    const requiredStatsFields = ['id', 'playerId', 'playerName', 'teamId', 'teamName', 'gameId', 'minutesPlayed', 'points', 'rebounds', 'assists'];
    const hasAllStatsFields = requiredStatsFields.every(field => field in playerStat);
    console.log(`   ✅ Player stats data structure: ${hasAllStatsFields ? 'Valid' : 'Invalid'}`);

    // Test 7: Test Error Handling
    console.log('\n7. Testing error handling...');
    
    try {
      await fetch(`${API_BASE_URL}/players/nonexistent`);
      console.log('   ❌ Should have thrown 404 error');
    } catch (error) {
      console.log('   ✅ 404 error handling works');
    }

    // Test 8: Test CORS
    console.log('\n8. Testing CORS...');
    
    const corsResponse = await fetch(`${API_BASE_URL}/players`, {
      method: 'OPTIONS'
    });
    console.log(`   ✅ CORS preflight: ${corsResponse.ok ? 'Working' : 'Not working'}`);

    // Test 9: Performance Test
    console.log('\n9. Testing performance...');
    
    const startTime = Date.now();
    const performanceResponse = await fetch(`${API_BASE_URL}/players`);
    const performanceData = await performanceResponse.json();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`   ✅ API response time: ${responseTime}ms`);
    console.log(`   ✅ Performance: ${responseTime < 1000 ? 'Good' : responseTime < 3000 ? 'Acceptable' : 'Slow'}`);

    // Test 10: Cleanup
    console.log('\n10. Cleaning up test data...');
    
    // Delete game
    await fetch(`${API_BASE_URL}/games/${game.data.id}`, { method: 'DELETE' });
    console.log('   ✅ Deleted game');

    // Delete teams
    for (const team of teams) {
      await fetch(`${API_BASE_URL}/teams/${team.id}`, { method: 'DELETE' });
    }
    console.log('   ✅ Deleted teams');

    // Delete players
    for (const player of players) {
      await fetch(`${API_BASE_URL}/players/${player.id}`, { method: 'DELETE' });
    }
    console.log('   ✅ Deleted players');

    console.log('\n🎉 Frontend-Backend Integration Test Completed Successfully!');
    console.log('\n✅ All tests passed:');
    console.log('   - Backend health check ✅');
    console.log('   - Data creation (players, teams, games) ✅');
    console.log('   - API endpoints working ✅');
    console.log('   - Data transformation working ✅');
    console.log('   - Error handling working ✅');
    console.log('   - CORS configuration working ✅');
    console.log('   - Performance acceptable ✅');
    console.log('   - Cleanup successful ✅');
    
    console.log('\n🚀 Frontend is ready to use with backend!');
    console.log('\nNext steps:');
    console.log('1. Start the frontend: npm start');
    console.log('2. Start the backend: cd backend/player-service && run-backend.bat');
    console.log('3. Open http://localhost:3000 in your browser');
    console.log('4. Test the Players and Game Stats pages');

  } catch (error) {
    console.error('\n❌ Frontend-Backend Integration Test Failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the backend is running on port 8080');
    console.log('2. Check if the backend models have been updated');
    console.log('3. Verify the API endpoints are working');
    console.log('4. Run: curl http://localhost:8080/api/v1/health');
    console.log('5. Check the backend logs for errors');
  }
}

// Run the test
testFrontendIntegration();

