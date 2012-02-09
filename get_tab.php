<?php

include('simple_html_dom.php'); // PHP dom traversor

$result = file_get_html($_GET['request']); // Get page

$tab = $result->find('pre',0)->plaintext; // Get tab

echo ($tab); // Return tab

?>