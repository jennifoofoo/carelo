/**
 * Carelo API Client
 * Connects frontend to FastAPI backend
 */

// Auto-detect: Use relative URL if deployed, localhost for local dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location.origin);

// Auth token management
let authToken: string | null = localStorage.getItem('carelo_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('carelo_token', token);
  } else {
    localStorage.removeItem('carelo_token');
  }
};

export const getAuthToken = () => authToken;

// Helper function for API calls
async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Only add Content-Type if not already set (for FormData uploads)
  if (!options.headers || !('Content-Type' in options.headers)) {
    headers['Content-Type'] = 'application/json';
  }

  // Demo mode: Token is optional
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
      // Handle 404 gracefully for optional resources (like help plans)
      if (response.status === 404 && endpoint.includes('/help-plans/current')) {
        throw new Error('NOT_FOUND'); // Special error code for optional resources
      }
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
  } catch (error: any) {
    // Handle network errors (backend not reachable)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`❌ Network error calling ${endpoint}:`, error);
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Please check if the backend is running.`);
    }
    throw error;
  }
}

// Authentication
export const authAPI = {
  register: async (email: string, password: string, fullName?: string) => {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  login: async (email: string, password: string) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  logout: () => {
    setAuthToken(null);
  },

  getMe: () => apiCall('/auth/me'),
};

// Cases
export const casesAPI = {
  list: () => apiCall('/cases'),
  
  get: (id: string) => apiCall(`/cases/${id}`),
  
  create: (data: {
    title?: string;
    client_name?: string;
    client_id?: string;
    description?: string;
    priority?: string;
  }) => apiCall('/cases', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => apiCall(`/cases/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiCall(`/cases/${id}`, {
    method: 'DELETE',
  }),
};

// Notes
export const notesAPI = {
  createText: async (caseId: string | null, content: string) => {
    return apiCall('/notes/text', {
      method: 'POST',
      body: JSON.stringify({ 
        case_id: caseId || undefined,  // Omit if null
        content 
      }),
    });
  },

  uploadAudio: async (caseId: string | null, file: File, category?: string) => {
    const formData = new FormData();
    if (caseId) formData.append('case_id', caseId);  // Only append if provided
    formData.append('file', file);
    if (category) formData.append('category', category);

    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/notes/audio`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Upload failed';
      try {
        const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },

  uploadPDF: async (caseId: string, file: File, category?: string) => {
    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('file', file);
    if (category) formData.append('category', category);

    const response = await fetch(`${API_BASE_URL}/notes/pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  uploadImage: async (caseId: string, file: File, category?: string) => {
    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('file', file);
    if (category) formData.append('category', category);

    const response = await fetch(`${API_BASE_URL}/notes/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  uploadTextFile: async (caseId: string, file: File, category?: string) => {
    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('file', file);
    if (category) formData.append('category', category);

    const response = await fetch(`${API_BASE_URL}/notes/text-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  getStatus: (noteId: string) => apiCall(`/notes/${noteId}/status`),

  list: (caseId: string) => apiCall(`/notes?case_id=${caseId}`),

  get: (noteId: string) => apiCall(`/notes/${noteId}`),

  delete: (noteId: string) => apiCall(`/notes/${noteId}`, {
    method: 'DELETE',
  }),

  getAudioUrl: (noteId: string) => {
    // Returns the URL to stream audio with authentication
    const token = getAuthToken();
    // Note: We include the token in the URL params since <audio> elements can't set custom headers
    return `${API_BASE_URL}/notes/${noteId}/audio${token ? `?token=${token}` : ''}`;
  },
};

// Tasks
export const tasksAPI = {
  list: (caseId: string) => apiCall(`/tasks?case_id=${caseId}`),
  
  create: (data: {
    case_id: string;
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
  }) => apiCall('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  batchCreate: async (caseId: string, suggestions: Array<{
    title: string;
    description?: string;
    priority?: string;
  }>) => {
    const tasks = suggestions.map(s => ({
      case_id: caseId,
      title: s.title,
      description: s.description,
      priority: s.priority || 'medium',
    }));
    
    // Create tasks sequentially to ensure order
    const results = [];
    for (const task of tasks) {
      const result = await apiCall('/tasks', {
      method: 'POST',
        body: JSON.stringify(task),
      });
      results.push(result);
    }
    return results;
  },
  
  update: (id: string, data: any) => apiCall(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiCall(`/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// AI Actions - Universal Agent
export const aiAPI = {
  // Universal Agent (new)
  runUniversalAgent: (noteId: string, regenerate: boolean = false) => 
    apiCall(`/ai/notes/${noteId}/universal`, {
      method: 'POST',
      body: JSON.stringify({ regenerate }),
    }),
  
  getAnalysis: (noteId: string) => apiCall(`/ai/notes/${noteId}/analysis`),

  // Legacy Actions (old)
  runAction: (noteId: string, action: string) => apiCall('/ai/run-action', {
    method: 'POST',
    body: JSON.stringify({ note_id: noteId, action }),
  }),

  generateHelpPlan: (caseId: string) => {
    const url = `${API_BASE_URL}/ai/generate-help-plan?case_id=${caseId}`;
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    // Note: No Content-Type header - this endpoint expects only query params, no body
    return fetch(url, {
    method: 'POST',
      headers,
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || 'Failed to generate help plan');
      }
      return response.json();
    });
  },

  // Case Overview
  getCaseOverview: (caseId: string) => apiCall(`/ai/cases/${caseId}/overview`),

  // Anonymize
  anonymizeNote: (noteId: string) => apiCall(`/ai/notes/${noteId}/anonymize`, {
    method: 'POST',
  }),
};

// Notes Export
export const notesExportAPI = {
  exportPDF: async (noteId: string) => {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/notes/${noteId}/export/pdf`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PDF export failed: ${res.statusText}`);
    return res.blob();
  },
  exportWord: async (noteId: string) => {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/notes/${noteId}/export/docx`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Word export failed: ${res.statusText}`);
    return res.blob();
  },
};

// Insights
export const insightsAPI = {
  list: (caseId: string, type?: string, prioritizeRisks: boolean = false, maxRisks: number = 5) => {
    const params = new URLSearchParams({ case_id: caseId });
    if (type) params.append('insight_type', type);
    if (prioritizeRisks) {
      params.append('prioritize_risks', 'true');
      params.append('max_risks', maxRisks.toString());
    }
    return apiCall(`/insights?${params}`);
  },

  generate: (caseId: string) => apiCall(`/insights/generate?case_id=${caseId}`, {
    method: 'POST',
  }),

  markAsRead: (insightId: string) => apiCall(`/insights/${insightId}/read`, {
    method: 'PATCH',
  }),
};

// Help Plans
export const helpPlansAPI = {
  list: (caseId: string) => apiCall(`/help-plans?case_id=${caseId}`),

  getCurrent: (caseId: string) => apiCall(`/help-plans/current?case_id=${caseId}`),

  create: (caseId: string, content: any) => apiCall('/help-plans', {
    method: 'POST',
    body: JSON.stringify({ case_id: caseId, content }),
  }),

  update: (planId: string, content: any) => apiCall(`/help-plans/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  }),

  exportPDF: async (planId: string) => {
    const response = await fetch(`${API_BASE_URL}/help-plans/${planId}/export/pdf`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'PDF export failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `help_plan_${planId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  exportWord: async (planId: string) => {
    const response = await fetch(`${API_BASE_URL}/help-plans/${planId}/export/docx`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Word export failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `help_plan_${planId}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// Reports
export const reportsAPI = {
  listTemplates: (category?: string) => {
    const params = category ? `?category=${category}` : '';
    return apiCall(`/reports/templates${params}`);
  },

  getTemplate: (templateId: string) => apiCall(`/reports/templates/${templateId}`),

  generate: (caseId: string, templateId: string, title?: string, customData?: any) => 
    apiCall(`/reports/generate?case_id=${caseId}`, {
      method: 'POST',
      body: JSON.stringify({
        template_id: templateId,
        title,
        custom_data: customData,
      }),
    }),

  list: (caseId?: string, templateId?: string) => {
    const params = new URLSearchParams();
    if (caseId) params.append('case_id', caseId);
    if (templateId) params.append('template_id', templateId);
    const query = params.toString();
    return apiCall(`/reports${query ? `?${query}` : ''}`);
  },

  get: (reportId: string) => apiCall(`/reports/${reportId}`),

  update: (reportId: string, data: { title?: string; status?: string; content?: any }) =>
    apiCall(`/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (reportId: string) => apiCall(`/reports/${reportId}`, {
    method: 'DELETE',
  }),
};

// Highlights
export const highlightsAPI = {
  create: (noteId: string, caseId: string, text: string, startIndex?: number, endIndex?: number, category?: string) =>
    apiCall('/highlights', {
      method: 'POST',
      body: JSON.stringify({
        note_id: noteId,
        case_id: caseId,
        text,
        start_index: startIndex,
        end_index: endIndex,
        category,
      }),
    }),
  list: (caseId?: string, noteId?: string, category?: string, isUsed?: boolean) => {
    const params = new URLSearchParams();
    if (caseId) params.append('case_id', caseId);
    if (noteId) params.append('note_id', noteId);
    if (category) params.append('category', category);
    if (isUsed !== undefined) params.append('is_used', String(isUsed));
    return apiCall(`/highlights?${params.toString()}`);
  },
  delete: (highlightId: string) => apiCall(`/highlights/${highlightId}`, { method: 'DELETE' }),
  markUsed: (highlightId: string) => apiCall(`/highlights/${highlightId}/mark-used`, {
    method: 'PATCH',
  }),
};

export default {
  auth: authAPI,
  cases: casesAPI,
  notes: notesAPI,
  tasks: tasksAPI,
  ai: aiAPI,
  insights: insightsAPI,
  helpPlans: helpPlansAPI,
  reports: reportsAPI,
  notesExport: notesExportAPI,
  highlights: highlightsAPI,
};

