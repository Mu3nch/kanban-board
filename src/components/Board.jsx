import { useState } from 'react'
import { COLUMNS } from '../data/mockTasks'
import { useTasks } from '../hooks/useTasks'
import Column from './Column'
import TaskModal from './TaskModal'

export default function Board() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState('Backlog')

  function openAdd(status) {
    setEditingTask(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  function openEdit(task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  function handleSave(form) {
    if (editingTask) {
      updateTask({ ...form, id: editingTask.id })
    } else {
      addTask(form)
    }
    setModalOpen(false)
  }

  return (
    <div>
      <header className="app-header">
        <h1>Capstone Kanban</h1>
        <button className="new-task-btn" onClick={() => openAdd('Backlog')}>+ New Task</button>
      </header>
      <div className="board">
        {COLUMNS.map(col => (
          <Column
            key={col}
            name={col}
            tasks={tasks.filter(t => t.status === col)}
            onEdit={openEdit}
            onDelete={deleteTask}
            onAddClick={openAdd}
          />
        ))}
      </div>
      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultStatus={defaultStatus}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
