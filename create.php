<?php

include "./common.php";
include "./MyFile.php";

$response = [
    "status" => "error",
    "message" => ""
];

// If form is submitted 
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $status = false;

    // getting data from POST value
    $fileName = $_POST["create"];
    $fileType = $_POST["fileType"];
    $currDir = $_POST["currDir"];
    $currDir = str_replace("/root", rootDir, $currDir);

    $target_dir = $currDir . "/";
    $targetFilePath = $target_dir . $fileName;

    if (file_exists($targetFilePath)) {
        $response['message'] = "Error: $fileType already exist.";
    } else {
        if ($fileType == "file") {
            $newFile = fopen($targetFilePath, "w");
            if (!$newFile) $response['message'] = "Error: Failed to create file.";
            else $status = true;
            fclose($newFile);
        } else {
            $ok = mkdir($targetFilePath);
            if (!$ok) $response['message'] = "Error: Failed to create directory.";
            else $status = true;
        }

        if ($status) {
            $createdFile = new MyFile($targetFilePath);

            $response['status'] = "success";
            $response['message'] = "Success: $fileType created successfully.";
            $response['fileName'] = $createdFile->name;
            $response['fileIcon'] = getExtensionIconPath($createdFile->getExtension());
            $response['size'] = $createdFile->getFormattedSize()["size"];
            $response['sizeUnit'] = $createdFile->getFormattedSize()["unit"];
            $response['isDir'] = $createdFile->isDir();
            $response['dirLink'] = getDirLink($createdFile);
            $response['lastModified'] = $createdFile->lastModified();
        }
    }
}

// return response 
echo json_encode($response);
