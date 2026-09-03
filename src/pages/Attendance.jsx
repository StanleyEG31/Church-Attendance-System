import { useEffect, useState } from "react";
import { api } from "../api";
import churchLogo from "../assets/COTF-LOGO.png";

// TEMPORARY TEST MODE
// Change this to false before final deployment.
const TEST_MODE = true;

function getSessionDate() {
  const today = new Date();

  if (TEST_MODE) {
    return today.toISOString().split("T")[0];
  }

  if (today.getDay() !== 0) {
    return null;
  }

  return today.toISOString().split("T")[0];
}

function Attendance() {
  const [selectedGroup, setSelectedGroup] = useState("Adults");
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [isSunday, setIsSunday] = useState(false);

  // Visitor form
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPurpose, setVisitorPurpose] = useState("First Time Visitor");
  const [visitorInvitedBy, setVisitorInvitedBy] = useState("");

useEffect(() => {
  loadData();

const handleOnline = async () => {
  try {
    let queue = JSON.parse(
      localStorage.getItem("church_attendance_queue") || "[]",
    );

    if (queue.length === 0) {
      return;
    }

    console.log(`Syncing ${queue.length} offline attendance record(s)...`);

    for (const record of queue) {
      const { id, offline, ...attendance } = record;

      try {
        await api.addAttendance(attendance);

        // Remove only the successfully synced record
        queue = queue.filter((item) => item.id !== id);

        localStorage.setItem(
          "church_attendance_queue",
          JSON.stringify(queue),
        );

        console.log(`Synced offline attendance: ${id}`);
      } catch (error) {
        console.error(`Failed to sync attendance: ${id}`, error);
      }
    }

    if (queue.length === 0) {
      localStorage.removeItem("church_attendance_queue");
      console.log("Offline attendance synced successfully.");
    } else {
      console.log(
        `${queue.length} offline attendance record(s) still waiting to sync.`,
      );
    }

    await loadData();
  } catch (error) {
    console.error("Failed to sync offline attendance:", error);
  }
};


  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}, []);

  const loadData = async () => {
    try {
      // Load members from Laravel
      const savedMembers = await api.getMembers();

      const activeMembers = savedMembers
        .filter((member) => !member.archived)
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            sensitivity: "base",
          }),
        );

      const today = new Date();
      const sunday = today.getDay() === 0;

      setIsSunday(sunday);

      const sessionDate = getSessionDate();

      setMembers(activeMembers);

      if (!sessionDate) {
        setAttendance([]);
        setVisitors([]);
        return;
      }

      // Load attendance from Laravel
      const savedAttendance = await api.getAttendance();

      const todayAttendance = savedAttendance.filter(
        (record) => record.date === sessionDate,
      );

      setAttendance(todayAttendance);

      // Visitors now use Laravel API
      const savedVisitors = await api.getVisitors();

      const todayVisitors = savedVisitors.filter(
        (visitor) => visitor.date === sessionDate,
      );

      setVisitors(todayVisitors);
    } catch (error) {
      console.error("Failed to load attendance data:", error);
      alert("Failed to connect to the server.");
    }
  };

  const markAttendance = async (member) => {
    const sessionDate = getSessionDate();

    if (!sessionDate) {
      return;
    }

    const existingRecord = attendance.find(
      (record) => record.member_id === member.id,
    );

    // Already present
    if (existingRecord) {
      const confirmed = window.confirm(
        `Remove ${member.name} from today's attendance?`,
      );

      if (!confirmed) {
        return;
      }

      try {
        await api.deleteAttendance(existingRecord.id);

        setAttendance((current) =>
          current.filter((record) => record.id !== existingRecord.id),
        );
      } catch (error) {
        console.error("Failed to remove attendance:", error);
        alert("Failed to remove attendance.");
      }

      return;
    }

    // Mark present
    const now = new Date();

    const time =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");

    try {
      const savedRecord = await api.addAttendance({
        member_id: member.id,
        date: sessionDate,
        time,
        status: "Present",
      });

      setAttendance((current) => [...current, savedRecord]);
    } catch (error) {
      console.error("Failed to save attendance:", error);
      alert("Failed to save attendance.");
    }
  };

  const addVisitor = async (e) => {
    e.preventDefault();

    const sessionDate = getSessionDate();

    if (!sessionDate || !visitorName.trim()) {
      return;
    }

    const now = new Date();

    const time =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0") +
      ":" +
      String(now.getSeconds()).padStart(2, "0");

    try {
      const savedVisitor = await api.addVisitor({
        name: visitorName.trim(),
        purpose: visitorPurpose,
        invited_by: visitorInvitedBy.trim() || null,
        date: sessionDate,
        time,
        service: "Sunday Morning",
      });

      setVisitors((current) => [...current, savedVisitor]);

      // Reset form
      setVisitorName("");
      setVisitorPurpose("First Time Visitor");
      setVisitorInvitedBy("");
      setShowVisitorForm(false);
    } catch (error) {
      console.error("Failed to save visitor:", error);
      alert("Failed to save visitor.");
    }
  };

  const removeVisitor = async (visitor) => {
    const confirmed = window.confirm(
      `Remove ${visitor.name} from today's visitors?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.deleteVisitor(visitor.id);

      setVisitors((current) =>
        current.filter((item) => item.id !== visitor.id),
      );
    } catch (error) {
      console.error("Failed to remove visitor:", error);
      alert("Failed to remove visitor.");
    }
  };

  const getGroupCount = (group) => {
    return attendance.filter((record) => {
      const recordGroup = record.member?.group;

      return recordGroup === group;
    }).length;
  };

  const filteredMembers = members.filter(
    (member) =>
      member.group === selectedGroup &&
      member.name.toLowerCase().includes(search.toLowerCase()),
  );

  const isPresent = (memberId) => {
    return attendance.some((record) => record.member_id === memberId);
  };

  // Attendance is closed outside Sunday
  if (!isSunday && !TEST_MODE) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="mt-16 overflow-hidden rounded-3xl bg-white shadow-md">
            {/* Top Accent */}
            <div className="h-2 bg-blue-600" />

            <div className="p-8 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
                <img
                  src={churchLogo}
                  alt="COTF Church Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <h1 className="text-2xl font-bold text-slate-800">
                Sunday Morning Service
              </h1>

              <div className="mx-auto mt-5 h-1 w-12 rounded-full bg-yellow-400" />

              <p className="mt-5 font-medium text-slate-600">
                Attendance is currently closed.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Attendance can only be recorded during the Sunday morning
                service.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
                Church Attendance
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Sunday Morning Service
              </p>
            </div>
          </div>

          {TEST_MODE && (
            <div className="mt-4 inline-flex rounded-full bg-yellow-100 px-3 py-1.5">
              <span className="text-xs font-bold text-yellow-700">
                TEST MODE
              </span>
            </div>
          )}
        </div>

        {/* Total Attendance */}
        <div className="relative mb-4 overflow-hidden rounded-3xl bg-blue-600 p-6 text-center shadow-md">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-white/10" />

          <div className="relative">
            <p className="text-sm font-semibold text-blue-100">
              Today's Attendance
            </p>

            <p className="mt-1 text-6xl font-black text-white">
              {attendance.length}
            </p>

            <p className="mt-1 text-sm text-blue-100">Members Present</p>
          </div>
        </div>

        {/* Group Counts */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-3 text-center">
            <p className="text-2xl font-black text-green-700">
              {getGroupCount("Adults")}
            </p>

            <p className="mt-1 text-xs font-semibold text-green-700">Adults</p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-center">
            <p className="text-2xl font-black text-blue-700">
              {getGroupCount("Youth")}
            </p>

            <p className="mt-1 text-xs font-semibold text-blue-700">Youth</p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-3 text-center">
            <p className="text-2xl font-black text-yellow-700">
              {getGroupCount("Children")}
            </p>

            <p className="mt-1 text-xs font-semibold text-yellow-700">
              Children
            </p>
          </div>
        </div>

        {/* Group Selector */}
        <div className="mb-4">
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
            Select Group
          </p>

          <div className="grid grid-cols-3 gap-2">
            {["Adults", "Youth", "Children"].map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => {
                  setSelectedGroup(group);
                  setSearch("");
                }}
                className={`rounded-xl px-2 py-3 text-sm font-bold transition active:scale-95 ${
                  selectedGroup === group
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 shadow-sm ring-1 ring-slate-100 hover:bg-slate-50"
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              ⌕
            </span>

            <input
              type="text"
              placeholder={`Search ${selectedGroup.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Members */}
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-bold text-slate-800">{selectedGroup}</h2>

            <span className="text-xs font-medium text-slate-400">
              {filteredMembers.length} member
              {filteredMembers.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const present = isPresent(member.id);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => markAttendance(member)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition active:scale-[0.98] ${
                      present
                        ? "border-green-200 bg-green-50 shadow-sm"
                        : "border-slate-100 bg-white shadow-sm hover:border-blue-100 hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          present
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {member.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {member.group}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`ml-3 flex shrink-0 items-center gap-1.5 text-sm font-bold ${
                        present ? "text-green-600" : "text-slate-300"
                      }`}
                    >
                      {present ? (
                        <>
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                            ✓
                          </span>
                          <span className="hidden sm:inline">Present</span>
                        </>
                      ) : (
                        <span className="text-xl">○</span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-7 text-center">
                <div className="text-3xl text-slate-300">—</div>

                <p className="mt-2 font-semibold text-slate-600">
                  No members found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Try a different search or group.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Visitors Section */}
        <div className="mt-9">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Visitors</h2>

              <p className="mt-0.5 text-sm text-slate-500">
                {visitors.length} visitor
                {visitors.length !== 1 ? "s" : ""} today
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowVisitorForm(true)}
              className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 active:scale-95"
            >
              + Add Visitor
            </button>
          </div>

          {/* Visitor Form */}
          {showVisitorForm && (
            <form
              onSubmit={addVisitor}
              className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-md"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">Add Visitor</h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Record today's visitor
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVisitorForm(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                >
                  ×
                </button>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Name *
                </label>

                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Enter visitor's name"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Purpose */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Reason for Visit *
                </label>

                <select
                  value={visitorPurpose}
                  onChange={(e) => setVisitorPurpose(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Who Invited Them?
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <input
                  type="text"
                  value={visitorInvitedBy}
                  onChange={(e) => setVisitorInvitedBy(e.target.value)}
                  placeholder="Enter name if applicable"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowVisitorForm(false)}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                >
                  Add Visitor
                </button>
              </div>
            </form>
          )}

          {/* Visitor List */}
          <div className="space-y-2.5">
            {visitors.length > 0 ? (
              visitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
                        {visitor.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {visitor.name}
                        </p>

                        <p className="mt-1 text-sm font-medium text-green-700">
                          {visitor.purpose}
                        </p>

                        {visitor.invited_by && (
                          <p className="mt-1 text-xs text-slate-500">
                            Invited by: {visitor.invited_by}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeVisitor(visitor)}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-red-500 transition hover:bg-red-50 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
                <p className="text-sm font-medium text-slate-500">
                  No visitors recorded today.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Visitors you add will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
