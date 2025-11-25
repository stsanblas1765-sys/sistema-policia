import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// CAMBIA ESTA IP POR LA IP DE TU COMPUTADORA
// Para encontrar tu IP en Windows: abre CMD y escribe: ipconfig
// Busca "IPv4 Address" de tu adaptador WiFi/Ethernet
const API_URL = 'https://sistema-policia-api.onrender.com/'; // CAMBIAR ESTA IP

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (numero_empleado, password) => 
        api.post('/auth/login', { numero_empleado, password }),
    
    logout: () => 
        api.post('/auth/logout'),
};

export const ubicacionAPI = {
    guardarUbicacion: (latitud, longitud, velocidad) => 
        api.post('/ubicaciones', { latitud, longitud, velocidad }),
};

export default api;