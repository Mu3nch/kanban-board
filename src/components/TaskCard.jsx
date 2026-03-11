export default function TaskCard({ task, allTasks = [], onEdit, onDelete }) {
  const priorityColor = { High: '#dc2626', Medium: '#d97706', Low: '#059669' }
  const priorityClass = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' }

  function handleDragStart(e) {
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className={`task-card ${priorityClass[task.priority] || ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={e => e.preventDefault()}
    >
      <div className="task-header">
        <span
          className="priority-badge"
          style={{ backgroundColor: priorityColor[task.priority] }}
        >
          {task.priority}
        </span>
        <div className="task-actions">
          <button onClick={() => onEdit(task)}>Edit</button>
          <button onClick={() => onDelete(task.id)}>Delete</button>
        </div>
      </div>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <div className="task-meta">
        {task.due_date && <small className="due-date">Due: {task.due_date}</small>}
        {task.dependency_id && (
          <small className="dependency">
            {allTasks.find(t => t.id === task.dependency_id)?.title || task.dependency_id}
          </small>
        )}
      </div>
    </div>
  )
}
