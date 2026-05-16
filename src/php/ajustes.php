<?php

session_start();

require_once __DIR__ . "/BBDD/conecta.php";

header("Content-Type: application/json");

/* =========================================================
   SESSION
========================================================= */

if (!isset($_SESSION['id_usuario'])) {

    echo json_encode([
        "success" => false,
        "error" => "No sesión"
    ]);

    exit;
}

$id_usuario = $_SESSION['id_usuario'];

/* =========================================================
   INPUT
========================================================= */

$input = json_decode(
    file_get_contents("php://input"),
    true
);

$action =
    $input['action']
    ?? ($_POST['action'] ?? '');

/* =========================================================
   OBTENER PERFIL
========================================================= */

if ($action === "perfil") {

    $stmt = $conn->prepare("
        SELECT 
            nombre,
            apellidos,

            dni,
            fecha_nacimiento,
            nacionalidad,

            email,

            telefono,
            numero_cuenta,

            direccion,
            ciudad,
            codigo_postal,

            fecha_entrada,

            contacto_emergencia,
            telefono_emergencia,

            foto,
            modo_oscuro

        FROM usuarios

        WHERE id_usuario = ?
    ");

    $stmt->bind_param(
        "i",
        $id_usuario
    );

    $stmt->execute();

    $res = $stmt
        ->get_result()
        ->fetch_assoc();

    echo json_encode([
        "success" => true,
        "usuario" => $res
    ]);

    exit;
}

/* =========================================================
   GUARDAR PERFIL
========================================================= */

if ($action === "guardar") {

    $nombre = trim(
        $input['nombre'] ?? ''
    );

    $apellidos = trim(
        $input['apellidos'] ?? ''
    );

    $dni = trim(
        $input['dni'] ?? ''
    );

    $fecha_nacimiento =
        $input['fecha_nacimiento'] ?? null;

    $nacionalidad = trim(
        $input['nacionalidad'] ?? ''
    );

    $email = trim(
        $input['email'] ?? ''
    );

    $telefono = trim(
        $input['telefono'] ?? ''
    );

    $numero_cuenta = trim(
        $input['numero_cuenta'] ?? ''
    );

    $direccion = trim(
        $input['direccion'] ?? ''
    );

    $ciudad = trim(
        $input['ciudad'] ?? ''
    );

    $codigo_postal = trim(
        $input['codigo_postal'] ?? ''
    );

    $fecha_entrada =
        $input['fecha_entrada'] ?? null;

    $contacto_emergencia = trim(
        $input['contacto_emergencia'] ?? ''
    );

    $telefono_emergencia = trim(
        $input['telefono_emergencia'] ?? ''
    );

    /* =====================================================
       VALIDACIONES
    ===================================================== */

    if (!$nombre || !$email) {

        echo json_encode([
            "success" => false,
            "error" =>
                "Nombre y email obligatorios"
        ]);

        exit;
    }

    /* =====================================================
       UPDATE
    ===================================================== */

    $stmt = $conn->prepare("
        UPDATE usuarios

        SET

            nombre = ?,
            apellidos = ?,

            dni = ?,
            fecha_nacimiento = ?,
            nacionalidad = ?,

            email = ?,

            telefono = ?,
            numero_cuenta = ?,

            direccion = ?,
            ciudad = ?,
            codigo_postal = ?,

            fecha_entrada = ?,

            contacto_emergencia = ?,
            telefono_emergencia = ?

        WHERE id_usuario = ?
    ");

    $stmt->bind_param(

        "ssssssssssssssi",

        $nombre,
        $apellidos,

        $dni,
        $fecha_nacimiento,
        $nacionalidad,

        $email,

        $telefono,
        $numero_cuenta,

        $direccion,
        $ciudad,
        $codigo_postal,

        $fecha_entrada,

        $contacto_emergencia,
        $telefono_emergencia,

        $id_usuario
    );

    $stmt->execute();

    echo json_encode([
        "success" => true
    ]);

    exit;
}

/* =========================================================
   MODO OSCURO
========================================================= */

if ($action === "modoOscuro") {

    $valor = isset($input['valor'])
        ? (int)$input['valor']
        : 0;

    $stmt = $conn->prepare("
        UPDATE usuarios

        SET modo_oscuro = ?

        WHERE id_usuario = ?
    ");

    $stmt->bind_param(
        "ii",
        $valor,
        $id_usuario
    );

    $stmt->execute();

    echo json_encode([
        "success" => true
    ]);

    exit;
}

/* =========================================================
   SUBIR FOTO
========================================================= */

if ($action === "foto") {

    if (!isset($_FILES['foto'])) {

        echo json_encode([
            "success" => false,
            "error" => "No hay archivo"
        ]);

        exit;
    }

    $archivo = $_FILES['foto'];

    /* =====================================================
       VALIDAR FORMATO
    ===================================================== */

    $permitidos = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (
        !in_array(
            $archivo['type'],
            $permitidos
        )
    ) {

        echo json_encode([
            "success" => false,
            "error" =>
                "Formato no permitido"
        ]);

        exit;
    }

    /* =====================================================
       NOMBRE UNICO
    ===================================================== */

    $nombreArchivo =
        time() . "_" .
        preg_replace(
            "/[^a-zA-Z0-9.]/",
            "",
            $archivo["name"]
        );

    /* =====================================================
       RUTAS
    ===================================================== */

    $rutaServidor =
        __DIR__ .
        "/../uploads/" .
        $nombreArchivo;

    $rutaBD =
        "uploads/" .
        $nombreArchivo;

    /* =====================================================
       CREAR CARPETA
    ===================================================== */

    if (
        !is_dir(
            __DIR__ . "/../uploads"
        )
    ) {

        mkdir(
            __DIR__ . "/../uploads",
            0777,
            true
        );
    }

    /* =====================================================
       SUBIR ARCHIVO
    ===================================================== */

    if (
        move_uploaded_file(
            $archivo["tmp_name"],
            $rutaServidor
        )
    ) {

        $stmt = $conn->prepare("
            UPDATE usuarios

            SET foto = ?

            WHERE id_usuario = ?
        ");

        $stmt->bind_param(
            "si",
            $rutaBD,
            $id_usuario
        );

        $stmt->execute();

        echo json_encode([
            "success" => true,
            "ruta" => $rutaBD
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "error" =>
                "Error subiendo imagen"
        ]);
    }

    exit;
}

/* =========================================================
   DEFAULT
========================================================= */

echo json_encode([
    "success" => false,
    "error" => "Acción no válida"
]);