/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 *
 * @author Joshua Cuneo
 */

var gl;
var program;

var points;
var colors;
var theta = 0;
var alpha = 0;
var dataArray = [];


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
			//console.log(4);

			var reader = new FileReader();
			//console.log(5);
			reader.onload = function(e) {
					fileDisplayArea.value = reader.result;
					var data = reader.result;
					//console.log(reader.result);
					var dataArrayProv = data.split(" ");
					for(var i = 0; i < dataArrayProv.length; i++) {
						console.log(i);

						var elem = dataArrayProv[i];


						if (isNumeric(elem) && elem !== "") {
							dataArray.push(elem);
							console.log(elem);

						}
					}
					document.getElementById("parr").innerHTML = dataArray;



			}
			//console.log(6);

			reader.readAsText(file);



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
	points = [];
	points.push(vec4(-0.5, -0.5, 0.0, 1.0));
	points.push(vec4(0.5, -0.5, 0.0, 1.0));
	points.push(vec4(0.0, 0.5, 0.0, 1.0));


	//Create the buffer object
	var vBuffer = gl.createBuffer();

	//Bind the buffer object to a target
	//The target tells WebGL what type of data the buffer object contains,
	//allowing it to deal with the contents correctly
	//gl.ARRAY_BUFFER - specifies that the buffer object contains vertex data
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

	//Allocate storage and write data to the buffer
	//Write the data specified by the second parameter into the buffer object
	//bound to the first parameter
	//We use flatten because the data must be a single array of ints, uints, or floats (float32 or float64)
	//This is a typed array, and we can't use push() or pop() with it
	//
	//The last parameter specifies a hint about how the program is going to use the data
	//stored in the buffer object. This hint helps WebGL optimize performance but will not stop your
	//program from working if you get it wrong.
	//STATIC_DRAW - buffer object data will be specified once and used many times to draw shapes
	//DYNAMIC_DRAW - buffer object data will be specified repeatedly and used many times to draw shapes
	gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

	//Get the location of the shader's vPosition attribute in the GPU's memory
	var vPosition = gl.getAttribLocation(program, "vPosition");

	//Specifies how shader should pull the data
	//A hidden part of gl.vertexAttribPointer is that it binds the current ARRAY_BUFFER to the attribute.
	//In other words now this attribute is bound to vColor. That means we're free to bind something else
	//to the ARRAY_BUFFER bind point. The attribute will continue to use vPosition.
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

	//Turns the attribute on
	gl.enableVertexAttribArray(vPosition);

	//Specify the vertex size
	var offsetLoc = gl.getUniformLocation(program, "vPointSize");
	gl.uniform1f(offsetLoc, 10.0);

	/*** COLOR DATA ***/
	colors = [];
	colors.push(vec4(1.0, 0.0, 0.0, 1.0));
	colors.push(vec4(0.0, 1.0, 0.0, 1.0));
	colors.push(vec4(0.0, 0.0, 1.0, 1.0));

	var cBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	var vColor = gl.getAttribLocation(program, "vColor");
	gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vColor);

	//This is how we handle extents
	var thisProj = ortho(-1, 1, -1, 1, -1, 1);

	var projMatrix = gl.getUniformLocation(program, 'projMatrix');
	gl.uniformMatrix4fv(projMatrix, false, flatten(thisProj));


	// Set clear color
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	//Necessary for animation
	render();

}

function render() {
	var rotMatrix = rotateX(theta);
	var translateMatrix = translate(alpha, 0, 0);
	var ctMatrix = mult(translateMatrix, rotMatrix);

	theta -= 0.5;
	alpha += 0.005;

	var ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
	gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

	gl.clear(gl.COLOR_BUFFER_BIT);

	//gl.drawArrays(gl.POINTS, 0, points.length);
	gl.drawArrays(gl.TRIANGLES, 0, points.length);

	requestAnimationFrame(render);
}
