import { useEffect, useState } from "react";
import { api } from "../api";
import churchLogo from "../assets/COTF-LOGO.png";

function History() {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [visitors, setVisitors] = useState([]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [records, setRecords] = useState([]);
  const [dateVisitors, setDateVisitors] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const [allAttendance, allVisitors, allMembers] = await Promise.all([
        api.getAttendance(),
        api.getVisitors(),
        api.getMembers(),
      ]);

      const normalizedAttendance = allAttendance.map((record) => ({
        ...record,
        memberName: record.member?.name || "Unknown Member",
        group: record.member?.group || "",
      }));

      const activeMembers = allMembers.filter((member) => !member.archived);

      setMembers(activeMembers);
      setAttendance(normalizedAttendance);
      setVisitors(allVisitors);

      const allDates = [
        ...normalizedAttendance.map((record) => record.date),
        ...allVisitors.map((visitor) => visitor.date),
      ];

      const uniqueMonths = [
        ...new Set(allDates.map((date) => String(date).substring(0, 7))),
      ];

      uniqueMonths.sort((a, b) => b.localeCompare(a));

      setMonths(uniqueMonths);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const getSundaysInMonth = (month) => {
    const [year, monthNumber] = month.split("-").map(Number);

    const sundays = [];

    const date = new Date(year, monthNumber - 1, 1);

    while (date.getMonth() === monthNumber - 1) {
      if (date.getDay() === 0) {
        const dateString = `${year}-${String(monthNumber).padStart(2, "0")}-${String(
          date.getDate(),
        ).padStart(2, "0")}`;

        sundays.push(dateString);
      }

      date.setDate(date.getDate() + 1);
    }

    // Only count Sundays that have already happened
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    return sundays.filter((date) => date <= todayString);
  };

  const viewMonth = (month) => {
    setSelectedMonth(month);
    setSelectedDate(null);
    setRecords([]);
    setDateVisitors([]);
  };

  const viewDate = (date) => {
    const savedRecords = attendance.filter(
      (record) => String(record.date).slice(0, 10) === date,
    );

    const savedVisitors = visitors.filter(
      (visitor) => String(visitor.date).slice(0, 10) === date,
    );

    setSelectedDate(date);
    setRecords(savedRecords);
    setDateVisitors(savedVisitors);
  };

  const getGroupCount = (group) => {
    return records.filter((record) => record.group === group).length;
  };

  const formatDate = (date) => {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatMonth = (month) => {
    const [year, monthNumber] = month.split("-").map(Number);

    return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getMonthAttendance = () => {
    if (!selectedMonth) {
      return [];
    }

    return attendance.filter((record) => record.date.startsWith(selectedMonth));
  };

  const getMonthVisitors = () => {
    if (!selectedMonth) {
      return [];
    }

    return visitors.filter((visitor) => visitor.date.startsWith(selectedMonth));
  };

  const getUniqueMembersAttended = () => {
    const monthAttendance = getMonthAttendance();

    return new Set(monthAttendance.map((record) => record.member_id)).size;
  };

  const getPerfectAttendance = () => {
    if (!selectedMonth) {
      return [];
    }

    const sundays = getSundaysInMonth(selectedMonth);

    if (sundays.length === 0) {
      return [];
    }

    return members.filter((member) => {
      const memberAttendanceDates = new Set(
        attendance
          .filter(
            (record) =>
              Number(record.member_id) === Number(member.id) &&
              String(record.date).slice(0, 10).startsWith(selectedMonth),
          )
          .map((record) => String(record.date).slice(0, 10)),
      );

      return sundays.every((sunday) => memberAttendanceDates.has(sunday));
    });
  };

  const getVisitorCountByPurpose = (purpose) => {
    return getMonthVisitors().filter((visitor) => visitor.purpose === purpose)
      .length;
  };

  const getMonthSundays = () => {
    if (!selectedMonth) {
      return [];
    }

    return getSundaysInMonth(selectedMonth);
  };

  return (
    <div className="min-h-screen px-4 py-5 pb-8">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-transparent p-1.5">
              <img
                src={churchLogo}
                alt="COTF Church Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white/90">
                Attendance History
              </h1>

              <p className="mt-0.5 text-sm text-white/55">
                Monthly Attendance Reports
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
                setSelectedDate(null);
                setRecords([]);
                setDateVisitors([]);
              }}
              className="mb-4 flex items-center gap-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-bold text-blue-300 shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition hover:bg-white/15 active:scale-[0.98]"
            >
              ← Back to Month
            </button>

            {/* Date Summary */}
            <div className="mb-5 overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.28)] backdrop-blur-xl">

              <div className="p-5">
                <p className="text-sm font-semibold text-white/55">
                  {formatDate(selectedDate)}
                </p>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-5xl font-black text-white">
                      {records.length}
                    </p>

                    <p className="mt-1 text-sm font-medium text-white/55">
                      Members Present
                    </p>
                  </div>

                  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-700/15 px-4 py-3 text-center">
                    <p className="text-2xl font-black text-yellow-300">
                      {dateVisitors.length}
                    </p>

                    <p className="text-xs font-semibold text-yellow-300">
                      Visitors
                    </p>
                  </div>
                </div>

                {/* Groups */}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-green-400/20 bg-green-500/15 p-3 text-center">
                    <p className="text-xl font-black text-green-300">
                      {getGroupCount("Adults")}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-green-300">
                      Adults
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-400/20 bg-blue-500/15 p-3 text-center">
                    <p className="text-xl font-black text-blue-300">
                      {getGroupCount("Youth")}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-blue-300">
                      Youth
                    </p>
                  </div>

                  <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/15 p-3 text-center">
                    <p className="text-xl font-black text-yellow-300">
                      {getGroupCount("Children")}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-yellow-300">
                      Children
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Present Members */}
            <div className="mb-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white/90">
                  Present Members
                </h2>

                <span className="rounded-full border border-green-400/20 bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300">
                  {records.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {records.length > 0 ? (
                  records.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-xl"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white-400/20 bg-white/20 font-bold text-black">
                          {record.memberName.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white/90">
                            {record.memberName}
                          </p>

                          <p className="mt-0.5 text-xs text-white/45">
                            {record.group}
                          </p>
                        </div>
                      </div>

                      <span className="ml-3 shrink-0 text-xs font-semibold text-white/45">
                        {record.time}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                    <p className="font-semibold text-white/70">
                      No members recorded
                    </p>

                    <p className="mt-1 text-xs text-white/45">
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
                  <h2 className="text-lg font-bold text-white/90">Visitors</h2>

                  <span className="rounded-full border border-green-400/20 bg-green-600/15 px-3 py-1 text-xs font-bold text-green-300">
                    {dateVisitors.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {dateVisitors.map((visitor) => (
                    <div
                      key={visitor.id}
                      className="rounded-2xl border border-green-400/20 bg-green-600/15 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-green-400/20 bg-green-600/15 font-bold text-green-300">
                          {visitor.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-white/90">
                            {visitor.name}
                          </p>

                          <p className="mt-1 text-sm font-medium text-white">
                            {visitor.purpose}
                          </p>

                          {visitor.invited_By && (
                            <p className="mt-1 text-xs text-white/55">
                              Invited by: {visitor.invited_By}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-white/55">
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
              <p className="text-xs font-bold uppercase tracking-wide text-white/45">
                Monthly Report
              </p>

              <h2 className="mt-1 text-2xl font-black text-white/90">
                {formatMonth(selectedMonth)}
              </h2>
            </div>

            {/* Monthly Summary */}
            <div className="mb-7 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/25 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                <p className="text-xs font-semibold text-white/45">
                  Registered Members
                </p>

                <p className="mt-2 text-3xl font-black text-white/90">
                  {members.length}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/15 p-4">
                <p className="text-xs font-semibold text-blue-400">
                  Members Attended
                </p>

                <p className="mt-2 text-3xl font-black text-blue-700">
                  {getUniqueMembersAttended()}
                </p>
              </div>

              <div className="rounded-2xl border border-green-400/20 bg-green-500/15 p-4">
                <p className="text-xs font-semibold text-green-400">
                  Total Attendances
                </p>

                <p className="mt-2 text-3xl font-black text-green-700">
                  {getMonthAttendance().length}
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/15 p-4">
                <p className="text-xs font-semibold text-yellow-400">
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
                <h2 className="text-lg font-bold text-white/90">
                  Sunday Attendance
                </h2>

                <p className="mt-1 text-sm text-white/55">
                  Select a Sunday to view detailed records.
                </p>
              </div>

              <div className="space-y-2.5">
                {getMonthSundays().map((sunday) => {
                  const sundayRecords = attendance.filter(
                    (record) => record.date === sunday,
                  );

                  const sundayVisitors = visitors.filter(
                    (visitor) => visitor.date === sunday,
                  );

                  return (
                    <button
                      key={sunday}
                      type="button"
                      onClick={() => viewDate(sunday)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:border-blue-400/20 hover:bg-white/10 active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white/90">
                            {formatDate(sunday)}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-blue-400/20 bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-300">
                              {sundayRecords.length} members
                            </span>

                            <span className="rounded-full border border-yellow-400/20 bg-yellow-500/15 px-2.5 py-1 text-xs font-semibold text-yellow-300">
                              {sundayVisitors.length} visitors
                            </span>
                          </div>
                        </div>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-lg font-bold text-white/45">
                          →
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Perfect Attendance */}
            <div className="mb-7">
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-500/15 text-lg">
                    🏆
                  </div>

                  <h2 className="text-lg font-bold text-white/90">
                    Perfect Attendance
                  </h2>
                </div>

                <p className="mt-2 text-sm leading-5 text-white/55">
                  Members who attended every Sunday this month.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                {getPerfectAttendance().length > 0 ? (
                  <div className="space-y-2.5">
                    {getPerfectAttendance().map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-xl border border-green-400/10 bg-green-700/30 p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 font-bold text-green-300">
                            {member.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white/90">
                              {member.name}
                            </p>

                            <p className="text-xs text-white/45">
                              {member.group}
                            </p>
                          </div>
                        </div>

                        <span className="ml-2 shrink-0 rounded-full border border-green-400/20 bg-white-700/30 px-2.5 py-1 text-xs font-bold text-green-300">
                          ✓ Perfect
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-center">
                    <p className="font-semibold text-white/70">
                      No perfect attendance yet.
                    </p>

                    <p className="mt-1 text-xs text-white/45">
                      Members must attend every completed Sunday.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Visitor Breakdown */}
            <div className="mb-7">
              <div className="mb-3">
                <h2 className="text-lg font-bold text-white/90">
                  Visitor Summary
                </h2>

                <p className="mt-1 text-sm text-white/55">
                  Breakdown of visitors by reason for visiting.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                <div className="divide-y divide-white/10">
                  <div className="flex items-center justify-between p-4">
                    <span className="text-sm text-white/70">
                      First Time Visitor
                    </span>

                    <span className="rounded-full border border-blue-400/20 bg-blue-500/15 px-3 py-1 text-sm font-bold text-blue-300">
                      {getVisitorCountByPurpose("First Time Visitor")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <span className="text-sm text-white/70">
                      Visiting from Another Church
                    </span>

                    <span className="rounded-full border border-blue-400/20 bg-blue-500/15 px-3 py-1 text-sm font-bold text-blue-300">
                      {getVisitorCountByPurpose("Visiting from Another Church")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <span className="text-sm text-white/70">
                      Returning Visitor
                    </span>

                    <span className="rounded-full border border-green-400/20 bg-green-500/15 px-3 py-1 text-sm font-bold text-green-300">
                      {getVisitorCountByPurpose("Returning Visitor")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <span className="text-sm text-white/70">
                      Invited Guest
                    </span>

                    <span className="rounded-full border border-yellow-400/20 bg-yellow-500/15 px-3 py-1 text-sm font-bold text-yellow-300">
                      {getVisitorCountByPurpose("Invited Guest")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4">
                    <span className="text-sm text-white/70">Other</span>

                    <span className="rounded-full border border-slate-400/20 bg-slate-500/15 px-3 py-1 text-sm font-bold text-slate-300">
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
              <h2 className="text-lg font-bold text-white/90">
                Attendance Reports
              </h2>

              <p className="mt-1 text-sm text-white/55">
                Select a month to view attendance records.
              </p>
            </div>

            {months.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/25 p-7 text-center shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-blue-300">
                  —
                </div>

                <p className="mt-3 font-semibold text-white/70">
                  No attendance history yet.
                </p>

                <p className="mt-1 text-xs text-white/45">
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
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:border-blue-400/20 hover:bg-white/10 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/15 text-blue-300">
                          <span className="text-lg font-bold">▣</span>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white/90">
                            {formatMonth(month)}
                          </p>

                          <p className="mt-1 text-xs text-white/55">
                            View monthly attendance
                          </p>
                        </div>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25 text-lg font-bold text-white/55">
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
  );
}

export default History;
