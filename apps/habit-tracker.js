class HabitTrackerApp extends BaseApp {
  constructor(appManager, name) {
    super(appManager, name)
  }

  async loadData() {
    await super.loadData()
    this.habits = this.data.habits || []
    this.completions = this.data.completions || {}
    this.settings = this.data.settings || {
      showStats: false
    }
  }

  async saveData() {
    this.data.habits = this.habits
    this.data.completions = this.completions
    this.data.settings = this.settings
    await super.saveData()
  }

  initElements() {
    this.habitsList = document.getElementById('habitsList')
    this.addHabitBtn = document.getElementById('addHabitBtn')
    this.todayProgress = document.getElementById('todayProgress')
    this.currentStreak = document.getElementById('currentStreak')
    this.bestStreak = document.getElementById('bestStreak')
    this.habitStats = document.getElementById('habitStats')
    this.completionRate = document.getElementById('completionRate')
    this.totalCompleted = document.getElementById('totalCompleted')
    this.daysTracked = document.getElementById('daysTracked')
  }

  initEventListeners() {
    this.addHabitBtn.addEventListener('click', () => this.showAddHabitDialog())
  }

  render() {
    this.renderHabits()
    this.updateOverview()
    if (this.settings.showStats) {
      this.updateStats()
    }
  }

  renderHabits() {
    if (this.habits.length === 0) {
      this.habitsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No habits yet</h3>
          <p>Click "Add Habit" to get started!</p>
        </div>
      `
      return
    }

    const today = this.getTodayString()
    
    this.habitsList.innerHTML = this.habits.map((habit, index) => {
      const isCompleted = this.completions[today]?.includes(habit.id)
      const streak = this.calculateHabitStreak(habit.id)
      
      return `
        <div class="habit-item ${isCompleted ? 'completed' : ''}">
          <div class="habit-info">
            <div class="habit-name">${habit.name}</div>
            <div class="habit-streak">🔥 ${streak} day${streak !== 1 ? 's' : ''}</div>
          </div>
          <div class="habit-actions">
            <button class="habit-check-btn ${isCompleted ? 'checked' : ''}" 
                    onclick="window.habitTrackerApp.toggleHabit('${habit.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
            </button>
            <button class="habit-menu-btn" onclick="window.habitTrackerApp.showHabitMenu('${habit.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>
      `
    }).join('')
  }

  updateOverview() {
    const today = this.getTodayString()
    const todayCompleted = this.completions[today] || []
    const totalHabits = this.habits.length
    const completedToday = todayCompleted.length
    
    this.todayProgress.textContent = `${completedToday}/${totalHabits}`
    
    const overallStreak = this.calculateOverallStreak()
    this.currentStreak.textContent = `${overallStreak} day${overallStreak !== 1 ? 's' : ''}`
    
    const bestStreak = this.calculateBestStreak()
    this.bestStreak.textContent = `${bestStreak} day${bestStreak !== 1 ? 's' : ''}`
  }

  updateStats() {
    const stats = this.calculateStatistics()
    
    this.completionRate.textContent = `${stats.completionRate}%`
    this.totalCompleted.textContent = stats.totalCompleted
    this.daysTracked.textContent = stats.daysTracked
  }

  showAddHabitDialog() {
    const name = prompt('Enter habit name:')
    if (!name || !name.trim()) return
    
    const habit = {
      id: this.generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      color: this.getRandomColor()
    }
    
    this.habits.push(habit)
    this.saveData()
    this.render()
  }

  showHabitMenu(habitId) {
    const habit = this.habits.find(h => h.id === habitId)
    if (!habit) return
    
    const action = confirm(`"${habit.name}"\n\nClick OK to edit, Cancel to delete`)
    
    if (action) {
      this.editHabit(habitId)
    } else {
      this.deleteHabit(habitId)
    }
  }

  editHabit(habitId) {
    const habit = this.habits.find(h => h.id === habitId)
    if (!habit) return
    
    const newName = prompt('Edit habit name:', habit.name)
    if (newName && newName.trim()) {
      habit.name = newName.trim()
      this.saveData()
      this.render()
    }
  }

  deleteHabit(habitId) {
    if (!confirm('Are you sure you want to delete this habit?')) return
    
    this.habits = this.habits.filter(h => h.id !== habitId)
    
    Object.keys(this.completions).forEach(date => {
      this.completions[date] = this.completions[date].filter(id => id !== habitId)
    })
    
    this.saveData()
    this.render()
  }

  toggleHabit(habitId) {
    const today = this.getTodayString()
    
    if (!this.completions[today]) {
      this.completions[today] = []
    }
    
    const index = this.completions[today].indexOf(habitId)
    
    if (index > -1) {
      this.completions[today].splice(index, 1)
    } else {
      this.completions[today].push(habitId)
    }
    
    this.saveData()
    this.render()
  }

  calculateHabitStreak(habitId) {
    let streak = 0
    let currentDate = new Date()
    
    while (true) {
      const dateString = this.formatDate(currentDate)
      if (this.completions[dateString]?.includes(habitId)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  calculateOverallStreak() {
    if (this.habits.length === 0) return 0
    
    let streak = 0
    let currentDate = new Date()
    
    while (true) {
      const dateString = this.formatDate(currentDate)
      const todayCompleted = this.completions[dateString] || []
      const allHabitsCompleted = this.habits.every(habit => todayCompleted.includes(habit.id))
      
      if (allHabitsCompleted) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    
    return streak
  }

  calculateBestStreak() {
    if (this.habits.length === 0) return 0
    
    let bestStreak = 0
    let currentStreak = 0
    
    const sortedDates = Object.keys(this.completions).sort().reverse()
    
    sortedDates.forEach(dateString => {
      const todayCompleted = this.completions[dateString] || []
      const allHabitsCompleted = this.habits.every(habit => todayCompleted.includes(habit.id))
      
      if (allHabitsCompleted) {
        currentStreak++
        bestStreak = Math.max(bestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })
    
    return bestStreak
  }

  calculateStatistics() {
    const totalDays = Object.keys(this.completions).length
    let totalCompleted = 0
    
    Object.values(this.completions).forEach(dayCompletions => {
      totalCompleted += dayCompletions.length
    })
    
    const totalPossible = this.habits.length * totalDays
    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
    
    return {
      completionRate,
      totalCompleted,
      daysTracked: totalDays
    }
  }

  getTodayString() {
    return this.formatDate(new Date())
  }

  formatDate(date) {
    return date.toISOString().split('T')[0]
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  getRandomColor() {
    const colors = ['#e94560', '#4ade80', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4']
    return colors[Math.floor(Math.random() * colors.length)]
  }
}

window.habitTrackerApp = null