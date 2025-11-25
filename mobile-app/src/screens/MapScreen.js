import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { ubicacionAPI, authAPI } from '../services/api';

export default function MapScreen({ route, navigation }) {
    const { usuario } = route.params;
    const [location, setLocation] = useState(null);
    const [ruta, setRuta] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const [activo, setActivo] = useState(true);
    const socketRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        iniciarRastreo();
        conectarSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const iniciarRastreo = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permiso Denegado',
                    'La aplicación necesita acceso a tu ubicación para funcionar',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
                return;
            }

            // Obtener ubicación inicial
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            const coords = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            
            setLocation(coords);
            enviarUbicacion(
                currentLocation.coords.latitude,
                currentLocation.coords.longitude,
                currentLocation.coords.speed || 0
            );

            // Rastrear ubicación en tiempo real
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000, // Cada 5 segundos
                    distanceInterval: 10, // Cada 10 metros
                },
                (newLocation) => {
                    const newCoords = {
                        latitude: newLocation.coords.latitude,
                        longitude: newLocation.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    };
                    
                    setLocation(newCoords);
                    
                    const punto = {
                        latitude: newLocation.coords.latitude,
                        longitude: newLocation.coords.longitude,
                    };
                    
                    setRuta(prevRuta => [...prevRuta, punto]);
                    
                    if (activo) {
                        enviarUbicacion(
                            newLocation.coords.latitude,
                            newLocation.coords.longitude,
                            newLocation.coords.speed || 0
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error iniciando rastreo:', error);
            Alert.alert('Error', 'No se pudo iniciar el rastreo GPS');
        }
    };

    const conectarSocket = () => {
        // Cambia esta IP por la IP de tu computadora
        const socket = io('http://172.30.24.204:3000');
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Conectado al servidor en tiempo real');
        });

        socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
        });
    };

    const enviarUbicacion = async (latitud, longitud, velocidad) => {
        try {
            setEnviando(true);
            
            await ubicacionAPI.guardarUbicacion(
                latitud,
                longitud,
                velocidad ? velocidad * 3.6 : 0 // Convertir m/s a km/h
            );

            // Emitir por socket para actualización en tiempo real
            if (socketRef.current) {
                socketRef.current.emit('actualizarUbicacion', {
                    usuario_id: usuario.id,
                    nombre: usuario.nombre,
                    unidad: usuario.unidad_asignada,
                    latitud,
                    longitud,
                    velocidad: velocidad ? velocidad * 3.6 : 0,
                });
            }
        } catch (error) {
            console.error('Error enviando ubicación:', error);
        } finally {
            setEnviando(false);
        }
    };

    const centrarMapa = () => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion(location, 1000);
        }
    };

    const toggleActivo = () => {
        setActivo(!activo);
        Alert.alert(
            activo ? 'Rastreo Pausado' : 'Rastreo Activado',
            activo 
                ? 'Tu ubicación ya no se está enviando' 
                : 'Tu ubicación se está enviando nuevamente'
        );
    };

    const handleLogout = async () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authAPI.logout();
                        } catch (error) {
                            console.error('Error cerrando sesión:', error);
                        } finally {
                            await AsyncStorage.removeItem('token');
                            await AsyncStorage.removeItem('usuario');
                            if (socketRef.current) {
                                socketRef.current.disconnect();
                            }
                            navigation.replace('Login');
                        }
                    },
                },
            ]
        );
    };

    if (!location) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#2ecc71" />
                <Text style={styles.loadingText}>Obteniendo ubicación GPS...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={location}
                showsUserLocation
                showsMyLocationButton={false}
                followsUserLocation
            >
                {ruta.length > 1 && (
                    <Polyline
                        coordinates={ruta}
                        strokeColor="#3498db"
                        strokeWidth={3}
                    />
                )}
            </MapView>

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{usuario.nombre}</Text>
                    <Text style={styles.headerSubtitle}>{usuario.unidad_asignada}</Text>
                </View>
                <View style={[styles.statusBadge, activo ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.statusText}>
                        {activo ? '🟢 Activo' : '🔴 Pausado'}
                    </Text>
                </View>
            </View>

            <View style={styles.controls}>
                <TouchableOpacity style={styles.buttonControl} onPress={centrarMapa}>
                    <Text style={styles.buttonIcon}>📍</Text>
                    <Text style={styles.buttonLabel}>Centrar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.buttonControl, activo ? styles.buttonPause : styles.buttonPlay]} 
                    onPress={toggleActivo}
                >
                    <Text style={styles.buttonIcon}>{activo ? '⏸️' : '▶️'}</Text>
                    <Text style={styles.buttonLabel}>{activo ? 'Pausar' : 'Activar'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.buttonControl} onPress={handleLogout}>
                    <Text style={styles.buttonIcon}>🚪</Text>
                    <Text style={styles.buttonLabel}>Salir</Text>
                </TouchableOpacity>
            </View>

            {enviando && (
                <View style={styles.sendingIndicator}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.sendingText}>Enviando ubicación...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f6fa',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#7f8c8d',
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusActive: {
        backgroundColor: '#d5f4e6',
    },
    statusInactive: {
        backgroundColor: '#fadbd8',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    controls: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    buttonControl: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonPause: {
        backgroundColor: '#e74c3c',
    },
    buttonPlay: {
        backgroundColor: '#2ecc71',
    },
    buttonIcon: {
        fontSize: 24,
        marginBottom: 5,
    },
    buttonLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2c3e50',
    },
    sendingIndicator: {
        position: 'absolute',
        top: 140,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sendingText: {
        color: '#fff',
        marginLeft: 10,
        fontSize: 12,
    },
});