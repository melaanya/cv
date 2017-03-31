#include <opencv2/core/core.hpp>
#include "opencv2/opencv.hpp"
#include <opencv2/highgui/highgui.hpp>
#include "opencv2/imgproc/imgproc.hpp"
#include "opencv2/imgcodecs.hpp"
#include <iostream>

using namespace cv;
using namespace std;

const int filter_const = 230;


Mat processDft(Mat img) {
	int M = getOptimalDFTSize( img.rows );
    int N = getOptimalDFTSize( img.cols );
	Mat padded;
    copyMakeBorder(img, padded, 0, M - img.rows, 0, N - img.cols, BORDER_CONSTANT, Scalar::all(0));

	Mat planes[] = {Mat_<float>(padded), Mat::zeros(padded.size(), CV_32F)};
	Mat complexImg;
	merge(planes, 2, complexImg);
    dft(complexImg, complexImg);

	return complexImg;
}

void turnImage(Mat img) {
	int cx = img.cols / 2;
	int cy = img.rows / 2;
	Mat q0(img, Rect(0, 0, cx, cy));   // Top-Left - Create a ROI per quadrant
	Mat q1(img, Rect(cx, 0, cx, cy));  // Top-Right
	Mat q2(img, Rect(0, cy, cx, cy));  // Bottom-Left
	Mat q3(img, Rect(cx, cy, cx, cy)); // Bottom-Right
	Mat tmp;                           // swap quadrants (Top-Left with Bottom-Right)
	q0.copyTo(tmp);
	q3.copyTo(q0);
	tmp.copyTo(q3);
	q1.copyTo(tmp);                    // swap quadrant (Top-Right with Bottom-Left)
	q2.copyTo(q1);
	tmp.copyTo(q2);
}


Mat visualizateSpectrum(Mat complexImg, bool flag, bool flag_2) {
	 //    // compute log(1 + sqrt(Re(DFT(img))**2 + Im(DFT(img))**2))
	Mat planes[2];
    split(complexImg, planes);
    magnitude(planes[0], planes[1], planes[0]);
    Mat mag = planes[0];
    mag += Scalar::all(1);
    if (flag_2) {
    	log(mag, mag);
    }
    
    // crop the spectrum, if it has an odd number of rows or columns
    mag = mag(Rect(0, 0, mag.cols & -2, mag.rows & -2));

	// instead of multiplying by (-1)^(x+y)
	if (flag) {
		turnImage(mag);
	}

    normalize(mag, mag, 0, 1, NORM_MINMAX);
    return mag;
}

Mat createLowPassFilter(int rows, int cols, int D0) {
	Mat lowPass(rows, cols, CV_32F, 0.0);  // type?

 	for (int i = 0; i < rows; ++i) {
 		for (int j = 0; j < cols; ++j) {
 			if (sqrt((i - rows / 2) * (i - rows / 2) + (j - cols / 2) * (j - cols / 2)) < D0) {
 				lowPass.at<float>(i, j) = 1.0;
 			}
 		}
 	}
	return lowPass;
}

Mat createHighPassFilter(int rows, int cols, int D0) {
	Mat lowPass(rows, cols, CV_32F, 0.0);  

 	for (int i = 0; i < rows; ++i) {
 		for (int j = 0; j < cols; ++j) {
 			if (sqrt((i - rows / 2) * (i - rows / 2) + (j - cols / 2) * (j - cols / 2)) > D0) {
 				lowPass.at<float>(i, j) = 1.0;
 			}
 		}
 	}
	return lowPass;
}

Mat applyFilter(Mat dftImg, Mat filter) {
	Mat planes[] = {Mat(filter), Mat::zeros(filter.size(), CV_32F)};
	Mat complexFilter;
	merge(planes, 2, complexFilter);
	turnImage(dftImg);
	Mat dftSmoothing = complexFilter.mul(dftImg);
	return dftSmoothing;
}


int main( int argc, char** argv )
{
	Mat img = imread("skeleton.png", IMREAD_GRAYSCALE);
	if( !img.data )
  	{ 
  		return -1; 
  	}
  	namedWindow("skeleton", WINDOW_NORMAL);
	resizeWindow("skeleton", 300, 300);
	imshow("skeleton", img);

	// got dft Data and show the spectrum
	Mat dftImage = processDft(img);
	Mat visualDFT = visualizateSpectrum(dftImage, true, true);
	namedWindow("spectrum", WINDOW_NORMAL);
	resizeWindow("spectrum", 300, 300);
	imshow("spectrum", visualDFT);

	// create and show LowPassFilter
	Mat lowPass = createLowPassFilter(dftImage.rows, dftImage.cols, filter_const);
 	namedWindow("lowPassFilter", WINDOW_NORMAL);
	resizeWindow("lowPassFilter", 300, 300);
	imshow("lowPassFilter", lowPass);

	// apply filter to spectrum and show it
	Mat dftSmoothing = applyFilter(dftImage, lowPass);
	Mat visualDFTSmoothing = visualizateSpectrum(dftSmoothing, false, true);
	namedWindow("spectrumLowPass", WINDOW_NORMAL);
	resizeWindow("spectrumLowPass", 300, 300);
	imshow("spectrumLowPass", visualDFTSmoothing);

	// idft and show the result of smoothing
	Mat smoothedImage;
	idft(dftSmoothing, smoothedImage);
	Mat resSmoothed = visualizateSpectrum(smoothedImage, false, false);

	namedWindow("LowPassImage", WINDOW_NORMAL);
	resizeWindow("LowPassImage", 300, 300);
	imshow("LowPassImage", resSmoothed);



	// create and show HighPassFilter
	Mat highPass = createHighPassFilter(dftImage.rows, dftImage.cols, filter_const);
 	namedWindow("lowPassFilter", WINDOW_NORMAL);
	resizeWindow("lowPassFilter", 300, 300);
	imshow("lowPassFilter", highPass);

	// apply filter to spectrum and show it
	Mat dftBordering = applyFilter(dftImage, highPass);
	Mat visualDFTBordering = visualizateSpectrum(dftBordering, false, true);
	namedWindow("spectrumHighPass", WINDOW_NORMAL);
	resizeWindow("spectrumHighPass", 300, 300);
	imshow("spectrumHighPass", visualDFTBordering);


	// idft and show the result of smoothing
	Mat borderedImage;
	idft(dftBordering, borderedImage);
	Mat resBordered = visualizateSpectrum(borderedImage, false, false);

	namedWindow("HighPassImage", WINDOW_NORMAL);
	resizeWindow("HighPassImage", 300, 300);
	imshow("HighPassImage", resBordered);
	waitKey(0);
	return 0; 
}