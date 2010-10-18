//most of this from learningwebgl.com

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

//
// start
//
// Called when the canvas is created to get the ball rolling.
// Figuratively, that is. There's nothing moving in this demo.
//
function start(vertices, colors) {
  log('passed in ' + vertices.length);
  log('passed in ' + colors.length);
  canvas = document.getElementById("glcanvas");
  
  initWebGL(canvas); // Initialize the GL context
  // Only continue if WebGL is available and working
  
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
    gl.clearDepth(1.0); // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    //gl.enable(gl.BLEND);
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    //gl.blendFunc(gl.SRC_ALPHA, gl.SRC_ALPHA); 
    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.
    
    initShaders();
    
    // Here's where we call the routine that builds all the objects
    // we'll be drawing.
    
    initBuffers(vertices, colors);
    
    //gl.enable(0x8642); // ctx.VERTEX_PROGRAM_POINT_SIZE);
    //gl.enable(0x0B10);
    
    // Set up to draw the scene periodically.
    
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    
    var d = new Date();
    startTime = d.getTime();
    setInterval(drawScene, 30);
  }
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;
  
  try {
    //gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
    gl = canvas.getContext("experimental-webgl");
  } 
  catch (e) {
    alert(e);
  }
  
  // If we don't have a GL context, give up now
  
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

posMatrix = Matrix.Translation($V([0.0, -4.0, 0.0])).ensure4x4();

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
  var newRotationMatrix = createRotationMatrix(deltaX / 10, [0, 1, 0]);
  
  var deltaY = newY - lastMouseY;
  newRotationMatrix = newRotationMatrix.x(createRotationMatrix(deltaY / 10, [1, 0, 0]));
  
  moonRotationMatrix = newRotationMatrix.x(moonRotationMatrix);
  
  lastMouseX = newX;
  lastMouseY = newY;
}


/** This is high-level function; REPLACE IT WITH YOUR CODE.
 * It must react to delta being more/less than zero.
 */
function handle(delta) {
  if (delta < 0) 
    posMatrix = posMatrix.x(Matrix.Translation($V([0.0, 0.0, -0.2])).ensure4x4());
  else 
    posMatrix = posMatrix.x(Matrix.Translation($V([0.0, 0.0, 0.2])).ensure4x4());
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

/* Initialization code. */
if (window.addEventListener) window.addEventListener('DOMMouseScroll', wheel, false);
window.onmousewheel = document.onmousewheel = wheel;


//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional square.
//

var vertsl;

function initBuffers(vertices, colors) {
  vertsl = vertices.length;
  
  // Create a buffer for the square's vertices.
  
  squareVerticesBuffer = gl.createBuffer();
  
  // Select the squareVerticesBuffer as the one to apply vertex
  // operations to from here out.
  
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  
  
  // Now create an array of vertices for the square. Note that the Z
  // coordinate is always 0 here.
  
  /* 
   var vertices = [
   1.0,  1.0,  0.0,
   -1.0, 1.0,  0.0,
   1.0,  -1.0, 0.0,
   -1.0, -1.0, 0.0
   ];
   */
  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a WebGLFloatArray from the JavaScript array,
  // then use it to fill the current vertex buffer.
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  
  // Now set up the colors for the vertices
  /*
   var colors = [
   1.0,  1.0,  1.0,  1.0,    // white
   1.0,  0.0,  0.0,  1.0,    // red
   0.0,  1.0,  0.0,  1.0,    // green
   0.0,  0.0,  1.0,  1.0     // blue
   ];
   */
  squareVerticesColorBuffer = gl.createBuffer();
  
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  // Clear the canvas before we start drawing on it.
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  perspectiveMatrix = makePerspective(45, 1000.0 / 700.0, 0.01, 3000.0);
  
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  
  loadIdentity();
  
  // Now move the drawing position a bit to where we want to start
  // drawing the square.
  
  
  //scaleM(scl);
  
  mvTranslate([0.0, 1.0, -11.0]);
  
  multMatrix(posMatrix);
  
  multMatrix(moonRotationMatrix);
  
  var d = new Date();
  mvRotate((d.getTime() - startTime) / 100.0, [0.0, 1.0, 0.0]);
  
  
  // Draw the square by binding the array buffer to the square's vertices
  // array, setting attributes, and pushing it to GL.
  
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
  
  // Set the colors attribute for the vertices.
  
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
  gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
  
  // Draw the square.
  
  setMatrixUniforms();
  
  gl.drawArrays(gl.POINTS, 0, vertsl / 3);
  
  
  //  gl.getError();
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");
  
  // Create the shader program
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  gl.useProgram(shaderProgram);
  
  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(vertexPositionAttribute);
  
  vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(vertexColorAttribute);
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  
  // Didn't find an element with the specified ID; abort.
  
  if (!shaderScript) {
    return null;
  }
  
  // Walk through the source element's children, building the
  // shader source string.
  
  var theSource = "";
  var currentChild = shaderScript.firstChild;
  
  while (currentChild) {
    if (currentChild.nodeType == 3) {
      theSource += currentChild.textContent;
    }
    
    currentChild = currentChild.nextSibling;
  }
  
  // Now figure out what type of shader script we have,
  // based on its MIME type.
  
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
  
  // Send the source to the shader object
  
  gl.shaderSource(shader, theSource);
  
  // Compile the shader program
  
  gl.compileShader(shader);
  
  // See if it compiled successfully
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
    return null;
  }
  
  return shader;
}

//
// Matrix utility functions
//

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
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
  return mvMatrix;
}


function createRotationMatrix(angle, v) {
  var arad = angle * Math.PI / 180.0;
  return Matrix.Rotation(arad, $V([v[0], v[1], v[2]])).ensure4x4();
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
