<?php

session_start();

require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* ===================================================== */
/* ================= SEGURIDAD ========================= */
/* ===================================================== */

if (!isset($_SESSION['id_usuario'])) {

    echo json_encode([
        "success" => false,
        "message" => "No autorizado"
    ]);

    exit;
}

$id_usuario = $_SESSION['id_usuario'];

$id_piso = $_SESSION['piso_id'] ?? null;

if (!$id_piso) {

    echo json_encode([
        "success" => false,
        "message" => "No hay piso activo"
    ]);

    exit;
}

/* ===================================================== */
/* ================= INPUT ============================= */
/* ===================================================== */

$accion = $_POST['accion'] ?? '';

$id_gasto = $_POST['id_gasto'] ?? null;

$titulo = trim($_POST['titulo'] ?? '');

$importe = floatval($_POST['importe'] ?? 0);

$pagador = $_POST['pagador'] ?? $id_usuario;

$participantes = json_decode(
    $_POST['participantes'] ?? '[]',
    true
);

$importesManual = json_decode(
    $_POST['importes'] ?? '[]',
    true
);

/* ===================================================== */
/* ================= TRY =============================== */
/* ===================================================== */

try {

    /* ===================================================== */
    /* ================= CREAR ============================== */
    /* ===================================================== */

    if ($accion === "crear") {

        if (
            !$titulo ||
            !$importe ||
            empty($participantes)
        ) {

            echo json_encode([
                "success" => false,
                "message" => "Datos incompletos"
            ]);

            exit;
        }

        $sql = "
        INSERT INTO gastos
        (
            id_piso,
            id_pagador,
            descripcion,
            monto_total
        )
        VALUES (?, ?, ?, ?)
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "iisd",
            $id_piso,
            $pagador,
            $titulo,
            $importe
        );

        $stmt->execute();

        $id_gasto_creado = $stmt->insert_id;

        /* ================= DIVISION MANUAL ================= */

        if (!empty($importesManual)) {

            foreach ($importesManual as $uid => $parte) {

                $uid = (int)$uid;

                $parte = (float)$parte;

                if ($parte <= 0) {
                    continue;
                }

                $pagado =
                    ($uid == $pagador)
                    ? 1
                    : 0;

                $sql = "
                INSERT INTO gastos_participantes
                (
                    id_gasto,
                    id_usuario,
                    importe,
                    pagado
                )
                VALUES (?, ?, ?, ?)
                ";

                $stmt2 = $conn->prepare($sql);

                $stmt2->bind_param(
                    "iidi",
                    $id_gasto_creado,
                    $uid,
                    $parte,
                    $pagado
                );

                $stmt2->execute();
            }

        } else {

            /* ================= DIVISION IGUAL ================= */

            $parte =
                round(
                    $importe / count($participantes),
                    2
                );

            foreach ($participantes as $uid) {

                $uid = (int)$uid;

                $pagado =
                    ($uid == $pagador)
                    ? 1
                    : 0;

                $sql = "
                INSERT INTO gastos_participantes
                (
                    id_gasto,
                    id_usuario,
                    importe,
                    pagado
                )
                VALUES (?, ?, ?, ?)
                ";

                $stmt2 = $conn->prepare($sql);

                $stmt2->bind_param(
                    "iidi",
                    $id_gasto_creado,
                    $uid,
                    $parte,
                    $pagado
                );

                $stmt2->execute();
            }
        }

        echo json_encode([
            "success" => true
        ]);

        exit;
    }

    /* ===================================================== */
    /* ================= ELIMINAR ========================== */
    /* ===================================================== */

    if (
        $accion === "eliminar" &&
        $id_gasto
    ) {

        $sql = "
        DELETE FROM gastos_participantes
        WHERE id_gasto = ?
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "i",
            $id_gasto
        );

        $stmt->execute();

        $sql = "
        DELETE FROM gastos
        WHERE id_gasto = ?
        AND id_piso = ?
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "ii",
            $id_gasto,
            $id_piso
        );

        $stmt->execute();

        echo json_encode([
            "success" => true
        ]);

        exit;
    }

    /* ===================================================== */
    /* ================= LISTAR ============================ */
    /* ===================================================== */

    if ($accion === "listar") {

        $sql = "
        SELECT
            g.id_gasto,
            g.id_pagador,
            g.descripcion AS titulo,
            g.monto_total AS importe,
            g.fecha,
            u.nombre AS pagador

        FROM gastos g

        JOIN usuarios u
            ON g.id_pagador = u.id_usuario

        WHERE g.id_piso = ?

        ORDER BY g.id_gasto DESC
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "i",
            $id_piso
        );

        $stmt->execute();

        $res = $stmt->get_result();

        $gastos = [];

        while ($row = $res->fetch_assoc()) {

            $id_gasto_actual =
                (int)$row['id_gasto'];

            /* ================= PARTICIPANTES ================= */

            $sqlParticipantes = "
            SELECT
                u.id_usuario,
                u.nombre,
                gp.importe,
                gp.pagado

            FROM gastos_participantes gp

            JOIN usuarios u
                ON gp.id_usuario = u.id_usuario

            WHERE gp.id_gasto = ?
            ";

            $stmt2 =
                $conn->prepare(
                    $sqlParticipantes
                );

            $stmt2->bind_param(
                "i",
                $id_gasto_actual
            );

            $stmt2->execute();

            $res2 =
                $stmt2->get_result();

            $participantesDetalle = [];

            while (
                $p = $res2->fetch_assoc()
            ) {

                $participantesDetalle[] = [

                    "id_usuario" =>
                        (int)$p['id_usuario'],

                    "nombre" =>
                        $p['nombre'],

                    "importe" =>
                        (float)$p['importe'],

                    "pagado" =>
                        (int)$p['pagado']

                ];
            }

            /* ================= NORMALIZAR ================= */

            $row['id_gasto'] =
                (int)$row['id_gasto'];

            $row['id_pagador'] =
                (int)$row['id_pagador'];

            $row['importe'] =
                (float)$row['importe'];

            $row['participantes'] =
                $participantesDetalle;

            $gastos[] = $row;
        }

        echo json_encode([
            "success" => true,
            "gastos" => $gastos
        ]);

        exit;
    }

    /* ===================================================== */
    /* ================= RESUMEN =========================== */
    /* ===================================================== */

    if ($accion === "resumen") {

        $debes = [];

        $recibes = [];

        /* ================= LO QUE DEBES ================= */

        $sql = "
        SELECT
            g.id_pagador,
            u.nombre,
            SUM(gp.importe) as total_gastos

        FROM gastos_participantes gp

        JOIN gastos g
            ON gp.id_gasto = g.id_gasto

        JOIN usuarios u
            ON g.id_pagador = u.id_usuario

        WHERE gp.id_usuario = ?
        AND gp.pagado = 0
        AND g.id_pagador != ?
        AND g.id_piso = ?

        GROUP BY g.id_pagador
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "iii",
            $id_usuario,
            $id_usuario,
            $id_piso
        );

        $stmt->execute();

        $res = $stmt->get_result();

        while ($row = $res->fetch_assoc()) {

            $id_pagador = $row['id_pagador'];

            $sqlPago = "
            SELECT
                COALESCE(SUM(importe),0) as total_pagado
            FROM pagos
            WHERE id_pagador = ?
            AND id_receptor = ?
            AND id_piso = ?
            ";

            $stmtPago = $conn->prepare($sqlPago);

            $stmtPago->bind_param(
                "iii",
                $id_usuario,
                $id_pagador,
                $id_piso
            );

            $stmtPago->execute();

            $resPago = $stmtPago->get_result();

            $pago = $resPago->fetch_assoc();

            $totalPagado =
                (float)$pago['total_pagado'];

            $pendiente =
                (float)$row['total_gastos']
                - $totalPagado;

            if ($pendiente > 0) {

                $debes[] = [

                    "nombre" =>
                        $row['nombre'],

                    "importe" =>
                        round($pendiente, 2)

                ];
            }
        }

        /* ================= LO QUE TE DEBEN ================= */

        $sql = "
        SELECT
            gp.id_usuario,
            u.nombre,
            SUM(gp.importe) as total_gastos

        FROM gastos_participantes gp

        JOIN gastos g
            ON gp.id_gasto = g.id_gasto

        JOIN usuarios u
            ON gp.id_usuario = u.id_usuario

        WHERE g.id_pagador = ?
        AND gp.pagado = 0
        AND gp.id_usuario != ?
        AND g.id_piso = ?

        GROUP BY gp.id_usuario
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "iii",
            $id_usuario,
            $id_usuario,
            $id_piso
        );

        $stmt->execute();

        $res = $stmt->get_result();

        while ($row = $res->fetch_assoc()) {

            $idDeudor = $row['id_usuario'];

            $sqlPago = "
            SELECT
                COALESCE(SUM(importe),0) as total_pagado
            FROM pagos
            WHERE id_pagador = ?
            AND id_receptor = ?
            AND id_piso = ?
            ";

            $stmtPago = $conn->prepare($sqlPago);

            $stmtPago->bind_param(
                "iii",
                $idDeudor,
                $id_usuario,
                $id_piso
            );

            $stmtPago->execute();

            $resPago = $stmtPago->get_result();

            $pago = $resPago->fetch_assoc();

            $totalPagado =
                (float)$pago['total_pagado'];

            $pendiente =
                (float)$row['total_gastos']
                - $totalPagado;

            if ($pendiente > 0) {

                $recibes[] = [

                    "nombre" =>
                        $row['nombre'],

                    "importe" =>
                        round($pendiente, 2)

                ];
            }
        }

        echo json_encode([

            "success" => true,

            "debes" => $debes,

            "recibes" => $recibes

        ]);

        exit;
    }

    /* ===================================================== */
    /* ================= ERROR ============================= */
    /* ===================================================== */

    echo json_encode([
        "success" => false,
        "message" => "Acción no válida"
    ]);

} catch (Exception $e) {

    echo json_encode([

        "success" => false,

        "message" => $e->getMessage()

    ]);
}