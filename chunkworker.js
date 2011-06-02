//requires log
//requires nbt
//requires jquery
//requires util
//requires blockinfo

importScripts('log.js','blockinfo.js','deflate.js','util.js','nbt.js');

var theworld = {vertices:[], colors:[]};

var ChunkSizeY = 128;
var ChunkSizeZ = 16;
var ChunkSizeX = 16;

var minx = -4;
var minz = -4;
var maxx = 4;
var maxz = 4;
var ymin = 5;
var filled = [];
options = {renderType: 'points'};

var url = '';

var countChunks = 0;

function bind(scope, fn) {
    return function () {
        fn.apply(scope, arguments);
    };

}

var i =0;

onmessage = function(event) {
  i++;
  var obj = event.data;
  if (obj.type == "init") {
    convertColors();
    url = obj.url;
    postMessage({type:'ready'});
  } else if (obj.type == "loadpos") {
    
    loadArea(obj.data);
  }
}

onerror = function(event) {
  postMessage({type:'workererror', data: event.data});
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
  chunk.vertices.push(a[0]);
  chunk.vertices.push(a[1]);
  chunk.vertices.push(a[2]);

  chunk.colors.push(c1[0]);
  chunk.colors.push(c1[1]);
  chunk.colors.push(c1[2]);
  chunk.colors.push(c1[3]);
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
  var dat;
  if (data) {
    try {
      dat = JSON.parse(data);
    } catch (e) {
      postMessage({type:'msg', data:e});
    }
    
    //postMessage({type:'msg',data:'dat.len = ' + dat.length});
    if(!dat || dat.length == 0) {
      return c;
    }

    var combined = {vertices:[], colors:[]};

    for (var i=0; i<dat.length; i++) {
      var c = Object();
      c.pos = pos.positions[i];    
      var single = dat[i];
      var nbt = new NBTReader(single);
      var ch = nbt.read();
      if (ch) {
        var blocks = ch.root.Level.Blocks;
        extractChunk(blocks, c);
        combined.vertices = combined.vertices.concat(c.vertices);
        combined.colors = combined.colors.concat(c.colors);
      }
    }
     
    return combined; 
  }
}

var recvd = 0;
var numloaded = 0;
var numfailed = 0;
var reqs = [];

function chunkLoad(url, pos, callback) {
  try {
    recvd++;
    var xmlhttp = new XMLHttpRequest();
    reqs.push(xmlhttp);
    var list = encodeURIComponent(JSON.stringify(pos.positions));
    
    whenloaded = function(data, pos) {
      numloaded++; 
      callback(parseChunk(data, pos));
      if (numloaded==1) {
        postMessage({type:'msg',data:'Receiving data..'});
      }
    }  

    //var chunks = localStorage.getItem(list);
    //if (chunks==null) {
      xmlhttp.open("GET", url+'getchunk.php?chunklist='+list, true);
    //} else {
    //  whenloaded(chunks, pos);
   //}

    xmlhttp.onreadystatechange = function(ev)  {
      if (xmlhttp.readyState == 4) {
        if (xmlhttp.status==200) {
          whenloaded(xmlhttp.responseText, pos);
          //localStorage.setItem(list, xmlhttp.responseText);
        } else {
          numfailed++;
        }
      } else {
      }
    }
    xmlhttp.onerror = function(e) {
      numfailed++;
      callback(theworld, null);
      postMessage({type:'workererror', data:e });
    }
    xmlhttp.send();
  } catch (e) {
    numfailed++;
    postMessage({type:'workererror', data:e});
  }
/*
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
  }); */
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

function loadArea(pos) {
  var w = this;
  maxx = pos.maxx; minx = pos.minx;
  minz = pos.minz; maxz = pos.maxz;
  ymin = pos.ymin;
  chunkLoad(url, pos, function(chunk) {
    postMessage({type:'model', data: { vertices: chunk.vertices,
                                        colors: chunk.colors}});
  });
}
