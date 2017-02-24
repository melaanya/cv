var background = "#FFE5B4";

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
	var canvas = document.getElementById("canvas_correct");
    example_pixel = [e.pageX - this.offsetLeft, e.pageY - this.offsetTop];

	data_full_correct = getData("canvas_correct");
	data_full_spoiled = getData("canvas_spoiled");

	data_correct = data_full_correct.data;
	data_spoiled = data_full_spoiled.data;

    var cur_pos = (example_pixel[0] * img_height + example_pixel[1]) * 4;

	r_dst = data_correct[cur_pos];
	r_src = data_spoiled[cur_pos];
	coeff_r = r_dst / r_src;

	g_dst = data_correct[cur_pos + 1];
	g_src = data_spoiled[cur_pos + 1];
	coeff_g = g_dst / g_src;

	b_dst = data_correct[cur_pos + 2];
	b_src = data_spoiled[cur_pos + 2];
	coeff_b = b_dst / b_src;

	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			data_spoiled[cur] *= coeff_r;
			data_spoiled[cur + 1] *= coeff_g;
			data_spoiled[cur + 2] *= coeff_b;
		}
	}
	
	canvas = document.getElementById("canvas_spoiled");
	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full_spoiled, 0, 0);
}

function greyWorld() {
	var canvas = document.getElementById("canvas_spoiled");
	var data_full = getData("canvas_spoiled");
	var data = data_full.data;

	var rgb_avg = [0, 0, 0];

	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			rgb_avg[0] += data[cur];
			rgb_avg[1] += data[cur + 1];
			rgb_avg[2] += data[cur + 2];
		}
	}

	var avg = (rgb_avg[0] + rgb_avg[1]+ rgb_avg[2]) / 3 / data.length;
	rgb_avg = [avg / rgb_avg[0] * data.length, avg / rgb_avg[1] * data.length, avg / rgb_avg[2] * data.length];

	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			data[cur] *= rgb_avg[0];
			data[cur + 1] *= rgb_avg[1];
			data[cur + 2] *= rgb_avg[2];
		}
	}

	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}

function brightnessChange(data, fun) {

	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			var b = Math.max(data[cur], data[cur + 1], data[cur + 2]); 
			var num_b = 0;
		}
	}
}

function funcTransform() {
	// brightness - max of rgb
	var sel = document.getElementById("functionSelect");
	var curFun = parseInt(sel.options[sel.selectedIndex].value);
	console.log(curFun);


}

function getData(name) {
	var canvas = document.getElementById(name);
	ctx = canvas.getContext('2d');
	return ctx.getImageData(0, 0, img_width, img_height);
}

function correctionWithBaseColor() {
	var canvas = document.getElementById("canvas_correct");
	canvas.addEventListener('mousedown', getPixelCanvas);
}

function removeEvents() {
	var canvas_correct = document.getElementById("canvas_correct");
	canvas_correct.removeEventListener('mousedown', getPixelCanvas);
}

function init() {
	canvasInit("canvas_spoiled");
	canvasInit("canvas_correct");

	var fileChooser_spoiled = document.getElementById('fileChooser_spoiled');
    fileChooser_spoiled.addEventListener('change', function (e) { handleFileSelect(e, "canvas_spoiled"); }, false);

    var fileChooser_correct = document.getElementById('fileChooser_correct');
    fileChooser_correct.addEventListener('change', function (e) { handleFileSelect(e, "canvas_correct"); }, false);

}



