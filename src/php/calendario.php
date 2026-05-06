<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/BBDD/conecta.php';
mysqli_report(MYSQLI_REPORT_OFF);

$action = $_GET['action'] ?? $_POST['action'] ?? '';

$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents("php://input");
    $input = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $input = [];
    }
}

try {
    switch ($action) {
        case 'obtener':
            obtenerEventos($conn);
            break;

        case 'crear':
            crearEvento($conn, $input);
            break;

        case 'actualizar_estado':
            actualizarEstadoEvento($conn, $input);
            break;

        case 'eliminar':
            eliminarEvento($conn, $input);
            break;

        case 'eliminar_futuras':
            eliminarTareasFuturas($conn, $input);
            break;

        default:
            echo json_encode([
                'success' => false,
                'message' => 'Acción no válida'
            ]);
            break;
    }
} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error interno: ' . $e->getMessage()
    ]);
}

$conn->close();


function obtenerEventos($conn)
{
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
        ORDER BY COALESCE(e.fecha_inicio, e.fecha), e.hora, e.id_evento
    ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => 'Error en prepare obtener: ' . $conn->error
        ]);
        return;
    }

    $stmt->bind_param("i", $id_piso);

    if (!$stmt->execute()) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al ejecutar obtener: ' . $stmt->error
        ]);
        $stmt->close();
        return;
    }

    $result = $stmt->get_result();
    $eventosAgrupados = [];

    while ($row = $result->fetch_assoc()) {
        $id = $row['id_evento'];

        if (!isset($eventosAgrupados[$id])) {
            $eventosAgrupados[$id] = [
                'id_evento'   => (int)$row['id_evento'],
                'titulo'      => $row['titulo'],
                'tipo'        => $row['tipo'],
                'fecha'       => $row['fecha'],
                'fechaInicio' => $row['fecha_inicio'],
                'fechaFin'    => $row['fecha_fin'],
                'hora'        => $row['hora'],
                'estado'      => $row['estado'],
                'persona'     => null,
                'personas'    => []
            ];
        }

        if (!empty($row['persona'])) {
            $eventosAgrupados[$id]['personas'][] = $row['persona'];

            if ($row['tipo'] === 'tarea' && $eventosAgrupados[$id]['persona'] === null) {
                $eventosAgrupados[$id]['persona'] = $row['persona'];
            }
        }
    }

    $stmt->close();

    echo json_encode([
        'success' => true,
        'eventos' => array_values($eventosAgrupados)
    ]);
}


function crearEvento($conn, $data)
{
    $id_piso = 1;

    $titulo = trim($data['titulo'] ?? '');
    $tipo = trim($data['tipo'] ?? '');
    $fecha = $data['fecha'] ?? null;
    $fechaInicio = $data['fechaInicio'] ?? null;
    $fechaFin = $data['fechaFin'] ?? null;
    $hora = $data['hora'] ?? null;
    $estado = $data['estado'] ?? null;
    $personas = $data['personas'] ?? [];

    if ($titulo === '' || $tipo === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan campos obligatorios'
        ]);
        return;
    }

    $sql = "INSERT INTO calendario_eventos 
            (id_piso, titulo, tipo, fecha, fecha_inicio, fecha_fin, hora, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => 'Error en prepare crear: ' . $conn->error
        ]);
        return;
    }

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
        echo json_encode([
            'success' => false,
            'message' => 'Error al guardar: ' . $stmt->error
        ]);
        $stmt->close();
        return;
    }

    $id_evento = $stmt->insert_id;
    $stmt->close();

    if (!empty($personas) && is_array($personas)) {
        $sqlPersona = "INSERT INTO calendario_evento_personas (id_evento, id_usuario) VALUES (?, ?)";
        $stmtPersona = $conn->prepare($sqlPersona);

        if (!$stmtPersona) {
            echo json_encode([
                'success' => false,
                'message' => 'Error en prepare personas: ' . $conn->error
            ]);
            return;
        }

        foreach ($personas as $id_usuario) {
            $id_usuario = (int)$id_usuario;
            $stmtPersona->bind_param("ii", $id_evento, $id_usuario);
            $stmtPersona->execute();
        }

        $stmtPersona->close();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Evento creado correctamente'
    ]);
}


function actualizarEstadoEvento($conn, $data)
{
    $id_evento = isset($data['id_evento']) ? (int)$data['id_evento'] : 0;
    $estado = trim($data['estado'] ?? '');

    if ($id_evento <= 0 || $estado === '') {
        echo json_encode([
            'success' => false,
            'message' => 'Datos incompletos'
        ]);
        return;
    }

    $sql = "UPDATE calendario_eventos SET estado = ? WHERE id_evento = ?";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo json_encode([
            'success' => false,
            'message' => 'Error en prepare actualizar: ' . $conn->error
        ]);
        return;
    }

    $stmt->bind_param("si", $estado, $id_evento);

    if (!$stmt->execute()) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar: ' . $stmt->error
        ]);
        $stmt->close();
        return;
    }

    $stmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Estado actualizado'
    ]);
}

function eliminarEvento($conn, $data)
{
    $id_evento = isset($data['id_evento']) ? (int)$data['id_evento'] : 0;

    if ($id_evento <= 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Falta el id del evento.'
        ]);
        return;
    }

    $stmtPersonas = $conn->prepare("DELETE FROM calendario_evento_personas WHERE id_evento = ?");
    $stmtPersonas->bind_param("i", $id_evento);
    $stmtPersonas->execute();
    $stmtPersonas->close();

    $stmt = $conn->prepare("DELETE FROM calendario_eventos WHERE id_evento = ?");
    $stmt->bind_param("i", $id_evento);
    $stmt->execute();
    $stmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Evento eliminado correctamente.'
    ]);
}

function eliminarTareasFuturas($conn, $data)
{
    $titulo = trim($data['titulo'] ?? '');
    $tipo = trim($data['tipo'] ?? '');
    $fecha = $data['fecha'] ?? null;

    if ($titulo === '' || $tipo !== 'tarea' || !$fecha) {
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos para eliminar tareas futuras.'
        ]);
        return;
    }

    $stmtIds = $conn->prepare("
        SELECT id_evento 
        FROM calendario_eventos
        WHERE tipo = 'tarea'
        AND titulo = ?
        AND fecha >= ?
        AND estado != 'completada'
    ");

    $stmtIds->bind_param("ss", $titulo, $fecha);
    $stmtIds->execute();

    $resultado = $stmtIds->get_result();
    $ids = [];

    while ($fila = $resultado->fetch_assoc()) {
        $ids[] = (int)$fila['id_evento'];
    }

    $stmtIds->close();

    foreach ($ids as $id_evento) {
        $stmtPersonas = $conn->prepare("DELETE FROM calendario_evento_personas WHERE id_evento = ?");
        $stmtPersonas->bind_param("i", $id_evento);
        $stmtPersonas->execute();
        $stmtPersonas->close();

        $stmtEvento = $conn->prepare("DELETE FROM calendario_eventos WHERE id_evento = ?");
        $stmtEvento->bind_param("i", $id_evento);
        $stmtEvento->execute();
        $stmtEvento->close();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Tareas futuras eliminadas correctamente.'
    ]);
}