<?php

class MyFile
{
    public $name, $filePath;

    function __construct($filePath)
    {
        $this->filePath = $filePath;
        $this->name = basename($filePath);
    }

    function getSizeInBytes()
    {
        return filesize($this->filePath);
    }

    function getFormattedSize()
    {
        $size = $this->getSizeInBytes();

        if ($size < 1024) return ["size" => $size, "unit" => "bytes"];
        if ($size < pow(1024, 2)) return ["size" => round($size / pow(1024, 1), 2), "unit" => "kB"];
        if ($size < pow(1024, 3)) return ["size" => round($size / pow(1024, 2), 2), "unit" => "MB"];
        if ($size < pow(1024, 4)) return ["size" => round($size / pow(1024, 3), 2), "unit" => "GB"];
    }

    function getExtension()
    {
        setlocale(LC_ALL, 'en_US.UTF-8');   // deal with non ASCII characters
        $pathInfo = pathinfo($this->filePath);

        if ($this->name == "." || $this->name == "..") return "return";
        if (is_dir($this->filePath)) return "dir";
        if (empty($pathInfo['extension'])) return "_blank";
        return $pathInfo['extension'];
    }

    function isDir()
    {
        return is_dir($this->filePath);
    }
}
