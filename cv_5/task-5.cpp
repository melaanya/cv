#include <opencv2/core/core.hpp>
#include "opencv2/opencv.hpp"
#include <opencv2/highgui/highgui.hpp>
#include "opencv2/imgproc/imgproc.hpp"
#include "opencv2/imgcodecs.hpp"
#include <iostream>

using namespace cv;
using namespace std;


void dft() {

}

int main( int argc, char** argv )
{
	Mat img = imread("skeleton.png", CV_LOAD_IMAGE_GRAYSCALE);
	if( !img.data )
  	{ 
  		return -1; 
  	}
	namedWindow("spectrum", WINDOW_NORMAL);
	resizeWindow("spectrum", 300, 300);

	
	int M = getOptimalDFTSize( img.rows );
    int N = getOptimalDFTSize( img.cols );
	Mat padded;
    copyMakeBorder(img, padded, 0, M - img.rows, 0, N - img.cols, BORDER_CONSTANT, Scalar::all(0));

    cout << M << " " << N << "; " << img.rows << " " << img.cols << " " << endl;

	Mat planes[] = {Mat(padded), Mat::zeros(padded.size(), CV_32F)};
	cout << padded.size() << endl;
	// planes.convertTo(planes, CV_32FC1);
    Mat complexImg(padded.rows, padded.cols, CV_32F);
    cout << padded.rows << " " << padded.cols << "; " << complexImg.rows << " " << complexImg.cols << " " << endl;
    merge(planes, 2, complexImg);
    
 //    dft(complexImg, complexImg);
    
 //    // compute log(1 + sqrt(Re(DFT(img))**2 + Im(DFT(img))**2))
 //    split(complexImg, planes);
 //    magnitude(planes[0], planes[1], planes[0]);
 //    Mat mag = planes[0];
 //    mag += Scalar::all(1);
 //    log(mag, mag);
    
 //    // crop the spectrum, if it has an odd number of rows or columns
 //    mag = mag(Rect(0, 0, mag.cols & -2, mag.rows & -2));
	// imshow("spectrum", mag);
	
	waitKey(0);
	return 0; 
}