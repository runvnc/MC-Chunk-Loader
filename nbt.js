//requires util
//requires deflate

var tags = {
  '_0' : 'TAG_End', 
  '_1' : 'TAG_Byte',
  '_2' : 'TAG_Short',
  '_3' : 'TAG_Int',
  '_4' : 'TAG_Long',
  '_5' : 'TAG_Float',
  '_6' : 'TAG_Double' ,
  '_7' : 'TAG_Byte_Array',
  '_8' : 'TAG_String',
  '_9' : 'TAG_List',
  '_10' : 'TAG_Compound'   
};

function TAG(nbtreader) {

  this.reader = nbtreader;

  this.read = function() {
    this.bytes = this.reader.readBytes(this.byteCount);
    return this.decode();
  };

}


function readName() {
    var tagName = new TAG_String(this.reader);
    this.name = tagName.read();
    return this.name;
}

function TAG_End(nbtreader) {
  this.byteCount = 1;
  this.init(nbtreader);
}

function TAG_Int(nbtreader) {
  this.byteCount = 4;
  this.init(nbtreader);
}

function TAG_Short(nbtreader) {
  this.decode = function() {
    return makeshort(this.bytes);
  };
  this.byteCount = 2;
  this.init(nbtreader);
  
}

function makeshort(bytes) {
    var num = (bytes[0]<<8) | bytes[1];
    num = makeSigned(num, 16);
    return num;
}

function TAG_String(nbtreader) {

  this.read = function() {
    var shortBytes = nbtreader.readBytes(2);
    this.byteCount = makeshort(shortBytes);
    this.bytes = this.reader.readBytes(this.byteCount);
    return this.decode();
  };
  
  this.decode = function() {
    var bytereader = new ByteReader(this.bytes);
    var translator = new Utf8Translator(bytereader);   
    var str = "";
    var ch = 1;
    do {
      ch = translator.readChar();
      if (ch) str += ch;
    } while (ch);
    return str;         
  };

   this.reader = nbtreader;
}

function TAG_Long(nbtreader) {
  this.read = function() {
    this.bytes = nbtreader.readBytes(8);
    return this.decode();
  };

  this.decode = function() {
    var num = (this.bytes[0]<<56) | (this.bytes[1]<<48) | (this.bytes[2]<<40) | (this.bytes[3]<<32) |
              (this.bytes[4]<<24) | (this.bytes[5]<<16) | (this.bytes[6]<<8) | (this.bytes[7]);
    num = makeSigned(num, 64);
    return num;
  };

   this.reader = nbtreader;
}

function TAG_Compound(nbtreader) {

  this.read = function() {

  };

  this.decode = function() {
    
  };
}

TAG_String.prototype.readName = readName;
TAG_Short.prototype.readName = readName;
TAG_Int.prototype.readName = readName;
TAG_Long.prototype.readName = readName;
TAG_End.prototype.readName = readName;


function NBTReader(data) {
  this.position = 0;
  this.data = data;
  
  this.read = function() {

    var type = this.readBytes(1);
    
    var typeStr = '_'+type.toString();
    var name = tags[typeStr];
    var tag = null;

    switch(name) {
      case 'TAG_End':
        tag = new TAG_End(this);        
        break;  
      case 'TAG_Byte':
        tag = new TAG_Byte(this);
        break;
      case 'TAG_Short':
        tag = new TAG_Short(this);
        break;
      case 'TAG_Int':
        tag = new TAG_Int(this);
        break;
      case 'TAG_Long':
        tag = new TAG_Long(this);
        break;
      case 'TAG_Float':
        tag = new TAG_Float(this);
        break;
      case 'TAG_Double':
        tag = new TAG_Double(this);
        break;
      case 'TAG_Byte_Array':
        tag = new TAG_Byte_Array(this);
        break;
      case 'TAG_String':
        tag = new TAG_String(this);
        break;
      case 'TAG_List':
        tag = new TAG_List(this);
        break;
      case 'TAG_Compound':
        tag = new TAG_Compound(this);
        break;
      default:
        break;
    }
    var ret = new Object();
    var name = tag.readName();
    ret[name] = tag.read();
    return ret;
  };

  this.readBytes = function(count) {
    var ret = new Array();
    var start = this.position;
    for (var i=start; i<this.data.length &
         i<start+count; i++) {
          ret.push(this.data[i]);
          this.i++;
          this.position++;
    }     
    
    return ret;  
  };

}




