import React, { useState } from 'react'

const initialTodos = [
  { id: 1, text: 'Test the login form', done: true },
  { id: 2, text: 'Add data-ai-* attributes', done: true },
  { id: 3, text: 'Run the snapshot viewer', done: false },
]

export default function TodoList() {
  const [todos, setTodos] = useState(initialTodos)
  const [input, setInput] = useState('')

  function addTodo() {
    if (!input.trim()) return
    setTodos([...todos, { id: Date.now(), text: input.trim(), done: false }])
    setInput('')
  }

  function toggleTodo(id) {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function deleteTodo(id) {
    setTodos(todos.filter(t => t.id !== id))
  }

  return (
    <div className="card">
      <h2 data-ai-id="todos-title" data-ai-role="display" data-ai-label="Todo List Title">
        Todo List
      </h2>

      <div className="todo-input-row">
        <input
          type="text"
          data-ai-id="todo-input"
          data-ai-role="input"
          data-ai-label="New Todo Input"
          data-ai-context="todo-form"
          placeholder="Add a new task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button
          data-ai-id="todo-add-btn"
          data-ai-role="action"
          data-ai-label="Add Todo Button"
          data-ai-action="adds a new todo item"
          data-ai-context="todo-form"
          className="btn btn-primary"
          onClick={addTodo}
        >
          Add
        </button>
      </div>

      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={`todo-item ${todo.done ? 'done' : ''}`}>
            <input
              type="checkbox"
              data-ai-id={`todo-check-${todo.id}`}
              data-ai-role="input"
              data-ai-label={`Toggle: ${todo.text}`}
              data-ai-context="todo-list"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span
              data-ai-id={`todo-text-${todo.id}`}
              data-ai-role="display"
              data-ai-label={`Todo: ${todo.text}`}
            >
              {todo.text}
            </span>
            <button
              data-ai-id={`todo-delete-${todo.id}`}
              data-ai-role="action"
              data-ai-label={`Delete: ${todo.text}`}
              data-ai-action="deletes a todo item"
              data-ai-context="todo-list"
              className="btn-icon"
              onClick={() => deleteTodo(todo.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <p
        data-ai-id="todo-count"
        data-ai-role="display"
        data-ai-label="Todo Count"
        className="todo-count"
      >
        {todos.filter(t => !t.done).length} remaining · {todos.filter(t => t.done).length} done
      </p>
    </div>
  )
}
