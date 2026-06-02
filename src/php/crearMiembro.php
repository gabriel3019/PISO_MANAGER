<?php

session_start();

require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* =========================================
   COMPROBAR SESION
========================================= */

if (!isset($_SESSION['id_usuario'])) {

    echo json_encode([
        "success" => false,
        "message" => "No autorizado"
    ]);

    exit;
}

/* =========================================
   RECIBIR DATOS
========================================= */

$nombre = trim($_POST['nombre'] ?? '');
$apellidos = trim($_POST['apellidos'] ?? '');

$dni = trim($_POST['dni'] ?? '');
$fecha_nacimiento = $_POST['fecha_nacimiento'] ?? null;
$nacionalidad = trim($_POST['nacionalidad'] ?? '');

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

$telefono = trim($_POST['telefono'] ?? '');
$numero_cuenta = trim($_POST['numero_cuenta'] ?? '');

$direccion = trim($_POST['direccion'] ?? '');
$ciudad = trim($_POST['ciudad'] ?? '');
$codigo_postal = trim($_POST['codigo_postal'] ?? '');

$fecha_entrada = $_POST['fecha_entrada'] ?? null;

$contacto_emergencia =
    trim($_POST['contacto_emergencia'] ?? '');

$telefono_emergencia =
    trim($_POST['telefono_emergencia'] ?? '');

$foto = null;
$modo_oscuro = 0;

/* =========================================
   VALIDAR CAMPOS
========================================= */

if (
    empty($nombre) ||
    empty($apellidos) ||
    empty($email) ||
    empty($password)
) {

    echo json_encode([
        "success" => false,
        "message" => "Completa todos los campos"
    ]);

    exit;
}

/* =========================================
   VALIDAR EMAIL
========================================= */

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

    echo json_encode([
        "success" => false,
        "message" => "Email no válido"
    ]);

    exit;
}

/* =========================================
   COMPROBAR EMAIL EXISTENTE
========================================= */

$check = $conn->prepare("
    SELECT id_usuario
    FROM usuarios
    WHERE email = ?
");

$check->bind_param("s", $email);

$check->execute();

$result = $check->get_result();

if ($result->num_rows > 0) {

    echo json_encode([
        "success" => false,
        "message" => "El email ya existe"
    ]);

    exit;
}

/* =========================================
   PASSWORD
========================================= */

$passwordHash = password_hash(
    $password,
    PASSWORD_DEFAULT
);

/* =========================================
   CREAR USUARIO
========================================= */

$stmt = $conn->prepare("

INSERT INTO usuarios
(
    nombre,
    apellidos,

    dni,
    fecha_nacimiento,
    nacionalidad,

    email,
    password,

    telefono,
    numero_cuenta,

    direccion,
    ciudad,
    codigo_postal,

    fecha_entrada,

    contacto_emergencia,
    telefono_emergencia,

    foto,
    modo_oscuro,
    debe_cambiar_password
)

VALUES
(
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, 1
)

");

$stmt->bind_param(
    "ssssssssssssssssi",

    $nombre,
    $apellidos,

    $dni,
    $fecha_nacimiento,
    $nacionalidad,

    $email,
    $passwordHash,

    $telefono,
    $numero_cuenta,

    $direccion,
    $ciudad,
    $codigo_postal,

    $fecha_entrada,

    $contacto_emergencia,
    $telefono_emergencia,

    $foto,
    $modo_oscuro
);

if (!$stmt->execute()) {

    echo json_encode([
        "success" => false,
        "message" => "Error al crear usuario"
    ]);

    exit;
}

/* =========================================
   ID NUEVO USUARIO
========================================= */

$id_usuario_nuevo =
    $conn->insert_id;

/* =========================================
   OBTENER PISO DEL ADMIN
========================================= */

$stmtPiso = $conn->prepare("

    SELECT id_piso

    FROM usuarios_pisos

    WHERE id_usuario = ?

    LIMIT 1

");

$stmtPiso->bind_param(
    "i",
    $_SESSION['id_usuario']
);

$stmtPiso->execute();

$piso =
    $stmtPiso
    ->get_result()
    ->fetch_assoc();

$id_piso =
    $piso['id_piso'] ?? null;

if (!$id_piso) {

    echo json_encode([
        "success" => false,
        "message" => "No se encontró el piso"
    ]);

    exit;
}

/* =========================================
   ASIGNAR AL PISO
========================================= */

$stmtRelacion = $conn->prepare("

    INSERT INTO usuarios_pisos
    (
        id_usuario,
        id_piso,
        rol
    )

    VALUES
    (
        ?, ?, 'miembro'
    )

");

$stmtRelacion->bind_param(
    "ii",
    $id_usuario_nuevo,
    $id_piso
);

if (!$stmtRelacion->execute()) {

    echo json_encode([
        "success" => false,
        "message" => "Error al asignar usuario al piso"
    ]);

    exit;
}

/* =========================================
   OK
========================================= */

echo json_encode([
    "success" => true
]);