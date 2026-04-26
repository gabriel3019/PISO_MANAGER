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

        $result = $conn->query("SELECT * FROM incidencias WHERE id_piso = $id_piso ORDER BY id_incidencia DESC");
        $incidencias = [];

        while ($row = $result->fetch_assoc()) {
            $row['id'] = $row['id_incidencia'];
            $incidencias[] = $row;
        }
        echo json_encode($incidencias);
        break;

    case 'crear':
        $id_piso     = $_POST['id_piso'] ?? 1;
        $id_usuario  = $_POST['id_usuario'] ?? 1;
        $tipo        = $_POST['tipo'] ?? '';
        $titulo      = $_POST['titulo'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';
        $urgencia    = $_POST['urgencia'] ?? 'media';
        $estado      = 'creada';

        // ✅ Procesar imagen
        $imagen_path = null;
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $dir = '../uploads/incidencias/';
            if (!is_dir($dir)) mkdir($dir, 0755, true);

            $ext = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp'];

            if (in_array($ext, $allowed)) {
                $nombre = uniqid('inc_') . '.' . $ext;
                if (move_uploaded_file($_FILES['imagen']['tmp_name'], $dir . $nombre)) {
                    $imagen_path = $dir . $nombre;
                }
            }
        }

        $stmt = $conn->prepare("INSERT INTO incidencias (id_piso, id_usuario, tipo, titulo, descripcion, urgencia, estado, imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iissssss", $id_piso, $id_usuario, $tipo, $titulo, $descripcion, $urgencia, $estado, $imagen_path);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        $stmt->close();
        break;

    case 'editar':
        $id          = $_POST['id'] ?? null;
        $titulo      = $_POST['titulo'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';
        $tipo        = $_POST['tipo'] ?? '';
        $urgencia    = $_POST['urgencia'] ?? 'media';

        // ✅ Procesar imagen si se sube una nueva
        $imagen_sql = "";
        $imagen_path = null;
        if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
            $dir = '../uploads/incidencias/';
            if (!is_dir($dir)) mkdir($dir, 0755, true);

            $ext = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp'];

            if (in_array($ext, $allowed)) {
                $nombre = uniqid('inc_') . '.' . $ext;
                if (move_uploaded_file($_FILES['imagen']['tmp_name'], $dir . $nombre)) {
                    $imagen_path = $dir . $nombre;
                    $imagen_sql = ", imagen=?";
                }
            }
        }

        if ($imagen_path) {
            $stmt = $conn->prepare("UPDATE incidencias SET titulo=?, descripcion=?, tipo=?, urgencia=?, imagen=? WHERE id_incidencia=?");
            $stmt->bind_param("sssssi", $titulo, $descripcion, $tipo, $urgencia, $imagen_path, $id);
        } else {
            $stmt = $conn->prepare("UPDATE incidencias SET titulo=?, descripcion=?, tipo=?, urgencia=? WHERE id_incidencia=?");
            $stmt->bind_param("ssssi", $titulo, $descripcion, $tipo, $urgencia, $id);
        }

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        $stmt->close();
        break;

    case 'eliminar':
        $id = $_POST['id'] ?? null;
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