<?php

session_start();

require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

if (!isset($_SESSION['id_usuario'])) {

    echo json_encode([
        "success" => false,
        "message" => "No autorizado"
    ]);

    exit;
}

$nombre = trim($_POST['nombre']);
$apellidos = trim($_POST['apellidos']);
$email = trim($_POST['email']);
$password = $_POST['password'];

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

// COMPROBAR EMAIL
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

// ENCRIPTAR PASSWORD
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// DATOS VACIOS
$telefono = "";
$direccion = "";
$foto = null;
$modo_oscuro = 0;

// INSERTAR USUARIO
$stmt = $conn->prepare("
    INSERT INTO usuarios
    (
        nombre,
        apellidos,
        email,
        password,
        telefono,
        direccion,
        foto,
        modo_oscuro
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
");

$stmt->bind_param(
    "sssssssi",
    $nombre,
    $apellidos,
    $email,
    $passwordHash,
    $telefono,
    $direccion,
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

// ID USUARIO NUEVO
$id_usuario_nuevo = $conn->insert_id;

// ID PISO DEL ADMIN
$id_piso = $_SESSION['piso_id'];

// INSERTAR RELACION
$stmtRelacion = $conn->prepare("
    INSERT INTO usuarios_pisos
    (
        id_usuario,
        id_piso,
        rol
    )
    VALUES (?, ?, 'miembro')
");

$stmtRelacion->bind_param(
    "ii",
    $id_usuario_nuevo,
    $id_piso
);

if ($stmtRelacion->execute()) {

    echo json_encode([
        "success" => true
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Error al asignar usuario al piso"
    ]);
}