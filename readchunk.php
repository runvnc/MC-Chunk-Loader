<?php
ini_set('display_errors', true);
ini_set('memory_limit', '200M');

$wf = $_SERVER['SCRIPT_FILENAME'];
$pos = strrpos($wf, '/');
$wd = substr($wf, 0, $pos);

$CHUNK_DIR = $wd . '/chunks/';
$REGION_DIR = $wd . '/world/region/';

function floormod($a, $b) { return (($a % $b) + $b) % $b; }

function readChunk($posx, $posz) {
  global $REGION_DIR;

  // calculate region file to read
  $regionX = floor($posx / 32);
  $regionZ = floor($posz / 32);

  // open region file, seek to header info
  $file = gzopen($REGION_DIR . "r.$regionX.$regionZ.mcr", 'r');

  $chunkHeaderLoc = 4 * (floormod($posx, 32) + floormod($posz, 32) * 32);
  gzseek($file, $chunkHeaderLoc);
  $info = unpack('C*', gzread($file, 4));
  $chunkDataLoc = ($info[1]<<16)|($info[2]<<8)|($info[3]);

  // if chunk hasn't been generated, return empty
  if($chunkDataLoc == 0) {
    return array();
  }
  
  // seek to data, write to gz and return
  gzseek($file, $chunkDataLoc * 4096);
  $info = unpack('C*', gzread($file, 4));
  $chunkLength = ($info[1]<<32)|($info[2]<<16)|($info[3]<<8)|($info[4]);
  
  // read to skip over compression byte
  gzread($file, 1);

  // skip first two bytes for deflate
  gzread($file, 2);
  // leave off last four bytes for deflate
  $chunkLength -= 4;

  $contents = gzread($file, $chunkLength - 1);
  $contents = gzinflate($contents);
  $data = array_merge(unpack("C*", $contents));
  return $data;
}

function jsonFileOut($path) {
  if (file_exists($path.'.json.gz')) {
    echo file_get_contents($path.'.json.gz');
    return true;
  } else {
    $zd = gzopen($path, "r");
    $contents = gzread($zd, 9990000);
    gzclose($zd);
    
    $json = json_encode(array_merge(unpack("C*", $contents)));
    $gz = gzencode($json);

    $zd2 = fopen($path.'.json.gz', 'wb');    
    fwrite($zd2, $gz);
    fclose($zd2);
    
    echo $gz;

    return true;
  }
}

function jsonChunkOut($posx, $posz) {
  global $CHUNK_DIR;
  $chunkFile = $CHUNK_DIR . "c.$posx.$posz.json.gz";
  if(file_exists($chunkFile)) {
    echo file_get_contents($chunkFile);
    return true;
  } else {
    $chunkData = readChunk($posx, $posz);

    $gz = gzencode(json_encode($chunkData));

    $cf = fopen($chunkFile, 'wb');
    fwrite($cf, $gz);
    fclose($cf);

    echo $gz;

    return true;
  }
}

function jsonMultipleOut($list) {
  global $CHUNK_DIR;
  $combined = array();
  $count = count($list);
  for ($i=0; $i<$count; $i++) {
    $chunk = $list[$i];
    if (array_key_exists('x', $chunk)) {
      $posx = $chunk->x;
      $posz = $chunk->z;
      $chunkFile = $CHUNK_DIR . "c.$posx.$posz.json";
      if(file_exists($chunkFile)) {
        $chunkData = json_decode(file_get_contents($chunkFile));
      } else {
        $chunkData = readChunk($posx, $posz);
        $cf = fopen($chunkFile, 'wb');
        fwrite($cf, json_encode($chunkData));
        fclose($cf);
      }
      $combined[] = $chunkData;
    }
  }
  $gz = gzencode(json_encode($combined));
  echo $gz;
  return true;
}


?>
