<?php

include "./common.php";
include "./MyFile.php";

$fileName = $_GET["fileToDownload"];
$fileName = str_replace("/root", rootDir, $fileName);

$filePaths = explode(",", $fileName);

if (isset($_GET["todo"])) { // batch download
    if ($_GET["todo"] == "compress") {
        // changing current directory to tmp
        chdir(sys_get_temp_dir());
        $zipName = "files.zip";

        // creating new zip file
        $zip = new ZipArchive();
        $res = $zip->open($zipName, ZipArchive::CREATE | ZIPARCHIVE::OVERWRITE);

        // adding files to zip
        if ($res) {
            foreach ($filePaths as $filePath) {
                if (file_exists($filePath)) $zip->addFile($filePath, basename($filePath));
            }
        }

        $zip->close();

        $response["status"] = "ok";
        echo json_encode($response);
    } else {
        chdir(sys_get_temp_dir());
        $zipName = "files.zip";

        header("Content-Type: " . mime_content_type($zipName));
        header("Content-disposition: attachment; filename=" . $zipName);

        readfile($zipName);
    }
} else { // single file download
    $filePath = $filePaths[0];
    $fileName = basename($filePath);

    if (!file_exists($filePath)) echo "Error: $fileName doesn't exist.";
    else {
        header("Content-Type: " . mime_content_type($filePath));
        header("Content-disposition: attachment; filename=$fileName");

        readfile($filePath);
    }
}
