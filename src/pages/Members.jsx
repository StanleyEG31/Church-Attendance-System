import { useEffect, useState } from "react"
import { db } from "../db/db"

function Members() {
  const [members, setMembers] = useState([])
  const [name, setName] = useState("")
  const [group, setGroup] = useState("Adults")

  // Editing states
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState("")
  const [editingGroup, setEditingGroup] = useState("Adults")

  useEffect(() => {
    loadMembers()
  }, [])

  const loadMembers = async () => {
    const savedMembers = await db.members.toArray()
    setMembers(savedMembers)
  }

  // Add member
  const addMember = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    await db.members.add({
      name: name.trim(),
      group,
    })

    setName("")
    setGroup("Adults")

    loadMembers()
  }

  // Start editing
  const startEditing = (member) => {
    setEditingId(member.id)
    setEditingName(member.name)
    setEditingGroup(member.group)
  }

  // Save edited member
  const saveEdit = async (id) => {
    if (!editingName.trim()) {
      return
    }

    await db.members.update(id, {
      name: editingName.trim(),
      group: editingGroup,
    })

    setEditingId(null)
    setEditingName("")
    setEditingGroup("Adults")

    loadMembers()
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null)
    setEditingName("")
    setEditingGroup("Adults")
  }

  // Delete member
  const deleteMember = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this member?"
    )

    if (!confirmed) {
      return
    }

    await db.members.delete(id)
    loadMembers()
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="mx-auto max-w-md">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            👥 Members
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage church members
          </p>
        </div>

        {/* Add Member */}
        <form
          onSubmit={addMember}
          className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
        >
          <h2 className="mb-4 font-semibold text-gray-800">
            Add Member
          </h2>

          <input
            type="text"
            placeholder="Member name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
          />

          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
          >
            <option value="Adults">Adults</option>
            <option value="Youth">Youth</option>
            <option value="Children">Children</option>
          </select>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white active:scale-[0.98]"
          >
            + Add Member
          </button>
        </form>

        {/* Member List */}
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center text-gray-500">
              No members yet.
            </div>
          ) : (
            members.map((member) => {
              const isEditing = editingId === member.id

              return (
                <div
                  key={member.id}
                  className="rounded-2xl bg-white p-4 shadow-sm"
                >
                  {isEditing ? (
                    <>
                      {/* Edit Name */}
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
                      />

                      {/* Edit Group */}
                      <select
                        value={editingGroup}
                        onChange={(e) => setEditingGroup(e.target.value)}
                        className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                      >
                        <option value="Adults">Adults</option>
                        <option value="Youth">Youth</option>
                        <option value="Children">Children</option>
                      </select>

                      {/* Edit Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(member.id)}
                          className="flex-1 rounded-xl bg-green-600 py-3 font-semibold text-white"
                        >
                          Save
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="flex-1 rounded-xl bg-gray-200 py-3 font-semibold text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3">

                      {/* Member Information */}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-800">
                          {member.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {member.group}
                        </p>
                      </div>

                      {/* Buttons */}
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => startEditing(member)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteMember(member.id)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-500"
                        >
                          Delete
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

      </div>
    </div>
  )
}

export default Members