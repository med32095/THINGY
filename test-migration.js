// Test script to verify data migration
// Run this in browser console to test

function testMigration() {
  // Simulate old data
  localStorage.setItem('cube-timer-solves', JSON.stringify([
    {time: 12.34, scramble: 'R U R\'', timestamp: new Date().toISOString(), penalty: 0, rawTime: 12.34}
  ]))
  localStorage.setItem('cube-timer-settings', JSON.stringify({
    inspectionTime: 10,
    timerType: 'keys',
    theme: 'dark'
  }))
  localStorage.setItem('cube-timer-single-record', '10.5')
  
  console.log('Test data set. Refresh page to test migration.')
}

function checkMigration() {
  const data = JSON.parse(localStorage.getItem('thingyData') || '{}')
  console.log('THINGY data:', data)
  
  if (data.cubeTimer) {
    console.log('✅ Migration successful!')
    console.log('Solves:', data.cubeTimer.solves?.length || 0)
    console.log('Settings:', data.cubeTimer.settings)
    console.log('Records:', data.cubeTimer.records)
  } else {
    console.log('❌ No migrated data found')
  }
}

console.log('Migration test functions loaded. Use testMigration() and checkMigration()')