const express = require('express');
const router = express.Router();
const detallesController = require('../controllers/detalles.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/',authMiddleware.verificarJWT, detallesController.index);
router.get('/:id', detallesController.getById);
router.post('/', detallesController.create);
router.delete('/:id', detallesController.deleteFisico);
router.put('/:id',detallesController.deleteLogico);
router.put('/:id', detallesController.updateCompleto);
router.patch('/:id', detallesController.updateParcial);

module.exports = router;
