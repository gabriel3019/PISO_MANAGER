<?php

$conn = new mysqli("localhost", "root", "");
if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

/* ===================== HASH PASSWORDS ===================== */
$passAdmin = password_hash("admin123", PASSWORD_DEFAULT);
$passUser = password_hash("1234", PASSWORD_DEFAULT);

/* ===================== CREAR BBDD ===================== */

$sqlVerificar = "SHOW DATABASES LIKE 'piso_manager'";
$resultado = $conn->query($sqlVerificar);

if ($resultado && $resultado->num_rows <= 0) {

    $sql = "
    CREATE DATABASE piso_manager;
    USE piso_manager;

    /* ===================== TABLAS ===================== */

    CREATE TABLE usuarios (
        id_usuario INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255)
    );

    CREATE TABLE pisos (
        id_piso INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100),
        codigo_invitacion VARCHAR(20),
        creado_por INT,
        FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    );

    CREATE TABLE usuarios_pisos (
        id_usuario INT,
        id_piso INT,
        rol ENUM('admin','miembro'),
        PRIMARY KEY (id_usuario, id_piso),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE
    );

    CREATE TABLE gastos (
        id_gasto INT AUTO_INCREMENT PRIMARY KEY,
        id_piso INT,
        descripcion VARCHAR(255),
        monto DECIMAL(10,2),
        FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE
    );

    CREATE TABLE tareas (
        id_tarea INT AUTO_INCREMENT PRIMARY KEY,
        id_piso INT,
        titulo VARCHAR(100),
        estado ENUM('pendiente','completada') DEFAULT 'pendiente',
        FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE
    );

    CREATE TABLE avisos (
        id_aviso INT AUTO_INCREMENT PRIMARY KEY,
        id_piso INT,
        titulo VARCHAR(100),
        descripcion TEXT,
        FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE
    );

    /* ===================== USUARIOS ===================== */

    INSERT INTO usuarios (nombre, email, password) VALUES
    ('Admin', 'admin@mail.com', '$passAdmin'),
    ('Carlos Freire', 'carlos@mail.com', '$passUser'),
    ('Celia Núñez', 'celia@mail.com', '$passUser'),
    ('Gabriel Elías', 'gabriel@mail.com', '$passUser');

    /* ===================== PISO ===================== */

    INSERT INTO pisos (nombre, codigo_invitacion, creado_por)
    VALUES ('Piso Compartido Demo', 'ABC12345', 1);

    /* ===================== RELACIONES ===================== */

    INSERT INTO usuarios_pisos (id_usuario, id_piso, rol) VALUES
    (1,1,'admin'),
    (2,1,'miembro'),
    (3,1,'miembro'),
    (4,1,'miembro');

    /* ===================== DATOS DEMO ===================== */

    INSERT INTO gastos (id_piso, descripcion, monto) VALUES
    (1,'Compra supermercado',50.00),
    (1,'Factura luz',30.00);

    INSERT INTO tareas (id_piso, titulo) VALUES
    (1,'Limpiar cocina'),
    (1,'Sacar basura');

    INSERT INTO avisos (id_piso, titulo, descripcion) VALUES
    (1,'Reunión','Reunión el viernes a las 20:00'),
    (1,'Compra','Hay que comprar papel higiénico');
    ";

    if ($conn->multi_query($sql)) {
        while ($conn->next_result()) {;}
        echo "BBDD creada correctamente";
    } else {
        echo "Error: " . $conn->error;
    }

} else {
    $conn->select_db("piso_manager");
    echo "La base de datos ya existe";
}

$conn->close();
?>