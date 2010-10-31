var viewer;
var options = { renderType: 'cubes' };


var piOver180 = Math.PI / 180;
function moveForward() {
  var ps = posMatrix.elements;
  var dist = 1.0;
  var ps = posMatrix.elements;
  ps[0][3] -= dist * Math.sin(yaw * piOver180);
  ps[2][3] -= dist * Math.cos(yaw * piOver180);
}

function main() {
  viewer = new Viewer(window.location);
  
  $(document).keydown(function(event) {
    if (event.keyCode == '87') {
      moveForward();
      //posMatrix = posMatrix.x(Matrix.Translation($V([0.0, 0.0, 0.1])).ensure4x4());
    }
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

$(document).ready(function() {
  $('#canvashere').html('<canvas id="glcanvas" width="' + $(window).width() + 
                        '" height="' + Math.round($(window).height() *0.9) + '" ></canvas>');
});


//window.setTimeout('init()', 20);

