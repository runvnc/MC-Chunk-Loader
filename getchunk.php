<?php
  //ini_set('display_errors', true);
  require('readchunk.php');
  
  header("Content-Encoding: gzip");

  if ($_GET['chunklist']) {
    jsonMultipleOut(json_decode(stripslashes($_GET['chunklist'])));
  } else {
    jsonChunkOut($_GET['posx'], $_GET['posz']);
  }
?>
