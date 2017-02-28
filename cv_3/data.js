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

const histoGrayImage = (data, width, height) => {
	var b = new Array(256).fill(0);

	// statistics
	for (var i = 0; i < width; ++i) {
		for (var j = 0; j < height; ++j) {
			cur = (i * height + j) * 4;
			b[data[cur]]++;
		}
	}
	for (var i = 0; i < 256; ++i) {
		b[i] = b[i] / width / height;
	}

	return b;
}

function greyScale(data) {
	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
			data[cur] = 0.3 * data[cur] + 0.59 * data[cur + 1] + 0.11 * data[cur + 2];
			data[cur + 1] = data[cur];
			data[cur + 2] = data[cur];
		}
	}
	return data;
}

function binThreshold(fun, data, t1, t2) {
	for (var i = 0; i < img_width; ++i) {
		for (var j = 0; j < img_height; ++j) {
			cur = (i * img_height + j) * 4;
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
	data = binThreshold(thresh, data, t1, t2);

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
	var max = Number.MIN_VALUE, ind_max = -1;
	var mu = 0;
	for (var i = 0; i < 256; ++i) {
		mu += i * p[i];
	}

	var q = p[0], mu1 = 0;
	var mu2 = (mu - q * mu1) / (1 - q);

	for (var t = 1; t < 256; ++t) {
		var disp = q * (1 - q) * (mu1 - mu2) * (mu1 - mu2);
		if (disp > max) {
			max = disp;
			ind_max = t - 1;
		} 
		mu1 = (q * mu1 + t * p[t]) / (q + p[t]);
		q += p[t];
		mu2 = (mu - q * mu1) / (1 - q);
	}
	return ind_max;
}

function OtsuGlobal() {
	var canvas = document.getElementById("canvas");
	var data_full = getData("canvas");
	var data = data_full.data;

	var p = histoGrayImage(data, img_width, img_height);
	// console.log(p);
	var thr = Otsu(p);
	var fun = Function("arg", "t", "return lowThresh(arg, t);");
	console.log(fun);
	console.log(typeof thr);

	data = binThreshold(fun, data, thr);

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



