const API_BASE_URL = "/api";

export const api = {
  getMembers: async () => {
    const response = await fetch(`${API_BASE_URL}/members`);

    if (!response.ok) {
      throw new Error("Failed to fetch members");
    }

    return response.json();
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

    return response.json();
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
  getAttendance: async () => {
    const response = await fetch(`${API_BASE_URL}/attendance`);

    if (!response.ok) {
      throw new Error("Failed to fetch attendance");
    }

    return response.json();
  },

  addAttendance: async (attendance) => {
    const response = await fetch(`${API_BASE_URL}/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attendance),
    });

    if (!response.ok) {
      throw new Error("Failed to save attendance");
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

  getVisitors: async () => {
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
