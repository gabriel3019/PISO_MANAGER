<?php
session_start();
require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* ================= SESSION ================= */
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

/* ================= PISO ================= */
$stmt = $conn->prepare("
    SELECT id_piso FROM usuarios_pisos WHERE id_usuario=? LIMIT 1
");
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(["success" => false]);
    exit;
}

$id_piso = $res->fetch_assoc()['id_piso'];

/* ================= INPUT ================= */
$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? '';

/* ================= LISTAR ================= */
if ($action === "listar") {

    $sql = "
    SELECT 
        t.id_tarea,
        t.titulo,
        t.descripcion,
        t.estado,
        t.prioridad,
        t.fecha,
        t.frecuencia,
        u.nombre
    FROM tareas t
    JOIN usuarios u ON t.id_usuario = u.id_usuario
    WHERE t.id_piso=? AND t.id_usuario=?
    ORDER BY t.id_tarea DESC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $id_piso, $id_usuario);
    $stmt->execute();

    $res = $stmt->get_result();
    $tareas = [];

    while ($row = $res->fetch_assoc()) {
        $tareas[] = $row;
    }

    echo json_encode(["success" => true, "tareas" => $tareas]);
    exit;
}

/* ================= CREAR ================= */
if ($action === "crear") {

    $titulo = trim($input['titulo'] ?? '');
    $descripcion = $input['descripcion'] ?? '';
    $prioridad = $input['prioridad'] ?? 'baja';
    $fecha = $input['fecha'] ?? null;
    $frecuencia = $input['frecuencia'] ?? 'puntual';
    $id_usuario_nuevo = $input['id_usuario'] ?? $id_usuario;

    if (!$titulo) {
        echo json_encode(["success" => false]);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO tareas 
        (id_piso, id_usuario, titulo, descripcion, prioridad, fecha, frecuencia)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->bind_param(
        "iisssss",
        $id_piso,
        $id_usuario_nuevo,
        $titulo,
        $descripcion,
        $prioridad,
        $fecha,
        $frecuencia
    );

    $stmt->execute();

    echo json_encode(["success" => true]);
    exit;
}

/* ================= EDITAR ================= */
if ($action === "editar") {

    $id_tarea = $input['id_tarea'] ?? null;
    $titulo = trim($input['titulo'] ?? '');
    $descripcion = $input['descripcion'] ?? '';
    $prioridad = $input['prioridad'] ?? 'baja';
    $fecha = $input['fecha'] ?? null;
    $frecuencia = $input['frecuencia'] ?? 'puntual';
    $id_usuario_nuevo = $input['id_usuario'] ?? $id_usuario;

    if (!$id_tarea || !$titulo) {
        echo json_encode(["success" => false]);
        exit;
    }

    $stmt = $conn->prepare("
        UPDATE tareas 
        SET titulo=?, descripcion=?, prioridad=?, fecha=?, frecuencia=?, id_usuario=?
        WHERE id_tarea=? AND id_piso=? AND id_usuario=?
    ");

    $stmt->bind_param(
        "sssssiiii",
        $titulo,
        $descripcion,
        $prioridad,
        $fecha,
        $frecuencia,
        $id_usuario_nuevo,
        $id_tarea,
        $id_piso,
        $id_usuario
    );

    $stmt->execute();

    echo json_encode(["success" => true]);
    exit;
}

/* ================= TOGGLE ================= */
if ($action === "toggle") {

    $id_tarea = $input['id_tarea'] ?? null;
    $estado = $input['estado'] ?? 'pendiente';

    if (!$id_tarea) {
        echo json_encode(["success" => false]);
        exit;
    }

    $stmt = $conn->prepare("
        UPDATE tareas 
        SET estado=? 
        WHERE id_tarea=? AND id_piso=?
    ");

    $stmt->bind_param("sii", $estado, $id_tarea, $id_piso);
    $stmt->execute();

    echo json_encode(["success" => true]);
    exit;
}

/* ================= ELIMINAR ================= */
if ($action === "eliminar") {

    $id_tarea = $input['id_tarea'] ?? null;

    if (!$id_tarea) {
        echo json_encode(["success" => false]);
        exit;
    }

    $stmt = $conn->prepare("
        DELETE FROM tareas 
        WHERE id_tarea=? AND id_piso=?
    ");

    $stmt->bind_param("ii", $id_tarea, $id_piso);
    $stmt->execute();

    echo json_encode(["success" => true]);
    exit;
}

/* ================= USUARIOS ================= */
if ($action === "usuarios") {

    $stmt = $conn->prepare("
        SELECT u.id_usuario, u.nombre
        FROM usuarios u
        JOIN usuarios_pisos up ON u.id_usuario = up.id_usuario
        WHERE up.id_piso=?
    ");

    $stmt->bind_param("i", $id_piso);
    $stmt->execute();

    $res = $stmt->get_result();
    $usuarios = [];

    while ($row = $res->fetch_assoc()) {
        $usuarios[] = $row;
    }

    echo json_encode([
        "success" => true,
        "usuarios" => $usuarios
    ]);
    exit;
}

/* ================= DEFAULT ================= */
echo json_encode([
    "success" => false,
    "error" => "Acción no válida"
]);