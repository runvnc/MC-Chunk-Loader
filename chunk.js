//requires log
//requires nbt
//requires jquery
//requires util
//requires blockinfo

importScripts('log.js','util.js','deflate.js','nbt.js','blockinfo.js');

var httpRequest;

var myworld = {vertices: [], colors: [], chunks: []};

var ChunkSizeY = 128;
var ChunkSizeZ = 16;
var ChunkSizeX = 16;
var ymin = 50;
var options = {renderType: 'ponts'};
var minx = 0;
var minz = 0;
var maxx = 0;
var maxz = 0;

var pos;

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
  return posfolder(x) + '/' + posfolder(z) + '/' + chunkfilename(x, z);
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
  //countChunks++;
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

var calced= 0;

function calcPoint(pos, chunk) {
  var verts = [];

  var xmod = (minx + (maxx - minx) / 2.0) * ChunkSizeX;
  var zmod = (minz + (maxz - minz) / 2.0) * ChunkSizeZ;

  if (calced++<2) postMessage('xmod = ' + xmod);

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
  myworld.vertices.push(a[0]);
  myworld.vertices.push(a[1]);
  myworld.vertices.push(a[2]);

  myworld.colors.push(c1[0]);
  myworld.colors.push(c1[1]);
  myworld.colors.push(c1[2]);
  myworld.colors.push(c1[3]);
}

function addLine(p1, p2, chunk) {
  var a = calcPoint(p1, chunk);
  var b = calcPoint(p2, chunk);
  var c1 = getColor(p1, chunk);
  var c2 = getColor(p2, chunk);
  myworld.vertices.push(a[0]);
  myworld.vertices.push(a[1]);
  myworld.vertices.push(a[2]);
  myworld.vertices.push(b[0]);
  myworld.vertices.push(b[1]);
  myworld.vertices.push(b[2]);
 
  myworld.colors.push(c1[0]);
  myworld.colors.push(c1[1]);
  myworld.colors.push(c1[2]);
  myworld.colors.push(c1[3]);
  myworld.colors.push(c2[0]);
  myworld.colors.push(c2[1]);
  myworld.colors.push(c2[2]);
  myworld.colors.push(c2[3]);

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
    c.vertices = myworld.vertices;
    c.colors = myworld.colors;
    myworld.chunks.push(c);
    //$('body').trigger({
    //  type: 'chunkLoaded',
    //  chunk: c
    //});
    return c; 
  }
}

function infoReceived() {
  var output = httpRequest.responseText;
  if (output) {
    //postMessage(output);
    var c = parsechunk(output, pos);
    postMessage(myworld);
    close();
  } else{
    postMessage({fail:'fail'});
    close();
  }
  httpRequest = null;
}

function chunkload(url, pos) {
  postMessage('loading chunk pos=' + JSON.stringify(pos));
  postMessage('url is ' + url);
  var fl = chunkfile(pos.x, pos.z);
  if (fl != 'unindexed') {
          var loc = url + 'getchunk.php?file=/' + 
              encodeURIComponent(fl);
          httpRequest = new XMLHttpRequest();  
          httpRequest.open("GET", loc, true);  
          httpRequest.onload = infoReceived;  
          httpRequest.send(null);  

  } else {
    postMessage({fail: 'fail', position: pos});
    close();
  }
}

errorReceiver = function(event) {
  //log(event.data);
};

onmessage = function(event) {
  var dat = JSON.parse(event.data);
  minx = dat.minx; 
  maxx = dat.maxx;
  minz = dat.minz;
  maxz = dat.maxz;
  pos = { x : dat.a, z :dat.b};
  //postMessage(event.data);
  
  chunkload(dat.url.href, pos);
};


