function AuroraBackground({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">

      {/* Northern Lights Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">

        <div className="aurora aurora-one"></div>
        <div className="aurora aurora-two"></div>
        <div className="aurora aurora-three"></div>


        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-950/20"></div>

      </div>

      {/* App Content */}
      <div className="relative z-10 bg-transparent">
        {children}
      </div>

    </div>
  )
}

export default AuroraBackground