var background = "#FFE5B4";
var background_histo = "#FFFFFF";
var pencil = "#000000";

var img_width = 0; 
var img_height = 0;
var gl_c = 0, gl_gamma = 0;

var histo_width = 300;
var histo_height = 150;

var inter_side = 255;
var dot_arr = [[0, 255], [255, 0]];

var data_copy = [];

const histoBrightness = (data, width, height) => {
	var b = new Array(256).fill(0);

	// statistics
	for (var i = 0; i < width; ++i) {
		for (var j = 0; j < height; ++j) {
			cur = (i * height + j) * 4;
			var hsv = RGBtoHSV(data[cur], data[cur + 1], data[cur + 2]);
			b[parseInt(hsv[2])]++;
		}
	}
	return b;
}

function histoEqualization(data) {
	var h = histoBrightness(data, img_width, img_height);
	for (var i = 0; i < 256; ++i) {
		h[i] = h[i] / img_width / img_height * 255;
	}
	for (var i = 1; i < 256; ++i) {
		h[i] = h[i - 1] + h[i];
	}
	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			var hsv = RGBtoHSV(data[cur], data[cur + 1], data[cur + 2]);
			hsv[2] =  h[hsv[2]];
			var rgb = HSVtoRGB(hsv[0], hsv[1], hsv[2]);
			data[cur] = rgb[0];
			data[cur + 1] = rgb[1];
			data[cur + 2] = rgb[2];
		}
	}

	return data;
}

function clearHisto() {
	var paras = document.getElementsByClassName('histogram');
	while (paras[0]) {
	    paras[0].parentNode.removeChild(paras[0]);
	};
}

function histoNormalization(data) {
	var max = Number.MIN_VALUE, min = Number.MAX_VALUE;
	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			var hsv = RGBtoHSV(data[cur], data[cur + 1], data[cur + 2]);
			if (hsv[2] < min) {
				min = hsv[2];
			}
			if (hsv[2] > max) {
				max = hsv[2];
			}
		}
	}

	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			var hsv = RGBtoHSV(data[cur], data[cur + 1], data[cur + 2]);
			hsv[2] = linear(hsv[2], min, max, 255);
			var rgb = HSVtoRGB(hsv[0], hsv[1], hsv[2]);
			data[cur] = rgb[0];
			data[cur + 1] = rgb[1];
			data[cur + 2] = rgb[2];
		}
	}
	return data;
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

function getImageBack() {
	var canvas = document.getElementById("canvas_spoiled");
	ctx = canvas.getContext('2d');
	ctx.putImageData(data_copy, 0, 0);
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
        if (name == "canvas_spoiled") {
        	data_copy = imageData;
        }
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

function RGBtoHSV (r, g, b) {
	var max = Math.max(r, g, b);
	var min = Math.min(r, g, b);

	v = max;
	s = 0;
	if (max != 0) {
		s = 1 - min / max;
	}

	h = 0;
	if (max == min) {
		return [h, s, v]
	}
	else {
		if (max == r) {
			h = 60 * (g - b) / (max - min);
			if (g < b) {
				h += 360;
			}
		}
		else if (max == g) {
			h = 60 * (b - r) / (max - min) + 120;
		}
		else {
			h = 60 * (r - g) / (max - min) + 240;
		}

		return [h, s, v];
	}
}


function HSVtoRGB(h, s, v) {
	h_i = Math.floor(h / 60) % 6;
	f = h / 60 - Math.floor(h / 60);
	p = v * (1 - s);
	q = v * (1 - f *s);
	t = v * (1 - (1 - f) * s);
	switch (h_i) {
		case 0:
			return [v, t, p];
		case 1: 
			return [q, v, p];
		case 2:
			return [p, v, t];
		case 3:
			return [p, q, v];
		case 4:
			return [t, p, v];
		case 5:
			return [v, p, q];
	}
}

function brightnessChange(data_full, fun) {
	var data = data_full.data;

	if (fun.length == 4) {  // if linear transformation
		var max = Number.MIN_VALUE, min = Number.MAX_VALUE;
		for (var i = 0; i < img_width; ++i) {
			for (var j = 0; j < img_height; ++j) {
				cur = (i * img_height + j) * 4;
				var hsv = RGBtoHSV(data[cur], data[cur + 1], data[cur + 2]);
				if (hsv[2] < min) {
					min = hsv[2];
				}
				if (hsv[2] > max) {
					max = hsv[2];
				}
			}
		}	
	}

	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			var hsv = RGBtoHSV(data[cur], data[cur + 1], data[cur + 2]);
			if (fun.length == 4) { // if linear transformation
				hsv[2] = fun(hsv[2], min, max, 255);
			}
			else if (fun.length == 3) { // if gamma transformation
				hsv[2] = fun(hsv[2], gl_c, gl_gamma);
			}
			else if (fun.length == 2) {
				hsv[2] = fun(hsv[2], gl_c);
			}
			else {
				hsv[2] = fun(hsv[2]);
			}
			var rgb = HSVtoRGB(hsv[0], hsv[1], hsv[2]);
			data[cur] = rgb[0];
			data[cur + 1] = rgb[1];
			data[cur + 2] = rgb[2];
		}
	}

	return data_full;
}

function linear(arg, min, max, c) {
	return  c * (arg - min) / (max - min) + min;
}

function logTrans(arg, c) {  
	return c * Math.log(arg + 1);  // c = 25 - visible
}

function gammaTrans(arg, c, gamma) {
	return c * Math.pow(arg, gamma);
}

function c_change() {
	gl_c = parseInt(document.getElementById("cSelect").value);
	// console.log(gl_c);
	getImageBack();
	funcTransform();
}

function gamma_change() {
	gl_gamma = parseFloat(document.getElementById("gammaSelect").value);
	// console.log(gl_gamma);
	getImageBack();
	funcTransform();
}

function funcTransform() {
	var canvas = document.getElementById("canvas_spoiled");
	var data_full = getData("canvas_spoiled");

	var sel = document.getElementById("functionSelect");
	var curFun = sel.options[sel.selectedIndex].value;
	var transform;


	if (curFun == "linear") {
		transform = Function("y", "min", "max", "c", "return linear(y, min, max, c);");
	}
	else if (curFun == "gammaTrans") {
			transform = Function("y", "c", "gamma", "return gammaTrans(y, c, gamma);");
		}
		else {
			transform = Function("y", "c", "return logTrans(y, c);");
		}

	data_full = brightnessChange(data_full, transform);

	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}

function normalization() {
	clearHisto();
	var canvas = document.getElementById("canvas_spoiled");
	var data_full = getData("canvas_spoiled");
	var data = data_full.data;

	statBefore = histoBrightness(data, img_width, img_height);
	drawBarChart(statBefore, "#000000", histo_width, histo_height);
	data = histoNormalization(data);

	statAfter = histoBrightness(data, img_width, img_height);
	drawBarChart(statAfter, "#000000", histo_width, histo_height);


	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}

function equalization() {
	clearHisto();
	var canvas = document.getElementById("canvas_spoiled");
	var data_full = getData("canvas_spoiled");
	var data = data_full.data;

	statBefore = histoBrightness(data, img_width, img_height);
	drawBarChart(statBefore, "#000000", histo_width, histo_height);

	data = histoEqualization(data);

	statAfter = histoBrightness(data, img_width, img_height);
	drawBarChart(statAfter, "#000000", histo_width, histo_height);

	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
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

function initial_position(color) {
	var inter = document.getElementById("interactive_line");
	var ctx = inter.getContext('2d');
	ctx.fillStyle = color;

	for (var i = 0; i < inter_side; ++i) {
		ctx.fillRect(i, inter_side - i, 1, 1);
	}
}

function pairCompare(a, b) {
	if ((a[0] < b[0]) || ((a[0] == b[0]) && (a[1] < b[1]))) {
		return -1;
	}
	else if ((a[0] == b[0]) && (a[1] == b[1])) {
		return 0;
	}
	else return 1;

}

function redraw(ev) {
	left = 0;
	right = 2;
	if (ev.button === left) {
		redraw_left(ev);
	}
	else if (ev.button === right) {
		redraw_right(ev);
	}
}

function redraw_right(ev) {
	var canvas = document.getElementById("interactive_line");
	var ctx = inter.getContext('2d');
	ctx.fillStyle = background_histo;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	dot_arr = [[0, 255], [255, 0]];
	initial_position("rgba(122, 122, 122, 122)"); // basic line

	getImageBack();
}

function redraw_left(ev) {
	var canvas = document.getElementById("interactive_line");
	var ctx = inter.getContext('2d');

	var curX = ev.pageX - canvas.offsetLeft;
	var curY = ev.pageY - canvas.offsetTop;
	var coord = [curX, curY];
	dot_arr.push(coord);
	dot_arr.sort(pairCompare);

	ctx.fillStyle = background_histo;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	initial_position("rgba(122, 122, 122, 122)"); // basic line

	ctx.beginPath();
	ctx.moveTo(dot_arr[0][0], dot_arr[0][1]);
	for (var i = 1; i < dot_arr.length; ++i) {
		ctx.lineTo(dot_arr[i][0], dot_arr[i][1]);
	}
	ctx.stroke();

	// preparing for function building
	for (var i = 0; i < dot_arr.length - 1; ++i) {
		dot_arr[i][1] = inter_side - dot_arr[i][1];
	}

	var fun_txt = "";
	for (var i = 0; i < dot_arr.length - 1; ++i) {
		if (dot_arr[i + 1][0] == dot_arr[i][0]) {
			continue;
		}
		var k = (dot_arr[i + 1][1] - dot_arr[i][1]) / (dot_arr[i + 1][0] - dot_arr[i][0]);
		var b = dot_arr[i][1] - dot_arr[i][0] * k;
		fun_txt += "if ((x >= " + dot_arr[i][0] + ") && (x <= " + dot_arr[i + 1][0] + ")) { return " + k + " * x + " + b + "; } \n";
	}
	console.log(fun_txt);

	var fun = Function("x", fun_txt);

	var canvas_image = document.getElementById("canvas_spoiled");
	var data_full = getData("canvas_spoiled");
	data_full = brightnessChange(data_full, fun);

	ctx_image = canvas_image.getContext('2d');
	ctx_image.putImageData(data_full, 0, 0);

	// back for drawing
	for (var i = 0; i < dot_arr.length - 1; ++i) {
		dot_arr[i][1] = inter_side - dot_arr[i][1];
	}

}

function interactive() {
	inter = document.createElement('canvas');
	inter.setAttribute('height', inter_side);
	inter.setAttribute('width', inter_side);
	inter.setAttribute('class', 'interactive');
	inter.setAttribute('id', 'interactive_line');

	inter_ctx = inter.getContext('2d');
	inter_ctx.fillStyle = background_histo;
	inter_ctx.fillRect(0, 0, inter.width, inter.height);
	inter_ctx.fillStyle = pencil;

	inter.addEventListener('mousedown', redraw, false);

	container = document.getElementById("histo_container");
	container.appendChild(inter);

	initial_position(pencil);

}

function init() {
	canvasInit("canvas_spoiled");
	canvasInit("canvas_correct");

	var fileChooser_spoiled = document.getElementById('fileChooser_spoiled');
    fileChooser_spoiled.addEventListener('change', function (e) { handleFileSelect(e, "canvas_spoiled"); }, false);

    var fileChooser_correct = document.getElementById('fileChooser_correct');
    fileChooser_correct.addEventListener('change', function (e) { handleFileSelect(e, "canvas_correct"); }, false);

}



