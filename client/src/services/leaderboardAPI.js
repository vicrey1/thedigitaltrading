import API from './api';

export const fetchLeaderboard = async () => {
  // This endpoint should be implemented in the backend for real data
  const response = await API.get('/leaderboard');
  return response.data;
};
