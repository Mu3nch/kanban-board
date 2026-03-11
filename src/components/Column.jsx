import { useState } from 'react'
import TaskCard from './TaskCard'

const DOT_CLASS = {
  'Backlog':     'column-dot-backlog',
  'In Progress': 'column-dot-inprogress',
  'Blocked':     'column-dot-blocked',
  'Done':        'column-dot-done',
}

export default function Column({ name, tasks, allTasks, onEdit, onDelete, onAddClick, onDropTask }) {
  const [dragOver, setDragOver] = useState(false)

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  function handleDragLeave(e) {
    // Only clear when leaving the column entirely, not when entering a child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) onDropTask(taskId, name)
  }

  return (
    <div
      className={`column ${dragOver ? 'column-drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="column-header-left">
          <span className={`column-dot ${DOT_CLASS[name] || 'column-dot-backlog'}`} />
          <h2>{name}</h2>
        </div>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div className="task-list">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            allTasks={allTasks}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <button className="add-task-btn" onClick={() => onAddClick(name)}>
        + Add Task
      </button>
    </div>
  )
}
