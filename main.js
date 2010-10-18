var viewer;

function main() {
  viewer = new Viewer(window.location + 'world');
  
  $(document).keydown(function(event) {
    console.log(event.keyCode);
    if (event.keyCode == '87') {
      console.log('attempting move');
      posMatrix = posMatrix.x(Matrix.Translation($V([0.0, 0.0, 0.1])).ensure4x4());
    }
  });
  
  $('#load').click(function() {
    minx = new Number($('#xmin').val());
    minz = new Number($('#zmin').val());
    maxx = new Number($('#xmax').val());
    maxz = new Number($('#zmax').val());
    ymin = new Number($('#ymin').val());
    
    viewer.loaded();
    
  });
}

window.onload = function() {
  document.onselectstart = function() {
    return false;
  } // ie
  //document.onmousedown = function() {return false;} // mozilla
};

main();

window.setTimeout('viewer.init()', 20);


