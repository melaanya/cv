var background = "#FFE5B4";

var example_pixel = [0, 0];
var img_width = 0; 
var img_height = 0;


function canvasInit(name) {
	var canvas = document.getElementById(name);

	if (canvas.getContext) {
		ctx = canvas.getContext('2d');
		ctx.fillStyle = background;
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.fill();

	   	canvas.oncontextmenu = function (e) {
			e.preventDefault();
		};
	}
}

function loadAndDrawImage(url, name)
{
	var canvas = document.getElementById(name);
	ctx = canvas.getContext('2d');
    var image = new Image();

    image.onload = function()
    {
    	ctx.fillStyle = background;
    	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(image, 0, 0);
        var imageData = ctx.getImageData(0, 0, image.width, image.height);
		img_width = image.width;
		img_height = image.height;
    }
    image.src = url;
}

function handleFileSelect(event, name)
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
    loadAndDrawImage(imageURL, name);
}

function getPixelCanvas(e) {
    example_pixel = [e.pageX - this.offsetLeft, e.pageY - this.offsetTop];
    console.log(example_pixel);
}

function getData(name) {
	var canvas = document.getElementById(name);
	ctx = canvas.getContext('2d');
	return ctx.getImageData(0, 0, img_width, img_height);
}

function correctionWithBaseColor() {
	var canvas = document.getElementById("canvas_correct");

	data_correct = getData("canvas_correct");
	data_spoiled = getData("canvas_spoiled");

	canvas.onmousedown = getPixelCanvas;

	var cur_pos = (example_pixel[0] * canvas.height + example_pixel[j]) * 4;

	r_dst = data_correct[cur_pos];
	r_src = data_correct[cur_pos];
	coeff_r = r_dst / r_src;

	g_dst = data_correct[cur_pos + 1];
	g_src = data_correct[cur_pos + 1];
	coeff_g = g_dst / g_src;

	b_dst = data_correct[cur_pos + 2];
	b_src = data_correct[cur_pos + 2];
	coeff_b = b_dst / b_src;

	for (var i = 0; i < width; ++i) {
		for (var j = 0; j < height; ++j) {
			cur = (i * height + j) * 4;
			data[cur] *= coeff_r;
			data[cur + 1] *= coeff_g;
			data[cur + 2] *= coeff_b;
		}
	}

	
	ctx = canvas.getContext('2d');
	ctx.putImageData(data_spoiled, 0, 0);

}
// removeEventListener

function init() {
	canvasInit("canvas_spoiled");
	canvasInit("canvas_correct");

	var fileChooser_spoiled = document.getElementById('fileChooser_spoiled');
    fileChooser_spoiled.addEventListener('change', function (e) { handleFileSelect(e, "canvas_spoiled"); }, false);

    var fileChooser_correct = document.getElementById('fileChooser_correct');
    fileChooser_correct.addEventListener('change', function (e) { handleFileSelect(e, "canvas_correct"); }, false);

}



