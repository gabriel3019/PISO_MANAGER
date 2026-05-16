<?php
session_start();
header("Content-Type: application/json");

$conexion = new mysqli("localhost", "root", "", "piso_manager");

if ($conexion->connect_error) {
    echo json_encode([
        "success" => false,
        "error" => "Error de conexión"
    ]);
    exit;
}

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "error" => "No hay sesión"
    ]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

$data = json_decode(file_get_contents("php://input"), true);
$id_piso = $data["id_piso"] ?? null;

if (!$id_piso) {
    echo json_encode([
        "success" => false,
        "error" => "ID de piso no válido"
    ]);
    exit;
}

/* Elimina SOLO el piso seleccionado y solo si pertenece al admin */
$sql = "DELETE FROM pisos WHERE id_piso = ? AND id_admin = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_piso, $id_usuario);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode([
        "success" => true
    ]);
} else {
    echo json_encode([
        "success" => false,
        "error" => "No se encontró el piso o no pertenece a este admin"
    ]);
}

$stmt->close();
$conexion->close();
?>