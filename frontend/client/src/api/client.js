import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({ baseURL: API_BASE_URL });

export const getCandidates = async (params = {}) => {
  const { data } = await api.get('/api/candidates', { params });
  return data;
};

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/api/candidates/upload', formData);
  return data;
};

export const updateCandidate = async (id, updates) => {
  const { data } = await api.put(`/api/candidates/${id}`, updates);
  return data;
};

export const deleteCandidate = async (id) => {
  const { data } = await api.delete(`/api/candidates/${id}`);
  return data;
};

export const bulkDeleteCandidates = async (ids) => {
  const { data } = await api.post('/api/candidates/bulk-delete', { ids });
  return data;
};

export const exportCandidates = async () => {
  const { data } = await api.get('/api/candidates/export');
  return data;
};

export const getRecommendations = async (payload) => {
  const { data } = await api.post('/api/recommend', payload);
  return data;
};

export const resumeUrl = (candidateId) =>
  `${API_BASE_URL}/api/candidates/${candidateId}/resume`;

export const resumeDownloadUrl = (candidateId) =>
  `${API_BASE_URL}/api/candidates/${candidateId}/resume?download=true`;

export const getResumeText = async (candidateId) => {
  const { data } = await api.get(`/api/candidates/${candidateId}/resume/text`);
  return data;
};

export const apiErrorMessage = (error) =>
  error?.response?.data?.detail || error?.message || 'Something went wrong';
