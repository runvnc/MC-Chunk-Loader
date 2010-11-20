var gl;

//for simplex noise. see frag shader in index.html
var perm = [151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

/* These are Ken Perlin's proposed gradients for 3D noise. I kept them for
   better consistency with the reference implementation, but there is really
   no need to pad this to 16 gradients for this particular implementation.
   If only the "proper" first 12 gradients are used, they can be extracted
   from the grad4[][] array: grad3[i][j] == grad4[i*2][j], 0<=i<=11, j=0,1,2
*/
var grad3 = [[0,1,1],[0,1,-1],[0,-1,1],[0,-1,-1],
                   [1,0,1],[1,0,-1],[-1,0,1],[-1,0,-1],
                   [1,1,0],[1,-1,0],[-1,1,0],[-1,-1,0], // 12 cube edges
                   [1,0,-1],[-1,0,-1],[0,-1,1],[0,1,]]; // 4 more to make 16

  function initGL(canvas) {
    try {
      //gl = canvas.getContext("experimental-webgl");
      gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
      gl.viewportWidth = canvas.width;
      gl.viewportHeight = canvas.height;
    } catch(e) {
    }
    if (!gl) {
      alert("Could not initialise WebGL, sorry :-(");
    }
  }

/*
 * initPermTexture(GLuint *texID) - create and load a 2D texture for
 * a combined index permutation and gradient lookup table.
 * This texture is used for 2D and 3D noise, both classic and simplex.
 */
function initPermPixels()
{
  var pixels;
  var i,j;
  
  //pixels = (char*)malloc( 256*256*4 );
  pixels = new Array();
  for(i = 0; i<256; i++)
    for(j = 0; j<256; j++) {
      var offset = (i*256+j)*4;
      var value = perm[(j+perm[i]) & 0xFF];
      pixels[offset] = grad3[value & 0x0F][0] * 64 + 64;   // Gradient x
      pixels[offset+1] = grad3[value & 0x0F][1] * 64 + 64; // Gradient y
      pixels[offset+2] = grad3[value & 0x0F][2] * 64 + 64; // Gradient z
      pixels[offset+3] = value;                     // Permuted index
    }
  return pixels;  
}


 function handleLoadedTexture(texture, bytes, w, h) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  }

  var neheTexture;
  var permTexture;
  var permBytes;
  var permBuffer;
  var blocksBytes;
  var blocksTexture;

  function initTextures() {
    //permBuffer = new ArrayBuffer(perm.length);
    permBytes = new Uint8Array(initPermPixels());
    permTexture = gl.createTexture();
    handleLoadedTexture(permTexture, permBytes, 256, 256);

    blocksBytes = new Uint8Array(theworld.blocks);
    permTexture = gl.createTexture();
    handleLoadedTexture(blocksTexture, blocksBytes, theworld.blocksw, theworld.blocksh);    

  }
 
  function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
      return null;
    }
 
    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
      if (k.nodeType == 3) {
        str += k.textContent;
      }
      k = k.nextSibling;
    }
 
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null;
    }
 
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
 
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
    }
 
    return shader;
  }
 
 
  var shaderProgram;
  function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");
 
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
 
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }
 
    gl.useProgram(shaderProgram);
 
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
 
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.permUniform = gl.getUniformLocation(shaderProgram, "permTexture");
    shaderProgram.blocksUniform = gl.getUniformLocation(shaderProgram, "blocksTexture"); 
  }
 
 
  var mvMatrix;
 
  function loadIdentity() {
    mvMatrix = Matrix.I(4);
  }
 
 
  function multMatrix(m) {
    mvMatrix = mvMatrix.x(m);
  }
 
 
  function mvTranslate(v) {
    var m = Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4();
    multMatrix(m);
  }
 
 
  var pMatrix;
  function perspective(fovy, aspect, znear, zfar) {
    pMatrix = makePerspective(fovy, aspect, znear, zfar);
  }
 
 
  function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, new Float32Array(pMatrix.flatten()));
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, new Float32Array(mvMatrix.flatten()));
  }
 
  var triangleVertexPositionBuffer;
  var squareVertexPositionBuffer;
  function initBuffers() {
    /*
    triangleVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    var vertices = [
         0.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    triangleVertexPositionBuffer.itemSize = 3;
    triangleVertexPositionBuffer.numItems = 3;
    */
    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
         10.0,  10.0,  0.0,
        -10.0,  10.0,  0.0,
         10.0, -10.0,  0.0,
        -10.0, -10.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 4;
  }
 
 
  function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
 
    perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    loadIdentity();
 
    mvTranslate([-1.5, 0.0, -7.0]);
    
    mvTranslate([3.0, 0.0, 0.0]);

    setTimeUniform();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, permTexture);  
    gl.uniform1i(shaderProgram.permUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
  }
 
 
 
  function webGLStart() {
    var canvas = document.getElementById("glcanvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTextures();

    var d = new Date();
    startTime = d.getTime();
 
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
 
    gl.clearDepth(1.0);
 
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
 
    setInterval(drawScene, 15);
  }

function setTimeUniform() {
  var pT = gl.getUniformLocation(shaderProgram, "fTime");
  var d = new Date();
  gl.uniform1f(pT, d.getTime() - startTime);
}

