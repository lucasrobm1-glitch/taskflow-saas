import axios from 'axios';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE + '/api',
  timeout: 15000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    const message = err.response?.data?.message;

    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    if (status === 403) {
      toast.error(message || 'Sem permissão para esta ação');
    } else if (status === 422) {
      // Erros de validação — deixa o componente tratar
    } else if (status === 429) {
      toast.error('Muitas requisições. Aguarde um momento.');
    } else if (status >= 500) {
      toast.error('Erro no servidor. Tente novamente.');
    }

    return Promise.reject(err);
  }
);

export default api;

// Helper para extrair mensagem de erro de forma consistente
export const getErrorMessage = (err) => {
  if (err?.response?.data?.errors?.length) {
    return err.response.data.errors.map(e => e.message).join(', ');
  }
  return err?.response?.data?.message || err?.message || 'Erro desconhecido';
};
