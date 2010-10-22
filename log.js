function log(s) {
  //console.log(s);
}

function msg(s) {
  $('#trace').append('<div>' + s + '</div>');
  $('#trace')[0].scrollTop = $('#trace')[0].scrollHeight;
}


function status(s) {
  $('#msg').html(s);
}
