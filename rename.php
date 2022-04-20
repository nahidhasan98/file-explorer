<?php

include "./common.php";
include "./MyFile.php";

$response = [
    "status" => "error",
    "message" => "Error: file could not be renamed."
];

// If form is submitted 
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // getting data from POST value
    $oldName = $_POST["oldName"];
    $oldName = str_replace("/root", rootDir, $oldName);

    $newName = $_POST["rename"];
    $newName = str_replace("/root", rootDir, $newName);

    if (file_exists($newName)) {
        $response['message'] = "Error: a file/folder already exist with this name.";
    } else {
        $result = rename($oldName, $newName);

        if ($result) {
            $createdFile = new MyFile($newName);

            $response['status'] = "success";
            $response['message'] = "Success: file renamed successfully.";
            $response['fileName'] = $createdFile->name;
            $response['fileIcon'] = getExtensionIconPath($createdFile->getExtension());
            $response['size'] = $createdFile->getFormattedSize()["size"];
            $response['sizeUnit'] = $createdFile->getFormattedSize()["unit"];
            $response['isDir'] = $createdFile->isDir();
            $response['dirLink'] = getDirLink($createdFile);
        }
    }
}

// return response 
echo json_encode($response);
