    var VSHADER_SOURCE =
      'attribute vec4 a_Position;\n' +
      'attribute vec4 a_Color;\n' +
      'attribute vec4 a_Normal;\n' + 
      
      'uniform mat4 u_MvpMatrix;\n' +
      'uniform mat4 u_ModelMatrix;\n' +
      'uniform mat4 u_NormalMatrix;\n' + 

      'varying vec3 v_Position;\n' +
      'varying vec4 v_Color;\n' +
      'varying vec3 v_Normal;\n' +

      'void main() {\n' +
      '  gl_Position = u_MvpMatrix * a_Position;\n' +
      '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
      '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
      '  v_Color = a_Color;\n' +
      '  gl_PointSize = 10.0;\n' +
      '}\n';

    var FSHADER_SOURCE =
      '#ifdef GL_ES\n' +
      'precision mediump float;\n' +
      '#endif\n' +

      'uniform vec3 u_LightColor;\n' +          
      'uniform vec3 u_LightPosition;\n' +      
      'uniform vec3 u_AmbientLightColor;\n' +   
      'uniform vec4 u_ColorMod;\n' + 

      'varying vec4 v_Color;\n' +
      'varying vec3 v_Normal;\n' +
      'varying vec3 v_Position;\n' + 

      'void main() {\n' +
      '  vec3 normal = normalize(v_Normal);\n' +
      '  vec3 lightDirection = normalize(u_LightPosition-v_Position);\n' +
      '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' + 
      '  vec4 modColor = v_Color + u_ColorMod;\n' +
      '  vec3 diffuse = u_LightColor * modColor.rgb * nDotL;\n' +
      '  vec3 ambient = u_AmbientLightColor * modColor.rgb;\n' + 
      '  gl_FragColor = vec4(diffuse+ambient, modColor.a);\n' +
      '}\n';
    


    
    var MOUSE_DRAG = false;

    var floatsPerVertex = 10; 
    var STEP1 = 0.15;
    var STEP2 = 0.02;
    var JUDGE = -1;


    var modelMatrix = new Matrix4();
    var viewMatrix = new Matrix4();
    var projMatrix = new Matrix4();
    var mvpMatrix = new Matrix4();
    var normalMatrix = new Matrix4();
    var colorMod = new Vector4();



    var currentAngle = 0.0;
    var ANGLE_STEP = 45.0;  

 
    var isDrag = false;   
    var xMclik = 0.0, yMclik = 0.0;   
    var xMdragTot = 0.0, yMdragTot = 0.0;  

    var qNew = new Quaternion(0,0,0,1); 
    var qTot = new Quaternion(0,0,0,1); 
    var quatMatrix = new Matrix4();     

    var eyeX = 0.20, eyeY = 0.25, eyeZ = 5.25; 
    var tempEyeX = 0, tempEyeY = 0, tempEyeZ = 0;  

    var lookAtX = 0.0, lookAtY = 0.0, lookAtZ = 0.0;
    var tX = 0, tY = 0, tZ = 0;

    var oL = 0.5, oTB = 1;

    var c = (1 + Math.sqrt(5)) / 2;
    var a = 1;
    var b = 1 / c;

    function main() {
    //==============================================================================
      // Retrieve <canvas> element
      canvas = document.getElementById('webgl');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight*0.8;

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

      // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
      // unless the new Z value is closer to the eye than the old one..
      // gl.depthFunc(gl.LESS);       
      gl.enable(gl.DEPTH_TEST); 
      
      // Set the vertex coordinates and color (the blue triangle is in the front)
      var n = initVertexBuffers(gl);

      if (n < 0) {
        console.log('Failed to specify the vertex infromation');
        return;
      }

      canvas.onmousedown  = function(ev){myMouseDown(ev, gl, canvas)}; 
      canvas.onmousemove =  function(ev){myMouseMove(ev, gl, canvas)};
      canvas.onmouseup =    function(ev){myMouseUp(ev, gl, canvas)};

      // Specify the color for clearing <canvas>
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
      var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
      var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
      
      var u_ColorMod = gl.getUniformLocation(gl.program, 'u_ColorMod');
      var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
      var u_AmbientLightColor = gl.getUniformLocation(gl.program, 'u_AmbientLightColor');
      var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
      
      var lightPosition = new Vector3([0, 0, 0]);
      
      if (!u_MvpMatrix || !u_ModelMatrix) { 
        console.log('Failed to get the location of uniform variables');
        return;
      }
     

      gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0); 
      gl.uniform3f(u_AmbientLightColor, 1, 1, 1);


      document.onkeydown = function(ev){ keydown(ev, gl,canvas); };

     
      var tick = function() {
        var now = Date.now();
        currentAngle = animate(currentAngle, now);  // Update the rotation angle


        draw(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);   // Draw the triangles
        requestAnimationFrame(tick, canvas);   
                          // Request that the browser re-draw the webpage
      };
      tick(); 

    }


    function initVertexBuffers(gl) {
    //==============================================================================
      
      makeGroundGrid();
      makePlane();
      makeHopter();
      makeFlag();
      makeFlagline();
      makeIcosahedron();
      makeFish();
      makeTop();
      makeBottom();
      makeTree();
      makeSphere();
      makeStar();

      makeCoordinate();

      var mySiz = gndVerts.length + planeVerts.length + hopterVerts.length + flagVerts.length + flaglineVerts.length + icosahedronVerts.length + fishVerts.length + topVerts.length + bottomVerts.length + treeVerts.length + sphVerts.length + starVerts.length + coordVerts.length;

      // How many vertices total?
      var nn = mySiz / floatsPerVertex;
      // Copy all shapes into one big Float32 array:
      var colorShapes = new Float32Array(mySiz);

      gndStart = 0;
      for(i=0,j=0; j< gndVerts.length; i++,j++) {
        colorShapes[i] = gndVerts[j];
        }

      planeStart=i;
      for(j=0;j<planeVerts.length;i++,j++){
        colorShapes[i]=planeVerts[j];
      }

      hopterStart=i;
      for(j=0;j<hopterVerts.length;i++,j++){
        colorShapes[i]=hopterVerts[j];
      }
      flagStart=i;
      for(j=0;j<flagVerts.length;i++,j++){
        colorShapes[i]=flagVerts[j];
      }
      flaglineStart=i;
      for(j=0;j<flaglineVerts.length;i++,j++){
        colorShapes[i]=flaglineVerts[j];
      }
      icosahedronStart=i;
      for(j=0;j<icosahedronVerts.length;i++,j++){
        colorShapes[i]=icosahedronVerts[j];
      }
      
      fishStart=i;
      for(j=0;j<fishVerts.length;i++,j++){
        colorShapes[i]=fishVerts[j];
      }

      topStart=i;
      for(j=0;j<topVerts.length;i++,j++){
        colorShapes[i]=topVerts[j];
      }

      bottomStart=i;
      for(j=0;j<bottomVerts.length;i++,j++){
        colorShapes[i]=bottomVerts[j];
      }

      treeStart=i;
      for(j=0;j<treeVerts.length;i++,j++){
        colorShapes[i]=treeVerts[j];
      }
      sphStart=i;
      for(j=0;j<sphVerts.length;i++,j++){
        colorShapes[i]=sphVerts[j];
      }
      console.log('sphVerts'+sphVerts.length);
      starStart=i;
      for(j=0;j<starVerts.length;i++,j++){
        colorShapes[i]=starVerts[j];
      }

      coordStart=i;
      for(j=0;j<coordVerts.length;i++,j++){
        colorShapes[i]=coordVerts[j];
      }

      // Create a buffer object
      var vertexColorbuffer = gl.createBuffer();  
      if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
      }

      var shapeBufferHandle = gl.createBuffer();  
      if (!shapeBufferHandle) {
        console.log('Failed to create the shape buffer object');
        return false;
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
      gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

      var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
        
      var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
      if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
      }
      
      gl.vertexAttribPointer( a_Position, 4, gl.FLOAT,false, FSIZE * floatsPerVertex, 0); 
      gl.enableVertexAttribArray(a_Position);  

      var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
      if(a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
      }
      gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, FSIZE * 4); 
                        
      gl.enableVertexAttribArray(a_Color);  

     var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
      if(a_Normal < 0)
      {
        console.log('Failed to get the storage location of a_Normal');
        return -1;
      }
      gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * floatsPerVertex, FSIZE * 7);
      gl.enableVertexAttribArray(a_Normal);
      //--------------------------------DONE!
      // Unbind the buffer object 
      gl.bindBuffer(gl.ARRAY_BUFFER, null);

      return nn;
    }






   
    function draw(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas) {
    //==============================================================================
      
      // Clear <canvas> color AND DEPTH buffer
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.viewport(0, 0, canvas.width/2, canvas.height);
      projMatrix.setPerspective(35, (0.5*canvas.width)/canvas.height, 1, 100);

    
      viewMatrix.setLookAt(eyeX + currentAngle * tempEyeX*0.01, eyeY, eyeZ, 
                          lookAtX + currentAngle * tX * 0.01, lookAtY, lookAtZ,   
                          0, 1, 0); 
      
      drawGround(gl, u_MvpMatrix, u_ModelMatrix, canvas);
      drawPlane(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawFish(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawTops(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawTree(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawSphere(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawCoord(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      


      gl.viewport(canvas.width/2, 0, canvas.width/2, canvas.height);
      projMatrix.setOrtho(-oL * canvas.width/300, oL * canvas.width/300, 
                          -oTB * canvas.height/300, oTB * canvas.height/300,
                          1, 100); 

      viewMatrix.setLookAt(eyeX, eyeY, eyeZ, lookAtX, lookAtY, lookAtZ, 0, 1, 0);

      drawGround(gl, u_MvpMatrix, u_ModelMatrix, canvas);
      drawPlane(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawFish(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawTops(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawTree(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawSphere(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      drawCoord(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas);
      
      
    }

    function drawGround(gl, u_MvpMatrix, u_ModelMatrix, canvas) {


      modelMatrix.setTranslate(0.0, 0.0, 0.0);
      viewMatrix.rotate(-90.0, 1,0,0);  

      viewMatrix.translate(0.0, 0.0, -0.6); 
      viewMatrix.scale(0.4, 0.4,0.4);   
      
      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);


      gl.drawArrays(gl.LINES, gndStart/floatsPerVertex, gndVerts.length/floatsPerVertex); 

    }

    function  drawPlane(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas){
      modelMatrix.setTranslate(-1,-0.3, 3.0); 
      modelMatrix.rotate(120, 1, 0, 0);
      modelMatrix.scale(0.9, 0.9, 0.9); 
      modelMatrix.translate(currentAngle*0.03, 0.0, 0.0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);


      gl.drawArrays(gl.TRIANGLES, planeStart/floatsPerVertex,planeVerts.length/floatsPerVertex);
      gl.drawArrays(gl.TRIANGLES, flagStart/floatsPerVertex,flagVerts.length/floatsPerVertex);
      gl.drawArrays(gl.LINES, flaglineStart/floatsPerVertex,flaglineVerts.length/floatsPerVertex);

      pushMatrix(modelMatrix);
      // hopter
      modelMatrix.rotate(currentAngle*20, 1, 0, 0)
      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, hopterStart/floatsPerVertex, hopterVerts.length/floatsPerVertex);

      // icosahedron
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);

      modelMatrix.scale(0.3, 0.3, 0.3);
      modelMatrix.translate(-5.3, 0.0, 0.0);
 
      modelMatrix.rotate(-10*currentAngle, 1, 1, 1);
      modelMatrix.scale(currentAngle*0.02, currentAngle*0.02, currentAngle*0.02);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, icosahedronStart/floatsPerVertex, icosahedronVerts.length/floatsPerVertex);

      //sphere

      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);

      modelMatrix.translate(2.5, 0.0, 0.0);

      modelMatrix.rotate(currentAngle*0.5, 1, 1, 1);
      modelMatrix.scale(0.3,0.3,0.3);
      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, sphStart/floatsPerVertex,sphVerts.length/floatsPerVertex);

    }

    function  drawFish(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas){
      modelMatrix.setTranslate(2,-3,1.0);
      modelMatrix.scale(0.3, 0.3, 0.3);
      modelMatrix.rotate(90, 1, 0.5, 0);
      modelMatrix.rotate(180, -0.5, 0, 1);

      // modelMatrix.translate(currentAngle*0.05, 0, 0);
      
      quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w); // Quaternion-->Matrix
      modelMatrix.concat(quatMatrix);   

      pushMatrix(modelMatrix);
      // modelMatrix.rotate(0.2*currentAngle, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
     

      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);
      
      
//
      modelMatrix.translate(1.5, 2, 1);
      modelMatrix.scale(0.7, 0.7, 0.7);
      
      modelMatrix.rotate(0.1*currentAngle, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

      modelMatrix.translate(1.5, 2, 1);
      modelMatrix.scale(0.7, 0.7, 0.7);
      modelMatrix.rotate(currentAngle, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);


      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);
//
      modelMatrix.translate(1.5, -5, 1);
      modelMatrix.scale(2, 2, 2);

      modelMatrix.rotate(-currentAngle, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);


      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

      modelMatrix.translate(1.5, -1, 1);
      modelMatrix.scale(0.5, 0.5, 0.5);

      modelMatrix.rotate(-1*currentAngle, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

      modelMatrix.translate(-4, -1, 1);
      modelMatrix.scale(1.2, 1.2, 1.2);
      modelMatrix.rotate(2*currentAngle, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      //
      modelMatrix.scale(0.5, 0.5, 0.5);
      modelMatrix.translate(-1.5, -5, -1);

      modelMatrix.rotate(-10*currentAngle, 1, 0, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      gl.drawArrays(gl.TRIANGLES, icosahedronStart/floatsPerVertex, icosahedronVerts.length/floatsPerVertex);

      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      modelMatrix.scale(2,2,2);
      modelMatrix.translate(1,1,1);
      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      gl.drawArrays(gl.LINES, coordStart/floatsPerVertex,coordVerts.length/floatsPerVertex);

    }

    function drawTops(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas){
//3
      modelMatrix.setTranslate(-2,3,2);
      modelMatrix.rotate(90, 1, 0, 0);
      
      
      modelMatrix.scale(0.35, 0.35, 0.35);
      modelMatrix.translate(0, -currentAngle*0.02, 0);
      pushMatrix(modelMatrix);

      modelMatrix.rotate(currentAngle*3, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);



      gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
      gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);
      //fish on top
      modelMatrix.scale(0.5,0.5,0.5);
      modelMatrix.translate(0, 3, 0);
      modelMatrix.rotate(currentAngle*3, 1, -1, 1);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

     

      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);

      modelMatrix.translate(0, -2.5, 0);
      modelMatrix.scale(0.7, 0.7, 0.7);
      modelMatrix.rotate(-currentAngle*5, 0, 0, 1)

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      

      gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
      //
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      modelMatrix.rotate(180, 0, 0, 1);
      modelMatrix.translate(0, 5, 0)
      modelMatrix.rotate(-currentAngle*3, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      

      gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
      gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);



//1
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      modelMatrix.translate(0, 0, 20)

      modelMatrix.rotate(currentAngle*3, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      

      gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
      gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);
      //fish on top
      modelMatrix.scale(0.5,0.5,0.5);
      modelMatrix.translate(0, 3, 0);
      modelMatrix.rotate(currentAngle*3, 1, -1, 1);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      // gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      

      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);

      modelMatrix.translate(0, -2.5, 20);
      modelMatrix.scale(0.7, 0.7, 0.7);
      modelMatrix.rotate(-currentAngle*5, 0, 0, 1)

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

      

      gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
      //
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      modelMatrix.rotate(180, 0, 0, 1);
      modelMatrix.translate(0, 5, 20)
      modelMatrix.rotate(-currentAngle*3, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      

      gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
      gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);



//2
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      modelMatrix.rotate(180, 0, 0, 1);
      modelMatrix.translate(0, 3, 10)
      modelMatrix.rotate(currentAngle*3, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
     

      gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
      gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);

      modelMatrix.scale(0.5,0.5,0.5);
      modelMatrix.translate(0, -4, 0);
      modelMatrix.rotate(-currentAngle*3, 0, 1, 1);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

     
      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);

      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);

      modelMatrix.translate(0, -5, 10);
      modelMatrix.scale(0.7, 0.7, 0.7);
      modelMatrix.rotate(currentAngle*5, 0, 0, 1)

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

     

      gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
      //
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      // modelMatrix.rotate(180, 0, 0, 1);
      modelMatrix.translate(0, -7, 10)
      modelMatrix.rotate(-currentAngle*3, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      

      gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
      gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);



// ===========far
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      modelMatrix.rotate(180, 0, 0, 1);
      modelMatrix.translate(0, 3, -10)
      modelMatrix.rotate(currentAngle*3, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      

      gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
      gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);

      modelMatrix.scale(0.5,0.5,0.5);
      modelMatrix.translate(0, -4, 0);
      modelMatrix.rotate(-currentAngle*3, 0, 1, 1);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      

      gl.drawArrays(gl.TRIANGLES, fishStart/floatsPerVertex, fishVerts.length/floatsPerVertex);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);

      modelMatrix.translate(0, -5, -10);
      modelMatrix.scale(0.7, 0.7, 0.7);
      modelMatrix.rotate(currentAngle*5, 0, 0, 1)

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      

      gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
      //
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      // modelMatrix.rotate(180, 0, 0, 1);
      modelMatrix.translate(0, -7, -10)
      modelMatrix.rotate(-currentAngle*3, 0, 1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      

      gl.drawArrays(gl.TRIANGLES, topStart/floatsPerVertex,topVerts.length/floatsPerVertex);
      gl.drawArrays(gl.TRIANGLES, bottomStart/floatsPerVertex,bottomVerts.length/floatsPerVertex);


    }

    function drawTree(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas){
      modelMatrix.setScale(0.5, 0.5, 0.5);
      modelMatrix.rotate(90, 1, 0, 0);
      modelMatrix.translate(4, 0, -10);
      modelMatrix.scale(1, 1.5, 1);
      modelMatrix.rotate(currentAngle, 0, 1, 0);


      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      gl.drawArrays(gl.TRIANGLES, treeStart/floatsPerVertex, treeVerts.length/floatsPerVertex);
      
      pushMatrix(modelMatrix);
      //top star
      modelMatrix.translate(0, 4.2, 0);
      modelMatrix.scale(0.3, 0.3, 0.3);
      modelMatrix.rotate(currentAngle*10, 1, 1, 1)

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      

      gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
      //
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);

      modelMatrix.translate(0, 1, 1);
      modelMatrix.scale(0.2, 0.2, 0.2);
      modelMatrix.rotate(currentAngle*10, 0, 1, 0)
    
      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      

      gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
      
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      modelMatrix.translate(0, 1, -1);
      modelMatrix.scale(0.2, 0.2, 0.2);
      modelMatrix.rotate(currentAngle*10, 0, 1, 0)
    
      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      

      gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
      

      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
      modelMatrix.translate(1, 1, 0);
      modelMatrix.scale(0.2, 0.2, 0.2);
      modelMatrix.rotate(currentAngle*10, 0, 1, 0)
    
      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

     

      gl.drawArrays(gl.TRIANGLES, starStart/floatsPerVertex, starVerts.length/floatsPerVertex);
      
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



    function drawSphere(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas){
      modelMatrix.setTranslate(-0.1, 0, 0.5);
      modelMatrix.rotate(currentAngle, 1, 1, 0);
      modelMatrix.scale(0.4,0.4,0.4);
      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
      
      
      gl.drawArrays(gl.TRIANGLE_STRIP, sphStart/floatsPerVertex,sphVerts.length/floatsPerVertex);

    }

    function drawCoord(gl, u_MvpMatrix, u_ModelMatrix, currentAngle, canvas){
      modelMatrix.setScale(2, 2, 2);
      modelMatrix.translate(-0.5, -1, 0);

      mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
      gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
      gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

      
      gl.drawArrays(gl.LINES, coordStart/floatsPerVertex,coordVerts.length/floatsPerVertex);

  }
    
//----------------animate
    var last = Date.now();

    function animate(angle, now) {
    //==============================================================================
      // Calculate the elapsed time
      
	    var elapsed = now - last;
	    last = now;
	      
	      // Update the current rotation angle (adjusted by the elapsed time)
	      //  limit the angle to move smoothly between +20 and -85 degrees:
	    if(angle >  90.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
	    if(angle < -90.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
	      
	    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
	    return newAngle %= 360;
    }

    

    function runStop() {
        if(ANGLE_STEP*ANGLE_STEP > 1) {
          myTmp = ANGLE_STEP;
          ANGLE_STEP = 0;
        }
        else {
         ANGLE_STEP = myTmp;
        }
        }

    function changeSpeed(){

      ANGLE_STEP += 10; 
    }

    function resize()
    {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight*0.8;
    }

    function userInstructions(){
      document.getElementById("instructions").innerHTML = "1. You can change eyeposition by pressing ← for eyeposition moving to left, → for eyeposition moving to right, ↑ for eyeposition zooming in, and ↓ for eyeposition zooming out.<br />2. You can change looking perspective by pressing A to look left, D to look right, W to look up and S to look down. <br />3. You can control 'flying-airplane' navigation by pressing 'p' for pitch, and 'y' for yaw. <br />4. You can switch perspective camera to show view from the end of plane by pressing 'e'. <br />5. You can use mouse to drag Fish, which is quanternion-based 'trackball' control of orientation. <br />6. You can simply click on canvas to stop/run the movements. <br />7. Also there is a control panel of some buttons, you can change speed of movements or run/stop movements. <br />8. You can press 'R' to reset the perspective to original state. "
    }

//===============mouse drag
  function myMouseDown(ev, gl, canvas) {
  //==============================================================================
  // Called when user PRESSES down any mouse button;
  //                  (Which button?    console.log('ev.button='+ev.button);   )
  //    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
  //    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  //  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
    
    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
                 (canvas.width/2);      // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
                 (canvas.height/2);
  //  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
    


    isDrag = true;
                          // set our mouse-dragging flag
    xMclik = x;                         // record where mouse-dragging began
    yMclik = y;
  };


  function myMouseMove(ev, gl, canvas) {
  //==============================================================================
  // Called when user MOVES the mouse with a button already pressed down.
  //                  (Which button?   console.log('ev.button='+ev.button);    )
  //    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
  //    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

    if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'
    MOUSE_DRAG = true;
    // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  //  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
    
    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
                 (canvas.width/2);      // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
                 (canvas.height/2);

    // find how far we dragged the mouse:
    xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
    yMdragTot += (y - yMclik);
    // AND use any mouse-dragging we found to update quaternions qNew and qTot.
    //===================================================
    dragQuat(x - xMclik, y - yMclik);
    //===================================================
    xMclik = x;                         // Make NEXT drag-measurement from here.
    yMclik = y;
    
   
  };

  function myMouseUp(ev, gl, canvas) {
  //==============================================================================
  // Called when user RELEASES mouse button pressed previously.
  //                  (Which button?   console.log('ev.button='+ev.button);    )
  //    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
  //    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  //  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
    
    // Convert to Canonical View Volume (CVV) coordinates too:
    var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
                 (canvas.width/2);      // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
                 (canvas.height/2);
    if (MOUSE_DRAG == false) {
        if (ANGLE_STEP*ANGLE_STEP > 1) {
          myTmp = ANGLE_STEP;
          ANGLE_STEP = 0;
        }
        else {
          ANGLE_STEP = myTmp;
            
        }
    }

    isDrag = false;                     // CLEAR our mouse-dragging flag, and
    MOUSE_DRAG = false;
    
    // accumulate any final bit of mouse-dragging we did:
    xMdragTot += (x - xMclik);
    yMdragTot += (y - yMclik);

    // AND use any mouse-dragging we found to update quaternions qNew and qTot;
    dragQuat(x - xMclik, y - yMclik);

  };


  function dragQuat(xdrag, ydrag) {
//==============================================================================
// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
// We find a rotation axis perpendicular to the drag direction, and convert the 
// drag distance to an angular rotation amount, and use both to set the value of 
// the quaternion qNew.  We then combine this new rotation with the current 
// rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
// 'draw()' function converts this current 'qTot' quaternion to a rotation 
// matrix for drawing. 
  var res = 5;
  var qTmp = new Quaternion(0,0,0,1);
  
  var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
  // console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
  qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
  // (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
              // why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
              // -- to rotate around +x axis, drag mouse in -y direction.
              // -- to rotate around +y axis, drag mouse in +x direction.
              
  qTmp.multiply(qNew,qTot);     // apply new rotation to current rotation. 
  //--------------------------
  // IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
  // ANSWER: Because 'duality' governs ALL transformations, not just matrices. 
  // If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
  // first by qTot, and then by qNew--we would apply mouse-dragging rotations
  // to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
  // rotations FIRST, before we apply rotations from all the previous dragging.
  //------------------------
  // IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store 
  // them with finite precision. While the product of two (EXACTLY) unit-length
  // quaternions will always be another unit-length quaternion, the qTmp length
  // may drift away from 1.0 if we repeat this quaternion multiply many times.
  // A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
  // Matrix4.prototype.setFromQuat().
//  qTmp.normalize();           // normalize to ensure we stay at length==1.0.
  qTot.copy(qTmp);
  // show the new quaternion qTot on our webpage in the <div> element 'QuatValue'
  
};
//=============keyboard
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
        case 39: { // right
            u = new Vector3();
            u = new Float32Array([0, 1, 0]);
            
            l = new Vector3();
            
            l[0] = dx/temp; l[1] = dy/temp; l[2] = dz/temp;

            t = new Vector3();
            t[0] = u[1]*l[2] - u[2]*l[1];
            t[1] = u[2]*l[0] - u[0]*l[2];
            t[2] = u[0]*l[1] - u[1]*l[0];

            temp2 = Math.sqrt(t[0]*t[0] + t[1]*t[1] + t[2]*t[2]);

            t[0] /= temp2; t[1] /= temp2; t[2] /= temp2;

            eyeX -= STEP1 * t[0];
            eyeY -= STEP1 * t[1];
            eyeZ -= STEP1 * t[2];

            lookAtX -= STEP1 * t[0];
            lookAtY -= STEP1 * t[1];
            lookAtZ -= STEP1 * t[2];

            break;
        }
        case 37: { // left
            u = new Vector3();
            u = new Float32Array([0, 1, 0]);
            
            l = new Vector3();
            l[0] = dx/temp; l[1] = dy/temp; l[2] = dz/temp;

            t = new Vector3();
            t[0] = u[1]*l[2] - u[2]*l[1];
            t[1] = u[2]*l[0] - u[0]*l[2];
            t[2] = u[0]*l[1] - u[1]*l[0];

            temp2 = Math.sqrt(t[0]*t[0] + t[1]*t[1] + t[2]*t[2]);

            t[0] /= temp2; t[1] /= temp2; t[2] /= temp2;

            eyeX += STEP1 * t[0];
            eyeY += STEP1 * t[1];
            eyeZ += STEP1 * t[2];

            lookAtX += STEP1 * t[0];
            lookAtY += STEP1 * t[1];
            lookAtZ += STEP1 * t[2];

            break;
      
        } 
        case 38: 
           { // up
            t = new Vector3();
            t[0] = dx/temp; t[1] = dy/temp; t[2] = dz/temp;

            eyeX += STEP1 * t[0];
            eyeY += STEP1 * t[1];
            eyeZ += STEP1 * t[2];

            lookAtX += STEP1 * t[0];
            lookAtY += STEP1 * t[1];
            lookAtZ += STEP1 * t[2];

            break;

        } 
        case 40: { // down
            t = new Vector3();
            t[0] = dx/temp; t[1] = dy/temp; t[2] = dz/temp;
            
            eyeX -= STEP1 * t[0];
            eyeY -= STEP1 * t[1];
            eyeZ -= STEP1 * t[2];

            lookAtX -= STEP1 * t[0];
            lookAtY -= STEP1 * t[1];
            lookAtZ -= STEP1 * t[2];

            break;
        } 
        case 65:{ // a
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
        case 68: {//d
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
      
        case 87:{ //w
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
          case 83:{ //s
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

          case 69: {// e 
            eyeX = -2; eyeY =  0.75; eyeZ = 0;
            lookAtX = 3; lookAtY = 0.75; lookAtZ =  0;
            tX = 1; 
            tempEyeX = 1; 

            break;
          }
          //flying control
          case 80: { // P 
            tempEyeY += 2;

            break;
      
        } 
          case 89: { // Y 
            tempEyeX += 1;
            break;
      
        } 
          
          case 82:{   //R 
          eyeX = 0.20; eyeY = 0.25; eyeZ = 5.25; 
          lookAtX = 0.0; lookAtY = 0.0; lookAtZ = 0.0;
          oL = 0.5; oTB = 1;
          tX=0; 
          tempEyeX = 0; 
          break;
          }


          
        default: 
        {
          return;
          break;
        }

    }    
}



 function makeGroundGrid() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

      var xcount = 100;     // # of lines to draw in x,y to make the grid.
      var ycount = 100;   
      var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
      var xColr = new Float32Array([0.59, 0.97, 0.94]);  // bright yellow
      var yColr = new Float32Array([1, 1, 1]);  // bright green.
      
      // Create an (global) array to hold this ground-plane's vertices:
      gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
                // draw a grid made of xcount+ycount lines; 2 vertices per line.
                
      var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
      var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
      
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
        gndVerts[j+7] = 0;  //dx
        gndVerts[j+8] = 0;  //dy
        gndVerts[j+9] = 1;  //dz
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
        gndVerts[j+7] = 0;  //dx
        gndVerts[j+8] = 0;  //dy
        gndVerts[j+9] = 1;  //dz
      }
    }

    function makePlane(){
      planeVerts = new Float32Array([
        //head--------------------------------------
      2, 0, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//A
      1.75, -0.15, 0, 1, 0.38, 0.6, 0.96, 1, 1, 1,//B
      1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C

      2, 0, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//A
      1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C
      1.75, 0.15, 0, 1, 0.38, 0.6, 0.96, 1, 1, 1,//D

      2, 0, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//A
      1.75, 0.15, 0, 1, 0.38, 0.6, 0.96, 1, 1, 1,//D
      1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E

      2, 0, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//A
      1.75, -0.15, 0, 1, 0.38, 0.6, 0.96, 1, 1, 1,//B
      1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E
  //tail------------------------------------
      -0.9, 0, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//A'
      -0.75, -0.15, 0, 1, 0.38, 0.6, 0.96, 1, 1, 1,//B'
      -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'

      -0.9, 0, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//A'
      -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'
      -0.75, 0.15, 0, 1, 0.38, 0.6, 0.96, 1, 1, 1,//D'

      -0.9, 0, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//A'
      -0.75, 0.15, 0, 1, 0.38, 0.6, 0.96, 1, 1, 1,//D'
      -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E'

      -0.9, 0, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//A'
      -0.75, -0.15, 0, 1, 0.38, 0.6, 0.96, 1, 1, 1,//B'
      -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E'
  //body---------------------------------------
      1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//B
      -0.75, -0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//B'
      -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'

      1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//B
      1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C
      -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'

      1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C
      -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'
      1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//D

      -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'
      1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//D
      -0.75, 0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//D'

      1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//D
      -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E'
      1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E

      1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//D
      1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E
      -0.75, 0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//D'

      1.75, 0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//D
      -0.75, 0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//D'
      -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E'

      1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E
      -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E'
      1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//B

      1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//B
      -0.75, -0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//B'
      1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E

      -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//E'
      -0.75, -0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//B'
      1.75, -0.15, 0, 1, 0.4, 0.5, 0.6, 1, 1, 1,//B

  //front wings-------------------------------------
      1.75, 0, 2, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F
      0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//G
      1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C

      1.5, 0.1, 0.1, 1, 0.4, 0.5, 0.6,1, 1, 1,//H
      1.75, 0, 2, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F
      1.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C

      1.75, 0, 2, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F
      0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//G
      1.5, 0.1, 0.1, 1, 0.4, 0.5, 0.6,1, 1, 1,//H
  //
      1.75, 0, -2, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F
      0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//G
      1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C

      1.5, 0.1, -0.1, 1, 0.4, 0.5, 0.6,1, 1, 1,//H
      1.75, 0, -2, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F
      1.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C

      1.75, 0, -2, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F
      0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//G
      1.5, 0.1, -0.1, 1, 0.4, 0.5, 0.6,1, 1, 1,//H

  //back wings---------------------------------
      -0.5, 0, -1, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F‘
      -0.5, 0, -0.15, 1, 0.38, 0.6, 0.96,1, 1, 1,//G'
      -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'

      -0.65, 0.1, 0.1, 1, 0.4, 0.5, 0.6,1, 1, 1,//H'
      -0.5, 0, -1, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F‘
      -0.5, 0, -0.15, 1, 0.38, 0.6, 0.96,1, 1, 1,//G'

      -0.75, 0, -0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'
      -0.65, 0.1, 0.1, 1, 0.4, 0.5, 0.6,1, 1, 1,//H'
      -0.5, 0, -1, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F‘
  //
      -0.5, 0, 1, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F‘
      -0.5, 0, 0.15, 1, 0.38, 0.6, 0.96,1, 1, 1,//G'
      -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'

      -0.65, 0.1, 0.1, 1, 0.4, 0.5, 0.6,1, 1, 1,//H'
      -0.5, 0, 1, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F‘
      -0.5, 0, 0.15, 1, 0.38, 0.6, 0.96,1, 1, 1,//G'

      -0.75, 0, 0.15, 1, 0.38, 0.6, 0.96, 1, 1, 1,//C'
      -0.65, 0.1, 0.1, 1, 0.4, 0.5, 0.6,1, 1, 1,//H'
      -0.5, 0, 1, 1, 0.67, 0.78, 0.96, 1, 1, 1,//F‘

  // 
      -0.2, 0.15, 0, 1, 0.38, 0.6, 0.96,1, 1, 1,//J
      -0.75, 0.15, 0, 1, 0.38, 0.6, 0.96, 1, 1, 1,//D'
      -0.75, 0.4, 0, 1, 0.67, 0.78, 0.96,1, 1, 1,//I
  //93 points
        ])
    }

    function makeHopter(){
      hopterVerts = new Float32Array([
// Hopter--------------------------------------
//vertices
    // 2, 0, 0, 1, 0.4, 0.5, 0.6, //A
    // 2, 0, -0.5, 1, 0.4, 0.5, 0.6,//K
    // 2, 0.05, -0.4, 1, 0.4, 0.5, 0.6,//L
    // 2, -0.05, -0.4, 1, 0.4, 0.5, 0.6,//M
    // 1.95, 0, -0.4, 1, 0.4, 0.5, 0.6,//N
    // 2.05, 0, -0.4, 1, 0.4, 0.5, 0.6,//O

      2, 0, 0, 1,  1, 1, 1,  1, 1, 1,//A
      2, -0.05, -0.4, 1, 1, 1, 1,1, 1, 1,//M
      2.05, 0, -0.4, 1, 1, 1, 1,1, 1, 1,//O

      2, -0.05, -0.4, 1, 1, 1, 1,1, 1, 1,//M
      2, 0, -0.5, 1, 0.4, 0.5, 0.6,1, 1, 1,//K
      2.05, 0, -0.4, 1, 1, 1, 1,1, 1, 1,//O

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, 0.05, -0.4, 1, 1, 1, 1,1, 1, 1,//L
      2.05, 0, -0.4, 1, 1, 1, 1,1, 1, 1,//O

      2, 0.05, -0.4, 1, 1, 1, 1,1, 1, 1,//L
      2.05, 0, -0.4, 1, 1, 1, 1,1, 1, 1,//O
      2, 0, -0.5, 1, 0.4, 0.5, 0.6,1, 1, 1,//K

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      1.95, 0, -0.4, 1, 1, 1, 1,1, 1, 1,//N
      2, 0.05, -0.4, 1, 1, 1, 1,1, 1, 1,//L

      1.95, 0, -0.4, 1, 1, 1, 1,1, 1, 1,//N
      2, 0.05, -0.4, 1, 1, 1, 1,1, 1, 1,//L
      2, 0, -0.5, 1, 0.4, 0.5, 0.6,1, 1, 1,//K

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      1.95, 0, -0.4, 1, 1, 1, 1,1, 1, 1,//N
      2, -0.05, -0.4, 1, 1, 1, 1,1, 1, 1,//M

      1.95, 0, -0.4, 1, 1, 1, 1,1, 1, 1,//N
      2, -0.05, -0.4, 1, 1, 1, 1,1, 1, 1,//M
      2, 0, -0.5, 1, 0.4, 0.5, 0.6,1, 1, 1,//K

  //
      2, 0, 0, 1,  1, 1, 1,  1, 1, 1,//A
      2, -0.05, 0.4, 1, 1, 1, 1,1, 1, 1,//M
      2.05, 0, 0.4, 1, 1, 1, 1,1, 1, 1,//O

      2, -0.05, 0.4, 1, 1, 1, 1,1, 1, 1,//M
      2, 0, 0.5, 1, 0.4, 0.5, 0.6,1, 1, 1,//K
      2.05, 0, 0.4, 1, 1, 1, 1,1, 1, 1,//O

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, 0.05, 0.4, 1, 1, 1, 1,1, 1, 1,//L
      2.05, 0, 0.4, 1, 1, 1, 1,1, 1, 1,//O

      2, 0.05, 0.4, 1, 1, 1, 1,1, 1, 1,//L
      2.05, 0, 0.4, 1, 1, 1, 1,1, 1, 1,//O
      2, 0, 0.5, 1, 0.4, 0.5, 0.6,1, 1, 1,//K

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      1.95, 0, 0.4, 1, 1, 1, 1,1, 1, 1,//N
      2, 0.05, 0.4, 1, 1, 1, 1,1, 1, 1,//L

      1.95, 0, 0.4, 1, 1, 1, 1,1, 1, 1,//N
      2, 0.05, 0.4, 1, 1, 1, 1,1, 1, 1,//L
      2, 0, 0.5, 1, 0.4, 0.5, 0.6,1, 1, 1,//K

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      1.95, 0, 0.4, 1, 1, 1, 1,1, 1, 1,//N
      2, -0.05, 0.4, 1, 1, 1, 1,1, 1, 1,//M

      1.95, 0, 0.4, 1, 1, 1, 1,1, 1, 1,//N
      2, -0.05, 0.4, 1, 1, 1, 1,1, 1, 1,//M
      2, 0, 0.5, 1, 0.4, 0.5, 0.6,1, 1, 1,//K
   //------------------------------------141
      // 2, 0, 0, 1, 1, 1, 1, //A
      // 2, 0.5, 0, 1, 0.4, 0.5, 0.6,//B
      // 1.95, 0.4, 0, 1, 1, 1, 1,//C
      // 2.05, 0.4, 0, 1, 1, 1, 1, //D
      // 2, 0.4, 0.05, 1, 1, 1, 1, //E
      // 2, 0.4, -0.05, 1, 1, 1, 1, //F

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, 0.4, 0.05, 1, 1, 1, 1, 1, 1, 1,//E
      2.05, 0.4, 0, 1, 1, 1, 1, 1, 1, 1,//D

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, 0.4, 0.05, 1, 1, 1, 1, 1, 1, 1,//E
      1.95, 0.4, 0, 1, 1, 1, 1,1, 1, 1,//C

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, 0.4, -0.05, 1, 1, 1, 1, 1, 1, 1,//F
      2.05, 0.4, 0, 1, 1, 1, 1, 1, 1, 1,//D

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, 0.4, -0.05, 1, 1, 1, 1, 1, 1, 1,//F
      1.95, 0.4, 0, 1, 1, 1, 1,1, 1, 1,//C

      2, 0.5, 0, 1, 0.4, 0.5, 0.6,1, 1, 1,//B
      2, 0.4, 0.05, 1, 1, 1, 1, 1, 1, 1,//E
      2.05, 0.4, 0, 1, 1, 1, 1, 1, 1, 1,//D

      2, 0.5, 0, 1, 0.4, 0.5, 0.6,1, 1, 1,//B
      2, 0.4, 0.05, 1, 1, 1, 1, 1, 1, 1,//E
      1.95, 0.4, 0, 1, 1, 1, 1,1, 1, 1,//C

      2, 0.5, 0, 1, 0.4, 0.5, 0.6,1, 1, 1,//B
      2, 0.4, -0.05, 1, 1, 1, 1, 1, 1, 1,//F
      2.05, 0.4, 0, 1, 1, 1, 1, 1, 1, 1,//D

      2, 0.5, 0, 1, 0.4, 0.5, 0.6,1, 1, 1,//B
      2, 0.4, -0.05, 1, 1, 1, 1, 1, 1, 1,//F
      1.95, 0.4, 0, 1, 1, 1, 1,1, 1, 1,//C
   //-----------------------------------  
      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, -0.4, 0.05, 1, 1, 1, 1, 1, 1, 1,//E
      2.05, -0.4, 0, 1, 1, 1, 1, 1, 1, 1,//D

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, -0.4, 0.05, 1, 1, 1, 1, 1, 1, 1,//E
      1.95, -0.4, 0, 1, 1, 1, 1,1, 1, 1,//C

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, -0.4, -0.05, 1, 1, 1, 1, 1, 1, 1,//F
      2.05, -0.4, 0, 1, 1, 1, 1, 1, 1, 1,//D

      2, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A
      2, -0.4, -0.05, 1, 1, 1, 1, 1, 1, 1,//F
      1.95, -0.4, 0, 1, 1, 1, 1,1, 1, 1,//C

      2, -0.5, 0, 1, 0.4, 0.5, 0.6,1, 1, 1,//B
      2, -0.4, 0.05, 1, 1, 1, 1, 1, 1, 1,//E
      2.05, -0.4, 0, 1, 1, 1, 1, 1, 1, 1,//D

      2, -0.5, 0, 1, 0.4, 0.5, 0.6,1, 1, 1,//B
      2, -0.4, 0.05, 1, 1, 1, 1, 1, 1, 1,//E
      1.95, -0.4, 0, 1, 1, 1, 1,1, 1, 1,//C

      2, -0.5, 0, 1, 0.4, 0.5, 0.6,1, 1, 1,//B
      2, -0.4, -0.05, 1, 1, 1, 1, 1, 1, 1,//F
      2.05, -0.4, 0, 1, 1, 1, 1, 1, 1, 1,//D

      2, -0.5, 0, 1, 0.4, 0.5, 0.6,1, 1, 1,//B
      2, -0.4, -0.05, 1, 1, 1, 1, 1, 1, 1,//F
      1.95, -0.4, 0, 1, 1, 1, 1,1, 1, 1,//C 
        ])
    }

    function makeFlag(){
      flagVerts = new Float32Array([
        //flag
    // -0.9, 0, 0, 1, 1, 1, 1, //A'
    // -0.9, 0.2, 0, 1, 1, 1, 1, //P
    // -0.9, 0.3, 0, 1, 1, 1, 1, //Q
    // -1.1, 0.3, 0, 1, 1, 1, 1, //R
    // -1.1, 0.2, 0, 1, 1, 1, 1, //S

    -1.1, 0.3, 0, 1, 1, 0, 0, 1, 1, 1,//R
    -0.9, 0.3, 0, 1, 1, 0, 0, 1, 1, 1,//Q
    -0.9, 0.2, 0, 1, 1, 0, 0, 1, 1, 1,//P

    -1.1, 0.3, 0, 1, 1, 0, 0, 1, 1, 1,//R
    -1.1, 0.2, 0, 1, 1, 0, 0, 1, 1, 1,//S
    -0.9, 0.2, 0, 1, 1, 0, 0, 1, 1, 1,//P

        ])
    }
    function makeFlagline(){
      flaglineVerts = new Float32Array([
// line
    -0.9, 0, 0, 1, 1, 1, 1, 1, 1, 1,//A'
    -0.9, 0.3, 0, 1, 1, 1, 1, 1, 1, 1,//Q
        ])
    }
    function makeFish(){
      fishVerts = new Float32Array([
        //fish
    0, 0, 0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0
    1, -1, 0, 1, 1, 1, 0.3,4, 1, 3,// 1
    1, 1, 0, 1, 1, 0.1, 0.1,4, 1, 3,// 2

    1, -1, 0, 1, 1, 1, 0.3,4, 1, 3,     // 1
    0, 0, 0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0
    0.25, -0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 3

    0.25, -0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 3
    0, 0, 0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0
    0, -1, 0, 1, 1, 1, 0.3,4, 1, 3,// 4

    0, -1, 0, 1, 1, 1, 0.3,4, 1, 3,// 4
    -0.25, -0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 5
    0, 0, 0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0

    0, 0, 0.3, 1, 1, 0.1, 0.1,4, 1, 3,   // 0
    -0.25, -0.25, 0, 1, 1, 1, 0.3, 4, 1, 3,// 5
    -1, 0, 0, 1, 1, 1, 0.3,4, 1, 3,// 6

    -1, 0, 0, 1, 1, 1, 0.3, 4, 1, 3,// 6
    -0.25, 0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 7
    0, 0, 0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0

    0, 0, 0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0
    -0.25, 0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 7
    -1, 1, 0, 1, 1, 1, 0.3,4, 1, 3,// 8

    -1, 1, 0, 1, 1, 1, 0.3,4, 1, 3,// 8
    1, 1, 0, 1, 1, 0.1, 0.1,4, 1, 3,// 2
    0, 0, 0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0

    0, 0, -0.3, 1.0, 1, 0.1, 0.1,4, 1, 3,// 0'
    1, -1, 0, 1, 1, 1, 0.3,4, 1, 3,// 1
    1, 1, 0, 1, 1, 0.1, 0.1,4, 1, 3,// 2

    1, -1, 0, 1, 1, 1, 0.3,4, 1, 3,// 1
    0, 0, -0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0'
    0.25, -0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 3

    0.25, -0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 3
    0, 0, -0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0'
    0, -1, 0, 1, 1, 1, 0.3,4, 1, 3,// 4

    0, -1, 0, 1, 1, 1, 0.3,4, 1, 3,// 4
    -0.25, -0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 5
    0, 0, -0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0'

    0, 0, -0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0'
    -0.25, -0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 5
    -1, 0, 0, 1, 1, 1, 0.3,4, 1, 3,// 6

    -1, 0, 0, 1, 1, 1, 0.3,4, 1, 3,// 6
    -0.25, 0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 7
    0, 0, -0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0'

    0, 0, -0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0'
    -0.25, 0.25, 0, 1, 1, 1, 0.3,4, 1, 3,// 7
    -1, 1, 0, 1, 1, 1, 0.3,4, 1, 3,// 8

    -1, 1, 0, 1, 1, 1, 0.3,4, 1, 3,// 8
    1, 1, 0, 1, 1, 0.1, 0.1,4, 1, 3,// 2
    0, 0, -0.3, 1, 1, 0.1, 0.1,4, 1, 3,// 0'


        ])
    }
    function makeIcosahedron(){
      icosahedronVerts = new Float32Array([
        //Icosahedron--------------
    0,  b, -a, 1, 0.6, 0.45, 0.87, 1, 1, 1,
    -b,  a,  0, 1, 0.92, 0.46, 0.76, 1, 1, 1,
    b,  a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,

    -b,  a,  0, 1, 0.92, 0.46, 0.76, 1, 1, 1,
    0,  b,  a, 1, 0.6, 0.45, 0.87, 1, 1, 1,
    b,  a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,

     0, -b,  a, 1, 0.92, 0.46, 0.76, 1, 1, 1,
     0,  b,  a, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     -a,  0,  b, 1, 0.6, 0.45, 0.87, 1, 1, 1,

     a,  0,  b, 1, 0.92, 0.46, 0.76, 1, 1, 1,
     0,  b,  a, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     0, -b,  a, 1, 0.92, 0.46, 0.76, 1, 1, 1,

     0, -b, -a, 1, 0.6, 0.45, 0.87, 1, 1, 1,//
     0,  b, -a, 1,0.6, 0.45, 0.87, 1, 1, 1,
     a,  0, -b, 1, 0.92, 0.46, 0.76, 1, 1, 1,

    -a,  0, -b, 1, 0.92, 0.46, 0.76, 1, 1, 1,
    0,  b, -a, 1, 0.6, 0.45, 0.87, 1, 1, 1,
    0, -b, -a, 1, 0.6, 0.45, 0.87, 1, 1, 1,

     b, -a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     0, -b,  a, 1, 0.92, 0.46, 0.76, 1, 1, 1,
     -b, -a, 0, 1, 1, 1, 1, 1, 1, 1,

    -b, -a, 0, 1, 1, 1, 1, 1, 1, 1,
    0, -b, -a, 1, 0.6, 0.45, 0.87, 1, 1, 1,
    b, -a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,

    -a,  0,  b, 1, 0.6, 0.45, 0.87, 1, 1, 1,
    -b,  a,  0, 1, 0.92, 0.46, 0.76, 1, 1, 1,
    -a,  0, -b, 1, 0.92, 0.46, 0.76, 1, 1, 1,

    -a,  0, -b, 1, 0.92, 0.46, 0.76, 1, 1, 1,
    -b, -a,  0, 1, 1, 1, 1, 1, 1, 1,
    -a,  0,  b, 1, 0.6, 0.45, 0.87, 1, 1, 1,

     a,  0, -b, 1, 0.92, 0.46, 0.76, 1, 1, 1,
     b,  a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     a,  0,  b, 1, 0.92, 0.46, 0.76, 1, 1, 1,

     a,  0,  b, 1, 0.92, 0.46, 0.76, 1, 1, 1,
     b, -a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     a,  0, -b, 1, 0.92, 0.46, 0.76, 1, 1, 1,

    -a,  0,  b, 1, 0.6, 0.45, 0.87, 1, 1, 1,
    0,  b,  a,  1, 0.6, 0.45, 0.87, 1, 1, 1,
    -b,  a,  0, 1, 0.92, 0.46, 0.76, 1, 1, 1,

     b,  a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     0,  b,  a, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     a,  0,  b, 1, 0.92, 0.46, 0.76, 1, 1, 1,

    -b,  a,  0, 1, 0.92, 0.46, 0.76, 1, 1, 1,
    0,  b, -a,  1, 0.6, 0.45, 0.87, 1, 1, 1,
    -a,  0, -b, 1, 0.92, 0.46, 0.76,1, 1, 1,

     a,  0, -b, 1, 0.92, 0.46, 0.76, 1, 1, 1,
     0,  b, -a, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     b,  a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,

    -a,  0, -b, 1, 0.92, 0.46, 0.76,1, 1, 1, 
    0, -b, -a,  1, 0.6, 0.45, 0.87, 1, 1, 1,
    -b, -a,  0, 1, 1, 1, 1, 1, 1, 1,

     b, -a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     0, -b, -a, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     a,  0, -b, 1, 0.92, 0.46, 0.76, 1, 1, 1,

    -b, -a,  0, 1, 1, 1, 1, 1, 1, 1,
    0, -b,  a,  1, 0.92, 0.46, 0.76, 1, 1, 1,
    -a,  0,  b, 1, 0.6, 0.45, 0.87, 1, 1, 1,

     a,  0,  b, 1, 0.92, 0.46, 0.76, 1, 1, 1,
     0, -b,  a, 1, 0.92, 0.46, 0.76, 1, 1, 1,
     b, -a,  0, 1, 0.6, 0.45, 0.87, 1, 1, 1,
     //295 + 60
        ])
    }

    function makeTop(){
      topVerts = new Float32Array([
        //spinning tops--------------------------------------------
    //top
    1, 1, 0.5, 1, 0.6, 0.45, 0.87, 1, -2, 2.5, // 0
    0, 1, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    0.5, 0, 1, 1, 1, 1, 1, 1, -2, 2.5,//  1

    0.5, 0, 1, 1, 1, 1, 1,1, -2, 2.5,//  1
    0, 1, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    -0.5, 1, 1, 1, 0.6, 0.45, 0.87,1, -2, 2.5,//  2

    -0.5, 1, 1, 1, 0.6, 0.45, 0.87,1, -2, 2.5,//  2
    0, 1, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    -1, 0, 0.5, 1, 1, 1, 1,1, -2, 2.5,//  3

    -1, 0, 0.5, 1, 1, 1, 1,1, -2, 2.5,//  3
    0, 1, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    -1, 1, -0.5, 1, 0.6, 0.45, 0.87,1, -2, 2.5,//  4

    -1, 1, -0.5, 1, 0.6, 0.45, 0.87,1, -2, 2.5,//  4
    0, 1, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    -0.5, 0, -1, 1, 1, 1, 1,1, -2, 2.5,//  5
    
    -0.5, 0, -1, 1, 1, 1, 1,1, -2, 2.5,//  5
    0, 1, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    0.5, 1, -1, 1, 0.6, 0.45, 0.87,1, -2, 2.5,//  6

    0.5, 1, -1, 1, 0.6, 0.45, 0.87,1, -2, 2.5,// 6
    0, 1, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    1, 0, -0.5, 1, 1, 1, 1, 1, -2, 2.5,// 7

    1, 0, -0.5, 1, 1, 1, 1, 1, -2, 2.5,// 7
    0, 1, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    1, 1, 0.5, 1, 0.6, 0.45, 0.87,1, -2, 2.5,// 0

        ])
    }

    function makeBottom(){
      bottomVerts = new Float32Array([
        //---------------------------------------------------------
   //botton
    1, 1, 0.5, 1, 0.6, 0.45, 0.87, 1, -2, 2.5,// 0
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    0.5, 0, 1, 1, 1, 1, 1,1, -2, 2.5,// 1

    0.5, 0, 1, 1, 1, 1, 1,1, -2, 2.5,// 1
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    -0.5, 1, 1, 1, 0.6, 0.45, 0.87,1, -2, 2.5,// 2

    -0.5, 1, 1.0, 1, 0.6, 0.45, 0.87,1, -2, 2.5,// 2
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    -1, 0, 0.5, 1, 1, 1, 1,1, -2, 2.5,// 3

    -1, 0, 0.5, 1, 1, 1, 1,1, -2, 2.5,// 3
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    -1, 1, -0.5, 1, 0.6, 0.45, 0.87,1, -2, 2.5,// 4

    -1, 1, -0.5, 1, 0.6, 0.45, 0.87,1, -2, 2.5,// 4
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    -0.5, 0, -1, 1, 1, 1, 1,1, -2, 2.5,// 5

    -0.5, 0, -1, 1, 1, 1, 1,1, -2, 2.5,// 5
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    0.5, 1, -1, 1, 0.6, 0.45, 0.87,1, -2, 2.5,// 6

    0.5, 1, -1, 1, 0.6, 0.45, 0.87,1, -2, 2.5,// 6
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    1, 0, -0.5, 1, 1, 1, 1, 1, -2, 2.5,// 7

    1, 0, -0.5, 1, 1, 1, 1, 1, -2, 2.5,// 7
    0, -1.5, 0, 1, 0.92, 0.46, 0.76,1, -2, 2.5,// 8
    1, 1, 0.5, 1, 0.6, 0.45, 0.87,1, -2, 2.5,// 0



        ])
    }

    function makeTree(){
      treeVerts = new Float32Array([
        -1,1,0,1, 0.13,0.68,0.05, 1, 1, 1, 
        1,1,0,1, 0.13,0.68,0.05, 1, 1, 1, 
        0,4,0,1, 0.31, 0.81, 0.24, 1, 1, 1, 

        0,1,1,1, 0.13,0.68,0.05, 1, 1, 1,
        0,1,-1,1, 0.13,0.68,0.05, 1, 1, 1, 
        0,4,0,1, 0.31, 0.81, 0.24, 1, 1, 1, 

        0.2, 0, 0,1, 0.31, 0.81, 0.24, 1, 1, 1, 
        -0.2, 0, 0,1, 0.31, 0.81, 0.24, 1, 1, 1, 
        0,4,0,1, 0.31, 0.81, 0.24, 1, 1, 1, 

        0, 0, 0.2, 1, 0.31, 0.81, 0.24, 1, 1, 1, 
        0, 0, -0.2, 1, 0.31, 0.81, 0.24, 1, 1, 1, 
        0,4,0,1, 0.31, 0.81, 0.24, 1, 1, 1, 


        ])


    }
    function makeSphere() {
    //==============================================================================
    // Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
    // equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
    // and connect them as a 'stepped spiral' design (see makeCylinder) to build the
    // sphere from one triangle strip.
      var slices = 40;    // # of slices of the sphere along the z axis. >=3 req'd
                          // (choose odd # or prime# to avoid accidental symmetry)
      var sliceVerts  = 27; // # of vertices around the top edge of the slice
                          // (same number of vertices on bottom of slice, too)
      var topColr = new Float32Array([0.9, 0.9, 0.9]);  // North Pole
      var equColr = new Float32Array([0.9, 0.9, 0.9]);  // Equator
      var botColr = new Float32Array([0.9, 0.9, 0.9]);  // South Pole
      var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

      // Create a (global) array to hold this sphere's vertices:
      sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
                        // # of vertices * # of elements needed to store them. 
                        // each slice requires 2*sliceVerts vertices except 1st and
                        // last ones, which require only 2*sliceVerts-1.
                        
      // Create dome-shaped top slice of sphere at z=+1
      // s counts slices; v counts vertices; 
      // j counts array elements (vertices * elements per vertex)
      var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
      var sin0 = 0.0;
      var cos1 = 0.0;
      var sin1 = 0.0; 
      var j = 0;              // initialize our array index
      var isLast = 0;
      var isFirst = 1;
      for(s=0; s<slices; s++) { // for each slice of the sphere,
        // find sines & cosines for top and bottom of this slice
        if(s==0) {
          isFirst = 1;  // skip 1st vertex of 1st slice.
          cos0 = 1.0;   // initialize: start at north pole.
          sin0 = 0.0;
        }
        else {          // otherwise, new top edge == old bottom edge
          isFirst = 0;  
          cos0 = cos1;
          sin0 = sin1;
        }               // & compute sine,cosine for new bottom edge.
        cos1 = Math.cos((s+1)*sliceAngle);
        sin1 = Math.sin((s+1)*sliceAngle);
        // go around the entire slice, generating TRIANGLE_STRIP verts
        // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
        if(s==slices-1) isLast=1; // skip last vertex of last slice.
        for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) { 
          if(v%2==0)
          {       // put even# vertices at the the slice's top edge
                  // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
                  // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
            sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
            sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
            sphVerts[j+2] = cos0;   
            sphVerts[j+3] = 1.0;      
          }
          else {  // put odd# vertices around the slice's lower edge;
                  // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
                  //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
            sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
            sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
            sphVerts[j+2] = cos1;                                       // z
            sphVerts[j+3] = 1.0;                                        // w.   
          }
          if(s==0) {  // finally, set some interesting colors for vertices:
            sphVerts[j+4]=topColr[0]; 
            sphVerts[j+5]=topColr[1]; 
            sphVerts[j+6]=topColr[2];
            sphVerts[j+7]=1;
            sphVerts[j+8]=0;
            sphVerts[j+9]=0; 
            }
          else if(s==slices-1) {
            sphVerts[j+4]=botColr[0]; 
            sphVerts[j+5]=botColr[1]; 
            sphVerts[j+6]=botColr[2];
            sphVerts[j+7]=1;
            sphVerts[j+8]=0;
            sphVerts[j+9]=0; 
          }
          else {
              sphVerts[j+4]=0.5 + Math.random()+ currentAngle*0.03/10000;// equColr[0]; 
              sphVerts[j+5]=0.5+ Math.random() + currentAngle*0.001/10000;// equColr[1]; 
              sphVerts[j+6]=0.5 + Math.random()+ currentAngle*0.05/10000;// equColr[2];
              sphVerts[j+7]=1;
              sphVerts[j+8]=0;
              sphVerts[j+9]=0;          
          }
        }
      }
    }
    function makeStar(){
      var t = 2*Math.PI/360;
      var r = Math.sin(18*t)/Math.sin(36*t);

      starVerts = new Float32Array([
        // Math.cos(0), Math.sin(0), 0, 1, 1, 1, 0, 1, 1, 1, //1
        // r*Math.cos(36*t), r*Math.sin(36*t), 0, 1, 1, 0, 0, 1, 1, 1, //2
        // Math.cos(72*t), Math.sin(72*t), 0, 1, 1, 1, 0, 1, 1, 1, //3
        // r*Math.cos((36+72)*t), r*Math.sin((36+72)*t), 0, 1, 1, 0, 0, 1, 1, 1, //4
        // Math.cos(72*2*t), Math.sin(72*2*t), 0, 1, 1, 1, 0, 1, 1, 1, //5
        // r*Math.cos((36+72*2)*t), r*Math.sin((36+72*2)*t), 0, 1, 1, 0, 0, 1, 1, 1, //6
        // Math.cos(72*3*t), Math.sin(72*3*t), 0, 1, 1, 1, 0, 1, 1, 1, //7
        // r*Math.cos((36+72*3)*t), r*Math.sin((36+72*3)*t), 0, 1, 1, 0, 0, 1, 1, 1, //8
        // Math.cos(72*4*t), Math.sin(72*4*t), 0, 1, 1, 1, 0, 1, 1, 1, //9
        // r*Math.cos((36+72*4)*t), r*Math.sin((36+72*4)*t), 0, 1, 1, 0, 0, 1, 1, 1, //10


        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(0), Math.sin(0), 0, 1, 1, 1, 0, 1, 1, 1, //1
        r*Math.cos(36*t), r*Math.sin(36*t), 0, 1, 1, 0, 0, 1, 1, 1, //2

        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0
        r*Math.cos(36*t), r*Math.sin(36*t), 0, 1, 1, 0, 0, 1, 1, 1, //2
        Math.cos(72*t), Math.sin(72*t), 0, 1, 1, 1, 0, 1, 1, 1, //3

        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(72*t), Math.sin(72*t), 0, 1, 1, 1, 0, 1, 1, 1, //3
        r*Math.cos((36+72)*t), r*Math.sin((36+72)*t), 0, 1, 1, 0, 0, 1, 1, 1, //4

        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0    
        r*Math.cos((36+72)*t), r*Math.sin((36+72)*t), 0, 1, 1, 0, 0, 1, 1, 1, //4
        Math.cos(72*2*t), Math.sin(72*2*t), 0, 1, 1, 1, 0, 1, 1, 1, //5

        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(72*2*t), Math.sin(72*2*t), 0, 1, 1, 1, 0, 1, 1, 1, //5
        r*Math.cos((36+72*2)*t), r*Math.sin((36+72*2)*t), 0, 1, 1, 0, 0, 1, 1, 1, //6

        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0
        r*Math.cos((36+72*2)*t), r*Math.sin((36+72*2)*t), 0, 1, 1, 0, 0, 1, 1, 1, //6
        Math.cos(72*3*t), Math.sin(72*3*t), 0, 1, 1, 1, 0, 1, 1, 1, //7

        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(72*3*t), Math.sin(72*3*t), 0, 1, 1, 1, 0, 1, 1, 1, //7
        r*Math.cos((36+72*3)*t), r*Math.sin((36+72*3)*t), 0, 1, 1, 0, 0, 1, 1, 1, //8

        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0
        r*Math.cos((36+72*3)*t), r*Math.sin((36+72*3)*t), 0, 1, 1, 0, 0, 1, 1, 1, //8
        Math.cos(72*4*t), Math.sin(72*4*t), 0, 1, 1, 1, 0, 1, 1, 1, //9

        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(72*4*t), Math.sin(72*4*t), 0, 1, 1, 1, 0, 1, 1, 1, //9
        r*Math.cos((36+72*4)*t), r*Math.sin((36+72*4)*t), 0, 1, 1, 0, 0, 1, 1, 1, //10

        0, 0, 0.3, 1, 1, 1, 1, 1, 1, 1, //0
        r*Math.cos((36+72*4)*t), r*Math.sin((36+72*4)*t), 0, 1, 1, 0, 0, 1, 1, 1, //10
        Math.cos(0), Math.sin(0), 0, 1, 1, 1, 0, 1, 1, 1, //1

   //     
        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(0), Math.sin(0), 0, 1, 1, 1, 0, 1, 1, 1, //1
        r*Math.cos(36*t), r*Math.sin(36*t), 0, 1, 1, 0, 0, 1, 1, 1, //2

        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0
        r*Math.cos(36*t), r*Math.sin(36*t), 0, 1, 1, 0, 0, 1, 1, 1, //2
        Math.cos(72*t), Math.sin(72*t), 0, 1, 1, 1, 0, 1, 1, 1, //3

        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(72*t), Math.sin(72*t), 0, 1, 1, 1, 0, 1, 1, 1, //3
        r*Math.cos((36+72)*t), r*Math.sin((36+72)*t), 0, 1, 1, 0, 0, 1, 1, 1, //4

        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0    
        r*Math.cos((36+72)*t), r*Math.sin((36+72)*t), 0, 1, 1, 0, 0, 1, 1, 1, //4
        Math.cos(72*2*t), Math.sin(72*2*t), 0, 1, 1, 1, 0, 1, 1, 1, //5

        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(72*2*t), Math.sin(72*2*t), 0, 1, 1, 1, 0, 1, 1, 1, //5
        r*Math.cos((36+72*2)*t), r*Math.sin((36+72*2)*t), 0, 1, 1, 0, 0, 1, 1, 1, //6

        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0
        r*Math.cos((36+72*2)*t), r*Math.sin((36+72*2)*t), 0, 1, 1, 0, 0, 1, 1, 1, //6
        Math.cos(72*3*t), Math.sin(72*3*t), 0, 1, 1, 1, 0, 1, 1, 1, //7

        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(72*3*t), Math.sin(72*3*t), 0, 1, 1, 1, 0, 1, 1, 1, //7
        r*Math.cos((36+72*3)*t), r*Math.sin((36+72*3)*t), 0, 1, 1, 0, 0, 1, 1, 1, //8

        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0
        r*Math.cos((36+72*3)*t), r*Math.sin((36+72*3)*t), 0, 1, 1, 0, 0, 1, 1, 1, //8
        Math.cos(72*4*t), Math.sin(72*4*t), 0, 1, 1, 1, 0, 1, 1, 1, //9

        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0
        Math.cos(72*4*t), Math.sin(72*4*t), 0, 1, 1, 1, 0, 1, 1, 1, //9
        r*Math.cos((36+72*4)*t), r*Math.sin((36+72*4)*t), 0, 1, 1, 0, 0, 1, 1, 1, //10

        0, 0, -0.3, 1, 1, 1, 1, 1, 1, 1, //0
        r*Math.cos((36+72*4)*t), r*Math.sin((36+72*4)*t), 0, 1, 1, 0, 0, 1, 1, 1, //10
        Math.cos(0), Math.sin(0), 0, 1, 1, 1, 0, 1, 1, 1, //1

        ])

    }
    function makeCoordinate(){
      coordVerts = new Float32Array([
        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 
        1, 0, 0, 1, 1, 0, 0, 1, 1, 1, //x red

        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 
        0, 1, 0, 1, 0, 1, 0, 1, 1, 1, //y green

        0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 
        0, 0, 1, 1, 0, 0, 1, 1, 1, 1, //z blue

        ])
    }

