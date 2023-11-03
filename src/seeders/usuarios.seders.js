require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME, SALTOS_BCRYPT } = process.env;

const usuarios = [
    { nombre: "nombre1", email: "email1@gmail.com", password: bcrypt.hashSync('1234', Number(SALTOS_BCRYPT)), createdAt: new Date(),
    updatedAt: null,deleted: false, deletedAt: null},
    { nombre: "nombre2", email: "email1@gmail.com", password: bcrypt.hashSync('1234', Number(SALTOS_BCRYPT)), createdAt: new Date(),
    updatedAt: null,deleted: false, deletedAt: null},
    { nombre: "nombre3", email: "email1@gmail.com", password: bcrypt.hashSync('1234', Number(SALTOS_BCRYPT)), createdAt: new Date(),
    updatedAt: null,deleted: false, deletedAt: null},
    { nombre: "nombre4", email: "email1@gmail.com", password: bcrypt.hashSync('1234', Number(SALTOS_BCRYPT)), createdAt: new Date(),
    updatedAt: null,deleted: false, deletedAt: null},
    { nombre: "nombre5", email: "email1@gmail.com", password: bcrypt.hashSync('1234', Number(SALTOS_BCRYPT)), createdAt: new Date(),
    updatedAt: null,deleted: false, deletedAt: null},
];

const insertData = async () => {
    try {
        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USERNAME,
            password: DB_PASSWORD,
            database: DB_NAME,
        });

        const query = "INSERT INTO usuarios (nombre, email, password, createdAt, updatedAt, deleted, deletedAt) VALUES ?";
        const values = usuarios.map(user => [
            user.nombre,
            user.email,
            user.password,
            user.createdAt,
            user.updatedAt,
            user.deleted,
            user.deletedAt,
        ]);

        await connection.query(query, [values]);
        await connection.end();
        console.log("Usuarios creados exitosamente!");
    } catch (error) {
        console.error("No se pudieron crear los usuarios", error);
    }
};

insertData();
