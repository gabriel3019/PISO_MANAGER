<?php
header('Content-Type: application/json');
require_once '../BBDD/conecta.php';

$id_piso = isset($_GET['id_piso']) ? (int)$_GET['id_piso'] : 1;

$sql = "
    SELECT 
        e.id_evento,
        e.titulo,
        e.tipo,
        e.fecha,
        e.fecha_inicio,
        e.fecha_fin,
        TIME_FORMAT(e.hora, '%H:%i') AS hora,
        e.estado,
        u.nombre AS persona
    FROM calendario_eventos e
    LEFT JOIN calendario_evento_personas ep ON e.id_evento = ep.id_evento
    LEFT JOIN usuarios u ON ep.id_usuario = u.id_usuario
    WHERE e.id_piso = ?
    ORDER BY e.fecha_inicio, e.fecha, e.hora
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$result = $stmt->get_result();

$eventosAgrupados = [];

while ($row = $result->fetch_assoc()) {
    $id = $row['id_evento'];

    if (!isset($eventosAgrupados[$id])) {
        $eventosAgrupados[$id] = [
            'id_evento' => $row['id_evento'],
            'titulo' => $row['titulo'],
            'tipo' => $row['tipo'],
            'fecha' => $row['fecha'],
            'fechaInicio' => $row['fecha_inicio'],
            'fechaFin' => $row['fecha_fin'],
            'hora' => $row['hora'],
            'estado' => $row['estado'],
            'persona' => null,
            'personas' => []
        ];
    }

    if (!empty($row['persona'])) {
        if ($row['tipo'] === 'tarea') {
            $eventosAgrupados[$id]['persona'] = $row['persona'];
        } else {
            $eventosAgrupados[$id]['personas'][] = $row['persona'];
        }
    }
}

echo json_encode([
    'success' => true,
    'eventos' => array_values($eventosAgrupados)
]);

$stmt->close();
$conn->close();
?>