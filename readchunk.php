<?php
ini_set('display_errors', true);

/* return the value of the most significant bit */
function get_ms1bit(/*int*/ $i)
{
    $x = 0;
    for ($j = $i; $i && !($j == 1); $j >>= 1) { $x++; }
    return $i ? $j <<= $x: 0;
}

function readint($str, $name) {
  $pos = strpos($str, $name);

  if ($pos === false) return -9999;

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
  $xpos = readint($contents, 'xPos');
  if ($xpos!=-9999) {
    $ret['xpos'] = $xpos;
    $ret['zpos'] = readint($contents,'zPos');

    return $ret;
  } else {
    return null;
  }
}

function jsonchunkout($path) {
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


//if ($argv[1]) {
// echo 'reading chunk ' . $argv[1] . "\r\n";
// var_dump(readchunk($argv[1])) . "\r\n";
//}


?>
