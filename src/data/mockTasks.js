export const COLUMNS = ['Backlog', 'To Do', 'In Progress', 'Blocked', 'Done']

export const mockTasks = [
  {
    id: '1',
    title: 'Set up project repo',
    description: 'Initialize Git and push to GitHub.',
    priority: 'High',
    due_date: '2026-03-15',
    status: 'Done',
    dependency_id: null,
  },
  {
    id: '2',
    title: 'Design database schema',
    description: 'Define tables and relationships in Supabase.',
    priority: 'High',
    due_date: '2026-03-20',
    status: 'In Progress',
    dependency_id: '1',
  },
  {
    id: '3',
    title: 'Build kanban UI',
    description: 'React components for board, columns, and cards.',
    priority: 'Medium',
    due_date: '2026-03-25',
    status: 'To Do',
    dependency_id: null,
  },
]
