<?php
session_start();

$admin_key = "123456"; // Change if dont  wanna get f*cked up

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    if (isset($_SESSION["authenticated"]) && $_SESSION["authenticated"] === true) {
        echo json_encode(["status" => "authenticated"]);
        exit;
    } else {
        echo json_encode(["status" => "unauthenticated"]);
    }
}


if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $input_key = trim($_POST["key"]);

    if ($input_key === $admin_key) {
        $_SESSION["authenticated"] = true;
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid admin key!"]);
    }
}
