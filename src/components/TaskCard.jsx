export default function TaskCard({ task, onEdit, onDelete }) {
  const priorityColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }

  return (
    <div className="task-card">
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
      {task.due_date && <small>Due: {task.due_date}</small>}
      {task.dependency_id && (
        <small className="dependency">Depends on: #{task.dependency_id}</small>
      )}
    </div>
  )
}
