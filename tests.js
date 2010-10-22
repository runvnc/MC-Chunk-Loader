$(document).ready(function() {
  
test("1 + 1 = ?", function() {
  ok( 2, "this test is fine" );
  var value = 1+1;
  equals( 2, value, "We expect value to be 2" );

});

test("b36(-435)", function() {
  var value = b36(-435);
  equals('-c3', value, "Expected -c3");
});

test("folder name -13", function() {
  var value = posfolder(-13);
  equals("1f", value, "Expected 1f");
});

test("folder name 44", function() {
  var value = posfolder(44);
  equals("18", value, "Expected 18");
});

test("-435.mod(64)", function() {
  var value = (-435).mod(64);
  equals(13, value, "Expected 13");
});

test("NBT readBytes 1", function() {
  var value = [0];
  var tagReader = new NBTReader(value);
  equals(tagReader.readBytes(1),0);
});

test("get_ms1bit(254)", function() {
  equals(get_ms1bit(254), 128);
});

test("makesigned(254)", function() {
  var value = makeSigned(254);
  equals(value, -2,"");
});

test("makeshort(0 1)", function() {
  var arr = [0, 1];
  var value = makeshort(arr);
  equals(value,1, "");
});

test("makeshort(0 254)", function() {
  var arr = [0, 254];
  var value = makeshort(arr);
  equals(value, -2,'');
});

test("TAG_Long", function() {
  var arr = [0x04, 0x00, 0x04, 0x54, 0x69, 0x6D, 0x65, 0x00, 0x00, 0x00, 0x00, 0x00, 0x12, 0x68, 0x40];
  var nbtreader = new NBTReader(arr);
  var value = nbtreader.read();
  equals(value.Time,1206336);
});

});

