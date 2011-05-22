//requires util
//requires log
//requires jquery
//requires world


var winx = 50;
var winy = 55;

function Viewer(url) {
  this.url = url;
  this.world = null;
  
  this.showData = function(name, data, typ) {
    if (!typ) typ = 'normal';

    $.newWindow({id:name,posx:winx,posy:winy,width:730,height:500, title:name,content:data, type: typ});
    $.minimizeWindow(name);
    winx+=15;
    winy+=20;
  };

  var n=0;

  this.chunkLoaded = function(chunk) {    
      //viewer.showLevel('Chunk'+n.toString(), chunk);
      n++;
  };

  this.loaded = function(world) {
    $('body').bind('chunkLoaded', viewer.chunkLoaded);

    viewer.world = world;
    viewer.showData('World', prettyPrint(world.level));
    //viewer.world.loadArea();
  };


  this.init = function() {

    prettyPrint.config.styles['default'].td.color = '#fff';
    prettyPrint.config.styles['default'].td.backgroundColor = 'rgba(15%,15%,20%,0.7)';
    prettyPrint.config.styles['default'].td.border = '1px solid #fff';
    prettyPrint.config.styles['default'].th.border = '1px solid #fff';
    prettyPrint.config.maxDepth = 10;


    //viewer.showData('music', '<iframe style="overflow: hidden;" src="http://www.soundserum.com/" width="1200" height="1500"></iframe>', 'iframe');
    //
    this.world = new World(this.url, this.url + 'buildindex.php');
    this.world.init(this.loaded);
  };

}

