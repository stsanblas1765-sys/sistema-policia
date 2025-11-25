const express = require('express');
const router = express.Router();
const ubicacionController = require('../controllers/ubicacionController');
const { verificarToken, verificarSupervisor } = require('../middleware/auth');

// Rutas para patrullas
router.post('/', verificarToken, ubicacionController.guardarUbicacion);

// Rutas para supervisores
router.get('/activas', verificarToken, verificarSupervisor, ubicacionController.obtenerUbicacionesActivas);
router.get('/ruta/:usuario_id', verificarToken, verificarSupervisor, ubicacionController.obtenerRutaUnidad);
router.get('/estadisticas/:usuario_id', verificarToken, verificarSupervisor, ubicacionController.obtenerEstadisticas);

module.exports = router;