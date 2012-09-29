<?

	include "packager.php";

	$pkg = new Packager("lighter");
	$pkg->write_from_components("lighter.js", array("Lighter"));

?>