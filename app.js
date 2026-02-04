class CubeTimer {
  constructor() {
    this.solves = this.loadSolves()
    this.settings = this.loadSettings()

    this.timerState = 'idle'
    this.startTime = 0
    this.elapsedTime = 0
    this.inspectionTime = 0
    this.inspectionInterval = null
    this.timerInterval = null
    this.currentScramble = ''

    this.lastSolve = null

    this.initElements()
    this.initEventListeners()
    this.generateScramble()
    this.renderHistory()
    this.renderRecords()
    this.updateStats()
  }

  loadSolves() {
    const saved = localStorage.getItem('cube-timer-solves')
    return saved ? JSON.parse(saved) : []
  }

  saveSolves() {
    localStorage.setItem('cube-timer-solves', JSON.stringify(this.solves))
  }

  loadSettings() {
    const saved = localStorage.getItem('cube-timer-settings')
    return saved ? JSON.parse(saved) : {
      inspectionTime: 15,
      timerType: 'touch',
      theme: 'dark'
    }
  }

  saveSettings() {
    localStorage.setItem('cube-timer-settings', JSON.stringify(this.settings))
  }

  initElements() {
    this.timerDisplay = document.getElementById('timerDisplay')
    this.startStopBtn = document.getElementById('startStopBtn')
    this.scrambleBtn = document.getElementById('scrambleBtn')
    this.scrambleDisplay = document.getElementById('scrambleDisplay')
    this.inspectionWarning = document.getElementById('inspectionWarning')
    this.inspectionCount = document.getElementById('inspectionCount')
    this.historyList = document.getElementById('historyList')
    this.chartsSection = document.getElementById('chartsSection')
    this.settingsSection = document.getElementById('settingsSection')
    this.recordsSection = document.getElementById('recordsSection')
    this.historySection = document.getElementById('historySection')

    this.inspectionTimeSelect = document.getElementById('inspectionTime')
    this.timerTypeSelect = document.getElementById('timerType')
    this.themeSelect = document.getElementById('theme')
    this.clearDataBtn = document.getElementById('clearDataBtn')

    this.timeChart = document.getElementById('timeChart')
    this.distributionChart = document.getElementById('distributionChart')

    this.currentFilter = 'all'
  }

  initEventListeners() {
    this.startStopBtn.addEventListener('click', () => this.handleTimerAction())

    this.scrambleBtn.addEventListener('click', () => {
      this.generateScramble()
    })

    this.inspectionTimeSelect.value = this.settings.inspectionTime
    this.inspectionTimeSelect.addEventListener('change', (e) => {
      this.settings.inspectionTime = parseInt(e.target.value)
      this.saveSettings()
    })

    this.timerTypeSelect.value = this.settings.timerType
    this.timerTypeSelect.addEventListener('change', (e) => {
      this.settings.timerType = e.target.value
      this.saveSettings()
    })

    this.themeSelect.value = this.settings.theme
    this.themeSelect.addEventListener('change', (e) => {
      this.settings.theme = e.target.value
      this.applyTheme()
      this.saveSettings()
    })

    this.clearDataBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all solve data? This cannot be undone.')) {
        this.solves = []
        this.saveSolves()
        this.renderHistory()
        this.renderRecords()
        this.updateStats()
      }
    })

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
        e.target.classList.add('active')
        this.currentFilter = e.target.dataset.filter
        this.renderHistory()
      })
    })

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
        e.currentTarget.classList.add('active')

        const tab = e.currentTarget.dataset.tab
        this.showTab(tab)
      })
    })

    document.getElementById('statsToggle').addEventListener('click', () => {
      this.chartsSection.style.display = this.chartsSection.style.display === 'none' ? 'block' : 'none'
    })

    if (this.settings.timerType === 'keys') {
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
          e.preventDefault()
          this.handleTimerAction()
        }
      })
    }

    this.applyTheme()
  }

  showTab(tab) {
    this.recordsSection.style.display = 'none'
    this.historySection.style.display = 'none'
    this.chartsSection.style.display = 'none'
    this.settingsSection.style.display = 'none'

    switch (tab) {
      case 'timer':
        this.recordsSection.style.display = 'block'
        this.historySection.style.display = 'block'
        break
      case 'history':
        this.historySection.style.display = 'block'
        break
      case 'charts':
        this.chartsSection.style.display = 'block'
        this.updateStats()
        break
      case 'settings':
        this.settingsSection.style.display = 'block'
        break
    }
  }

  applyTheme() {
    document.body.className = this.settings.theme
  }

  generateScramble() {
    const moves = ['R', 'L', 'U', 'D', 'F', 'B']
    const suffixes = ['', "'", '2']
    let scramble = []

    let lastMove = ''
    let lastAxis = ''

    for (let i = 0; i < 20; i++) {
      let axis
      do {
        axis = Math.floor(Math.random() * 6)
      } while (Math.floor(axis / 2) === Math.floor(lastAxis / 2))

      const move = moves[axis]
      const suffix = suffixes[Math.floor(Math.random() * 3)]

      if (move !== lastMove) {
        scramble.push(move + suffix)
        lastMove = move
        lastAxis = axis
      } else {
        i--
      }
    }

    this.currentScramble = scramble.join(' ')
    this.scrambleDisplay.textContent = this.currentScramble
  }

  handleTimerAction() {
    if (this.timerState === 'idle') {
      this.startInspection()
    } else if (this.timerState === 'inspection') {
      this.cancelInspection()
    } else if (this.timerState === 'running') {
      this.stopTimer()
    }
  }

  startInspection() {
    if (this.settings.inspectionTime > 0) {
      this.timerState = 'inspection'
      this.inspectionTime = this.settings.inspectionTime
      this.inspectionCount.textContent = this.inspectionTime
      this.inspectionWarning.classList.add('active')
      this.timerDisplay.classList.add('inspection')

      this.inspectionInterval = setInterval(() => {
        this.inspectionTime--
        this.inspectionCount.textContent = this.inspectionTime

        if (this.inspectionTime < 0) {
          this.inspectionCount.textContent = '+2'
        }

        if (this.inspectionTime < -2) {
          this.cancelInspection()
        }
      }, 1000)
    } else {
      this.startTimer()
    }
  }

  cancelInspection() {
    clearInterval(this.inspectionInterval)
    this.inspectionWarning.classList.remove('active')
    this.timerDisplay.classList.remove('inspection')
    this.startTimer()
  }

  startTimer() {
    this.timerState = 'running'
    this.startTime = performance.now()
    this.timerDisplay.classList.add('running')
    this.startStopBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16"/>
        <rect x="14" y="4" width="4" height="16"/>
      </svg>
    `
    this.startStopBtn.classList.add('stop')

    this.timerInterval = setInterval(() => {
      this.elapsedTime = (performance.now() - this.startTime) / 1000
      this.timerDisplay.textContent = this.elapsedTime.toFixed(2)
    }, 10)
  }

  stopTimer() {
    clearInterval(this.timerInterval)

    const solveTime = this.elapsedTime
    const penalty = this.inspectionTime < 0 ? 2 : 0
    const finalTime = solveTime + penalty

    this.saveSolve({
      time: finalTime,
      scramble: this.currentScramble,
      timestamp: new Date().toISOString(),
      penalty: penalty,
      rawTime: solveTime
    })

    this.timerState = 'idle'
    this.elapsedTime = 0
    this.inspectionTime = 0
    this.timerDisplay.classList.remove('running', 'inspection')
    this.timerDisplay.textContent = '0.00'
    this.inspectionWarning.classList.remove('active')
    this.startStopBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5,3 19,12 5,21"/>
      </svg>
    `
    this.startStopBtn.classList.remove('stop')

    this.generateScramble()
    this.renderHistory()
    this.renderRecords()
    this.updateStats()
  }

  saveSolve(solve) {
    this.solves.push(solve)
    this.saveSolves()
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(2)
    if (mins > 0) {
      return `${mins}:${secs.padStart(5, '0')}`
    }
    return secs
  }

  formatDate(isoString) {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  calculateAverage(count) {
    if (this.solves.length < count) return null

    const recent = this.solves.slice(-count)
    const times = recent.map(s => s.time)

    const max = Math.max(...times)
    const min = Math.min(...times)

    const filtered = times.filter(t => t !== max && t !== min)
    const sum = filtered.reduce((a, b) => a + b, 0)

    return sum / filtered.length
  }

  calculateSessionAverage() {
    if (this.solves.length === 0) return null

    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const recentSolves = this.solves.filter(s => new Date(s.timestamp).getTime() > oneHourAgo)

    if (recentSolves.length < 5) return null

    const sum = recentSolves.reduce((a, b) => a + b.time, 0)
    return sum / recentSolves.length
  }

  renderHistory() {
    let displaySolves = [...this.solves]

    if (this.currentFilter === 'last10') {
      displaySolves = displaySolves.slice(-10)
    } else if (this.currentFilter === 'last50') {
      displaySolves = displaySolves.slice(-50)
    }

    displaySolves = displaySolves.reverse()

    if (displaySolves.length === 0) {
      this.historyList.innerHTML = `
        <div style="text-align: center; padding: 32px; color: var(--text-secondary);">
          No solves yet. Start the timer to begin!
        </div>
      `
      return
    }

    const bestTime = Math.min(...this.solves.map(s => s.time))

    this.historyList.innerHTML = displaySolves.map((solve, index) => {
      const isBest = solve.time === bestTime && this.solves.length > 10
      return `
        <div class="history-item ${isBest ? 'best' : ''}">
          <span class="history-time">${this.formatTime(solve.time)}</span>
          <span class="history-date">${this.formatDate(solve.timestamp)}</span>
          <span class="history-scramble">${solve.scramble}</span>
        </div>
      `
    }).join('')
  }

  renderRecords() {
    const single = this.solves.length > 0 ? Math.min(...this.solves.map(s => s.time)) : null
    const ao5 = this.calculateAverage(5)
    const ao12 = this.calculateAverage(12)
    const ao50 = this.calculateAverage(50)

    const singleRecord = localStorage.getItem('cube-timer-single-record')
    const ao5Record = localStorage.getItem('cube-timer-ao5-record')
    const ao12Record = localStorage.getItem('cube-timer-ao12-record')
    const ao50Record = localStorage.getItem('cube-timer-ao50-record')

    document.getElementById('singleRecord').textContent = single ? this.formatTime(single) : '--'
    document.getElementById('ao5Record').textContent = ao5 ? this.formatTime(ao5) : '--'
    document.getElementById('ao12Record').textContent = ao12 ? this.formatTime(ao12) : '--'
    document.getElementById('ao50Record').textContent = ao50 ? this.formatTime(ao50) : '--'

    if (single && (!singleRecord || single < parseFloat(singleRecord))) {
      localStorage.setItem('cube-timer-single-record', single)
      document.getElementById('singleRecord').textContent = this.formatTime(single)
      document.getElementById('singleDate').textContent = 'New Record!'
    }

    if (ao5 && (!ao5Record || ao5 < parseFloat(ao5Record))) {
      localStorage.setItem('cube-timer-ao5-record', ao5)
      document.getElementById('ao5Record').textContent = this.formatTime(ao5)
      document.getElementById('ao5Date').textContent = 'New Record!'
    }

    if (ao12 && (!ao12Record || ao12 < parseFloat(ao12Record))) {
      localStorage.setItem('cube-timer-ao12-record', ao12)
      document.getElementById('ao12Record').textContent = this.formatTime(ao12)
      document.getElementById('ao12Date').textContent = 'New Record!'
    }

    if (ao50 && (!ao50Record || ao50 < parseFloat(ao50Record))) {
      localStorage.setItem('cube-timer-ao50-record', ao50)
      document.getElementById('ao50Record').textContent = this.formatTime(ao50)
      document.getElementById('ao50Date').textContent = 'New Record!'
    }
  }

  updateStats() {
    document.getElementById('totalSolves').textContent = this.solves.length

    if (this.solves.length > 0) {
      const avg = this.solves.reduce((a, b) => a + b.time, 0) / this.solves.length
      document.getElementById('totalAverage').textContent = this.formatTime(avg)

      const sessionAvg = this.calculateSessionAverage()
      document.getElementById('bestSession').textContent = sessionAvg ? this.formatTime(sessionAvg) : '--'
    } else {
      document.getElementById('totalAverage').textContent = '--'
      document.getElementById('bestSession').textContent = '--'
    }

    this.drawTimeChart()
    this.drawDistributionChart()
  }

  drawTimeChart() {
    const canvas = this.timeChart
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

    if (this.solves.length < 2) {
      ctx.fillStyle = '#8892b0'
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Need at least 2 solves for chart', canvas.offsetWidth / 2, canvas.offsetHeight / 2)
      return
    }

    const recentSolves = this.solves.slice(-50)
    const times = recentSolves.map(s => s.time)
    const maxTime = Math.max(...times) * 1.1
    const minTime = Math.min(...times) * 0.9

    const padding = 40
    const chartWidth = canvas.offsetWidth - padding * 2
    const chartHeight = canvas.offsetHeight - padding * 2

    ctx.strokeStyle = '#2d3a5c'
    ctx.lineWidth = 2
    ctx.beginPath()

    times.forEach((time, i) => {
      const x = padding + (i / (times.length - 1)) * chartWidth
      const y = canvas.offsetHeight - padding - ((time - minTime) / (maxTime - minTime)) * chartHeight

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    ctx.fillStyle = '#e94560'
    times.forEach((time, i) => {
      const x = padding + (i / (times.length - 1)) * chartWidth
      const y = canvas.offsetHeight - padding - ((time - minTime) / (maxTime - minTime)) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = '#8892b0'
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'left'

    ctx.fillText(this.formatTime(maxTime), padding, padding)
    ctx.fillText(this.formatTime(minTime), padding, canvas.offsetHeight - padding + 15)
  }

  drawDistributionChart() {
    const canvas = this.distributionChart
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

    if (this.solves.length < 5) {
      ctx.fillStyle = '#8892b0'
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Need at least 5 solves for distribution', canvas.offsetWidth / 2, canvas.offsetHeight / 2)
      return
    }

    const times = this.solves.map(s => s.time)
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const range = maxTime - minTime

    const bucketCount = 10
    const bucketSize = range / bucketCount || 1

    const buckets = new Array(bucketCount).fill(0)
    times.forEach(time => {
      const bucketIndex = Math.min(Math.floor((time - minTime) / bucketSize), bucketCount - 1)
      buckets[bucketIndex]++
    })

    const maxBucket = Math.max(...buckets)
    const padding = 40
    const chartWidth = canvas.offsetWidth - padding * 2
    const chartHeight = canvas.offsetHeight - padding * 2
    const barWidth = chartWidth / bucketCount - 4

    buckets.forEach((count, i) => {
      const x = padding + i * (chartWidth / bucketCount) + 2
      const barHeight = (count / maxBucket) * chartHeight
      const y = canvas.offsetHeight - padding - barHeight

      const gradient = ctx.createLinearGradient(x, y, x, canvas.offsetHeight - padding)
      gradient.addColorStop(0, '#e94560')
      gradient.addColorStop(1, '#c73e54')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 4)
      ctx.fill()

      ctx.fillStyle = '#8892b0'
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      const bucketTime = minTime + (i + 0.5) * bucketSize
      ctx.fillText(this.formatTime(bucketTime), x + barWidth / 2, canvas.offsetHeight - padding + 15)

      if (count > 0) {
        ctx.fillStyle = '#eaeaea'
        ctx.fillText(count, x + barWidth / 2, y - 6)
      }
    })
  }
}

const timer = new CubeTimer()
