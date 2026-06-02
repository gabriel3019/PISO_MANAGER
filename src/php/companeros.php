<?php

session_start();

require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* ================= SESION ================= */

if (!isset($_SESSION['id_usuario'])) {

    echo json_encode([
        "success" => false
    ]);

    exit;
}

$id_usuario = $_SESSION['id_usuario'];

/* ================= DATOS JSON ================= */

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$action = $data["action"] ?? "listar";

/* ================= OBTENER PISO ================= */

$stmt = $conn->prepare("

    SELECT id_piso

    FROM usuarios_pisos

    WHERE id_usuario = ?

");

$stmt->bind_param("i", $id_usuario);

$stmt->execute();

$res = $stmt->get_result()->fetch_assoc();

$id_piso = $res['id_piso'] ?? null;

/* ================= SIN PISO ================= */

if (!$id_piso) {

    echo json_encode([
        "success" => false
    ]);

    exit;
}

/* ================================================= */
/* ================= ELIMINAR ======================= */
/* ================================================= */

if ($action === "eliminar") {

    $idEliminar =
        intval(
            $data["id_usuario"] ?? 0
        );

    $stmt = $conn->prepare("

        SELECT rol

        FROM usuarios_pisos

        WHERE id_usuario = ?

        LIMIT 1

    ");

    $stmt->bind_param(
        "i",
        $idEliminar
    );

    $stmt->execute();

    $rol =
        $stmt
        ->get_result()
        ->fetch_assoc();

    if (
        $rol &&
        $rol["rol"] === "admin"
    ) {

        echo json_encode([
            "success" => false,
            "message" => "No puedes eliminar al administrador"
        ]);

        exit;
    }

    $stmt = $conn->prepare("

        DELETE FROM usuarios

        WHERE id_usuario = ?

    ");

    $stmt->bind_param(
        "i",
        $idEliminar
    );

    $ok = $stmt->execute();

    echo json_encode([
        "success" => $ok
    ]);

    exit;
}

/* ================================================= */
/* ================= LISTAR ========================= */
/* ================================================= */

$stmt = $conn->prepare("

SELECT

    u.id_usuario,
    u.nombre,
    u.apellidos,
    u.email,
    u.telefono,
    u.dni,

    u.fecha_nacimiento,
    u.nacionalidad,

    u.direccion,
    u.ciudad,

    u.codigo_postal,
    u.fecha_entrada,

    u.contacto_emergencia,
    u.telefono_emergencia,

    u.foto,

    up.rol

FROM usuarios u

JOIN usuarios_pisos up
    ON u.id_usuario = up.id_usuario

WHERE up.id_piso = ?

");

$stmt->bind_param("i", $id_piso);

$stmt->execute();

$result = $stmt->get_result();

/* ================= ARRAY ================= */

$usuarios = [];

while ($row = $result->fetch_assoc()) {

    $usuarios[] = $row;
}

/* ================= RESPUESTA ================= */

echo json_encode([

    "success" => true,

    "usuarios" => $usuarios

]);