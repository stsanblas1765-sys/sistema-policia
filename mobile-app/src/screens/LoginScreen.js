import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export default function LoginScreen({ navigation }) {
    const [numeroEmpleado, setNumeroEmpleado] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleLogin = async () => {
        if (!numeroEmpleado || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setCargando(true);

        try {
            const response = await authAPI.login(numeroEmpleado, password);
            const { token, usuario } = response.data;

            if (usuario.rol !== 'patrulla') {
                Alert.alert(
                    'Acceso Denegado',
                    'Esta aplicación es solo para oficiales de patrulla. Los supervisores deben usar la aplicación web.'
                );
                setCargando(false);
                return;
            }

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('usuario', JSON.stringify(usuario));

            navigation.replace('Map', { usuario });
        } catch (error) {
            console.error('Error en login:', error);
            Alert.alert(
                'Error de autenticación',
                error.response?.data?.mensaje || 'Verifica tus credenciales'
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Text style={styles.emoji}>🚔</Text>
                <Text style={styles.title}>Sistema Policial</Text>
                <Text style={styles.subtitle}>Rastreo GPS - Patrullas</Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Número de Empleado</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej: PAT001"
                        value={numeroEmpleado}
                        onChangeText={setNumeroEmpleado}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />

                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, cargando && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={cargando}
                    >
                        {cargando ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Iniciar Sesión</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.demoBox}>
                    <Text style={styles.demoTitle}>Credenciales de prueba:</Text>
                    <Text style={styles.demoText}>Usuario: PAT001</Text>
                    <Text style={styles.demoText}>Contraseña: password123</Text>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2ecc71',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    emoji: {
        fontSize: 80,
        textAlign: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 40,
        opacity: 0.9,
    },
    form: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#f5f6fa',
        padding: 15,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    button: {
        backgroundColor: '#27ae60',
        padding: 18,
        borderRadius: 10,
        marginTop: 25,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#95a5a6',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    demoBox: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
    },
    demoTitle: {
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 8,
        fontSize: 14,
    },
    demoText: {
        color: '#fff',
        fontSize: 13,
        marginVertical: 3,
    },
});