<?php

// logging error
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// defining constant variable
define("rootDir", "/home/nahidhasan98/nahid");

function getExtensionIconPath($ext)
{
    $known = [
        "_blank",
        "3gp",
        "aac",
        "ai",
        "aiff",
        "avi",
        "bat",
        "bmp",
        "c",
        "class",
        "cpp",
        "cs",
        "css",
        "csv",
        "dat",
        "deb",
        "dir",
        "dmg",
        "doc",
        "docx",
        "dotx",
        "dwg",
        "dxf",
        "eps",
        "exe",
        "flv",
        "gif",
        "go",
        "h",
        "hpp",
        "html",
        "ics",
        "iso",
        "java",
        "jpg",
        "jpeg",
        "js",
        "json",
        "key",
        "kml",
        "less",
        "mid",
        "mkv",
        "mov",
        "mp3",
        "mp4",
        "mpg",
        "odf",
        "ods",
        "odt",
        "ogg",
        "otf",
        "otp",
        "ots",
        "ott",
        "pdf",
        "php",
        "pl",
        "png",
        "ppt",
        "psd",
        "py",
        "qt",
        "rar",
        "rb",
        "rtf",
        "sass",
        "scss",
        "sh",
        "sql",
        "svg",
        "swift",
        "tga",
        "tgz",
        "tiff",
        "ttf",
        "txt",
        "vb",
        "wav",
        "woff",
        "xls",
        "xlsx",
        "xml",
        "yaml",
        "yml",
        "zip",
        "return"
    ];

    if (in_array($ext, $known) && file_exists("./assets/images/extIconPack/$ext.png"))
        $iconPath = "./assets/images/extIconPack/$ext.png";
    else
        $iconPath = "./assets/images/extIconPack/unknown.png";

    return $iconPath;
}

function organizeFiles($dir, $items)
{
    $dirs = [];
    $files = [];
    foreach ($items as $item) {
        $temp = new MyFile($dir . DIRECTORY_SEPARATOR . $item);
        if ($temp->isDir()) array_push($dirs, $temp);
        else array_push($files, $temp);
    }

    $items = [];
    foreach ($dirs as $dir) array_push($items, $dir);
    foreach ($files as $file) array_push($items, $file);

    return $items;
}

function getDirLink($file)
{
    // root/..                  // root/abc                 // .php?dir=other
    // root/other/..            // root/other/abc           // .php?dir=other/
    // root/other/another/..     // root/other/another/abc    // .php?dir=other/another

    if ($file->name != "..") {
        // if a directory (not /..)
        $dirLink = str_replace(rootDir . "/", "index.php?dir=", $file->filePath);
    } else {
        // if root directory -> won't go back (stay in root)
        if ($file->filePath == rootDir . "/..") $dirLink = "index.php";
        else {
            $index = -1;
            $count = 0;
            for ($i = strlen($file->filePath) - 1; $i >= 0; $i--) {
                if ($file->filePath[$i] == "/") $count++;

                if ($count == 2) {
                    $index = $i;
                    break;
                }
            }

            $temp = substr($file->filePath, 0, $index);

            if ($temp == rootDir) $dirLink = "index.php";
            else $dirLink = str_replace(rootDir . "/", "index.php?dir=", $temp);
        }
    }

    return $dirLink;
}

function parsePOSTInput()
{
    $data = file_get_contents("php://input");

    if ($data == false) return null;
    return json_decode($data);
}
