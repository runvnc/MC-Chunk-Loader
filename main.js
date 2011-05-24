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
    ymin = $('#ymin').val()*1;

    theworld.pos.x = $('#x').val()*1;
    theworld.pos.z = $('#z').val()*1;
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

