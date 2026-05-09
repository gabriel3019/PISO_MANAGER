<?php
session_start();
header("Content-Type: application/json");

/* ================= CONEXIÓN ================= */
$conexion = new mysqli("localhost", "root", "", "piso_manager");

if ($conexion->connect_error) {
    echo json_encode([
        "success" => false,
        "error" => "Error de conexión"
    ]);
    exit;
}

/* ================= VALIDAR SESIÓN ================= */
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode([
        "success" => false,
        "error" => "No hay sesión"
    ]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

/* ================= OBTENER PISO ================= */
$sql = "SELECT id_piso FROM usuarios_pisos WHERE id_usuario=? LIMIT 1";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "error" => "Usuario sin piso"
    ]);
    exit;
}

$id_piso = $res->fetch_assoc()['id_piso'];

/* ================= DATOS PISO ================= */
$sql = "SELECT calle, ciudad, codigo_postal FROM pisos WHERE id_piso=?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "error" => "No se encontró el piso"
    ]);
    exit;
}

$piso = $res->fetch_assoc();

/* ================= DATOS USUARIO ================= */
$sql = "SELECT nombre, email FROM usuarios WHERE id_usuario=?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$res = $stmt->get_result();

$usuario = $res->fetch_assoc();

/* ================= RESPONSE ================= */
echo json_encode([
    "success" => true,
    "piso" => $piso,
    "usuario" => $usuario
]);

$stmt->close();
$conexion->close();
?>