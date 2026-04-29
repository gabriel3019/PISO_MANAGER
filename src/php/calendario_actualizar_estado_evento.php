<?php
header('Content-Type: application/json');
require_once '../BBDD/conecta.php';

$data = json_decode(file_get_contents("php://input"), true);

$id_evento = isset($data['id_evento']) ? (int)$data['id_evento'] : 0;
$estado = trim($data['estado'] ?? '');

if ($id_evento <= 0 || $estado === '') {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$sql = "UPDATE calendario_eventos SET estado = ? WHERE id_evento = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $estado, $id_evento);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Estado actualizado']);
} else {
    echo json_encode(['success' => false, 'message' => 'No se pudo actualizar']);
}

$stmt->close();
$conn->close();
?>