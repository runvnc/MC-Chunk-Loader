<?php
  //ini_set('display_errors', true);
  require('readchunk.php');

  //if ($_SERVER['HTTP_IF_MODIFIED_SINCE']) { 
  //  header("HTTP/1.1 304 Not Modified");
  //  exit();
  //}
 
  header("Content-Encoding: gzip");

  if ($_GET['chunklist']) {
    jsonMultipleOut(stripslashes($_GET['chunklist']));
  } else {
    jsonChunkOut($_GET['posx'], $_GET['posz']);
  } 
?>
