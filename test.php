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
  <img src="./assets/images/search.png" alt="" srcset="" title="Search" class="">

  <?php
  include "./common.php";

  // echo "hello";

  $file_to_search = "new";

  search_file(rootDir, $file_to_search);


  function search_file($dir, $file_to_search)
  {

    $files = scandir($dir);

    foreach ($files as $key => $value) {

      $path = realpath($dir . DIRECTORY_SEPARATOR . $value);

      if (!is_dir($path)) {
        // if ($file_to_search == $value) {
        $matched = preg_match("/" . $file_to_search . "/", $value);
        if ($matched) {
          echo "<br>file found<br>";
          echo $path;
          break;
        }
      } else if ($value != "." && $value != "..") {

        search_file($path, $file_to_search);
      }
    }
  }

  ?>
</body>

</html>