<?

	function output($content, $type = "text/plain")
	{
		header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
		header("Cache-Control: no-store, no-cache, must-revalidate");
		header("Cache-Control: post-check=0, pre-check=0", false);
		header("Pragma: no-cache");
		header("Content-Type: " . $type);
		echo $content;
		exit;
	}

	if (file_exists($_POST["fileName"]))
		output(file_get_contents($_POST["fileName"]));
	else
		echo "null";

?>