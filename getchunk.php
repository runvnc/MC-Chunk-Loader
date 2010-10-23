<?php
  require('readchunk.php');

  header("Content-Encoding: gzip");

  $wf = $_SERVER['SCRIPT_FILENAME'];
  $pos = strrpos($wf, '/');
  $wd = substr($wf, 0, $pos);

  jsonchunkout($wd . '/world' .$_GET['file']);
   
?>
