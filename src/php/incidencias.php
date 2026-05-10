<?php
header('Content-Type: application/json');
require_once("BBDD/conecta.php");

// Forzar que el ID sea entero para evitar errores en bind_param
if (isset($_POST['id'])) $_POST['id'] = intval($_POST['id']);

$accion = $_REQUEST['accion'] ?? '';

switch ($accion) {

    case 'listar':
        $id_piso = intval($_REQUEST['id_piso'] ?? 0);
        if (!$id_piso) {
            echo json_encode(['success' => false, 'error' => 'Falta id_piso']);
            exit;
        }

        $stmt = $conn->prepare("SELECT * FROM incidencias WHERE id_piso = ? ORDER BY id_incidencia DESC");
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
        $id_piso         = intval($_POST['id_piso'] ?? 1);
        $id_usuario      = intval($_POST['id_usuario'] ?? 1);
        $tipo            = trim($_POST['tipo'] ?? '');
        $titulo          = trim($_POST['titulo'] ?? '');
        $descripcion     = trim($_POST['descripcion'] ?? '');
        
        // ✅ VALIDACIÓN DE URGENCIA: solo acepta valores del ENUM
        $urgencia_raw = $_POST['urgencia'] ?? 'media';
        $urgencia = in_array($urgencia_raw, ['baja', 'media', 'alta']) 
            ? $urgencia_raw 
            : 'media';
        
        $estado = 'abierta'; // Siempre empieza como abierta
        $notificar_admin = (int)($_POST['notificar_admin'] ?? 0);

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
             (id_piso, id_usuario, tipo, titulo, descripcion, urgencia, estado, imagen, notificar_admin)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $stmt->bind_param("iissssssi",
            $id_piso,
            $id_usuario,
            $tipo,
            $titulo,
            $descripcion,
            $urgencia,
            $estado,
            $imagen_path,
            $notificar_admin
        );

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        $stmt->close();
        break;

    case 'editar':
        $id              = intval($_POST['id'] ?? 0);
        $titulo          = trim($_POST['titulo'] ?? '');
        $descripcion     = trim($_POST['descripcion'] ?? '');
        $tipo            = trim($_POST['tipo'] ?? '');
        
        // ✅ VALIDACIÓN DE ESTADO: solo acepta valores del ENUM
        $estado_raw = $_POST['estado'] ?? 'abierta';
        $estado = in_array($estado_raw, ['abierta', 'en_curso', 'resuelta']) 
            ? $estado_raw 
            : 'abierta';
        
        // ✅ VALIDACIÓN DE URGENCIA: solo acepta valores del ENUM
        $urgencia_raw = $_POST['urgencia'] ?? 'media';
        $urgencia = in_array($urgencia_raw, ['baja', 'media', 'alta']) 
            ? $urgencia_raw 
            : 'media';
        
        $notificar_admin = (int)($_POST['notificar_admin'] ?? 0);

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
                 SET titulo=?, descripcion=?, tipo=?, urgencia=?, estado=?, notificar_admin=?, imagen=?
                 WHERE id_incidencia=?"
            );
            $stmt->bind_param("sssssisi",
                $titulo, $descripcion, $tipo, $urgencia, $estado, $notificar_admin, $imagen_path, $id
            );
        } else {
            $stmt = $conn->prepare(
                "UPDATE incidencias
                 SET titulo=?, descripcion=?, tipo=?, urgencia=?, estado=?, notificar_admin=?
                 WHERE id_incidencia=?"
            );
            // ✅ Tipos correctos: 5 strings + 1 int (notificar) + 1 int (id)
            $stmt->bind_param("sssssii",
                $titulo, $descripcion, $tipo, $urgencia, $estado, $notificar_admin, $id
            );
        }

        if ($stmt->execute()) {
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
        $stmt->close();
        $stmt2->close();
        break;

    default:
        error_log("ACCIÓN NO VÁLIDA RECIBIDA: $accion | POST: " . print_r($_POST, true));
        echo json_encode([
            'success' => false, 
            'error' => 'Acción no válida',
            'debug_accion' => $accion
        ]);
        break;
}

$conn->close();
?>