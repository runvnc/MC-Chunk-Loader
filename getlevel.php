<?php

require_once('readchunk.php');

$wf = $_SERVER['SCRIPT_FILENAME'];
$pos = strrpos($wf, '/');
$wd = substr($wf, 0, $pos);

$levelfile = $wd.'/world/level.dat';

header("Content-Encoding: gzip");

jsonFileOut($levelfile);

?>
