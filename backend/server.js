const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const ubicacionRoutes = require('./routes/ubicacionRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de peticiones
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({ 
        mensaje: '✅ Servidor del Sistema Policial funcionando',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            ubicaciones: '/api/ubicaciones'
        }
    });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ 
        mensaje: 'Ruta no encontrada',
        path: req.path 
    });
});

// Socket.IO para tiempo real
let clientesConectados = 0;

io.on('connection', (socket) => {
    clientesConectados++;
    console.log(`✅ Cliente conectado: ${socket.id} (Total: ${clientesConectados})`);
    
    // Cuando una patrulla envía su ubicación
    socket.on('actualizarUbicacion', (data) => {
        console.log(`📍 Ubicación actualizada de: ${data.nombre}`);
        // Enviar a todos los supervisores
        io.emit('ubicacionActualizada', data);
    });
    
    // Cuando un supervisor se une
    socket.on('supervisorConectado', (data) => {
        console.log(`👮 Supervisor conectado: ${data.nombre}`);
        socket.join('supervisores');
    });
    
    // Desconexión
    socket.on('disconnect', () => {
        clientesConectados--;
        console.log(`❌ Cliente desconectado: ${socket.id} (Total: ${clientesConectados})`);
    });
});

// Manejo de errores
process.on('unhandledRejection', (err) => {
    console.error('❌ Error no manejado:', err);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log('\n=================================');
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 http://localhost:${PORT}`);
    console.log('=================================\n');
});

module.exports = { app, io };