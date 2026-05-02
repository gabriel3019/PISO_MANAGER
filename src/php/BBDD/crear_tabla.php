
<?php

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conn = new mysqli("localhost", "root", "");
$conn->set_charset("utf8mb4");

/* ================= VERIFICAR BD ================= */
$sqlVerificar = "SHOW DATABASES LIKE 'piso_manager'";
$resultado = $conn->query($sqlVerificar);

/* ================= CREAR BD SI NO EXISTE ================= */
if ($resultado && $resultado->num_rows <= 0) {
    $conn->query("CREATE DATABASE piso_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}

/* ================= USAR BD ================= */
$conn->select_db("piso_manager");

/* ================= TABLAS ================= */
$sql = "

/* ===== USUARIOS ===== */
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255)
);

/* ===== PISOS ===== */
CREATE TABLE IF NOT EXISTS pisos (
    id_piso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    codigo_invitacion VARCHAR(20),
    creado_por INT,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS usuarios_pisos (
    id_usuario INT,
    id_piso INT,
    rol ENUM('admin','miembro'),
    PRIMARY KEY (id_usuario, id_piso),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE
);

/* ===== GASTOS PRO ===== */
CREATE TABLE IF NOT EXISTS gastos (
    id_gasto INT AUTO_INCREMENT PRIMARY KEY,
    id_piso INT,
    id_pagador INT,
    descripcion VARCHAR(255),
    monto_total DECIMAL(10,2),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE,
    FOREIGN KEY (id_pagador) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gastos_participantes (
    id_gasto INT,
    id_usuario INT,
    importe DECIMAL(10,2),
    pagado BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (id_gasto, id_usuario),
    FOREIGN KEY (id_gasto) REFERENCES gastos(id_gasto) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

/* ===== TAREAS ===== */
CREATE TABLE IF NOT EXISTS tareas (
    id_tarea INT AUTO_INCREMENT PRIMARY KEY,
    id_piso INT,
    id_usuario INT,
    titulo VARCHAR(100),
    estado ENUM('pendiente','completada') DEFAULT 'pendiente',
    FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

/* ===== AVISOS ===== */
CREATE TABLE IF NOT EXISTS avisos (
    id_aviso INT AUTO_INCREMENT PRIMARY KEY,
    id_piso INT,
    titulo VARCHAR(100),
    descripcion TEXT,
    FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE
);

/* ===== INCIDENCIAS ===== */
CREATE TABLE IF NOT EXISTS incidencias (
    id_incidencia INT AUTO_INCREMENT PRIMARY KEY,
    id_piso INT,
    id_usuario INT,
    tipo VARCHAR(50),
    titulo VARCHAR(100),
    descripcion TEXT,
    urgencia ENUM('baja','media','alta') DEFAULT 'media',
    estado ENUM('creada','en_proceso','finalizada') DEFAULT 'creada',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mensajes_incidencia (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_incidencia INT,
    id_usuario INT,
    mensaje TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_incidencia) REFERENCES incidencias(id_incidencia) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

/* ===== CALENDARIO ===== */
CREATE TABLE IF NOT EXISTS calendario_eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    id_piso INT,
    titulo VARCHAR(150),
    tipo ENUM('incidencia','tarea','evento'),
    fecha DATE,
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
    hora TIME,
    estado VARCHAR(30) DEFAULT 'pendiente',
    FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calendario_evento_personas (
    id_evento INT,
    id_usuario INT,
    PRIMARY KEY (id_evento, id_usuario),
    FOREIGN KEY (id_evento) REFERENCES calendario_eventos(id_evento) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

";

$conn->multi_query($sql);
while ($conn->next_result()) {
}

/* ================= DATOS ================= */
$check = $conn->query("SELECT COUNT(*) as total FROM usuarios");
$row = $check->fetch_assoc();

if ($row['total'] == 0) {

    $passAdmin = password_hash("admin123", PASSWORD_DEFAULT);
    $passUser  = password_hash("1234", PASSWORD_DEFAULT);

    $sqlDatos = "

    /* ===== USUARIOS ===== */
    INSERT INTO usuarios (nombre, email, password) VALUES
    ('Admin','admin@mail.com','$passAdmin'),
    ('Carlos','carlos@mail.com','$passUser'),
    ('Celia','celia@mail.com','$passUser'),
    ('Gabriel','gabriel@mail.com','$passUser');

    /* ===== PISO ===== */
    INSERT INTO pisos (nombre, codigo_invitacion, creado_por)
    VALUES ('Piso Demo','ABC12345',1);

    INSERT INTO usuarios_pisos VALUES
    (1,1,'admin'),(2,1,'miembro'),(3,1,'miembro'),(4,1,'miembro');

    /* ===== GASTO ===== */
    INSERT INTO gastos (id_piso,id_pagador,descripcion,monto_total)
    VALUES (1,2,'Supermercado',60.00);

    INSERT INTO gastos_participantes VALUES
    (1,1,15.00,0),
    (1,2,15.00,1),
    (1,3,15.00,0),
    (1,4,15.00,0);

    /* ===== TAREAS ===== */
    INSERT INTO tareas (id_piso,id_usuario,titulo)
    VALUES (1,2,'Limpiar cocina'),(1,4,'Sacar basura');

    /* ===== AVISOS ===== */
    INSERT INTO avisos VALUES
    (NULL,1,'Reunión','Viernes a las 20:00');

    /* ===== INCIDENCIAS ===== */
    INSERT INTO incidencias (id_piso,id_usuario,tipo,titulo,descripcion,urgencia)
    VALUES
    (1,2,'fontaneria','Fuga baño','Pierde agua','alta'),
    (1,3,'electricidad','Enchufe roto','No funciona','media');

    /* ===== MENSAJES ===== */
    INSERT INTO mensajes_incidencia (id_incidencia,id_usuario,mensaje) VALUES
    (1,2,'Hay una fuga'),
    (1,1,'Aviso al fontanero'),
    (2,3,'Sigue sin funcionar');

    /* ===== CALENDARIO ===== */

    INSERT INTO calendario_eventos 
    (id_piso, titulo, tipo, fecha, fecha_inicio, fecha_fin, hora, estado) 
    VALUES
    (1, 'Cena del piso', 'evento', '2026-04-20', '2026-04-20', NULL, '21:30:00', 'pendiente');

    SET @id_evento_cena = LAST_INSERT_ID();

    INSERT INTO calendario_evento_personas (id_evento, id_usuario) 
    VALUES
    (@id_evento_cena, 2),
    (@id_evento_cena, 3),
    (@id_evento_cena, 4);


    /* ===== 3 EVENTOS EL MISMO DÍA ===== */

    INSERT INTO calendario_eventos 
    (id_piso, titulo, tipo, fecha, fecha_inicio, fecha_fin, hora, estado) 
    VALUES
    (1, 'Compra semanal', 'tarea', '2026-05-22', '2026-05-22', NULL, '10:00:00', 'pendiente');

    SET @id_tarea_compra = LAST_INSERT_ID();

    INSERT INTO calendario_evento_personas (id_evento, id_usuario) 
    VALUES
    (@id_tarea_compra, 2);


    INSERT INTO calendario_eventos 
    (id_piso, titulo, tipo, fecha, fecha_inicio, fecha_fin, hora, estado) 
    VALUES
    (1, 'Reunión de convivencia', 'evento', '2026-05-22', '2026-05-22', NULL, '18:00:00', 'pendiente');

    SET @id_evento_reunion = LAST_INSERT_ID();

    INSERT INTO calendario_evento_personas (id_evento, id_usuario) 
    VALUES
    (@id_evento_reunion, 2),
    (@id_evento_reunion, 3),
    (@id_evento_reunion, 4);


    INSERT INTO calendario_eventos 
    (id_piso, titulo, tipo, fecha, fecha_inicio, fecha_fin, hora, estado) 
    VALUES
    (1, 'Limpiar cocina', 'tarea', '2026-05-22', '2026-05-22', NULL, '20:00:00', 'pendiente');

    SET @id_tarea_cocina = LAST_INSERT_ID();

    INSERT INTO calendario_evento_personas (id_evento, id_usuario) 
    VALUES
    (@id_tarea_cocina, 3);


    /* ===== INCIDENCIAS ===== */

    INSERT INTO calendario_eventos 
    (id_piso, titulo, tipo, fecha, fecha_inicio, fecha_fin, hora, estado) 
    VALUES
    (1, 'Fuga de agua en el baño', 'incidencia', '2026-05-24', '2026-05-26', NULL, NULL, 'pendiente');

    SET @id_incidencia_agua = LAST_INSERT_ID();

    INSERT INTO calendario_evento_personas (id_evento, id_usuario) 
    VALUES
    (@id_incidencia_agua, 2),
    (@id_incidencia_agua, 4);


    INSERT INTO calendario_eventos 
    (id_piso, titulo, tipo, fecha, fecha_inicio, fecha_fin, hora, estado) 
    VALUES
    (1, 'Bombilla del pasillo fundida', 'incidencia', '2026-05-28', '2026-05-28', NULL, NULL, 'pendiente');

    SET @id_incidencia_bombilla = LAST_INSERT_ID();

    INSERT INTO calendario_evento_personas (id_evento, id_usuario) 
    VALUES
    (@id_incidencia_bombilla, 3);
    ";

    $conn->multi_query($sqlDatos);
    while ($conn->next_result()) {
    }
}

$conn->close();
?>