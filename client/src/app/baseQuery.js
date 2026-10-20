import { api } from '../api/axios.js';

const networkHint = (err) => {
  if (!err.response) return 'Cannot reach the API. Is the server running on port 5000?';
  const { status, data } = err.response;
  if (data && (typeof data !== 'string' || data.trim())) return data;
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return { success: false, message: 'The API server is not responding. Make sure it is running on port 5000.' };
  }
  return { success: false, message: err.message };
};

// Adapts the shared axios instance (with auth + refresh interceptors)
// into an RTK Query baseQuery.
export const axiosBaseQuery =
  () =>
  async ({ url, method = 'GET', data, params }) => {
    try {
      const result = await api({ url, method, data, params });
      return { data: result.data };
    } catch (axiosError) {
      return {
        error: {
          status: axiosError.response?.status ?? 'FETCH_ERROR',
          data: networkHint(axiosError),
        },
      };
    }
  };

export default axiosBaseQuery;
