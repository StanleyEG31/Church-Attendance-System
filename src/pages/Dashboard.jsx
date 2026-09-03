import { useEffect, useState } from "react";
import { api } from "../api";
import churchLogo from "../assets/COTF-LOGO.png";

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getSundaysInMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);

  const sundays = [];
  const date = new Date(year, month - 1, 1);

  while (date.getMonth() === month - 1) {
    if (date.getDay() === 0) {
      const day = String(date.getDate()).padStart(2, "0");
      sundays.push(`${monthKey}-${day}`);
    }

    date.setDate(date.getDate() + 1);
  }

  return sundays;
}

function formatSunday(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isFutureDate(dateString) {
  const today = new Date();

  const todayString =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  return dateString > todayString;
}

function getMonthName(monthKey) {
  const date = new Date(`${monthKey}-01T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function Dashboard() {
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth]);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const savedMembers = await api.getMembers();
      const savedAttendance = await api.getAttendance();

      await archiveInactiveMembers(savedMembers, savedAttendance);

      const updatedMembers = await api.getMembers();

      const activeMembers = updatedMembers
        .filter((member) => !member.archived)
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            sensitivity: "base",
          }),
        );

      const monthAttendance = savedAttendance.filter(
        (record) =>
          record.date >= `${selectedMonth}-01` &&
          record.date <= `${selectedMonth}-31`,
      );

      setMembers(activeMembers);
      setAttendance(monthAttendance);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const archiveInactiveMembers = async (allMembers, allAttendance) => {
    const today = new Date();

    for (const member of allMembers) {
      if (member.archived) {
        continue;
      }

      const memberAttendance = allAttendance
        .filter((record) => record.member_id === member.id)
        .sort((a, b) => b.date.localeCompare(a.date));

      const lastAttendance = memberAttendance[0]?.date;

      const referenceDate = lastAttendance
        ? new Date(`${lastAttendance}T00:00:00`)
        : member.created_at
          ? new Date(member.created_at)
          : null;

      if (!referenceDate) {
        continue;
      }

      const expirationDate = new Date(referenceDate);
      expirationDate.setMonth(expirationDate.getMonth() + 6);

      if (today >= expirationDate) {
        await api.archiveMember(member.id);
      }
    }
  };

  const sundays = getSundaysInMonth(selectedMonth);

  const isPresent = (memberId, date) => {
  return attendance.some(
    (record) =>
      Number(record.member_id) === Number(memberId) &&
      String(record.date).slice(0, 10) === date,
  );
};

  const toggleAttendance = async (member, date) => {
  if (isFutureDate(date)) {
    return;
  }

  const existingRecord = attendance.find(
    (record) =>
      record.member_id === member.id &&
      record.date === date,
  );

  try {
    // Present → remove attendance
    if (existingRecord) {
      await api.deleteAttendance(existingRecord.id);
    } else {
      // Absent → mark present
      const now = new Date();

      const time =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0") +
        ":" +
        String(now.getSeconds()).padStart(2, "0");

      await api.addAttendance({
        member_id: member.id,
        date,
        time,
        status: "Present",
      });
    }

    // Reload attendance directly from MySQL
    const updatedAttendance = await api.getAttendance();

    const monthAttendance = updatedAttendance.filter(
      (record) =>
        record.date >= `${selectedMonth}-01` &&
        record.date <= `${selectedMonth}-31`,
    );

    setAttendance(monthAttendance);
  } catch (error) {
    console.error("Failed to update attendance:", error);
    alert("Failed to update attendance.");
  }
};

  const getMemberAttendanceCount = (memberId) => {
    return sundays.filter(
      (sunday) => !isFutureDate(sunday) && isPresent(memberId, sunday),
    ).length;
  };

  const completedSundays = sundays.filter((sunday) => !isFutureDate(sunday));

  const totalPresent = attendance.filter((record) =>
    completedSundays.includes(record.date),
  ).length;

  const attendancePercentage =
    members.length > 0 && completedSundays.length > 0
      ? Math.round(
          (totalPresent / (members.length * completedSundays.length)) * 100,
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-28 pt-5">
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
                COTF Attendance
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Attendance Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="mb-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            Attendance Month
          </p>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        {/* Summary */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-blue-600 p-4 shadow-sm">
            <p className="text-xs font-semibold text-blue-100">
              Active Members
            </p>

            <p className="mt-1 text-3xl font-black text-white">
              {members.length}
            </p>
          </div>

          <div className="rounded-2xl bg-green-600 p-4 shadow-sm">
            <p className="text-xs font-semibold text-green-100">
              Attendance Rate
            </p>

            <p className="mt-1 text-3xl font-black text-white">
              {attendancePercentage}%
            </p>
          </div>
        </div>

        {/* Month Title */}
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <h2 className="font-bold text-slate-800">
              {getMonthName(selectedMonth)}
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {members.length} active member
              {members.length !== 1 ? "s" : ""}
            </p>
          </div>

          <span className="rounded-full bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-700">
            Sunday Morning
          </span>
        </div>

        {/* Attendance Table */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-slate-400">
                Loading attendance...
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
                👥
              </div>

              <p className="font-semibold text-slate-700">No active members</p>

              <p className="mt-1 text-sm text-slate-400">
                Add members from the Members section.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="sticky left-0 z-10 min-w-[150px] bg-slate-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                      Member
                    </th>

                    {sundays.map((sunday) => (
                      <th
                        key={sunday}
                        className="min-w-[72px] px-2 py-4 text-center text-xs font-bold text-slate-500"
                      >
                        {formatSunday(sunday)}
                      </th>
                    ))}

                    <th className="min-w-[70px] px-2 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {members.map((member, index) => {
                    const memberCount = getMemberAttendanceCount(member.id);

                    return (
                      <tr
                        key={member.id}
                        className={`border-b border-slate-100 last:border-0 ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }`}
                      >
                        {/* Member */}
                        <td className="sticky left-0 z-10 bg-inherit px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600">
                              {member.name.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[115px] truncate text-xs font-bold text-slate-800">
                                {member.name}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                {member.group}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Sundays */}
                        {sundays.map((sunday) => {
                          const future = isFutureDate(sunday);

                          const present = isPresent(member.id, sunday);

                          return (
                            <td key={sunday} className="px-2 py-3 text-center">
                              {future ? (
                                <span className="text-slate-300">—</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleAttendance(member, sunday)
                                  }
                                  className="mx-auto flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90"
                                  title={`Edit ${member.name}'s attendance for ${formatSunday(sunday)}`}
                                >
                                  {present ? (
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white hover:bg-green-600">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-400 hover:bg-red-100">
                                      ×
                                    </span>
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}

                        {/* Total */}
                        <td className="px-2 py-3 text-center">
                          <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-700">
                            {memberCount}/{completedSundays.length}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500">
          <p className="mt-2 text-center text-xs text-slate-400">
            Tap ✓ or × to edit attendance
          </p>
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
              ✓
            </span>
            Present
          </div>

          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-[10px] text-red-400">
              ×
            </span>
            Absent
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-300">—</span>
            Upcoming
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
