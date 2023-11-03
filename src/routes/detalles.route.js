const express = require('express');
const router = express.Router();
const detallesController = require('../controllers/detalles.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/',authMiddleware.verificarJWT, detallesController.index);
router.get('/:id',authMiddleware.verificarJWT, detallesController.getById);
router.post('/',authMiddleware.verificarJWT, detallesController.create);
router.delete('/:id', authMiddleware.verificarJWT, detallesController.deleteFisico);
router.put('/:id',authMiddleware.verificarJWT, detallesController.deleteLogico);
router.put('/:id',authMiddleware.verificarJWT, detallesController.updateCompleto);
router.patch('/:id',authMiddleware.verificarJWT, detallesController.updateParcial);

module.exports = router;
