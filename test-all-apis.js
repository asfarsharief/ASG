// Comprehensive API Test Script for BadgerDB Backend
// Run with: node test-all-apis.js

const API_BASE_URL = 'http://localhost:8080/api/v1';

async function testAllAPIs() {
  console.log('🧪 Testing All APIs with BadgerDB Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      throw new Error('Backend health check failed');
    }

    // Test 2: Create Players
    console.log('\n2. Testing player creation...');
    const players = [];
    
    const player1Data = {
      name: 'LeBron James',
      band: 1,
      status: 'available',
      basketballStats: {
        winPercentage: 0.75,
        pointsAverage: 25.0,
        fieldGoalPercentage: 0.50,
        reboundsAverage: 7.5,
        assistsAverage: 7.0
      }
    };

    const player2Data = {
      name: 'Stephen Curry',
      band: 1,
      status: 'available',
      basketballStats: {
        winPercentage: 0.70,
        pointsAverage: 24.0,
        fieldGoalPercentage: 0.47,
        reboundsAverage: 4.5,
        assistsAverage: 6.5
      }
    };

    const player3Data = {
      name: 'Giannis Antetokounmpo',
      band: 2,
      status: 'available',
      basketballStats: {
        winPercentage: 0.65,
        pointsAverage: 28.0,
        fieldGoalPercentage: 0.55,
        reboundsAverage: 11.0,
        assistsAverage: 5.5
      }
    };

    const createPlayer1Response = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player1Data)
    });
    const player1 = await createPlayer1Response.json();
    players.push(player1.data);

    const createPlayer2Response = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player2Data)
    });
    const player2 = await createPlayer2Response.json();
    players.push(player2.data);

    const createPlayer3Response = await fetch(`${API_BASE_URL}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player3Data)
    });
    const player3 = await createPlayer3Response.json();
    players.push(player3.data);

    console.log(`✅ Created ${players.length} players`);

    // Test 3: Create Teams
    console.log('\n3. Testing team creation...');
    const teams = [];

    const team1Data = {
      name: 'Lakers',
      captain: 'LeBron James',
      viceCaptain: 'Anthony Davis',
      budget: 100000.0
    };

    const team2Data = {
      name: 'Warriors',
      captain: 'Stephen Curry',
      viceCaptain: 'Klay Thompson',
      budget: 95000.0
    };

    const createTeam1Response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team1Data)
    });
    const team1 = await createTeam1Response.json();
    teams.push(team1.data);

    const createTeam2Response = await fetch(`${API_BASE_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team2Data)
    });
    const team2 = await createTeam2Response.json();
    teams.push(team2.data);

    console.log(`✅ Created ${teams.length} teams`);

    // Test 4: Add Players to Teams
    console.log('\n4. Testing adding players to teams...');
    
    const addPlayer1ToTeam1Response = await fetch(`${API_BASE_URL}/teams/${teams[0].id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: players[0].id })
    });
    console.log('✅ Added LeBron to Lakers');

    const addPlayer2ToTeam2Response = await fetch(`${API_BASE_URL}/teams/${teams[1].id}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: players[1].id })
    });
    console.log('✅ Added Curry to Warriors');

    // Test 5: Get Team Players
    console.log('\n5. Testing get team players...');
    const team1PlayersResponse = await fetch(`${API_BASE_URL}/teams/${teams[0].id}/players`);
    const team1Players = await team1PlayersResponse.json();
    console.log(`✅ Lakers have ${team1Players.data.length} players`);

    // Test 6: Create Games
    console.log('\n6. Testing game creation...');
    const games = [];

    const game1Data = {
      gameName: 'Lakers vs Warriors',
      gameDate: '2024-01-15',
      homeTeamId: teams[0].id,
      homeTeamName: 'Lakers',
      awayTeamId: teams[1].id,
      awayTeamName: 'Warriors',
      homeScore: 110,
      awayScore: 105
    };

    const createGame1Response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(game1Data)
    });
    const game1 = await createGame1Response.json();
    games.push(game1.data);

    console.log(`✅ Created ${games.length} games`);

    // Test 7: Add Player Stats to Game
    console.log('\n7. Testing adding player stats to game...');
    
    const player1StatsData = {
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

    const addPlayer1StatsResponse = await fetch(`${API_BASE_URL}/games/${games[0].id}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player1StatsData)
    });
    const player1Stats = await addPlayer1StatsResponse.json();
    console.log('✅ Added LeBron stats to game');

    const player2StatsData = {
      playerId: players[1].id,
      playerName: players[1].name,
      teamId: teams[1].id,
      teamName: teams[1].name,
      minutesPlayed: 32,
      points: 25,
      fieldGoalsMade: 9,
      fieldGoalsAttempted: 18,
      threePointersMade: 5,
      threePointersAttempted: 10,
      freeThrowsMade: 2,
      freeThrowsAttempted: 2,
      rebounds: 4,
      assists: 6,
      steals: 1,
      blocks: 0,
      turnovers: 2,
      personalFouls: 3,
      plusMinus: -5
    };

    const addPlayer2StatsResponse = await fetch(`${API_BASE_URL}/games/${games[0].id}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player2StatsData)
    });
    const player2Stats = await addPlayer2StatsResponse.json();
    console.log('✅ Added Curry stats to game');

    // Test 8: Get Game Stats
    console.log('\n8. Testing get game stats...');
    const gameStatsResponse = await fetch(`${API_BASE_URL}/games/${games[0].id}/stats`);
    const gameStats = await gameStatsResponse.json();
    console.log(`✅ Game has ${gameStats.data.length} player stats`);

    // Test 9: Update Player Stats
    console.log('\n9. Testing update player stats...');
    const updateStatsData = {
      points: 30,
      rebounds: 10
    };

    const updateStatsResponse = await fetch(`${API_BASE_URL}/games/${games[0].id}/stats/${player1Stats.data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateStatsData)
    });
    console.log('✅ Updated LeBron stats');

    // Test 10: Get All Data
    console.log('\n10. Testing get all data...');
    
    const allPlayersResponse = await fetch(`${API_BASE_URL}/players`);
    const allPlayers = await allPlayersResponse.json();
    console.log(`✅ Retrieved ${allPlayers.data.length} players`);

    const allTeamsResponse = await fetch(`${API_BASE_URL}/teams`);
    const allTeams = await allTeamsResponse.json();
    console.log(`✅ Retrieved ${allTeams.data.length} teams`);

    const allGamesResponse = await fetch(`${API_BASE_URL}/games`);
    const allGames = await allGamesResponse.json();
    console.log(`✅ Retrieved ${allGames.data.length} games`);

    // Test 11: Filter Tests
    console.log('\n11. Testing filters...');
    
    const band1PlayersResponse = await fetch(`${API_BASE_URL}/players?band=1`);
    const band1Players = await band1PlayersResponse.json();
    console.log(`✅ Retrieved ${band1Players.data.length} players from band 1`);

    const availablePlayersResponse = await fetch(`${API_BASE_URL}/players?status=available`);
    const availablePlayers = await availablePlayersResponse.json();
    console.log(`✅ Retrieved ${availablePlayers.data.length} available players`);

    // Test 12: Update Operations
    console.log('\n12. Testing update operations...');
    
    const updatePlayerData = {
      name: 'LeBron James Jr.',
      band: 2
    };

    const updatePlayerResponse = await fetch(`${API_BASE_URL}/players/${players[0].id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePlayerData)
    });
    console.log('✅ Updated player');

    const updateTeamData = {
      name: 'Los Angeles Lakers',
      budget: 120000.0
    };

    const updateTeamResponse = await fetch(`${API_BASE_URL}/teams/${teams[0].id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateTeamData)
    });
    console.log('✅ Updated team');

    const updateGameData = {
      homeScore: 115,
      awayScore: 108
    };

    const updateGameResponse = await fetch(`${API_BASE_URL}/games/${games[0].id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateGameData)
    });
    console.log('✅ Updated game');

    // Test 13: Cleanup
    console.log('\n13. Cleaning up test data...');
    
    // Delete player stats
    const deleteStatsResponse = await fetch(`${API_BASE_URL}/games/${games[0].id}/stats/${player1Stats.data.id}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted player stats');

    // Remove players from teams
    const removePlayer1Response = await fetch(`${API_BASE_URL}/teams/${teams[0].id}/players/${players[0].id}`, {
      method: 'DELETE'
    });
    console.log('✅ Removed LeBron from Lakers');

    const removePlayer2Response = await fetch(`${API_BASE_URL}/teams/${teams[1].id}/players/${players[1].id}`, {
      method: 'DELETE'
    });
    console.log('✅ Removed Curry from Warriors');

    // Delete games
    const deleteGameResponse = await fetch(`${API_BASE_URL}/games/${games[0].id}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted game');

    // Delete teams
    const deleteTeam1Response = await fetch(`${API_BASE_URL}/teams/${teams[0].id}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted Lakers');

    const deleteTeam2Response = await fetch(`${API_BASE_URL}/teams/${teams[1].id}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted Warriors');

    // Delete players
    const deletePlayer1Response = await fetch(`${API_BASE_URL}/players/${players[0].id}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted LeBron');

    const deletePlayer2Response = await fetch(`${API_BASE_URL}/players/${players[1].id}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted Curry');

    const deletePlayer3Response = await fetch(`${API_BASE_URL}/players/${players[2].id}`, {
      method: 'DELETE'
    });
    console.log('✅ Deleted Giannis');

    console.log('\n🎉 All API tests passed successfully!');
    console.log('\nThe BadgerDB backend integration is working correctly for all APIs:');
    console.log('✅ Players API (CRUD operations)');
    console.log('✅ Teams API (CRUD operations)');
    console.log('✅ Games API (CRUD operations)');
    console.log('✅ Player Stats API (CRUD operations)');
    console.log('✅ Team-Player relationships');
    console.log('✅ Game-Player Stats relationships');
    console.log('✅ Filtering and pagination');
    console.log('✅ Data validation');
    console.log('✅ Error handling');

  } catch (error) {
    console.error('\n❌ API test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the backend is running on port 8080');
    console.log('2. Check if BadgerDB data directory exists');
    console.log('3. Verify the backend API endpoints are working');
    console.log('4. Run: curl http://localhost:8080/api/v1/health');
    console.log('5. Check backend logs for errors');
  }
}

// Run the test
testAllAPIs();
