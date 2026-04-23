<?php

$conn = new mysqli("localhost", "root", "");
if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

$passAdmin = password_hash("admin123", PASSWORD_DEFAULT);
$passUser = password_hash("1234", PASSWORD_DEFAULT);

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

    /* ===================== INCIDENCIAS ===================== */

    CREATE TABLE incidencias (
        id_incidencia INT AUTO_INCREMENT PRIMARY KEY,
        id_piso INT,
        id_usuario INT,
        tipo VARCHAR(50),
        titulo VARCHAR(100),
        descripcion TEXT,
        urgencia ENUM('baja','media','alta') DEFAULT 'media',
        estado ENUM('creada','en_proceso','finalizada') DEFAULT 'creada',
        imagen VARCHAR(255) NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    );

    CREATE TABLE mensajes_incidencia (
        id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
        id_incidencia INT,
        id_usuario INT,
        mensaje TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_incidencia) REFERENCES incidencias(id_incidencia) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    );

    /* ===================== CALENDARIO ===================== */

    CREATE TABLE calendario_eventos (
        id_evento INT AUTO_INCREMENT PRIMARY KEY,
        id_piso INT NOT NULL,
        id_incidencia INT NULL,
        titulo VARCHAR(150) NOT NULL,
        tipo ENUM('incidencia','tarea','evento') NOT NULL,
        fecha DATE DEFAULT NULL,
        fecha_inicio DATE DEFAULT NULL,
        fecha_fin DATE DEFAULT NULL,
        hora TIME DEFAULT NULL,
        estado VARCHAR(30) DEFAULT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE,
        FOREIGN KEY (id_incidencia) REFERENCES incidencias(id_incidencia) ON DELETE CASCADE
    );

    CREATE TABLE calendario_evento_personas (
        id_evento INT NOT NULL,
        id_usuario INT NOT NULL,
        PRIMARY KEY (id_evento, id_usuario),
        FOREIGN KEY (id_evento) REFERENCES calendario_eventos(id_evento) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
    );

    /* ===================== DATOS ===================== */

    INSERT INTO usuarios (nombre, email, password) VALUES
    ('Admin', 'admin@mail.com', '$passAdmin'),
    ('Carlos Freire', 'carlos@mail.com', '$passUser'),
    ('Celia Núñez', 'celia@mail.com', '$passUser'),
    ('Gabriel Elías', 'gabriel@mail.com', '$passUser');

    INSERT INTO pisos (nombre, codigo_invitacion, creado_por)
    VALUES ('Piso Compartido Demo', 'ABC12345', 1);

    INSERT INTO usuarios_pisos VALUES
    (1,1,'admin'), (2,1,'miembro'), (3,1,'miembro'), (4,1,'miembro');

    INSERT INTO gastos VALUES
    (NULL,1,'Compra supermercado',50.00),
    (NULL,1,'Factura luz',30.00);

    INSERT INTO tareas VALUES
    (NULL,1,'Limpiar cocina','pendiente'),
    (NULL,1,'Sacar basura','pendiente');

    INSERT INTO avisos VALUES
    (NULL,1,'Reunión','Reunión el viernes a las 20:00'),
    (NULL,1,'Compra','Hay que comprar papel higiénico');

    /* ===================== INCIDENCIAS ===================== */

    INSERT INTO incidencias (id_piso,id_usuario,tipo,titulo,descripcion,urgencia,estado)
    VALUES
    (1,2,'fontaneria','Fuga baño','Pierde agua','alta','creada');

    /* ===================== CALENDARIO (VINCULADO) ===================== */

    INSERT INTO calendario_eventos (id_piso,id_incidencia,titulo,tipo,fecha_inicio,fecha_fin,estado)
    VALUES (1,1,'Fuga baño','incidencia','2026-04-10','2026-04-14','activa');

    INSERT INTO calendario_eventos (id_piso,titulo,tipo,fecha,hora,estado)
    VALUES (1,'Limpiar baño','tarea','2026-04-15','18:00:00','pendiente');

    INSERT INTO calendario_eventos (id_piso,titulo,tipo,fecha,hora,estado)
    VALUES (1,'Cena del piso','evento','2026-04-20','21:30:00','programado');

    INSERT INTO calendario_evento_personas VALUES
    (2,3),(3,2),(3,3),(3,4);

    /* ===================== CHAT ===================== */

    INSERT INTO mensajes_incidencia VALUES
    (NULL,1,2,'Hay una fuga',CURRENT_TIMESTAMP),
    (NULL,1,1,'Aviso al fontanero',CURRENT_TIMESTAMP);
    ";

    if ($conn->multi_query($sql)) {
        while ($conn->next_result()) {}
        echo "BBDD creada correctamente";
    } else {
        echo "Error: " . $conn->error;
    }

} else {
    echo "La base de datos ya existe";
}

$conn->close();
?>