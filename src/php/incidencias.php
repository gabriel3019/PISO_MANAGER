<?php
header('Content-Type: application/json');
require_once("BBDD/conecta.php");

$accion = $_REQUEST['accion'] ?? '';

// Helper para normalizar urgencia (JS envía "bajo"/"alto", la BD usa "baja"/"alta")
function normalizarUrgencia($raw) {
    $map = ['bajo' => 'baja', 'alto' => 'alta', 'medio' => 'media'];
    return isset($map[$raw]) ? $map[$raw] : 'baja';
}

switch ($accion) {

    case 'listar':
        $id_piso = $_REQUEST['id_piso'] ?? null;
        if (!$id_piso) {
            echo json_encode(['success' => false, 'error' => 'Falta id_piso']);
            exit;
        }

        // ✅ Se añade subquery para traer el último comentario de admin
        $result = $conn->query("
            SELECT i.*,
                   (SELECT mensaje 
                    FROM mensajes_incidencia 
                    WHERE id_incidencia = i.id_incidencia 
                    ORDER BY id_mensaje DESC 
                    LIMIT 1) AS comentario_admin
            FROM incidencias i
            WHERE i.id_piso = $id_piso
            ORDER BY i.id_incidencia DESC
        ");
        $incidencias = [];

        while ($row = $result->fetch_assoc()) {
            $row['id'] = $row['id_incidencia'];
            $incidencias[] = $row;
        }
        echo json_encode($incidencias);
        break;

    case 'crear':
        $id_piso         = $_POST['id_piso']         ?? 1;
        $id_usuario      = $_POST['id_usuario']      ?? 1;
        $tipo            = $_POST['tipo']            ?? '';
        $titulo          = $_POST['titulo']          ?? '';
        $descripcion     = $_POST['descripcion']     ?? '';
        $urgencia_raw    = $_POST['urgencia']        ?? 'bajo';
        $urgencia        = normalizarUrgencia($urgencia_raw);
        $notificar_admin = (int)($_POST['notificar_admin'] ?? 0);
        $estado          = 'abierta';

        $fecha_inicio  = $_POST['fecha_inicio']  ?? null;
        $fecha_fin     = !empty($_POST['fecha_fin']) ? $_POST['fecha_fin'] : null;

        // Validación servidor: fecha_inicio es obligatorio y >= hoy
        $hoy = date('Y-m-d');
        if (!$fecha_inicio || $fecha_inicio < $hoy) {
            echo json_encode(['success' => false, 'error' => 'La fecha de inicio es obligatoria y no puede ser anterior a hoy']);
            exit;
        }

        // Procesar imagen
        $imagen_path = null;
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $dir = '../uploads/incidencias/';
            if (!is_dir($dir)) mkdir($dir, 0755, true);

            $ext     = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp'];

            if (in_array($ext, $allowed)) {
                $nombre = uniqid('inc_') . '.' . $ext;
                if (move_uploaded_file($_FILES['imagen']['tmp_name'], $dir . $nombre)) {
                    $imagen_path = $dir . $nombre;
                }
            }
        }

        $stmt = $conn->prepare(
            "INSERT INTO incidencias
             (id_piso, id_usuario, tipo, titulo, descripcion, urgencia, estado, imagen, notificar_admin, fecha_inicio, fecha_fin)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("iissssssiss",
            $id_piso, $id_usuario, $tipo, $titulo, $descripcion, 
            $urgencia, $estado, $imagen_path, $notificar_admin, 
            $fecha_inicio, $fecha_fin
        );

        if ($stmt->execute()) {
            $id_incidencia = $stmt->insert_id;

            // ✅ Si hay comentario de admin, guardarlo en mensajes_incidencia
            if (!empty($_POST['comentario_admin']) && !empty($_POST['id_usuario_comentario'])) {
                $comentario = trim($_POST['comentario_admin']);
                $id_usuario_comentario = (int)$_POST['id_usuario_comentario'];
                
                $stmt_msg = $conn->prepare(
                    "INSERT INTO mensajes_incidencia (id_incidencia, id_usuario, mensaje) VALUES (?, ?, ?)"
                );
                $stmt_msg->bind_param("iis", $id_incidencia, $id_usuario_comentario, $comentario);
                $stmt_msg->execute();
                $stmt_msg->close();
            }

            echo json_encode(['success' => true, 'id' => $id_incidencia]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        $stmt->close();
        break;

    case 'editar':
        $id              = $_POST['id']             ?? null;
        $titulo          = $_POST['titulo']         ?? '';
        $descripcion     = $_POST['descripcion']    ?? '';
        $tipo            = $_POST['tipo']           ?? '';
        $urgencia_raw    = $_POST['urgencia']       ?? 'bajo';
        $urgencia        = normalizarUrgencia($urgencia_raw);
        $notificar_admin = (int)($_POST['notificar_admin'] ?? 0);

        $fecha_inicio  = $_POST['fecha_inicio'] ?? null;
        $fecha_fin     = !empty($_POST['fecha_fin']) ? $_POST['fecha_fin'] : null;
        
        if ($fecha_inicio) {
            $hoy = date('Y-m-d');
            if ($fecha_inicio < $hoy) {
                echo json_encode(['success' => false, 'error' => 'La fecha de inicio no puede ser anterior a hoy']);
                exit;
            }
        }

        // Procesar imagen si se sube una nueva
        $imagen_path = null;
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $dir = '../uploads/incidencias/';
            if (!is_dir($dir)) mkdir($dir, 0755, true);

            $ext     = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp'];

            if (in_array($ext, $allowed)) {
                $nombre = uniqid('inc_') . '.' . $ext;
                if (move_uploaded_file($_FILES['imagen']['tmp_name'], $dir . $nombre)) {
                    $imagen_path = $dir . $nombre;
                }
            }
        }

        if ($imagen_path) {
            $stmt = $conn->prepare(
                "UPDATE incidencias
                 SET titulo=?, descripcion=?, tipo=?, urgencia=?, notificar_admin=?, fecha_inicio=?, fecha_fin=?, imagen=?
                 WHERE id_incidencia=?"
            );
            $stmt->bind_param("ssssisssi", 
                $titulo, $descripcion, $tipo, $urgencia, $notificar_admin, 
                $fecha_inicio, $fecha_fin, $imagen_path, $id
            );
        } else {
            $stmt = $conn->prepare(
                "UPDATE incidencias
                 SET titulo=?, descripcion=?, tipo=?, urgencia=?, notificar_admin=?, fecha_inicio=?, fecha_fin=?
                 WHERE id_incidencia=?"
            );
            $stmt->bind_param("ssssissi", 
                $titulo, $descripcion, $tipo, $urgencia, $notificar_admin, 
                $fecha_inicio, $fecha_fin, $id
            );
        }

        if ($stmt->execute()) {
            // ✅ Si hay comentario de admin, guardarlo en mensajes_incidencia
            if (!empty($_POST['comentario_admin']) && !empty($_POST['id_usuario_comentario'])) {
                $comentario = trim($_POST['comentario_admin']);
                $id_usuario_comentario = (int)$_POST['id_usuario_comentario'];
                
                $stmt_msg = $conn->prepare(
                    "INSERT INTO mensajes_incidencia (id_incidencia, id_usuario, mensaje) VALUES (?, ?, ?)"
                );
                $stmt_msg->bind_param("iis", $id, $id_usuario_comentario, $comentario);
                $stmt_msg->execute();
                $stmt_msg->close();
            }
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        $stmt->close();
        break;

    case 'eliminar':
        $id   = $_POST['id'] ?? null;
        $stmt = $conn->prepare("DELETE FROM incidencias WHERE id_incidencia = ?");
        $stmt->bind_param("i", $id);

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