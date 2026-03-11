import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COLUMNS } from '../data/mockTasks'
import { useTasks } from '../hooks/useTasks'
import Column from './Column'
import TaskModal from './TaskModal'

export default function Board() {
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState('Backlog')

  if (loading) return <div className="board-loading">Loading tasks…</div>

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

  function handleDropTask(taskId, newStatus) {
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== newStatus) {
      updateTask({ ...task, status: newStatus })
    }
  }

  const activeTasks = tasks.filter(t => t.status !== 'Done').length
  const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length

  return (
    <div>
      <header className="app-header">
        <div className="header-brand">
          <button className="portal-back-btn" onClick={() => navigate('/')}>← Portal</button>
          <h1>ACE <span>Capital</span></h1>
          <span className="header-tagline">Operations Command Center</span>
        </div>
        <div className="header-right">
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">{tasks.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{activeTasks}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{highPriority}</span>
              <span className="stat-label">High Pri</span>
            </div>
          </div>
          <button className="new-task-btn" onClick={() => openAdd('Backlog')}>+ New Task</button>
        </div>
      </header>
      <div className="board-wrapper">
        <div className="board">
          {COLUMNS.map(col => (
            <Column
              key={col}
              name={col}
              tasks={tasks.filter(t => t.status === col)}
              allTasks={tasks}
              onEdit={openEdit}
              onDelete={deleteTask}
              onAddClick={openAdd}
              onDropTask={handleDropTask}
            />
          ))}
        </div>
      </div>
      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultStatus={defaultStatus}
          allTasks={tasks}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
