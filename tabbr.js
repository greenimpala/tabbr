// GLOBALS
var artistsHere = []; // Holds an array of artists currently displayed
var xmlHttpRequest; // Holds the xmlHttpRequest request object
var currentPage = 0; // The current page (current 'artist_block_wrapper'). Used when adding results to the DOM
var tracksOnPage = 0; // Number of tracks on this page - used to determine when to change page
var activePage = 1; // Used by the nav arrows and page info panel
var totalPages = 1; // Used by the nav arrows and page info panel
var searchingPage = 1; // Used to determine which page on UG we are searching
var currentSearchStr = ''; // The current search term
// CONSTANTS
var MAX_TRACKS_PER_PAGE = 10; // Number of tracks allowed per page
var MAX_ARTISTS_PER_PAGE = 4; // Number of artist allowed per page

$(document).ready(function() {
	
	// LIVE HANDLER FOR OPENING A TAB FILE
	$('ul.tab_popup_list li').live('click', function(){
		var dataStr = $(this).find('div.hidden').html();
		var liReference = $(this);
		var backup = $(this).html(); // Backup
		$(this).html('<span>Loading... </span><img src="img/loader.gif" />'); // Apply loading status
		$.ajax({ 
			url: "get_tab.php", 
			type: "GET",
			data: "request="+dataStr,
			success: function(data){
				// Close any existing popups
				$('.tab_popup').hide();
				$('.track').width(460);
				
				$('#tab_file').html("<pre>"+$.trim(data)+"</pre>"); // Append data
				$('#tab_wrapper').hide(); // Hide tab results
				$('#tab_file_container').fadeIn(300); // Fade in container
				$(liReference).html(backup); // Reset li element
			}
		});
	});
	
	//LIVE HANDLER FOR DISPLAYING POPUP	
	$('.eye').live('click',function() {
		var reference = $(this).parent().find(".tab_popup");
		if (reference.is(":visible")) { // It's already there so just hide it
			reference.hide();
		} else { // Display popup
			
			// Close any existing popups
			$('.tab_popup').hide();
			$('.track').not(reference.parent().find('.track')).width(460);
			
			if ($(reference).find('.tab_popup_list:eq(0) li').length < 1){ // Determine if there are no tabs (then we need to display just chords)
				$(reference).find('.tab_popup_list:eq(0)').hide();
				$(reference).find('.tab_popup_list:eq(1)').show();
				$(reference).find('.tab_popup_header h3').html('<h3>CHORDS</h3>');
				// Re-calculat the offset
				var position = $(reference).parent().offset().top - 165; // The track wrapper offset
				// See how many songs there are in the popup and adjust offset accordingly
				for (var i = 1; i < $(reference).find('.tab_popup_body ul.tab_popup_list:eq(1) li').length; i++) {
					position -= 19;
				}
				// Apply offset
				$(reference).css('top', position);
			}
			reference.show();
		}
	});
	
	// TAB CLOSE BUTTON
	$('#tab_file_close_img').click(function(){
		$(this).parent().hide();
		$('#tab_wrapper').show(); // Show tab results
	});
	
	// POPUP CLOSE BUTTON
	$('.tab_popup_quit_img').live('click',function(){
		$(this).parent().parent().parent().hide();
		$('.track').width(460);
	});

	// RIGHT NAVIGATION ARROW
	$('#rightarrow').click(function() {
		if(activePage < totalPages){
			// Close any existing popups 
			$('.tab_popup').hide();
			$('.track').width(460)
			
			activePage++;
			$('#tab_container').animate({
				marginLeft: "-=530px"
			}, 400, 'easeInOutQuint');
		}
		if(activePage == totalPages){
			$('#rightarrowimg').css('background-image',"url('img/arrow_right_off.png')");
		}
		if(activePage > 1){
			$('#leftarrowimg').css('background-image',"url('img/arrow_left_on.png')");
		}
		$('#page_info span').html(activePage+" of "+totalPages); // Update current page info
	});

	// LEFT NAVIGATION ARROW
	$('#leftarrow').click(function() {
		if(activePage > 1){
			// Close any existing popups 
			$('.tab_popup').hide();
			$('.track').width(460)
			
			activePage--;
			$('#tab_container').animate({
				marginLeft: "+=530px"
			}, 400, 'easeInOutQuint');
		}
		if(activePage == 1){
			$('#leftarrowimg').css('background-image',"url('img/arrow_left_off.png')");
		}
		if(activePage == 1 && totalPages > 1){
			$('#rightarrowimg').css('background-image',"url('img/arrow_right_on.png')");
		}
		if(activePage < totalPages){
			$('#rightarrowimg').css('background-image',"url('img/arrow_right_on.png')");
		}
		$('#page_info span').html(activePage+" of "+totalPages); // Update current page info
	});

	// LIVE HANDLER FOR INDIVIDUAL TRACK 'EYE' HOVER
	$('.track_wrapper').live({
		mouseenter: function() {
			if (!$(this).find(".tab_popup").is(":visible") ) { // If tracks popup not visible then show the eye
				$(this).find(".track").addClass('eyeborder');
				$(this).find(".track").stop().animate({
					width: "408px"
				}, 150, 'easeInOutQuint');
			}
		},
		// On blur...
		mouseleave: function() {
			if (!$(this).find(".tab_popup").is(":visible") ) { // If tracks popup not visible then clear the eye
				$(this).find(".track").stop().animate({
					width: "460px"
				}, 150, 'easeInOutQuint');
			}
			$(this).removeClass('eyeborder');
		}
	});

	// SEARCH BAR
	var default_message = "Enter an artist, track or both."; // Search panel message
	var search_bar = $("#search_bar"); // The search box
	$(search_bar).focus(function() {
		if ($(this).val() == default_message) {
			$(this).val(''); // Clear text
		}
		$(search_bar).removeClass("search_default").addClass("search_default selected"); // Set text to black	 
	});
	$(search_bar).blur(function() { // On blur
		if ($(search_bar).val() === '') { // If no text in search
			$(search_bar).removeClass("search_default selected").addClass("search_default"); // Set text to gray
			this.value = default_message; // Reset value
		}
	});

	// PERFORM SEARCH
	$(search_bar).keypress(function(e) { // Perform search when user presses enter
		if (e.which == 13 && $.trim($(this).val().length) > 2) { // If enter key pressed and query is valid 
			doSearch($.trim($(this).val())); // Start search process
		}
	});

	// STOP SEARCH
	$('#stop_search').click(function() {
		xmlHttpRequest.abort(); // Stop ajax search
		$("#currently_searching").fadeOut(100);
	});
	
	// LIVE HANDLERS FOR POPUP NAVIGATION
	$('.tab_popup_right_img').live('click',function() {
		var tabPopup = $(this).parent().parent();
		if ( $(tabPopup).find('.tab_popup_list:eq(0)').is(':visible') && $(tabPopup).find('.tab_popup_list:eq(1) li').length > 0) {
			$(this).parent().find('h3').html('<h3>CHORDS</h3>');
			$(tabPopup).find('.tab_popup_list:eq(0)').hide();
			$(tabPopup).find('.tab_popup_list:eq(1)').show();
			$(this).css('background-image',"url('img/smallarrow_right_off.png')");
			$(this).parent().find('.tab_popup_left_img').css('background-image',"url('img/smallarrow_left_on.png')");
			reCalculateOffsetsViewer($(tabPopup).parent(),"right");
		}
	});
	
	$('.tab_popup_left_img').live('click',function() {
		if ( $(this).parent().parent().find('.tab_popup_list:eq(1)').is(':visible') && $(this).parent().parent().find('.tab_popup_list:eq(0) li').length > 0 ) {
			$(this).parent().find('h3').html('<h3>TABS</h3>');
			$(this).parent().parent().find('.tab_popup_list:eq(1)').hide();
			$(this).parent().parent().find('.tab_popup_list:eq(0)').show();
			$(this).css('background-image',"url('img/smallarrow_left_off.png')");
			$(this).parent().find('.tab_popup_right_img').css('background-image',"url('img/smallarrow_right_on.png')");
			reCalculateOffsetsViewer($(this).parent().parent().parent(),"left");
		}
	});
	
	//MORE RESULTS
	$('#load_more').live('click',function(){
		// Close any existing popups for offset safety
		$('.tab_popup').hide();
		$('.track').width(460);
		$(this).remove();
		searchingPage++; // Go to next page
		searchUltimateGuitar(currentSearchStr,searchingPage); // Search it
	});

}); // End doc ready

// Begins a NEW search process

function doSearch(search_str) {
	// Cancel any old processes
	try {
		xmlHttpRequest.abort();
	} catch (err) {}

	$('#search').animate({ // Bring search bar back up
		marginTop: "35px"
	}, 150);
	
	$('#info_panel').fadeIn(200);
	
	// Reset variables
	currentPage = 0;
	artistsHere = []; 
	totalPages = 1;
	activePage = 1;
	tracksOnPage = 0;
	searchingPage = 1;
	currentSearchStr = search_str;
	$('#error').hide();
	$('#counter span').html("0"); // Reset counter
	$('#tab_container').html('<div class="artist_block_wrapper"></div>'); // Remove any previous result sets then create first page
	$('#tab_container').css('marginLeft',0); // Return to first page
	$('#tab_file_container').hide(); // Hide tab viewer if open
	$('#tab_wrapper').show(); // Show tab results if not open
	$('#leftarrowimg').css('background-image',"url('img/arrow_left_off.png')"); 
	$('#rightarrowimg').css('background-image',"url('img/arrow_right_off.png')");
	$('#page_info span').html(activePage+" of "+totalPages); // Update current page info
	
	// Begin scraping ultimate guitars site
	searchUltimateGuitar(search_str, '1');
}

// Increments the songs found counter by one

function updateSongsFound() {
	var ref = $('#counter span');
	var number = parseInt($(ref).html(), 10);
	number += 1;
	$(ref).html(number);
}

function searchUltimateGuitar(search_str, page) {
	$("#currently_searching").fadeIn(200);
	// Grab first page of search results
	xmlHttpRequest = $.get('search_ug.php', {
		"request": search_str,
		"page": page
	},
	// Print the results

	function(data) {
		var result = $.parseJSON(data); // The array of tab result data
	
		if (result.length > 1) {	// If we have results, print them
			addResults(result);
		}
			  
		var pages = Math.ceil(result[0].totalsongs / 50); // The number of pages found	
					
		if (result[0].totalsongs <= 0 && searchingPage == 1) { // Search finished (no results were found)
			$('#info_panel').fadeOut(200,function(){
				$('#error').html('<div id="error_img"></div><span>Gah! Nothing was found for "'+currentSearchStr+'".</span>').fadeIn(300); // Fade in 'no songs found' error
			});
		}
		
		// Hide searching inidcator				  
		$("#currently_searching").fadeOut(200);
	}); // Ajax call								
}

// Adds a result set to the DOM							  

function addResults(results) {

	// Itterate through every song and add them to DOM (ignores data at index 0 as it is total songs)
	for (var x = 1; x < results.length; x++) {

		if (results[x].alt === false) { // If song is not an alternative version 
	
			// Check whether we need to change the page...
			if (tracksOnPage == MAX_TRACKS_PER_PAGE) {
				changePage();
			}

			if ($.inArray(results[x].artist, artistsHere) != -1) { // If artist already there add track to list
				// The artist block where this song belongs (.eq(param) param is the index of the artist block (shares same index as one in artistHere array)
				var artistBlock = $('.artist_block_wrapper:eq(' + currentPage + ')').find('.artist_block').eq($.inArray(results[x].artist, artistsHere));

				var songReference;
				// Check if song exists
				var songNotFound = true;
				$(artistBlock).find('.track_wrapper').each(function(){
					if ($(this).find('.track h2').html() == $.trim(results[x].song)) {
						songNotFound = false;
						songReference = $(this);
						return false;
					}
				});
				
				// Determine whether chord or tab
				if (results[x].type == 'tab') { // is tab
					var listIndex = 0;
				} else { // is chord
					var listIndex = 1;
				}

				// Generate the div rating tags
				var rating = '';
				for (var i = 0; i < results[x].rating; i++) {
					rating += '<div class="star"></div>';
				}

				// Append the song to the bottom of the list if song doesn't exist
				if(songNotFound){
					$(artistBlock).find('.artist_block_footer').before('<div class="track_wrapper"><div class="track" ><h2>' + results[x].song + '</h2><div class="emblem"><div class="emblem_img"></div><h3>1</h3></div></div><div class="eye"><div class="eye_img"></div></div></div>');
					// The position of the popup	
					var position = $(artistBlock).find('.track_wrapper').last().offset().top - 165;
					// Generate correct list (one for chords and one for tab)
					if (listIndex == 0) { // is tab
						var theList = '<ul class="tab_popup_list"><li><div class="hidden">'+results[x].link+'</div><span>Ver 1</span>' + rating + '</li></ul><ul class="tab_popup_list" style="display:none"></ul>';
					} else { // is chord
						var theList = '<ul class="tab_popup_list"></ul><ul class="tab_popup_list" style="display:none"><li><div class="hidden">'+results[x].link+'</div><span>Ver 1</span>' + rating + '</li></ul>';
					}

					// Find the track we just added and add the popup menu (essentially adding 'ver 1')
					$(artistBlock).find('.track_wrapper').last().prepend('<div class="tab_popup" style="left:450px;top:' + position + 'px"><div class="tab_popup_head"></div><div class="tab_popup_body"><div class="tab_popup_header"><div class="tab_popup_left_img"></div><div class="tab_popup_right_img"></div><h3>TABS</h3><div class="tab_popup_quit_img"></div></div><div class="clear"></div><div class="tab_popup_seperator"></div>'+theList+'</div><div class="tab_popup_foot"></div></div>');


					updateSongsFound(); // Increment song found counter
					// Add row highlighting
					$('.artist_block_wrapper:eq(' + currentPage + ') .artist_block').each(function() { // Loop through artist blocks
						$(this).find('.track_wrapper:odd').each(function() {
							$(this).find('.track').addClass('alt');
						});
					});
					// Re-calculate tab offsets - Not particulary nice but it has to be done :-(
					reCalculateOffsets();
					tracksOnPage++;
					$(artistBlock).find('.artist_header h3 span').html(parseInt($(artistBlock).find('.artist_header h3 span').html(), 10) + 1); // Increment artist blocks counter
				} else { // Song is already there so find it and add this version
					$(songReference).find('.tab_popup .tab_popup_body ul.tab_popup_list:eq('+listIndex+')').append('<li><div class="hidden">'+results[x].link+'</div><span>Ver 1</span>' + rating + '</li>'); 
					// Update 'versions found for this song' counter
					$(songReference).find('.track .emblem h3').html(parseInt($(songReference).find('.track .emblem h3').html(), 10) + 1);
					// We are adding a chord so set right arrow to enabled
					$(songReference).find('.tab_popup .tab_popup_body .tab_popup_header .tab_popup_right_img').css('background-image',"url('img/smallarrow_right_on.png')");
				}
			

			} else { // Artist isn't there so create new block
				// Before we add this artist we may need to change page
				if(artistsHere.length == MAX_ARTISTS_PER_PAGE){
					changePage();
				}
				artistsHere.push(results[x].artist); // Add this artist to the artistsHere array
				$('.artist_block_wrapper:eq('+currentPage+')').append( // Create the new artist block 
				'<div class="artist_block"> <div class="artist_header"> <h2>' + results[x].artist + '</h2><h3><span>0</span> SONGS</h3></div>  <div class="artist_block_footer"></div> </div>');
				// decrement x to add this song on the next itteration
				x--;
			}

		} else if (results[x].alt === true) { // Song is an alternative version so find it's song and add the version
			// All tracks for this artist
			var trackWrappers = $('.artist_block_wrapper:eq(' + currentPage + ')').find('.artist_block').eq($.inArray(results[x].artist, artistsHere)).find('.track_wrapper');
			// Find correct song
			$(trackWrappers).each(function() {
				// If we found correct track
				if ($(this).find('.track h2').html() == $.trim(results[x].song)) {
					var listIndex = (results[x].type == 'tab') ? "0" : "1"; // Could be first list for tab or second list for chords
					// Determine track version
					var version = $(this).find('.tab_popup .tab_popup_body ul.tab_popup_list:eq('+listIndex+') li').length + 1;
					// Generate the div rating tags
					var rating = '';
					for (var i = 0; i < results[x].rating; i++) {
						rating += '<div class="star"></div>';
					}
					// Add alt version
					$(this).find('.tab_popup .tab_popup_body ul.tab_popup_list:eq('+listIndex+')').append('<li><div class="hidden">'+results[x].link+'</div><span>Ver ' + version + '</span>' + rating + '</li>');
					// Re-calibrate popup's offset
					reCalculateOffsets();
					// Increment counter
					$(this).find('.track .emblem h3').html(parseInt($(this).find('.track .emblem h3').html(), 10) + 1);
					return false; // break loop
				}
			});
		}
	} // End itteration of result set
	if(searchingPage < 10){ // If we're not on last page we may have more results if user wants to search
		$('.artist_block_wrapper:eq(' + currentPage + ')').append('<div id="load_more">Load more results<span style="display:none">'+searchingPage+'</span></div>'); // Load more results
	}
}

function reCalculateOffsets() {
	// Iterate through artist blocks
	$('.artist_block_wrapper:eq(' + currentPage + ')').find('.artist_block').each(function() {
		// Iterate through tracks
		$(this).find('.track_wrapper').each(function() {
			// The offset
			var position = $(this).offset().top - 165;
			// See how many songs there are in the popup and adjust offset accordingly
			for (var i = 1; i < $(this).find('.tab_popup .tab_popup_body ul.tab_popup_list:eq(0) li').length; i++) {
				position -= 19;
			}
			// Apply offset
			$(this).find('.tab_popup').css('top', position);

		});
	});
}

function changePage() {
	// Set variables
	currentPage++;
	totalPages++;
	tracksOnPage = 0;
	artistsHere = [];
	$('#page_info span').html(activePage+" of "+totalPages); // Update current page info

	// Create new page
	$('#tab_container').append('<div class="artist_block_wrapper"></div>');
	
	// We have at least two pages now so change right arrow nav image to on
	$('#rightarrowimg').css('background-image',"url('img/arrow_right_on.png')");
}

// Re-calculates offsets when switching between chords and tabs
function reCalculateOffsetsViewer(popup, direction){
	if(direction == "right"){
		var offset = parseInt($(popup).css('top'),10) - (($(popup).find('.tab_popup_body .tab_popup_list:eq(1) li').length - $(popup).find('.tab_popup_body .tab_popup_list:eq(0) li').length) * 19);
		$(popup).css('top', offset);
	}else{ // We're moving left
		var offset = parseInt($(popup).css('top'),10) + (($(popup).find('.tab_popup_body .tab_popup_list:eq(1) li').length - $(popup).find('.tab_popup_body .tab_popup_list:eq(0) li').length) * 19);
		$(popup).css('top', offset);
	}
}