import { useEffect, useState } from "react";
import Attendance from "./pages/Attendance";
import Members from "./pages/Members";
import History from "./pages/History";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";
import Dashboard from "./pages/Dashboard";
import SyncOverlay from "./components/SyncOverlay";
import { api } from "./api";

const TEST_MODE = true;

function App() {
  const today = new Date().getDay();
  const isSunday = today === 0;

  const [activePage, setActivePage] = useState("attendance");
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    let syncing = false;

    const handleSyncStatus = (event) => {
      setSyncStatus(event.detail);

      if (
        event.detail === "success" ||
        event.detail === "partial" ||
        event.detail === "failed"
      ) {
        setTimeout(() => {
          setSyncStatus(null);
        }, 2500);
      }
    };

    const runSync = async () => {
      if (syncing) {
        console.log("App sync already running. Skipping duplicate sync.");
        return;
      }

      if (!navigator.onLine) {
        return;
      }

      if (!api.hasPendingSync()) {
        return;
      }

      syncing = true;

      try {
        await api.syncOfflineData();
      } finally {
        syncing = false;
      }
    };

    window.addEventListener("church-sync-status", handleSyncStatus);
    window.addEventListener("online", runSync);

    // Check when the app starts
    runSync();

    return () => {
      window.removeEventListener("church-sync-status", handleSyncStatus);
      window.removeEventListener("online", runSync);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sync Overlay */}
      <SyncOverlay status={syncStatus} />

      {/* App Content */}
      {TEST_MODE || isSunday ? (
        <div className="pb-20">
          {/* Page */}
          {activePage === "dashboard" && <Dashboard />}

          {activePage === "attendance" && <Attendance />}

          {activePage === "members" && <Members />}

          {activePage === "history" && <History />}

          {activePage === "settings" && <Settings />}

          {/* Bottom Navigation */}
          <BottomNav activePage={activePage} setActivePage={setActivePage} />
        </div>
      ) : (
        <div
          className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
          style={{
            backgroundImage: "url('../public/COTF_Background.jpg')",
          }}
        >
          {/* Light transparent overlay */}
          <div className="absolute inset-0 bg-white/70"></div>

          {/* Closed Screen Container */}
          <div className="relative z-10 w-[90%] max-w-md bg-white/95 rounded-3xl shadow-xl p-8 text-center">
            {/* Logo */}
            <img
              src="../public/COTF-LOGO.png"
              alt="COTF"
              className="w-24 h-24 mx-auto mb-5 object-cover rounded-full"
            />

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-800">
              Sunday Morning Service
            </h1>

            {/* Message */}
            <p className="mt-3 text-gray-500 leading-relaxed">
              Attendance is currently closed.
            </p>

            <p className="mt-5 text-sm text-gray-400">
              Please come back on Sunday.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
