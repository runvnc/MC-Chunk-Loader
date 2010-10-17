//requires log
//requires nbt
//requires jquery
//requires util
//requires blockinfo

var theworld;
var ChunkSizeY = 128;
var ChunkSizeZ = 16;
var ChunkSizeX = 16;

var minx = -4;
var minz = -4;
var maxx = 4;
var maxz = 4;
var ymin = 5;

function b36(n) {
  var r = "";
  
  if (n==0)
    r = '0';
  else if (n<1) 
    r = '-'+baseConverter(Math.abs(n), 10, 36);
  else
    r = baseConverter(n, 10, 36);
  r = r.toLowerCase();
  return r;
}

function posfolder(pos) {
  r = b36(pos.mod(64));
  return r;
}

function chunkfilename(x,z) {
  return 'c.' + b36(x) + '.' + b36(z) + '.dat';
}

function chunkfile(x,z) {
  return posfolder(x)+'/'+posfolder(z)+'/'+chunkfilename(x,z);
}

function transNeighbors(blocks, x, y, z) {
  for (i = x-1; i<x+2 & i<ChunkSizeX; i++)
    for (j=y-1; j<y+2; j++)
      for (k=z-1; k<z+2 & k<ChunkSizeZ; k++) {
        if (!(i==x && j==y && k==z)) {
          var index =  j + ( k * ChunkSizeY + ( i * ChunkSizeY * ChunkSizeZ) );
          var blockID = blocks[index];
          if (blockID===0) return true;
        }
     }
  return false;
}

function extractChunk(blocks, chunk) {
  chunk.vertices = [];
  chunk.colors = [];

  for (x=0; x<ChunkSizeX; x++) {
    for (z=0; z<ChunkSizeZ; z++) {
      for (y=ymin; y<ChunkSizeY; y++) {
        var blockID = blocks[ y + ( z * ChunkSizeY + ( x * ChunkSizeY * ChunkSizeZ) ) ];  
        var blockType = blockInfo['_-1'];
        blockID = '_'+blockID.toString();

        if (blockInfo[blockID]) {
          blockType = blockInfo[blockID];
        } else {
          
          blockType = blockInfo['_-1'];
          log('unknown block type ' + blockID);
        }
        var show = false;
        
        //if ((y>64) & blockType.id ===1) 
        //  show = true;
        if (blockType.id !=0)
          show = transNeighbors(blocks, x,y,z);
       
          var xmod = (minx + (maxx-minx)/2.0) * ChunkSizeX;
          var zmod = (minz + (maxz-minz)/2.0) * ChunkSizeZ;
 
        if (show) {
          theworld.vertices.push(((-1*xmod)+ x + (chunk.pos.x) * ChunkSizeX * 1.00000 )/30.00);
          theworld.vertices.push(((y+1) * 1.0) / 30.0);
          theworld.vertices.push(((-1*zmod) + z + (chunk.pos.z) * ChunkSizeZ * 1.00000 ) /30.00);
         
          theworld.colors.push(blockType.rgba[0] );
          theworld.colors.push(blockType.rgba[1] );
          theworld.colors.push(blockType.rgba[2] );
          theworld.colors.push(blockType.rgba[3]); 
        }       
 
      } // y
    }  // z
  }  // x 
  //log(JSON.stringify(chunk.vertices)); 
  countChunks++;
}


function parsechunk(data,pos) {
  var blocks = tagfixed(data, 'Blocks', 32768); 
  var c = Object();
  c.pos = pos;
  extractChunk(blocks, c);
  theworld.chunks.push(c);
  return c;
}

function chunkload(url,pos, callback) {
  log('loading chunk pos=' + JSON.stringify(pos));
  log(chunkfile(pos.x,pos.z));
  var loc = url + '/' + chunkfile(pos.x,pos.z);
  $.ajax({
    url: loc,
    dataType: 'html',
    type: 'GET', 
    success: function(data) {
      callback(theworld,parsechunk(data,pos));
    },
    error : function() {
      callback(theworld, null);
    }
   });
}


function nextChunk(pos) {
  var next = new Object();
  next.cont = false;
  if (pos.x < maxx) {
    next.x = pos.x + 1;
    next.z = pos.z;
    next.cont = true;
  } else {

    if (pos.z < maxz) {
      next.z = pos.z + 1;
      next.x = minx;
      next.cont = true;
    }
  }
  return next;
}

var countChunks = 0;

function loadArea() {
  var w = this;
  
  chunkload(theworld.url, theworld.pos, function(chunk) {
    var c = theworld.chunks[0];
    if (countChunks % 2 == 0)
      status('loaded chunk at ' + theworld.pos.x + ', ' +theworld.pos.z);
    theworld.pos = nextChunk(theworld.pos);
    if (theworld.pos.cont) {
      theworld.loadArea();      
    } else {
        status('loaded ' + countChunks + ' chunks &nbsp; &nbsp; &nbsp; LIKE A BOSS');
        start(theworld.vertices, theworld.colors);     
     }
  });
}


function World(url) {
  this.url = url;
  this.chunks = [];
}

World.prototype.init = function(cb) {
    theworld = this;
    this.vertices = [];
    this.colors = [];
    this.pos = {x:minx,y:64,z:minz};

    convertColors(); // in blockinfo.js

    w = this;
    $.get(this.url+'/level.dat', function(data) {

      var inf = '';      
      inf += 'SpawnX: ' + tagtest(data, 'SpawnX');
      inf += 'SpawnY: ' + tagtest(data, 'SpawnY');
      inf += 'SpawnZ: ' + tagtest(data, 'SpawnZ');
      $('#head').html(inf);
   
      log(w.url);
      w.chunks = [];
    });  
};

World.prototype.chunksToPoints = function() {

};

World.prototype.loadArea = loadArea;

