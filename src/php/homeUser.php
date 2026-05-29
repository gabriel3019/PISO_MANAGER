<?php

session_start();

require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* ================================================= */
/* ================= JSON INPUT ==================== */
/* ================================================= */

$input = json_decode(
    file_get_contents("php://input"),
    true
);

/* ================================================= */
/* ================= ACTUALIZAR TAREA ============== */
/* ================================================= */

if (
    isset($input['action']) &&
    $input['action'] === 'actualizarTarea'
) {

    if (!isset($_SESSION['id_usuario'])) {

        echo json_encode([
            "success" => false,
            "error" => "No hay sesión"
        ]);

        exit;
    }

    $id_tarea =
        (int)$input['id_tarea'];

    $estado =
        trim(
            strtolower($input['estado'])
        );

    $sql = "
    UPDATE tareas
    SET estado = ?
    WHERE id_tarea = ?
    ";

    $stmt = $conn->prepare($sql);

    $stmt->bind_param(
        "si",
        $estado,
        $id_tarea
    );

    $success =
        $stmt->execute();

    echo json_encode([

        "success" => $success

    ]);

    exit;
}

/* ================================================= */
/* ================= SESSION ======================= */
/* ================================================= */

if (!isset($_SESSION['id_usuario'])) {

    echo json_encode([
        "success" => false,
        "error" => "No hay sesión"
    ]);

    exit;
}

$id_usuario =
    (int)$_SESSION['id_usuario'];

/* ================================================= */
/* ================= OBTENER PISO ================== */
/* ================================================= */

$sql = "
SELECT id_piso
FROM usuarios_pisos
WHERE id_usuario = ?
LIMIT 1
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $id_usuario
);

$stmt->execute();

$res =
    $stmt->get_result();

if ($res->num_rows === 0) {

    echo json_encode([
        "success" => false,
        "error" => "Usuario sin piso"
    ]);

    exit;
}

$id_piso =
    (int)$res
        ->fetch_assoc()['id_piso'];

/* ================================================= */
/* ================= DATA ========================== */
/* ================================================= */

$data = [

    "balance" => [],

    "gastos" => [],

    "tareas" => [],

    "avisos" => [],

    "reparto" => []

];

/* ================================================= */
/* ================= BALANCE ======================= */
/* ================================================= */

/* ================= TOTAL ================= */

$sql = "
SELECT
    COALESCE(SUM(monto_total),0) AS total
FROM gastos
WHERE id_piso = ?
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $id_piso
);

$stmt->execute();

$total =
    (float)$stmt
        ->get_result()
        ->fetch_assoc()["total"];

/* ================= PAGADO ================= */

$sql = "
SELECT
    COALESCE(SUM(monto_total),0) AS pagado
FROM gastos
WHERE id_pagador = ?
AND id_piso = ?
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ii",
    $id_usuario,
    $id_piso
);

$stmt->execute();

$pagado =
    (float)$stmt
        ->get_result()
        ->fetch_assoc()["pagado"];

/* ================= DEBIDO ================= */

$sql = "
SELECT
    COALESCE(SUM(gp.importe),0) AS debido
FROM gastos_participantes gp

JOIN gastos g
    ON gp.id_gasto = g.id_gasto

WHERE gp.id_usuario = ?
AND g.id_piso = ?
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ii",
    $id_usuario,
    $id_piso
);

$stmt->execute();

$debido =
    (float)$stmt
        ->get_result()
        ->fetch_assoc()["debido"];

/* ================= RECIBIDO ================= */

$sql = "
SELECT
    COALESCE(SUM(importe),0) AS recibido
FROM pagos
WHERE id_receptor = ?
AND id_piso = ?
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ii",
    $id_usuario,
    $id_piso
);

$stmt->execute();

$recibido =
    (float)$stmt
        ->get_result()
        ->fetch_assoc()["recibido"];

/* ================= ENVIADO ================= */

$sql = "
SELECT
    COALESCE(SUM(importe),0) AS enviado
FROM pagos
WHERE id_pagador = ?
AND id_piso = ?
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "ii",
    $id_usuario,
    $id_piso
);

$stmt->execute();

$enviado =
    (float)$stmt
        ->get_result()
        ->fetch_assoc()["enviado"];

/* ================= NETO ================= */

$deuda_real =
    $debido - $enviado;

$credito_real =
    $pagado - $recibido;

$data["balance"] = [

    "total" =>
        $total,

    "pagado" =>
        $pagado,

    "debido" =>
        $debido,

    "recibido" =>
        $recibido,

    "enviado" =>
        $enviado,

    "neto" =>
        (float)(
            $credito_real - $deuda_real
        )

];

/* ================================================= */
/* ================= GASTOS ======================== */
/* ================================================= */

$sql = "
SELECT
    g.descripcion,
    g.monto_total,
    u.nombre AS pagador

FROM gastos g

JOIN usuarios u
    ON g.id_pagador = u.id_usuario

WHERE g.id_piso = ?

ORDER BY g.id_gasto DESC

LIMIT 3
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $id_piso
);

$stmt->execute();

$res =
    $stmt->get_result();

while ($row = $res->fetch_assoc()) {

    $data["gastos"][] = $row;

}

/* ================================================= */
/* ================= TAREAS ======================== */
/* ================================================= */

$sql = "
SELECT
    t.id_tarea,
    t.titulo,
    t.estado,
    u.nombre AS usuario

FROM tareas t

JOIN usuarios u
    ON t.id_usuario = u.id_usuario

WHERE t.id_piso = ?

ORDER BY t.id_tarea DESC
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $id_piso
);

$stmt->execute();

$res =
    $stmt->get_result();

while ($row = $res->fetch_assoc()) {

    $data["tareas"][] = $row;

}

/* ================================================= */
/* ================= AVISOS ======================== */
/* ================================================= */

$sql = "
SELECT
    titulo,
    CONCAT(
        UPPER(tipo),
        ' • ',
        fecha,
        ' • ',
        estado
    ) AS descripcion
FROM calendario_eventos
WHERE id_piso = ?
ORDER BY fecha DESC, id_evento DESC
LIMIT 3
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $id_piso
);

$stmt->execute();

$res = $stmt->get_result();

while ($row = $res->fetch_assoc()) {

    $data["avisos"][] = $row;

}

/* ================================================= */
/* ================= REPARTO ======================= */
/* ================================================= */

$sql = "
SELECT
    u.nombre,
    COALESCE(SUM(gp.importe),0) AS debe

FROM gastos_participantes gp

JOIN usuarios u
    ON gp.id_usuario = u.id_usuario

JOIN gastos g
    ON gp.id_gasto = g.id_gasto

WHERE g.id_piso = ?

GROUP BY u.id_usuario
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "i",
    $id_piso
);

$stmt->execute();

$res =
    $stmt->get_result();

while ($row = $res->fetch_assoc()) {

    $data["reparto"][] = $row;

}

/* ================================================= */
/* ================= RESPONSE ====================== */
/* ================================================= */

echo json_encode([

    "success" => true,

    "data" => $data

]);