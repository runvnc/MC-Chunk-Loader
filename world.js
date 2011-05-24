//requires log
//requires nbt
//requires jquery
//requires util
//requires blockinfo

var theworld;

var ChunkSizeY = 128;
var ChunkSizeZ = 16;
var ChunkSizeX = 16;
var cores = 4;
var chunksAcross = 4;

var minx = -4;
var minz = -4;
var maxx = 4;
var maxz = 4;
var ymin = 5;
var filled = [];
var workers;

var countChunks = 0;
var toload = 0;

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
        if(!blockID) blockID = 0;
        var blockType = blockInfo['_-1'];
        blockID = '_' + blockID.toString();
         
        if (blockInfo[blockID]) {
          blockType = blockInfo[blockID];
        } else {
          blockType = blockInfo['_-1'];
          log('unknown block type ' + blockID);
        }
        var show = false;
        
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

function parseChunk(data, pos) {
  if (data) {
    var dat = JSON.parse(data);
    var c = Object();
    c.pos = pos;
    if(!dat || dat.length == 0) {
      return c;
    }
    var nbt = new NBTReader(dat);
    var ch = nbt.read();
    var blocks = ch.root.Level.Blocks;
    extractChunk(blocks, c);
    theworld.chunks.push(c);
    $('body').trigger({
      type: 'chunkLoaded',
      chunk: c
    });
    return c; 
  }
}

function chunkLoad(url, pos, callback) {
  $.ajax({
    url: url + 'getchunk.php?posx=' + pos.x + '&posz=' + pos.z,
    dataType: 'html',
    type: 'GET',
    success: function(data) {
      callback(theworld, parseChunk(data, pos));
    },
    error: function() {
      callback(theworld, null);
    }
  });
}

var loadRadius = 1;
var maxLoadRadius = 40;

function nextChunk(pos) {
  var maxx = loadRadius + theworld.pos.x;  
  var minx = theworld.pos.x - loadRadius;
  var maxz = loadRadius + theworld.pos.z;
  var minz = theworld.pos.z - loadRadius;

  var next = new Object();
  next.cont = false;
  if (pos.x < maxx) {
    next.x = pos.x + chunksAcross;
    next.z = pos.z;
    next.cont = true;
  } else {
    if (pos.z < maxz) {
      next.z = pos.z + chunksAcross;
      next.x = minx;
      next.cont = true;
    } else {
      loadRadius++;
      msg('Load radius: ' + loadRadius + ' of ' + maxLoadRadius);
      if (loadRadius<maxLoadRadius) {
        next.x = minx-chunksAcross;
        next.z = minz-chunksAcross;
        next.cont = true;
        return next;
      } else {
        msg('Done.');
      }
    }
  }
  return next;
}

var numloaded = 0;
  function createWorkers() {
    console.log('creating workers');
    var region = this;
    workers = [];
    for (var i = 0; i<cores; i++) {
      var worker = new Worker('chunkworker.js');
      workers.push(worker);
      worker.onmessage = function(event) {
        var obj = event.data;
        if (obj.type == "ready") {
          //console.log('worker ready');
          worker.waiting = true;  
        } else if (obj.type=="model") {
          numloaded++;
          addModelData(obj.data);
        } else if (obj.type=='workererror') {
          console.log('worker error:');
          console.log(obj.data);
        } else if (obj.type=='msg') {
          console.log(obj.data);
        }
      }
      
      worker.postMessage({type:'init', url:this.url.href});
    }
    console.log('done creating workers');
    return true;
  }

var workerNum = 0;

function nextWorker() {
  var ret = workerNum;
  workerNum++;  
  if (workerNum>=workers.length) {
    workerNum = 0;
  }
  return workers[workerNum];
}

var l = 0;
var pos;
var loading = false;
var alreadyLoaded = {};

function bigChunk(x,z) {
  var x1 = Math.floor(x / chunksAcross) * chunksAcross;
  var z1 = Math.floor(z / chunksAcross) * chunksAcross;
  var key = x1.toString() + ','+ z1.toString();
  if (!alreadyLoaded[key]) {
    var positions = [];
    for (var a=x1; a<x1+chunksAcross; a++) {
      for (var b=z1; b<z1+chunksAcross; b++) {
        positions.push({x:a, z:b});
      }
    }
    return positions;
    alreadyLoaded[key] = true;
  } else {
    return [];
  } 
}

var wasLoaded = {};

function loadAll() {
  var tot = (maxx - minx) * (maxz-minz);
  if (loading) return;
  loading = true;
  theworld.pos.cont = true;
  var positions = [];
  if (!pos) { 
    pos = theworld.pos;
    maxx = loadRadius + theworld.pos.x;
    minx = theworld.pos.x - loadRadius;
    maxz = loadRadius + theworld.pos.z;
    minz = theworld.pos.z - loadRadius;
  }
  var worker = nextWorker();
  var tot = pos.x + pos.z;
  var inc = 0;
  var key = 'i';
  wasLoaded[key] = true;
  while (pos.cont && positions.length==0 && inc==0 &&
         wasLoaded[key]) {
    if (l==0) {
      pos = nextChunk(theworld.pos);
    } else {
      pos = nextChunk(pos);
    }
    positions = bigChunk(pos.x, pos.z);
    key = JSON.stringify(positions);
    if (positions.length>0) {
      inc++;
    }
  }

  if (positions.length == 0) {
    msg('Loading..');
    loading = false;
    return;
  }

  if (wasLoaded[key]) {
    loading = false;
    setTimeout('viewer.world.loadAll()',1);
    return;
  } else { 
    var dat = {positions:positions,minx:minx,maxx:maxx,minz:minz,maxz:maxz,ymin:ymin};
    wasLoaded[key] = true;
    worker.postMessage({type:'loadpos', data:dat});
    setTimeout('viewer.world.loadAll()', 1);
    l++;
    loading = false;
  }
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
  status("Loading...");
    
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
    $('#x').val(posx);
    $('#z').val(posz);
    w.pos = {x:posx, z:posz};
    msg('posx = ' + posx.toString());
    msg('posz = ' + posz.toString()); 
     
    w.chunks = [];
    cb(theworld);
  });
};

World.prototype.chunksToPoints = function() {

};

World.prototype.loadAll = loadAll;

World.prototype.createWorkers = createWorkers;

