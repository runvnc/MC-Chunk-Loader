<?php
  require('readchunk.php');

  header("Content-type: application/x-gzip");

  jsonchunkout($_GET['file']);
   
?>
