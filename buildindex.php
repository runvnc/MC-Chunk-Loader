<?php
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

  $entry['filename'] = trimpath($path);

  $entry['dat'] = readchunk($path);
   
   
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

  $result = process_dir(getcwd() . '/world', TRUE);
  header('Cache-Control: no-cache, must-revalidate');
  header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  header('Content-type: application/json');  
  echo json_encode($result); 

?>
