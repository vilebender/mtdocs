<?

	$platform = isset($_POST["platform"]) ? $_POST["platform"] : "unknown";

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

	/**
	 * Get an array that represents directory tree.
	 * @param string $directory Directory path
	 * @param bool $recursive Include sub directories
	 * @param bool $listDirs Include directories on listing
	 * @param bool $listFiles Include files on listing
	 * @param regex $exclude Exclude paths that matches this regex
	 * @return array
	 */
	function directoryToArray($directory, $recursive = true, $listDirs = false, $listFiles = true, $exclude = '') {
		$arrayItems = array();
		$skipByExclude = false;
		$handle = opendir($directory);
		if ($handle) {
			while (false !== ($file = readdir($handle))) {
			// preg_match("/(^(([\.]){1,2})$|(\.(svn|git|md))|(Thumbs\.db|\.DS_STORE))$/iu", $file, $skip);
			preg_match("/(^(([\.]){1,2})$|(\.(svn|git))|(Thumbs\.db|\.DS_STORE))$/iu", $file, $skip);
			if($exclude){
				preg_match($exclude, $file, $skipByExclude);
			}
			if (!$skip && !$skipByExclude) {
				if (is_dir($directory. DIRECTORY_SEPARATOR . $file)) {
					if($recursive) {
						$arrayItems = array_merge($arrayItems, directoryToArray($directory. DIRECTORY_SEPARATOR . $file, $recursive, $listDirs, $listFiles, $exclude));
					}
					if($listDirs){
						$file = $directory . DIRECTORY_SEPARATOR . $file;
						$arrayItems[] = $file;
					}
				} else {
					if($listFiles){
						$file = $directory . DIRECTORY_SEPARATOR . $file;
						$arrayItems[] = $file;
					}
				}
			}
		}
		closedir($handle);
		}
		return $arrayItems;
	}

	$directoryToArrayFn = 'directoryToArray';
	function createData()
	{
		global $platform, $directoryToArrayFn;

		$dir = "data";
		$exclude = "/Intro\.md|license\.md/";

		$ritit = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir), RecursiveIteratorIterator::CHILD_FIRST);
		$listing = array();
		foreach ($ritit as $splFileInfo)
		{
			if (preg_match($exclude, $splFileInfo->getFilename()) === 1) continue;

			$path = $splFileInfo->isDir()
				? array($splFileInfo->getFilename() => array())
				: array($splFileInfo->getFilename());

			for ($depth = $ritit->getDepth() - 1; $depth >= 0; $depth--)
				$path = array($ritit->getSubIterator($depth)->current()->getFilename() => $path);

			$listing = array_merge_recursive($listing, $path);
		}

		$files = $directoryToArrayFn($dir, true, false, true, $exclude);
		$files_methods = array();

		foreach ($files as $file)
		{
			preg_match_all("/(\{\#.+?\})/", file_get_contents($file), $matches);

			$files_methods[] = array(
				"file" => $file,
				"methods" => $matches[0]
			);
		}

		$result = json_encode(array(
			"platform" => $platform,
			"listing" => $listing,
			"files_methods" => $files_methods
		));

		file_put_contents("data.json", $result);

		return $result;
	}

	if (file_exists("data.json"))
	{
		$result = file_get_contents("data.json");
		$tmp_data = json_decode($result);
		$stored_platform = $tmp_data->platform;

		if ($stored_platform != $platform) $result = createData();

		output($result, "application/json");
	}
	else
	{
		$result = createData();
		output($result, "application/json");
	}

?>