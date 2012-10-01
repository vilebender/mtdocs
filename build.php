<?

	include "packager.php";

	function output($content, $type = "text/plain", $filename = null)
	{
		header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
		header("Cache-Control: no-store, no-cache, must-revalidate");
		header("Cache-Control: post-check=0, pre-check=0", false);
		header("Pragma: no-cache");

		if ($filename !== null) header('Content-Disposition: attachment; filename="' . $filename . '"');

		header("Content-Type: " . $type);
		echo $content;
		exit;
	}

	$file = isset($_POST['file']) ? str_replace(array(".md", "Docs"), array(".js", "Source"), $_POST['file']) : "";
	$filename = "mt-" . time() . ".js";

	$pkg = new Packager(array("data/core", "data/more"));
	// $result = $pkg->build_from_components(array($file));
	$result = $pkg->write_from_components($filename, array($file));

	// output($result, "text/plain", "mt.js");
	output(json_encode(array("filename" => $filename)), "application/json");

?>