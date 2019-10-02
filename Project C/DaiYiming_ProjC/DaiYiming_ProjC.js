// Vertex shader program
var VSHADER_SOURCE =

    'precision highp float;\n' +
    'precision highp int;\n' +
    'struct LampT {\n' + // Describes one point-like Phong light source
    '       vec3 pos;\n' + // (x,y,z,w); w==1.0 for local light at x,y,z position
    '       vec3 ambi;\n' + // Ia ==  ambient light source strength (r,g,b)
    '       vec3 diff;\n' + // Id ==  diffuse light source strength (r,g,b)
    '       vec3 spec;\n' + // Is == specular light source strength (r,g,b)
    '}; \n' +
    'struct MatlT {\n' + // Describes one Phong material by its reflectances:
    '       vec3 emit;\n' + // Ke: emissive -- surface 'glow' amount (r,g,b);
    '       vec3 ambi;\n' + // Ka: ambient reflectance (r,g,b)
    '       vec3 diff;\n' + // Kd: diffuse reflectance (r,g,b)
    '       vec3 spec;\n' + // Ks: specular reflectance (r,g,b)
    '       int shiny;\n' + // Kshiny: specular exponent (integer >= 1; typ. <200)
    '};\n' +

    'uniform LampT u_LampSet;\n' + // Array of all light sources.
    'uniform LampT u_headLight;\n' + // Array of all light sources.
    'uniform MatlT u_MatlSet;\n' + // Array of all materials.

    'uniform vec3 u_eyePosWorld; \n' + // Camera/eye location in world coords.
    'uniform int mode_light;\n' +
    'uniform int mode_shade;\n' +

    'varying vec3 v_Kd;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec3 v_Position;\n' +
    'varying vec4 v_Color;\n' +

    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Normal;\n' + 

    'uniform mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' + 



    'void main() {\n' +
    //Phong shading
    'if(mode_shade == 0){\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +

    '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
    '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '  v_Kd = u_MatlSet.diff; \n' + // find per-pixel diffuse reflectance from per-vertex
    '}\n' +

    //Gouraud shading
    'if(mode_shade == 1){\n' +
    '    gl_Position = u_MvpMatrix * a_Position;\n' +
    '    v_Position = vec3(u_ModelMatrix * a_Position);\n' +
    '    v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
    '    v_Kd = u_MatlSet.diff; \n' + 
    
    '    vec3 normal = normalize(v_Normal);\n' +
    '    vec3 lightDirection = normalize(u_LampSet.pos - v_Position);\n' +
    '    vec3 lightDirection_2 = normalize(u_headLight.pos - v_Position);\n' +

    '    vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
    '    float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    '    float nDotL2 = max(dot(lightDirection_2, normal), 0.0);\n' +
    '    float nDotH = 0.0; \n' +
    '    float nDotH2 = 0.0; \n' +

    // Bilnn-Phong lighting
    '    if(mode_light == 0){\n' +
    '      vec3 H = normalize(lightDirection + eyeDirection); \n' +
    '      nDotH = max(dot(H, normal), 0.0); \n' +
    '      vec3 H2 = normalize(lightDirection_2 + eyeDirection); \n' +
    '      nDotH2 = max(dot(H2, normal), 0.0); \n' +
    '    }\n' +

    // Phong lighting
    '    if(mode_light == 1){\n' +
    '      vec3 L = normalize(lightDirection); \n' +
    '      vec3 C = dot(normal, L)*normal; \n' +
    '      vec3 R = C + C - L; \n' +
    '      nDotH = max(dot(eyeDirection, R), 0.0); \n' +
    '      vec3 L2 = normalize(lightDirection_2); \n' +
    '      vec3 C2 = dot(normal, L2)*normal; \n' +
    '      vec3 R2 = C2 + C2 - L2; \n' +
    '      nDotH2 = max(dot(eyeDirection, R2), 0.0); \n' +
    '    }\n' +

    '      float e64 = pow(nDotH, float(u_MatlSet.shiny));\n' +
    '      float e64_2 = pow(nDotH2, float(u_MatlSet.shiny));\n' +
    '      vec3 emissive = 	u_MatlSet.emit;\n' +
    '      vec3 ambient = u_LampSet.ambi * u_MatlSet.ambi + u_headLight.ambi * u_MatlSet.ambi ;\n' +
    '      vec3 diffuse = u_LampSet.diff * v_Kd * nDotL + u_headLight.diff * v_Kd * nDotL2;\n' +
    '      vec3 speculr = u_LampSet.spec * u_MatlSet.spec * e64 + u_headLight.spec * u_MatlSet.spec * e64_2;\n' +
    '      v_Color = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
    '}\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =

    'precision highp float;\n' +
    'precision highp int;\n' +
    'struct LampT {\n' + // Describes one point-like Phong light source
    '		vec3 pos;\n' + // (x,y,z,w); w==1.0 for local light at x,y,z position
    //		   w==0.0 for distant light from x,y,z direction
    ' 	vec3 ambi;\n' + // Ia ==  ambient light source strength (r,g,b)
    ' 	vec3 diff;\n' + // Id ==  diffuse light source strength (r,g,b)
    '		vec3 spec;\n' + // Is == specular light source strength (r,g,b)
    '}; \n' +

    'struct MatlT {\n' + // Describes one Phong material by its reflectances:
    '		vec3 emit;\n' + // Ke: emissive -- surface 'glow' amount (r,g,b);
    '		vec3 ambi;\n' + // Ka: ambient reflectance (r,g,b)
    '		vec3 diff;\n' + // Kd: diffuse reflectance (r,g,b)
    '		vec3 spec;\n' + // Ks: specular reflectance (r,g,b)
    '		int shiny;\n' + // Kshiny: specular exponent (integer >= 1; typ. <200)
    '		};\n' +

    'uniform LampT u_LampSet;\n' + // Array of all light sources.
    'uniform LampT u_headLight;\n' + // Array of all light sources.
    'uniform MatlT u_MatlSet;\n' + // Array of all materials.

    'uniform vec3 u_eyePosWorld; \n' + // Camera/eye location in world coords.
    'uniform int mode_light;\n' +
    'uniform int mode_shade;\n' +

    'varying vec3 v_Kd;\n' +
    'varying vec3 v_Normal;\n' +
    'varying vec3 v_Position;\n' +
    'varying vec4 v_Color;\n' +

    'void main() {\n' +


    //Gouraud shading
    ' if(mode_shade == 1){\n' +
    '  gl_FragColor = v_Color;\n' +
    '};\n' +

    // Phong shadinging
    ' if(mode_shade == 0){\n' +
    '  vec3 normal = normalize(v_Normal);\n' +
    '  vec3 lightDirection = normalize(u_LampSet.pos - v_Position);\n' +
    '  vec3 lightDirection_2 = normalize(u_headLight.pos - v_Position);\n' +
    '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz);\n' +
    '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
    '  float nDotL2 = max(dot(lightDirection_2, normal), 0.0);\n' +
    '  float nDotH = 0.0; \n' +
    '  float nDotH2 = 0.0; \n' +

    // Bilnn-Phong lighting
    'if(mode_light == 0){\n' +
    '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
    '  nDotH = max(dot(H, normal), 0.0); \n' +
    '  vec3 H2 = normalize(lightDirection_2 + eyeDirection); \n' +
    '  nDotH2 = max(dot(H2, normal), 0.0); \n' +
    '}\n' +

    // Phong lighting
    'if(mode_light == 1){\n' +
    '  vec3 L = normalize(lightDirection); \n' +
    '  vec3 C = dot(normal, L)*normal; \n' +
    '  vec3 R = C + C - L; \n' +
    '  nDotH = max(dot(eyeDirection, R), 0.0); \n' +
    '  vec3 L2 = normalize(lightDirection_2); \n' +
    '  vec3 C2 = dot(normal, L2)*normal; \n' +
    '  vec3 R2 = C2 + C2 - L2; \n' +
    '  nDotH2 = max(dot(eyeDirection, R2), 0.0); \n' +
    '}\n' +

    '  float e64 = pow(nDotH, float(u_MatlSet.shiny));\n' +
    '  float e64_2 = pow(nDotH2, float(u_MatlSet.shiny));\n' +
    '  vec3 emissive = 	u_MatlSet.emit;\n' +
    '  vec3 ambient = u_LampSet.ambi * u_MatlSet.ambi + u_headLight.ambi * u_MatlSet.ambi ;\n' +
    '  vec3 diffuse = u_LampSet.diff * v_Kd * nDotL + u_headLight.diff * v_Kd * nDotL2;\n' +
    '  vec3 speculr = u_LampSet.spec * u_MatlSet.spec * e64 + u_headLight.spec * u_MatlSet.spec * e64_2;\n' +
    '  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
    '}\n' +
    '}\n';

var ANGLE_STEP = 45.0;

var floatsPerVertex = 7; 

var STEP1 = 0.15;
var STEP2 = 0.02;
var JUDGE = -1;

var eyeX = 23.00, eyeY = 0.0, eyeZ = 0.00;

var lookAtX = 0.0, lookAtY = 0.0, lookAtZ = 0.0;

var lambAtX = 10.0, lambAtY = 10.0, lambAtZ = 20.0;

var Lamp_Ambient_R = 1.0, Lamp_Ambient_G = 1.0, Lamp_Ambient_B = 1.0;

var Lamp_Diffuse_R = 1.0, Lamp_Diffuse_G = 1.0, Lamp_Diffuse_B = 1.0;

var Lamp_Specular_R = 1.0, Lamp_Specular_G = 1.0, Lamp_Specular_B = 1.0;

var eyePosWorld = new Float32Array(3);

var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var mvpMatrix = new Matrix4();
var normalMatrix = new Matrix4();

var mode_light = 0;
var mode_light_loc;
var lampIsOn = true;
var headLightIsOn = true;

var mode_shade = 0;
var mode_shade_loc;


//	... for our first light source:   (stays false if never initialized)
var lamp = new LightsT();
var headLight = new LightsT();

// ... for our first material:
var mSphere = 19;

function main() {
    //==============================================================================
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.8;
    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    var n_vcount = initVertexBuffers(gl); // vertex count

    if (n_vcount < 0) {
        console.log('Failed to specify the vertex infromation');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0.2, 0.2, 0.2, 1.0);  
    gl.enable(gl.DEPTH_TEST);

    mode_light_loc = gl.getUniformLocation(gl.program, 'mode_light');
    gl.uniform1i(mode_light_loc, mode_light);
    mode_shade_loc = gl.getUniformLocation(gl.program, 'mode_shade');
    gl.uniform1i(mode_shade_loc, mode_shade);


    u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');

    if (!u_MvpMatrix || !u_ModelMatrix || !u_NormalMatrix || !u_eyePosWorld) {
        console.log('Failed to get the location of uniform variables');
        return;
    } 

    
    document.onkeydown = function(ev) {keydown(ev, gl, canvas);};
    canvas.onmouseup =    function(ev){myMouseUp(ev, gl, canvas)};

    var currentAngle = 0.0;
    var tick = function() {
        currentAngle = animate(currentAngle); // Update the rotation angle
        draw(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas); // Draw the triangles
        requestAnimationFrame(tick, canvas);
        // Request that the browser re-draw the webpage
    };
    tick();

}





function initVertexBuffers(gl) {
    //==============================================================================
    makeSphere();
    makeGroundGrid();
    makeTop();
    makeBottom();
    makeStar();
    makeFish();
    makeTree();
    makeCube();

    var mySize = sphVerts.length + gndVerts.length + topVerts.length + bottomVerts.length + starVerts.length + fishVerts.length + treeVerts.length + cubeVerts.length;

    var nn = mySize / floatsPerVertex;
    var colorShapes = new Float32Array(mySize);
    i = 0
    sphStart = i;
    for (j = 0; j < sphVerts.length; i++, j++) {
        colorShapes[i] = sphVerts[j];
    }

    gndStart = i;
    for (j = 0; j < gndVerts.length; i++, j++) {
        colorShapes[i] = gndVerts[j];
    }

    topStart=i;
    for(j=0;j < topVerts.length;i++,j++){
        colorShapes[i]=topVerts[j];
    }

    bottomStart=i;
    for(j=0;j < bottomVerts.length;i++,j++){
        colorShapes[i]=bottomVerts[j];
    }
    fishStart=i;
    for(j=0;j<fishVerts.length;i++,j++){
        colorShapes[i]=fishVerts[j];
    }
    starStart=i;
    for(j=0;j<starVerts.length;i++,j++){
        colorShapes[i]=starVerts[j];
    }
    treeStart=i;
      for(j=0;j<treeVerts.length;i++,j++){
        colorShapes[i]=treeVerts[j];
    }
    cubeStart=i;
      for(j=0;j<cubeVerts.length;i++,j++){
        colorShapes[i]=cubeVerts[j];
    }

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the shape buffer object');
        return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get GPU storage location1 of u_ModelMatrix uniform');
        return;
    }

    var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

    //Get graphics system's handle for our Vertex gl.program's position-input variable:
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    // Use handle to specify how to retrieve position data from our VBO:
    gl.vertexAttribPointer(
          a_Position,   // choose Vertex gl.program attribute to fill with data
          4,            // how many values? 1,2,3 or 4.  (we're using x,y,z,w)
          gl.FLOAT,     // data type for each value: usually gl.FLOAT
          false,        // did we supply fixed-point data AND it needs normalizing?
          FSIZE * floatsPerVertex,    // Stride -- how many bytes used to store each vertex?
                        // (x,y,z,w, r,g,b) * bytes/value
          0);           // Offset -- now many bytes from START of buffer to the
                        // value we will actually use?
    gl.enableVertexAttribArray(a_Position);  
                        // Enable assignment of vertex buffer object's position data

    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return -1;
    }
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, 4 * FSIZE);
    gl.enableVertexAttribArray(a_Normal);

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return nn;
}


function draw(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas) {
    //==============================================================================

    // Clear <canvas> color AND DEPTH buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    viewMatrix.setLookAt(eyeX, eyeY, eyeZ, // eye position
        lookAtX, lookAtY, lookAtZ, // look-at point
        0, 1, 0); // up vector
    projMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    drawGround(gl, u_MvpMatrix, u_ModelMatrix, currentAngle);
    drawSphere(gl, u_MvpMatrix, u_ModelMatrix, currentAngle);
    drawTops(gl, u_MvpMatrix, u_ModelMatrix, currentAngle);
    drawFish(gl, u_MvpMatrix, u_ModelMatrix, currentAngle);
    drawFish2(gl, u_MvpMatrix, u_ModelMatrix, currentAngle);
    drawTree(gl, u_MvpMatrix, u_ModelMatrix, currentAngle);
    drawCube(gl, u_MvpMatrix, u_ModelMatrix, currentAngle);
}

function lightHelper(gl,lamp, matl) {

    gl.uniform1i(mode_light_loc, mode_light);
    gl.uniform1i(mode_shade_loc, mode_shade);
    // Get the storage locations of u_ViewMatrix and u_ProjMatrix variables
    

    lamp.u_pos = gl.getUniformLocation(gl.program, 'u_LampSet.pos');
    lamp.u_ambi = gl.getUniformLocation(gl.program, 'u_LampSet.ambi');
    lamp.u_diff = gl.getUniformLocation(gl.program, 'u_LampSet.diff');
    lamp.u_spec = gl.getUniformLocation(gl.program, 'u_LampSet.spec');

    headLight.u_pos = gl.getUniformLocation(gl.program, 'u_headLight.pos');
    headLight.u_ambi = gl.getUniformLocation(gl.program, 'u_headLight.ambi');
    headLight.u_diff = gl.getUniformLocation(gl.program, 'u_headLight.diff');
    headLight.u_spec = gl.getUniformLocation(gl.program, 'u_headLight.spec');
    
    if (!lamp.u_pos || !lamp.u_ambi || !lamp.u_diff || !lamp.u_spec ||
        !headLight.u_pos || !headLight.u_ambi || !headLight.u_diff || !headLight.u_spec) {
        console.log('Failed to get GPUs lamp or headLight storage locations');
        return;
    }

        // Position the camera in world coordinates:
    eyePosWorld.set([eyeX, eyeY, eyeZ]);
    gl.uniform3fv(u_eyePosWorld, eyePosWorld); // use it to set our uniform
    // (Note: uniform4fv() expects 4-element float32Array as its 2nd argument)

    // Init World-coord. position & colors of first light source in global vars;

    lamp.I_pos.elements.set([lambAtX, lambAtY, lambAtZ]);
    if (lampIsOn) {
        lamp.I_ambi.elements.set([Lamp_Ambient_R, Lamp_Ambient_G, Lamp_Ambient_B]);
        lamp.I_diff.elements.set([Lamp_Diffuse_R, Lamp_Diffuse_G, Lamp_Diffuse_B]);
        lamp.I_spec.elements.set([Lamp_Specular_R, Lamp_Specular_G, Lamp_Specular_B]);
    } else {
        lamp.I_ambi.elements.set([0.0, 0.0, 0.0]);
        lamp.I_diff.elements.set([0.0, 0.0, 0.0]);
        lamp.I_spec.elements.set([0.0, 0.0, 0.0]);
    }
    
    gl.uniform3fv(lamp.u_pos, lamp.I_pos.elements.slice(0, 3));
    gl.uniform3fv(lamp.u_ambi, lamp.I_ambi.elements); // ambient
    gl.uniform3fv(lamp.u_diff, lamp.I_diff.elements); // diffuse
    gl.uniform3fv(lamp.u_spec, lamp.I_spec.elements); // Specular


    // lamp.I_pos.elements.set([lambAtX, lambAtY, lambAtZ]);
    headLight.I_pos.elements.set([eyeX, eyeY, eyeZ]);
    if (headLightIsOn) {
        headLight.I_ambi.elements.set([1.0, 1.0, 1.0]);
        headLight.I_diff.elements.set([1.0, 1.0, 1.0]);
        headLight.I_spec.elements.set([1.0, 1.0, 1.0]);
    } else {
        headLight.I_ambi.elements.set([0.0, 0.0, 0.0]);
        headLight.I_diff.elements.set([0.0, 0.0, 0.0]);
        headLight.I_spec.elements.set([0.0, 0.0, 0.0]);
    }


    gl.uniform3fv(headLight.u_pos, headLight.I_pos.elements.slice(0, 3));
    gl.uniform3fv(headLight.u_ambi, headLight.I_ambi.elements); // ambient
    gl.uniform3fv(headLight.u_diff, headLight.I_diff.elements); // diffuse
    gl.uniform3fv(headLight.u_spec, headLight.I_spec.elements); // Specular

    // ... for Phong material/reflectance:
    matl.uLoc_Ke = gl.getUniformLocation(gl.program, 'u_MatlSet.emit');
    matl.uLoc_Ka = gl.getUniformLocation(gl.program, 'u_MatlSet.ambi');
    matl.uLoc_Kd = gl.getUniformLocation(gl.program, 'u_MatlSet.diff');
    matl.uLoc_Ks = gl.getUniformLocation(gl.program, 'u_MatlSet.spec');
    matl.uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_MatlSet.shiny');
    if (!matl.uLoc_Ke || !matl.uLoc_Ka || !matl.uLoc_Kd ||
        !matl.uLoc_Ks || !matl.uLoc_Kshiny
    ) {
        console.log('Failed to get GPUs Reflectance storage locations');
        return;
    }

    //---------------For the Material object(s):
    gl.uniform3fv(matl.uLoc_Ke, matl.K_emit.slice(0, 3)); // Ke emissive
    gl.uniform3fv(matl.uLoc_Ka, matl.K_ambi.slice(0, 3)); // Ka ambient
    gl.uniform3fv(matl.uLoc_Kd, matl.K_diff.slice(0, 3)); // Kd	diffuse
    gl.uniform3fv(matl.uLoc_Ks, matl.K_spec.slice(0, 3)); // Ks specular
    gl.uniform1i(matl.uLoc_Kshiny, parseInt(matl.K_shiny, 10)); // Kshiny

}

function drawGround(gl,u_MvpMatrix, u_ModelMatrix, currentAngle) {
    var matl = new Material(5);
    lightHelper(gl,lamp,matl);

    viewMatrix.rotate(-90.0, 1, 0, 0);

    modelMatrix.setTranslate(0.0, 0.0, 0.0);
    viewMatrix.translate(0.0, -1.0, -1); 
    viewMatrix.scale(0.7, 0.7,0.7);

    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.LINES, gndStart / floatsPerVertex, gndVerts.length / floatsPerVertex); 
    

    
}

function drawSphere(gl, u_MvpMatrix, u_ModelMatrix, currentAngle){
    var matl = new Material(mSphere);
    lightHelper(gl, lamp,matl);
    modelMatrix.setScale(1.5, 1.5, 1.5);
    modelMatrix.translate(-1.0, 1.0, 1.0);
    modelMatrix.rotate(currentAngle, 0, 0, 1)
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphStart / floatsPerVertex, sphVerts.length / floatsPerVertex)

}

function drawTops(gl, u_MvpMatrix, u_ModelMatrix, currentAngle){
    var matl = new Material(18);
    lightHelper(gl,lamp, matl);

    modelMatrix.setTranslate(4,-6,1);
    modelMatrix.rotate(90, 1, 0, 0);     
    modelMatrix.translate(0, -currentAngle*0.02, 0);
    pushMatrix(modelMatrix);

    modelMatrix.rotate(currentAngle*0.5, 0, 1, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
    gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);
    
    
    modelMatrix.translate(0, 2, 0);
    modelMatrix.scale(0.7, 0.7, 0.7);
    modelMatrix.rotate(-currentAngle, 0, 1, 0);

    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
    gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);
    
    
    modelMatrix.translate(0, -6.7, 0);
    modelMatrix.scale(1.7, 1.7, 1.7);
    modelMatrix.rotate(-currentAngle, 0, 1, 0);

    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
    gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);
    
    var matl = new Material(7);
    lightHelper(gl, lamp,matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(-2,3.2,0.5);
    modelMatrix.scale(0.7,0.7,0.7);
    modelMatrix.rotate(currentAngle*3, 0, 1, 0);
    
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);


}

function drawFish(gl, u_MvpMatrix, u_ModelMatrix, currentAngle){
    var matl = new Material(7);
    lightHelper(gl,lamp, matl);

    modelMatrix.setTranslate(2,-3,0);
    modelMatrix.rotate(90, 1, 1, 0);     
    modelMatrix.translate(0, -currentAngle*0.02, 0);
    pushMatrix(modelMatrix);
    // modelMatrix.rotate(currentAngle*3, 0, 1, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);
    var matl = new Material(1);
    lightHelper(gl,lamp, matl);
    modelMatrix.translate(1.5,2,1);
    modelMatrix.scale(0.5,0.5,0.5);
    modelMatrix.rotate(currentAngle*3, 1, 1, 1);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);

    var matl = new Material(1);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(1.5,-2,-1);
    modelMatrix.scale(0.5,0.5,0.5);
    modelMatrix.rotate(currentAngle*3, 1, 0, 1);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);

    var matl = new Material(1);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(0,2,3);
    modelMatrix.scale(0.3,0.3,0.3);
    modelMatrix.rotate(currentAngle*3, 1, 0, 1);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);

    var matl = new Material(7);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(1,2,3);
    modelMatrix.scale(0.5,0.5,0.5);
    modelMatrix.translate(0, -currentAngle*0.01, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

    var matl = new Material(7);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(-1,2,3);
    modelMatrix.scale(0.5,0.5,0.5);
    modelMatrix.translate(0, -currentAngle*0.02, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

}
function drawFish2(gl, u_MvpMatrix, u_ModelMatrix, currentAngle){
    var matl = new Material(7);
    lightHelper(gl,lamp, matl);

    modelMatrix.setTranslate(5,10,1);
    modelMatrix.rotate(90, 1, 1, 0);     
    modelMatrix.translate(-currentAngle*0.02, -currentAngle*0.02, 0);
    pushMatrix(modelMatrix);
    modelMatrix.rotate(currentAngle, 1, 1, 0);

    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

    var matl = new Material(7);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(1.19, 1.19, 0);
    modelMatrix.scale(0.7,0.7,0.7);
    modelMatrix.rotate(-currentAngle, 1, 1, 0);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

    var matl = new Material(7);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(-1.3,-1.3,0);
    modelMatrix.rotate(180, 1, 0, 0);
    modelMatrix.rotate(45, 0, 0, 1);
    // modelMatrix.rotate(currentAngle, 0, 1, 1);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
    gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);
    
    var matl = new Material(7);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(-2.5, -2.5, 0);
    // modelMatrix.scale(0.2, 0.2, 0.2);
    modelMatrix.rotate(currentAngle, 1, 1, 0)
    
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);

}

function drawTree(gl, u_MvpMatrix, u_ModelMatrix, currentAngle){
    var matl = new Material(2);
    lightHelper(gl,lamp, matl);
    modelMatrix.setRotate(90, 1, 0, 0);
    modelMatrix.translate(0, 0, -10);
    modelMatrix.scale(1, 1.5, 1);
    modelMatrix.scale(1.5,1.5,1.5);
    // modelMatrix.rotate(currentAngle, 0, 1, 0);
    pushMatrix(modelMatrix);


    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);


    gl.drawArrays(gl.TRIANGLES, treeStart/floatsPerVertex, treeVerts.length/floatsPerVertex);
    
//top star
    var matl = new Material(1);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(0, 4.2, 0);
    modelMatrix.scale(0.3, 0.3, 0.3);
    modelMatrix.rotate(currentAngle*10, 1, 1, 1)

    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);

//1
    var matl = new Material(1);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(0, 1, 1);
    modelMatrix.scale(0.2, 0.2, 0.2);
    modelMatrix.rotate(currentAngle*10, 0, 1, 0)
    
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);

//2
    var matl = new Material(1);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(1, 1, 0);
    modelMatrix.scale(0.2, 0.2, 0.2);
    modelMatrix.rotate(currentAngle*10, 0, 1, 0)
    
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
//3
    var matl = new Material(1);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(0, 1, -1);
    modelMatrix.scale(0.2, 0.2, 0.2);
    modelMatrix.rotate(currentAngle*10, 0, 1, 0)
    
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
//4
    var matl = new Material(1);
    lightHelper(gl,lamp, matl);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);

    modelMatrix.translate(-1, 1, 0);
    modelMatrix.scale(0.2, 0.2, 0.2);
    modelMatrix.rotate(currentAngle*10, 0, 1, 0)
    
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);


}
function drawCube(gl, u_MvpMatrix, u_ModelMatrix, currentAngle){
    var matl = new Material(3);
    lightHelper(gl,lamp, matl);

    modelMatrix.setTranslate(5,5,1);
    // modelMatrix.scale(0.5,0.5,0.5);
    // modelMatrix.rotate(90, 0, 0, 1);    
    // modelMatrix.translate(-currentAngle*0.02, -currentAngle*0.02, 0);
    pushMatrix(modelMatrix);
    // modelMatrix.rotate(currentAngle, 0, 0, 1);

    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphStart / floatsPerVertex, sphVerts.length / floatsPerVertex)

    // gl.drawArrays(gl.TRIANGLES, sphStart/floatsPerVertex, sphVerts.length/floatsPerVertex);
    
    var matl = new Material(1);
    lightHelper(gl,lamp, matl);
    modelMatrix.translate(0, 0, 1.85);
    // modelMatrix.scale(0.2, 0.2, 0.2);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.rotate(currentAngle, 0, 1, 0)
    
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    
    gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);


    var matl = new Material(3);
    lightHelper(gl,lamp, matl);

    modelMatrix.setTranslate(5,5,4.8);
    // modelMatrix.scale(0.5,0.5,0.5);
    modelMatrix.rotate(90, 0, 0, 1);    
    // modelMatrix.translate(-currentAngle*0.02, -currentAngle*0.02, 0);
    // modelMatrix.rotate(currentAngle, 0, 0, 1);

    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphStart / floatsPerVertex, sphVerts.length / floatsPerVertex)

    var matl = new Material(7);
    lightHelper(gl,lamp, matl);

    modelMatrix.setTranslate(5,5,6.3);
    modelMatrix.scale(0.5,0.5,0.5);
    modelMatrix.rotate(90, 0, 0, 1);    
    // modelMatrix.translate(-currentAngle*0.02, -currentAngle*0.02, 0);
    pushMatrix(modelMatrix);
    // modelMatrix.rotate(currentAngle, 0, 0, 1);

    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);     
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphStart / floatsPerVertex, sphVerts.length / floatsPerVertex)

}

function keydown(ev, gl, canvas) {
    var dx = lookAtX - eyeX, dy = lookAtY - eyeY, dz = lookAtZ - eyeZ;
    var temp = Math.sqrt(dx*dx + dy*dy + dz*dz);
    var lzx = Math.sqrt(dx*dx+dz*dz);
    var sin_phi = lzx / temp;
     
    var theta0 = Math.PI -  Math.asin(dx/lzx);
    var cos_theta = dz / Math.sqrt(dx*dx + dz*dz);
    var sin_theta = dx / Math.sqrt(dx*dx + dz*dz);

    var phi0 = Math.asin(dy/temp);

    switch(ev.keyCode){
        case 39: { // right arrow - step right
            u = new Vector3();
            u = new Float32Array([0, 1, 0]);
            
            l = new Vector3();
            
            l[0] = dx/temp;l[1] = dy/temp;l[2] = dz/temp;

            t = new Vector3();
            t[0] = u[1]*l[2] - u[2]*l[1];
            t[1] = u[2]*l[0] - u[0]*l[2];
            t[2] = u[0]*l[1] - u[1]*l[0];

            temp2 = Math.sqrt(t[0]*t[0] + t[1]*t[1] + t[2]*t[2]);

            t[0] /= temp2;t[1] /= temp2;t[2] /= temp2;

            eyeX -= STEP1 * t[0];
            eyeY -= STEP1 * t[1];
            eyeZ -= STEP1 * t[2];

            lookAtX -= STEP1 * t[0];
            lookAtY -= STEP1 * t[1];
            lookAtZ -= STEP1 * t[2];

            break;
        }
        case 37: { // left arrow - step left
            u = new Vector3();
            u = new Float32Array([0, 1, 0]);
            
            l = new Vector3();
            l[0] = dx/temp;l[1] = dy/temp;l[2] = dz/temp;

            t = new Vector3();
            t[0] = u[1]*l[2] - u[2]*l[1];
            t[1] = u[2]*l[0] - u[0]*l[2];
            t[2] = u[0]*l[1] - u[1]*l[0];

            temp2 = Math.sqrt(t[0]*t[0] + t[1]*t[1] + t[2]*t[2]);

            t[0] /= temp2;t[1] /= temp2;t[2] /= temp2;

            eyeX += STEP1 * t[0];
            eyeY += STEP1 * t[1];
            eyeZ += STEP1 * t[2];

            lookAtX += STEP1 * t[0];
            lookAtY += STEP1 * t[1];
            lookAtZ += STEP1 * t[2];

            break;
      
        } 
        case 38: 
           { // up arrow - step forward
            t = new Vector3();
            t[0] = dx/temp;t[1] = dy/temp;t[2] = dz/temp;

            eyeX += STEP1 * t[0];
            eyeY += STEP1 * t[1];
            eyeZ += STEP1 * t[2];

            lookAtX += STEP1 * t[0];
            lookAtY += STEP1 * t[1];
            lookAtZ += STEP1 * t[2];

            break;

        } 
        case 40: { // down arrow - step backward
            t = new Vector3();
            t[0] = dx/temp;t[1] = dy/temp;t[2] = dz/temp;
            
            eyeX -= STEP1 * t[0];
            eyeY -= STEP1 * t[1];
            eyeZ -= STEP1 * t[2];

            lookAtX -= STEP1 * t[0];
            lookAtY -= STEP1 * t[1];
            lookAtZ -= STEP1 * t[2];

            break;
        } 
        case 65:{ // a - look left
          if(JUDGE==-1 || JUDGE==0)
            {
              THETA_NOW = theta0 + STEP2;          
              JUDGE = 1;
            }
            else
            {
              THETA_NOW += STEP2;
            }

            lookAtY = dy + eyeY;
            lookAtX = temp * sin_phi * Math.sin(THETA_NOW) + eyeX;
            lookAtZ = temp * sin_phi * Math.cos(THETA_NOW) + eyeZ;
            
            break;
        }
        case 68: {//d - look right
            if (JUDGE == -1 || JUDGE == 0)
            {
              THETA_NOW = theta0 - STEP2;
              JUDGE = 1;
            }
            else
            {
              THETA_NOW -= STEP2;
            }

            lookAtY = dy + eyeY;
            lookAtX = temp * sin_phi * Math.sin(THETA_NOW) + eyeX;
            lookAtZ = temp * sin_phi * Math.cos(THETA_NOW) + eyeZ;

            break;
          }
      
        case 87:{ //w - look up
            if (JUDGE==-1 || JUDGE==1)
            {  
              PHI_NOW = phi0 + STEP2;
              JUDGE = 0;
            }
            else
            {
              PHI_NOW += STEP2;
            }

            lookAtY = temp * Math.sin(PHI_NOW) + eyeY;
            lookAtX = temp * Math.cos(PHI_NOW) * sin_theta + eyeX;
            lookAtZ = temp * Math.cos(PHI_NOW) * cos_theta + eyeZ;

            break;
          }
        case 83:{ //s-look down
            if(JUDGE == -1 || JUDGE == 1)
            { 
              PHI_NOW = phi0 - STEP2;  
              JUDGE = 0;
            }
            else
            {
              PHI_NOW -= STEP2;
            }
            lookAtY = temp * Math.sin(PHI_NOW) + eyeY;
            lookAtX = temp * Math.cos(PHI_NOW) * sin_theta + eyeX;
            lookAtZ = temp * Math.cos(PHI_NOW) * cos_theta + eyeZ;

            break;
          }
        case 52:{//4
        lambAtX += 1.5;
        break;
        }

        case 51:{//3
        lambAtX -= 1.5;
        break;
        }

        case 50:{//2
        lambAtY += 1.5;
        break;
        }

        case 49:{//1
        lambAtY -= 1.5;
        break;
        }

        case 76:{ //l--lamp
        lampIsOn = lampIsOn ? false : true;
        break;
        }

        case 72:{ // h--headlight
        headLightIsOn = headLightIsOn ? false : true;
        break;
        }

        case 82:{   //R ->reset
        eyeX = 20; eyeY = 0.2; eyeZ = 2; 
        lookAtX = 0.0; lookAtY = 0.0; lookAtZ = 0.0;

        break;
        }
      	case 77:{
      		mSphere = (mSphere + 1) % 20;
      	}
        default: 
        {
        return;
        break;
    	}

    }   
}

function myMouseUp(ev, gl, canvas) {

    if (ANGLE_STEP*ANGLE_STEP > 1) {
        myTmp = ANGLE_STEP;
        ANGLE_STEP = 0;
    }
    else {
        ANGLE_STEP = myTmp;
            
    }
    

  };


function changeLightingShading(){
	if (parseInt(document.getElementById('lightSelection').value) == 0){
		mode_light = 0;
		mode_shade = 0;
        document.getElementById('lightMode').innerHTML = "Blinn-Phong lighting";
        document.getElementById('shadeMode').innerHTML = "Phong shading";

	}
	if (parseInt(document.getElementById('lightSelection').value) == 1){
		mode_light = 1;
		mode_shade = 0;
        document.getElementById('lightMode').innerHTML = "Phong lighting";
        document.getElementById('shadeMode').innerHTML = "Phong shading";

	}
	if (parseInt(document.getElementById('lightSelection').value) == 2){
		mode_light = 0;
		mode_shade = 1;
        document.getElementById('lightMode').innerHTML = "Blinn-Phong lighting";
        document.getElementById('shadeMode').innerHTML = "Gouraud shading";
        

	}
		if (parseInt(document.getElementById('lightSelection').value) == 3){
		mode_light = 1;
		mode_shade = 1;
        document.getElementById('lightMode').innerHTML = "Phong lighting";
        document.getElementById('shadeMode').innerHTML = "Gouraud shading";

	}
}

function changeRGB() {

    Lamp_Ambient_R = Number(document.getElementById("Lamp_Ambient_R").value);
    Lamp_Ambient_G = Number(document.getElementById("Lamp_Ambient_G").value);
    Lamp_Ambient_B = Number(document.getElementById("Lamp_Ambient_B").value);

    Lamp_Diffuse_R = Number(document.getElementById("Lamp_Diffuse_R").value);
    Lamp_Diffuse_G = Number(document.getElementById("Lamp_Diffuse_G").value);
    Lamp_Diffuse_B = Number(document.getElementById("Lamp_Diffuse_B").value);

    Lamp_Specular_R = Number(document.getElementById("Lamp_Specular_R").value);
    Lamp_Specular_G = Number(document.getElementById("Lamp_Specular_G").value);
    Lamp_Specular_B = Number(document.getElementById("Lamp_Specular_B").value);
}

function resetRGB(){
    Lamp_Ambient_R = 1;
    Lamp_Ambient_G = 1;
    Lamp_Ambient_B = 1;

    Lamp_Diffuse_R = 1;
    Lamp_Diffuse_G = 1;
    Lamp_Diffuse_B = 1;
    
    Lamp_Specular_R = 1;
    Lamp_Specular_G = 1;
    Lamp_Specular_B = 1;
}

var g_last = Date.now();

function animate(angle) {
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;

    if (angle > 0.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
    if (angle < -180.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;

    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.8;
}

function userInstructions(){
      document.getElementById("instructions").innerHTML = "1. You can change eyeposition by pressing ← for eyeposition moving to left, → for eyeposition moving to right, ↑ for eyeposition zooming in, and ↓ for eyeposition zooming out.<br />2. You can change looking perspective by pressing A to look left, D to look right, W to look up and S to look down. <br />3. You can turn on / off the headlight by pressing H. <br />4. You can turn on / off the other light by pressing L. <br /> 5. You can change light position by pressing 1 for left and 2 for right, 3 for far and 4 for near. <br /> 6. You can simply click on canvas to stop/run the movements. <br />7. Also there is a control panel, you can change up to 4 different Lighting / Shading modes. <br />8. There is an another control panel of user-adjustabl R, G, B values (from 0 to 1.0) for ambient, diffuse, and specular light. <br />9. You can press 'R' to reset the perspective to original state. <br />10. You can change the middle sphere's material by pressing M. "
    }

function makeGroundGrid() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

    var xcount = 100; // # of lines to draw in x,y to make the grid.
    var ycount = 100;
    var xymax = 50.0; // grid size; extends to cover +/-xymax in x and y.
    var xColr = new Float32Array([0.59, 0.97, 0.94]);  // bright yellow
    var yColr = new Float32Array([1, 1, 1]);  // bright green.

    gndVerts = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));

    var xgap = xymax / (xcount - 1); // HALF-spacing between lines in x,y;
    var ygap = xymax / (ycount - 1); // (why half? because v==(0line number/2))

    // First, step thru x values as we make vertical lines of constant-x:
      for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
        if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
          gndVerts[j  ] = -xymax + (v  )*xgap;  // x
          gndVerts[j+1] = -xymax;               // y
          gndVerts[j+2] = 0.0;                  // z
          gndVerts[j+3] = 1.0;
        }
        else {        // put odd-numbered vertices at (xnow, +xymax, 0).
          gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
          gndVerts[j+1] = xymax;                // y
          gndVerts[j+2] = 0.0;                  // z
          gndVerts[j+3] = 1.0;
        }
        gndVerts[j+4] = xColr[0];     // red
        gndVerts[j+5] = xColr[1];     // grn
        gndVerts[j+6] = xColr[2];     // blu
        
      }
      // Second, step thru y values as wqe make horizontal lines of constant-y:
      // (don't re-initialize j--we're adding more vertices to the array)
      for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
        if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
          gndVerts[j  ] = -xymax;               // x
          gndVerts[j+1] = -xymax + (v  )*ygap;  // y
          gndVerts[j+2] = 0.0;                  // z
          gndVerts[j+3] = 1.0;
        }
        else {          // put odd-numbered vertices at (+xymax, ynow, 0).
          gndVerts[j  ] = xymax;                // x
          gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
          gndVerts[j+2] = 0.0;                  // z
          gndVerts[j+3] = 1.0;
        }
        gndVerts[j+4] = yColr[0];     // red
        gndVerts[j+5] = yColr[1];     // grn
        gndVerts[j+6] = yColr[2];     // blu
        
        }
}


function makeSphere() {
    //==============================================================================
    // Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like
    // equal-lattitude 'slices' of the sphere (bounded by planes of constant z),
    // and connect them as a 'stepped spiral' design (see makeCylinder) to build the
    // sphere from one triangle strip.
    var slices = 19; // # of slices of the sphere along the z axis. >=3 req'd
    // (choose odd # or prime# to avoid accidental symmetry)
    var sliceVerts = 27; // # of vertices around the top edge of the slice
    // (same number of vertices on bottom of slice, too)
    var topColr = new Float32Array([0.7, 0.7, 0.7]); // North Pole: light gray
    var equColr = new Float32Array([0.3, 0.7, 0.3]); // Equator:    bright green
    var botColr = new Float32Array([0.9, 0.9, 0.9]); // South Pole: brightest gray.
    var sliceAngle = Math.PI / slices; // lattitude angle spanned by one slice.

    // Create a (global) array to hold this sphere's vertices:
    sphVerts = new Float32Array(((slices * 2 * sliceVerts) - 2) * floatsPerVertex);
    // # of vertices * # of elements needed to store them.
    // each slice requires 2*sliceVerts vertices except 1st and
    // last ones, which require only 2*sliceVerts-1.

    // Create dome-shaped top slice of sphere at z=+1
    // s counts slices; v counts vertices;
    // j counts array elements (vertices * elements per vertex)
    var cos0 = 0.0; // sines,cosines of slice's top, bottom edge.
    var sin0 = 0.0;
    var cos1 = 0.0;
    var sin1 = 0.0;
    var j = 0; // initialize our array index
    var isLast = 0;
    var isFirst = 1;
    for (s = 0; s < slices; s++) { // for each slice of the sphere,
        // find sines & cosines for top and bottom of this slice
        if (s == 0) {
            isFirst = 1; // skip 1st vertex of 1st slice.
            cos0 = 1.0; // initialize: start at north pole.
            sin0 = 0.0;
        } else { // otherwise, new top edge == old bottom edge
            isFirst = 0;
            cos0 = cos1;
            sin0 = sin1;
        } // & compute sine,cosine for new bottom edge.
        cos1 = Math.cos((s + 1) * sliceAngle);
        sin1 = Math.sin((s + 1) * sliceAngle);
        // go around the entire slice, generating TRIANGLE_STRIP verts
        // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
        if (s == slices - 1) isLast = 1; // skip last vertex of last slice.
        for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVertex) {
            if (v % 2 == 0) { // put even# vertices at the the slice's top edge
                // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
                // and thus we can simplify cos(2*PI(v/2*sliceVerts))
                sphVerts[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
                sphVerts[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
                sphVerts[j + 2] = cos0;
                sphVerts[j + 3] = 1.0;
                sphVerts[j + 4] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
                sphVerts[j + 5] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
                sphVerts[j + 6] = cos0;
            } else { // put odd# vertices around the slice's lower edge;
                // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
                sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts); // x
                sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts); // y
                sphVerts[j + 2] = cos1; // z
                sphVerts[j + 3] = 1.0; // w.
                sphVerts[j + 4] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts); // x
                sphVerts[j + 5] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts); // y
                sphVerts[j + 6] = cos1; // z
            }
            
        }
    }
}

function makeStar(){
      var t = 2*Math.PI/360;
      var r = Math.sin(18*t)/Math.sin(36*t);

      starVerts = new Float32Array([
        0, 0, 0.3, 1, 1, 1, 1, //0
        Math.cos(0), Math.sin(0), 0, 1, 1, 1, 0,  //1
        r*Math.cos(36*t), r*Math.sin(36*t), 0, 1, 1, 0, 0, //2

        0, 0, 0.3, 1, 1, 1, 1, //0
        r*Math.cos(36*t), r*Math.sin(36*t), 0, 1, 1, 0, 0, //2
        Math.cos(72*t), Math.sin(72*t), 0, 1, 1, 1, 0, //3

        0, 0, 0.3, 1, 1, 1, 1, //0
        Math.cos(72*t), Math.sin(72*t), 0, 1, 1, 1, 0, //3
        r*Math.cos((36+72)*t), r*Math.sin((36+72)*t), 0, 1, 1, 0, 0,//4

        0, 0, 0.3, 1, 1, 1, 1, //0    
        r*Math.cos((36+72)*t), r*Math.sin((36+72)*t), 0, 1, 1, 0, 0, //4
        Math.cos(72*2*t), Math.sin(72*2*t), 0, 1, 1, 1, 0, //5

        0, 0, 0.3, 1, 1, 1, 1,  //0
        Math.cos(72*2*t), Math.sin(72*2*t), 0, 1, 1, 1, 0, //5
        r*Math.cos((36+72*2)*t), r*Math.sin((36+72*2)*t), 0, 1, 1, 0, 0, //6

        0, 0, 0.3, 1, 1, 1, 1,  //0
        r*Math.cos((36+72*2)*t), r*Math.sin((36+72*2)*t), 0, 1, 1, 0, 0, //6
        Math.cos(72*3*t), Math.sin(72*3*t), 0, 1, 1, 1, 0, //7

        0, 0, 0.3, 1, 1, 1, 1, //0
        Math.cos(72*3*t), Math.sin(72*3*t), 0, 1, 1, 1, 0, //7
        r*Math.cos((36+72*3)*t), r*Math.sin((36+72*3)*t), 0, 1, 1, 0, 0, //8

        0, 0, 0.3, 1, 1, 1, 1, //0
        r*Math.cos((36+72*3)*t), r*Math.sin((36+72*3)*t), 0, 1, 1, 0, 0, //8
        Math.cos(72*4*t), Math.sin(72*4*t), 0, 1, 1, 1, 0, //9

        0, 0, 0.3, 1, 1, 1, 1, //0
        Math.cos(72*4*t), Math.sin(72*4*t), 0, 1, 1, 1, 0, //9
        r*Math.cos((36+72*4)*t), r*Math.sin((36+72*4)*t), 0, 1, 1, 0, 0, //10

        0, 0, 0.3, 1, 1, 1, 1, //0
        r*Math.cos((36+72*4)*t), r*Math.sin((36+72*4)*t), 0, 1, 1, 0, 0, //10
        Math.cos(0), Math.sin(0), 0, 1, 1, 1, 0, //1

   //     
        0, 0, -0.3, 1, 1, 1, 1, //0
        Math.cos(0), Math.sin(0), 0, 1, 1, 1, 0, //1
        r*Math.cos(36*t), r*Math.sin(36*t), 0, 1, 1, 0, 0, //2

        0, 0, -0.3, 1, 1, 1, 1, //0
        r*Math.cos(36*t), r*Math.sin(36*t), 0, 1, 1, 0, 0, //2
        Math.cos(72*t), Math.sin(72*t), 0, 1, 1, 1, 0, //3

        0, 0, -0.3, 1, 1, 1, 1, //0
        Math.cos(72*t), Math.sin(72*t), 0, 1, 1, 1, 0, //3
        r*Math.cos((36+72)*t), r*Math.sin((36+72)*t), 0, 1, 1, 0, 0, //4

        0, 0, -0.3, 1, 1, 1, 1, //0    
        r*Math.cos((36+72)*t), r*Math.sin((36+72)*t), 0, 1, 1, 0, 0, //4
        Math.cos(72*2*t), Math.sin(72*2*t), 0, 1, 1, 1, 0,//5

        0, 0, -0.3, 1, 1, 1, 1, //0
        Math.cos(72*2*t), Math.sin(72*2*t), 0, 1, 1, 1, 0, //5
        r*Math.cos((36+72*2)*t), r*Math.sin((36+72*2)*t), 0, 1, 1, 0, 0, //6

        0, 0, -0.3, 1, 1, 1, 1, //0
        r*Math.cos((36+72*2)*t), r*Math.sin((36+72*2)*t), 0, 1, 1, 0, 0, //6
        Math.cos(72*3*t), Math.sin(72*3*t), 0, 1, 1, 1, 0, //7

        0, 0, -0.3, 1, 1, 1, 1, //0
        Math.cos(72*3*t), Math.sin(72*3*t), 0, 1, 1, 1, 0, //7
        r*Math.cos((36+72*3)*t), r*Math.sin((36+72*3)*t), 0, 1, 1, 0, 0, //8

        0, 0, -0.3, 1, 1, 1, 1, //0
        r*Math.cos((36+72*3)*t), r*Math.sin((36+72*3)*t), 0, 1, 1, 0, 0,  //8
        Math.cos(72*4*t), Math.sin(72*4*t), 0, 1, 1, 1, 0, //9

        0, 0, -0.3, 1, 1, 1, 1, //0
        Math.cos(72*4*t), Math.sin(72*4*t), 0, 1, 1, 1, 0, //9
        r*Math.cos((36+72*4)*t), r*Math.sin((36+72*4)*t), 0, 1, 1, 0, 0,//10

        0, 0, -0.3, 1, 1, 1, 1, //0
        r*Math.cos((36+72*4)*t), r*Math.sin((36+72*4)*t), 0, 1, 1, 0, 0,  //10
        Math.cos(0), Math.sin(0), 0, 1, 1, 1, 0,  //1

        ])

  }
function makeTop(){
      topVerts = new Float32Array([
        //spinning tops--------------------------------------------
    //top
    1, 1, 0.5, 1, 0.6, 0.45, 0.87, // 0
    0, 1, 0, 1, 0.92, 0.46, 0.76,// 8
    0.5, 0, 1, 1, 1, 1, 1,//  1

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

        ])
}

 function makeBottom(){
      bottomVerts = new Float32Array([
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

    1, 0, -0.5, 1, 1, 1, 1,// 7
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,// 8
    1, 1, 0.5, 1, 0.6, 0.45, 0.87,// 0



        ])
}

function makeFish(){
    fishVerts = new Float32Array([
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

    0, 0, 0.3, 1, 1, 0.1, 0.1,// 0
    -0.25, -0.25, 0, 1, 1, 1, 0.3,// 5
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


    ])
}

function makeTree(){
      treeVerts = new Float32Array([
        -1,1,0,1, 0.13,0.68,0.05,  
        1,1,0,1, 0.13,0.68,0.05, 
        0,4,0,1, 0.31, 0.81, 0.24, 

        0,1,1,1, 0.13,0.68,0.05,
        0,1,-1,1, 0.13,0.68,0.05,
        0,4,0,1, 0.31, 0.81, 0.24, 

        0.2, 0, 0,1, 0.31, 0.81, 0.24,
        -0.2, 0, 0,1, 0.31, 0.81, 0.24,
        0,4,0,1, 0.31, 0.81, 0.24, 

        0, 0, 0.2, 1, 0.31, 0.81, 0.24,
        0, 0, -0.2, 1, 0.31, 0.81, 0.24,
        0,4,0,1, 0.31, 0.81, 0.24, 


        ])
  }

  function makeCube(){
    cubeVerts = new Float32Array([
        // 1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//0
        // -1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//1
        // -1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//2
        // 1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//3
        // 1.0,-1.0,-1.0,1, 1.0, 0.0, 0.0,//4
        // 1.0, 1.0,-1.0,1, 1.0, 0.0, 0.0,//5
        // -1.0, 1.0,-1.0,1,0.0, 1.0, 0.0,//6
        // -1.0,-1.0,-1.0,1, 0.0,-1.0, 0.0,//7

        1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//0
        -1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//1
        -1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//2

        1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//0
        -1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//2
        1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//3

        -1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//1
        -1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//2
        -1.0, 1.0,-1.0,1,0.0, 1.0, 0.0,//6

        -1.0,-1.0,-1.0,1, 0.0,-1.0, 0.0,//7
        -1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//2
        -1.0, 1.0,-1.0,1,0.0, 1.0, 0.0,//6

        -1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//2
        1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//3
        1.0,-1.0,-1.0,1, 1.0, 0.0, 0.0,//4

        -1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//2
        1.0,-1.0,-1.0,1, 1.0, 0.0, 0.0,//4
        -1.0,-1.0,-1.0,1, 0.0,-1.0, 0.0,//7

        1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//0
        1.0,-1.0, 1.0,1,0.0, 0.0, 1.0,//3
        1.0,-1.0,-1.0,1, 1.0, 0.0, 0.0,//4

        1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//0
        1.0,-1.0,-1.0,1, 1.0, 0.0, 0.0,//4
        1.0, 1.0,-1.0,1, 1.0, 0.0, 0.0,//5

        1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//0
        -1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//1
        -1.0, 1.0,-1.0,1,0.0, 1.0, 0.0,//6

        1.0, 1.0, 1.0, 1, 0.0, 0.0, 1.0,//0
        -1.0, 1.0,-1.0,1,0.0, 1.0, 0.0,//6
        1.0, 1.0,-1.0,1, 1.0, 0.0, 0.0,//5

        1.0, 1.0,-1.0,1, 1.0, 0.0, 0.0,//5
        -1.0, 1.0,-1.0,1,0.0, 1.0, 0.0,//6
        -1.0,-1.0,-1.0,1, 0.0,-1.0, 0.0,//7

        1.0, 1.0,-1.0,1, 1.0, 0.0, 0.0,//5
        -1.0,-1.0,-1.0,1, 0.0,-1.0, 0.0,//7
        1.0,-1.0,-1.0,1, 1.0, 0.0, 0.0,//4

        ]);
  }

function changeLighting() {

    mode_light = mode_light == 1 ? 0 : 1;
    document.getElementById('lightMode').innerHTML = mode_light == 0 ? "Blinn-Phong lighting" : "Phong lighting";
}

function changeShading() {

    mode_shade = mode_shade == 1 ? 0 : 1;
    document.getElementById('shadeMode').innerHTML = mode_shade == 0 ? "Phong shadinging" : "Gouraud shading";
}
