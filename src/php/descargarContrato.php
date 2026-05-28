<?php
session_start();

$conexion = new mysqli("localhost", "root", "", "piso_manager");
$conexion->set_charset("utf8");

if ($conexion->connect_error) {
    die("Error de conexión");
}

if (!isset($_SESSION["id_usuario"])) {
    die("No hay sesión iniciada");
}

if (!isset($_GET["id_piso"])) {
    die("No se ha recibido el piso");
}

$id_usuario = $_SESSION["id_usuario"];
$id_piso = intval($_GET["id_piso"]);

/* Comprobar que el admin pertenece a ese piso */
$sql = "
SELECT p.*
FROM pisos p
INNER JOIN usuarios_pisos up ON p.id_piso = up.id_piso
WHERE p.id_piso = ? AND up.id_usuario = ?
";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ii", $id_piso, $id_usuario);
$stmt->execute();
$piso = $stmt->get_result()->fetch_assoc();

if (!$piso) {
    die("No tienes permiso para descargar este contrato");
}

/* Inquilinos del piso */
$sql = "
SELECT 
    u.nombre,
    u.apellidos,
    u.dni,
    u.telefono,
    u.fecha_entrada
FROM usuarios u

INNER JOIN usuarios_pisos up
    ON u.id_usuario = up.id_usuario

WHERE up.id_piso = ?
AND up.rol = 'miembro'
";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_piso);
$stmt->execute();
$res = $stmt->get_result();

$inquilinos = [];
while ($row = $res->fetch_assoc()) {
    $inquilinos[] = $row;
}

$nombreArchivo = "Contrato_" . str_replace(" ", "_", $piso["calle"]) . ".doc";

header("Content-Type: application/vnd.ms-word; charset=utf-8");
header("Content-Disposition: attachment; filename=$nombreArchivo");
header("Pragma: no-cache");
header("Expires: 0");
?>

<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Contrato del piso</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }

        h1,
        h2 {
            text-align: center;
        }

        .section {
            margin-top: 25px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        th,
        td {
            border: 1px solid #333;
            padding: 8px;
        }

        .firma {
            margin-top: 60px;
        }
    </style>
</head>

<body>

    <h1>CONTRATO DE ALQUILER DE PISO COMPARTIDO</h1>

    <div class="section">
        <h2>Datos del piso</h2>

        <p><strong>Casero:</strong> <?= htmlspecialchars($piso["nombre_casero"]) ?></p>
        <p><strong>Dirección:</strong> <?= htmlspecialchars($piso["calle"]) ?></p>
        <p><strong>Ciudad:</strong> <?= htmlspecialchars($piso["ciudad"]) ?></p>
        <p><strong>Código postal:</strong> <?= htmlspecialchars($piso["codigo_postal"]) ?></p>
    </div>

    <div class="section">
        <h2>Inquilinos</h2>

        <?php foreach ($inquilinos as $inquilino): ?>
            <p>
                <strong><?= htmlspecialchars($inquilino["nombre"] . " " . $inquilino["apellidos"]) ?></strong>,
                con DNI <?= htmlspecialchars($inquilino["dni"]) ?>,
                teléfono <?= htmlspecialchars($inquilino["telefono"]) ?>
                y fecha de entrada <?= htmlspecialchars($inquilino["fecha_entrada"]) ?>.
            </p>
        <?php endforeach; ?>
    </div>

    <div class="section">
        <h2>Cláusulas del contrato</h2>

        <p>
            El casero cede el uso del piso indicado anteriormente a los inquilinos registrados,
            quienes se comprometen a hacer un uso responsable de la vivienda, respetar las normas
            de convivencia y mantener el inmueble en buen estado.
        </p>

        <p>
            Los inquilinos deberán comunicar cualquier incidencia relacionada con la vivienda
            mediante la plataforma PSIO Manager.
        </p>

        <p>
            Este documento se genera automáticamente con los datos registrados en la base de datos.
        </p>
    </div>

    <div class="firma">
        <p>Firma del casero: ___________________________</p>
        <p>Firma de los inquilinos: ___________________________</p>
    </div>

</body>

</html>