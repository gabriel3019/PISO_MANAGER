<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "piso_manager"; 

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