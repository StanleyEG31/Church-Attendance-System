import { useEffect, useState } from "react"
import { db } from "../db/db"

function History() {
  const [dates, setDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [records, setRecords] = useState([])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const allAttendance = await db.attendance.toArray()

    // Get unique attendance dates
    const uniqueDates = [
      ...new Set(allAttendance.map((record) => record.date)),
    ]

    // Newest date first
    uniqueDates.sort((a, b) => new Date(b) - new Date(a))

    setDates(uniqueDates)
  }

  const viewDate = async (date) => {
    const savedRecords = await db.attendance
      .where("date")
      .equals(date)
      .toArray()

    setSelectedDate(date)
    setRecords(savedRecords)
  }

  const getGroupCount = (group) => {
    return records.filter((record) => record.group === group).length
  }

  const formatDate = (date) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 pb-8">
      <div className="mx-auto max-w-md">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            📊 Attendance History
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Previous Sunday attendance
          </p>
        </div>

        {/* Selected Date */}
        {selectedDate ? (
          <>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null)
                setRecords([])
              }}
              className="mb-4 text-sm font-semibold text-blue-600"
            >
              ← Back to History
            </button>

            <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                {formatDate(selectedDate)}
              </p>

              <p className="mt-1 text-4xl font-bold text-blue-600">
                {records.length}
              </p>

              <p className="text-sm text-gray-500">
                Total Present
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">
                    {getGroupCount("Adults")}
                  </p>
                  <p className="text-xs text-gray-500">
                    Adults
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">
                    {getGroupCount("Youth")}
                  </p>
                  <p className="text-xs text-gray-500">
                    Youth
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xl font-bold text-gray-800">
                    {getGroupCount("Children")}
                  </p>
                  <p className="text-xs text-gray-500">
                    Children
                  </p>
                </div>
              </div>
            </div>

            {/* Present Members */}
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl bg-white p-4 shadow-sm"
                >
                  <p className="font-semibold text-gray-800">
                    {record.memberName}
                  </p>

                  <div className="mt-1 flex justify-between text-sm text-gray-500">
                    <span>{record.group}</span>
                    <span>{record.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* History List */}
            {dates.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center text-gray-500">
                No attendance history yet.
              </div>
            ) : (
              <div className="space-y-3">
                {dates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => viewDate(date)}
                    className="w-full rounded-2xl bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {formatDate(date)}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          Tap to view attendance
                        </p>
                      </div>

                      <span className="text-xl text-gray-400">
                        →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

export default History