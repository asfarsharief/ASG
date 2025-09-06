// MongoDB Integration Test Script
// Run with: node test-mongodb-integration.js

const API_BASE_URL = 'http://localhost:8080/api/v1';

async function testMongoDBIntegration() {
  console.log('🧪 Testing MongoDB Backend Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      throw new Error('Backend health check failed');
    }

    // Test 2: Create Player
    console.log('\n2. Testing player creation...');
    const playerData = {
      name: 'MongoDB Test Player',
      band: 1,
      status: 'available',
      basketballStats: {
        winPercentage: 0.75,
        pointsAverage: 20.5,
        fieldGoalPercentage: 0.45,
        threePointPercentage: 0.35,
        freeThrowPercentage: 0.85,
        reboundsAverage: 8.2,
        assistsAverage: 6.1,
        stealsAverage: 1.8,
        blocksAverage: 1.2,
        turnoversAverage: 3.1,
        gamesPlayed: 15,
        minutesPerGame: 32.5
      }
    };

    const createPlayerResponse = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    });

    if (!createPlayerResponse.ok) {
      throw new Error('Failed to create player');
    }

    const createdPlayer = await createPlayerResponse.json();
    console.log('✅ Player created successfully');
    const playerId = createdPlayer.data.id;

    // Test 3: Get Players
    console.log('\n3. Testing player retrieval...');
    const getPlayersResponse = await fetch(`${API_BASE_URL}/players`);
    if (!getPlayersResponse.ok) {
      throw new Error('Failed to get players');
    }
    const players = await getPlayersResponse.json();
    console.log(`✅ Retrieved ${players.data.length} players`);

    // Test 4: Create Team
    console.log('\n4. Testing team creation...');
    const teamData = {
      name: 'MongoDB Test Team',
      captain: 'Test Captain',
      viceCaptain: 'Test Vice Captain',
      budget: 50000.0
    };

    const createTeamResponse = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData)
    });

    if (!createTeamResponse.ok) {
      throw new Error('Failed to create team');
    }

    const createdTeam = await createTeamResponse.json();
    console.log('✅ Team created successfully');
    const teamId = createdTeam.data.id;

    // Test 5: Create Game
    console.log('\n5. Testing game creation...');
    const gameData = {
      gameName: 'MongoDB Test Game',
      gameDate: '2024-01-15',
      homeTeamId: teamId,
      homeTeamName: 'MongoDB Test Team',
      awayTeamId: 'away-team-id',
      awayTeamName: 'Away Team',
      homeScore: 100,
      awayScore: 95
    };

    const createGameResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });

    if (!createGameResponse.ok) {
      throw new Error('Failed to create game');
    }

    const createdGame = await createGameResponse.json();
    console.log('✅ Game created successfully');
    const gameId = createdGame.data.id;

    // Test 6: Add Player Stats
    console.log('\n6. Testing player stats addition...');
    const statsData = {
      playerId: playerId,
      playerName: 'MongoDB Test Player',
      teamId: teamId,
      teamName: 'MongoDB Test Team',
      minutesPlayed: 35,
      points: 25,
      rebounds: 10,
      assists: 8,
      fieldGoalsMade: 10,
      fieldGoalsAttempted: 20,
      threePointersMade: 3,
      threePointersAttempted: 8,
      freeThrowsMade: 2,
      freeThrowsAttempted: 3
    };

    const addStatsResponse = await fetch(`${API_BASE_URL}/games/${gameId}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statsData)
    });

    if (!addStatsResponse.ok) {
      throw new Error('Failed to add player stats');
    }
    console.log('✅ Player stats added successfully');

    // Test 7: Get Game with Stats
    console.log('\n7. Testing game with stats retrieval...');
    const getGameResponse = await fetch(`${API_BASE_URL}/games/${gameId}?with_stats=true`);
    if (!getGameResponse.ok) {
      throw new Error('Failed to get game with stats');
    }
    const gameWithStats = await getGameResponse.json();
    console.log(`✅ Retrieved game with ${gameWithStats.data.playerStats.length} player stats`);

    // Test 8: Test MongoDB-specific features
    console.log('\n8. Testing MongoDB-specific features...');
    
    // Test aggregation-like query (get players by band)
    const bandPlayersResponse = await fetch(`${API_BASE_URL}/players?band=1`);
    if (!bandPlayersResponse.ok) {
      throw new Error('Failed to get players by band');
    }
    const bandPlayers = await bandPlayersResponse.json();
    console.log(`✅ Retrieved ${bandPlayers.data.length} players from band 1`);

    // Test 9: Cleanup
    console.log('\n9. Cleaning up test data...');
    await fetch(`${API_BASE_URL}/players/${playerId}`, { method: 'DELETE' });
    await fetch(`${API_BASE_URL}/teams/${teamId}`, { method: 'DELETE' });
    await fetch(`${API_BASE_URL}/games/${gameId}`, { method: 'DELETE' });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All MongoDB integration tests passed!');
    console.log('\nThe MongoDB backend integration is working correctly.');
    console.log('You can now start the frontend with: npm start');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the backend is running on port 8080');
    console.log('2. Check if MongoDB is running on port 27017');
    console.log('3. Verify the backend API endpoints are working');
    console.log('4. Run: curl http://localhost:8080/api/v1/health');
    console.log('5. Check MongoDB connection: docker-compose logs mongodb');
  }
}

// Run the test
testMongoDBIntegration();
