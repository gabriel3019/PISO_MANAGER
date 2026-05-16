<?php

session_start();

require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* =========================================
   SESION
========================================= */

if (!isset($_SESSION['id_usuario'])) {

    echo json_encode([
        "success" => false,
        "message" => "No autorizado"
    ]);

    exit;
}

/* =========================================
   PASSWORD
========================================= */

$password = trim($_POST['password'] ?? '');

/* =========================================
   VALIDAR
========================================= */

if (strlen($password) < 6) {

    echo json_encode([
        "success" => false,
        "message" => "La contraseña debe tener mínimo 6 caracteres"
    ]);

    exit;
}

/* =========================================
   HASH
========================================= */

$passwordHash = password_hash(
    $password,
    PASSWORD_DEFAULT
);

/* =========================================
   UPDATE
========================================= */

$id_usuario = $_SESSION['id_usuario'];

$stmt = $conn->prepare("
    UPDATE usuarios
    SET
        password = ?,
        debe_cambiar_password = 0
    WHERE id_usuario = ?
");

$stmt->bind_param(
    "si",
    $passwordHash,
    $id_usuario
);

/* =========================================
   RESPUESTA
========================================= */

if ($stmt->execute()) {

    echo json_encode([
        "success" => true
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Error al actualizar contraseña"
    ]);
}