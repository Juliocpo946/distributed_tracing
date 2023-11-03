const pool = require ('../configs/db.config')
const index = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const offset = (page - 1) * limit;
      const sql = `SELECT * FROM detallepedido LIMIT ${limit} OFFSET ${offset}`;

      const [rows] = await pool.execute(sql);
      const [countResult] = await pool.execute('SELECT COUNT(*) AS total FROM detallepedido');
      const totalDocuments = countResult[0].total;

      const totalPages = Math.ceil(totalDocuments / limit);

      const response = {
          message: "Se obtuvieron correctamente los datos",
          page,
          limit,
          totalPages,
          totalDocuments,
          data: rows
      };

      res.json(response);
  } catch (error) {
      console.error('Error al obtener los datos:', error);
      res.status(500).json({ error: 'Error al obtener los datos' });
  }
};

module.exports = {
  index
};

const getById = async (req, res) => {
    const idPedido = req.params.id;
    const query = 'SELECT * FROM detallepedido WHERE idPedido = ? ';
    pool.execute(query, [idPedido])
    .then(([results]) => {
      res.json(results);
    })
    .catch((error) => {
      console.error('Error en la consulta:', error);
      res.status(500).send('Error en el servidor');
    });
};
const create = async (req, res) => {
    const {idPedido, idProducto, cantidadAguacate, cantidadQueso, cantidadAmbos, original } = req.body;
    const createdAt = new Date();
    const updatedAt = null;
    const deleted = false;
    const deletedAt = null; 
    const query = 'INSERT INTO detallepedido (idPedido, idProducto, cantidadAguacate, cantidadQueso, cantidadAmbos, original, createdAt, updateAt, deleted,  deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? )';
    pool.execute(query, [idPedido, idProducto, cantidadAguacate, cantidadQueso, cantidadAmbos, original, createdAt, updatedAt,deleted, deletedAt ])
    .then(() => {
      res.status(201).json({ mensaje: 'los detalles del pedido se agregaron con exito' });
    })
    .catch((error) => {
      console.error('Error al agregar los detalles:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    });
}
const deleteFisico = async (req, res) => {
    const idDetalle = req.params.id;
    const query = 'DELETE FROM detallepedido WHERE idDetalle = ?';

    pool.execute(query, [idDetalle])
    .then(() => {
      res.status(200).json({mensaje:'se elimino correctamente'});
    })
    .catch((error) => {
      console.error('Error al eliminar el detalle del pedido:', error);
      res.status(500).json({ mensaje: 'Error interno del servidor' });
    });

}
const deleteLogico =async (req, res) => {
  const idDetalle = req.params.id;
  const deleted=true;
  const deletedAt=new Date();
  const query = 'UPDATE detallepedido SET deleted=?, deletedAt=? WHERE idDetalle = ?';
  pool.execute(query,[deleted, deletedAt, idDetalle])
  .then(([result]) => {
    if (result.affectedRows === 0) {
      res.status(404).json({ mensaje: 'No se encontro el detalle' });
    } else {
      res.status(200).json({ mensaje: 'La eliminacion logica se realizo correctamente' });
    }
  })
  .catch((error) => {
    console.error('Error al eliminar el detalle del pedido:', error);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  });

}
const updateCompleto = async (req, res) => {
    const idDetalle = req.params.id;
    const updateAt=new Date();
    const {idPedido, idProducto, cantidadAguacate, cantidadQueso, cantidadAmbos, original } = req.body;
    const query = 'UPDATE detallepedido SET idPedido=?, idProducto=?, cantidadAguacate=?, cantidadQueso=?, cantidadAmbos=?, original=?, updateAt=? WHERE idDetalle = ?'
    const values = [idPedido, idProducto, cantidadAguacate, cantidadQueso, cantidadAmbos, original, idDetalle, updateAt];
    pool.execute(query, values)
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.status(404).json({ mensaje: 'Detalle no encontrado' });
      } else {
        res.status(200).json({ mensaje: 'Detalle de pedido actualizada con éxito' });
      }
    })
    .catch((error) => {
      console.error('Error al actualizar la tarea:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    });
}
const updateParcial = async (req, res) => {
  const idDetalle = req.params.id;
  const cambios = req.body; 
  const updateAt=new Date();
  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ mensaje: 'Se requieren datos para la actualización parcial' });
  }

  const dondeModificar = Object.keys(cambios).map((campo) => `${campo} = ?`).join(', ');
  const valores = Object.values(cambios);

  const query = `UPDATE detallepedido SET ${dondeModificar},updateAt=? WHERE idDetalle = ?`;
  pool.execute(query, [...valores, updateAt, idDetalle])
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.status(404).json({ mensaje: 'No se encontró el detalle' });
      } else {
        res.status(200).json({ mensaje: 'Actualización parcial realizada correctamente' });
      }
    })
    .catch((error) => {
      console.error('Error al actualizar el detalle del pedido:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    });
}
module.exports = {
    index,
    getById,
    create,
    deleteFisico,
    deleteLogico,
    updateCompleto,
    updateParcial
};
