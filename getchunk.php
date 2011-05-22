<?php
  require('readchunk.php');

  header("Content-Encoding: gzip");

  jsonChunkOut($_GET['posx'], $_GET['posz']);
?>
