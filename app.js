class TodoApp {
  constructor() {
    this.todos = JSON.parse(localStorage.getItem('thingy-todos')) || [];
    this.currentFilter = 'all';
    
    this.todoInput = document.getElementById('todoInput');
    this.addBtn = document.getElementById('addBtn');
    this.todoList = document.getElementById('todoList');
    this.itemsLeft = document.getElementById('itemsLeft');
    this.clearCompleted = document.getElementById('clearCompleted');
    this.filterBtns = document.querySelectorAll('.filter-btn');
    
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
    
    this.render();
    this.registerServiceWorker();
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
}

const app = new TodoApp();
