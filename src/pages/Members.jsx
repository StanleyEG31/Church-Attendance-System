import { useEffect, useState } from "react";
import { db } from "../db/db";
import churchLogo from "../assets/COTF-LOGO.png";

function Members() {
  const [members, setMembers] = useState([]);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("Adults");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingGroup, setEditingGroup] = useState("Adults");

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
  const savedMembers = await db.members.toArray();

  const activeMembers = savedMembers
    .filter((member) => !member.archived)
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      }),
    );

  setMembers(activeMembers);
};

  const addMember = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    await db.members.add({
      name: name.trim(),
      group,
      archived: false,
      createdAt: new Date().toISOString(),
    });

    setName("");
    setGroup("Adults");
    loadMembers();
  };

  const startEditing = (member) => {
    setEditingId(member.id);
    setEditingName(member.name);
    setEditingGroup(member.group);
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) {
      return;
    }

    await db.members.update(id, {
      name: editingName.trim(),
      group: editingGroup,
    });

    setEditingId(null);
    setEditingName("");
    setEditingGroup("Adults");

    loadMembers();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingGroup("Adults");
  };

  const deleteMember = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this member?",
    );

    if (!confirmed) {
      return;
    }

    await db.members.delete(id);
    loadMembers();
  };

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(search.toLowerCase()),
  );

  const adultCount = members.filter(
    (member) => member.group === "Adults",
  ).length;

  const youthCount = members.filter(
    (member) => member.group === "Youth",
  ).length;

  const childrenCount = members.filter(
    (member) => member.group === "Children",
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-28 pt-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
              <img
                src={churchLogo}
                alt="COTF Church Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
                MEMBERS
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-500">Manage your church members</p>
        </div>

        {/* Member Overview */}
        <div className="mb-5 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Member Overview
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                {members.length} registered{" "}
                {members.length === 1 ? "member" : "members"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-lg">
              👥
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-100">
            {/* Adults */}
            <div className="px-3 py-4 text-center">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-sm">
                👨
              </div>

              <p className="text-2xl font-extrabold text-blue-600">
                {adultCount}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Adults
              </p>
            </div>

            {/* Youth */}
            <div className="px-3 py-4 text-center">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-sm">
                🧑
              </div>

              <p className="text-2xl font-extrabold text-green-600">
                {youthCount}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-500">Youth</p>
            </div>

            {/* Children */}
            <div className="px-3 py-4 text-center">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-100 text-sm">
                🧒
              </div>

              <p className="text-2xl font-extrabold text-yellow-600">
                {childrenCount}
              </p>

              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Children
              </p>
            </div>
          </div>
        </div>

        {/* Add Member */}
        <form
          onSubmit={addMember}
          className="mb-5 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100"
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-lg">
                +
              </div>

              <div>
                <h2 className="font-bold text-slate-800">Add Member</h2>

                <p className="text-xs text-slate-400">
                  Register a new church member
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Member Name
            </label>

            <input
              type="text"
              placeholder="Enter member name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Group
            </label>

            <select
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="Adults">Adults</option>
              <option value="Youth">Youth</option>
              <option value="Children">Children</option>
            </select>

            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              + Add Member
            </button>
          </div>
        </form>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              🔍
            </span>

            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Search Result Information */}
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-sm font-bold text-slate-700">Member List</p>

          <p className="text-xs font-medium text-slate-400">
            {search.trim()
              ? `${filteredMembers.length} found`
              : `${members.length} total`}
          </p>
        </div>

        {/* Member List */}
        <div className="space-y-3">
          {filteredMembers.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                {members.length === 0 ? "👥" : "🔍"}
              </div>

              <p className="font-semibold text-slate-700">
                {members.length === 0 ? "No members yet" : "No members found"}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {members.length === 0
                  ? "Add your first church member above."
                  : "Try searching with a different name."}
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const isEditing = editingId === member.id;

              return (
                <div
                  key={member.id}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100"
                >
                  {isEditing ? (
                    <div className="p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                          ✏️
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            Edit Member
                          </p>

                          <p className="text-xs text-slate-400">
                            Update member information
                          </p>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="mb-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />

                      <select
                        value={editingGroup}
                        onChange={(e) => setEditingGroup(e.target.value)}
                        className="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="Adults">Adults</option>
                        <option value="Youth">Youth</option>
                        <option value="Children">Children</option>
                      </select>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(member.id)}
                          className="rounded-2xl bg-green-600 py-3.5 font-bold text-white transition hover:bg-green-700 active:scale-[0.98]"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-2xl bg-slate-100 py-3.5 font-bold text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                        👤
                      </div>

                      {/* Information */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-800">
                          {member.name}
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              member.group === "Adults"
                                ? "bg-blue-100 text-blue-700"
                                : member.group === "Youth"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {member.group}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEditing(member)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm text-blue-600 transition hover:bg-blue-100 active:scale-95"
                          aria-label={`Edit ${member.name}`}
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMember(member.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-sm text-red-500 transition hover:bg-red-100 active:scale-95"
                          aria-label={`Delete ${member.name}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Members;
