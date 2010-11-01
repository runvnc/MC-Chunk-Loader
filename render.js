///most of this from learningwebgl.com

var canvas;
var gl;
var squareVerticesBuffer;
var squareVerticesColorBuffer;
var mvMatrix;
var posMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;
var scl = 1;
var startTime = 0;
var pitch = 0.0;
var yaw = 0.0;

var wasloaded = false;
var xmod;
var zmod;
function start(vertices, colors) {
  if (wasloaded) return;

  wasloaded = true;
  
  xmod = (Math.abs(minx)+1) * ChunkSizeX;
  zmod = (Math.abs(maxz)+1) * ChunkSizeZ;
  
  var ppos = theworld.level.Player.Pos;
  //ppos[0] += xmod;
  //ppos[2] += zmod;

  posMatrix = Matrix.Translation($V(ppos)).ensure4x4();
  canvas = document.getElementById("glcanvas");
  
  initWebGL(canvas);
  
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); 
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST); 
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things

    initShaders();
    
    initBuffers(vertices, colors);
    
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    
    var d = new Date();
    startTime = d.getTime();
    setInterval(drawScene, 15);
  }
}

function initWebGL() {
  gl = null;
  
  try {
    //gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
    gl = canvas.getContext("experimental-webgl");
  } 
  catch (e) {
    alert(e);
  }
  
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var moonRotationMatrix = Matrix.I(4);

function handleMouseDown(event) {
  mouseDown = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

function handleMouseUp(event) {
  mouseDown = false;
}

function handleMouseMove(event) {
  if (!mouseDown) {
    return;
  }
  var newX = event.clientX;
  var newY = event.clientY;
  
  var deltaX = newX - lastMouseX;
  var deltaY = newY - lastMouseY;

  pitch -= deltaY / 10.0;
  yaw -= deltaX / 10.0;

  lastMouseX = newX;
  lastMouseY = newY;

  return; 

  var newRotationMatrix;
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    newRotationMatrix = createRotationMatrix(deltaX / 10, [0, 1, 0]);
  } else {
    newRotationMatrix = createRotationMatrix(deltaY / 10, [1, 0, 0]);
  } 

  moonRotationMatrix = newRotationMatrix.x(moonRotationMatrix);
  //moonRotationMatrix = newRotationMatrix.x(posMatrix);
 
  lastMouseX = newX;
  lastMouseY = newY;
}

function handle(delta) {
  if (delta < 0) 
    posMatrix = posMatrix.x(Matrix.Translation($V([0.0, 0.0, -0.5])).ensure4x4());
  else 
    posMatrix = posMatrix.x(Matrix.Translation($V([0.0, 0.0, 0.5])).ensure4x4());
}

function wheel(event) {
  var delta = 0;
  if (!event) event = window.event;
  if (event.wheelDelta) {
    delta = event.wheelDelta / 120;
    if (window.opera) delta = -delta;
  }
  else 
    if (event.detail) {
      delta = -event.detail / 3;
    }
  if (delta) handle(delta);
  if (event.preventDefault) event.preventDefault();
  event.returnValue = false;
}

if (window.addEventListener) window.addEventListener('DOMMouseScroll', wheel, false);
window.onmousewheel = document.onmousewheel = wheel;


var vertsl;

function initBuffers(vertices, colors) {
  vertsl = vertices.length;
  
  squareVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  
  squareVerticesColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

////////////////////////////////////////////////////
function drawScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  perspectiveMatrix = makePerspective(45, canvas.width / canvas.height, 1.0, 3000.0);

  loadIdentity();

  mvRotate(-pitch, [1,0,0]);
  mvRotate(-yaw, [0,1,0]);
 
  var campos = [0,0,0];
  campos[0] = -1 * posMatrix.elements[0][3];
  campos[1] = -1 * posMatrix.elements[1][3];
  campos[2] = -1 * posMatrix.elements[2][3];
  mvTranslate(campos);

  //mvTranslate([xmod,0.0,zmod]);
  
  if ($('#roton').attr('checked')===true) {
    var d = new Date();
    mvRotate((d.getTime() - startTime) / 100.0, [0.0, 1.0, 0.0]); 
  } else {
    var n = 0;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
  gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();

  setTimeUniform();

  if (options.renderType == 'lines') {
    gl.drawArrays(gl.LINES, 0, vertsl / 6);
  } else if (options.renderType == 'cubes') {
    gl.drawArrays(gl.TRIANGLES, 0, vertsl / 3);
  } else {  
    gl.drawArrays(gl.POINTS, 0, vertsl / 3);
  }
}
//////////////////////////////////////////////////

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  gl.useProgram(shaderProgram);
  
  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  
  vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexColorAttribute);
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  
  if (!shaderScript) {
    return null;
  }
  
  var theSource = "";
  var currentChild = shaderScript.firstChild;
  
  while (currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
  
  var shader;
  
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  }
  else 
    if (shaderScript.type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    }
    else 
      if (shaderScript.type == "x-shader/x-geometry") {
        shader = gl.createShader(0x8B32);
      }
      else {
        return null; // Unknown shader type
      }
  
  gl.shaderSource(shader, theSource);
  gl.compileShader(shader);
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }
  
  return shader;
}

var mvMatrixStack = [];

function mvPushMatrix(m) {
  if (m) {
    mvMatrixStack.push(m.dup());
    mvMatrix = m.dup();
  }
  else {
    mvMatrixStack.push(mvMatrix.dup());
  }
}

function mvPopMatrix() {
  if (mvMatrixStack.length === 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}

function createRotationMatrix(angle, v) {
  var arad = angle * Math.PI / 180.0;
  return Matrix.Rotation(arad, $V([v[0], v[1], 0])).ensure4x4();
}

function mvRotate(angle, v) {
  multMatrix(createRotationMatrix(angle, v));
}

function loadIdentity() {
  mvMatrix = Matrix.I(4);
}

function multMatrix(m) {
  mvMatrix = mvMatrix.x(m);
}

function scaleM(s) {
  multMatrix(Matrix.Diagonal([s, s, s, 1]));
}

function mvTranslate(v) {
  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
}

function setMatrixUniforms() {
  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));
  
  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
}

function setTimeUniform() {
  var pT = gl.getUniformLocation(shaderProgram, "fTime");
  var d = new Date();
  gl.uniform1f(pT, d.getTime() - startTime);
}

