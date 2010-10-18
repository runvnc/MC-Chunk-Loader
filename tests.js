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

test("folder name -435", function() {
  var value = posfolder(-435);
  equals(value,'13', 'd');
});

});

