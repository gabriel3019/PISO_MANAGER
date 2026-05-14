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

$id_usuario = (int)$_SESSION['id_usuario'];

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

$importe = (float)($_POST['importe'] ?? 0);

$pagador = (int)($_POST['pagador'] ?? $id_usuario);

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
            empty($titulo) ||
            $importe <= 0 ||
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

        /* ===================================================== */
        /* ================= DIVISION MANUAL =================== */
        /* ===================================================== */

        if (!empty($importesManual)) {

            foreach ($importesManual as $uid => $parte) {

                $uid = (int)$uid;

                $parte = (float)$parte;

                if ($parte <= 0) {
                    continue;
                }

                $pagado =
                    ((int)$uid === (int)$pagador)
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

            /* ===================================================== */
            /* ================= DIVISION IGUAL ==================== */
            /* ===================================================== */

            $cantidad =
                count($participantes);

            $parteBase =
                floor(($importe / $cantidad) * 100) / 100;

            $totalAsignado =
                $parteBase * $cantidad;

            $diferencia =
                round($importe - $totalAsignado, 2);

            foreach ($participantes as $index => $uid) {

                $uid = (int)$uid;

                $parte = $parteBase;

                if ($index === 0) {

                    $parte += $diferencia;

                }

                $pagado =
                    ((int)$uid === (int)$pagador)
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
    /* ================= EDITAR ============================ */
    /* ===================================================== */

    if (
        $accion === "editar" &&
        $id_gasto
    ) {

        $id_gasto = (int)$id_gasto;

        if (
            empty($titulo) ||
            $importe <= 0 ||
            empty($participantes)
        ) {

            echo json_encode([
                "success" => false,
                "message" => "Datos incompletos"
            ]);

            exit;
        }

        /* ===================================================== */
        /* ================= ACTUALIZAR GASTO ================== */
        /* ===================================================== */

        $sql = "
        UPDATE gastos
        SET
            descripcion = ?,
            monto_total = ?,
            id_pagador = ?
        WHERE id_gasto = ?
        AND id_piso = ?
        ";

        $stmt = $conn->prepare($sql);

        $stmt->bind_param(
            "sdiii",
            $titulo,
            $importe,
            $pagador,
            $id_gasto,
            $id_piso
        );

        $stmt->execute();

        /* ===================================================== */
        /* ========= ELIMINAR PARTICIPANTES ANTIGUOS =========== */
        /* ===================================================== */

        $sqlDelete = "
        DELETE FROM gastos_participantes
        WHERE id_gasto = ?
        ";

        $stmtDelete = $conn->prepare($sqlDelete);

        $stmtDelete->bind_param(
            "i",
            $id_gasto
        );

        $stmtDelete->execute();

        /* ===================================================== */
        /* =============== REINSERTAR NUEVOS =================== */
        /* ===================================================== */

        if (!empty($importesManual)) {

            foreach ($importesManual as $uid => $parte) {

                $uid = (int)$uid;

                $parte = (float)$parte;

                if ($parte <= 0) {
                    continue;
                }

                $pagado =
                    ((int)$uid === (int)$pagador)
                    ? 1
                    : 0;

                $sqlInsert = "
                INSERT INTO gastos_participantes
                (
                    id_gasto,
                    id_usuario,
                    importe,
                    pagado
                )
                VALUES (?, ?, ?, ?)
                ";

                $stmtInsert =
                    $conn->prepare($sqlInsert);

                $stmtInsert->bind_param(
                    "iidi",
                    $id_gasto,
                    $uid,
                    $parte,
                    $pagado
                );

                $stmtInsert->execute();
            }

        } else {

            $cantidad =
                count($participantes);

            $parteBase =
                floor(($importe / $cantidad) * 100) / 100;

            $totalAsignado =
                $parteBase * $cantidad;

            $diferencia =
                round($importe - $totalAsignado, 2);

            foreach ($participantes as $index => $uid) {

                $uid = (int)$uid;

                $parte = $parteBase;

                if ($index === 0) {

                    $parte += $diferencia;

                }

                $pagado =
                    ((int)$uid === (int)$pagador)
                    ? 1
                    : 0;

                $sqlInsert = "
                INSERT INTO gastos_participantes
                (
                    id_gasto,
                    id_usuario,
                    importe,
                    pagado
                )
                VALUES (?, ?, ?, ?)
                ";

                $stmtInsert =
                    $conn->prepare($sqlInsert);

                $stmtInsert->bind_param(
                    "iidi",
                    $id_gasto,
                    $uid,
                    $parte,
                    $pagado
                );

                $stmtInsert->execute();
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

        $id_gasto = (int)$id_gasto;

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

            $sqlParticipantes = "
            SELECT
                u.id_usuario,
                u.nombre,
                gp.importe,
                gp.pagado,

                COALESCE(
                    (
                        SELECT SUM(p.importe)
                        FROM pagos p
                        JOIN gastos g2
                            ON g2.id_gasto = gp.id_gasto
                        WHERE p.id_pagador = gp.id_usuario
                        AND p.id_receptor = g2.id_pagador
                        AND p.id_piso = g2.id_piso
                    ),
                    0
                ) AS total_pagado

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

                $importeParticipante =
                    (float)$p['importe'];

                $totalPagado =
                    (float)$p['total_pagado'];

                $estaPagado =
                    $totalPagado >= $importeParticipante
                    || (int)$p['pagado'] === 1;

                $participantesDetalle[] = [

                    "id_usuario" =>
                        (int)$p['id_usuario'],

                    "nombre" =>
                        $p['nombre'],

                    "importe" =>
                        $importeParticipante,

                    "pagado" =>
                        $estaPagado ? 1 : 0

                ];
            }

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

        $sql = "
        SELECT
            g.id_pagador,
            u.nombre,
            SUM(gp.importe) AS total

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

            $id_pagador =
                (int)$row['id_pagador'];

            $sqlPago = "
            SELECT
                COALESCE(SUM(importe),0) AS total_pagado
            FROM pagos
            WHERE id_pagador = ?
            AND id_receptor = ?
            AND id_piso = ?
            ";

            $stmtPago =
                $conn->prepare($sqlPago);

            $stmtPago->bind_param(
                "iii",
                $id_usuario,
                $id_pagador,
                $id_piso
            );

            $stmtPago->execute();

            $resPago =
                $stmtPago->get_result();

            $pago =
                $resPago->fetch_assoc();

            $totalPagado =
                (float)$pago['total_pagado'];

            $pendiente = round(
                (float)$row['total']
                - $totalPagado,
                2
            );

            if ($pendiente >= 0.01) {

                $debes[] = [

                    "nombre" =>
                        $row['nombre'],

                    "importe" =>
                        $pendiente

                ];
            }
        }

        $sql = "
        SELECT
            gp.id_usuario,
            u.nombre,
            SUM(gp.importe) AS total

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

            $idDeudor =
                (int)$row['id_usuario'];

            $sqlPago = "
            SELECT
                COALESCE(SUM(importe),0) AS total_pagado
            FROM pagos
            WHERE id_pagador = ?
            AND id_receptor = ?
            AND id_piso = ?
            ";

            $stmtPago =
                $conn->prepare($sqlPago);

            $stmtPago->bind_param(
                "iii",
                $idDeudor,
                $id_usuario,
                $id_piso
            );

            $stmtPago->execute();

            $resPago =
                $stmtPago->get_result();

            $pago =
                $resPago->fetch_assoc();

            $totalPagado =
                (float)$pago['total_pagado'];

            $pendiente = round(
                (float)$row['total']
                - $totalPagado,
                2
            );

            if ($pendiente >= 0.01) {

                $recibes[] = [

                    "nombre" =>
                        $row['nombre'],

                    "importe" =>
                        $pendiente

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