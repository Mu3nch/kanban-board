import TaskCard from './TaskCard'

export default function Column({ name, tasks, onEdit, onDelete, onAddClick }) {
  return (
    <div className="column">
      <div className="column-header">
        <h2>{name}</h2>
        <span className="task-count">{tasks.length}</span>
      </div>
      <div className="task-list">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
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
