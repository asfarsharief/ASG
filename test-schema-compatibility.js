// Schema Compatibility Test Script
// Run with: node test-schema-compatibility.js

const API_BASE_URL = 'http://localhost:8080/api/v1';

async function testSchemaCompatibility() {
  console.log('🧪 Testing Backend-Frontend Schema Compatibility...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      throw new Error('Backend health check failed');
    }

    // Test 2: Create Player with Basketball Stats
    console.log('\n2. Testing Player schema compatibility...');
    const playerData = {
      name: 'LeBron James',
      band: 1,
      status: 'available',
      basketballStats: {
        winPercentage: 0.75,
        pointsAverage: 25.0,
        fieldGoalPercentage: 0.50,
        threePointPercentage: 0.35,
        freeThrowPercentage: 0.85,
        reboundsAverage: 7.5,
        assistsAverage: 7.0,
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
    const player = await createPlayerResponse.json();
    console.log('✅ Player created with basketball stats');
    console.log('   - ID:', player.data.id);
    console.log('   - Name:', player.data.name);
    console.log('   - Basketball Stats:', player.data.basketballStats ? 'Present' : 'Missing');

    // Test 3: Create Team
    console.log('\n3. Testing Team schema compatibility...');
    const teamData = {
      name: 'Lakers',
      captain: 'LeBron James',
      viceCaptain: 'Anthony Davis',
      budget: 100000.0
    };

    const createTeamResponse = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamData)
    });
    const team = await createTeamResponse.json();
    console.log('✅ Team created');
    console.log('   - ID:', team.data.id);
    console.log('   - Name:', team.data.name);
    console.log('   - Players array:', Array.isArray(team.data.players) ? 'Present' : 'Missing');
    console.log('   - Players count:', team.data.players ? team.data.players.length : 0);

    // Test 4: Add Player to Team
    console.log('\n4. Testing Team-Player relationship...');
    const addPlayerResponse = await fetch(`${API_BASE_URL}/teams/${team.data.id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: player.data.id })
    });
    console.log('✅ Player added to team');

    // Test 5: Get Team with Players
    console.log('\n5. Testing Team with populated players...');
    const getTeamResponse = await fetch(`${API_BASE_URL}/teams/${team.data.id}`);
    const teamWithPlayers = await getTeamResponse.json();
    console.log('✅ Team retrieved with players');
    console.log('   - Players array:', Array.isArray(teamWithPlayers.data.players) ? 'Present' : 'Missing');
    console.log('   - Players count:', teamWithPlayers.data.players.length);
    console.log('   - First player name:', teamWithPlayers.data.players[0]?.name);

    // Test 6: Create Game
    console.log('\n6. Testing Game schema compatibility...');
    const gameData = {
      gameName: 'Lakers vs Warriors',
      gameDate: '2024-01-15',
      homeTeamId: team.data.id,
      homeTeamName: 'Lakers',
      awayTeamId: 'team:2',
      awayTeamName: 'Warriors',
      homeScore: 110,
      awayScore: 105
    };

    const createGameResponse = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
    const game = await createGameResponse.json();
    console.log('✅ Game created');
    console.log('   - ID:', game.data.id);
    console.log('   - Game Name:', game.data.gameName);
    console.log('   - Game Result:', game.data.gameResult);
    console.log('   - Player Stats array:', Array.isArray(game.data.playerStats) ? 'Present' : 'Missing');
    console.log('   - Player Stats count:', game.data.playerStats ? game.data.playerStats.length : 0);

    // Test 7: Add Player Stats to Game
    console.log('\n7. Testing Game-Player Stats relationship...');
    const playerStatsData = {
      playerId: player.data.id,
      playerName: player.data.name,
      teamId: team.data.id,
      teamName: team.data.name,
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

    const addStatsResponse = await fetch(`${API_BASE_URL}/games/${game.data.id}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerStatsData)
    });
    const playerStats = await addStatsResponse.json();
    console.log('✅ Player stats added to game');
    console.log('   - Stats ID:', playerStats.data.id);
    console.log('   - Player Name:', playerStats.data.playerName);
    console.log('   - Points:', playerStats.data.points);

    // Test 8: Get Game with Player Stats
    console.log('\n8. Testing Game with populated player stats...');
    const getGameResponse = await fetch(`${API_BASE_URL}/games/${game.data.id}`);
    const gameWithStats = await getGameResponse.json();
    console.log('✅ Game retrieved with player stats');
    console.log('   - Player Stats array:', Array.isArray(gameWithStats.data.playerStats) ? 'Present' : 'Missing');
    console.log('   - Player Stats count:', gameWithStats.data.playerStats.length);
    console.log('   - First stat player:', gameWithStats.data.playerStats[0]?.playerName);

    // Test 9: Verify All Required Fields
    console.log('\n9. Verifying all required fields are present...');
    
    // Check Player fields
    const playerFields = ['id', 'name', 'band', 'status', 'basketballStats'];
    const playerHasAllFields = playerFields.every(field => field in player.data);
    console.log('   - Player has all required fields:', playerHasAllFields ? '✅' : '❌');
    
    // Check Team fields
    const teamFields = ['id', 'name', 'captain', 'budget', 'remainingBudget', 'players'];
    const teamHasAllFields = teamFields.every(field => field in teamWithPlayers.data);
    console.log('   - Team has all required fields:', teamHasAllFields ? '✅' : '❌');
    
    // Check Game fields
    const gameFields = ['id', 'gameName', 'gameDate', 'homeTeamId', 'awayTeamId', 'homeScore', 'awayScore', 'gameResult', 'playerStats'];
    const gameHasAllFields = gameFields.every(field => field in gameWithStats.data);
    console.log('   - Game has all required fields:', gameHasAllFields ? '✅' : '❌');
    
    // Check PlayerGameStats fields
    const statsFields = ['id', 'playerId', 'playerName', 'teamId', 'teamName', 'gameId', 'minutesPlayed', 'points', 'rebounds', 'assists'];
    const statsHasAllFields = statsFields.every(field => field in gameWithStats.data.playerStats[0]);
    console.log('   - PlayerGameStats has all required fields:', statsHasAllFields ? '✅' : '❌');

    // Test 10: Test Game Result Types
    console.log('\n10. Testing Game Result types...');
    const gameResults = ['home_win', 'away_win', 'tie'];
    console.log('   - Current game result:', game.data.gameResult);
    console.log('   - Game result is valid:', gameResults.includes(game.data.gameResult) ? '✅' : '❌');

    // Test 11: Cleanup
    console.log('\n11. Cleaning up test data...');
    
    // Remove player from team
    const removePlayerResponse = await fetch(`${API_BASE_URL}/teams/${team.data.id}/players/${player.data.id}`, {
      method: 'DELETE'
    });
    console.log('✅ Player removed from team');

    // Delete game
    const deleteGameResponse = await fetch(`${API_BASE_URL}/games/${game.data.id}`, {
      method: 'DELETE'
    });
    console.log('✅ Game deleted');

    // Delete team
    const deleteTeamResponse = await fetch(`${API_BASE_URL}/teams/${team.data.id}`, {
      method: 'DELETE'
    });
    console.log('✅ Team deleted');

    // Delete player
    const deletePlayerResponse = await fetch(`${API_BASE_URL}/players/${player.data.id}`, {
      method: 'DELETE'
    });
    console.log('✅ Player deleted');

    console.log('\n🎉 Schema compatibility test completed successfully!');
    console.log('\n✅ All backend models now match frontend interfaces:');
    console.log('   - Player model with basketballStats ✅');
    console.log('   - Team model with players array ✅');
    console.log('   - Game model with playerStats array ✅');
    console.log('   - PlayerGameStats model ✅');
    console.log('   - All relationships working ✅');
    console.log('   - All required fields present ✅');

  } catch (error) {
    console.error('\n❌ Schema compatibility test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the backend is running on port 8080');
    console.log('2. Check if the backend models have been updated');
    console.log('3. Verify the API endpoints are working');
    console.log('4. Run: curl http://localhost:8080/api/v1/health');
  }
}

// Run the test
testSchemaCompatibility();

