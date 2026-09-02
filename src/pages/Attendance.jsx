import { useEffect, useState } from "react"
import { db } from "../db/db"

// TEMPORARY TEST MODE
// Change this to false before final deployment.
const TEST_MODE = true

function getSessionDate() {
  const today = new Date()

  if (TEST_MODE) {
    return today.toISOString().split("T")[0]
  }

  if (today.getDay() !== 0) {
    return null
  }

  return today.toISOString().split("T")[0]
}

function Attendance() {
  const [selectedGroup, setSelectedGroup] = useState("Adults")
  const [search, setSearch] = useState("")
  const [members, setMembers] = useState([])
  const [attendance, setAttendance] = useState([])
  const [visitors, setVisitors] = useState([])
  const [isSunday, setIsSunday] = useState(false)

  // Visitor form
  const [showVisitorForm, setShowVisitorForm] = useState(false)
  const [visitorName, setVisitorName] = useState("")
  const [visitorPurpose, setVisitorPurpose] = useState("First Time Visitor")
  const [visitorInvitedBy, setVisitorInvitedBy] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const savedMembers = await db.members.toArray()

    const today = new Date()
    const sunday = today.getDay() === 0

    setIsSunday(sunday)

    const sessionDate = getSessionDate()

    setMembers(savedMembers)

    if (!sessionDate) {
      setAttendance([])
      setVisitors([])
      return
    }

    const savedAttendance = await db.attendance
      .where("date")
      .equals(sessionDate)
      .toArray()

    const savedVisitors = await db.visitors
      .where("date")
      .equals(sessionDate)
      .toArray()

    setAttendance(savedAttendance)
    setVisitors(savedVisitors)
  }

  const markAttendance = async (member) => {
    const sessionDate = getSessionDate()

    if (!sessionDate) {
      return
    }

    const existingRecord = attendance.find(
      (record) => record.memberId === member.id
    )

    // Already present
    if (existingRecord) {
      const confirmed = window.confirm(
        `Remove ${member.name} from today's attendance?`
      )

      if (!confirmed) {
        return
      }

      await db.attendance.delete(existingRecord.id)

      setAttendance((current) =>
        current.filter(
          (record) => record.id !== existingRecord.id
        )
      )

      return
    }

    // Mark present
    const record = {
      memberId: member.id,
      memberName: member.name,
      group: member.group,
      date: sessionDate,
      time: new Date().toLocaleTimeString(),
      status: "Present",
    }

    const id = await db.attendance.add(record)

    setAttendance((current) => [
      ...current,
      {
        ...record,
        id,
      },
    ])
  }

  const addVisitor = async (e) => {
    e.preventDefault()

    const sessionDate = getSessionDate()

    if (!sessionDate || !visitorName.trim()) {
      return
    }

    const visitor = {
      name: visitorName.trim(),
      purpose: visitorPurpose,
      invitedBy: visitorInvitedBy.trim(),
      date: sessionDate,
      time: new Date().toLocaleTimeString(),
      service: "Sunday Morning",
    }

    const id = await db.visitors.add(visitor)

    setVisitors((current) => [
      ...current,
      {
        ...visitor,
        id,
      },
    ])

    // Reset form
    setVisitorName("")
    setVisitorPurpose("First Time Visitor")
    setVisitorInvitedBy("")
    setShowVisitorForm(false)
  }

  const removeVisitor = async (visitor) => {
    const confirmed = window.confirm(
      `Remove ${visitor.name} from today's visitors?`
    )

    if (!confirmed) {
      return
    }

    await db.visitors.delete(visitor.id)

    setVisitors((current) =>
      current.filter((item) => item.id !== visitor.id)
    )
  }

  const getGroupCount = (group) => {
    return attendance.filter(
      (record) => record.group === group
    ).length
  }

  const filteredMembers = members.filter(
    (member) =>
      member.group === selectedGroup &&
      member.name.toLowerCase().includes(search.toLowerCase())
  )

  const isPresent = (memberId) => {
    return attendance.some(
      (record) => record.memberId === memberId
    )
  }

  // Attendance is closed outside Sunday
  if (!isSunday && !TEST_MODE) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="mt-16 rounded-3xl bg-white p-8 text-center shadow-sm">

            <div className="mb-4 text-5xl">
              ⛪
            </div>

            <h1 className="text-2xl font-bold text-gray-800">
              Sunday Morning Service
            </h1>

            <div className="mx-auto mt-5 h-px w-16 bg-gray-200" />

            <p className="mt-5 text-gray-600">
              Attendance is currently closed.
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Attendance can only be recorded during the
              Sunday morning service.
            </p>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 pb-8">
      <div className="mx-auto max-w-md">

        {/* Header */}
        <div className="mb-6 text-center">

          <div className="mb-2 text-4xl">
            ⛪
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            Church Attendance
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Sunday Morning Service
          </p>

          {TEST_MODE && (
            <p className="mt-2 text-xs font-semibold text-orange-500">
              TEST MODE
            </p>
          )}

        </div>

        {/* Total Attendance */}
        <div className="mb-4 rounded-2xl bg-white p-5 text-center shadow-sm">

          <p className="text-sm font-medium text-gray-500">
            Today's Attendance
          </p>

          <p className="mt-1 text-5xl font-bold text-blue-600">
            {attendance.length}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Members Present
          </p>

        </div>

        {/* Group Counts */}
        <div className="mb-5 grid grid-cols-3 gap-2">

          <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-800">
              {getGroupCount("Adults")}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Adults
            </p>
          </div>

          <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-800">
              {getGroupCount("Youth")}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Youth
            </p>
          </div>

          <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-800">
              {getGroupCount("Children")}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Children
            </p>
          </div>

        </div>

        {/* Group Selector */}
        <div className="mb-4 grid grid-cols-3 gap-2">

          {["Adults", "Youth", "Children"].map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => {
                setSelectedGroup(group)
                setSearch("")
              }}
              className={`rounded-xl px-2 py-3 text-sm font-semibold transition ${
                selectedGroup === group
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"
              }`}
            >
              {group}
            </button>
          ))}

        </div>

        {/* Search */}
        <div className="mb-5">

          <input
            type="text"
            placeholder={`Search ${selectedGroup.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

        </div>

        {/* Members */}
        <div className="space-y-3">

          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {

              const present = isPresent(member.id)

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => markAttendance(member)}
                  className={`flex w-full items-center justify-between rounded-2xl p-4 text-left shadow-sm transition active:scale-[0.98] ${
                    present
                      ? "border border-green-200 bg-green-50"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >

                  <div className="min-w-0">

                    <p className="truncate font-semibold text-gray-800">
                      {member.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {member.group}
                    </p>

                  </div>

                  <div
                    className={`ml-3 shrink-0 text-sm font-semibold ${
                      present
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {present ? "✓ Present" : "○"}
                  </div>

                </button>
              )
            })
          ) : (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-500 shadow-sm">
              No members found.
            </div>
          )}

        </div>

        {/* Visitors Section */}
        <div className="mt-8">

          <div className="mb-3 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Visitors
              </h2>

              <p className="text-sm text-gray-500">
                {visitors.length} visitor
                {visitors.length !== 1 ? "s" : ""} today
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowVisitorForm(true)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              + Add Visitor
            </button>

          </div>

          {/* Visitor Form */}
          {showVisitorForm && (
            <form
              onSubmit={addVisitor}
              className="mb-4 rounded-2xl bg-white p-5 shadow-sm"
            >

              <div className="mb-4 flex items-center justify-between">

                <h3 className="font-bold text-gray-800">
                  Add Visitor
                </h3>

                <button
                  type="button"
                  onClick={() => setShowVisitorForm(false)}
                  className="text-xl text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>

              </div>

              {/* Name */}
              <div className="mb-4">

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Name *
                </label>

                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Enter visitor's name"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* Purpose */}
              <div className="mb-4">

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Reason for Visit *
                </label>

                <select
                  value={visitorPurpose}
                  onChange={(e) => setVisitorPurpose(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option>First Time Visitor</option>
                  <option>Visiting from Another Church</option>
                  <option>Returning Visitor</option>
                  <option>Invited Guest</option>
                  <option>Other</option>
                </select>

              </div>

              {/* Invited By */}
              <div className="mb-5">

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Who Invited Them?
                  <span className="ml-1 font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>

                <input
                  type="text"
                  value={visitorInvitedBy}
                  onChange={(e) => setVisitorInvitedBy(e.target.value)}
                  placeholder="Enter name if applicable"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() => setShowVisitorForm(false)}
                  className="rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-600 transition hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  Add Visitor
                </button>

              </div>

            </form>
          )}

          {/* Visitor List */}
          <div className="space-y-3">

            {visitors.length > 0 ? (
              visitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <p className="font-semibold text-gray-800">
                        {visitor.name}
                      </p>

                      <p className="mt-1 text-sm text-green-700">
                        {visitor.purpose}
                      </p>

                      {visitor.invitedBy && (
                        <p className="mt-1 text-xs text-gray-500">
                          Invited by: {visitor.invitedBy}
                        </p>
                      )}

                    </div>

                    <button
                      type="button"
                      onClick={() => removeVisitor(visitor)}
                      className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>

                  </div>

                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-white p-5 text-center text-sm text-gray-400 shadow-sm">
                No visitors recorded today.
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}

export default Attendance