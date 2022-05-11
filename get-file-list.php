<?php

// including required file
include "./common.php";
include "./MyFile.php";

$dir = rootDir;
if (isset($_GET['dir']) && $_GET['dir'] != "") $dir = rootDir . DIRECTORY_SEPARATOR . $_GET['dir'];

if (!file_exists($dir)) {
    $response = [
        "status" => "error",
        "message" => "No such file or directory",
    ];
} else {
    $fileNames = scandir($dir);
    $myFilesSorted = organizeFiles($dir, $fileNames);
    $fileList = [];

    foreach ($myFilesSorted as $file) {
        $currFile = new MyFile($file->filePath);

        $temp['fileName'] = $currFile->name;
        $temp['fileIcon'] = getExtensionIconPath($currFile->getExtension());
        $temp['size'] = $currFile->getFormattedSize()["size"];
        $temp['sizeUnit'] = $currFile->getFormattedSize()["unit"];
        $temp['isDir'] = $currFile->isDir();
        $temp['dirLink'] = getDirLink($currFile);
        $temp['lastModified'] = $currFile->lastModified();

        array_push($fileList, $temp);
    }

    $response = [
        "status" => "success",
        "files" => $fileList,
        "currDir" => str_replace(rootDir, "/root", $dir),
    ];
}

// response back to front end
header('Content-Type: application/json; charset=utf-8');
echo json_encode($response);
