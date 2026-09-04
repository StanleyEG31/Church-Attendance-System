import { useState } from "react"
import Attendance from "./pages/Attendance"
import Members from "./pages/Members"
import History from "./pages/History"
import Settings from "./pages/Settings"
import BottomNav from "./components/BottomNav"
import Dashboard from "./pages/Dashboard"


function App() {
  const [activePage, setActivePage] = useState("attendance")


  return (
    <div className="min-h-screen bg-gray-100 pb-20">

      {/* Page */}
      {activePage === "dashboard" && <Dashboard />}
      
      {activePage === "attendance" && <Attendance />}

      {activePage === "members" && <Members />}

      {activePage === "history" && <History />}

      {activePage === "settings" && <Settings />}

      {/* Bottom Navigation */}
      <BottomNav
        activePage={activePage}
        setActivePage={setActivePage}
      />

    </div>
  )
}

export default App