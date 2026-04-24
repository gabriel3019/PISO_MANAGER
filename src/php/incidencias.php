<?php
header('Content-Type: application/json');
// Ajustamos la ruta según lo que hablamos: BBDD está dentro de php/
require_once("BBDD/conecta.php");

// Recogemos la acción ya sea por GET (listar) o POST (crear/editar/eliminar)
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
            // Sincronizamos id_incidencia con 'id' para que el JS lo encuentre
            $row['id'] = $row['id_incidencia'];
            $incidencias[] = $row;
        }
        // Devolvemos el array directamente para el .forEach del JS
        echo json_encode($incidencias);
        break;

    case 'crear':
        // FormData llega a través de $_POST
        $id_piso     = $_POST['id_piso'] ?? 1;
        $id_usuario  = $_POST['id_usuario'] ?? 1;
        $tipo        = $_POST['tipo'] ?? '';
        $titulo      = $_POST['titulo'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';
        $urgencia    = $_POST['urgencia'] ?? 'media';
        $estado      = 'abierta'; // Estado inicial por defecto

        // Nota: La columna 'imagen' se queda como NULL si no se procesa aquí
        $stmt = $conn->prepare("INSERT INTO incidencias (id_piso, id_usuario, tipo, titulo, descripcion, urgencia, estado) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iisssss", $id_piso, $id_usuario, $tipo, $titulo, $descripcion, $urgencia, $estado);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'id' => $stmt->insert_id]);
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
        }
        $stmt->close();
        break;

    case 'editar':
        $id = $_POST['id'] ?? null;
        $titulo = $_POST['titulo'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';
        $tipo = $_POST['tipo'] ?? '';
        $urgencia = $_POST['urgencia'] ?? 'media';

        $stmt = $conn->prepare("UPDATE incidencias SET titulo=?, descripcion=?, tipo=?, urgencia=? WHERE id_incidencia=?");
        $stmt->bind_param("ssssi", $titulo, $descripcion, $tipo, $urgencia, $id);

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