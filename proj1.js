/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 *
 * @author Joshua Cuneo
 */
var nr = 0;
var gl;
var program;

var colors =[];
var theta = 0;
var alpha = 0;
var myArray = [];

var userPoints= [];
var drawMode = true;


function isNumeric(num){
	return !isNaN(num);
}
//--------------------------------
function readFromInput() {
	var fileInput = document.getElementById('fileInput');
	var fileDisplayArea = document.getElementById('fileDisplayArea');
	//console.log(3);
	fileInput.addEventListener('change', function(e) {
       var file = fileInput.files[0];

       var reader = new FileReader();
       reader.onload = function(e) {
           var data = reader.result.split(/\r\n?|\n/);
           for(var i=0; i < data.length; i++){
               if(data[i].length === 16){  //workaround for getting the x and y coord lines and ignoring others
                   var floats = data[i].match(/[+-]?\d+(\.\d+)?/g).map(function(v) { return parseFloat(v); });
                   var xval = floats[0];
                   var yval = floats[1];
                   userPoints.push(vec4(xval, yval, 0.0, 1.0));
               }
           }
       };
       reader.readAsText(file);
       userPoints = [];
			 //render(); //added not sure
   });
}

//--------------------------------
function main()
{
	window.onload = readFromInput();
	// Retrieve <canvas> element
	var canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, undefined);
	if (!gl)
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	// This function call will create a shader, upload the GLSL source, and compile the shader
	program = initShaders(gl, "vshader", "fshader");

	// We tell WebGL which shader program to execute.
	gl.useProgram(program);

	//Set up the viewport
	//x, y - specify the lower-left corner of the viewport rectangle (in pixels)
	//In WebGL, x and y are specified in the <canvas> coordinate system
	//width, height - specify the width and height of the viewport (in pixels)
	//canvas is the window, and viewport is the viewing area within that window
		//This tells WebGL the -1 +1 clip space maps to 0 <-> gl.canvas.width for x and 0 <-> gl.canvas.height for y
	gl.viewport( 0, 0, canvas.width, canvas.height );

	/**********************************
	* Points, Lines, and Fill
	**********************************/

	/*** VERTEX DATA ***/
	//Define the positions of our points
	//Note how points are in a range from 0 to 1


	//Create the buffer object
	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(userPoints), gl.STATIC_DRAW);

	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	//Get the location of the shader's vPosition attribute in the GPU's memory
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);




	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	//This is how we handle extents
	//var thisProj = ortho(-1, 1, -1, 1, -1, 1);



	// Set clear color
	gl.clearColor(1.0, 1.0, 1.0, 1.0);

	//Necessary for animation


	canvas.addEventListener("mousedown", function(event) {
    //console.log(2 * event.clientX / canvas.width - 1);
    //console.log(2 * (canvas.height - event.clientY) / canvas.height - 1);
    //if(draw === true){

        userPoints.push(vec4(2 * event.clientX / canvas.width - 1,
            2 * (canvas.height - event.clientY) / canvas.height - 1), 0.0, 1.0);
						console.log(userPoints.length);
        //colors.push(vec4(0.0, 0.0, 0.0, 1.0)); // black
    //}
  });

  render();
}

function render() {

	console.log(nr++);

	/*
	var rotMatrix = rotateX(theta);
	var translateMatrix = translate(alpha, 0, 0);
	var ctMatrix = mult(translateMatrix, rotMatrix);

	theta -= 0.5;
	alpha += 0.005;

	var ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT);

	//gl.drawArrays(gl.POINTS, 0, points.length);
	 */



		 gl.clear(gl.COLOR_BUFFER_BIT);
		 gl.bufferData(gl.ARRAY_BUFFER, flatten(userPoints), gl.STATIC_DRAW);
		 gl.drawArrays(gl.LINE_STRIP, 0, userPoints.length);



	requestAnimationFrame(render);
}
