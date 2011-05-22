var viewer;
var loader;
var options = { renderType: 'points' };
var ymin;
var minx;
var maxx;
var minz;
var maxz;
function main() {
  viewer = new Viewer(window.location);
  
  $(document).keydown(function(event) {
    if (event.keyCode == '87') {
      posMatrix = posMatrix.x(Matrix.Translation($V([0.0, 0.0, 0.1])).ensure4x4());
    }
  });
  
  $('#load').click(function() {
    minx = $('#xmin').val()*1;
    minz = $('#zmin').val()*1;
    maxx = $('#xmax').val()*1;
    maxz = $('#zmax').val()*1;
    ymin = $('#ymin').val()*1;

    theworld.pos.x = new Number(minx);
    theworld.pos.z = new Number(minz);
    //viewer.world.loadArea();
    start();
    viewer.world.createWorkers();
    
    loader = setTimeout('viewer.world.loadAll()', 1000);
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

