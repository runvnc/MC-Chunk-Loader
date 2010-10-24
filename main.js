var viewer;
var options = { renderType: 'points' };

function main() {
  viewer = new Viewer(window.location);
  
  $(document).keydown(function(event) {
    if (event.keyCode == '87') {
      posMatrix = posMatrix.x(Matrix.Translation($V([0.0, 0.0, 0.1])).ensure4x4());
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

//window.setTimeout('init()', 20);

