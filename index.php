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
  try {
    $result = (5 / 0);
    echo "here";
  } catch (Exception $e) {
    echo $e->getMessage();;
  }
  echo "hel";
  ?>
</body>

</html>