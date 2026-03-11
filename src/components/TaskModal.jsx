import { useState, useEffect } from 'react'
import { COLUMNS } from '../data/mockTasks'

const PRIORITIES = ['Low', 'Medium', 'High']
const EMPTY = { title: '', description: '', priority: 'Medium', due_date: '', status: 'Backlog', dependency_id: '' }

export default function TaskModal({ task, defaultStatus, allTasks = [], onSave, onClose }) {
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
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'New Task'}</h2>
          <p>ACE Capital · Operations</p>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <label>Title *
              <input name="title" value={form.title} onChange={handleChange} required />
            </label>
            <label>Description
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
            </label>
            <div className="form-row">
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
            </div>
            <div className="form-row">
              <label>Due Date
                <input type="date" name="due_date" value={form.due_date} onChange={handleChange} />
              </label>
              <label>Depends On
                <select name="dependency_id" value={form.dependency_id} onChange={handleChange}>
                  <option value="">None</option>
                  {allTasks.filter(t => t.id !== task?.id).map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit">{task ? 'Save Changes' : 'Add Task'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
