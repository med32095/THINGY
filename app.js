class TodoApp {
  constructor() {
    this.todos = JSON.parse(localStorage.getItem('thingy-todos')) || [];
    this.currentFilter = 'all';
    this.githubToken = localStorage.getItem('thingy-github-token');
    this.gistId = localStorage.getItem('thingy-gist-id');
    this.syncInterval = null;
    this.isSyncing = false;
    this.pendingChanges = false;
    
    this.todoInput = document.getElementById('todoInput');
    this.addBtn = document.getElementById('addBtn');
    this.todoList = document.getElementById('todoList');
    this.itemsLeft = document.getElementById('itemsLeft');
    this.clearCompleted = document.getElementById('clearCompleted');
    this.filterBtns = document.querySelectorAll('.filter-btn');
    
    // Sync UI elements
    this.connectPrompt = document.getElementById('connectPrompt');
    this.showTokenBtn = document.getElementById('showTokenBtn');
    this.tokenInputSection = document.getElementById('tokenInputSection');
    this.tokenInput = document.getElementById('tokenInput');
    this.saveTokenBtn = document.getElementById('saveTokenBtn');
    this.cancelTokenBtn = document.getElementById('cancelTokenBtn');
    this.syncInfo = document.getElementById('syncInfo');
    this.lastSync = document.getElementById('lastSync');
    this.syncIndicator = document.getElementById('syncIndicator');
    this.syncNowBtn = document.getElementById('syncNow');
    
    // Settings menu
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsMenu = document.getElementById('settingsMenu');
    
    // Logout dialog
    this.logoutDialog = document.getElementById('logoutDialog');
    this.cancelLogoutBtn = document.getElementById('cancelLogout');
    this.confirmLogoutBtn = document.getElementById('confirmLogout');
    
    this.init();
  }
  
  init() {
    this.addBtn.addEventListener('click', () => this.addTodo());
    this.todoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTodo();
    });
    
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.render();
      });
    });
    
    this.clearCompleted.addEventListener('click', () => this.clearCompletedTodos());
    
    // Token input events
    this.showTokenBtn.addEventListener('click', () => this.showTokenInput());
    this.saveTokenBtn.addEventListener('click', () => this.saveToken());
    this.cancelTokenBtn.addEventListener('click', () => this.hideTokenInput());
    this.tokenInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.saveToken();
    });
    
    // Settings menu events
    this.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSettingsMenu();
    });
    this.syncNowBtn.addEventListener('click', () => {
      this.syncNow();
      this.hideSettingsMenu();
    });
    
    // Logout dialog events
    this.settingsMenu.querySelector('#logoutBtn').addEventListener('click', () => {
      this.showLogoutDialog();
      this.hideSettingsMenu();
    });
    this.cancelLogoutBtn.addEventListener('click', () => this.hideLogoutDialog());
    this.confirmLogoutBtn.addEventListener('click', () => this.confirmLogout());
    
    // Close settings menu when clicking outside
    document.addEventListener('click', () => this.hideSettingsMenu());
    this.settingsMenu.addEventListener('click', (e) => e.stopPropagation());
    
    // Initialize sync if already logged in
    if (this.githubToken) {
      this.showSyncUI();
      this.startAutoSync();
      this.syncNow();
    }
    
    this.render();
    this.registerServiceWorker();
  }

  saveToken() {
    const token = this.tokenInput.value.trim();
    if (token) {
      this.setGitHubToken(token);
      this.tokenInput.value = '';
    }
  }
  
  addTodo() {
    const text = this.todoInput.value.trim();
    if (!text) return;
    
    const todo = {
      id: Date.now(),
      text: text,
      completed: false
    };
    
    this.todos.unshift(todo);
    this.saveTodos();
    this.todoInput.value = '';
    this.render();
  }
  
  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos();
      this.render();
    }
  }
  
  deleteTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.saveTodos();
    this.render();
  }
  
  clearCompletedTodos() {
    this.todos = this.todos.filter(t => !t.completed);
    this.saveTodos();
    this.render();
  }
  
  getFilteredTodos() {
    switch (this.currentFilter) {
      case 'active':
        return this.todos.filter(t => !t.completed);
      case 'completed':
        return this.todos.filter(t => t.completed);
      default:
        return this.todos;
    }
  }
  
  saveTodos() {
    localStorage.setItem('thingy-todos', JSON.stringify(this.todos));
  }
  
  updateStats() {
    const activeCount = this.todos.filter(t => !t.completed).length;
    this.itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    this.clearCompleted.style.display = this.todos.some(t => t.completed) ? 'block' : 'none';
  }
  
  render() {
    const filteredTodos = this.getFilteredTodos();
    
    if (filteredTodos.length === 0) {
      this.todoList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <p>${this.currentFilter === 'all' ? 'No todos yet. Add one above!' : 'No ' + this.currentFilter + ' todos.'}</p>
        </div>
      `;
    } else {
      this.todoList.innerHTML = filteredTodos.map(todo => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
          <div class="todo-checkbox" onclick="app.toggleTodo(${todo.id})"></div>
          <span class="todo-text">${this.escapeHtml(todo.text)}</span>
          <button class="delete-btn" onclick="app.deleteTodo(${todo.id})" aria-label="Delete">🗑️</button>
        </li>
      `).join('');
    }
    
    this.updateStats();
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  // GitHub Token Methods
  setGitHubToken(token) {
    this.githubToken = token;
    localStorage.setItem('thingy-github-token', token);
    this.showSyncUI();
    this.startAutoSync();
    this.syncNow();
  }

  logout() {
    this.githubToken = null;
    this.gistId = null;
    localStorage.removeItem('thingy-github-token');
    localStorage.removeItem('thingy-gist-id');
    localStorage.removeItem('thingy-last-sync');
    this.stopAutoSync();
    this.hideSyncUI();
    this.lastSync.textContent = 'Never synced';
  }

  showSyncUI() {
    this.connectPrompt.classList.add('hidden');
    this.tokenInputSection.classList.add('hidden');
    this.syncInfo.classList.remove('hidden');
  }

  hideSyncUI() {
    this.connectPrompt.classList.remove('hidden');
    this.tokenInputSection.classList.add('hidden');
    this.syncInfo.classList.add('hidden');
  }

  showTokenInput() {
    this.connectPrompt.classList.add('hidden');
    this.tokenInputSection.classList.remove('hidden');
    this.tokenInput.focus();
  }

  hideTokenInput() {
    this.tokenInputSection.classList.add('hidden');
    this.connectPrompt.classList.remove('hidden');
    this.tokenInput.value = '';
  }

  toggleSettingsMenu() {
    this.settingsMenu.classList.toggle('hidden');
  }

  hideSettingsMenu() {
    this.settingsMenu.classList.add('hidden');
  }

  showLogoutDialog() {
    this.logoutDialog.classList.remove('hidden');
  }

  hideLogoutDialog() {
    this.logoutDialog.classList.add('hidden');
  }

  confirmLogout() {
    this.logout();
    this.hideLogoutDialog();
  }

  // Gist Sync Methods
  async syncNow() {
    if (!this.githubToken || this.isSyncing) return;
    
    this.isSyncing = true;
    this.syncIndicator.classList.add('syncing');
    
    try {
      // First, pull from Gist
      await this.pullFromGist();
      
      // Then push if we have pending changes
      if (this.pendingChanges) {
        await this.pushToGist();
      }
      
      this.lastSync.textContent = 'Synced ' + new Date().toLocaleTimeString();
      this.pendingChanges = false;
    } catch (error) {
      console.error('Sync failed:', error);
      this.lastSync.textContent = 'Sync failed - offline?';
    } finally {
      this.isSyncing = false;
      this.syncIndicator.classList.remove('syncing');
    }
  }

  async pullFromGist() {
    if (!this.gistId) {
      // Try to find existing gist
      const gists = await this.getGists();
      const thingyGist = gists.find(g => g.description === 'THINGY Todo App Data');
      
      if (thingyGist) {
        this.gistId = thingyGist.id;
        localStorage.setItem('thingy-gist-id', this.gistId);
      } else {
        return; // No gist yet, will create on push
      }
    }

    const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
      headers: {
        'Authorization': `token ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch gist');

    const gist = await response.json();
    const content = gist.files['todos.json']?.content;
    
    if (content) {
      const remoteTodos = JSON.parse(content);
      const remoteTimestamp = gist.updated_at;
      const localTimestamp = localStorage.getItem('thingy-last-sync');
      
      // Merge strategy: keep newer data
      if (!localTimestamp || new Date(remoteTimestamp) > new Date(localTimestamp)) {
        this.todos = remoteTodos;
        this.saveTodos();
        this.render();
        localStorage.setItem('thingy-last-sync', remoteTimestamp);
      }
    }
  }

  async pushToGist() {
    const content = JSON.stringify(this.todos, null, 2);
    
    if (!this.gistId) {
      // Create new gist
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'THINGY Todo App Data',
          public: false,
          files: {
            'todos.json': {
              content: content
            }
          }
        })
      });

      if (!response.ok) throw new Error('Failed to create gist');

      const gist = await response.json();
      this.gistId = gist.id;
      localStorage.setItem('thingy-gist-id', this.gistId);
      localStorage.setItem('thingy-last-sync', gist.updated_at);
    } else {
      // Update existing gist
      const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'todos.json': {
              content: content
            }
          }
        })
      });

      if (!response.ok) throw new Error('Failed to update gist');

      const gist = await response.json();
      localStorage.setItem('thingy-last-sync', gist.updated_at);
    }
  }

  async getGists() {
    const response = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `token ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch gists');
    return await response.json();
  }

  startAutoSync() {
    // Sync every 10 seconds (GitHub API rate limit is 5000/hour)
    this.syncInterval = setInterval(() => this.syncNow(), 10000);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Override saveTodos to trigger sync
  saveTodos() {
    localStorage.setItem('thingy-todos', JSON.stringify(this.todos));
    this.pendingChanges = true;
    
    // If online, sync immediately
    if (this.githubToken && navigator.onLine) {
      this.syncNow();
    }
  }
}

const app = new TodoApp();
