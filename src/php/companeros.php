<?php
session_start();
require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

/* obtener piso del usuario */
$stmt = $conn->prepare("
    SELECT id_piso FROM usuarios_pisos WHERE id_usuario=?
");
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();

$id_piso = $res['id_piso'] ?? null;

if (!$id_piso) {
    echo json_encode(["success" => false]);
    exit;
}

/* listar compañeros */
$stmt = $conn->prepare("
    SELECT u.nombre, u.email, up.rol
    FROM usuarios u
    JOIN usuarios_pisos up ON u.id_usuario = up.id_usuario
    WHERE up.id_piso = ?
");
$stmt->bind_param("i", $id_piso);
$stmt->execute();

$result = $stmt->get_result();

$usuarios = [];
while ($row = $result->fetch_assoc()) {
    $usuarios[] = $row;
}

echo json_encode([
    "success" => true,
    "usuarios" => $usuarios
]);