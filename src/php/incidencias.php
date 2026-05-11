<?php
header('Content-Type: application/json');
ini_set('display_errors', 0); // ← Evita que errores PHP rompan el JSON
require_once("BBDD/conecta.php");

if (isset($_POST['id'])) $_POST['id'] = intval($_POST['id']);

$accion = $_REQUEST['accion'] ?? '';

// Helper para normalizar urgencia (JS envía "bajo"/"alto", la BD usa "baja"/"alta")
function normalizarUrgencia($raw) {
    $map = ['bajo' => 'baja', 'alto' => 'alta', 'medio' => 'media'];
    // Si ya viene en forma femenina (desde editar con valor guardado), lo devolvemos tal cual
    if (in_array($raw, ['baja', 'media', 'alta'])) return $raw;
    return isset($map[$raw]) ? $map[$raw] : 'baja';
}

switch ($accion) {

    case 'listar':
        $id_piso = intval($_REQUEST['id_piso'] ?? 0);
        if (!$id_piso) {
            echo json_encode(['success' => false, 'error' => 'Falta id_piso']);
            exit;
        }

        // Subquery para traer el último comentario de admin, con prepare para seguridad
        $stmt = $conn->prepare("
            SELECT i.*,
                   (SELECT mensaje 
                    FROM mensajes_incidencia 
                    WHERE id_incidencia = i.id_incidencia 
                    ORDER BY id_mensaje DESC 
                    LIMIT 1) AS comentario_admin
            FROM incidencias i
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
        echo json_encode($incidencias);
        $stmt->close();
        break;

    case 'crear':
        $id_piso         = intval($_POST['id_piso']    ?? 1);
        $id_usuario      = intval($_POST['id_usuario'] ?? 1);
        $tipo            = trim($_POST['tipo']         ?? '');
        $titulo          = trim($_POST['titulo']       ?? '');
        $descripcion     = trim($_POST['descripcion']  ?? '');
        $urgencia_raw    = $_POST['urgencia']          ?? 'baja';
        $urgencia        = normalizarUrgencia($urgencia_raw);
        $notificar_admin = (int)($_POST['notificar_admin'] ?? 0);
        $estado          = 'abierta'; // Siempre empieza como abierta
        $fecha_inicio    = $_POST['fecha_inicio'] ?? null;
        $fecha_fin       = !empty($_POST['fecha_fin']) ? $_POST['fecha_fin'] : null;

        // Validación servidor
        $hoy = date('Y-m-d');
        if (!$fecha_inicio || $fecha_inicio < $hoy) {
            echo json_encode(['success' => false, 'error' => 'La fecha de inicio es obligatoria y no puede ser anterior a hoy']);
            exit;
        }

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
        // ii=id_piso,id_usuario | sssss=tipo,titulo,desc,urgencia,estado | s=imagen | i=notificar | ss=fechas
        $stmt->bind_param("iissssssiss",
            $id_piso, $id_usuario, $tipo, $titulo, $descripcion,
            $urgencia, $estado, $imagen_path, $notificar_admin,
            $fecha_inicio, $fecha_fin
        );

        if ($stmt->execute()) {
            $id_incidencia = $stmt->insert_id;

            if (!empty($_POST['comentario_admin']) && !empty($_POST['id_usuario_comentario'])) {
                $comentario            = trim($_POST['comentario_admin']);
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
        $id          = intval($_POST['id']          ?? 0);
        $titulo      = trim($_POST['titulo']        ?? '');
        $descripcion = trim($_POST['descripcion']   ?? '');
        $tipo        = trim($_POST['tipo']          ?? '');

        // Validar estado: solo valores del ENUM
        $estado_raw = $_POST['estado'] ?? 'abierta';
        $estado     = in_array($estado_raw, ['abierta', 'en_curso', 'resuelta'])
                        ? $estado_raw : 'abierta';

        // Validar urgencia: normalizar y luego verificar
        $urgencia_raw = $_POST['urgencia'] ?? 'baja';
        $urgencia     = normalizarUrgencia($urgencia_raw);

        $notificar_admin = (int)($_POST['notificar_admin'] ?? 0);
        $fecha_inicio    = $_POST['fecha_inicio'] ?? null;
        $fecha_fin       = !empty($_POST['fecha_fin']) ? $_POST['fecha_fin'] : null;

        if ($fecha_inicio) {
            $hoy = date('Y-m-d');
            if ($fecha_inicio < $hoy) {
                echo json_encode(['success' => false, 'error' => 'La fecha de inicio no puede ser anterior a hoy']);
                exit;
            }
        }

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
                 SET titulo=?, descripcion=?, tipo=?, urgencia=?, estado=?, notificar_admin=?, fecha_inicio=?, fecha_fin=?, imagen=?
                 WHERE id_incidencia=?"
            );
            // sssss=titulo,desc,tipo,urgencia,estado | i=notificar | ss=fechas | s=imagen | i=id
            $stmt->bind_param("ssssssissi",
                $titulo, $descripcion, $tipo, $urgencia, $estado,
                $notificar_admin, $fecha_inicio, $fecha_fin, $imagen_path, $id
            );
        } else {
            $stmt = $conn->prepare(
                "UPDATE incidencias
                 SET titulo=?, descripcion=?, tipo=?, urgencia=?, estado=?, notificar_admin=?, fecha_inicio=?, fecha_fin=?
                 WHERE id_incidencia=?"
            );
            // sssss=titulo,desc,tipo,urgencia,estado | i=notificar | ss=fechas | i=id
            $stmt->bind_param("sssssissi",
                $titulo, $descripcion, $tipo, $urgencia, $estado,
                $notificar_admin, $fecha_inicio, $fecha_fin, $id
            );
        }

        if ($stmt->execute()) {
            if (!empty($_POST['comentario_admin']) && !empty($_POST['id_usuario_comentario'])) {
                $comentario            = trim($_POST['comentario_admin']);
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
        $id = intval($_POST['id'] ?? 0);

        $stmt = $conn->prepare("SELECT imagen FROM incidencias WHERE id_incidencia = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        $row = $res->fetch_assoc();
        $stmt->close();

        $stmt2 = $conn->prepare("DELETE FROM incidencias WHERE id_incidencia = ?");
        $stmt2->bind_param("i", $id);

        if ($stmt2->execute()) {
            if (!empty($row['imagen']) && file_exists($row['imagen'])) {
                unlink($row['imagen']);
            }
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        $stmt2->close();
        break;

    default:
        error_log("ACCIÓN NO VÁLIDA RECIBIDA: $accion | POST: " . print_r($_POST, true));
        echo json_encode([
            'success'     => false,
            'error'       => 'Acción no válida',
            'debug_accion'=> $accion
        ]);
        break;
}

$conn->close();
?>