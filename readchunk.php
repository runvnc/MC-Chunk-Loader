<?php

/* return the value of the most significant bit */
function get_ms1bit(/*int*/ $i)
{
    $x = 0;
    for ($j = $i; $i && !($j == 1); $j >>= 1) { $x++; }
    return $i ? $j <<= $x: 0;
}

function readint($str, $name) {
  $pos = strpos($str, $name);

  if ($pos === false) return -1;

  $datx = substr($str, $pos+4, 4);

  $dat = unpack('C*', $datx);
  
  if (get_ms1bit($dat[4]) == 128) 
    $isnegative = true;
  else
    $isnegative = false;
  
  $Number = ($dat[1]<<24) | ($dat[2]<<16) | ($dat[3]<<8) | ($dat[4]);

  if ($isnegative) {
    $Number = -(pow(2, 32) - $Number);
  }

  return $Number;
}

function readchunk($path) {
  $zd = gzopen($path, "r");
  $contents = gzread($zd, 9990000);
  gzclose($zd);

  $ret = array();
  $ret['xpos'] = readint($contents,'xPos');
  $ret['zpos'] = readint($contents,'zPos');

  if (file_exists($path.'.gz')) unlink($path.'.gz');
  if (file_exists($path.'.b6z')) unlink($path.'.b6z');

  $b64 = base64_encode($contents);
  $zd2 = gzopen($path.'.b6z', 'wb');
  gzwrite($zd2, $b64);
  gzclose($zd2); 

  return $ret;
}

//if ($argv[1]) {
// echo 'reading chunk ' . $argv[1] . "\r\n";
// var_dump(readchunk($argv[1])) . "\r\n";
//}


?>
