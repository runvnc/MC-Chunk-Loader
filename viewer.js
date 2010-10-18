//requires util
//requires log
//requires jquery
//requires world

function Viewer(url) {
  this.url = url;
  this.world = null;
  
}

Viewer.prototype.loaded = function() {
  this.world.loadArea();
}


Viewer.prototype.init = function() {
  this.world = new World(this.url + '/world', this.url + '/buildindex.php');
  this.world.init(this.loaded);
};
