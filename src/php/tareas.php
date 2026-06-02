<?php

session_start();

require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

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

$id_usuario = $_SESSION['id_usuario'];

/* ================================================= */
/* ================= OBTENER PISO ================== */
/* ================================================= */

$stmt = $conn->prepare("
    SELECT id_piso
    FROM usuarios_pisos
    WHERE id_usuario=?
    LIMIT 1
");

$stmt->bind_param("i", $id_usuario);
$stmt->execute();

$res = $stmt->get_result();

if ($res->num_rows === 0) {

    echo json_encode([
        "success" => false,
        "error" => "Usuario sin piso"
    ]);

    exit;
}

$id_piso = $res->fetch_assoc()['id_piso'];

/* ================================================= */
/* ================= INPUT JSON ==================== */
/* ================================================= */

$input = json_decode(
    file_get_contents("php://input"),
    true
);

$action = $input['action'] ?? '';

/* ================================================= */
/* ================= LISTAR ======================== */
/* ================================================= */

if ($action === "listar") {

    $sql = "
    SELECT
        t.id_tarea,
        t.id_usuario,
        t.titulo,
        t.descripcion,
        t.estado,
        t.prioridad,
        t.fecha,
        t.frecuencia,
        u.nombre
    FROM tareas t
    JOIN usuarios u
        ON t.id_usuario = u.id_usuario
    WHERE t.id_piso=?
    ORDER BY t.id_tarea DESC
    ";

    $stmt = $conn->prepare($sql);

    $stmt->bind_param(
        "i",
        $id_piso
    );

    $stmt->execute();

    $res = $stmt->get_result();

    $tareas = [];

    while ($row = $res->fetch_assoc()) {

        $tareas[] = $row;
    }

    echo json_encode([
        "success" => true,
        "tareas" => $tareas
    ]);

    exit;
}

/* ================================================= */
/* ================= CREAR ========================= */
/* ================================================= */

if ($action === "crear") {

    $titulo = trim(
        $input['titulo'] ?? ''
    );

    $descripcion =
        $input['descripcion'] ?? '';

    $prioridad =
        $input['prioridad'] ?? 'baja';

    $fecha =
        $input['fecha'] ?? null;

    $frecuencia =
        $input['frecuencia'] ?? 'puntual';

    $id_usuario_nuevo =
        intval(
            $input['id_usuario'] ?? $id_usuario
        );

    if (!$titulo) {

        echo json_encode([
            "success" => false,
            "error" => "Título obligatorio"
        ]);

        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO tareas
        (
            id_piso,
            id_usuario,
            titulo,
            descripcion,
            prioridad,
            fecha,
            frecuencia,
            estado
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, 'pendiente')
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

    if ($stmt->execute()) {

        $stmtCalendario = $conn->prepare("
        INSERT INTO calendario_eventos
        (
            id_piso,
            titulo,
            tipo,
            fecha,
            estado
        )
        VALUES
        (?, ?, 'tarea', ?, 'pendiente')
    ");

        $stmtCalendario->bind_param(
            "iss",
            $id_piso,
            $titulo,
            $fecha
        );

        $stmtCalendario->execute();

        $id_evento = $stmtCalendario->insert_id;

        $stmtPersona = $conn->prepare("
    INSERT INTO calendario_evento_personas
    (
        id_evento,
        id_usuario
    )
    VALUES (?, ?)
");

        $stmtPersona->bind_param(
            "ii",
            $id_evento,
            $id_usuario_nuevo
        );

        $stmtPersona->execute();
        $stmtPersona->close();


        echo json_encode([
            "success" => true
        ]);
    } else {

        echo json_encode([
            "success" => false,
            "error" => $stmt->error
        ]);
    }

    exit;
}

/* ================================================= */
/* ================= EDITAR ======================== */
/* ================================================= */

if ($action === "editar") {

    $id_tarea =
        intval($input['id_tarea'] ?? 0);

    $titulo =
        trim($input['titulo'] ?? '');

    $descripcion =
        $input['descripcion'] ?? '';

    $prioridad =
        $input['prioridad'] ?? 'baja';

    $fecha =
        $input['fecha'] ?? null;

    $frecuencia =
        $input['frecuencia'] ?? 'puntual';

    $id_usuario_nuevo =
        intval(
            $input['id_usuario'] ?? $id_usuario
        );

    if (!$id_tarea || !$titulo) {

        echo json_encode([
            "success" => false,
            "error" => "Datos inválidos"
        ]);

        exit;
    }

    $stmt = $conn->prepare("
        UPDATE tareas
        SET
            titulo=?,
            descripcion=?,
            prioridad=?,
            fecha=?,
            frecuencia=?,
            id_usuario=?
        WHERE
            id_tarea=?
            AND id_piso=?
    ");

    $stmt->bind_param(
        "sssssiii",
        $titulo,
        $descripcion,
        $prioridad,
        $fecha,
        $frecuencia,
        $id_usuario_nuevo,
        $id_tarea,
        $id_piso
    );

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true
        ]);
    } else {

        echo json_encode([
            "success" => false,
            "error" => $stmt->error
        ]);
    }

    exit;
}

/* ================================================= */
/* ================= TOGGLE ======================== */
/* ================================================= */

if ($action === "toggle") {

    $id_tarea =
        intval($input['id_tarea'] ?? 0);

    $estado =
        $input['estado'] ?? 'pendiente';

    if (!$id_tarea) {

        echo json_encode([
            "success" => false,
            "error" => "ID inválido"
        ]);

        exit;
    }

    $stmt = $conn->prepare("
        UPDATE tareas
        SET estado=?
        WHERE
            id_tarea=?
            AND id_piso=?
    ");

    $stmt->bind_param(
        "sii",
        $estado,
        $id_tarea,
        $id_piso
    );

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true
        ]);
    } else {

        echo json_encode([
            "success" => false,
            "error" => $stmt->error
        ]);
    }

    exit;
}

/* ================================================= */
/* ================= ELIMINAR ====================== */
/* ================================================= */

if ($action === "eliminar") {

    $id_tarea = intval($input['id_tarea'] ?? 0);

    if (!$id_tarea) {

        echo json_encode([
            "success" => false,
            "error" => "ID inválido"
        ]);

        exit;
    }

    // Obtener datos de la tarea
    $stmtInfo = $conn->prepare("
        SELECT titulo, fecha
        FROM tareas
        WHERE id_tarea = ?
        AND id_piso = ?
    ");

    $stmtInfo->bind_param(
        "ii",
        $id_tarea,
        $id_piso
    );

    $stmtInfo->execute();

    $resultado = $stmtInfo->get_result();
    $tarea = $resultado->fetch_assoc();

    $stmtInfo->close();

    // Borrar del calendario
    if ($tarea) {

        $stmtCal = $conn->prepare("
            DELETE FROM calendario_eventos
            WHERE id_piso = ?
            AND tipo = 'tarea'
            AND titulo = ?
            AND fecha = ?
        ");

        $stmtCal->bind_param(
            "iss",
            $id_piso,
            $tarea['titulo'],
            $tarea['fecha']
        );

        $stmtCal->execute();
        $stmtCal->close();
    }

    // Borrar la tarea
    $stmt = $conn->prepare("
        DELETE FROM tareas
        WHERE id_tarea = ?
        AND id_piso = ?
    ");

    $stmt->bind_param(
        "ii",
        $id_tarea,
        $id_piso
    );

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true
        ]);
    } else {

        echo json_encode([
            "success" => false,
            "error" => $stmt->error
        ]);
    }

    exit;
}

/* ================================================= */
/* ================= USUARIOS ====================== */
/* ================================================= */

if ($action === "usuarios") {

    $stmt = $conn->prepare("
        SELECT
            u.id_usuario,
            u.nombre
        FROM usuarios u
        JOIN usuarios_pisos up
            ON u.id_usuario = up.id_usuario
        WHERE up.id_piso=?
        ORDER BY u.nombre ASC
    ");

    $stmt->bind_param(
        "i",
        $id_piso
    );

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

/* ================================================= */
/* ================= DEFAULT ======================= */
/* ================================================= */

echo json_encode([
    "success" => false,
    "error" => "Acción no válida"
]);
