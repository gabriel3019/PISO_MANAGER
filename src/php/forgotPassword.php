<?php
require_once __DIR__ . '/BBDD/conecta.php';

$email = $_POST['email'];

$stmt = $conn->prepare(
    "SELECT id_usuario
     FROM usuarios
     WHERE email = ?"
);

$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows > 0) {

    $token = bin2hex(random_bytes(32));

    $expira = date(
        "Y-m-d H:i:s",
        strtotime("+1 hour")
    );

    $update = $conn->prepare(
        "UPDATE usuarios
         SET reset_token = ?,
             reset_expira = ?
         WHERE email = ?"
    );

    $update->bind_param(
        "sss",
        $token,
        $expira,
        $email
    );

    $update->execute();

    header(
        "Location: resetPassword.php?token=" . $token
    );

    exit;
}

echo "No existe ningún usuario con ese correo";