import { useEffect, useState } from "react"
import { db } from "../db/db"
import churchLogo from "../assets/COTF-LOGO.png"

function History() {
  const [months, setMonths] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(null)

  const [members, setMembers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [visitors, setVisitors] = useState([])

  const [selectedDate, setSelectedDate] = useState(null)
  const [records, setRecords] = useState([])
  const [dateVisitors, setDateVisitors] = useState([])

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const allAttendance = await db.attendance.toArray()
    const allVisitors = await db.visitors.toArray()
    const allMembers = await db.members.toArray()

    setMembers(allMembers)
    setAttendance(allAttendance)
    setVisitors(allVisitors)

    const allDates = [
      ...allAttendance.map((record) => record.date),
      ...allVisitors.map((visitor) => visitor.date),
    ]

    const uniqueMonths = [
      ...new Set(
        allDates.map((date) => date.substring(0, 7))
      ),
    ]

    uniqueMonths.sort((a, b) => b.localeCompare(a))

    setMonths(uniqueMonths)
  }

  const getSundaysInMonth = (month) => {
    const [year, monthNumber] = month.split("-").map(Number)

    const sundays = []

    const date = new Date(year, monthNumber - 1, 1)

    while (date.getMonth() === monthNumber - 1) {
      if (date.getDay() === 0) {
        const dateString =
          `${year}-${String(monthNumber).padStart(2, "0")}-${String(
            date.getDate()
          ).padStart(2, "0")}`

        sundays.push(dateString)
      }

      date.setDate(date.getDate() + 1)
    }

    // Only count Sundays that have already happened
    const today = new Date()
    const todayString = today.toISOString().split("T")[0]

    return sundays.filter((date) => date <= todayString)
  }

  const viewMonth = (month) => {
    setSelectedMonth(month)
    setSelectedDate(null)
    setRecords([])
    setDateVisitors([])
  }

  const viewDate = async (date) => {
    const savedRecords = await db.attendance
      .where("date")
      .equals(date)
      .toArray()

    const savedVisitors = await db.visitors
      .where("date")
      .equals(date)
      .toArray()

    setSelectedDate(date)
    setRecords(savedRecords)
    setDateVisitors(savedVisitors)
  }

  const getGroupCount = (group) => {
    return records.filter(
      (record) => record.group === group
    ).length
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

  const formatMonth = (month) => {
    const [year, monthNumber] = month.split("-").map(Number)

    return new Date(
      year,
      monthNumber - 1,
      1
    ).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
  }

  const getMonthAttendance = () => {
    if (!selectedMonth) {
      return []
    }

    return attendance.filter((record) =>
      record.date.startsWith(selectedMonth)
    )
  }

  const getMonthVisitors = () => {
    if (!selectedMonth) {
      return []
    }

    return visitors.filter((visitor) =>
      visitor.date.startsWith(selectedMonth)
    )
  }

  const getUniqueMembersAttended = () => {
    const monthAttendance = getMonthAttendance()

    return new Set(
      monthAttendance.map((record) => record.memberId)
    ).size
  }

  const getPerfectAttendance = () => {
    if (!selectedMonth) {
      return []
    }

    const sundays = getSundaysInMonth(selectedMonth)

    if (sundays.length === 0) {
      return []
    }

    return members.filter((member) => {
      const memberAttendanceDates = new Set(
        attendance
          .filter(
            (record) =>
              record.memberId === member.id &&
              record.date.startsWith(selectedMonth)
          )
          .map((record) => record.date)
      )

      return sundays.every((sunday) =>
        memberAttendanceDates.has(sunday)
      )
    })
  }

  const getVisitorCountByPurpose = (purpose) => {
    return getMonthVisitors().filter(
      (visitor) => visitor.purpose === purpose
    ).length
  }

  const getMonthSundays = () => {
    if (!selectedMonth) {
      return []
    }

    return getSundaysInMonth(selectedMonth)
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
                Attendance History
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Monthly attendance reports
              </p>

            </div>

          </div>

        </div>

        {/* ==================== SPECIFIC DATE ==================== */}
        {selectedDate ? (
          <>

            {/* Back */}
            <button
              type="button"
              onClick={() => {
                setSelectedDate(null)
                setRecords([])
                setDateVisitors([])
              }}
              className="mb-4 flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
            >
              ← Back to Month
            </button>

            {/* Date Summary */}
            <div className="mb-5 overflow-hidden rounded-3xl bg-white shadow-md">

              <div className="h-2 bg-blue-600" />

              <div className="p-5">

                <p className="text-sm font-semibold text-slate-500">
                  {formatDate(selectedDate)}
                </p>

                <div className="mt-3 flex items-end justify-between">

                  <div>

                    <p className="text-5xl font-black text-blue-600">
                      {records.length}
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Members Present
                    </p>

                  </div>

                  <div className="rounded-2xl bg-yellow-50 px-4 py-3 text-center">

                    <p className="text-2xl font-black text-yellow-600">
                      {dateVisitors.length}
                    </p>

                    <p className="text-xs font-semibold text-yellow-700">
                      Visitors
                    </p>

                  </div>

                </div>

                {/* Groups */}
                <div className="mt-5 grid grid-cols-3 gap-2">

                  <div className="rounded-xl bg-green-50 p-3 text-center">
                    <p className="text-xl font-black text-green-700">
                      {getGroupCount("Adults")}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-green-700">
                      Adults
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3 text-center">
                    <p className="text-xl font-black text-blue-700">
                      {getGroupCount("Youth")}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-blue-700">
                      Youth
                    </p>
                  </div>

                  <div className="rounded-xl bg-yellow-50 p-3 text-center">
                    <p className="text-xl font-black text-yellow-700">
                      {getGroupCount("Children")}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-yellow-700">
                      Children
                    </p>
                  </div>

                </div>

              </div>

            </div>

            {/* Present Members */}
            <div className="mb-7">

              <div className="mb-3 flex items-center justify-between">

                <h2 className="text-lg font-bold text-slate-800">
                  Present Members
                </h2>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  {records.length}
                </span>

              </div>

              <div className="space-y-2.5">

                {records.length > 0 ? (
                  records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
                          {record.memberName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-slate-800">
                            {record.memberName}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {record.group}
                          </p>

                        </div>

                      </div>

                      <span className="ml-3 shrink-0 text-xs font-semibold text-slate-400">
                        {record.time}
                      </span>

                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">

                    <p className="font-semibold text-slate-600">
                      No members recorded
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      No attendance was recorded for this Sunday.
                    </p>

                  </div>
                )}

              </div>

            </div>

            {/* Visitors */}
            {dateVisitors.length > 0 && (
              <div>

                <div className="mb-3 flex items-center justify-between">

                  <h2 className="text-lg font-bold text-slate-800">
                    Visitors
                  </h2>

                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                    {dateVisitors.length}
                  </span>

                </div>

                <div className="space-y-2.5">

                  {dateVisitors.map((visitor) => (
                    <div
                      key={visitor.id}
                      className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 shadow-sm"
                    >

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 font-bold text-yellow-700">
                          {visitor.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="font-semibold text-slate-800">
                            {visitor.name}
                          </p>

                          <p className="mt-1 text-sm font-medium text-yellow-700">
                            {visitor.purpose}
                          </p>

                          {visitor.invitedBy && (
                            <p className="mt-1 text-xs text-slate-500">
                              Invited by: {visitor.invitedBy}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-slate-400">
                            {visitor.time}
                          </p>

                        </div>

                      </div>

                    </div>
                  ))}

                </div>

              </div>
            )}

          </>
        ) : selectedMonth ? (
          <>
            {/* ==================== MONTH VIEW ==================== */}

            <button
              type="button"
              onClick={() => setSelectedMonth(null)}
              className="mb-4 flex items-center gap-1 rounded-xl px-2 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-50"
            >
              ← Back to Months
            </button>

            <div className="mb-5">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Monthly Report
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-800">
                {formatMonth(selectedMonth)}
              </h2>

            </div>

            {/* Monthly Summary */}
            <div className="mb-7 grid grid-cols-2 gap-3">

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

                <p className="text-xs font-semibold text-slate-400">
                  Registered Members
                </p>

                <p className="mt-2 text-3xl font-black text-slate-800">
                  {members.length}
                </p>

              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

                <p className="text-xs font-semibold text-blue-600">
                  Members Attended
                </p>

                <p className="mt-2 text-3xl font-black text-blue-700">
                  {getUniqueMembersAttended()}
                </p>

              </div>

              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">

                <p className="text-xs font-semibold text-green-600">
                  Total Attendances
                </p>

                <p className="mt-2 text-3xl font-black text-green-700">
                  {getMonthAttendance().length}
                </p>

              </div>

              <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">

                <p className="text-xs font-semibold text-yellow-700">
                  Total Visitors
                </p>

                <p className="mt-2 text-3xl font-black text-yellow-700">
                  {getMonthVisitors().length}
                </p>

              </div>

            </div>

            {/* Sundays */}
            <div className="mb-7">

              <div className="mb-3">

                <h2 className="text-lg font-bold text-slate-800">
                  Sunday Attendance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select a Sunday to view detailed records.
                </p>

              </div>

              <div className="space-y-2.5">

                {getMonthSundays().map((sunday) => {

                  const sundayRecords =
                    attendance.filter(
                      (record) => record.date === sunday
                    )

                  const sundayVisitors =
                    visitors.filter(
                      (visitor) => visitor.date === sunday
                    )

                  return (
                    <button
                      key={sunday}
                      type="button"
                      onClick={() => viewDate(sunday)}
                      className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-100 hover:bg-blue-50/20 active:scale-[0.98]"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-slate-800">
                            {formatDate(sunday)}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">

                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {sundayRecords.length} members
                            </span>

                            <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
                              {sundayVisitors.length} visitors
                            </span>

                          </div>

                        </div>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-400">
                          →
                        </span>

                      </div>

                    </button>
                  )
                })}

              </div>

            </div>

            {/* Perfect Attendance */}
            <div className="mb-7">

              <div className="mb-3">

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-lg">
                    🏆
                  </div>

                  <h2 className="text-lg font-bold text-slate-800">
                    Perfect Attendance
                  </h2>

                </div>

                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Members who attended every Sunday this month.
                </p>

              </div>

              <div className="rounded-2xl border border-yellow-100 bg-white p-4 shadow-sm">

                {getPerfectAttendance().length > 0 ? (
                  <div className="space-y-2.5">

                    {getPerfectAttendance().map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-xl bg-green-50 p-3"
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">
                            {member.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate font-semibold text-slate-800">
                              {member.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {member.group}
                            </p>

                          </div>

                        </div>

                        <span className="ml-2 shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                          ✓ Perfect
                        </span>

                      </div>
                    ))}

                  </div>
                ) : (
                  <div className="py-3 text-center">

                    <p className="font-semibold text-slate-600">
                      No perfect attendance yet.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Members must attend every completed Sunday.
                    </p>

                  </div>
                )}

              </div>

            </div>

            {/* Visitor Breakdown */}
            <div className="mb-7">

              <div className="mb-3">

                <h2 className="text-lg font-bold text-slate-800">
                  Visitor Summary
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Breakdown of visitors by reason for visiting.
                </p>

              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

                <div className="divide-y divide-slate-100">

                  <div className="flex items-center justify-between p-4">

                    <span className="text-sm text-slate-600">
                      First Time Visitor
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                      {getVisitorCountByPurpose(
                        "First Time Visitor"
                      )}
                    </span>

                  </div>

                  <div className="flex items-center justify-between p-4">

                    <span className="text-sm text-slate-600">
                      Visiting from Another Church
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                      {getVisitorCountByPurpose(
                        "Visiting from Another Church"
                      )}
                    </span>

                  </div>

                  <div className="flex items-center justify-between p-4">

                    <span className="text-sm text-slate-600">
                      Returning Visitor
                    </span>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                      {getVisitorCountByPurpose(
                        "Returning Visitor"
                      )}
                    </span>

                  </div>

                  <div className="flex items-center justify-between p-4">

                    <span className="text-sm text-slate-600">
                      Invited Guest
                    </span>

                    <span className="rounded-full bg-yellow-50 px-3 py-1 text-sm font-bold text-yellow-700">
                      {getVisitorCountByPurpose(
                        "Invited Guest"
                      )}
                    </span>

                  </div>

                  <div className="flex items-center justify-between p-4">

                    <span className="text-sm text-slate-600">
                      Other
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                      {getVisitorCountByPurpose("Other")}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </>
        ) : (
          <>
            {/* ==================== MONTH LIST ==================== */}

            <div className="mb-4">

              <h2 className="text-lg font-bold text-slate-800">
                Attendance Reports
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a month to view attendance records.
              </p>

            </div>

            {months.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-7 text-center shadow-sm">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  —
                </div>

                <p className="mt-3 font-semibold text-slate-600">
                  No attendance history yet.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Attendance records will appear here after a service.
                </p>

              </div>
            ) : (
              <div className="space-y-2.5">

                {months.map((month) => (

                  <button
                    key={month}
                    type="button"
                    onClick={() => viewMonth(month)}
                    className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-100 hover:bg-blue-50/20 active:scale-[0.98]"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <span className="text-lg font-bold">
                            ▣
                          </span>
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-slate-800">
                            {formatMonth(month)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            View monthly attendance
                          </p>

                        </div>

                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-400">
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

