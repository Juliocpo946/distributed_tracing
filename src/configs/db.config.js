const mysql = require('mysql2');

const pool = mysql.createPool({
    host:process.env.DB_HOST,
    user:process.env.DB_USERNAME,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, Connection)=>{
    if(err) console.log(err)
    console.log("Conexion exitosa")})

module.exports = pool.promise();
