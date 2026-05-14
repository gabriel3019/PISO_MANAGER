<?php

session_start();

require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* ================================================= */
/* ================= SEGURIDAD ===================== */
/* ================================================= */

if (!isset($_SESSION['id_usuario'])) {

    echo json_encode([
        "success" => false
    ]);

    exit;
}

$id_usuario = $_SESSION['id_usuario'];

$id_piso = $_SESSION['piso_id'];

/* ================================================= */
/* ================= USUARIOS ====================== */
/* ================================================= */

$sql = "

SELECT
    u.id_usuario,
    u.nombre,
    up.rol

FROM usuarios u

JOIN usuarios_pisos up
    ON u.id_usuario = up.id_usuario

WHERE up.id_piso = ?

AND (

    up.rol != 'admin'

    OR

    u.id_usuario = ?

)

ORDER BY u.nombre ASC

";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ii",
    $id_piso,
    $id_usuario
);

$stmt->execute();

$res = $stmt->get_result();

$usuarios = [];

while ($row = $res->fetch_assoc()) {

    $usuarios[] = [

        "id_usuario" =>
            (int)$row['id_usuario'],

        "nombre" =>
            $row['nombre'],

        "rol" =>
            $row['rol']

    ];
}

/* ================================================= */
/* ================= RESPONSE ====================== */
/* ================================================= */

echo json_encode([

    "success" => true,

    "usuarios" => $usuarios

]);