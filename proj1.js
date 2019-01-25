/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 *
 * @author Joshua Cuneo
 */
var nr = 0;
var gl;
var program;

var colors = [];
var theta = 0;
var alpha = 0;
var myArray = [];

var userPoints = [];
var numberPointsEachPolyline = [];
var drawMode = true;
const NR_POLYLINES_LINE = 3;

function isNumeric(num) {
    return !isNaN(num);
}

//--------------------------------
function readFromInput() {
    var fileInput = document.getElementById('fileInput');
    var fileDisplayArea = document.getElementById('fileDisplayArea');
    //console.log(3);
    fileInput.addEventListener('change', function (e) {
        var file = fileInput.files[0];

        var reader = new FileReader();
        reader.onload = function (e) {
            var data = reader.result.split(/\r\n?|\n/);
            var nrOfPolylines = parseInt(data[NR_POLYLINES_LINE]);
            console.log(data);
            //we create a matrix, every row (array) of which we will convert to vec4 using Vec4(a[0], a[1], a[2], a[3]);, where a is the matrix
            //var matrix = [];
            /*for (var i = 0; i < nrOfPolylines; i++) {
                userPoints[i] = [];
            }*/
            var startPoly = NR_POLYLINES_LINE + 1; //line where the number of points of each polyline is indicated
            for (var i = 0; i < nrOfPolylines; i++) { // i is the polyline we are looking at

                const nrPointsInPolyline = parseInt(data[startPoly]);
                console.log(nrPointsInPolyline);
                numberPointsEachPolyline.push(nrPointsInPolyline); // this arrays keeps track of the number of point of each polyline, so we can draw them separatelly
                for (var j = 0; j < nrPointsInPolyline; j++) {
                    // now we process the data
                    var floats = data[startPoly+ j + 1].match(/[+-]?\d+(\.\d+)?/g).map(function (v) { //startPoly+ j + 1 IS THE POSITION OF THE jTH point of the ith point
                        return parseFloat(v);
                    });
                    var xval = floats[0];
                    var yval = floats[1];
                    console.log(xval + " " + yval);
                    userPoints.push(vec4(xval, yval, 0.0, 1.0));
                    //userPoints[i].push(data[startPoly+j + 1]); // since we start with i=0, we want to retrieve the data stored in the [NR_POLYLINES_LINE+j]th position of the matrix, since one position is occupied by the number of points in that polyline
                }
                startPoly = startPoly + nrPointsInPolyline + 1; //  because of the first time we defined this var

                /*if (data[i].length === 16) {  //workaround for getting the x and y coord lines and ignoring others

                }*/
            }
            console.log("userpoints length = " + userPoints.length);
            drawPolylineFromInput();
        };

        reader.readAsText(file);

        //userPoints = [];
        //render(); //added not sure
    });
}


function drawPolylineFromInput() {
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas, undefined);
    if (!gl) {
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
    gl.viewport(0, 0, canvas.width, canvas.height);

    /**********************************
     * Points, Lines, and Fill
     **********************************/

    /*** VERTEX DATA ***/
        //Define the positions of our points
        //Note how points are in a range from 0 to 1
    //Create the buffer object
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    var startPos = 0;
    for (var i = 0; i < numberPointsEachPolyline.length; i++) {
        gl.bufferData(gl.ARRAY_BUFFER, flatten(userPoints.slice(startPos, numberPointsEachPolyline[i])), gl.STATIC_DRAW); //slice(a, b) is a inclusive, b exclusive
        //don't forget the draw stuff
        gl.drawArrays(gl.LINE_STRIP, 0, numberPointsEachPolyline[i]);
        startPos = startPos + numberPointsEachPolyline[i];
        console.log(i);
    }


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
    //userPoints = []; // we want to clear the canvas after we finish with one drawing
}
//--------------------------------
function main() {
    readFromInput();
    console.log("hello");
    //console.log(userPoints.length);
    // Retrieve <canvas> element





    //Necessary for animation


    canvas.addEventListener("mousedown", function (event) {
        //console.log(2 * event.clientX / canvas.width - 1);
        //console.log(2 * (canvas.height - event.clientY) / canvas.height - 1);
        //if(draw === true){

        userPoints.push(vec4(2 * event.clientX / canvas.width - 1,
            2 * (canvas.height - event.clientY) / canvas.height - 1), 0.0, 1.0);
        console.log(userPoints.length);
        //colors.push(vec4(0.0, 0.0, 0.0, 1.0)); // black
        //}
    });

    //render();
}

function render() {

    //console.log(nr++);

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
