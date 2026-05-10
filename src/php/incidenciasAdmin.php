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

    case 'responder':
        $id_incidencia = $_POST['id_incidencia'] ?? null;
        $id_admin = $_POST['id_usuario'] ?? null;
        $mensaje = trim($_POST['mensaje'] ?? '');

        if (!$id_incidencia || !$id_admin || $mensaje === '') {
            echo json_encode(['success' => false, 'error' => 'Faltan datos']);
            exit;
        }

        // 1. Guardar mensaje del admin
        $stmt = $conn->prepare("
        INSERT INTO incidencia_mensajes 
        (id_incidencia, id_usuario, mensaje)
        VALUES (?, ?, ?)
    ");

        $stmt->bind_param("iis", $id_incidencia, $id_admin, $mensaje);

        if (!$stmt->execute()) {
            echo json_encode(['success' => false, 'error' => $stmt->error]);
            exit;
        }

        $stmt->close();

        // 2. Cambiar incidencia a en_proceso
        $stmt = $conn->prepare("
        UPDATE incidencias
        SET estado = 'en_proceso'
        WHERE id_incidencia = ?
    ");

        $stmt->bind_param("i", $id_incidencia);
        $stmt->execute();
        $stmt->close();

        // 3. Obtener usuario dueño de la incidencia
        $stmt = $conn->prepare("
        SELECT id_usuario
        FROM incidencias
        WHERE id_incidencia = ?
    ");

        $stmt->bind_param("i", $id_incidencia);
        $stmt->execute();
        $result = $stmt->get_result();
        $incidencia = $result->fetch_assoc();
        $stmt->close();

        if ($incidencia) {
            $id_usuario = $incidencia['id_usuario'];

            // 4. Crear notificación al usuario
            $textoNotificacion = "El administrador ha respondido a tu incidencia.";

            $stmt = $conn->prepare("
            INSERT INTO notificaciones 
            (id_usuario, id_incidencia, mensaje)
            VALUES (?, ?, ?)
        ");

            $stmt->bind_param("iis", $id_usuario, $id_incidencia, $textoNotificacion);
            $stmt->execute();
            $stmt->close();
        }

        echo json_encode([
            'success' => true,
            'message' => 'Respuesta enviada correctamente'
        ]);
        break;

    case 'mensajes':
        $id_incidencia = $_GET['id_incidencia'] ?? null;

        if (!$id_incidencia) {
            echo json_encode(['success' => false, 'error' => 'Falta id_incidencia']);
            exit;
        }

        $stmt = $conn->prepare("
        SELECT 
            m.id_mensaje,
            m.id_incidencia,
            m.id_usuario,
            u.nombre,
            m.mensaje,
            m.fecha_envio
        FROM incidencia_mensajes m
        INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
        WHERE m.id_incidencia = ?
        ORDER BY m.fecha_envio ASC
    ");

        $stmt->bind_param("i", $id_incidencia);
        $stmt->execute();

        $result = $stmt->get_result();
        $mensajes = [];

        while ($row = $result->fetch_assoc()) {
            $mensajes[] = $row;
        }

        $stmt->close();

        echo json_encode([
            'success' => true,
            'mensajes' => $mensajes
        ]);
        break;

    case 'resolver':
        $id_incidencia = $_POST['id_incidencia'] ?? null;

        if (!$id_incidencia) {
            echo json_encode(['success' => false, 'error' => 'Falta id_incidencia']);
            exit;
        }

        // 1. Marcar incidencia como finalizada
        $stmt = $conn->prepare("
        UPDATE incidencias
        SET estado = 'finalizada'
        WHERE id_incidencia = ?
    ");

        $stmt->bind_param("i", $id_incidencia);

        if (!$stmt->execute()) {
            echo json_encode(['success' => false, 'error' => $stmt->error]);
            exit;
        }

        $stmt->close();

        // 2. Obtener usuario dueño de la incidencia
        $stmt = $conn->prepare("
        SELECT id_usuario
        FROM incidencias
        WHERE id_incidencia = ?
    ");

        $stmt->bind_param("i", $id_incidencia);
        $stmt->execute();
        $result = $stmt->get_result();
        $incidencia = $result->fetch_assoc();
        $stmt->close();

        if ($incidencia) {
            $id_usuario = $incidencia['id_usuario'];
            $textoNotificacion = "Tu incidencia ha sido marcada como resuelta.";

            $stmt = $conn->prepare("
            INSERT INTO notificaciones 
            (id_usuario, id_incidencia, mensaje)
            VALUES (?, ?, ?)
        ");

            $stmt->bind_param("iis", $id_usuario, $id_incidencia, $textoNotificacion);
            $stmt->execute();
            $stmt->close();
        }

        echo json_encode([
            'success' => true,
            'message' => 'Incidencia marcada como resuelta'
        ]);
        break;

        

    default:
        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        break;
}

$conn->close();
