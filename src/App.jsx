import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Portal from './pages/Portal'
import Board from './components/Board'
import FacilityDirectory from './pages/FacilityDirectory'
import DataHub from './pages/DataHub'
import BusinessDocuments from './pages/BusinessDocuments'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import ReportsExports from './pages/ReportsExports'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/board" element={<Board />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/facilities" element={<FacilityDirectory />} />
        <Route path="/data-hub" element={<DataHub />} />
        <Route path="/documents" element={<BusinessDocuments />} />
        <Route path="/reports" element={<ReportsExports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
