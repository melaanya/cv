var background = "#FFE5B4";
var background_histo = "#FFFFFF";
img_data = [];
img_width = 0; 
img_height = 0;

start = [0, 0];
end = [0, 0];


const histomake = (data, width, height) => {
	clearHisto();
	var red = new Array(256).fill(0),
		green = new Array(256).fill(0),
		blue = new Array(256).fill(0);

	// statistics
	for (var i = 0; i < width; ++i) {
		for (var j = 0; j < height; ++j) {
			cur = (i * height + j) * 4;
			red[data[cur]]++;
			green[data[cur + 1]]++;
			blue[data[cur + 2]]++;
		}
	}
	
	drawBarChart(red, "rgb(255, 0, 0)", 300, 150);
	drawBarChart(green, "rgb(0, 255, 0)", 300, 150);
	drawBarChart(blue, "rgb(0, 0, 255)", 300, 150);
}

function drawBarChart(arr, pencil, width, height) {
	var max = Math.max.apply(null, arr);
	var y_point = max / height;
	var x_point = width / 256;

	histo = document.createElement('canvas');
	histo.setAttribute('height', height);
	histo.setAttribute('width', width);
	histo.setAttribute('class', 'histogram');

	hist_ctx = histo.getContext('2d');
	hist_ctx.fillStyle = background_histo;
	hist_ctx.fillRect(0, 0, histo.width, histo.height);
	hist_ctx.fillStyle = pencil;

	for (var i = 0; i < 256; ++i) {
		for (var k = i * x_point; k < (i + 1) * x_point; ++k) {
			for (var j = height; j > height - arr[i] / y_point; --j) {
				hist_ctx.fillRect(k, j, 1, 1);
			}
		}
	}

	container = document.getElementById("histo_container");
	container.appendChild(histo);
}

function deselect() {
	var canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	ctx.putImageData(img_data, 0, 0);
	clearHisto();
}

function reselect() {
	var canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	ctx.putImageData(img_data, 0, 0);
	ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
	ctx.fillRect(start[0], start[1], end[0] - start[0], end[1] - start[1]);

	startI = (start[1] * (x - start[0]) + start[0]) * 4;
    endI = (y * (x - start[0]) + x) * 4;
    dataSlice = img_data.data.slice(startI, endI);
    histomake(dataSlice, (x - start[0]), (y - start[1]));
}

function clearHisto() {
	var paras = document.getElementsByClassName('histogram');
	while (paras[0]) {
	    paras[0].parentNode.removeChild(paras[0]);
	};
}

function clearImage() {
	var canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	ctx.fillStyle = background;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	clearHisto();
}



function init() {
	var canvas = document.getElementById("canvas");

	if (canvas.getContext) {
		ctx = canvas.getContext('2d');
		ctx.fillStyle = background;
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.fill();

		var fileChooser = document.getElementById('fileChooser');
    	fileChooser.addEventListener('change', handleFileSelect, false);

    	canvas.onmousedown = startPosition;
    	canvas.onmouseup = endPosition;

       	canvas.oncontextmenu = function (e) {
    		e.preventDefault();
		};
	}

	function getCursorPosition(e) {
	    return [e.pageX, e.pageY];
	}

	function startPosition(e) {
		deselect();
	    start[0] = getCursorPosition(e)[0] - this.offsetLeft;
	    start[1] = getCursorPosition(e)[1] - this.offsetTop;
	}

	function endPosition(e) {
		x = getCursorPosition(e)[0] - this.offsetLeft;
	    y = getCursorPosition(e)[1] - this.offsetTop;

	    end[0] = x;
	    end[1] = y;

	    ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
	    ctx.fillRect(start[0], start[1], x - start[0], y - start[1]);

	    startI = (start[1] * (x - start[0]) + start[0]) * 4;
	    endI = (y * (x - start[0]) + x) * 4;

	    dataSlice = img_data.data.slice(startI, endI);
	    histomake(dataSlice, (x - start[0]), (y - start[1]));
	}


	function handleFileSelect(event)
    {
        var files = event.target.files;
        if(files.length === 0)
        {
            return;
        }
        var file = files[0];
        if(file.type !== '' && !file.type.match('image.*'))
        {
            return;
        }
        window.URL = window.URL || window.webkitURL;
        var imageURL = window.URL.createObjectURL(file);
        loadAndDrawImage(imageURL);
    }

	function loadAndDrawImage(url)
	{
	    var image = new Image();
	    image.onload = function()
	    {
	    	ctx.fillStyle = background;
	    	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	        ctx.drawImage(image, 0, 0);
	        var imageData = ctx.getImageData(0, 0, image.width, image.height);
			img_data = imageData;
			img_width = image.width;
			img_height = image.height;
	    }
	    image.src = url;
	}
}



