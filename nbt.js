//requires util

function tagfixed(data, name, size) {
  var pos = data.indexOf(name) + name.length;
  var str = data.substr(pos, size);
  return stringToBytes(str);
}

function tagint(data, name) {
  var piece = tagfixed(data, name, 4);
  return getIntAt(piece, 0);
}

function nbt(data) {
  this.str = data.toString();
}
