import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (numero_empleado, password) => 
        api.post('/auth/login', { numero_empleado, password }),
    
    logout: () => 
        api.post('/auth/logout'),
    
    verificarToken: () =>
        api.get('/auth/verificar'),
};

export const ubicacionAPI = {
    guardarUbicacion: (latitud, longitud, velocidad) => 
        api.post('/ubicaciones', { latitud, longitud, velocidad }),
    
    obtenerUbicacionesActivas: () => 
        api.get('/ubicaciones/activas'),
    
    obtenerRutaUnidad: (usuario_id, params = {}) => 
        api.get(`/ubicaciones/ruta/${usuario_id}`, { params }),
    
    obtenerEstadisticas: (usuario_id) =>
        api.get(`/ubicaciones/estadisticas/${usuario_id}`),
};

export default api;