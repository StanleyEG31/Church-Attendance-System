import { useState } from "react"
import { db } from "../db/db"
import churchLogo from "../assets/COTF-LOGO.png"

function Settings() {
  const [message, setMessage] = useState("")

  const backupData = async () => {
    try {
      const members = await db.members.toArray()
      const attendance = await db.attendance.toArray()

      const backup = {
        version: 1,
        createdAt: new Date().toISOString(),
        members,
        attendance,
      }

      const json = JSON.stringify(backup, null, 2)

      const blob = new Blob([json], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.href = url

      link.download = `church-attendance-backup-${new Date()
        .toISOString()
        .split("T")[0]}.json`

      link.click()

      URL.revokeObjectURL(url)

      setMessage("Backup created successfully.")
    } catch (error) {
      console.error(error)
      setMessage("Failed to create backup.")
    }
  }

  const restoreData = (event) => {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target.result)

        if (!backup.members || !backup.attendance) {
          throw new Error("Invalid backup file")
        }

        const confirmed = window.confirm(
          "Restoring this backup will replace the current members and attendance data. Continue?"
        )

        if (!confirmed) {
          event.target.value = ""
          return
        }

        await db.members.clear()
        await db.attendance.clear()

        await db.members.bulkAdd(backup.members)
        await db.attendance.bulkAdd(backup.attendance)

        setMessage("Data restored successfully.")

        event.target.value = ""
      } catch (error) {
        console.error(error)
        setMessage("Invalid or damaged backup file.")
      }
    }

    reader.readAsText(file)
  }

  // Clear attendance only
  const clearAttendanceHistory = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL attendance history?\n\nYour members will NOT be deleted."
    )

    if (!confirmed) {
      return
    }

    try {
      await db.attendance.clear()

      setMessage("Attendance history cleared successfully.")
    } catch (error) {
      console.error(error)
      setMessage("Failed to clear attendance history.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 pb-8">
      <div className="mx-auto max-w-md">

        {/* Header */}
        <div className="mb-6">

          <div className="flex items-center gap-3">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
              <img
                src={churchLogo}
                alt="COTF Church Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">

              <h1 className="text-xl font-bold text-slate-800">
                Settings
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage your attendance data
              </p>

            </div>

          </div>

        </div>

        {/* Message */}
        {message && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4">

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
              ✓
            </div>

            <p className="pt-1 text-sm font-semibold text-green-700">
              {message}
            </p>

          </div>
        )}

        {/* Backup */}
        <div className="mb-4 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">

          <div className="h-1.5 bg-blue-600" />

          <div className="p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <span className="text-lg font-bold">
                  ↓
                </span>
              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Backup Data
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Save your members and attendance records
                  to a backup file.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={backupData}
              className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              Download Backup
            </button>

          </div>

        </div>

        {/* Restore */}
        <div className="mb-4 overflow-hidden rounded-3xl border border-green-100 bg-white shadow-sm">

          <div className="h-1.5 bg-green-600" />

          <div className="p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <span className="text-lg font-bold">
                  ↑
                </span>
              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Restore Data
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Restore members and attendance from a
                  backup file.
                </p>

              </div>

            </div>

            <label className="mt-5 block w-full cursor-pointer rounded-xl border border-green-200 bg-green-50 py-3.5 text-center text-sm font-bold text-green-700 transition hover:bg-green-100 active:scale-[0.98]">

              Choose Backup File

              <input
                type="file"
                accept=".json"
                onChange={restoreData}
                className="hidden"
              />

            </label>

          </div>

        </div>

        {/* Clear Attendance */}
        <div className="mb-4 overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm">

          <div className="h-1.5 bg-red-500" />

          <div className="p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <span className="text-lg font-bold">
                  ×
                </span>
              </div>

              <div>

                <h2 className="text-lg font-bold text-slate-800">
                  Clear Attendance History
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Delete all attendance records while
                  keeping your members.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={clearAttendanceHistory}
              className="mt-5 w-full rounded-xl bg-red-500 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 active:scale-[0.98]"
            >
              Clear Attendance History
            </button>

          </div>

        </div>

        {/* Warning */}
        <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">

          <div className="flex items-start gap-3">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700">
              !
            </div>

            <div>

              <p className="text-sm font-bold text-yellow-800">
                Keep your data safe
              </p>

              <p className="mt-1 text-xs leading-5 text-yellow-700">
                Keep a backup of your attendance data in a
                safe location. If the phone is lost or its
                browser data is cleared, local data may be
                lost.
              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default Settings

