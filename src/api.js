const API_BASE_URL =
  "https://church-attendance-api-gghm.onrender.com/api";

const MEMBERS_CACHE = "church_members_cache";
const ATTENDANCE_QUEUE = "church_attendance_queue";

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

const getAttendanceQueue = () => {
  try {
    return JSON.parse(
      localStorage.getItem(ATTENDANCE_QUEUE) || "[]",
    );
  } catch {
    return [];
  }
};

const saveAttendanceQueue = (queue) => {
  localStorage.setItem(
    ATTENDANCE_QUEUE,
    JSON.stringify(queue),
  );
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

    return savedMember;
  },

  updateMember: async (id, member) => {
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

    return response.json();
  },

  deleteMember: async (id) => {
    const response = await fetch(`${API_BASE_URL}/members/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete member");
    }

    return response.json();
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
    return getAttendanceQueue();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/attendance`);

    if (!response.ok) {
      throw new Error("Failed to fetch attendance");
    }

    return response.json();
  } catch (error) {
    // If server is unavailable, show locally queued attendance
    return getAttendanceQueue();
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

    console.error(
      "Attendance API error:",
      response.status,
      errorText,
    );

    throw new Error(
      `Failed to save attendance (${response.status})`,
    );
  }

  return response.json();
},

  deleteAttendance: async (id) => {
    const response = await fetch(`${API_BASE_URL}/attendance/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete attendance");
    }

    return response.json();
  },

  // VISITORS
  getVisitors: async () => {
    if (isOffline()) {
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/visitors`);

    if (!response.ok) {
      throw new Error("Failed to fetch visitors");
    }

    return response.json();
  },

  addVisitor: async (visitor) => {
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

    return response.json();
  },

  deleteVisitor: async (id) => {
    const response = await fetch(`${API_BASE_URL}/visitors/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete visitor");
    }

    return response.json();
  },
};
