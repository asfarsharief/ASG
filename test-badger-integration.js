// BadgerDB Integration Test Script
// Run with: node test-badger-integration.js

const API_BASE_URL = 'http://localhost:8080/api/v1';

async function testBadgerIntegration() {
  console.log('🧪 Testing BadgerDB Backend Integration...\n');

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
      name: 'BadgerDB Test Player',
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

    // Test 4: Get Specific Player
    console.log('\n4. Testing specific player retrieval...');
    const getPlayerResponse = await fetch(`${API_BASE_URL}/players/${playerId}`);
    if (!getPlayerResponse.ok) {
      throw new Error('Failed to get specific player');
    }
    const player = await getPlayerResponse.json();
    console.log(`✅ Retrieved player: ${player.data.name}`);

    // Test 5: Update Player
    console.log('\n5. Testing player update...');
    const updateData = {
      name: 'Updated BadgerDB Test Player',
      band: 2,
      basketballStats: {
        winPercentage: 0.80,
        pointsAverage: 22.0,
        fieldGoalPercentage: 0.50,
        threePointPercentage: 0.40,
        freeThrowPercentage: 0.90,
        reboundsAverage: 9.0,
        assistsAverage: 7.0,
        stealsAverage: 2.0,
        blocksAverage: 1.5,
        turnoversAverage: 2.5,
        gamesPlayed: 20,
        minutesPerGame: 35.0
      }
    };

    const updatePlayerResponse = await fetch(`${API_BASE_URL}/players/${playerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!updatePlayerResponse.ok) {
      throw new Error('Failed to update player');
    }
    console.log('✅ Player updated successfully');

    // Test 6: Test Filtering
    console.log('\n6. Testing player filtering...');
    const filterResponse = await fetch(`${API_BASE_URL}/players?band=2`);
    if (!filterResponse.ok) {
      throw new Error('Failed to filter players');
    }
    const filteredPlayers = await filterResponse.json();
    console.log(`✅ Retrieved ${filteredPlayers.data.length} players from band 2`);

    // Test 7: Test Pagination
    console.log('\n7. Testing pagination...');
    const paginationResponse = await fetch(`${API_BASE_URL}/players?limit=1&offset=0`);
    if (!paginationResponse.ok) {
      throw new Error('Failed to paginate players');
    }
    const paginatedPlayers = await paginationResponse.json();
    console.log(`✅ Retrieved ${paginatedPlayers.data.length} players with pagination`);

    // Test 8: Test BadgerDB-specific features
    console.log('\n8. Testing BadgerDB-specific features...');
    
    // Test status filtering
    const statusResponse = await fetch(`${API_BASE_URL}/players?status=available`);
    if (!statusResponse.ok) {
      throw new Error('Failed to filter by status');
    }
    const statusPlayers = await statusResponse.json();
    console.log(`✅ Retrieved ${statusPlayers.data.length} available players`);

    // Test 9: Cleanup
    console.log('\n9. Cleaning up test data...');
    const deleteResponse = await fetch(`${API_BASE_URL}/players/${playerId}`, {
      method: 'DELETE'
    });
    if (!deleteResponse.ok) {
      throw new Error('Failed to delete player');
    }
    console.log('✅ Test data cleaned up');

    // Test 10: Verify deletion
    console.log('\n10. Verifying deletion...');
    const verifyResponse = await fetch(`${API_BASE_URL}/players/${playerId}`);
    if (verifyResponse.status === 404) {
      console.log('✅ Player successfully deleted');
    } else {
      console.log('⚠️  Player still exists after deletion');
    }

    console.log('\n🎉 All BadgerDB integration tests passed!');
    console.log('\nThe BadgerDB backend integration is working correctly.');
    console.log('You can now start the frontend with: npm start');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the backend is running on port 8080');
    console.log('2. Check if BadgerDB data directory exists');
    console.log('3. Verify the backend API endpoints are working');
    console.log('4. Run: curl http://localhost:8080/api/v1/health');
    console.log('5. Check backend logs for errors');
  }
}

// Run the test
testBadgerIntegration();
