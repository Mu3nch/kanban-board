import { useState, useEffect } from 'react'
import { COLUMNS } from '../data/mockTasks'

const PRIORITIES = ['Low', 'Medium', 'High']
const EMPTY = { title: '', description: '', priority: 'Medium', due_date: '', status: 'Backlog', dependency_id: '' }

export default function TaskModal({ task, defaultStatus, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (task) {
      setForm({ ...task, dependency_id: task.dependency_id ?? '' })
    } else {
      setForm({ ...EMPTY, status: defaultStatus || 'Backlog' })
    }
  }, [task, defaultStatus])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({ ...form, dependency_id: form.dependency_id || null })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{task ? 'Edit Task' : 'New Task'}</h2>
        <form onSubmit={handleSubmit}>
          <label>Title *
            <input name="title" value={form.title} onChange={handleChange} required />
          </label>
          <label>Description
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
          </label>
          <label>Priority
            <select name="priority" value={form.priority} onChange={handleChange}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label>Status
            <select name="status" value={form.status} onChange={handleChange}>
              {COLUMNS.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Due Date
            <input type="date" name="due_date" value={form.due_date} onChange={handleChange} />
          </label>
          <label>Dependency ID (optional)
            <input name="dependency_id" value={form.dependency_id} onChange={handleChange} placeholder="Task ID this depends on" />
          </label>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">{task ? 'Save' : 'Add Task'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
