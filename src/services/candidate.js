import api from './api';

export const candidateApi = {
  async listInterviews() {
    const { data } = await api.get('candidate/interviews/');
    return data;
  },
  async getInterview(sessionId) {
    const { data } = await api.get(`candidate/interviews/${sessionId}/`);
    return data;
  },
};
