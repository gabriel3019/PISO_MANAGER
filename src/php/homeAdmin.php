<?php
header("Content-Type: application/json");

$conexion = new mysqli("localhost", "root", "", "piso_manager");

if ($conexion->connect_error) {
    echo json_encode([
        "success" => false,
        "error" => "Error de conexión"
    ]);
    exit;
}

$id_piso = 1;

$sql = "SELECT calle, ciudad, codigo_postal FROM pisos WHERE id_piso = ?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();

$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {
    $piso = $resultado->fetch_assoc();

    echo json_encode([
        "success" => true,
        "piso" => $piso
    ]);
} else {
    echo json_encode([
        "success" => false,
        "error" => "No se encontró el piso"
    ]);
}

$stmt->close();
$conexion->close();
?>