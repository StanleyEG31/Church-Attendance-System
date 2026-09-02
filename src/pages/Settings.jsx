import { useState } from "react"
import { db } from "../db/db"

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
    <div className="min-h-screen bg-gray-100 px-4 py-6 pb-8">
      <div className="mx-auto max-w-md">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            ⚙️ Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your attendance data
          </p>
        </div>

        {/* Backup */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            💾 Backup Data
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Save your members and attendance records to a
            backup file.
          </p>

          <button
            type="button"
            onClick={backupData}
            className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white"
          >
            Download Backup
          </button>
        </div>

        {/* Restore */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            ♻️ Restore Data
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Restore members and attendance from a backup
            file.
          </p>

          <label className="mt-4 block w-full cursor-pointer rounded-xl bg-gray-200 py-3 text-center font-semibold text-gray-700">
            Choose Backup File

            <input
              type="file"
              accept=".json"
              onChange={restoreData}
              className="hidden"
            />
          </label>
        </div>

        {/* Clear Attendance */}
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            🗑️ Clear Attendance History
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Delete all attendance records while keeping
            your members.
          </p>

          <button
            type="button"
            onClick={clearAttendanceHistory}
            className="mt-4 w-full rounded-xl bg-red-600 py-3 font-semibold text-white"
          >
            Clear Attendance History
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 rounded-2xl bg-green-50 p-4 text-center text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {/* Warning */}
        <div className="mt-6 rounded-2xl bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Keep a backup of your attendance data in a
            safe location. If the phone is lost or its
            browser data is cleared, local data may be
            lost.
          </p>
        </div>

      </div>
    </div>
  )
}

export default Settings