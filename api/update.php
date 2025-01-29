<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

session_start();

if (isset($_SESSION["authenticated"]) && $_SESSION["authenticated"] === true) {
    echo json_encode(["status" => "authenticated"]);
    exit;
} else {
    echo json_encode(["status" => "unauthenticated"]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $jsonData = file_get_contents("php://input");

    if ($jsonData) {
        file_put_contents("../data/offers.json", $jsonData);
        echo json_encode(["status" => "success", "message" => "Offers updated successfully!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid data received!"]);
    }
}
