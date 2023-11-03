require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

const { MONGO_URI, MONGO_BD, SALTOS_BCRYPT } = process.env;
const usuarios = [
    { nombre: "nombre1", email: "email1@gmail.com", password: bcrypt.hashSync('1234', Number(SALTOS_BCRYPT)) },
    { nombre: "nombre2", email: "email2@gmail.com", password: bcrypt.hashSync('1234', Number(SALTOS_BCRYPT)) },
    // Agrega el resto de los usuarios aquí...
];

const insertData = async () => {
    try {
        const collectionName = 'Usuarios';
        const client = new MongoClient(MONGO_URI);
        await client.connect();

        const db = client.db(MONGO_BD);
        const collection = db.collection(collectionName);

        await collection.insertMany(usuarios);
        client.close();
        console.log("Usuarios creados exitosamente!");
    } catch (error) {
        console.error("No se pudieron crear los usuarios", error);
    }
};

insertData();
