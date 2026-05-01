<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "piso_manager";

require_once __DIR__ . '/crear_tabla.php';

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión con la base de datos'
    ]);
    exit;
}

$conn->set_charset("utf8mb4");
?>