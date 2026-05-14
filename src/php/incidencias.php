<?php
header('Content-Type: application/json');
ini_set('display_errors', 0);
require_once("BBDD/conecta.php");

if (isset($_POST['id'])) $_POST['id'] = intval($_POST['id']);

$accion = $_REQUEST['accion'] ?? '';

// Helper para normalizar urgencia (JS envía "bajo"/"alto", la BD usa "baja"/"alta")
function normalizarUrgencia($raw)
{
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
        $stmt->bind_param(
            "iissssssiss",
            $id_piso,
            $id_usuario,
            $tipo,
            $titulo,
            $descripcion,
            $urgencia,
            $estado,
            $imagen_path,
            $notificar_admin,
            $fecha_inicio,
            $fecha_fin
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
            $stmt->bind_param(
                "ssssssissi",
                $titulo,
                $descripcion,
                $tipo,
                $urgencia,
                $estado,
                $notificar_admin,
                $fecha_inicio,
                $fecha_fin,
                $imagen_path,
                $id
            );
        } else {
            $stmt = $conn->prepare(
                "UPDATE incidencias
                 SET titulo=?, descripcion=?, tipo=?, urgencia=?, estado=?, notificar_admin=?, fecha_inicio=?, fecha_fin=?
                 WHERE id_incidencia=?"
            );
            // sssss=titulo,desc,tipo,urgencia,estado | i=notificar | ss=fechas | i=id
            $stmt->bind_param(
                "sssssissi",
                $titulo,
                $descripcion,
                $tipo,
                $urgencia,
                $estado,
                $notificar_admin,
                $fecha_inicio,
                $fecha_fin,
                $id
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
        $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;

        if ($id <= 0) {
            echo json_encode(['success' => false, 'error' => 'ID no válido']);
            exit;
        }

        try {
            // 1. Borrar mensajes relacionados
            $stmtM = $conn->prepare("DELETE FROM incidencia_mensajes WHERE id_incidencia = ?");
            $stmtM->bind_param("i", $id);
            $stmtM->execute();
            $stmtM->close();

            // 2. Borrar notificaciones relacionadas (El error actual viene de aquí)
            $stmtN = $conn->prepare("DELETE FROM notificaciones WHERE id_incidencia = ?");
            $stmtN->bind_param("i", $id);
            $stmtN->execute();
            $stmtN->close();

            // 3. (Opcional) Si tienes otra tabla como 'fotos_incidencia', añádela aquí también

            // 4. Borrar la incidencia principal
            $stmt2 = $conn->prepare("DELETE FROM incidencias WHERE id_incidencia = ?");
            if ($stmt2) {
                $stmt2->bind_param("i", $id);
                if ($stmt2->execute()) {
                    echo json_encode(['success' => true]);
                } else {
                    echo json_encode(['success' => false, 'error' => $stmt2->error]);
                }
                $stmt2->close();
            }
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()]);
        }
        break;

    // ═══════════════════════════════════════════════════════════════
    // CASE: obtener_notificaciones_usuario
    // ═══════════════════════════════════════════════════════════════
    case 'obtener_notificaciones_usuario':
        $id_usuario = intval($_REQUEST['id_usuario'] ?? 0);
        if (!$id_usuario) {
            echo json_encode(['success' => false, 'error' => 'Falta id_usuario']);
            exit;
        }

        // Obtener notificaciones no leídas del usuario, con datos de la incidencia
        $stmt = $conn->prepare("
            SELECT 
                n.id_notificacion,
                n.id_incidencia,
                n.mensaje,
                n.leida,
                n.fecha_creacion,
                i.titulo,
                i.tipo,
                i.urgencia,
                i.estado
            FROM notificaciones n
            INNER JOIN incidencias i ON n.id_incidencia = i.id_incidencia
            WHERE n.id_usuario = ?
            AND n.leida = 0
            ORDER BY n.fecha_creacion DESC
            LIMIT 50
        ");
        $stmt->bind_param("i", $id_usuario);
        $stmt->execute();
        $result = $stmt->get_result();

        $notificaciones = [];
        while ($row = $result->fetch_assoc()) {
            $notificaciones[] = $row;
        }
        $stmt->close();

        echo json_encode([
            'success' => true,
            'notificaciones' => $notificaciones,
            'total' => count($notificaciones)
        ]);
        break;

    // ═══════════════════════════════════════════════════════════════
    // CASE: marcar_notificacion_usuario_leida
    // ═══════════════════════════════════════════════════════════════
    case 'marcar_notificacion_usuario_leida':
        $id_notificacion = intval($_POST['id_notificacion'] ?? 0);
        $id_usuario = intval($_POST['id_usuario'] ?? 0);

        if (!$id_notificacion || !$id_usuario) {
            echo json_encode(['success' => false, 'error' => 'Faltan datos']);
            exit;
        }

        // Verificar que la notificación pertenece al usuario
        $stmt = $conn->prepare("
            UPDATE notificaciones 
            SET leida = 1 
            WHERE id_notificacion = ? AND id_usuario = ?
        ");
        $stmt->bind_param("ii", $id_notificacion, $id_usuario);

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        $stmt->close();
        break;

    // ═══════════════════════════════════════════════════════════════
    // CASE: obtener_incidencia (NUEVO - para el chat)
    // ═══════════════════════════════════════════════════════════════
    case 'obtener_incidencia':
        $id = intval($_GET['id'] ?? 0);

        if (!$id) {
            echo json_encode(['success' => false, 'error' => 'Falta id de incidencia']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT * FROM incidencias 
            WHERE id_incidencia = ?
        ");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $incidencia = $result->fetch_assoc();
        $stmt->close();

        if ($incidencia) {
            echo json_encode(['success' => true, 'incidencia' => $incidencia]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Incidencia no encontrada']);
        }
        break;

    // ═══════════════════════════════════════════════════════════════
    // CASE: obtener_mensajes_incidencia (NUEVO - para el chat)
    // ═══════════════════════════════════════════════════════════════
    case 'obtener_mensajes_incidencia':
        $id_incidencia = intval($_GET['id_incidencia'] ?? 0);

        if (!$id_incidencia) {
            echo json_encode(['success' => false, 'error' => 'Falta id_incidencia']);
            exit;
        }

        // UNION de ambas tablas de mensajes: usuario y admin
        $stmt = $conn->prepare("
            SELECT 
                m.id_mensaje,
                m.id_incidencia,
                m.id_usuario,
                u.nombre,
                m.mensaje,
                m.fecha AS fecha_envio,
                'usuario' AS origen
            FROM mensajes_incidencia m
            INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
            WHERE m.id_incidencia = ?
            
            UNION ALL
            
            SELECT 
                m.id_mensaje,
                m.id_incidencia,
                m.id_usuario,
                u.nombre,
                m.mensaje,
                m.fecha_envio,
                'admin' AS origen
            FROM incidencia_mensajes m
            INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
            WHERE m.id_incidencia = ?
            
            ORDER BY fecha_envio ASC
        ");

        $stmt->bind_param("ii", $id_incidencia, $id_incidencia);
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

    // ═══════════════════════════════════════════════════════════════
    // CASE: enviar_mensaje_admin (NUEVO - para responder desde usuario)
    // ═══════════════════════════════════════════════════════════════
    case 'enviar_mensaje_admin':
        $id_incidencia = intval($_POST['id_incidencia'] ?? 0);
        $id_usuario = intval($_POST['id_usuario'] ?? 0);
        $mensaje = trim($_POST['mensaje'] ?? '');

        if (!$id_incidencia || !$id_usuario || !$mensaje) {
            echo json_encode(['success' => false, 'error' => 'Faltan datos obligatorios']);
            exit;
        }

        // Insertar mensaje en la tabla de usuario -> admin
        $stmt = $conn->prepare("
            INSERT INTO mensajes_incidencia (id_incidencia, id_usuario, mensaje)
            VALUES (?, ?, ?)
        ");

        $stmt->bind_param("iis", $id_incidencia, $id_usuario, $mensaje);

        if ($stmt->execute()) {
            // Opcional: crear notificación al admin si no existe
            // (ya se crea desde el lado admin cuando responde, pero podemos asegurar)

            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => $stmt->error]);
        }
        $stmt->close();
        break;

    // ═══════════════════════════════════════════════════════════════
    // CASE: obtener_conversacion_segura (VALIDACIÓN DE SEGURIDAD)
    // ═══════════════════════════════════════════════════════════════
    case 'obtener_conversacion_segura':
        // 🔐 Usar sesión para identificar al usuario (NO confiar en POST/GET)
        session_start();
        $id_usuario_logueado = $_SESSION['id_usuario'] ?? $_SESSION['user_id'] ?? 0;

        $id_incidencia = intval($_GET['id_incidencia'] ?? 0);

        if (!$id_incidencia || !$id_usuario_logueado) {
            echo json_encode(['success' => false, 'error' => 'Datos inválidos']);
            exit;
        }

        // 1️⃣ Verificar que la incidencia existe, pertenece al usuario Y tiene notificar_admin=1
        $stmt = $conn->prepare("
        SELECT id_usuario, notificar_admin, estado 
        FROM incidencias 
        WHERE id_incidencia = ?
    ");
        $stmt->bind_param("i", $id_incidencia);
        $stmt->execute();
        $result = $stmt->get_result();
        $incidencia = $result->fetch_assoc();
        $stmt->close();

        // 🔒 Validación CRÍTICA: ownership + flag admin
        if (
            !$incidencia ||
            $incidencia['id_usuario'] != $id_usuario_logueado ||
            !$incidencia['notificar_admin']
        ) {
            echo json_encode(['success' => false, 'error' => 'Acceso denegado']);
            exit;
        }

        // 2️⃣ Obtener mensajes combinados (tu lógica UNION ya es correcta)
        $stmt = $conn->prepare("
        SELECT 
            m.id_mensaje,
            m.id_incidencia,
            m.id_usuario,
            u.nombre,
            m.mensaje,
            m.fecha AS fecha_envio,
            'usuario' AS origen
        FROM mensajes_incidencia m
        INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
        WHERE m.id_incidencia = ?
        
        UNION ALL
        
        SELECT 
            m.id_mensaje,
            m.id_incidencia,
            m.id_usuario,
            u.nombre,
            m.mensaje,
            m.fecha_envio,
            'admin' AS origen
        FROM incidencia_mensajes m
        INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
        WHERE m.id_incidencia = ?
        
        ORDER BY fecha_envio ASC
    ");
        $stmt->bind_param("ii", $id_incidencia, $id_incidencia);
        $stmt->execute();
        $result = $stmt->get_result();

        $mensajes = [];
        while ($row = $result->fetch_assoc()) {
            $mensajes[] = $row;
        }
        $stmt->close();

        echo json_encode([
            'success' => true,
            'mensajes' => $mensajes,
            'estado_incidencia' => $incidencia['estado']
        ]);
        break;

    default:
        error_log("ACCIÓN NO VÁLIDA RECIBIDA: $accion | POST: " . print_r($_POST, true));
        echo json_encode([
            'success'     => false,
            'error'       => 'Acción no válida',
            'debug_accion' => $accion
        ]);
        break;
}

$conn->close();
