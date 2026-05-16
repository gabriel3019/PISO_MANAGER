
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

CREATE TABLE IF NOT EXISTS usuarios (

    id_usuario INT AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(100),
    apellidos VARCHAR(150),

    dni VARCHAR(20),
    fecha_nacimiento DATE,
    nacionalidad VARCHAR(80),

    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),

    telefono VARCHAR(20),
    numero_cuenta VARCHAR(34),

    direccion VARCHAR(255),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),

    fecha_entrada DATE,

    contacto_emergencia VARCHAR(150),
    telefono_emergencia VARCHAR(20),

    foto VARCHAR(255),

    modo_oscuro BOOLEAN DEFAULT FALSE,

    debe_cambiar_password BOOLEAN DEFAULT TRUE
);


/* ===== PISOS ===== */
CREATE TABLE IF NOT EXISTS pisos (
    id_piso INT AUTO_INCREMENT PRIMARY KEY,
    nombre_casero VARCHAR(100),
    calle VARCHAR(150),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10)
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

CREATE TABLE IF NOT EXISTS pagos (
    id_pago INT AUTO_INCREMENT PRIMARY KEY,
    id_piso INT,
    id_pagador INT,
    id_receptor INT,
    importe DECIMAL(10,2),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_piso) REFERENCES pisos(id_piso) ON DELETE CASCADE,
    FOREIGN KEY (id_pagador) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_receptor) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
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
    id_piso INT NOT NULL,
    id_usuario INT NOT NULL,

    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,

    estado ENUM('pendiente','completada') DEFAULT 'pendiente',

    prioridad ENUM('baja','media','alta') DEFAULT 'baja',

    fecha DATE,
    frecuencia ENUM('puntual','semanal','quincenal','mensual') DEFAULT 'puntual',

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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
    imagen VARCHAR(255) DEFAULT NULL,
    notificar_admin BOOLEAN DEFAULT FALSE,
    leido_admin BOOLEAN DEFAULT FALSE,
    urgencia ENUM('baja','media','alta') DEFAULT 'media',
    estado ENUM('abierta','en_curso','resuelta') DEFAULT 'abierta',
    fecha DATE NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATE NULL,
    fecha_fin DATE NULL,
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

CREATE TABLE IF NOT EXISTS incidencia_mensajes (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_incidencia INT NOT NULL,
    id_usuario INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_incidencia) REFERENCES incidencias(id_incidencia),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_incidencia INT NULL,
    mensaje VARCHAR(255) NOT NULL,
    leida TINYINT(1) DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_incidencia) REFERENCES incidencias(id_incidencia)
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
    INSERT INTO usuarios (nombre,apellidos,dni,fecha_nacimiento,nacionalidad,email,password,telefono,numero_cuenta,direccion,ciudad,codigo_postal,fecha_entrada,contacto_emergencia,telefono_emergencia,debe_cambiar_password)VALUES
   ('Admin','Principal','11111111A','1985-04-12','Española','admin@mail.com','$passAdmin','600000001','ES9121000418450200051332','Calle Mayor 12 - Piso 1A','Madrid','28001','2026-01-01','Maria Principal','611111111',0),
('Carlos','Gomez','22222222B','2000-02-10','Española','carlos@mail.com','$passUser','600000002','ES5521000418450200051333','Calle Mayor 12 - Habitación 1','Madrid','28001','2026-01-10','Ana Gomez','622222222',0),
('Celia','Lopez','33333333C','1999-07-15','Española','celia@mail.com','$passUser','600000003','ES6621000418450200051334','Calle Mayor 12 - Habitación 2','Madrid','28001','2026-01-12','Laura Lopez','633333333',0),
('Gabriel','Gimenes','44444444D','2004-03-12','Española','gabriel@mail.com','$passUser','600000004','ES7721000418450200051335','Calle Mayor 12 - Habitación 3','Madrid','28001','2026-01-15','Pedro Gimenes','644444444',0);

    /* ===== PISO ===== */
    INSERT INTO pisos (nombre_casero, calle, ciudad, codigo_postal) VALUES
    ('Juan Gonzalez', 'Calle Mayor 12', 'Madrid', '28001'),
    ('Maria Lopez',   'Calle Mayor 14', 'Madrid', '28001');

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
    INSERT INTO tareas 
    (id_piso, id_usuario, titulo, descripcion, prioridad, fecha, frecuencia) VALUES 
    (1, 2, 'Limpiar cocina', 'Fregar suelo y limpiar encimera', 'media', '2026-05-05', 'semanal'),
    (1, 4, 'Sacar basura', 'Bajar bolsas al contenedor', 'baja', '2026-05-03', 'puntual'),
    (1, 3, 'Limpiar baño', 'Limpiar ducha, lavabo y WC', 'alta', '2026-05-06', 'quincenal'),
    (1, 1, 'Comprar papel higiénico', 'Reponer papel higiénico', 'media', '2026-05-04', 'puntual');

    /* ===== AVISOS ===== */
    INSERT INTO avisos VALUES
    (NULL,1,'Reunión','Viernes a las 20:00');

    /* ===== INCIDENCIAS ===== */
    INSERT INTO incidencias (id_piso, id_usuario, tipo, titulo, descripcion, imagen, notificar_admin, urgencia, estado, fecha, fecha_inicio, fecha_fin) 
VALUES
(1, 2, 'fontaneria', 'Fuga baño', 'Pierde agua por la junta del grifo', NULL, 0, 'alta', 'abierta', '2026-05-08', '2026-05-08', NULL),
(1, 3, 'electricidad', 'Enchufe roto', 'El enchufe del salón no funciona', NULL, 0, 'baja', 'abierta', '2026-05-08', '2026-05-08', NULL),
(1, 4, 'carpinteria', 'Puerta no cierra', 'La puerta de entrada no cierra bien, está rozando', NULL, 1, 'baja', 'en_curso', '2026-05-08', '2026-05-08', NULL);

    
    /* ===== MENSAJES ===== */
    INSERT INTO mensajes_incidencia (id_incidencia,id_usuario,mensaje) VALUES
    (1,2,'Hay una fuga'),
    (1,1,'Aviso al fontanero'),
    (2,3,'Sigue sin funcionar');

    /* ===== CALENDARIO ===== */

    INSERT INTO calendario_eventos 
    (id_piso, titulo, tipo, fecha, fecha_inicio, fecha_fin, hora, estado)
    SELECT 
        id_piso,
        titulo,
        'incidencia',
        COALESCE(fecha, DATE(fecha_creacion)),
        NULL,
        NULL,
        NULL,
        estado
    FROM incidencias
    WHERE id_piso = 1
    AND estado != 'resuelta';


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
    ";

    $conn->multi_query($sqlDatos);
    while ($conn->next_result()) {
    }
}

$conn->close();
?>