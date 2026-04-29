<?php
header('Content-Type: application/json');
require_once '../BBDD/conecta.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Datos no válidos']);
    exit;
}

$id_piso = 1; // luego esto lo ideal es sacarlo de sesión
$titulo = trim($data['titulo'] ?? '');
$tipo = $data['tipo'] ?? '';
$fecha = $data['fecha'] ?? null;
$fechaInicio = $data['fechaInicio'] ?? null;
$fechaFin = $data['fechaFin'] ?? null;
$hora = $data['hora'] ?? null;
$estado = $data['estado'] ?? null;
$personas = $data['personas'] ?? [];

if ($titulo === '' || $tipo === '') {
    echo json_encode(['success' => false, 'message' => 'Faltan campos obligatorios']);
    exit;
}

$sql = "INSERT INTO calendario_eventos (id_piso, titulo, tipo, fecha, fecha_inicio, fecha_fin, hora, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param(
    "isssssss",
    $id_piso,
    $titulo,
    $tipo,
    $fecha,
    $fechaInicio,
    $fechaFin,
    $hora,
    $estado
);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'message' => 'Error al guardar el evento']);
    exit;
}

$id_evento = $stmt->insert_id;
$stmt->close();

if (!empty($personas)) {
    $sqlPersona = "INSERT INTO calendario_evento_personas (id_evento, id_usuario) VALUES (?, ?)";
    $stmtPersona = $conn->prepare($sqlPersona);

    foreach ($personas as $id_usuario) {
        $stmtPersona->bind_param("ii", $id_evento, $id_usuario);
        $stmtPersona->execute();
    }

    $stmtPersona->close();
}

echo json_encode([
    'success' => true,
    'message' => 'Evento creado correctamente'
]);

$conn->close();
?>