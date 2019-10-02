// Vertex shader program----------------------------------
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +          
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Easy-Access Global Variables-----------------------------
var ANGLE_STEP = 30.0;  // -- Rotation angle rate (degrees/second)
var FORMER_ANGLE_STEP = 30.0;
var SIZE_STEP = 0.5;
var FORMER_SIZE_STEP = 0.5;
var FISH_ANGLE_STEP = 90;

var gl;                 // WebGL's rendering context; value set in main()
var numVerts;           // # of vertices in VBO; value set in main()

var planeAngle = 0.0;
var cornerAngle = 0.0;
var wingAngle = 0.0;
var currentSize = 0.0; 

var isDrag=false;   // mouse-drag: true when user holds down mouse button
var xMclik=0.0;     // last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;

var MOUSE_DRAG = false;
var PLANE_MOVING = true;

var translatePlaneX = 0.0;
var translatePlaneY = 0.0;
var translatePlane = 0.2;

var c = (1 + Math.sqrt(5)) / 2;
var a = 1;
var b = 1 / c;

function main() {
  // Retrieve <canvas> element I created in HTML file:
  var canvas = document.getElementById('canvas');
	
  //Get the rendering context
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the WebGL rendering context from canvas');
    return;
  }

  // register keyboard events found within our HTML-5 canvas:
  window.addEventListener("keydown", myKeyDown, false);
  // register mouse events found within our HTML-5 canvas:
  canvas.onmousedown  = function(ev){myMouseDown(ev, gl, canvas)}; 
  canvas.onmousemove =  function(ev){myMouseMove(ev, gl, canvas)};
  canvas.onmouseup =    function(ev){myMouseUp(ev, gl, canvas)};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // Enable 3D depth-test when drawing: don't over-draw at any pixel 
  // unless the new Z value is closer to the eye than the old one.
  gl.depthFunc(gl.LESS);
  // enable 3D depth test
  gl.enable(gl.DEPTH_TEST);   
  
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Create a Vertex Buffer Object (VBO) in the GPU, and then fill it with numVerts vertices. 
  numVerts = initVertexBuffer();
  if (numVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();// Constructor for 4x4 matrix
  


  //---------------Interactive Animation: draw repeatedly
  var tick = function() {
    var now = Date.now();
    // Update the rotation angle
    planeAngle = animatePlane(planeAngle, now);  
    cornerAngle = animateCorner(cornerAngle, now);
    wingAngle = animateWing(wingAngle, now);
    currentSize = animateSize(currentSize, now);
    lastTime = now;
    // draw objects
    drawPlane(planeAngle, currentSize, modelMatrix, u_ModelLoc);  

    drawCorner(cornerAngle, wingAngle, modelMatrix, u_ModelLoc);
	// Request that the browser re-draw the webpage
    requestAnimationFrame(tick, canvas);   
                      
  };
  // AFTER that, call the function.
  tick(); // start (and continue) animation
}     

function initVertexBuffer() {
  var colorShapes = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B)
//vertices of plane
    // 2, 0, 0, 1, 1, 0, 0, //A
    // 1.75, -0.15, 0, 1, 0, 1, 0, //B
    // 1.75, 0, 0.25, 1, 0, 0, 1, //C
    // 1.75, 0.15, 0, 1, 1, 1, 0, //D
    // 1.75, 0, -0.15, 1, 0, 1, 1, //E
//head--------------------------------------
    2, 0, 0, 1, 0.4, 0.5, 0.6, //A
    1.75, -0.15, 0, 1, 0.38, 0.6, 0.96, //B
    1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C

    2, 0, 0, 1, 0.4, 0.5, 0.6, //A
    1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C
    1.75, 0.15, 0, 1, 0.38, 0.6, 0.96, //D

    2, 0, 0, 1, 0.4, 0.5, 0.6, //A
    1.75, 0.15, 0, 1, 0.38, 0.6, 0.96, //D
    1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E

    2, 0, 0, 1, 0.4, 0.5, 0.6, //A
    1.75, -0.15, 0, 1, 0.38, 0.6, 0.96, //B
    1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E
//tail------------------------------------
    -0.9, 0, 0, 1, 0.4, 0.5, 0.6, //A'
    -0.75, -0.15, 0, 1, 0.38, 0.6, 0.96, //B'
    -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C'

    -0.9, 0, 0, 1, 0.4, 0.5, 0.6, //A'
    -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C'
    -0.75, 0.15, 0, 1, 0.38, 0.6, 0.96, //D'

    -0.9, 0, 0, 1, 0.4, 0.5, 0.6, //A'
    -0.75, 0.15, 0, 1, 0.38, 0.6, 0.96, //D'
    -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E'

    -0.9, 0, 0, 1, 0.4, 0.5, 0.6, //A'
    -0.75, -0.15, 0, 1, 0.38, 0.6, 0.96, //B'
    -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E'
//body---------------------------------------
    1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, //B
    -0.75, -0.15, 0, 1, 0.4, 0.5, 0.6, //B'
    -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C'

    1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, //B
    1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C
    -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C'

    1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C
    -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C'
    1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, //D

    -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C'
    1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, //D
    -0.75, 0.15, 0, 1, 0.4, 0.5, 0.6, //D'

    1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, //D
    -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E'
    1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E

    1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, //D
    1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E
    -0.75, 0.15, 0, 1, 0.4, 0.5, 0.6, //D'

    1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, //D
    -0.75, 0.15, 0, 1, 0.4, 0.5, 0.6, //D'
    -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E'

    1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E
    -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E'
    1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, //B

    1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, //B
    -0.75, -0.15, 0, 1, 0.4, 0.5, 0.6, //B'
    1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E

    -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //E'
    -0.75, -0.15, 0, 1, 0.4, 0.5, 0.6, //B'
    1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, //B

//front wings-------------------------------------
    1.75, 0, 2, 1, 0.67, 0.78, 0.96, //F
    0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //G
    1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C

    1.5, 0.1, 0.1, 1, 0.4, 0.5, 0.6,//H
    1.75, 0, 2, 1, 0.67, 0.78, 0.96, //F
    1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C

    1.75, 0, 2, 1, 0.67, 0.78, 0.96, //F
    0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //G
    1.5, 0.1, 0.1, 1, 0.4, 0.5, 0.6,//H
//
    1.75, 0, -2, 1, 0.67, 0.78, 0.96, //F
    0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //G
    1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //C

    1.5, 0.1, -0.1, 1, 0.4, 0.5, 0.6,//H
    1.75, 0, -2, 1, 0.67, 0.78, 0.96, //F
    1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //C

    1.75, 0, -2, 1, 0.67, 0.78, 0.96, //F
    0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //G
    1.5, 0.1, -0.1, 1, 0.4, 0.5, 0.6,//H

//back wings---------------------------------
    -0.5, 0, -1, 1, 0.67, 0.78, 0.96, //F‘
    -0.5, 0, -0.15, 1, 0.38, 0.6, 0.96,//G'
    -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //C'

    -0.65, 0.1, 0.1, 1, 0.4, 0.5, 0.6,//H'
    -0.5, 0, -1, 1, 0.67, 0.78, 0.96, //F‘
    -0.5, 0, -0.15, 1, 0.38, 0.6, 0.96,//G'

    -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, //C'
    -0.65, 0.1, 0.1, 1, 0.4, 0.5, 0.6,//H'
    -0.5, 0, -1, 1, 0.67, 0.78, 0.96, //F‘
//
    -0.5, 0, 1, 1, 0.67, 0.78, 0.96, //F‘
    -0.5, 0, 0.15, 1, 0.38, 0.6, 0.96,//G'
    -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C'

    -0.65, 0.1, 0.1, 1, 0.4, 0.5, 0.6,//H'
    -0.5, 0, 1, 1, 0.67, 0.78, 0.96, //F‘
    -0.5, 0, 0.15, 1, 0.38, 0.6, 0.96,//G'

    -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, //C'
    -0.65, 0.1, 0.1, 1, 0.4, 0.5, 0.6,//H'
    -0.5, 0, 1, 1, 0.67, 0.78, 0.96, //F‘

// 
    -0.2, 0.15, 0, 1, 0.38, 0.6, 0.96,//J
    -0.75, 0.15, 0, 1, 0.38, 0.6, 0.96, //D'
    -0.75, 0.4, 0, 1, 0.67, 0.78, 0.96,//I
//93 points

// Hopter--------------------------------------
//vertices
    // 2, 0, 0, 1, 0.4, 0.5, 0.6, //A
    // 2, 0, -0.5, 1, 0.4, 0.5, 0.6,//K
    // 2, 0.05, -0.4, 1, 0.4, 0.5, 0.6,//L
    // 2, -0.05, -0.4, 1, 0.4, 0.5, 0.6,//M
    // 1.95, 0, -0.4, 1, 0.4, 0.5, 0.6,//N
    // 2.05, 0, -0.4, 1, 0.4, 0.5, 0.6,//O

    2, 0, 0, 1,  1, 1, 1,  //A
    2, -0.05, -0.4, 1, 1, 1, 1,//M
    2.05, 0, -0.4, 1, 1, 1, 1,//O

    2, -0.05, -0.4, 1, 1, 1, 1,//M
    2, 0, -0.5, 1, 0.4, 0.5, 0.6,//K
    2.05, 0, -0.4, 1, 1, 1, 1,//O

    2, 0, 0, 1, 1, 1, 1, //A
    2, 0.05, -0.4, 1, 1, 1, 1,//L
    2.05, 0, -0.4, 1, 1, 1, 1,//O

    2, 0.05, -0.4, 1, 1, 1, 1,//L
    2.05, 0, -0.4, 1, 1, 1, 1,//O
    2, 0, -0.5, 1, 0.4, 0.5, 0.6,//K

    2, 0, 0, 1, 1, 1, 1, //A
    1.95, 0, -0.4, 1, 1, 1, 1,//N
    2, 0.05, -0.4, 1, 1, 1, 1,//L

    1.95, 0, -0.4, 1, 1, 1, 1,//N
    2, 0.05, -0.4, 1, 1, 1, 1,//L
    2, 0, -0.5, 1, 0.4, 0.5, 0.6,//K

    2, 0, 0, 1, 1, 1, 1, //A
    1.95, 0, -0.4, 1, 1, 1, 1,//N
    2, -0.05, -0.4, 1, 1, 1, 1,//M

    1.95, 0, -0.4, 1, 1, 1, 1,//N
    2, -0.05, -0.4, 1, 1, 1, 1,//M
    2, 0, -0.5, 1, 0.4, 0.5, 0.6,//K

//
    2, 0, 0, 1,  1, 1, 1,  //A
    2, -0.05, 0.4, 1, 1, 1, 1,//M
    2.05, 0, 0.4, 1, 1, 1, 1,//O

    2, -0.05, 0.4, 1, 1, 1, 1,//M
    2, 0, 0.5, 1, 0.4, 0.5, 0.6,//K
    2.05, 0, 0.4, 1, 1, 1, 1,//O

    2, 0, 0, 1, 1, 1, 1, //A
    2, 0.05, 0.4, 1, 1, 1, 1,//L
    2.05, 0, 0.4, 1, 1, 1, 1,//O

    2, 0.05, 0.4, 1, 1, 1, 1,//L
    2.05, 0, 0.4, 1, 1, 1, 1,//O
    2, 0, 0.5, 1, 0.4, 0.5, 0.6,//K

    2, 0, 0, 1, 1, 1, 1, //A
    1.95, 0, 0.4, 1, 1, 1, 1,//N
    2, 0.05, 0.4, 1, 1, 1, 1,//L

    1.95, 0, 0.4, 1, 1, 1, 1,//N
    2, 0.05, 0.4, 1, 1, 1, 1,//L
    2, 0, 0.5, 1, 0.4, 0.5, 0.6,//K

    2, 0, 0, 1, 1, 1, 1, //A
    1.95, 0, 0.4, 1, 1, 1, 1,//N
    2, -0.05, 0.4, 1, 1, 1, 1,//M

    1.95, 0, 0.4, 1, 1, 1, 1,//N
    2, -0.05, 0.4, 1, 1, 1, 1,//M
    2, 0, 0.5, 1, 0.4, 0.5, 0.6,//K
 //------------------------------------141
    // 2, 0, 0, 1, 1, 1, 1, //A
    // 2, 0.5, 0, 1, 0.4, 0.5, 0.6,//B
    // 1.95, 0.4, 0, 1, 1, 1, 1,//C
    // 2.05, 0.4, 0, 1, 1, 1, 1, //D
    // 2, 0.4, 0.05, 1, 1, 1, 1, //E
    // 2, 0.4, -0.05, 1, 1, 1, 1, //F

    2, 0, 0, 1, 1, 1, 1, //A
    2, 0.4, 0.05, 1, 1, 1, 1, //E
    2.05, 0.4, 0, 1, 1, 1, 1, //D

    2, 0, 0, 1, 1, 1, 1, //A
    2, 0.4, 0.05, 1, 1, 1, 1, //E
    1.95, 0.4, 0, 1, 1, 1, 1,//C

    2, 0, 0, 1, 1, 1, 1, //A
    2, 0.4, -0.05, 1, 1, 1, 1, //F
    2.05, 0.4, 0, 1, 1, 1, 1, //D

    2, 0, 0, 1, 1, 1, 1, //A
    2, 0.4, -0.05, 1, 1, 1, 1, //F
    1.95, 0.4, 0, 1, 1, 1, 1,//C

    2, 0.5, 0, 1, 0.4, 0.5, 0.6,//B
    2, 0.4, 0.05, 1, 1, 1, 1, //E
    2.05, 0.4, 0, 1, 1, 1, 1, //D

    2, 0.5, 0, 1, 0.4, 0.5, 0.6,//B
    2, 0.4, 0.05, 1, 1, 1, 1, //E
    1.95, 0.4, 0, 1, 1, 1, 1,//C

    2, 0.5, 0, 1, 0.4, 0.5, 0.6,//B
    2, 0.4, -0.05, 1, 1, 1, 1, //F
    2.05, 0.4, 0, 1, 1, 1, 1, //D

    2, 0.5, 0, 1, 0.4, 0.5, 0.6,//B
    2, 0.4, -0.05, 1, 1, 1, 1, //F
    1.95, 0.4, 0, 1, 1, 1, 1,//C
 //-----------------------------------  
    2, 0, 0, 1, 1, 1, 1, //A
    2, -0.4, 0.05, 1, 1, 1, 1, //E
    2.05, -0.4, 0, 1, 1, 1, 1, //D

    2, 0, 0, 1, 1, 1, 1, //A
    2, -0.4, 0.05, 1, 1, 1, 1, //E
    1.95, -0.4, 0, 1, 1, 1, 1,//C

    2, 0, 0, 1, 1, 1, 1, //A
    2, -0.4, -0.05, 1, 1, 1, 1, //F
    2.05, -0.4, 0, 1, 1, 1, 1, //D

    2, 0, 0, 1, 1, 1, 1, //A
    2, -0.4, -0.05, 1, 1, 1, 1, //F
    1.95, -0.4, 0, 1, 1, 1, 1,//C

    2, -0.5, 0, 1, 0.4, 0.5, 0.6,//B
    2, -0.4, 0.05, 1, 1, 1, 1, //E
    2.05, -0.4, 0, 1, 1, 1, 1, //D

    2, -0.5, 0, 1, 0.4, 0.5, 0.6,//B
    2, -0.4, 0.05, 1, 1, 1, 1, //E
    1.95, -0.4, 0, 1, 1, 1, 1,//C

    2, -0.5, 0, 1, 0.4, 0.5, 0.6,//B
    2, -0.4, -0.05, 1, 1, 1, 1, //F
    2.05, -0.4, 0, 1, 1, 1, 1, //D

    2, -0.5, 0, 1, 0.4, 0.5, 0.6,//B
    2, -0.4, -0.05, 1, 1, 1, 1, //F
    1.95, -0.4, 0, 1, 1, 1, 1,//C 
    //------------------------------
 //flag
    // -0.9, 0, 0, 1, 1, 1, 1, //A'
    // -0.9, 0.2, 0, 1, 1, 1, 1, //P
    // -0.9, 0.3, 0, 1, 1, 1, 1, //Q
    // -1.1, 0.3, 0, 1, 1, 1, 1, //R
    // -1.1, 0.2, 0, 1, 1, 1, 1, //S

    -1.1, 0.3, 0, 1, 1, 0, 0, //R
    -0.9, 0.3, 0, 1, 1, 0, 0, //Q
    -0.9, 0.2, 0, 1, 1, 0, 0, //P

    -1.1, 0.3, 0, 1, 1, 0, 0, //R
    -1.1, 0.2, 0, 1, 1, 0, 0, //S
    -0.9, 0.2, 0, 1, 1, 0, 0, //P
// line
    -0.9, 0, 0, 1, 1, 1, 1, //A'
    -0.9, 0.3, 0, 1, 1, 1, 1, //Q
//hopter line
    2, 0, 0, 1, 1, 1, 1, //A
    2.5, 0, 0, 1, 1, 1, 1, //A'

    //--------------------right corner
    //fish
    0, 0, 0.3, 1, 1, 0.1, 0.1,// 0
    1, -1, 0, 1, 1, 1, 0.3,// 1
    1, 1, 0, 1, 1, 0.1, 0.1,// 2

    1, -1, 0, 1, 1, 1, 0.3,     // 1
    0, 0, 0.3, 1, 1, 0.1, 0.1,// 0
    0.25, -0.25, 0, 1, 1, 1, 0.3,// 3

    0.25, -0.25, 0, 1, 1, 1, 0.3,// 3
    0, 0, 0.3, 1, 1, 0.1, 0.1,// 0
    0, -1, 0, 1, 1, 1, 0.3,// 4

    0, -1, 0, 1, 1, 1, 0.3,// 4
    -0.25, -0.25, 0, 1, 1, 1, 0.3,// 5
    0, 0, 0.3, 1, 1, 0.1, 0.1,// 0

    0, 0, 0.3, 1, 1, 0.1, 0.1,   // 0
    -0.25, -0.25, 0, 1, 1, 1, 0.3, // 5
    -1, 0, 0, 1, 1, 1, 0.3,// 6

    -1, 0, 0, 1, 1, 1, 0.3, // 6
    -0.25, 0.25, 0, 1, 1, 1, 0.3,// 7
    0, 0, 0.3, 1, 1, 0.1, 0.1,// 0

    0, 0, 0.3, 1, 1, 0.1, 0.1,// 0
    -0.25, 0.25, 0, 1, 1, 1, 0.3,// 7
    -1, 1, 0, 1, 1, 1, 0.3,// 8

    -1, 1, 0, 1, 1, 1, 0.3,// 8
    1, 1, 0, 1, 1, 0.1, 0.1,// 2
    0, 0, 0.3, 1, 1, 0.1, 0.1,// 0

    0, 0, -0.3, 1.0, 1, 0.1, 0.1,// 0'
    1, -1, 0, 1, 1, 1, 0.3,// 1
    1, 1, 0, 1, 1, 0.1, 0.1,// 2

    1, -1, 0, 1, 1, 1, 0.3,// 1
    0, 0, -0.3, 1, 1, 0.1, 0.1,// 0'
    0.25, -0.25, 0, 1, 1, 1, 0.3,// 3

    0.25, -0.25, 0, 1, 1, 1, 0.3,// 3
    0, 0, -0.3, 1, 1, 0.1, 0.1,// 0'
    0, -1, 0, 1, 1, 1, 0.3,// 4

    0, -1, 0, 1, 1, 1, 0.3,// 4
    -0.25, -0.25, 0, 1, 1, 1, 0.3,// 5
    0, 0, -0.3, 1, 1, 0.1, 0.1,// 0'

    0, 0, -0.3, 1, 1, 0.1, 0.1,// 0'
    -0.25, -0.25, 0, 1, 1, 1, 0.3,// 5
    -1, 0, 0, 1, 1, 1, 0.3,// 6

    -1, 0, 0, 1, 1, 1, 0.3,// 6
    -0.25, 0.25, 0, 1, 1, 1, 0.3,// 7
    0, 0, -0.3, 1, 1, 0.1, 0.1,// 0'

    0, 0, -0.3, 1, 1, 0.1, 0.1,// 0'
    -0.25, 0.25, 0, 1, 1, 1, 0.3,// 7
    -1, 1, 0, 1, 1, 1, 0.3,// 8

    -1, 1, 0, 1, 1, 1, 0.3,// 8
    1, 1, 0, 1, 1, 0.1, 0.1,// 2
    0, 0, -0.3, 1, 1, 0.1, 0.1,// 0'
//199+ 48
//spinning tops--------------------------------------------
    //top
    1, 1, 0.5, 1, 0.6, 0.45, 0.87,  // 0
    0, 1, 0, 1, 0.92, 0.46, 0.76,// 8
    0.5, 0, 1, 1, 1, 1, 1, //  1

    0.5, 0, 1, 1, 1, 1, 1,//  1
    0, 1, 0, 1, 0.92, 0.46, 0.76,// 8
    -0.5, 1, 1, 1, 0.6, 0.45, 0.87,//  2

    -0.5, 1, 1, 1, 0.6, 0.45, 0.87,//  2
    0, 1, 0, 1, 0.92, 0.46, 0.76,// 8
    -1, 0, 0.5, 1, 1, 1, 1,//  3

    -1, 0, 0.5, 1, 1, 1, 1,//  3
    0, 1, 0, 1, 0.92, 0.46, 0.76,// 8
    -1, 1, -0.5, 1, 0.6, 0.45, 0.87,//  4

    -1, 1, -0.5, 1, 0.6, 0.45, 0.87,//  4
    0, 1, 0, 1, 0.92, 0.46, 0.76,// 8
    -0.5, 0, -1, 1, 1, 1, 1,//  5
    
    -0.5, 0, -1, 1, 1, 1, 1,//  5
    0, 1, 0, 1, 0.92, 0.46, 0.76,// 8
    0.5, 1, -1, 1, 0.6, 0.45, 0.87,//  6

    0.5, 1, -1, 1, 0.6, 0.45, 0.87,// 6
    0, 1, 0, 1, 0.92, 0.46, 0.76,// 8
    1, 0, -0.5, 1, 1, 1, 1, // 7

    1, 0, -0.5, 1, 1, 1, 1, // 7
    0, 1, 0, 1, 0.92, 0.46, 0.76,// 8
    1, 1, 0.5, 1, 0.6, 0.45, 0.87,// 0

// 247+24
//---------------------------------------------------------
   //botton
    1, 1, 0.5, 1, 0.6, 0.45, 0.87, // 0
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,// 8
    0.5, 0, 1, 1, 1, 1, 1,// 1

    0.5, 0, 1, 1, 1, 1, 1,// 1
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,// 8
    -0.5, 1, 1, 1, 0.6, 0.45, 0.87,// 2

    -0.5, 1, 1.0, 1, 0.6, 0.45, 0.87,// 2
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,// 8
    -1, 0, 0.5, 1, 1, 1, 1,// 3

    -1, 0, 0.5, 1, 1, 1, 1,// 3
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,// 8
    -1, 1, -0.5, 1, 0.6, 0.45, 0.87,// 4

    -1, 1, -0.5, 1, 0.6, 0.45, 0.87,// 4
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,// 8
    -0.5, 0, -1, 1, 1, 1, 1,// 5

    -0.5, 0, -1, 1, 1, 1, 1,// 5
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,// 8
    0.5, 1, -1, 1, 0.6, 0.45, 0.87,// 6

    0.5, 1, -1, 1, 0.6, 0.45, 0.87,// 6
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,// 8
    1, 0, -0.5, 1, 1, 1, 1, // 7

    1, 0, -0.5, 1, 1, 1, 1, // 7
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,// 8
    1, 1, 0.5, 1, 0.6, 0.45, 0.87,// 0
//271 + 24
//Icosahedron--------------
    0,  b, -a, 1, 0.6, 0.45, 0.87, 
    -b,  a,  0, 1, 0.92, 0.46, 0.76, 
    b,  a,  0, 1, 0.6, 0.45, 0.87, 

    -b,  a,  0, 1, 0.92, 0.46, 0.76, 
    0,  b,  a, 1, 0.6, 0.45, 0.87, 
    b,  a,  0, 1, 0.6, 0.45, 0.87, 

     0, -b,  a, 1, 0.92, 0.46, 0.76, 
     0,  b,  a, 1, 0.6, 0.45, 0.87, 
     -a,  0,  b, 1, 0.6, 0.45, 0.87, 

     a,  0,  b, 1, 0.92, 0.46, 0.76, 
     0,  b,  a, 1, 0.6, 0.45, 0.87, 
     0, -b,  a, 1, 0.92, 0.46, 0.76, 

     0, -b, -a, 1, 0.6, 0.45, 0.87, //
     0,  b, -a, 1,0.6, 0.45, 0.87, 
     a,  0, -b, 1, 0.92, 0.46, 0.76, 

    -a,  0, -b, 1, 0.92, 0.46, 0.76, 
    0,  b, -a, 1, 0.6, 0.45, 0.87, 
    0, -b, -a, 1, 0.6, 0.45, 0.87, 

     b, -a,  0, 1, 0.6, 0.45, 0.87, 
     0, -b,  a, 1, 0.92, 0.46, 0.76, 
     -b, -a, 0, 1, 1, 1, 1, 

    -b, -a, 0, 1, 1, 1, 1, 
    0, -b, -a, 1, 0.6, 0.45, 0.87, 
    b, -a,  0, 1, 0.6, 0.45, 0.87, 

    -a,  0,  b, 1, 0.6, 0.45, 0.87, 
    -b,  a,  0, 1, 0.92, 0.46, 0.76, 
    -a,  0, -b, 1, 0.92, 0.46, 0.76, 

    -a,  0, -b, 1, 0.92, 0.46, 0.76, 
    -b, -a,  0, 1, 1, 1, 1, 
    -a,  0,  b, 1, 0.6, 0.45, 0.87, 

     a,  0, -b, 1, 0.92, 0.46, 0.76, 
     b,  a,  0, 1, 0.6, 0.45, 0.87, 
     a,  0,  b, 1, 0.92, 0.46, 0.76, 

     a,  0,  b, 1, 0.92, 0.46, 0.76, 
     b, -a,  0, 1, 0.6, 0.45, 0.87, 
     a,  0, -b, 1, 0.92, 0.46, 0.76, 

    -a,  0,  b, 1, 0.6, 0.45, 0.87, 
    0,  b,  a,  1, 0.6, 0.45, 0.87, 
    -b,  a,  0, 1, 0.92, 0.46, 0.76, 

     b,  a,  0, 1, 0.6, 0.45, 0.87, 
     0,  b,  a, 1, 0.6, 0.45, 0.87, 
     a,  0,  b, 1, 0.92, 0.46, 0.76, 

    -b,  a,  0, 1, 0.92, 0.46, 0.76, 
    0,  b, -a,  1, 0.6, 0.45, 0.87, 
    -a,  0, -b, 1, 0.92, 0.46, 0.76,

     a,  0, -b, 1, 0.92, 0.46, 0.76, 
     0,  b, -a, 1, 0.6, 0.45, 0.87, 
     b,  a,  0, 1, 0.6, 0.45, 0.87, 

    -a,  0, -b, 1, 0.92, 0.46, 0.76, 
    0, -b, -a,  1, 0.6, 0.45, 0.87, 
    -b, -a,  0, 1, 1, 1, 1, 

     b, -a,  0, 1, 0.6, 0.45, 0.87, 
     0, -b, -a, 1, 0.6, 0.45, 0.87, 
     a,  0, -b, 1, 0.92, 0.46, 0.76, 

    -b, -a,  0, 1, 1, 1, 1, 
    0, -b,  a,  1, 0.92, 0.46, 0.76, 
    -a,  0,  b, 1, 0.6, 0.45, 0.87, 

     a,  0,  b, 1, 0.92, 0.46, 0.76, 
     0, -b,  a, 1, 0.92, 0.46, 0.76, 
     b, -a,  0, 1, 0.6, 0.45, 0.87, 
     //295 + 60
  ]);
  var nn = 199 + 48 +24 + 24 + 60;    // # of vertices
  
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
  console.log('How many bytes per stored value? -> FSIZE: ' + FSIZE);

  // Connect a VBO Attribute to Shaders------------------------------------------
  //Get GPU's handle for Vertex Shader's position-input variable: 
  var a_PositionLoc = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_PositionLoc < 0) {
    console.log('Failed to get attribute storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to Vertex Shader retrieves position data from VBO:
  gl.vertexAttribPointer(a_PositionLoc, 4, gl.FLOAT, false, FSIZE * 7, 0); 
 
  // Enable assignment of vertex buffer object's position data
  gl.enableVertexAttribArray(a_PositionLoc);  
                    

// Connect a VBO Attribute to Shaders-------------------------------------------
  // Get graphics system's handle for Vertex Shader's color-input variable;
  var a_ColorLoc = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_ColorLoc < 0) {
    console.log('Failed to get the attribute storage location of a_Color');
    return -1;
  }
  // Use handle to specify how Vertex Shader retrieves color data from our VBO:
  gl.vertexAttribPointer(a_ColorLoc, 3, gl.FLOAT, false, FSIZE * 7, FSIZE * 4); 
  
  // Enable assignment of vertex buffer object's position data 
  gl.enableVertexAttribArray(a_ColorLoc);  

  // Unbind the buffer object: no more modifications needed.
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function drawPlane(planeAngle, currentSize, modelMatrix, u_ModelLoc) {

  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  modelMatrix.setTranslate(-0.3,-0.3, 0.0);  
  
  // modelMatrix.scale(1,1,-1); // convert to left-handed coord sys to match WebGL display canvas.
  modelMatrix.scale(0.4, 0.4, 0.4); // smaller
  modelMatrix.translate(translatePlaneX, translatePlaneY, 0.0);
  
  modelMatrix.rotate(planeAngle, 1, 1, 0);  // Make new drawing axes that 
  //spin around axis (1,1,0) of the previous drawing axes, using the same origin.

  gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);
  
  gl.drawArrays(gl.TRIANGLES, 0, 93);
  gl.drawArrays(gl.TRIANGLES,189, 6);
  gl.drawArrays(gl.LINES,195, 2);
  

  pushMatrix(modelMatrix);
  //Icosahedron 
  modelMatrix.scale(0.3, 0.3, 0.3);
  modelMatrix.translate(-4.3, 0.0, 0.0);
 
  modelMatrix.rotate(-10*planeAngle, 1, 1, 1);
  modelMatrix.scale(currentSize, 1, 1);

  gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 295, 60);


  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);

  // modelMatrix.translate(, 0.0, 0.0);
  modelMatrix.rotate(-20*planeAngle, 1, 0, 0);
  gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);

  gl.drawArrays(gl.TRIANGLES,93, 96); 
  gl.drawArrays(gl.LINES,197, 2);
  // modelMatrix = popMatrix();

}


function drawCorner(currentAngle, wingAngle, modelMatrix, u_ModelLoc){
    
    modelMatrix.setTranslate(0.5, 0.5, 0.0);
    modelMatrix.scale(0.14, 0.14, 0.14);
    modelMatrix.translate(xMdragTot * 5, yMdragTot * 5, 0);
    modelMatrix.rotate(currentAngle, 1, 1, 0);

    gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 199, 48);

    pushMatrix(modelMatrix);

    modelMatrix.translate(-2.0, 0.0, 0.0);
    modelMatrix.rotate(-90, 0, 0, 1);
    modelMatrix.rotate(-3*wingAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 247, 24);
    gl.drawArrays(gl.TRIANGLES, 271, 24);

    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(2.0, 0.0, 0.0);
    modelMatrix.rotate(90, 0, 0, 1);
    modelMatrix.rotate(-2*wingAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 247, 24);
    gl.drawArrays(gl.TRIANGLES, 271, 24);
}

// Last time that this function was called:  (used for animation timing)
var lastTime = Date.now();

function animatePlane(angle, now) {

  var elapsed = now - lastTime;
  // if(angle >  200.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  // if(angle < -200.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function animateCorner(angle, now) {

    var elapsed = now - lastTime;
    // if(angle >  270.0 && FISH_ANGLE_STEP > 0) FISH_ANGLE_STEP = -FISH_ANGLE_STEP;
    // if(angle < -270.0 && FISH_ANGLE_STEP < 0) FISH_ANGLE_STEP = -FISH_ANGLE_STEP;
    var newAngle = angle + (FISH_ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
}

function animateWing(angle, now) {

  var elapsed = now - lastTime;
  var newAngle = angle + (90.0 * elapsed) / 1000.0;
  return newAngle %= 360;
}

function animateSize(size, now) {
  var elapsed = now - lastTime;
  if(size >  1 && SIZE_STEP > 0) SIZE_STEP = -SIZE_STEP;
  if(size < -1 && SIZE_STEP < 0) SIZE_STEP = -SIZE_STEP;
  var newSize = size + (SIZE_STEP * elapsed) / 1000.0;
  return newSize;
}

//-------------HTML Button Callbacks-------------
function userInstructions(){
  document.getElementById("instructions").innerHTML = "1. You can make the plane spin faster by pressing ‘Speed Up’ button.  <br />2. You can make the plane spin slower by pressing ‘Slow Down’ button.<br />3. You can stop or make the plane start to spin by pressing ‘Spin / Stop’ button. <br />4. You can reverse the spinning direction by pressing 'Reverse' button. <br />5. You can simply press keyboard directly to control spinning. 'U' for 'speed up', 'D' for 'slow down', 'S' for 'stop / spin', and ‘R’ for ‘change direction’. Also, you can control the location of the plane by pressing keyboard. ‘F’ for left, ‘H’ for right, ‘T’ for up, ‘G’ for down. <br />6. If you simply click on canvas, the plane will stop spinning. If you click again, the plane starts to spin at its original spinning speed. <br />7. You can use mouse to drag the Fish on canvas."
}

function speedUp() {
  ANGLE_STEP += 10; 
  document.getElementById("sentence").innerHTML = "The plane is spinning at " + ANGLE_STEP + " degrees / second. <br />The Hopter is spinning at " + ANGLE_STEP*20 + " degrees / second. <br />The Icosahedron is spinning at " + ANGLE_STEP*10 + " degrees / second. ";
}

function slowDown() {
 ANGLE_STEP -= 10; 
 document.getElementById("sentence").innerHTML = "The plane is spinning at " + ANGLE_STEP + " degrees / second. <br />The Hopter is spinning at " + ANGLE_STEP*20 + " degrees / second. <br />The Icosahedron is spinning at " + ANGLE_STEP*10 + " degrees / second. ";

}

function spinStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    myTmp2 = SIZE_STEP;
    ANGLE_STEP = 0;
    SIZE_STEP = 0;
    document.getElementById("sentence").innerHTML = "The plane & Hopter stop!!";
    
  }
  else {
    ANGLE_STEP = myTmp;
    SIZE_STEP = myTmp2;

    document.getElementById("sentence").innerHTML = "The plane is spinning at "+ ANGLE_STEP + " degrees / second. <br />The Hopter is spinning at " + ANGLE_STEP*20 + " degrees / second. <br />The Icosahedron is spinning at " + ANGLE_STEP*10 + " degrees / second. ";

  }
}

function changeDirection(){
  ANGLE_STEP = -ANGLE_STEP;
  document.getElementById("sentence").innerHTML = "The plane changes its spinning direction!!<br />The plane is spinning at " + ANGLE_STEP + " degrees / second. <br />The Hopter is spinning at " + ANGLE_STEP*20 + " degrees / second. <br />The Icosahedron is spinning at " + ANGLE_STEP*10 + " degrees / second. ";
  
}

function clearDrag() {
// Called when user presses 'Clear' button in our webpage
  xMdragTot = 0.0;
  yMdragTot = 0.0;
}

//===================Mouse and Keyboard event-handling Callbacks
function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /  (canvas.width/2);  // move origin to center of canvas and
                                                       // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /  (canvas.height/2);  //                     -1 <= y < +1.
               
  isDrag = true;                      // set mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.

  if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'
  MOUSE_DRAG = true;
  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge

  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /  (canvas.width/2);   // move origin to center of canvas and
                                                        // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /  (canvas.height/2);  //                     -1 <= y < +1.
               
  // find how far dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x;                         // Make next drag-measurement from here.
  yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /  (canvas.width/2);  // move origin to center of canvas and
                                                       // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /   (canvas.height/2); //                    -1 <= y < +1.
               
  
  if (MOUSE_DRAG == false) {
        if (PLANE_MOVING) {
            ANGLE_STEP = 0.0;
            SIZE_STEP = 0.0;
            PLANE_MOVING = false;
            document.getElementById("sentence").innerHTML = "The plane stops!!";
        }
        else {
            ANGLE_STEP = FORMER_ANGLE_STEP;
            SIZE_STEP = FORMER_SIZE_STEP;
            PLANE_MOVING = true;
            document.getElementById("sentence").innerHTML = "The plane starts to spin at original speed. <br />The plane is spinning at 30 degrees / second. <br />The Hopter is spinning at 600 degrees / second. ";
        }
    }

  isDrag = false;  // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  MOUSE_DRAG = false;
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
  document.getElementById("word").innerHTML ="x = " + x + ", y = " + y;

};


function myKeyDown(ev) {

  switch(ev.keyCode) {      
    case 85:    //U
      speedUp();
      break;
    case 68:    //D
      slowDown();
      break;
    case 83:    //S
      spinStop();
      break;
    case 82: //R
      changeDirection(); 
      break;

    case 70://F
      translatePlaneX -= translatePlane;
      break;
    case 84: //T
        translatePlaneY += translatePlane;
        break;
    case 72://right
        translatePlaneX += translatePlane;
        break;
    case 71://G
        translatePlaneY -= translatePlane;
        break;
  }
}

