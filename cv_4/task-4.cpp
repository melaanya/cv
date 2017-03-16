#include <opencv2/core/core.hpp>
#include "opencv2/opencv.hpp"
#include <opencv2/highgui/highgui.hpp>
#include <iostream>

using namespace cv;
using namespace std;

int main( int argc, char** argv )
{
	Mat image = imread("wheel.png");
	if( !image.data )
  	{ 
  		return -1; 
  	}
	namedWindow("Erosion 1", WINDOW_NORMAL);
	resizeWindow("Erosion 1", 300, 300);

	// step 1: hole_ring creation, then erosion
	Mat image1;
	int hole_size = 96;
	Mat small_ring(hole_size, hole_size, CV_8U, Scalar::all(0));
	Mat part = small_ring(Range(1, hole_size - 1), Range(1, hole_size - 1));
	Mat big_ring = getStructuringElement(MORPH_ELLIPSE, Size(hole_size, hole_size), Point(-1, -1));
	Mat small_ring_temp = getStructuringElement(MORPH_ELLIPSE, Size(hole_size - 2, hole_size - 2), Point(-1, -1));
	small_ring_temp.copyTo(part);
	Mat hole_ring;
	bitwise_xor(big_ring, small_ring, hole_ring); 

	erode(image, image1, hole_ring); 

	imshow("image", image1);

	// step 2: hole_mask creation, then dilatation
	Mat image2;
	Mat hole_mask = getStructuringElement(MORPH_ELLIPSE, Size(hole_size, hole_size), Point(-1, -1));
	dilate(image1, image2, hole_mask);

	imshow("image", image2);

	// step 3: image OR image2
	Mat image3;
	bitwise_or(image, image2, image3);

	// step 4: create gear_body and then morph_open - размыкание
	Mat image4;

	int gear_size = 280;
	Mat gear_body = getStructuringElement(MORPH_ELLIPSE, Size(gear_size, gear_size), Point(-1, -1));
	morphologyEx(image3, image4, MORPH_OPEN, gear_body);

	// step 5: create sampling_ring_spacer and dilate image4
	Mat image5;
	int ring_spacer_size = 13;
	Mat sampling_ring_spacer = getStructuringElement(MORPH_ELLIPSE, Size(ring_spacer_size, ring_spacer_size), Point(-1, -1));

	dilate(image4, image5, sampling_ring_spacer);

	// step 6: create sampling_ring_width and dilate image5
	Mat image6;
	int ring_width_size = 22;
	Mat sampling_ring_width = getStructuringElement(MORPH_ELLIPSE, Size(ring_width_size, ring_width_size), Point(-1, -1));

	dilate(image5, image6, sampling_ring_width);


	// step 7: substract image 6 and image 5
	Mat image7;
	bitwise_xor(image6, image5, image7);

	// step 8: image 7 and image 
	Mat image8;
	bitwise_and(image7, image, image8);

	// step 9: create tip_spacing and image9
	Mat image9;
	int tip_spacing_size = 23;
	Mat tip_spacing = getStructuringElement(MORPH_ELLIPSE, Size(tip_spacing_size, tip_spacing_size), Point(-1, -1));

	dilate(image8, image9, tip_spacing);

	// step 10: find bad places and put them on the first image
	Mat image10;
	subtract(image7, image9, image10);

	int defect_cue_size = 35;
	Mat defect_cue = getStructuringElement(MORPH_ELLIPSE, Size(defect_cue_size, defect_cue_size), Point(-1, -1));
	dilate(image10, image10, defect_cue);

	image10 = image9 + image10;

	imshow("image", image10);
	waitKey(0);
	return 0; 
}