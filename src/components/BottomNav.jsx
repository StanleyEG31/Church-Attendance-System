function BottomNav({ activePage, setActivePage }) {
  const navItems = [
    {
      id: "attendance",
      label: "Attendance",
      icon: "✓",
    },
    {
      id: "members",
      label: "Members",
      icon: "●",
    },
    {
      id: "history",
      label: "History",
      icon: "▥",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "⚙",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-md">

        {navItems.map((item) => {
          const isActive = activePage === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              className={`relative flex min-h-[68px] flex-1 flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >

              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 h-1 w-10 rounded-b-full bg-blue-600" />
              )}

              {/* Icon */}
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "bg-transparent text-slate-400"
                }`}
              >
                {item.icon}
              </span>

              {/* Label */}
              <span
                className={`text-[11px] ${
                  isActive
                    ? "font-bold"
                    : "font-medium"
                }`}
              >
                {item.label}
              </span>

            </button>
          )
        })}

      </div>
    </nav>
  )
}

export default BottomNav

