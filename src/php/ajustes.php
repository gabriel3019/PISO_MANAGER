<?php
session_start();
require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* ================= SESSION ================= */
if (!isset($_SESSION['id_usuario'])) {
    echo json_encode(["success" => false, "error" => "No sesión"]);
    exit;
}

$id_usuario = $_SESSION['id_usuario'];

/* ================= INPUT ================= */
$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? ($_POST['action'] ?? '');

/* ================= OBTENER PERFIL ================= */
if ($action === "perfil") {

    $stmt = $conn->prepare("
        SELECT 
            nombre,
            apellidos,
            email,
            telefono,
            direccion,
            foto,
            modo_oscuro
        FROM usuarios
        WHERE id_usuario=?
    ");

    $stmt->bind_param("i", $id_usuario);
    $stmt->execute();

    $res = $stmt->get_result()->fetch_assoc();

    echo json_encode([
        "success" => true,
        "usuario" => $res
    ]);
    exit;
}

/* ================= GUARDAR PERFIL ================= */
if ($action === "guardar") {

    $nombre     = trim($input['nombre'] ?? '');
    $apellidos  = trim($input['apellidos'] ?? '');
    $email      = trim($input['email'] ?? '');
    $telefono   = trim($input['telefono'] ?? '');
    $direccion  = trim($input['direccion'] ?? '');

    if (!$nombre || !$email) {
        echo json_encode([
            "success" => false,
            "error" => "Nombre y email obligatorios"
        ]);
        exit;
    }

    $stmt = $conn->prepare("
        UPDATE usuarios
        SET nombre=?, apellidos=?, email=?, telefono=?, direccion=?
        WHERE id_usuario=?
    ");

    $stmt->bind_param(
        "sssssi",
        $nombre,
        $apellidos,
        $email,
        $telefono,
        $direccion,
        $id_usuario
    );

    $stmt->execute();

    echo json_encode(["success" => true]);
    exit;
}

/* ================= MODO OSCURO ================= */
if ($action === "modoOscuro") {

    $valor = isset($input['valor']) ? (int)$input['valor'] : 0;

    $stmt = $conn->prepare("
        UPDATE usuarios
        SET modo_oscuro=?
        WHERE id_usuario=?
    ");

    $stmt->bind_param("ii", $valor, $id_usuario);
    $stmt->execute();

    echo json_encode(["success" => true]);
    exit;
}

/* ================= SUBIR FOTO ================= */
if ($action === "foto") {

    if (!isset($_FILES['foto'])) {
        echo json_encode(["success" => false, "error" => "No hay archivo"]);
        exit;
    }

    $archivo = $_FILES['foto'];

    /* validar tipo */
    $permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!in_array($archivo['type'], $permitidos)) {
        echo json_encode(["success" => false, "error" => "Formato no permitido"]);
        exit;
    }

    /* nombre único */
    $nombreArchivo = time() . "_" . preg_replace("/[^a-zA-Z0-9.]/", "", $archivo["name"]);

    /* ruta REAL servidor */
    $rutaServidor = __DIR__ . "/../uploads/" . $nombreArchivo;

    /* ruta para guardar en BD */
    $rutaBD = "uploads/" . $nombreArchivo;

    /* crear carpeta si no existe */
    if (!is_dir(__DIR__ . "/../uploads")) {
        mkdir(__DIR__ . "/../uploads", 0777, true);
    }

    /* mover archivo */
    if (move_uploaded_file($archivo["tmp_name"], $rutaServidor)) {

        $stmt = $conn->prepare("
            UPDATE usuarios SET foto=? WHERE id_usuario=?
        ");
        $stmt->bind_param("si", $rutaBD, $id_usuario);
        $stmt->execute();

        echo json_encode([
            "success" => true,
            "ruta" => $rutaBD
        ]);

    } else {
        echo json_encode([
            "success" => false,
            "error" => "Error subiendo imagen"
        ]);
    }

    exit;
}

/* ================= DEFAULT ================= */
echo json_encode([
    "success" => false,
    "error" => "Acción no válida"
]);