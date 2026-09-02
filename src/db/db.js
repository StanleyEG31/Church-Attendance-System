import Dexie from "dexie"

export const db = new Dexie("ChurchAttendanceDB")

db.version(1).stores({
  members: "++id, name, group",
  attendance: "++id, memberId, date",
})

db.version(2).stores({
  members: "++id, name, group",
  attendance: "++id, memberId, date",
  visitors: "++id, name, date, purpose",
})