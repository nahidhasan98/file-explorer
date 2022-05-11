<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mydomain website</title>
  <link rel="stylesheet" href="./assets/styles/main.css">
</head>

<body>
  <h1>Hello World!</h1>

  <p>This is the landing page of <strong>mydomain</strong>.</p>

  <?php
  include "./common.php";
  include "./MyFile.php";

  $files = scandir(rootDir . "/some folder/dir");

  foreach ($files as $file) {
    $f = new MyFile("/root/some folder/dir/" . $file);
    echo $f->name . " " . $f->filePath . "<br>";

    echo "27 " . getDirLink($f) . "<br>";
  }

  ?>
</body>

</html>