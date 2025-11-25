const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.post('/logout', verificarToken, authController.logout);
router.get('/verificar', verificarToken, authController.verificarToken);

module.exports = router;