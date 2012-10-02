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
		);
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
		);
	})
	, toTheTopBtn: new Mooml.Template("toTheTopBtn", function(data){
		div(
			{
				class: "btn-group pull-left"
			}
			, button(
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
			, button
			(
				{
					class: "btn btn-small btn-inverse dropdown-toggle"
					, events: {
						click: function()
						{
							this.getParent().toggleClass("open");
							clickMask();
						}
					}
				}
				, span(
					{
						class: "caret"
					}
				)
			)
			, ul
			(
				{
					class: "dropdown-menu"
				}
				, li(
					{
						class: "disabled"
					}
					, a(
						{
							href: "javascript:void(0)"
							, events: {
								click: function()
								{
									return;
									/*new Request.JSON({
										url: "build.php"
										, data: {
											file: data.file
										}
										, onSuccess: function(json)
										{
											new Element("iframe",
											{
												src: json.filename
											}).inject($(document.body)).hide();
										}
									}).send();*/
								}
							}
						}
						, "Build"
					)
				)
				, li(
					{
						class: "disabled"
					}
					, a(
						{
							href: "javascript:void(0)"
							, events: {
								click: function()
								{
									return;
									/*$$(".click-mask").fireEvent("click");

									var modal = (this.retrieve("modal") || templates.fiddle.render().inject($(document.body)))
										.removeClass("hide");

									this.store("modal", modal);

									clickMask("dark-mask");*/
								}
							}
						}
						, "Fiddle"
					)
				)
				, li(a({href: "javascript:void(0)"}, "Add to favourites"))
			)
		);
	})
	, fiddle: new Mooml.Template("fiddle", function(data){
		div(
			{
				class: "modal hide"
			}
			, div(
				{
					class: "modal-header"
				}
				, button(
					{
						class: "close"
						, "aria-hidden": true
						, events: {
							click: function()
							{
								$$(".click-mask").fireEvent("click");
							}
						}
					}
					, "&times;"
				),
				h3("jsFiddle")
			)
			, div(
				{
					class: "modal-body"
				}
				, p(
					iframe(
						{
							src: "http://jsfiddle.net/vilebender/aZs5b/embedded/"
							, allowfullscreen: "allowfullscreen"
							, frameborder: "frameborder"
							, styles: {
								width: "100%"
								, height: 300
							}
						}
					)
				)
			)
			, div(
				{
					class: "modal-footer"
				}
				, button(
					{
						class: "btn"
						, events: {
							click: function()
							{
								$$(".click-mask").fireEvent("click");
							}
						}
					}
					, "Done playing"
				)
			)
		);
	})
};

// <iframe style="width: 100%; height: 300px" src="http://jsfiddle.net/vilebender/aZs5b/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

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