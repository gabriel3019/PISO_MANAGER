<?php
session_start();
require_once __DIR__ . "/BBDD/conecta.php";

if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false]);
    exit;
}

$id_piso = $_SESSION['piso_id'];

$sql = "
SELECT u.id_usuario, u.nombre
FROM usuarios u
JOIN usuarios_pisos up ON u.id_usuario = up.id_usuario
WHERE up.id_piso=?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();

$res = $stmt->get_result();

$usuarios = [];

while ($row = $res->fetch_assoc()) {
    $usuarios[] = $row;
}

echo json_encode([
    "success" => true,
    "usuarios" => $usuarios
]);