<?php

include('simple_html_dom.php'); // PHP dom traversor

// Format string
$_GET['request'] = str_replace(' ', '+', $_GET['request']);

// Grab search page
$result = file_get_html("http://www.ultimate-guitar.com/search.php?view_state=advanced&title=".$_GET['request']."&type[]=200&type[]=300&page=".$_GET['page']);

// Find total number of tabs found
$total_tabs_found = $result->find('.upd font', 1)->plaintext;

// Grabs the table rows of each tab as array
$tabs_tr = $result->find('table.tresults tr');

// Number of tabs on page
$num_tabs = count($tabs_tr)-1;

// Will hold a fully parsed array of tab data
$return_array = array();


// specify the total number of tabs (we may need to do more searches)
$temp['totalsongs'] = $total_tabs_found;
$return_array[] = $temp;


for($count = 0; $count < $num_tabs; $count++){
	
	// Data for this itteration
	
	// If no artist on this song, use current artist
	if(!empty($tabs_tr[$count+1]->find('td',0)->find('a',0)->plaintext)){
		$artist = $tabs_tr[$count+1]->find('td',0)->find('a',0)->plaintext; // Artist hasn't change so use the current one
	}
		
	$song = $tabs_tr[$count+1]->find('td',1)->find('a',0)->plaintext; // Grab song

	
	$link = $tabs_tr[$count+1]->find('td',1)->find('a',0)->href; // Grab link
	
	$type = $tabs_tr[$count+1]->find('td',3)->find('strong',0)->plaintext; // Grab type
	
	$rating = $tabs_tr[$count+1]->find('td',2)->find('span.rating',0);
	
	if(is_object($rating)){
		$rating = $rating->find('span',0)->getAttribute('class'); 
	}
		
	// Song may not have rating so check if exists
	if( isset($rating) ){
		$rating = preg_replace("/r_/",'',$rating);
	}else{
		$rating = 1;
	}
		
	// Check if song is a duplicate (i.e (ver 1), (ver 2)..)
	if( preg_match('/\(ver \d*\)|solo|intro/i', $song) ){
		 $singletab['alt'] = true;
		 $song = preg_replace('/\(ver \d*\)|solo|intro|album|&nbsp;/i','',$song); // Strip '(ver 1)..' etc out of song
	}else{
		$singletab['alt'] = false;
	}
	
	// If song name too long, then cut it down
	if(strlen($song) > 45){
		$song = substr($song, 0, 45)."...";
	}
	
	$singletab['artist'] = $artist;
	$singletab['song'] = $song;
	$singletab['link'] = $link;
	$singletab['type'] = $type;
	$singletab['rating'] = $rating;
	
	// Add this song data to the main array
	$return_array[] = $singletab; 
}

// Print out the array to be interpreted by the js
   echo json_encode($return_array);
?>