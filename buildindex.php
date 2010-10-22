<?php
ini_set('memory_limit', '128M');
  require_once('readchunk.php');

  function trimpath($p) {
    $pos = strpos($p, 'world/');
    return substr($p, $pos+6);
  }

  function process_dir($dir,$recursive = FALSE) {
    if (is_dir($dir)) {
      for ($list = array(),$handle = opendir($dir); (FALSE !== ($file = readdir($handle)));) {
        if (($file != '.' && $file != '..') && (file_exists($path = $dir.'/'.$file))) {
          if (is_dir($path) && ($recursive)) {
            $list = array_merge($list, process_dir($path, TRUE));
          } else {
            $entry = array('filename' => $file);
            
 //---------------------------------------------------------//
 //                     - SECTION 1 -                       //
 //          Actions to be performed on ALL ITEMS           //
 //-----------------    Begin Editable    ------------------//

  //$entry['modtime'] = filemtime($path);

 //-----------------     End Editable     ------------------//
            do if (!is_dir($path)) {
 //---------------------------------------------------------//
 //                     - SECTION 2 -                       //
 //         Actions to be performed on FILES ONLY           //
 //-----------------    Begin Editable    ------------------//

  //$entry['size'] = filesize($path);
  
  $pos = strpos($path, '.b6z');
  $pos2 = strpos($path, '.gz');
  if ($pos >0 | $pos2>0) {
    unlink($path);
    continue;
  } 
  
  $entry['dat'] = readchunk($path);
     
  $entry['filename'] = trimpath($path);
   
 //-----------------     End Editable     ------------------//
              break;
            } else {
 //---------------------------------------------------------//
 //                     - SECTION 3 -                       //
 //       Actions to be performed on DIRECTORIES ONLY       //
 //-----------------    Begin Editable    ------------------//

 //-----------------     End Editable     ------------------//
              break;
            } while (FALSE);
            $list[] = $entry;
          }
        }
      }
      closedir($handle);
      return $list;
    } else return FALSE;
  }
 
  $wf = $_SERVER['SCRIPT_FILENAME'];
  $pos = strrpos($wf, '/');
  $wd = substr($wf, 0, $pos);  

  if (file_exists($wd.'/chunks.json')) {
    $result = file_get_contents($wd.'/chunks.json');
  } else {
    $result = json_encode(process_dir($wd . '/world', TRUE));
    
    file_put_contents($wd.'/chunks.json', $result);
  }
  header('Cache-Control: no-cache, must-revalidate');
  header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  header('Content-type: application/json');  
  echo $result; 

?>
