/*
 * Some comments quoted from WebGL Programming Guide
 * by Matsuda and Lea, 1st edition.
 *
 * @author Joshua Cuneo
 */
var nr = 0;
var gl;
var program;


var theta = 0;
var alpha = 0;

var userPoints = [];
var colors = [];
var numberPointsEachPolyline = [];
var draw = false;
var NR_POLYLINES_LINE = 0;
//var projMat = ortho(1, 1, 1, 1, 1, 1);
var inputDiv;
var canvas;
var header;
var colorArray = [
    vec4(0.0, 0.0, 0.0, 1.0),
    vec4(1.0, 0.0, 0.0, 1.0),
    vec4(0.0, 1.0, 0.0, 1.0),
    vec4(0.0, 0.0, 1.0, 1.0)
];
var colorIdx = 0;





function drawPolylineFromInput() {
    // TODO CHECK THE RATIO OF THE IMAGE AND THEN RESCALE THE VIEWPORT? OR THE ORTHO? I THINK THE ORTHO, WICH IS FOUND AS A GLOBAL VARIABLE
    //console.log("We are in the drawPolyLineFromInput");

    gl.viewport(0, 0, canvas.width, canvas.height);

    /**********************************
     * Points, Lines, and Fill
     **********************************/

    /*** VERTEX DATA ***/
    //Define the positions of our points
    //Note how points are in a range from 0 to 1
    //Create the buffer object

    //console.log(userPoints);
    colors = [];

    for(var i=0; i<userPoints.length;i++){
        colors.push(colorArray[colorIdx]);

    }
    var startPos = 0;
    for (var i = 0; i <= numberPointsEachPolyline.length; i++) {
        //console.log("start pos: " + startPos + ", until " + numberPointsEachPolyline[i]);
        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        var partOfUserPoints = userPoints.slice(startPos, startPos + numberPointsEachPolyline[i]);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(partOfUserPoints), gl.STATIC_DRAW); //slice(a, b) is a inclusive, b exclusive


        var vPosition = gl.getAttribLocation(program, "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);


        var partOfColors = colors.slice(startPos, startPos + numberPointsEachPolyline[i]);

        var cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(partOfColors), gl.STATIC_DRAW);

        var vColor = gl.getAttribLocation(program, "vColor");
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);


        //don't forget the draw stuff
        //Get the location of the shader's vPosition attribute in the GPU's memory

        //console.log(numberPointsEachPolyline[i] + "must be equal to " + partOfUserPoints.length + " and equal to " + partOfColors.length);
        gl.drawArrays(gl.LINE_STRIP, 0, numberPointsEachPolyline[i]);
        startPos = startPos + numberPointsEachPolyline[i];

        // var projMatrix = gl.getUniformLocation(program, "projMat");
        // gl.uniformMatrix4fv(projMatrix, false, flatten(projMat));

        //console.log(i);
    }




    //This is how we handle extents
    //var thisProj = ortho(-1, 1, -1, 1, -1, 1);


    // Set clear color
    //gl.clearColor(1.0, 1.0, 1.0, 1.0);
    //userPoints = []; // we want to clear the canvas after we finish with one drawing
}

function main() {
    canvas = document.getElementById('webgl');
    header = document.getElementById('header');

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


    window.onkeypress = function(event) {
        var key = event.key;
        switch(key) {
            case 'f':
                draw = false;
                gl.clearColor(1.0, 1.0, 1.0, 1.0); // we can avoid this if we want to use the same background
                gl.clear(gl.COLOR_BUFFER_BIT);
                inputDiv.style.visibility = "visible";
                header.innerHTML = "File Mode";
                fileMode();

                break;
            case 'd':

                userPoints = [];
                colors = [];
                gl.clear(gl.ARRAY_BUFFER);
                console.log(userPoints);
                draw = true;
                gl.clearColor(1.0, 1.0, 1.0, 1.0); // we can avoid this if we want to use the same background
                gl.clear(gl.COLOR_BUFFER_BIT);
                inputDiv.style.visibility = "hidden";
                header.innerHTML = "Draw Mode";
                break;

            case 'c':
                colorIdx= (colorIdx + 1)%4;
                if (!draw) {
                    drawPolylineFromInput();
                } else {
                    render();
                }
        }
    }



    var fileInput = document.getElementById('fileInput');
    inputDiv = document.getElementById('inputDiv');
    fileInput.addEventListener('change', function (e) {
        userPoints = [];
        colors = [];
        gl.clear(gl.ARRAY_BUFFER);
        gl.clear(gl.COLOR_BUFFER_BIT);
        //gl.clear(gl.ARRAY_BUFFER);
        //TODO ADD THE ORTHO THINGY

        console.log("FROM INPUT HANDLER: points size: " + userPoints.length + ", colors size: " + colors.length);
        //gl.clear(gl.ARRAY_BUFFER);
        var file = fileInput.files[0];

        var reader = new FileReader();
        reader.onload = function (e) {
            var data = reader.result.split(/\r\n?|\n/);

            //here we will check which is the line of the data that contains the number of polylines
            if (data[0].charAt(0) === 'f') {
                if(data[1].charAt(0) === '*') {
                    NR_POLYLINES_LINE = 3;
                } else {
                    NR_POLYLINES_LINE = 4;
                }
            }
            var nrOfPolylines = parseInt(data[NR_POLYLINES_LINE]);

            console.log(nrOfPolylines);

            var startPoly = NR_POLYLINES_LINE + 1; //line where the number of points of each polyline is indicated

            for (var i = 0; i < nrOfPolylines; i++) { // i is the polyline we are looking at

                const nrPointsInPolyline = parseInt(data[startPoly]);
                //console.log(nrPointsInPolyline);
                // this arrays keeps track of the number of point of each polyline, so we can draw them separatelly
                numberPointsEachPolyline.push(nrPointsInPolyline);
                for (var j = 0; j < nrPointsInPolyline; j++) {

                    // now we process the data
                    //startPoly+ j + 1 IS THE POSITION OF THE jth point of the ith polyline
                    var floats = data[startPoly+ j + 1].match(/[+-]?\d+(\.\d+)?/g).map(function (v) {
                        return parseFloat(v);
                    });
                    var xval = floats[0];
                    var yval = floats[1];
                    //console.log(xval + " " + yval);
                    userPoints.push(vec4(xval, yval, 0.0, 1.0));
                }

                startPoly = startPoly + nrPointsInPolyline + 1; //  because of the first time we defined this var

            }

            drawPolylineFromInput();

        };

        reader.readAsText(file);

        //userPoints = [];

        //render(); //added not sure
    });



    /*canvas.addEventListener("mousedown", function (event) {
        //console.log(2 * event.clientX / canvas.width - 1);
        //console.log(2 * (canvas.height - event.clientY) / canvas.height - 1);
        if(draw === true){
            var pos = getMousePos(canvas, event);
            /!*userPoints.push(vec4(2 * event.clientX / canvas.width - 1,
                2 * (canvas.height - event.clientY) / canvas.height - 1, 0.0, 1.0));*!/
            colors.push(vec4(1.0, 0.0, 0.0, 1.0));
            //console.log(userPoints.length);
            //colors.push(vec4(0.0, 0.0, 0.0, 1.0)); // black
            //}
            render();
        }


    });*/

    //render();
    // In draw mode, if the user clicks in the canvas, store that location into point array
    canvas.addEventListener("mousedown", function(event){
        if(draw === true){

            //store the mouse position
            var position = getMousePos(canvas, event);

            // push that poisition and manipulate it from webGL to work in the canvas
            userPoints.push(vec4(position.x/canvas.width, (canvas.height - position.y)/canvas.height, 0.0, 1.0));
        }
        render();
    });
}

// get the mouse position on the canvas to log the vertices
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}



/*function render() {

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer); // we make it an active buffer
    gl.bufferData(gl.ARRAY_BUFFER, flatten(userPoints), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0); // 4 points per vector, each of them is a float, the last 3 param is a normalisation stuff, use them as default values, don't worry about them
    gl.enableVertexAttribArray(vPosition);

    colors = [];
    for(var i=0; i<userPoints.length;i++){
        colors.push(vec4(1.0, 0.0, 0.0, 1.0));

    }

    var cBuffer = gl.createBuffer(); // buffer e o matrita. se numeste asa pentru ca ia un pic sa se consume numerele din ea. numerele respective o sa reprezinte pixelii care se vor arata pe ecran. I guess.
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer); // we make it an active buffer
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW); //flatten because we want jus one dimentional array, but points is an array of arrays

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0); // 4 points per vector, each of them is a float, the last 3 param is a normalisation stuff, use them as default values, don't worry about them
    gl.enableVertexAttribArray(vColor);

    //gl.bufferData(gl.ARRAY_BUFFER, flatten(userPoints), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, userPoints.length);
    console.log("points size: " + userPoints + ", colors size: " + colors.length);


    //requestAnimationFrame(render);
}*/

function render() {
    console.log("RENDEEEER");
    console.log(colors.length);
    //
    //  Load shaders and initialize attribute buffers
    //
    gl.clear(gl.canvas);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // create vertex buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(userPoints), gl.STATIC_DRAW);

    // create color buffer
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    // create vertex position array
    var vPos = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPos, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);

    // initialize the projection matrix and use it to change the view
    // var projMatrix = gl.getUniformLocation(program, "pMat");
    // gl.uniformMatrix4fv(projMatrix, false, flatten(projMat));

    colors = [];
    console.log(colors.length);
    for(var i=0; i<userPoints.length;i++){
        colors.push(colorArray[colorIdx]);

    }

    // get the color position from the buffer
    //var vColor = gl.getUniformLocation(program, "vColor");
    // change the color of the lines to whatever the index of the colors array is set to at the current time
    //gl.uniform4fv(vColor, vec4(1.0, 0.0, 0.0, 1.0));

    gl.bufferData(gl.ARRAY_BUFFER, flatten(userPoints), gl.STATIC_DRAW); // HAVE to set the bufferdata again for points to be drawn\
    gl.drawArrays(gl.LINE_STRIP, 0, userPoints.length);

}