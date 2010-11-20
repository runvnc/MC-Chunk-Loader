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
var ymin =60;
var options = {renderType: 'cubes'};
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
/*
  for (var i=0; i< myworld.chunkIndex.length; i++) {
    var ch = myworld.chunkIndex[i];
    var dat = ch.dat;
    if (!dat) {
      continue;
    } else if (dat['xpos']==x && dat['zpos']==z) return ch.filename;
  }
  return 'unindexed';
*/
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

function extractChunk(blocks, skylight, blocklight, chunk) {
  chunk.vertices = [];
  chunk.colors = [];
  chunk.blocks = blocks;
  chunk.filled = [];
  chunk.skylight = unpack4bit(skylight);
  chunk.blocklight = unpack4bit(blocklight);
  return;

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
        
    
        //if (blockType.id > 1) show = transNeighbors(blocks, x, y, z);
         if ((blockType.id >1 && blockType.id != 13) ||
	      (blockType.id===1 && transNeighbors(blocks,x,y,z))) show=true;
 
        if (show) {

          addBlock([x,y,z], chunk);
        }
        
      } // y
    } // z
  } // x 
  //countChunks++;
  //renderChunk(chunk);
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

  var xmod = (Math.abs(minx)+1) * ChunkSizeX;
  var zmod = (Math.abs(maxz)+1) * ChunkSizeZ;
  var xmod = 0;
  var zmod = 0;

  verts.push( pos[0] + xmod  + chunk.pos.x * ChunkSizeX * 1.00000);
  verts.push(pos[1] * 1.0);
  verts.push(pos[2] -zmod + chunk.pos.z * ChunkSizeZ * 1.00000);
  return verts;
}

function renderChunk(chunk) {
  if (options.renderType == 'lines') {
    renderLines(chunk);
  } else if (options.renderType == 'cubes') {
    renderCubes(chunk);
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


function renderCubes(chunk) {
  for (var i=0; i<chunk.filled.length; i++) {
    var verts = chunk.filled[i];
    renderVoxelCube(chunk, verts[0], verts[1], verts[2]);
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


function unpack4bit(arr) {
  var ret = [];
  for (var i=0; i< arr.length; i++) {
    var b = arr[i];
    ret.push(b & 0x0F);
    ret.push((b & 0xF0) >> 4);
  }
  return ret;
}

function getData(blocks, x, y, z) {
  var id = y + (z * ChunkSizeY + (x * ChunkSizeY * ChunkSizeZ)); 
  return blocks[id]; 
}

function getColor(pos, chunk) {
  var t = getBlockType(chunk.blocks, pos[0], pos[1], pos[2]);
  var s = getData(chunk.skylight, pos[0], pos[1], pos[2]);
  var b = getData(chunk.blocklight, pos[0], pos[1], pos[2]) ;
  var ret = [t.rgba[0], t.rgba[1], t.rgba[2], t.rgba[3]];

  //1.0 - pow(0.8, 15 - max(blocklight, skylight - 11))
  if (s<=0.001) s = 8;
  s += 15;
  ret[0] *= (s+b*2.0)/32.0;
  ret[1] *= (s+b*2.0)/32.0;
  ret[2] *= (s+b*2.0)/32.0;
  return ret;
}

function renderVoxelLines(chunk, x, y, z) {
  for (i = x + 1; i < x + 2 & i < ChunkSizeX; i++) {
    for (j = y - 1; j < y + 2; j++) {
      for (k = z + 1; k < z + 2 & k < ChunkSizeZ; k++) {
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

/*
function isNotNatural(chunk, x, y, z) {
  var blockType = getBlockType(chunk.blocks, x, y, z);
  return (blockType.type != 'cobble' && 
          blockType.type != 'wood' && 
          blockType.type != 'torch');
}*/

function renderVoxelCube(chunk, x, y, z) {
  /*
  if (isNotNatural(chunk, [x,y,z]) {
    addCube([x,y,z], chunk);
  } else {
   //  addTriangles([x,y,z], chunk);
  }
  */
}


function addTriangles(chunk, x, y, z) {
  for (i = x + 1; i < x + 2 & i < ChunkSizeX; i++) {
    for (j = y - 1; j < y + 2; j++) {
      for (k = z + 1; k < z + 2 & k < ChunkSizeZ; k++) {
        if (!(i == x && j == y && k == z)) {
          var blockType = getBlockType(chunk.blocks, i,j,k);
          if (isNatural(blockType)) {
                        
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

var cadd = 0;

function addFace(p, calced, clr, i, j, k, chunk) {
  //if there is another cube blocking the
  //face then this face won't be visible 
  //anyway so don't include it
  //postMessage('in addface');

  var typ = getBlockType(chunk.blocks, p[0]+ i,p[1]+j,p[2]+k);
  if (typ.id > 0) return;
  var typ2 = getBlockType(chunk.blocks, p[0], p[1], p[2]);
  //postMessage('x2');
  //if 0,1,0 say this is top face
  var faces = [
    {pos:[0,-1,0], coords: [ [-0.5,-0.5,0.5],[0.5,-0.5,0.5], [0.5,-0.5,-0.5],[-0.5,-0.5,-0.5] ]}, //bottom
    {pos:[0,1,0], coords: [ [-0.5,0.5,0.5],[0.5,0.5,0.5], [0.5,0.5,-0.5],[-0.5,0.5,-0.5] ]},  //top
    {pos:[0,0,-1], coords: [ [-0.5,0.5,-0.5],[0.5,0.5,-0.5], [0.5,-0.5,-0.5],[-0.5,-0.5,-0.5] ]}, //front
    {pos:[-1,0,0], coords: [ [-0.5,0.5 ,-0.5],[-0.5,0.5,0.5],[-0.5,-0.5,0.5],[-0.5,-0.5,-0.5]]}, //left
    {pos:[1,0,0], coords: [ [0.5,0.5 ,-0.5],[0.5,0.5,0.5],[0.5,-0.5,0.5],[0.5,-0.5,-0.5]]}, //right
    {pos:[0,0,1], coords: [ [0.5,0.5,0.5],[-0.5,0.5,0.5], [-0.5,-0.5,0.5],[0.5,-0.5,0.5] ]} //back
  ];
  //postMessage('p2');
  for (var n=0; n<faces.length; n++) {
    var f = faces[n];
    //postMessage('hi');
    if (f.pos[0] == i && f.pos[1] == j && f.pos[2] == k) {
      var qs = [];
      for (var q=0; q<4; q++) {
        var crd = f.coords[q];
        qs.push([crd[0]+calced[0], crd[1]+calced[1], crd[2]+calced[2]]);
      }
      addQuad(qs, clr, typ2);
      return;
    }
  }
} 

function addCoords(v) {
  myworld.vertices.push(v[0]);
  myworld.vertices.push(v[1]);
  myworld.vertices.push(v[2]);
}

function addQuad(points, color, typ) {
  //postMessage('adding quad' ); 
  
  addCoords(points[0]);
  addCoords(points[1]);
  addCoords(points[2]);
 
  for (var c=0; c<4; c++) {
     myworld.colors.push(color[c]);
  }
  for (var c=0; c<4; c++) {
    myworld.colors.push(color[c]);
  }
  for (var c=0; c<4; c++) {
    myworld.colors.push(color[c]);
  }
 
  if (typ.id==18) {
    
  } else {
    addCoords(points[2]);
    addCoords(points[3]);
    addCoords(points[0]);
 
    for (var c=0; c<4; c++) {
      myworld.colors.push(color[c]);
    }
    for (var c=0; c<4; c++) {
      myworld.colors.push(color[c]);
    }
    for (var c=0; c<4; c++) {
      myworld.colors.push(color[c]);
    }
  }
/*
 for (var c=0; c<4; c++) {
    myworld.colors.push(color[c]);
  }
  for (var c=0; c<4; c++) {
    myworld.colors.push(color[c]);
  }
  for (var c=0; c<4; c++) {
    myworld.colors.push(color[c]);
  }
*/

  //postMessage(myworld.colors);
  //close();

}

function addCube(p, chunk) {
  var a = calcPoint(p, chunk);
  var c1 = getColor(p, chunk);

  for (var i=-1; i<2; i++) {
    for (var j=-1; j<2; j++) {  
      for (var k=-1; k<2; k++) {
        if (Math.abs(i+j+k)===1) {
          addFace(p, a, c1, i, j, k, chunk);
        }
      } 
    }
  }
}


function parsechunk(data, pos) {
  if (data) {
    var dat = JSON.parse(data);
    var nbt = new NBTReader(dat);
    var ch = nbt.read();
    var blocks = ch.root.Level.Blocks;
    var skylight = ch.root.Level.SkyLight;
    var blocklight = ch.root.Level.BlockLight;

    var c = Object();
    c.pos = pos;
    extractChunk(blocks, skylight, blocklight, c);
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
    c.pos = pos;
    var tmp = {wid: myid, vertices: myworld.vertices, colors:myworld.colors, chunk:c};
    postMessage(tmp);
    delete httpRequest;
    close();
  } else{
    postMessage({fail:'fail'});
    delete httpRequest;
    close();
  }
  //httpRequest = null;
}

function chunkload(url, pos) {
  try {
	  var fl = chunkfile(pos.x, pos.z);
	  if (fl != 'unindexed') {
		  var loc = url + 'getchunk.php?file=/' + 
		      encodeURIComponent(fl);
		  httpRequest = new XMLHttpRequest();  
		  httpRequest.open("GET", loc, true);  
		  httpRequest.onload = infoReceived;  
		  httpRequest.onerror = httpErr;
		  httpRequest.onabort = httpErr;
		  httpRequest.send(null);  

	  } else {
	    postMessage({fail: 'fail', position: pos});
	    delete httpRequest;
	    close();
	  }
  } catch (e) {
      delete httpRequest;
      postMessage(e);
      close();
  }
}

httpErr = function(e) {
  postMessage('failhttp');
  close();
}

errorReceiver = function(event) {
  postMessage('fail');
  delete httpRequest;
  close();
  //log(event.data);
};

var myid;

onmessage = function(event) {
  var dat = JSON.parse(event.data);
  convertColors();
  minx = dat.x0; 
  maxx = dat.x1;
  minz = dat.z0;
  maxz = dat.z1;
  pos = { x : dat.a, z :dat.b};
  myid = dat.wid;
  myworld.chunkIndex = dat.chunkIndex;
  chunkload(dat.url.href, pos);
};


