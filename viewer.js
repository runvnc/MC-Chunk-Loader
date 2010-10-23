//requires util
//requires log
//requires jquery
//requires world

function Viewer(url) {
  this.url = url;
  this.world = null;
  
  this.showLevel = function() {
    prettyPrint.config.styles['default'].td.color = '#fff';
    prettyPrint.config.styles['default'].td.backgroundColor = 'rgba(15%,15%,20%,0.7)';
    prettyPrint.config.styles['default'].td.border = '1px solid #fff';
    prettyPrint.config.styles['default'].th.border = '1px solid #fff';
    prettyPrint.config.maxDepth = 10;

    $.newWindow({id:"worlddata",posx:200,posy:100,width:500,height:300, title:"World Data",content:prettyPrint(this.world.level)});
  };

  this.loaded = function(world) {
    viewer.world = world;
    viewer.showLevel();
    viewer.world.loadArea();
  };


  this.init = function() {
    this.world = new World(this.url + 'world', this.url + 'buildindex.php');
    this.world.init(this.loaded);
  };

}

