Slick.definePseudo("dataFile", function(value)
{
	var str = Element.get(this, "data-md-file");
	if (str) str = str.split(separator).join("");
	if (separator == "/") value = value.split(separator).join("");
	return str == value;
});

Slick.definePseudo("dataMethod", function(value)
{
	var str = Element.get(this, "data-md-method");
	// if (str) str = str.split(separator).join("");
	return str == value;
});

function showLoading()
{
	$(document.body).addClass("loading");
};

function hideLoading()
{
	$(document.body).removeClass("loading");
};

function createDisplayLabel(value, type)
{
	var result = null;
	switch (type)
	{
		case "method":
			result = value.replace(/\{\#|\}/g, "").split(":").getLast();
			break;
		case "top10file":
			result = value.split(separator).getLast().replace(".md", "");
			break;
	}
	return result;
};

function setURI(value)
{
	document.location.hash = MD5(value);
};

function getElementInList(mode, value)
{
	switch (mode)
	{
		case "file":
			$$("[data-md-file]").removeClass("active");
			var collection = $$(':dataFile(' + value + ')');
			break;
		case "method":
			$$("[data-md-method]").removeClass("active");
			var collection = $$(':dataMethod(' + value + ')');
			break;
		default:
			var collection = [];
	}

	if (collection.length)
		return collection[0];
	else
		return null;
};

function getElementInContent(value)
{
	return containers.fileContent.getElement('*:contains("' + value + '")');
};

function scrollContainer(container, element, relativeTo, activeClass, offsetY)
{
	var relative = relativeTo || container;
	var y = element ? element.getPosition((relative == window ? $(document.body) : relative)).y : 0;
	container.scrollTo(0, y + (offsetY || 0));

	if (element) element.addClass(activeClass || "active");
};

function getFile(fileName, goTo)
{
	function success(response)
	{
		hideLoading();
		containers.logoContainer.addClass("hide");

		if (response == "null")
		{
			console.warn("Broken link: " + fileName);
			return;
		}

		// store
		storage.exec("CREATE TABLE IF NOT EXISTS topTen(id INTEGER PRIMARY KEY ASC, fileName TEXT, goTo TEXT, added DATETIME)");
		storage.exec("INSERT INTO topTen(fileName, goTo, added) VALUES (?, ?, ?)", null, [fileName, (goTo || fileName), new Date().format("db")]);

		var top10 = containers.fileContent.getElement("#top10");
		if (top10)
		{
			top10.addClass("hide");
			$(document.body).grab(top10, "bottom");
			window.removeEvents("keydown");
			generalKeys();
		}

		containers.fileContent.set("html", converter.makeHtml(response));
		containers.fileContent.getElements("*").removeProperty("id");
		containers.fileContent.getElements("h2").each(function(el)
		{
			templates.toTheTopBtn.render().inject(el, "top");
		});

		containers.fileContent.getElements("pre").each(function(element)
		{
			element.addClass("javascript");
			hljs.highlightBlock(element);
		});


		containers.fileContent.getElements("a").each(function(anchor)
		{
			var href = anchor.get("href");

			if (href.test("http"))
			{
				anchor.set("target", "_blank");
			}
			else
			{
				anchor.addEvent("click", function(e)
				{
					if (e) e.preventDefault();

					var bits = href
						.split("/")
						.filter(function(item){
							return item.length;
						})
						.map(function(item){
							return item.split("#")[0];
						});

					var file = paths[bits[0]].join(separator) + separator + bits.slice(1).join(separator) + ".md";

					getFile(file);
				});
			}
		});

		var files_methods = containers.methodsList.retrieve("data");

		containers.methodsList.empty();
		containers.methodsList.getParent().addClass("soft-hide");

		files_methods.each(function(file_method)
		{
			if (file_method.file == fileName)
			{
				containers.methodsList.getParent().removeClass("soft-hide");

				new Element("li",
				{
					class: "nav-header"
					, text: "Methods"
				}).inject(containers.methodsList);

				file_method.methods.each(function(method)
				{
					templates.methodListItem.render({
						fileName: fileName
						, goTo: method
						, displayLabel: createDisplayLabel(method, "method")
					}).inject(containers.methodsList);
				});
			}
		});

		if (goTo)
		{
			scrollContainer(window, getElementInContent(goTo), null, "highlight", -100);
			scrollContainer(containers.methodsList.getParent(), getElementInList("method", goTo), containers.methodsList);
		}

		containers.searchBox.getElement("input").blur();

		scrollContainer(containers.filesList.getParent(), getElementInList("file", fileName), containers.filesList);
	};

	new Request({
		url: "getfile.php"
		, data: {
			fileName: fileName
		}
		, onRequest: showLoading
		, onSuccess: success
	}).send();
};

function showTopTen()
{
	if (containers.top10.hasClass("hide"))
	{
		$$("[data-md-file]").removeClass("active");
		$$("[data-md-method]").removeClass("active");
		$$('[class = "highlight"]').removeClass("highlight");
		containers.searchBox.getElement("input").set("value", "");
		containers.fileContent.empty();
		containers.fileContent.grab(containers.top10, "top");
		containers.methodsList.getParent().addClass("soft-hide");
		containers.top10.removeClass("hide");

		scrollContainer(containers.filesList.getParent());

		showLoading();
		top10Rows();
	}
}

function generalKeys()
{
	window.addEvent("keydown:keys(f)", function(e)
	{
		var element = containers.searchBox.getElement("input");
		if (e.target != element)
		{
			e.preventDefault();
			scrollContainer(window);
			element.selectRange(0, element.get("value").length);
		}
	});

	window.addEvent("keydown:keys(t)", function(e)
	{
		var element = containers.searchBox.getElement("input");
		if (e.target != element)
		{
			e.preventDefault();
			showTopTen();
		}
	});
};

function top10Keys()
{
	containers.top10.retrieve("data").each(function(item)
	{
		window.addEvent("keydown:keys(" + item.n + ")", function(e)
		{
			var element = containers.searchBox.getElement("input");
			if (e.target != element)
			{
				e.preventDefault();

				getFile(item.fileName, item.goTo);
			}
		});
	});
};

function top10Rows()
{
	var SQLRows = [];

	containers.top10.empty();

	storage.exec("SELECT goTo, fileName, COUNT(id) AS count FROM topTen GROUP BY goTo ORDER BY COUNT(id) DESC, added DESC LIMIT 10", function(t, r){
		for (var i = 0; i < r.rows.length; i++)
		{
			var fileName = r.rows.item(i).fileName;
			var goTo = r.rows.item(i).goTo;
			var count = r.rows.item(i).count;
			var n = i < 10 ? i + 1 : 0;

			templates.top10Item.render({
				fileName: fileName
				, goTo: goTo
				, displayLabel: (goTo != fileName ? createDisplayLabel(goTo, "method") + " @ " : "") + createDisplayLabel(fileName, "top10file")
				, key: n
				, count: count
			}).inject(containers.top10);

			SQLRows.push({
				n: n
				, fileName: fileName
				, goTo: goTo
			});
		}

		containers.top10.store("data", SQLRows);

		hideLoading();
		top10Keys();

		containers.logoContainer.addClass("hide");
	});
};

function positionAndPin()
{
	// remove class "pinned-well"
	containers.filesList.getParent().removeClass("pinned-well");
	containers.methodsList.getParent().removeClass("pinned-well");
	containers.searchBox.removeClass("pinned-well");

	// files list
	containers.filesList.getParent().setStyles({
		"width": containers.filesList.getParent().getParent().getSize().x
		, "max-height": window.getSize().y - 65
		, "left": containers.filesList.getParent().getParent().getPosition().x
	});

	// methods list
	containers.methodsList.getParent().setStyles({
		"width": containers.methodsList.getParent().getParent().getSize().x
		, "max-height": window.getSize().y - 65
		, "left": containers.methodsList.getParent().getParent().getPosition().x
	});

	// search box
	containers.searchBox.setStyles({
		"width": containers.searchBox.getParent().getSize().x
		, "left": containers.searchBox.getParent().getPosition().x
	});
	containers.searchBox.removeClass("soft-hide");
	($("below-search-box") || new Element("div",
	{
		id: "below-search-box"
		, class: "white-noise"
	}).inject(containers.searchBox, "after")).setStyles({
		"height": 20 + containers.searchBox.getSize().y + 2
		, "width": containers.searchBox.getSize().x + 4
		, "background-color": "#fff"
		, "z-index": 5
		, "position": "fixed"
		, "left": containers.searchBox.getPosition().x - 2
		, "top": "26px"
	});
	($("above-search-box") || new Element("div",
	{
		id: "above-search-box"
		, class: "white-noise"
	}).inject(containers.searchBox, "after")).setStyles({
		"height": "26px"
		, "width": window.getSize().x
		, "background-color": "#fff"
		, "z-index": 5
	}).position({
		relativeTo: $(document.body)
		, position: "topLeft"
		, edge: "topLeft"
	}).setStyle("position", "fixed");

	// add class "pinned-well"
	containers.filesList.getParent().addClass("pinned-well");
	containers.methodsList.getParent().addClass("pinned-well");
	containers.searchBox.addClass("pinned-well");
};

function filesListRequest()
{
	function success(response)
	{
		hideLoading();

		var theListing = response.listing;
		var joinedListing = {};

		Object.each(theListing.core.Docs, function(files, folder)
		{
			files.sort();
			joinedListing[folder] = {
				core: files
			};

			if (theListing.more.Docs[folder])
			{
				theListing.more.Docs[folder].sort();
				joinedListing[folder]["more"] = theListing.more.Docs[folder];
				theListing.more.Docs[folder] = null;
			}
		});

		Object.each(theListing.more.Docs, function(files, folder)
		{
			if (typeOf(files) == "array")
			{
				files.sort();
				joinedListing[folder] = {
					more: files
				};
			}
		});

		Object.each(joinedListing, function(filesObject, folder)
		{
			var folderElement = new Element("li",
			{
				class: "nav-header"
				, text: folder
			}).inject(containers.filesList);

			var badges = {
				core: "badge-info"
				, more: "badge-success"
			};

			Object.each(filesObject, function(files, pack)
			{
				files.each(function(file)
				{
					var basePath = paths[pack].join(separator) + separator + folder;

					var noExtension = file.replace(".md", "");
					var noBaseName = noExtension.replace(folder + ".", "");

					var whereInject = (noExtension == folder) ? [folderElement, "after"] : [containers.filesList];

					var theRender = templates.fileListItem.render({
						fileName: basePath + separator + file
						, displayLabel: (noExtension == folder) ? "[Base]" : noBaseName
						, packCls: badges[pack]
						, packAbbr: pack.substr(0, 1)
						, folder: folder
					});

					theRender.inject.apply(theRender, whereInject);
				});
			});
		});

		containers.filesList.getParent().removeClass("soft-hide");

		containers.methodsList.store("data", response.files_methods);

		attachAutocomplete(response.files_methods);

		// position pinned
		positionAndPin();
		window.addEvent("resize", positionAndPin);

		// logo
		loadLogo("v2");
	};

	function attachAutocomplete(data)
	{
		var autocompleteData = [];

		data.each(function(file_method)
		{
			file_method.methods.each(function(method)
			{
				var insert = {
					value: file_method.file
					, raw: method
					, text: createDisplayLabel(method, "method")
				};

				autocompleteData.push(insert);
			});
		});

		var autocomplete = new Meio.Autocomplete(
			containers.searchBox.getElement("input")
			, autocompleteData
			, {
				delay: 100
				, minChars: 1
				, filter: {
					filter: function(text, data)
					{
						return text ? data.text.test(new RegExp(text.escapeRegExp(), 'i')) : true;
					}
					, formatMatch: function(text, data)
					{
						return data.text;
					}
					, formatItem: function(text, data)
					{
						return data.text + ' <span class="extra-bit">(' + data.value.split(separator).getLast().replace(".md", "") + ")</span>";
					}
				}
				, onSelect: function(a, b)
				{
					getFile(b.value, b.raw);
				}
			}
		);
	};
	new Request.JSON({
		url: "fileslist.php"
		, data: {
			platform: Browser.Platform.name
		}
		, onRequest: showLoading
		, onSuccess: success
	}).send();
};

function loadLogo(version)
{
	containers.logoContainer.set("load",
	{
		onComplete: function()
		{
			hljs.highlightBlock(containers.logoContainer.getElement("pre"));
			containers.logoContainer.getElement("#logo").tween("opacity", 0, 1);

			// close action
			var close_btn = containers.logoContainer.getElement(".close");
			if (close_btn)
			{
				close_btn.addEvent("click", function()
				{
					showTopTen();
				});
			}
		}
	});
	Asset.css("logo-" + version + ".css", {media: "screen"});
	containers.logoContainer.load("logo-" + version + ".html");
};

window.addEvent("domready", function()
{
	generalKeys();

	containers.searchBox.getElement("button").addEvent("click", showTopTen);

	// init request
	filesListRequest();
});