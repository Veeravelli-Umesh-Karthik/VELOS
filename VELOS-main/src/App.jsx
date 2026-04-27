import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from './components/Admin/AdminDashboard'
import DriverCockpit from './components/Driver/DriverCockpit'
import Login from './components/Login/Login'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Gateway Screen */}
        <Route path="/" element={<Login />} />
        
        {/* Admin Command Center */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Driver Cockpit, expects driver ID */}
        <Route path="/driver/:id" element={<DriverCockpit />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
