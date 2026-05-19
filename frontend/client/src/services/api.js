import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001';

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(`${API_BASE_URL}/upload-resume`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  
  return response.data;
};

export const getCandidates = async () => {
  const response = await axios.get(`${API_BASE_URL}/candidates`);
  return response.data;
};

export const getRecommendations = async (roleRequirements) => {
  const response = await axios.post(`${API_BASE_URL}/recommend`, roleRequirements);
  return response.data;
};

export const deleteCandidate = async (candidateName) => {
  const response = await axios.delete(`${API_BASE_URL}/candidates/${candidateName}`);
  return response.data;
};

export const updateCandidate = async (candidateName, updates) => {
  const response = await axios.put(`${API_BASE_URL}/candidates/${candidateName}`, updates);
  return response.data;
};

export const searchCandidates = async (filters) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
      params.append(key, filters[key]);
    }
  });
  
  const response = await axios.get(`${API_BASE_URL}/candidates/search?${params}`);
  return response.data;
};

export const bulkDeleteCandidates = async (candidateNames) => {
  const response = await axios.delete(`${API_BASE_URL}/candidates/bulk`, {
    data: { candidate_names: candidateNames }
  });
  return response.data;
};

export const exportCandidates = async () => {
  const response = await axios.get(`${API_BASE_URL}/candidates/export`);
  return response.data;
};