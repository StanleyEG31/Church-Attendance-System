import { useEffect, useState } from "react"
import Attendance from "./pages/Attendance"
import Members from "./pages/Members"
import History from "./pages/History"
import Settings from "./pages/Settings"
import BottomNav from "./components/BottomNav"
import Dashboard from "./pages/Dashboard"
import SyncOverlay from "./components/SyncOverlay"
import { api } from "./api"


function App() {
  const [activePage, setActivePage] = useState("attendance")
  const [syncStatus, setSyncStatus] = useState(null)


  useEffect(() => {
    const handleSyncStatus = (event) => {
      setSyncStatus(event.detail)

      if (
        event.detail === "success" ||
        event.detail === "partial" ||
        event.detail === "failed"
      ) {
        setTimeout(() => {
          setSyncStatus(null)
        }, 2500)
      }
    }

    window.addEventListener("church-sync-status", handleSyncStatus)

    const handleOnline = async () => {
      if (api.hasPendingSync()) {
        await api.syncOfflineData()
      }
    }

    window.addEventListener("online", handleOnline)

    // Check when the app starts
    if (navigator.onLine && api.hasPendingSync()) {
      api.syncOfflineData()
    }

    return () => {
      window.removeEventListener("church-sync-status", handleSyncStatus)
      window.removeEventListener("online", handleOnline)
    }
  }, [])


  return (
    <div className="min-h-screen bg-gray-100 pb-20">

      {/* Sync Overlay */}
      <SyncOverlay status={syncStatus} />

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