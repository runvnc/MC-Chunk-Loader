//requires util

/*
var tags = {
  0 : { type: 0, name: 'end', payloadtype: -100 }, 
  1 : { type: 1, name: 'byte', numbytes: 1  },
  2 : { type: 2, name: 'short', numbytes: 2 },
  3 : { type: 3, name: 'int', numbytes: 4 },
  4 : { type: 4, name: 'long', numbytes: 8 },
  5 : { type: 5, name: 'float', numbytes: 4 },
  6 : { type: 6, name: 'double', numbytes: 8 },
  7 : { type: 7, name: 'byte_array', numbytes: -1, payloadtype: 3},
  8 : { type: 8, name: 'string', numbytes: -1, payloadtype: 2},
  9 : { type: 9, name: 'list', numbytes: -1},
  10 : {   
};
*/

function nbtscan(bytes, name, size) {
  
}


function tagfixed(data, name, size) {
  var pos = data.indexOf(name) + name.length-1;
  var str = data.substr(pos);
  var bytes = stringToBytes(str);
  return bytes.slice(0, size);
}

function tagint(data, name) {
  var piece = tagfixed(data, name, 4);
//  return piece;
  return getIntAt(piece, 0);
}

function nbt(data) {
  this.str = data.toString();
  
}
