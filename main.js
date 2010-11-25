var viewer;
var options = { renderType: 'cubes' };
var windows3d = [];

var piOver180 = Math.PI / 180;
function moveForward() {
  var ps = posMatrix.elements;
  var dist = 1.0;
  var ps = posMatrix.elements;
  ps[0][3] -= dist * Math.sin(yaw * piOver180);
  ps[2][3] -= dist * Math.cos(yaw * piOver180);
}

function moveUp() {
  var ps = posMatrix.elements;
  ps[1][3] += 1.0;
}

function moveDown() {
  var ps = posMatrix.elements;
  ps[1][3] -= 1.0;
}

function main() {
  viewer = new Viewer(window.location);
  
  $(document).keydown(function(event) {
    switch (event.keyCode) {
      case 87:
        moveForward();
        break;
      case 69:
        moveUp();
        break;
      case 81:
        moveDown();
        break;
      case 191:
        $('#trace').toggle();
        $('#promptx').toggle();
        if( $('#promptx').is(':visible') ) {
          $('#cmd').focus();
        } else {
        }
        return false;
      default:
        break;
    }
    //if (event.keyCode == '87') {
    //  moveForward();
      //posMatrix = posMatrix.x(Matrix.Translation($V([0.0, 0.0, 0.1])).ensure4x4());
    //}
  });
  
  $('#load').click(function() {
    minx = new Number($('#xmin').val());
    minz = new Number($('#zmin').val());
    maxx = new Number($('#xmax').val());
    maxz = new Number($('#zmax').val());
    ymin = new Number($('#ymin').val());

    theworld.pos.x = new Number(minx);
    theworld.pos.z = new Number(minz);
    viewer.world.loadArea();
  });

  viewer.init();
}

window.onload = function() {
  document.getElementById('glcanvas').onselectstart = function() {
    return false;
  }; // ie
  document.getElementById('glcanvas').onmousedown = function() {return false;}; // mozilla
};

main();

var fragpixels;

function fdebug() {
 if(!fragpixels){
   fragpixels = new Uint8Array((theworld.blocksw/4) * (theworld.blocksw/4) * 4);
   gl.readPixels(0, 0, theworld.blocksw/4, theworld.blocksw/4, gl.RGBA, gl.UNSIGNED_BYTE, fragpixels);
 }
 var fragdata = "";
 var start =false;
 n = 0;
 do {
   if (fragpixels[n]==99) start = true;
   n++;
 } while (!(start || n>fragpixels.length));
 
 for (var n=0; n<16; n++) {
   if (n>0) fragdata += ', ';
   fragdata += fragpixels[n];
 }
 msg('fragdata = ' + fragdata);
}

function runCommand(cmd) {
  msg('> ' + cmd);
  var t = cmd.split(' ');
  switch (t[0]) {
    case 'win':
      $.newWindow({id:'win1',posx:winx,posy:winy,width:50,height:20, title:'test',content:'hi'});
      windows3d.push($('#win1')[0]);
      msg('created window');
      break;
    case 'fdbg':
      fdebug();
      break;
    default:
      break;
  }
  eraseCmd();
}

function eraseCmd() {
  $('#cmd').val('');
}

$(document).ready(function() {
  var w = $(window).width();
  w -= 35;
  var h = $(window).height();
  h -=85;
  $('#canvashere').html('<canvas id="glcanvas" width="' + w.toString() + 
                        '" height="' + h.toString() + '" ></canvas>');

  $('#cmd').keypress(function(event) {
    if (event.which===13) {
      runCommand($('#cmd').val());
    }
  });
  windows3d.push($('#conwin')[0]);
});


//window.setTimeout('init()', 20);

