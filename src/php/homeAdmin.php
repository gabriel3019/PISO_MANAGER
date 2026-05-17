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

/* ================= DATOS USUARIO ================= */
$sql = "SELECT nombre, email FROM usuarios WHERE id_usuario=?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$res = $stmt->get_result();
$usuario = $res->fetch_assoc();

/* ================= TODOS LOS PISOS DEL USUARIO ================= */
$sql = "
    SELECT 
        id_piso,
        nombre_casero,
        calle,
        ciudad,
        codigo_postal
    FROM pisos
    WHERE id_admin = ?
";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$res = $stmt->get_result();

$pisos = [];

while ($row = $res->fetch_assoc()) {
    $pisos[] = $row;
}

echo json_encode([
    "success" => true,
    "usuario" => $usuario,
    "pisos" => $pisos
]);

$stmt->close();
$conexion->close();
?>