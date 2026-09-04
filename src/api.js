const API_BASE_URL = "https://church-attendance-api-gghm.onrender.com/api";

const MEMBERS_CACHE = "church_members_cache";
const MEMBERS_QUEUE = "church_members_queue";
const MEMBERS_UPDATE_QUEUE = "church_members_update_queue";
const MEMBERS_DELETE_QUEUE = "church_members_delete_queue";
const ATTENDANCE_CACHE = "church_attendance_cache";
const ATTENDANCE_QUEUE = "church_attendance_queue";
const ATTENDANCE_DELETE_QUEUE = "church_attendance_delete_queue";
const VISITORS_CACHE = "church_visitors_cache";
const VISITORS_QUEUE = "church_visitors_queue";
const VISITORS_DELETE_QUEUE = "church_visitors_delete_queue";

let membersSyncing = false;

// --------------------------------------------------
// Offline helpers
// --------------------------------------------------

const isOffline = () => !navigator.onLine;

const getCachedMembers = () => {
  try {
    return JSON.parse(localStorage.getItem(MEMBERS_CACHE) || "[]");
  } catch {
    return [];
  }
};

const cacheMembers = (members) => {
  localStorage.setItem(MEMBERS_CACHE, JSON.stringify(members));
};

const getMembersQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(MEMBERS_QUEUE) || "[]");
  } catch {
    return [];
  }
};

const saveMembersQueue = (queue) => {
  localStorage.setItem(MEMBERS_QUEUE, JSON.stringify(queue));
};

const getMembersUpdateQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(MEMBERS_UPDATE_QUEUE) || "[]");
  } catch {
    return [];
  }
};

const saveMembersUpdateQueue = (queue) => {
  localStorage.setItem(MEMBERS_UPDATE_QUEUE, JSON.stringify(queue));
};

const getCachedAttendance = () => {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_CACHE) || "[]");
  } catch {
    return [];
  }
};

const cacheAttendance = (attendance) => {
  localStorage.setItem(ATTENDANCE_CACHE, JSON.stringify(attendance));
};

const getAttendanceQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_QUEUE) || "[]");
  } catch {
    return [];
  }
};

const saveAttendanceQueue = (queue) => {
  localStorage.setItem(ATTENDANCE_QUEUE, JSON.stringify(queue));
};
const getAttendanceDeleteQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_DELETE_QUEUE) || "[]");
  } catch {
    return [];
  }
};

const saveAttendanceDeleteQueue = (queue) => {
  localStorage.setItem(ATTENDANCE_DELETE_QUEUE, JSON.stringify(queue));
};

// --------------------------------------------------
// API
// --------------------------------------------------

export const api = {
  // MEMBERS
  getMembers: async () => {
    if (isOffline()) {
      return getCachedMembers();
    }

    try {
      const response = await fetch(`${API_BASE_URL}/members`);

      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }

      const members = await response.json();

      cacheMembers(members);

      return members;
    } catch (error) {
      const cachedMembers = getCachedMembers();

      if (cachedMembers.length > 0) {
        console.warn("Using cached members because server is unavailable.");
        return cachedMembers;
      }

      throw error;
    }
  },

  addMember: async (member) => {
    // Offline: save member locally and queue it for syncing
    if (isOffline()) {
      const cachedMembers = getCachedMembers();
      const queue = getMembersQueue();

      //Check if this member already exists locally or in the queue
      const existingMember =
        cachedMembers.find(
          (item) =>
            item.name.trim().toLowerCase() ===
              member.name.trim().toLowerCase() && item.group === member.group,
        ) ||
        queue.find(
          (item) =>
            item.name.trim().toLowerCase() ===
              member.name.trim().toLowerCase() && item.group === member.group,
        );

      if (existingMember) {
        console.log(`Member already exists: ${member.name}`);

        return existingMember;
      }

      const offlineMember = {
        ...member,
        id: `offline-member-${Date.now()}`,
        offline: true,
      };

      // Save to local cache
      cacheMembers([...cachedMembers, offlineMember]);

      // Add to sync queue
      queue.push(offlineMember);
      saveMembersQueue(queue);

      return offlineMember;
    }

    // Online: send directly to the server
    const response = await fetch(`${API_BASE_URL}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(member),
    });

    if (!response.ok) {
      throw new Error("Failed to add member");
    }

    const savedMember = await response.json();

    // Update local cache
    const cachedMembers = getCachedMembers();

    cacheMembers([
      ...cachedMembers.filter((item) => item.id !== savedMember.id),
      savedMember,
    ]);

    return savedMember;
  },

  updateMember: async (id, member) => {
    // Offline: save the update locally and queue it for syncing
    if (isOffline()) {
      const cachedMembers = getCachedMembers();
      const updateQueue = getMembersUpdateQueue();

      const updatedMember = {
        ...member,
        id,
        offline: true,
      };

      // Update the local member cache immediately
      const updatedCache = cachedMembers.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updatedMember,
            }
          : item,
      );

      cacheMembers(updatedCache);

      // Remove any previous queued update for this member
      const filteredQueue = updateQueue.filter((item) => item.id !== id);

      // Add the newest update
      filteredQueue.push(updatedMember);

      saveMembersUpdateQueue(filteredQueue);

      return updatedMember;
    }

    // Online: update directly on the server
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(member),
    });

    if (!response.ok) {
      throw new Error("Failed to update member");
    }

    const updatedMember = await response.json();

    // Update local cache
    const cachedMembers = getCachedMembers();

    cacheMembers(
      cachedMembers.map((item) =>
        item.id === updatedMember.id ? updatedMember : item,
      ),
    );

    return updatedMember;
  },

  deleteMember: async (id) => {
    // Offline: remove locally and queue deletion
    if (isOffline()) {
      const cachedMembers = getCachedMembers();

      // Remove from local cache immediately
      const updatedMembers = cachedMembers.filter((member) => member.id !== id);

      cacheMembers(updatedMembers);

      // Queue the deletion
      const deleteQueue = JSON.parse(
        localStorage.getItem("church_members_delete_queue") || "[]",
      );

      if (!deleteQueue.includes(id)) {
        deleteQueue.push(id);
      }

      localStorage.setItem(
        "church_members_delete_queue",
        JSON.stringify(deleteQueue),
      );

      return {
        id,
        offline: true,
      };
    }

    // Online: delete directly from server
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete member");
    }

    const result = await response.json();

    // Remove from local cache
    const cachedMembers = getCachedMembers();

    cacheMembers(cachedMembers.filter((member) => member.id !== id));

    return result;
  },

  syncOfflineMembers: async () => {
    if (membersSyncing) {
      console.log("Member sync already running. Skipping duplicate sync.");
      return;
    }

    if (isOffline()) {
      return;
    }

    membersSyncing = true;

    try {
      const queue = getMembersQueue();

      if (queue.length === 0) {
        return;
      }

      console.log(`Syncing ${queue.length} offline member(s)...`);

      const remainingQueue = [];

      for (const member of queue) {
        try {
          const response = await fetch(`${API_BASE_URL}/members`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: member.name,
              group: member.group,
              archived: member.archived ?? false,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to sync member");
          }

          console.log(`Synced offline member: ${member.name}`);
        } catch (error) {
          console.error(`Failed to sync offline member: ${member.name}`, error);

          remainingQueue.push(member);
        }
      }

      saveMembersQueue(remainingQueue);

      // Refresh cache from server
      try {
        const response = await fetch(`${API_BASE_URL}/members`);

        if (!response.ok) {
          throw new Error("Failed to refresh members after sync");
        }

        const serverMembers = await response.json();

        cacheMembers(serverMembers);

        console.log("Members cache refreshed after offline sync.");
      } catch (error) {
        console.error("Failed to refresh members cache after sync:", error);
      }
    } finally {
      membersSyncing = false;
    }
  },

  archiveMember: async (id) => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        archived: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to archive member");
    }

    return response.json();
  },

  // ATTENDANCE
  getAttendance: async () => {
    if (isOffline()) {
      const cachedAttendance = getCachedAttendance();
      const offlineQueue = getAttendanceQueue();
      const deleteQueue = getAttendanceDeleteQueue();

      const filteredCache = cachedAttendance.filter(
        (record) => !deleteQueue.includes(record.id),
      );

      return [...filteredCache, ...offlineQueue];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/attendance`);

      if (!response.ok) {
        throw new Error("Failed to fetch attendance");
      }

      const attendance = await response.json();

      cacheAttendance(attendance);

      return attendance;
    } catch (error) {
      const cachedAttendance = getCachedAttendance();

      if (cachedAttendance.length > 0) {
        console.warn("Using cached attendance because server is unavailable.");

        return cachedAttendance;
      }

      return [];
    }
  },

  addAttendance: async (attendance) => {
    // Offline: save locally
    if (isOffline()) {
      const offlineRecord = {
        ...attendance,
        id: `offline-${Date.now()}`,
        offline: true,
      };

      const queue = getAttendanceQueue();

      queue.push(offlineRecord);

      saveAttendanceQueue(queue);

      return offlineRecord;
    }

    // Online: send directly to the server
    const response = await fetch(`${API_BASE_URL}/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attendance),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Attendance API error:", response.status, errorText);

      throw new Error(`Failed to save attendance (${response.status})`);
    }

    const savedAttendance = await response.json();

    const cachedAttendance = getCachedAttendance();

    const updatedAttendance = [
      ...cachedAttendance.filter(
        (record) =>
          !(
            record.member_id === savedAttendance.member_id &&
            record.date === savedAttendance.date
          ),
      ),
      savedAttendance,
    ];

    cacheAttendance(updatedAttendance);

    return savedAttendance;
  },

  deleteAttendance: async (id) => {
    // Offline: queue the deletion
    if (isOffline()) {
      const deleteQueue = getAttendanceDeleteQueue();

      if (!deleteQueue.includes(id)) {
        deleteQueue.push(id);
      }

      saveAttendanceDeleteQueue(deleteQueue);

      //Remove Immediately from local cache
      const cachedAttendance = getCachedAttendance();

      const updatedAttendance = cachedAttendance.filter(
        (record) => record.id !== id,
      );

      cacheAttendance(updatedAttendance);

      return {
        id,
        offline: true,
      };
    }

    // Online: delete directly from the server
    const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete attendance");
    }

    const result = await response.json();

    const cachedAttendance = getCachedAttendance();

    const updatedAttendance = cachedAttendance.filter(
      (record) => record.id !== id,
    );

    cacheAttendance(updatedAttendance);

    return result;
  },

  // VISITORS
  getVisitors: async () => {
    if (isOffline()) {
      return JSON.parse(localStorage.getItem("church_visitors_cache") || "[]");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/visitors`);

      if (!response.ok) {
        throw new Error("Failed to fetch visitors");
      }

      const visitors = await response.json();

      localStorage.setItem("church_visitors_cache", JSON.stringify(visitors));

      return visitors;
    } catch (error) {
      const cachedVisitors = JSON.parse(
        localStorage.getItem("church_visitors_cache") || "[]",
      );

      if (cachedVisitors.length > 0) {
        console.warn("Using cached visitors because server is unavailable.");

        return cachedVisitors;
      }

      throw error;
    }
  },

  addVisitor: async (visitor) => {
    // Offline: save locally and queue for syncing
    if (isOffline()) {
      const offlineVisitor = {
        ...visitor,
        id: `offline-visitor-${Date.now()}`,
        offline: true,
      };

      const queue = JSON.parse(
        localStorage.getItem("church_visitors_queue") || "[]",
      );

      queue.push(offlineVisitor);

      localStorage.setItem("church_visitors_queue", JSON.stringify(queue));

      const cachedVisitors = JSON.parse(
        localStorage.getItem("church_visitors_cache") || "[]",
      );

      cachedVisitors.push(offlineVisitor);

      localStorage.setItem(
        "church_visitors_cache",
        JSON.stringify(cachedVisitors),
      );

      return offlineVisitor;
    }

    // Online: send directly to the server
    const response = await fetch(`${API_BASE_URL}/visitors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(visitor),
    });

    if (!response.ok) {
      throw new Error("Failed to save visitor");
    }

    const savedVisitor = await response.json();

    const cachedVisitors = JSON.parse(
      localStorage.getItem("church_visitors_cache") || "[]",
    );

    localStorage.setItem(
      "church_visitors_cache",
      JSON.stringify([
        ...cachedVisitors.filter((item) => item.id !== savedVisitor.id),
        savedVisitor,
      ]),
    );

    return savedVisitor;
  },

  syncOfflineVisitors: async () => {
    if (isOffline()) {
      return;
    }

    const queue = JSON.parse(localStorage.getItem(VISITORS_QUEUE) || "[]");

    if (queue.length === 0) {
      return;
    }

    console.log(`Syncing ${queue.length} offline visitor(s)...`);

    const remainingQueue = [];

    for (const visitor of queue) {
      try {
        const { id, offline, ...visitorData } = visitor;

        const response = await fetch(`${API_BASE_URL}/visitors`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(visitorData),
        });

        if (!response.ok) {
          throw new Error("Failed to sync visitor");
        }

        console.log(`Synced offline visitor: ${visitor.name}`);
      } catch (error) {
        console.error(`Failed to sync offline visitor: ${visitor.name}`, error);

        remainingQueue.push(visitor);
      }
    }

    localStorage.setItem(VISITORS_QUEUE, JSON.stringify(remainingQueue));

    // Refresh visitor cache from server
    try {
      const response = await fetch(`${API_BASE_URL}/visitors`);

      if (!response.ok) {
        throw new Error("Failed to refresh visitors after sync");
      }

      const visitors = await response.json();

      localStorage.setItem(VISITORS_CACHE, JSON.stringify(visitors));

      console.log("Visitors cache refreshed after offline sync.");
    } catch (error) {
      console.error("Failed to refresh visitors cache after sync:", error);
    }
  },

  deleteVisitor: async (id) => {
    // Offline: remove locally and queue deletion
    if (isOffline()) {
      const cachedVisitors = JSON.parse(
        localStorage.getItem(VISITORS_CACHE) || "[]",
      );

      // Remove from local cache immediately
      const updatedVisitors = cachedVisitors.filter(
        (visitor) => visitor.id !== id,
      );

      localStorage.setItem(VISITORS_CACHE, JSON.stringify(updatedVisitors));

      // Queue the deletion
      const deleteQueue = JSON.parse(
        localStorage.getItem(VISITORS_DELETE_QUEUE) || "[]",
      );

      if (!deleteQueue.includes(id)) {
        deleteQueue.push(id);
      }

      localStorage.setItem(VISITORS_DELETE_QUEUE, JSON.stringify(deleteQueue));

      return {
        id,
        offline: true,
      };
    }

    // Online: delete directly from server
    const response = await fetch(`${API_BASE_URL}/visitors/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete visitor");
    }

    const result = await response.json();

    // Remove from local cache
    const cachedVisitors = JSON.parse(
      localStorage.getItem(VISITORS_CACHE) || "[]",
    );

    localStorage.setItem(
      VISITORS_CACHE,
      JSON.stringify(cachedVisitors.filter((visitor) => visitor.id !== id)),
    );

    return result;
  },

  syncOfflineData: async () => {
    if (isOffline()) {
      return;
    }

    console.log("Starting global offline sync...");

    // 1. Sync offline members
    await api.syncOfflineMembers();

    // 2. Sync offline member updates
    let memberUpdateQueue = getMembersUpdateQueue();

    if (memberUpdateQueue.length > 0) {
      console.log(
        `Syncing ${memberUpdateQueue.length} offline member update(s)...`,
      );

      const remainingMemberUpdates = [];

      for (const member of memberUpdateQueue) {
        try {
          const { id, offline, ...memberData } = member;

          const response = await fetch(`${API_BASE_URL}/members/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(memberData),
          });

          if (!response.ok) {
            throw new Error("Failed to sync member update");
          }

          console.log(`Synced member update: ${member.name}`);
        } catch (error) {
          console.error(`Failed to sync member update: ${member.name}`, error);

          remainingMemberUpdates.push(member);
        }
      }

      saveMembersUpdateQueue(remainingMemberUpdates);

      // Refresh members cache after updates
      try {
        const response = await fetch(`${API_BASE_URL}/members`);

        if (!response.ok) {
          throw new Error("Failed to refresh members after updates");
        }

        const serverMembers = await response.json();

        cacheMembers(serverMembers);

        console.log("Members cache refreshed after offline updates.");
      } catch (error) {
        console.error("Failed to refresh members cache after updates:", error);
      }
    }

    // 3. Sync offline member deletions
    let memberDeleteQueue = JSON.parse(
      localStorage.getItem(MEMBERS_DELETE_QUEUE) || "[]",
    );

    if (memberDeleteQueue.length > 0) {
      console.log(
        `Syncing ${memberDeleteQueue.length} offline member deletion(s)...`,
      );

      const remainingMemberDeletes = [];

      for (const id of memberDeleteQueue) {
        try {
          const response = await fetch(`${API_BASE_URL}/members/${id}`, {
            method: "DELETE",
          });

          // 404 means the member is already deleted on the server.
          if (!response.ok && response.status !== 404) {
            throw new Error("Failed to sync member deletion");
          }

          console.log(`Synced member deletion: ${id}`);
        } catch (error) {
          console.error(`Failed to sync member deletion: ${id}`, error);

          remainingMemberDeletes.push(id);
        }
      }

      localStorage.setItem(
        MEMBERS_DELETE_QUEUE,
        JSON.stringify(remainingMemberDeletes),
      );

      // Refresh members cache after deletions
      try {
        const response = await fetch(`${API_BASE_URL}/members`);

        if (!response.ok) {
          throw new Error("Failed to refresh members after deletions");
        }

        const serverMembers = await response.json();

        cacheMembers(serverMembers);

        console.log("Members cache refreshed after offline deletions.");
      } catch (error) {
        console.error(
          "Failed to refresh members cache after deletions:",
          error,
        );
      }
    }
    // 4. Sync offline attendance records
    let attendanceQueue = getAttendanceQueue();

    if (attendanceQueue.length > 0) {
      console.log(
        `Syncing ${attendanceQueue.length} offline attendance record(s)...`,
      );

      const remainingAttendanceQueue = [];

      for (const record of attendanceQueue) {
        try {
          const { id, offline, ...attendance } = record;

          const response = await fetch(`${API_BASE_URL}/attendance`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(attendance),
          });

          if (!response.ok) {
            const errorText = await response.text();

            console.error(
              "Attendance sync API error:",
              response.status,
              errorText,
            );

            throw new Error("Failed to sync attendance");
          }

          const savedAttendance = await response.json();

          // Update local attendance cache
          const cachedAttendance = getCachedAttendance();

          const updatedAttendance = [
            ...cachedAttendance.filter(
              (item) =>
                !(
                  item.member_id === savedAttendance.member_id &&
                  item.date === savedAttendance.date
                ),
            ),
            savedAttendance,
          ];

          cacheAttendance(updatedAttendance);

          console.log(`Synced offline attendance: ${id}`);
        } catch (error) {
          console.error(`Failed to sync attendance: ${record.id}`, error);

          remainingAttendanceQueue.push(record);
        }
      }

      saveAttendanceQueue(remainingAttendanceQueue);
    }
    // 5. Sync attendance deletions
    let deleteQueue = getAttendanceDeleteQueue();

    if (deleteQueue.length > 0) {
      console.log(
        `Syncing ${deleteQueue.length} offline attendance deletion(s)...`,
      );

      const remainingDeleteQueue = [];

      for (const id of deleteQueue) {
        try {
          await api.deleteAttendance(id);

          console.log(`Synced attendance deletion: ${id}`);
        } catch (error) {
          console.error(`Failed to sync attendance deletion: ${id}`, error);

          remainingDeleteQueue.push(id);
        }
      }

      saveAttendanceDeleteQueue(remainingDeleteQueue);
    }

    // 6. Sync offline visitor deletions
    let visitorDeleteQueue = JSON.parse(
      localStorage.getItem(VISITORS_DELETE_QUEUE) || "[]",
    );

    if (visitorDeleteQueue.length > 0) {
      console.log(
        `Syncing ${visitorDeleteQueue.length} offline visitor deletion(s)...`,
      );

      const remainingVisitorDeletes = [];

      for (const id of visitorDeleteQueue) {
        try {
          const response = await fetch(`${API_BASE_URL}/visitors/${id}`, {
            method: "DELETE",
          });

          // 404 means the visitor is already deleted on the server.
          if (!response.ok && response.status !== 404) {
            throw new Error("Failed to sync visitor deletion");
          }

          console.log(`Synced visitor deletion: ${id}`);
        } catch (error) {
          console.error(`Failed to sync visitor deletion: ${id}`, error);

          remainingVisitorDeletes.push(id);
        }
      }

      localStorage.setItem(
        VISITORS_DELETE_QUEUE,
        JSON.stringify(remainingVisitorDeletes),
      );

      // Refresh visitors cache after deletions
      try {
        const response = await fetch(`${API_BASE_URL}/visitors`);

        if (!response.ok) {
          throw new Error("Failed to refresh visitors after deletions");
        }

        const visitors = await response.json();

        localStorage.setItem(VISITORS_CACHE, JSON.stringify(visitors));

        console.log("Visitors cache refreshed after offline deletions.");
      } catch (error) {
        console.error(
          "Failed to refresh visitors cache after deletions:",
          error,
        );
      }
    }

    // 7. Sync offline visitors
    await api.syncOfflineVisitors();

    console.log("Global offline sync completed.");
  },
};
