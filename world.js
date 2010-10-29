//requires log
//requires nbt
//requires jquery
//requires util
//requires blockinfo

var theworld = {vertices: [], colors: []};
var ChunkSizeY = 128;
var ChunkSizeZ = 16;
var ChunkSizeX = 16;

var minx = -4;
var minz = -4;
var maxx = 4;
var maxz = 4;
var ymin = 5;
var filled = [];

function b36(n) {
  var r = "";
  
  if (n === 0) 
    r = '0';
  else 
    if (n < 0) 
      r = '-' + baseConverter(Math.abs(n), 10, 36);
    else 
      r = baseConverter(n, 10, 36);
  r = r.toLowerCase();
  return r;
}

function posfolder(pos) {
  var n = new Number(pos);
  r = b36(n.mod(64));
  return r;
}

function chunkfilename(x, z) {
  return 'c.' + b36(x) + '.' + b36(z) + '.dat';
}

function chunkfile(x, z) {
  //return posfolder(x) + '/' + posfolder(z) + '/' + chunkfilename(x, z);

  for (var i=0; i< theworld.chunkIndex.length; i++) {
    var ch = theworld.chunkIndex[i];
    var dat = ch.dat;
    if (!dat) {
      continue;
    } else if (dat['xpos']==x && dat['zpos']==z) return ch.filename;
  }
  return 'unindexed';

}

function transNeighbors(blocks, x, y, z) {
  for (i = x - 1; i < x + 2 & i < ChunkSizeX; i++) {
    for (j = y - 1; j < y + 2; j++) {
      for (k = z - 1; k < z + 2 & k < ChunkSizeZ; k++) {
        if (!(i == x && j == y && k == z)) {
          var index = j + (k * ChunkSizeY + (i * ChunkSizeY * ChunkSizeZ));
          var blockID = blocks[index];
          if (blockID === 0)             
            return true;
        }
      }
    }
  }
  return false;
}

function extractChunk(blocks, chunk) {
  chunk.vertices = [];
  chunk.colors = [];
  chunk.blocks = blocks;
  chunk.filled = [];

  for (x = 0; x < ChunkSizeX; x++) {
    for (z = 0; z < ChunkSizeZ; z++) {
      for (y = ymin; y < ChunkSizeY; y++) {
        var blockID = blocks[y + (z * ChunkSizeY + (x * ChunkSizeY * ChunkSizeZ))];
        var blockType = blockInfo['_-1'];
        blockID = '_' + blockID.toString();
         
        if (blockInfo[blockID]) {
          blockType = blockInfo[blockID];
        }
        else {
        
          blockType = blockInfo['_-1'];
          log('unknown block type ' + blockID);
        }
        var show = false;
        
        //if ((y>64) & blockType.id ===1) 
        //  show = true;
        
    
        if (blockType.id !== 0) show = transNeighbors(blocks, x, y, z);
        
        if (show) {

          addBlock([x,y,z], chunk);
        }
        
      } // y
    } // z
  } // x 
  countChunks++;
  renderChunk(chunk);
}


function addBlock(position, chunk) {
  var verts = [
    position[0],
    position[1],
    position[2]
  ];
  
  chunk.filled.push(verts);
}

function calcPoint(pos, chunk) {
  var verts = [];

  var xmod = (minx + (maxx - minx) / 2.0) * ChunkSizeX;
  var zmod = (minz + (maxz - minz) / 2.0) * ChunkSizeZ;

  verts.push(((-1 * xmod) + pos[0] + (chunk.pos.x) * ChunkSizeX * 1.00000) / 30.00);
  verts.push(((pos[1] + 1) * 1.0) / 30.0);
  verts.push(((-1 * zmod) + pos[2] + (chunk.pos.z) * ChunkSizeZ * 1.00000) / 30.00);
  return verts;
}

function renderChunk(chunk) {
  if (options.renderType == 'lines') {
    renderLines(chunk);
  } else {
    renderPoints(chunk);
  }
}

function renderLines(chunk) {
  for (var i=0; i<chunk.filled.length; i++) {
    var verts = chunk.filled[i];
    renderVoxelLines(chunk, verts[0], verts[1], verts[2]);
  }
}


function renderPoints(chunk) {
  for (var i=0; i<chunk.filled.length; i++) {
    var verts = chunk.filled[i];
    renderVoxelPoints(chunk, verts[0], verts[1], verts[2]);
  }
}


function getBlockType(blocks, x, y, z) {
  var blockType = blockInfo['_-1'];
  var id = blocks[y + (z * ChunkSizeY + (x * ChunkSizeY * ChunkSizeZ))];
  var blockID = '_-1';
  if (id) blockID = '_' + id.toString();
  if (blockInfo[blockID]) {
    blockType = blockInfo[blockID];
  }
  return blockType;
}

function getColor(pos, chunk) {
  var t = getBlockType(chunk.blocks, pos[0], pos[1], pos[2]);
  return t.rgba;
}

function renderVoxelLines(chunk, x, y, z) {
  for (i = x - 1; i < x + 2 & i < ChunkSizeX; i++) {
    for (j = y - 1; j < y + 2; j++) {
      for (k = z - 1; k < z + 2 & k < ChunkSizeZ; k++) {
        if (!(i == x && j == y && k == z)) {
          var blockType = getBlockType(chunk.blocks, i,j,k);
          if (blockType.id>0) {
            addLine([x, y, z], [i, j, k], chunk); 
          }
        }
      }
    }
  }
  return true;    
}

function renderVoxelPoints(chunk, x, y, z) {
  addPoint([x,y,z], chunk);
}

function addPoint(p, chunk) {
  var a = calcPoint(p, chunk);
  var c1 = getColor(p, chunk);
  theworld.vertices.push(a[0]);
  theworld.vertices.push(a[1]);
  theworld.vertices.push(a[2]);

  theworld.colors.push(c1[0]);
  theworld.colors.push(c1[1]);
  theworld.colors.push(c1[2]);
  theworld.colors.push(c1[3]);
}

function addLine(p1, p2, chunk) {
  var a = calcPoint(p1, chunk);
  var b = calcPoint(p2, chunk);
  var c1 = getColor(p1, chunk);
  var c2 = getColor(p2, chunk);
  theworld.vertices.push(a[0]);
  theworld.vertices.push(a[1]);
  theworld.vertices.push(a[2]);
  theworld.vertices.push(b[0]);
  theworld.vertices.push(b[1]);
  theworld.vertices.push(b[2]);
 
  theworld.colors.push(c1[0]);
  theworld.colors.push(c1[1]);
  theworld.colors.push(c1[2]);
  theworld.colors.push(c1[3]);
  theworld.colors.push(c2[0]);
  theworld.colors.push(c2[1]);
  theworld.colors.push(c2[2]);
  theworld.colors.push(c2[3]);
}


function parsechunk(data, pos) {
  if (data) {
    var dat = JSON.parse(data);
    var nbt = new NBTReader(dat);
    var ch = nbt.read();
    var blocks = ch.root.Level.Blocks;
    var c = Object();
    c.pos = pos;
    extractChunk(blocks, c);
    theworld.chunks.push(c);
    $('body').trigger({
      type: 'chunkLoaded',
      chunk: c
    });
    return c; 
  }
/*
  var blocks = tagfixed(data, 'Blocks', 32768);
  var c = Object();
  c.pos = pos;
  extractChunk(blocks, c);
  theworld.chunks.push(c);* /

  return c; */
}

function ifLastChunk(x, z) {
  //if (x>=maxx && z>=maxz) {
    //  $('#trace').animate({
    //    height: 'toggle'
    //  });
  //  log('done');
    //  start(theworld.vertices, theworld.colors);
  //}
}

var countChunks = 0;
var chunki;
var chunkj;
var started = false;

function resultReceiver(event) {
  if (started) return;
  var data = event.data;

  //console.log(data);
  if (!data.vertices) {
    //console.log('not verts');
    countChunks++;
    return;
  } else {
    //console.log('has verts');
  }
  
  for (var i=0; i<data.vertices.length; i++) {
    theworld.vertices.push(data.vertices[i]);
  }

  for (var j=0; j<data.colors.length; j++) {
    theworld.colors.push(data.colors[j]);
  }

  countChunks++;
 
  //var chmax = (maxx-minx) * (maxz-minz ) - 10; 
  status('Loaded ' + countChunks + ' of ' + toLoad + ' chunks'); 
   
  if (countChunks>= toLoad-5) {
    msg('total vertices: ' + theworld.vertices.length /3);
    start(theworld.vertices, theworld.colors);
    started = true;
  }
}

function errorReceiver(event) {
  console.log(event.data);
}

var toLoad = 0;
var wedone = false;

function loadMore(uri,posi) {
  var added = 0;
  do { 
        var worker = new Worker("chunk.js");
        worker.onmessage = resultReceiver;
        worker.onerror = errorReceiver;
        var objstr = JSON.stringify({url: uri, x0: minx, x1:maxx, z0:minz, z1:maxz,
                          a: posi.x, b:posi.z});

        worker.postMessage(objstr);
        posi = nextChunk(posi);
 
  } while (next.cont && added<6);
  if (!next.cont) wedone = true;
}

function chunkLoadALot(uri, posi) {
  for (var i = minx; i<=maxx; i++) {  
    for (var j = minz; j<=maxz; j++) {
      if (chunkfile(i,j) != 'unindexed' && toLoad<16) {
        toLoad++;
        var worker = new Worker("chunk.js");  
        worker.onmessage = resultReceiver;  
        worker.onerror = errorReceiver;  
        var objstr = JSON.stringify({url: uri, x0: minx, x1:maxx, z0:minz, z1:maxz,
                          a: i, b:j});

        worker.postMessage(objstr);  
      } else {
        var n=0;
      }
    }
  }
}

function chunkload(url, pos, callback) {
  log('loading chunk pos=' + JSON.stringify(pos));
  var fl = chunkfile(pos.x, pos.z);
  if (fl != 'unindexed') {
          var loc = url + 'getchunk.php?file=/' + 
              encodeURIComponent(fl);
          $.ajax({
            url: loc,
            dataType: 'html',
            type: 'GET',
            success: function(data) {
              callback(theworld, parsechunk(data, pos));
            },
            error: function() {
              callback(theworld, null);
            }
          });
  } else {
    callback(theworld, null);
  }
}


function nextChunk(pos) {
  var next = new Object();
  next.cont = false;
  if (pos.x < maxx) {
    next.x = pos.x + 1;
    next.z = pos.z;
    next.cont = true;
  }
  else {
  
    if (pos.z < maxz) {
      next.z = pos.z + 1;
      next.x = minx;
      next.cont = true;
    }
  }
  return next;
}

//var countChunks = 0;

function loadArea() {
  var w = this;
  //loadMore(theworld.url, theworld.pos);
  chunkLoadALot(theworld.url, theworld.pos); 
}


function World(url, index) {
  this.url = url;
  this.chunks = [];
  this.indexLocation = index;
}

World.prototype.init = function(cb) {
  theworld = this;
  this.vertices = [];
  this.colors = [];
  this.pos = {
    x: minx,
    y: 64,
    z: minz
  };
  
  convertColors(); // in blockinfo.js
  w = this;
  status("Loading..");
    
  $.get('getlevel.php', function(data) {
     msg("Loaded level.dat");
     var arr = JSON.parse(data);
     var nbtreader = new NBTReader(arr);
     var tmp = nbtreader.read();
     w.level = tmp.root.Data;
     msg('_______________');
     msg('PlayerX = ' + w.level.Player.Pos[0]);
     msg('PlayerZ = ' + w.level.Player.Pos[2]);
     var posx = Math.round(w.level.Player.Pos[0] / ChunkSizeX);
     var posz = Math.round(w.level.Player.Pos[2] / ChunkSizeZ);
     msg('posx = ' + posx.toString());
     msg('posz = ' + posz.toString()); 
     minx = posx-8;
     maxx = posx+8;
     minz = posz-8;
     maxz = posz+8;
     $('#xmin').val(posx - 8);
     $('#xmax').val(posx + 8);
     $('#zmin').val(posz - 8);
     $('#zmax').val(posz + 8);
     w.chunks = [];

     status('Loading chunk index..');
     $.get(w.indexLocation, function(ind) {
        status('Index has ' + ind.length + ' chunks');
        w.chunkIndex = ind;
     
      });

     cb(theworld);
  });
};

World.prototype.chunksToPoints = function() {

};

World.prototype.loadArea = loadArea;

