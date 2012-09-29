var storage = new MooSQL({
	dbName: "MooToolsDocsByRumian"
	, dbVersion: "1.0"
	, dbDesc: ""
	, dbSize: 128 * 1024
});
var separator = Browser.Platform.win ? "\\" : "/";
var converter = new Showdown.converter();
var templates = {
	top10Item: new Mooml.Template("top10Item", function(data)
	{
		li(
			a(
				{
					href: "#"
					, events: {
						click: function(e)
						{
							if (e) e.preventDefault();

							getFile(data.fileName, data.goTo);
						}
					}
				}
				, div(
					{
						class: "key light"
					}
					, data.key
				)
				, data.displayLabel
				, span(
					{
						class: "badge"
					}
					, data.count
				)
			)
		)
	})
	, fileListItem: new Mooml.Template("fileListItem", function(data)
	{
		li(
			{
				"data-md-file": data.fileName
			}
			, a(
				{
					href: "#"
					, events: {
						click: function(e)
						{
							if (e) e.preventDefault();

							getFile(data.fileName);
						}
					}
				}
				, (data.packCls && data.packAbbr) ? span(
					{
						class: "badge badge-package " + data.packCls
					}
					, data.packAbbr
				) : null
				, data.displayLabel
				, span
				(
					{
						class: "label"
					}
					, data.folder
				)
			)
		);
	})
	, methodListItem: new Mooml.Template("methodListItem", function(data)
	{
		li(
			{
				"data-md-method": data.goTo
			}
			, a(
				{
					href: "#"
					, events: {
						click: function(e)
						{
							if (e) e.preventDefault();

							scrollContainer(window, getElementInContent(data.goTo), null, "highlight", -100);
							scrollContainer(containers.methodsList.getParent(), getElementInList("method", data.goTo), containers.methodsList);
						}
					}
				}
				, data.displayLabel
			)
		)
	})
	, toTheTopBtn: new Mooml.Template("toTheTopBtn", function(data){
		button(
			{
				class: "btn btn-small btn-inverse"
				, events: {
					click: function()
					{
						scrollContainer(window);
					}
				}
			}
			, i(
				{
					class: "icon-chevron-up icon-white"
				}
			)
		)
	})
};
var containers = {
	filesList: $("files-list")
	, fileContent: $("file-content")
	, methodsList: $("methods-list")
	, searchBox: $("search-box")
	, top10: $("top10")
	, logoContainer: $("logo-container")
};
var paths = {
	core: ["data", "core", "Docs"]
	, more: ["data", "more", "Docs"]
};