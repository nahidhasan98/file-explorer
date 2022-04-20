<?php

// including required file
include "./common.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = parsePOSTInput();
    $items = $data->fileToDelete;

    if (is_array($items)) { // multiple/batch delete
        $successCounter = 0;
        $unsuccessCounter = 0;

        foreach ($items as $item) {
            $filePath = str_replace("/root", rootDir, $item->filePath);
            try {
                $result = deleteFile($filePath);
                $successCounter++;
            } catch (Exception $e) {
                $unsuccessCounter++;
            }
        }
        $response = [
            "status" => "success",
            "message" => "Deleted Successful: $successCounter files / Delete failed: $unsuccessCounter files",
        ];
    } else {
        $filePath = str_replace("/root", rootDir, $items);
        try {
            $result = deleteFile($filePath);
            $response = [
                "status" => "success",
                "message" => "Successfully deleted file: " . basename($filePath)
            ];
        } catch (Exception $e) {
            $result = $e->getMessage();
            $response = [
                "status" => "error",
                "message" => "File couldn't be deleted: $result"
            ];
        }
    }

    // response back to front end
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response);
}

function deleteFile($filePath)
{
    // for /. & /..
    if (preg_match('/^(.)*(\/\.)$/', $filePath) || preg_match('/^(.)*(\/\.\.)$/', $filePath))
        throw new Exception("invalid operation");

    if (!file_exists($filePath)) throw new Exception("No such file or directory.");
    if (!is_dir($filePath)) return unlink($filePath);

    // if file is a directory, then recursively deleting all items
    foreach (scandir($filePath) as $item) {
        if ($item == '.' || $item == '..') continue;
        if (!deleteFile($filePath . DIRECTORY_SEPARATOR . $item)) return false;
    }

    return rmdir($filePath);    // finally deleting dir containing . & ..
}
