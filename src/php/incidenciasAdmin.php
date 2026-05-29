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

        $estadosPermitidos = ['abierta', 'en_curso', 'resuelta'];

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

        // 2. Cambiar incidencia a en_curso
        $stmt = $conn->prepare("
        UPDATE incidencias
        SET estado = 'en_curso'
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

    case 'resolver':
        $id_incidencia = $_POST['id_incidencia'] ?? null;

        if (!$id_incidencia) {
            echo json_encode(['success' => false, 'error' => 'Falta id_incidencia']);
            exit;
        }

        // 1. Marcar incidencia como resuelta
        $stmt = $conn->prepare("
        UPDATE incidencias
        SET estado = 'resuelta'
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

    case 'obtener_notificaciones_admin':
        $id_piso = $_GET['id_piso'] ?? null;

        $stmt = $conn->prepare("
        SELECT 
            i.id_incidencia,
            i.titulo,
            i.tipo,
            i.urgencia,
            i.fecha_creacion,
            u.nombre AS usuario_nombre
        FROM incidencias i
        INNER JOIN usuarios u ON i.id_usuario = u.id_usuario
        WHERE i.id_piso = ?
        AND i.notificar_admin = 1
        AND i.leido_admin = 0
        AND i.estado != 'resuelta'
        ORDER BY i.fecha_creacion DESC
    ");

        $stmt->bind_param("i", $id_piso);
        $stmt->execute();

        $result = $stmt->get_result();
        $notificaciones = [];

        while ($row = $result->fetch_assoc()) {
            $notificaciones[] = $row;
        }

        echo json_encode([
            'success' => true,
            'notificaciones' => $notificaciones
        ]);
        break;

    case 'crear':
        $id_piso            = intval($_POST['id_piso']    ?? 1);
        $id_usuario         = intval($_POST['id_usuario'] ?? 1);
        $tipo               = trim($_POST['tipo']         ?? '');
        $titulo             = trim($_POST['titulo']       ?? '');
        $descripcion        = trim($_POST['descripcion']  ?? '');
        $urgencia           = $_POST['urgencia']          ?? 'baja';
        $fecha_inicio       = $_POST['fecha_inicio']      ?? date('Y-m-d');
        $fecha_fin          = $_POST['fecha_fin']         ?? null;
        $notificar_inquilino = 1;
        $estado             = 'abierta';

        // Cuando el admin crea la incidencia no necesita notificarse a sí mismo
        $notificar_admin =
            isset($_POST["notificar_admin"]) ? 1 : 0;

        $leido_admin =
            $notificar_admin ? 0 : 1;

        $imagen_path = null;

        if (!empty($_FILES['imagen']['name'])) {

            if ($_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al subir imagen: ' . $_FILES['imagen']['error']
                ]);
                exit;
            }

            $dir = __DIR__ . '/../uploads/incidencias/';

            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }

            $ext = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));

            $allowed = ['jpg', 'jpeg', 'png', 'webp'];

            if (!in_array($ext, $allowed)) {
                echo json_encode([
                    'success' => false,
                    'error' => 'Formato de imagen no permitido'
                ]);
                exit;
            }

            $nombre = uniqid('inc_') . '.' . $ext;

            $rutaFisica = $dir . $nombre;

            if (!move_uploaded_file($_FILES['imagen']['tmp_name'], $rutaFisica)) {
                echo json_encode([
                    'success' => false,
                    'error' => 'No se pudo mover la imagen'
                ]);
                exit;
            }

            $imagen_path = 'uploads/incidencias/' . $nombre;
        }

        if ($tipo === '' || $titulo === '' || $descripcion === '') {
            echo json_encode([
                'success' => false,
                'error'   => 'Faltan campos obligatorios'
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            INSERT INTO incidencias
                (id_piso, id_usuario, tipo, titulo, descripcion, urgencia, estado,
                 notificar_admin, leido_admin, notificar_inquilino, fecha_inicio, fecha_fin, fecha_creacion, imagen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $fecha_creacion = date('Y-m-d');

        $stmt->bind_param(
            "iisssssiiissss",
            $id_piso,
            $id_usuario,
            $tipo,
            $titulo,
            $descripcion,
            $urgencia,
            $estado,
            $notificar_admin,
            $leido_admin,
            $notificar_inquilino,
            $fecha_inicio,
            $fecha_fin,
            $fecha_creacion,
            $imagen_path
        );

        if (!$stmt->execute()) {
            echo json_encode(['success' => false, 'error' => $stmt->error]);
            $stmt->close();
            exit;
        }

        $id_nueva_incidencia = $conn->insert_id;
        $stmt->close();

        $comentario_inquilino = trim($_POST['comentario_inquilino'] ?? '');

        if (!empty($comentario_inquilino)) {

            $stmtMsg = $conn->prepare("
        INSERT INTO incidencia_mensajes
        (id_incidencia, id_usuario, mensaje)
        VALUES (?, ?, ?)
    ");

            $stmtMsg->bind_param(
                "iis",
                $id_nueva_incidencia,
                $id_usuario,
                $comentario_inquilino
            );

            $stmtMsg->execute();
            $stmtMsg->close();
        }

        // Si el admin marcó "Notificar al inquilino", crear notificación para ese usuario
        if ($notificar_inquilino === 1 && $id_usuario > 0) {
            $textoNotificacion = "El administrador ha creado una nueva incidencia: \"$titulo\".";

            $stmt = $conn->prepare("
                INSERT INTO notificaciones
                    (id_usuario, id_incidencia, mensaje)
                VALUES (?, ?, ?)
            ");

            $stmt->bind_param("iis", $id_usuario, $id_nueva_incidencia, $textoNotificacion);
            $stmt->execute();
            $stmt->close();
        }

        echo json_encode([
            'success' => true,
            'message' => 'Incidencia creada correctamente',
            'id'      => $id_nueva_incidencia
        ]);


        break;

        echo json_encode([
            'success' => true,
            'message' => 'Incidencia creada correctamente',
            'id'      => $id_nueva_incidencia
        ]);

        break;


    case 'marcar_notificacion_leida':

        $id_incidencia = $_POST['id_incidencia'] ?? null;

        if (!$id_incidencia) {
            echo json_encode([
                'success' => false,
                'error' => 'Falta id_incidencia'
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE incidencias
            SET leido_admin = 1
            WHERE id_incidencia = ?
        ");

        $stmt->bind_param("i", $id_incidencia);
        $stmt->execute();
        $stmt->close();

        echo json_encode([
            'success' => true
        ]);

        break;

    case 'marcar_todas_leidas':
        $id_piso = $_POST['id_piso'] ?? null;

        $stmt = $conn->prepare("
        UPDATE incidencias
        SET leido_admin = 1
        WHERE id_piso = ?
        AND notificar_admin = 1
        AND leido_admin = 0
    ");

        $stmt->bind_param("i", $id_piso);
        $stmt->execute();

        echo json_encode(['success' => true]);
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
        break;
}

$conn->close();
