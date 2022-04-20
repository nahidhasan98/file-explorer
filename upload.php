<?php

include "./common.php";
include "./MyFile.php";

$response = [
    'status' => "error",
    'message' => 'form submission failed, please try again.',
    'type' => ""
];

// checking for file existance
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET["todo"])) {
        $fileName = $_GET["file"];
        $currDir = $_GET["currDir"];
        $currDir = str_replace("/root", rootDir, $currDir);
        $target_dir = $currDir . "/";
        $targetFilePath = $target_dir . $fileName;

        $res = file_exists($targetFilePath);

        $response['status'] = "success";
        $response['message'] = $res;
        $response['fileName'] = basename($targetFilePath);
    }
}

// If form is submitted 
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // getting current directory from POST value
    $fileName = basename($_FILES["fileToUpload"]["name"]);
    $currDir = $_POST["currDir"];
    $replaceType = $_POST["replaceType"];
    $customName = $_POST["customName"];
    $currDir = str_replace("/root", rootDir, $currDir);

    $target_dir = $currDir . "/";
    $targetFilePath = $target_dir . $fileName;
    $fileType = strtolower(pathinfo($targetFilePath, PATHINFO_EXTENSION));

    // Get the submitted form data 
    $uploadStatus = 0;

    // Upload file 
    if (!empty($_FILES["fileToUpload"]["name"])) {
        // replaceType = false [very first time request]
        // replaceType = true [overwrite existing file]
        // replaceType = custom [create new file with custom name]

        if ($replaceType == "custom") {
            $targetFilePath = $target_dir . $customName;
        }

        if (file_exists($targetFilePath) && $replaceType != "true") { // very first request
            $response["type"] = "duplicate";
            $response['message'] = 'Error: File already exist!';
            $response['fileName'] = basename($targetFilePath);
        } else {
            // Upload file to the server 
            if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $targetFilePath)) {
                $uploadStatus = 1;
                $uploadedFile = new MyFile($targetFilePath);
            } else $response['message'] = 'Error: Sorry, there was an error while uploading your file.';
        }
    } else $response['message'] = 'Error: Empty file. Please provide a file.';

    if ($uploadStatus == 1) {
        $response['status'] = "success";
        $response['message'] = 'Success: uploaded ' . $uploadedFile->name;
        $response['fileName'] = $uploadedFile->name;
        $response['fileIcon'] = getExtensionIconPath($uploadedFile->getExtension());
        $response['size'] = $uploadedFile->getFormattedSize()["size"];
        $response['sizeUnit'] = $uploadedFile->getFormattedSize()["unit"];
        $response['isDir'] = $uploadedFile->isDir();
    }
}

// Return response 
echo json_encode($response);
