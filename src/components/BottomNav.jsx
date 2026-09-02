function BottomNav({ activePage, setActivePage }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md justify-around">

        {/* Attendance */}
        <button
          type="button"
          onClick={() => setActivePage("attendance")}
          className={`flex flex-1 flex-col items-center py-3 text-xs font-medium ${
            activePage === "attendance"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        >
          <span className="text-xl">🏠</span>
          <span>Attendance</span>
        </button>

        {/* Members */}
        <button
          type="button"
          onClick={() => setActivePage("members")}
          className={`flex flex-1 flex-col items-center py-3 text-xs font-medium ${
            activePage === "members"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        >
          <span className="text-xl">👥</span>
          <span>Members</span>
        </button>

        {/* History */}
        <button
          type="button"
          onClick={() => setActivePage("history")}
          className={`flex flex-1 flex-col items-center py-3 text-xs font-medium ${
            activePage === "history"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        >
          <span className="text-xl">📊</span>
          <span>History</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={() => setActivePage("settings")}
          className={`flex flex-1 flex-col items-center py-3 text-xs font-medium ${
            activePage === "settings"
              ? "text-blue-600"
              : "text-gray-400"
          }`}
        >
          <span className="text-xl">⚙️</span>
          <span>Settings</span>
        </button>

      </div>
    </nav>
  )
}

export default BottomNav