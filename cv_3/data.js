var background = "#FFE5B4";
var background_histo = "#FFFFFF";

var img_width = 0; 
var img_height = 0;

var histo_width = 300;
var histo_height = 150;

var data_copy = [];

var t1 = -1, t2 = -1;

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

const histoGrayImageSlice = (data, len) => {
	var b = new Array(256).fill(0);

	// statistics

	for (var i = 0; i < len; i += 4) {
		b[data[i]]++;
	}

	for (var i = 0; i < 256; ++i) {
		b[i] = b[i] / len * 4;
	}

	return b;
}

const histoGrayImage = (data, start_i, start_j, width, height, size) => {
	var b = new Array(256).fill(0);

	// statistics
	// console.log(start_i, start_j, width, height);

	for (var i = start_i; i < width; ++i) {
		for (var j = start_j; j < height; ++j) {
			cur = (j * img_width + i) * 4;
			b[data[cur]]++;
		}
	}

	for (var i = 0; i < 256; ++i) {
		b[i] = b[i] / size;
	}

	return b;
}

function greyScale(data) {
	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (j * img_width + i) * 4;
			data[cur] = 0.3 * data[cur] + 0.59 * data[cur + 1] + 0.11 * data[cur + 2];
			data[cur + 1] = data[cur];
			data[cur + 2] = data[cur];
		}
	}
	return data;
}

function binThreshold(fun, data, start_i, start_j, width, height, t1, t2) {

	for (var i = start_i; i < width; ++i) {
		for (var j = start_j; j < height; ++j) {
			cur = (j * img_width + i) * 4;
			// console.log(data[cur], fun(data[cur], t1, t2))
			if (fun(data[cur], t1, t2)) {
				data[cur] = 255;
			}
			else {
				data[cur] = 0;
			}
			// console.log(data[cur]);
			data[cur + 1] = data[cur];
			data[cur + 2] = data[cur];
		}
	}
	return data;
}

function binPartThreshold(fun, data, len, t1, t2) {
	for (var i = 0; i < len; i += 4) {
		if (fun(data[i], t1, t2)) {
				data[i] = 255;
			}
			else {
				data[i] = 0;
			}
			// console.log(data[cur]);
			data[i + 1] = data[i];
			data[i + 2] = data[i];
	}
	return data;
}

function getImageBack() {
	var canvas = document.getElementById("canvas");
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
        data_copy = imageData;
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

function getData(name) {
	var canvas = document.getElementById(name);
	ctx = canvas.getContext('2d');
	return ctx.getImageData(0, 0, img_width, img_height);
}

function toGrey() {
	var canvas = document.getElementById("canvas");
	var data_full = getData("canvas");
	var data = data_full.data;

	data = greyScale(data);

	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}


function rangeThresh(arg, t1, t2) {
	return (arg >= t1) && (arg <= t2);
}

function lowThresh(arg, t) {
	return arg >= t;
}

function upThresh(arg, t) {
	return arg <= t;
}

function threshold_change() {
	getImageBack();
	toGrey();
	var canvas = document.getElementById("canvas");
	var data_full = getData("canvas");
	var data = data_full.data;

	t1 = parseInt(document.getElementById("threshold_1").value);
	t2 = parseInt(document.getElementById("threshold_2").value);

	var sel = document.getElementById("functionSelect");
	var curFun = sel.options[sel.selectedIndex].value;

	var thresh;
	if (curFun == "rangeThresh") {
		thresh = Function("arg", "t1", "t2", "return rangeThresh(arg, t1, t2);");
	}
	else {
		thresh = Function("arg", "t", "return " + curFun +"(arg, t); ");
	}
	// console.log(thresh);
	data = binPartThreshold(thresh, data, img_width * img_height * 4, t1, t2);

	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}

function selectorOnChange(e) {
	if (this.value == "rangeThresh") {
		var thr = document.getElementById('t_2_container');
		thr.style.visibility =  'visible';
	}
	else {
		var thr = document.getElementById('t_2_container');
		thr.style.visibility =  'hidden';
	}
}

function Otsu(p) {
	var max = 0, ind_max = 0;
	var mu = 0;
	for (var i = 0; i < 256; ++i) {
		mu += i * p[i];
	}

	var q = p[0], mu1 = 0;
	var mu2 = (mu - q * mu1) / (1 - q);

	for (var t = 1; t < 256; ++t) {
		var disp = q * (1 - q) * (mu1 - mu2) * (mu1 - mu2);
		// console.log(disp);
		if (disp > max) {
			max = disp;
			ind_max = t - 1;
		} 
		if (q + p[t] != 0) {
			mu1 = (q * mu1 + t * p[t]) / (q + p[t]);
			q += p[t];
			mu2 = (mu - q * mu1) / (1 - q);
		}
		else {
			continue;
		}
	}
	return ind_max;
}

function OtsuGlobal() {
	getImageBack();

	var canvas = document.getElementById("canvas");
	var data_full = getData("canvas");
	var data = data_full.data;

	var p = histoGrayImageSlice(data, img_width * img_height * 4);
	var thr = Otsu(p);
	var fun = Function("arg", "t", "return lowThresh(arg, t);");

	data = binPartThreshold(fun, data, img_width * img_height * 4, thr);

	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}

function OtsuLocalSlice() {
	var canvas = document.getElementById("canvas");
	var data_full = getData("canvas");
	var data = data_full.data;

	var sel = document.getElementById("blockSelect");
	var curNum = parseInt(sel.options[sel.selectedIndex].value);

	var blockSize = data.length / curNum;
	var fun = Function("arg", "t", "return lowThresh(arg, t);");

	for (var i = 0; i < curNum; ++i) {
		var data_part = data.slice(i * blockSize, (i + 1) * blockSize);
		var p = histoGrayImageSlice(data_part, blockSize);
		var thr = Otsu(p);
		data_part = binPartThreshold(fun, data_part, blockSize, thr);
		for (var j = i * blockSize; j < (i + 1) * blockSize; ++j) {
			data[j] = data_part[j - i * blockSize];
		}
	}

	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}

function OtsuLocalBlock() {
	var canvas = document.getElementById("canvas");
	var data_full = getData("canvas");
	var data = data_full.data;

	var sel = document.getElementById("blockSelect");
	var level = parseInt(sel.options[sel.selectedIndex].value);

	var width_len = Math.floor(img_width / level);
	var height_len = Math.floor(img_height / level);
	var fun = Function("arg", "t", "return lowThresh(arg, t);");

	for (var i = 0; i < level; ++i) {
		for (var j = 0; j < level; ++j) {
			var start_i = i * width_len;
			var start_j = j * height_len;
			var p = histoGrayImage(data, start_i, start_j, width_len * (i + 1), height_len * (j + 1), width_len * height_len);
			var thr = Otsu(p);
			data = binThreshold(fun, data, start_i, start_j, width_len  * (i + 1), height_len * (j + 1), thr);
		}
	}

	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}


function getBlockStatistics(data, start_i, start_j, width, height, size) {
	var med_intensity = 0;
	var curMistake = 0;
	for (var i = start_i; i < width; ++i) {
		for (var j = start_j; j < height; ++j) {
			cur = (j * img_width + i) * 4;
			var hsv = RGBtoHSV(data[cur], data[cur + 1], data[cur + 2]);
			med_intensity += hsv[2];
		}
	}
	med_intensity /= size;

	for (var i = start_i; i < width; ++i) {
		for (var j = start_j; j < height; ++j) {
			cur = (j * img_width + i) * 4;
			var hsv = RGBtoHSV(data[cur], data[cur + 1], data[cur + 2]);
			curMistake += (hsv[2] - med_intensity) * (hsv[2] - med_intensity);
		}
	}

	curMistake = Math.sqrt(curMistake);
	return curMistake;
}

function OtsuIerarchical() {
	var canvas = document.getElementById("canvas");
	var data_full = getData("canvas");
	var data = data_full.data;

	var max_side = Math.max(img_width, img_height);
	var best_med_square_error = Number.MAX_VALUE;
	var best_level = -1;
	var fun = Function("arg", "t", "return lowThresh(arg, t);");

	for (var level = 2; level < Math.sqrt(max_side); level *= 2) {  // Math.sqrt(min_side) 
		var width_len = Math.floor(img_width / level);
		var height_len = Math.floor(img_height / level);

		var med_square_error = 0;
		for (var i = 0; i < level; ++i) {
			for (var j = 0; j < level; ++j) {
				var start_i = i * width_len;
				var start_j = j * height_len;
				var curMistake = getBlockStatistics(data, start_i, start_j, width_len * (i + 1), height_len * (j + 1), width_len * height_len);
				med_square_error += curMistake;
			}
		}
		med_square_error /= (level * level);
		if (med_square_error < best_med_square_error) {
			best_med_square_error = med_square_error;
			best_level = level;
		}
	}

	console.log("best_level = ", best_level);

	for (var i = 0; i < best_level; ++i) {
		for (var j = 0; j < best_level; ++j) {
			var start_i = i * width_len;
			var start_j = j * height_len;
			var p = histoGrayImage(data, start_i, start_j, width_len * (i + 1), height_len * (j + 1), width_len * height_len);
			var thr = Otsu(p);
			data = binThreshold(fun, data, start_i, start_j, width_len  * (i + 1), height_len * (j + 1), thr);
		}
	}
	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}


function quant_change() {
	getImageBack();
	quantization();
}

function quantization(qt) {
	var canvas = document.getElementById("canvas");
	var data_full = getData("canvas");
	var data = data_full.data;

	var qt = parseInt(document.getElementById("quant").value);
	var qt_size = Math.ceil(256 / qt);

	var colors = [];
	var frequency = 0.7;
	var amplitude = 127;
	var center = 128;
	for (var i = 0; i < qt; ++i)
	{
		red   = Math.sin(frequency*i + 0) * amplitude + center;
		green = Math.sin(frequency*i + 2) * amplitude + center;
		blue  = Math.sin(frequency*i + 4) * amplitude + center;
		colors.push([red, green, blue]);
	}

	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			var hsv = RGBtoHSV(data[cur], data[cur + 1], data[cur + 2]);
			var temp = Math.floor(hsv[2] / qt_size);
			data[cur] = colors[temp][0];
			data[cur + 1] = colors[temp][1];
			data[cur + 2] = colors[temp][2];
		}
	}
	
	ctx = canvas.getContext('2d');
	ctx.putImageData(data_full, 0, 0);
}

function init() {
	canvasInit("canvas");

    var fileChooser = document.getElementById('fileChooser');
    fileChooser.addEventListener('change', function (e) { handleFileSelect(e, "canvas"); }, false);

    var selector = document.getElementById('functionSelect');
    selector.addEventListener('change', selectorOnChange, false);

}



