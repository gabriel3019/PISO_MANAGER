<?php
header('Content-Type: application/json');
require_once("BBDD/conecta.php");

$accion = $_REQUEST['accion'] ?? '';

switch ($accion) {

    case 'listar':
        $id_piso = $_REQUEST['id_piso'] ?? null;

        if (!$id_piso) {
            echo json_encode(['success' => false, 'error' => 'Falta id_piso']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT 
                i.*,
                u.nombre AS usuario
            FROM incidencias i
            INNER JOIN usuarios u ON i.id_usuario = u.id_usuario
            WHERE i.id_piso = ?
            ORDER BY i.id_incidencia DESC
        ");

        $stmt->bind_param("i", $id_piso);
        $stmt->execute();

        $result = $stmt->get_result();
        $incidencias = [];

        while ($row = $result->fetch_assoc()) {
            $row['id'] = $row['id_incidencia'];
            $incidencias[] = $row;
        }

        echo json_encode([
            'success' => true,
            'incidencias' => $incidencias
        ]);
        break;


    case 'cambiar_estado':
        $id = $_POST['id'] ?? null;
        $estado = $_POST['estado'] ?? null;

        $estadosPermitidos = ['creada', 'en_proceso', 'finalizada'];

        if (!$id || !$estado) {
            echo json_encode(['success' => false, 'error' => 'Faltan datos']);
            exit;
        }

        if (!in_array($estado, $estadosPermitidos)) {
            echo json_encode(['success' => false, 'error' => 'Estado no válido']);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE incidencias
            SET estado = ?
            WHERE id_incidencia = ?
        ");

        $stmt->bind_param("si", $estado, $id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }

        $stmt->close();
        break;


    default:
        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        break;
}

$conn->close();
?>