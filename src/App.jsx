import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Portal from './pages/Portal'
import Board from './components/Board'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/board" element={<Board />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
