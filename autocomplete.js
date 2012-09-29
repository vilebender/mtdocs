/*
---

script: More.js

name: More

description: MooTools More

license: MIT-style license

authors:
  - Guillermo Rauch
  - Thomas Aylott
  - Scott Kyle
  - Arian Stolwijk
  - Tim Wienk
  - Christoph Pojer
  - Aaron Newton
  - Jacob Thornton

requires:
  - Core/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
	'version': '1.4.0.1',
	'build': 'a4244edf2aa97ac8a196fc96082dd35af1abab87'
};


/*
---

script: String.Extras.js

name: String.Extras

description: Extends the String native object to include methods useful in managing various kinds of strings (query strings, urls, html, etc).

license: MIT-style license

authors:
  - Aaron Newton
  - Guillermo Rauch
  - Christopher Pitt

requires:
  - Core/String
  - Core/Array
  - MooTools.More

provides: [String.Extras]

...
*/

(function(){

var special = {
	'a': /[àáâãäåăą]/g,
	'A': /[ÀÁÂÃÄÅĂĄ]/g,
	'c': /[ćčç]/g,
	'C': /[ĆČÇ]/g,
	'd': /[ďđ]/g,
	'D': /[ĎÐ]/g,
	'e': /[èéêëěę]/g,
	'E': /[ÈÉÊËĚĘ]/g,
	'g': /[ğ]/g,
	'G': /[Ğ]/g,
	'i': /[ìíîï]/g,
	'I': /[ÌÍÎÏ]/g,
	'l': /[ĺľł]/g,
	'L': /[ĹĽŁ]/g,
	'n': /[ñňń]/g,
	'N': /[ÑŇŃ]/g,
	'o': /[òóôõöøő]/g,
	'O': /[ÒÓÔÕÖØ]/g,
	'r': /[řŕ]/g,
	'R': /[ŘŔ]/g,
	's': /[ššş]/g,
	'S': /[ŠŞŚ]/g,
	't': /[ťţ]/g,
	'T': /[ŤŢ]/g,
	'ue': /[ü]/g,
	'UE': /[Ü]/g,
	'u': /[ùúûůµ]/g,
	'U': /[ÙÚÛŮ]/g,
	'y': /[ÿý]/g,
	'Y': /[ŸÝ]/g,
	'z': /[žźż]/g,
	'Z': /[ŽŹŻ]/g,
	'th': /[þ]/g,
	'TH': /[Þ]/g,
	'dh': /[ð]/g,
	'DH': /[Ð]/g,
	'ss': /[ß]/g,
	'oe': /[œ]/g,
	'OE': /[Œ]/g,
	'ae': /[æ]/g,
	'AE': /[Æ]/g
},

tidy = {
	' ': /[\xa0\u2002\u2003\u2009]/g,
	'*': /[\xb7]/g,
	'\'': /[\u2018\u2019]/g,
	'"': /[\u201c\u201d]/g,
	'...': /[\u2026]/g,
	'-': /[\u2013]/g,
//	'--': /[\u2014]/g,
	'&raquo;': /[\uFFFD]/g
};

var walk = function(string, replacements){
	var result = string, key;
	for (key in replacements) result = result.replace(replacements[key], key);
	return result;
};

var getRegexForTag = function(tag, contents){
	tag = tag || '';
	var regstr = contents ? "<" + tag + "(?!\\w)[^>]*>([\\s\\S]*?)<\/" + tag + "(?!\\w)>" : "<\/?" + tag + "([^>]+)?>",
		reg = new RegExp(regstr, "gi");
	return reg;
};

String.implement({

	standardize: function(){
		return walk(this, special);
	},

	repeat: function(times){
		return new Array(times + 1).join(this);
	},

	pad: function(length, str, direction){
		if (this.length >= length) return this;

		var pad = (str == null ? ' ' : '' + str)
			.repeat(length - this.length)
			.substr(0, length - this.length);

		if (!direction || direction == 'right') return this + pad;
		if (direction == 'left') return pad + this;

		return pad.substr(0, (pad.length / 2).floor()) + this + pad.substr(0, (pad.length / 2).ceil());
	},

	getTags: function(tag, contents){
		return this.match(getRegexForTag(tag, contents)) || [];
	},

	stripTags: function(tag, contents){
		return this.replace(getRegexForTag(tag, contents), '');
	},

	tidy: function(){
		return walk(this, tidy);
	},

	truncate: function(max, trail, atChar){
		var string = this;
		if (trail == null && arguments.length == 1) trail = '…';
		if (string.length > max){
			string = string.substring(0, max);
			if (atChar){
				var index = string.lastIndexOf(atChar);
				if (index != -1) string = string.substr(0, index);
			}
			if (trail) string += trail;
		}
		return string;
	}

});

})();


/*
---

script: Element.Forms.js

name: Element.Forms

description: Extends the Element native object to include methods useful in managing inputs.

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element
  - /String.Extras
  - /MooTools.More

provides: [Element.Forms]

...
*/

Element.implement({

	tidy: function(){
		this.set('value', this.get('value').tidy());
	},

	getTextInRange: function(start, end){
		return this.get('value').substring(start, end);
	},

	getSelectedText: function(){
		if (this.setSelectionRange) return this.getTextInRange(this.getSelectionStart(), this.getSelectionEnd());
		return document.selection.createRange().text;
	},

	getSelectedRange: function(){
		if (this.selectionStart != null){
			return {
				start: this.selectionStart,
				end: this.selectionEnd
			};
		}

		var pos = {
			start: 0,
			end: 0
		};
		var range = this.getDocument().selection.createRange();
		if (!range || range.parentElement() != this) return pos;
		var duplicate = range.duplicate();

		if (this.type == 'text'){
			pos.start = 0 - duplicate.moveStart('character', -100000);
			pos.end = pos.start + range.text.length;
		} else {
			var value = this.get('value');
			var offset = value.length;
			duplicate.moveToElementText(this);
			duplicate.setEndPoint('StartToEnd', range);
			if (duplicate.text.length) offset -= value.match(/[\n\r]*$/)[0].length;
			pos.end = offset - duplicate.text.length;
			duplicate.setEndPoint('StartToStart', range);
			pos.start = offset - duplicate.text.length;
		}
		return pos;
	},

	getSelectionStart: function(){
		return this.getSelectedRange().start;
	},

	getSelectionEnd: function(){
		return this.getSelectedRange().end;
	},

	setCaretPosition: function(pos){
		if (pos == 'end') pos = this.get('value').length;
		this.selectRange(pos, pos);
		return this;
	},

	getCaretPosition: function(){
		return this.getSelectedRange().start;
	},

	selectRange: function(start, end){
		if (this.setSelectionRange){
			this.focus();
			this.setSelectionRange(start, end);
		} else {
			var value = this.get('value');
			var diff = value.substr(start, end - start).replace(/\r/g, '').length;
			start = value.substr(0, start).replace(/\r/g, '').length;
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', start + diff);
			range.moveStart('character', start);
			range.select();
		}
		return this;
	},

	insertAtCursor: function(value, select){
		var pos = this.getSelectedRange();
		var text = this.get('value');
		this.set('value', text.substring(0, pos.start) + value + text.substring(pos.end, text.length));
		if (select !== false) this.selectRange(pos.start, pos.start + value.length);
		else this.setCaretPosition(pos.start + value.length);
		return this;
	},

	insertAroundCursor: function(options, select){
		options = Object.append({
			before: '',
			defaultMiddle: '',
			after: ''
		}, options);

		var value = this.getSelectedText() || options.defaultMiddle;
		var pos = this.getSelectedRange();
		var text = this.get('value');

		if (pos.start == pos.end){
			this.set('value', text.substring(0, pos.start) + options.before + value + options.after + text.substring(pos.end, text.length));
			this.selectRange(pos.start + options.before.length, pos.end + options.before.length + value.length);
		} else {
			var current = text.substring(pos.start, pos.end);
			this.set('value', text.substring(0, pos.start) + options.before + current + options.after + text.substring(pos.end, text.length));
			var selStart = pos.start + options.before.length;
			if (select !== false) this.selectRange(selStart, selStart + current.length);
			else this.setCaretPosition(selStart + text.length);
		}
		return this;
	}

});

/*
---

script: Element.Measure.js

name: Element.Measure

description: Extends the Element native object to include methods useful in measuring dimensions.

credits: "Element.measure / .expose methods by Daniel Steigerwald License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
  - Aaron Newton

requires:
  - Core/Element.Style
  - Core/Element.Dimensions
  - /MooTools.More

provides: [Element.Measure]

...
*/

(function(){

var getStylesList = function(styles, planes){
	var list = [];
	Object.each(planes, function(directions){
		Object.each(directions, function(edge){
			styles.each(function(style){
				list.push(style + '-' + edge + (style == 'border' ? '-width' : ''));
			});
		});
	});
	return list;
};

var calculateEdgeSize = function(edge, styles){
	var total = 0;
	Object.each(styles, function(value, style){
		if (style.test(edge)) total = total + value.toInt();
	});
	return total;
};

var isVisible = function(el){
	return !!(!el || el.offsetHeight || el.offsetWidth);
};


Element.implement({

	measure: function(fn){
		if (isVisible(this)) return fn.call(this);
		var parent = this.getParent(),
			toMeasure = [];
		while (!isVisible(parent) && parent != document.body){
			toMeasure.push(parent.expose());
			parent = parent.getParent();
		}
		var restore = this.expose(),
			result = fn.call(this);
		restore();
		toMeasure.each(function(restore){
			restore();
		});
		return result;
	},

	expose: function(){
		if (this.getStyle('display') != 'none') return function(){};
		var before = this.style.cssText;
		this.setStyles({
			display: 'block',
			position: 'absolute',
			visibility: 'hidden'
		});
		return function(){
			this.style.cssText = before;
		}.bind(this);
	},

	getDimensions: function(options){
		options = Object.merge({computeSize: false}, options);
		var dim = {x: 0, y: 0};

		var getSize = function(el, options){
			return (options.computeSize) ? el.getComputedSize(options) : el.getSize();
		};

		var parent = this.getParent('body');

		if (parent && this.getStyle('display') == 'none'){
			dim = this.measure(function(){
				return getSize(this, options);
			});
		} else if (parent){
			try { //safari sometimes crashes here, so catch it
				dim = getSize(this, options);
			}catch(e){}
		}

		return Object.append(dim, (dim.x || dim.x === 0) ? {
				width: dim.x,
				height: dim.y
			} : {
				x: dim.width,
				y: dim.height
			}
		);
	},

	getComputedSize: function(options){


		options = Object.merge({
			styles: ['padding','border'],
			planes: {
				height: ['top','bottom'],
				width: ['left','right']
			},
			mode: 'both'
		}, options);

		var styles = {},
			size = {width: 0, height: 0},
			dimensions;

		if (options.mode == 'vertical'){
			delete size.width;
			delete options.planes.width;
		} else if (options.mode == 'horizontal'){
			delete size.height;
			delete options.planes.height;
		}

		getStylesList(options.styles, options.planes).each(function(style){
			styles[style] = this.getStyle(style).toInt();
		}, this);

		Object.each(options.planes, function(edges, plane){

			var capitalized = plane.capitalize(),
				style = this.getStyle(plane);

			if (style == 'auto' && !dimensions) dimensions = this.getDimensions();

			style = styles[plane] = (style == 'auto') ? dimensions[plane] : style.toInt();
			size['total' + capitalized] = style;

			edges.each(function(edge){
				var edgesize = calculateEdgeSize(edge, styles);
				size['computed' + edge.capitalize()] = edgesize;
				size['total' + capitalized] += edgesize;
			});

		}, this);

		return Object.append(size, styles);
	}

});

})();


/*
---

script: Element.Position.js

name: Element.Position

description: Extends the Element native object to include methods useful positioning elements relative to others.

license: MIT-style license

authors:
  - Aaron Newton
  - Jacob Thornton

requires:
  - Core/Options
  - Core/Element.Dimensions
  - Element.Measure

provides: [Element.Position]

...
*/

(function(original){

var local = Element.Position = {

	options: {/*
		edge: false,
		returnPos: false,
		minimum: {x: 0, y: 0},
		maximum: {x: 0, y: 0},
		relFixedPosition: false,
		ignoreMargins: false,
		ignoreScroll: false,
		allowNegative: false,*/
		relativeTo: document.body,
		position: {
			x: 'center', //left, center, right
			y: 'center' //top, center, bottom
		},
		offset: {x: 0, y: 0}
	},

	getOptions: function(element, options){
		options = Object.merge({}, local.options, options);
		local.setPositionOption(options);
		local.setEdgeOption(options);
		local.setOffsetOption(element, options);
		local.setDimensionsOption(element, options);
		return options;
	},

	setPositionOption: function(options){
		options.position = local.getCoordinateFromValue(options.position);
	},

	setEdgeOption: function(options){
		var edgeOption = local.getCoordinateFromValue(options.edge);
		options.edge = edgeOption ? edgeOption :
			(options.position.x == 'center' && options.position.y == 'center') ? {x: 'center', y: 'center'} :
			{x: 'left', y: 'top'};
	},

	setOffsetOption: function(element, options){
		var parentOffset = {x: 0, y: 0},
			offsetParent = element.measure(function(){
				return document.id(this.getOffsetParent());
			}),
			parentScroll = offsetParent.getScroll();

		if (!offsetParent || offsetParent == element.getDocument().body) return;
		parentOffset = offsetParent.measure(function(){
			var position = this.getPosition();
			if (this.getStyle('position') == 'fixed'){
				var scroll = window.getScroll();
				position.x += scroll.x;
				position.y += scroll.y;
			}
			return position;
		});

		options.offset = {
			parentPositioned: offsetParent != document.id(options.relativeTo),
			x: options.offset.x - parentOffset.x + parentScroll.x,
			y: options.offset.y - parentOffset.y + parentScroll.y
		};
	},

	setDimensionsOption: function(element, options){
		options.dimensions = element.getDimensions({
			computeSize: true,
			styles: ['padding', 'border', 'margin']
		});
	},

	getPosition: function(element, options){
		var position = {};
		options = local.getOptions(element, options);
		var relativeTo = document.id(options.relativeTo) || document.body;

		local.setPositionCoordinates(options, position, relativeTo);
		if (options.edge) local.toEdge(position, options);

		var offset = options.offset;
		position.left = ((position.x >= 0 || offset.parentPositioned || options.allowNegative) ? position.x : 0).toInt();
		position.top = ((position.y >= 0 || offset.parentPositioned || options.allowNegative) ? position.y : 0).toInt();

		local.toMinMax(position, options);

		if (options.relFixedPosition || relativeTo.getStyle('position') == 'fixed') local.toRelFixedPosition(relativeTo, position);
		if (options.ignoreScroll) local.toIgnoreScroll(relativeTo, position);
		if (options.ignoreMargins) local.toIgnoreMargins(position, options);

		position.left = Math.ceil(position.left);
		position.top = Math.ceil(position.top);
		delete position.x;
		delete position.y;

		return position;
	},

	setPositionCoordinates: function(options, position, relativeTo){
		var offsetY = options.offset.y,
			offsetX = options.offset.x,
			calc = (relativeTo == document.body) ? window.getScroll() : relativeTo.getPosition(),
			top = calc.y,
			left = calc.x,
			winSize = window.getSize();

		switch(options.position.x){
			case 'left': position.x = left + offsetX; break;
			case 'right': position.x = left + offsetX + relativeTo.offsetWidth; break;
			default: position.x = left + ((relativeTo == document.body ? winSize.x : relativeTo.offsetWidth) / 2) + offsetX; break;
		}

		switch(options.position.y){
			case 'top': position.y = top + offsetY; break;
			case 'bottom': position.y = top + offsetY + relativeTo.offsetHeight; break;
			default: position.y = top + ((relativeTo == document.body ? winSize.y : relativeTo.offsetHeight) / 2) + offsetY; break;
		}
	},

	toMinMax: function(position, options){
		var xy = {left: 'x', top: 'y'}, value;
		['minimum', 'maximum'].each(function(minmax){
			['left', 'top'].each(function(lr){
				value = options[minmax] ? options[minmax][xy[lr]] : null;
				if (value != null && ((minmax == 'minimum') ? position[lr] < value : position[lr] > value)) position[lr] = value;
			});
		});
	},

	toRelFixedPosition: function(relativeTo, position){
		var winScroll = window.getScroll();
		position.top += winScroll.y;
		position.left += winScroll.x;
	},

	toIgnoreScroll: function(relativeTo, position){
		var relScroll = relativeTo.getScroll();
		position.top -= relScroll.y;
		position.left -= relScroll.x;
	},

	toIgnoreMargins: function(position, options){
		position.left += options.edge.x == 'right'
			? options.dimensions['margin-right']
			: (options.edge.x != 'center'
				? -options.dimensions['margin-left']
				: -options.dimensions['margin-left'] + ((options.dimensions['margin-right'] + options.dimensions['margin-left']) / 2));

		position.top += options.edge.y == 'bottom'
			? options.dimensions['margin-bottom']
			: (options.edge.y != 'center'
				? -options.dimensions['margin-top']
				: -options.dimensions['margin-top'] + ((options.dimensions['margin-bottom'] + options.dimensions['margin-top']) / 2));
	},

	toEdge: function(position, options){
		var edgeOffset = {},
			dimensions = options.dimensions,
			edge = options.edge;

		switch(edge.x){
			case 'left': edgeOffset.x = 0; break;
			case 'right': edgeOffset.x = -dimensions.x - dimensions.computedRight - dimensions.computedLeft; break;
			// center
			default: edgeOffset.x = -(Math.round(dimensions.totalWidth / 2)); break;
		}

		switch(edge.y){
			case 'top': edgeOffset.y = 0; break;
			case 'bottom': edgeOffset.y = -dimensions.y - dimensions.computedTop - dimensions.computedBottom; break;
			// center
			default: edgeOffset.y = -(Math.round(dimensions.totalHeight / 2)); break;
		}

		position.x += edgeOffset.x;
		position.y += edgeOffset.y;
	},

	getCoordinateFromValue: function(option){
		if (typeOf(option) != 'string') return option;
		option = option.toLowerCase();

		return {
			x: option.test('left') ? 'left'
				: (option.test('right') ? 'right' : 'center'),
			y: option.test(/upper|top/) ? 'top'
				: (option.test('bottom') ? 'bottom' : 'center')
		};
	}

};

Element.implement({

	position: function(options){
		if (options && (options.x != null || options.y != null)){
			return (original ? original.apply(this, arguments) : this);
		}
		var position = this.setStyle('position', 'absolute').calculatePosition(options);
		return (options && options.returnPos) ? position : this.setStyles(position);
	},

	calculatePosition: function(options){
		return local.getPosition(this, options);
	}

});

})(Element.prototype.position);


/*
---

description: Port of bgiframe plugin for mootools

authors:
 - Fábio Miranda Costa

requires:
 - Core/Class.Extras

license: MIT-style license Original plugin copyright Copyright (c) 2006 Brandon Aaron (http://brandonaaron.net) Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses. Version 2.1.1

provides: [BGIFrame]

...
*/

(function(global, $){

	var isIE6 = Browser.ie6; // better compression and faster

	var BgIframe = new Class({
		Implements: Options,
		options: {
			top		: 'auto',
			left	: 'auto',
			width	: 'auto',
			height	: 'auto',
			opacity	: true,
			src		: 'javascript:false;'
		},
		initialize: function(element, options){
			if (!isIE6) return;
			this.setOptions(options);
			this.element = $(element);
			var firstChild = this.element.getFirst();
			if (!(firstChild && firstChild.hasClass('bgiframe'))){
				this.element.grab(document.createElement(this.render()), 'top');
			}
		},
		toPx: function(n){
			return isFinite(n) ? n + 'px' : n;
		},
		render: function(){
			var options = this.options;
			return '<iframe class="bgiframe" frameborder="0" tabindex="-1" src="' + options.src + '" ' +
				'style="display:block;position:absolute;z-index:-1;' +
				(options.opacity !== false ? 'filter:alpha(opacity=\'0\');' : '') +
				'top:' + (options.top == 'auto' ? 'expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+\'px\')' : this.toPx(options.top)) + ';' +
				'left:' + (options.left == 'auto' ? 'expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+\'px\')' : this.toPx(options.left)) + ';' +
				'width:' + (options.width == 'auto' ? 'expression(this.parentNode.offsetWidth+\'px\')' : this.toPx(options.width)) + ';' +
				'height:' + (options.height == 'auto' ? 'expression(this.parentNode.offsetHeight+\'px\')' : this.toPx(options.height)) + ';' +
			'"/>';
		}
	});

	Element.implement('bgiframe', function(options){
		if (isIE6) new BgIframe(this, options);
		return this;
	});

})(this, document.id || $);
/*
---

description: A plugin for enabling autocomplete of a text input or textarea.

authors:
 - Fábio Miranda Costa

requires:
 - Core/Class.Extras
 - Core/Element.Event
 - Core/Element.Style
 - More/Element.Forms

license: MIT-style license

provides: [Meio.Autocomplete]

...
*/

(function(global, $){

	var browser = Browser; // better compression and faster

	// Custom Events

	// thanks Jan Kassens
	Object.append(Element.NativeEvents, {
		'paste': 2, 'input': 2
	});
	Element.Events.paste = {
		base : (browser.opera || (browser.firefox && browser.version < 3)) ? 'input' : 'paste',
		condition: function(e){
			this.fireEvent('paste', e, 1);
			return false;
		}
	};

	// the key event that repeats
	Element.Events.keyrepeat = {
		base : (browser.firefox || browser.opera) ? 'keypress' : 'keydown',
		condition: Function.from(true)
	};

	// Autocomplete itself

	var Meio = global.Meio || {};
	var globalCache;

	var keysThatDontChangeValueOnKeyUp = {
		9:   1,  // tab
		16:  1,  // shift
		17:  1,  // control
		18:  1,  // alt
		224: 1,  // command (meta onkeypress)
		91:  1,  // command (meta onkeydown)
		37:  1,  // left
		38:  1,  // up
		39:  1,  // right
		40:  1   // down
	};

	var encode = function(str){
		return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	};

	Meio.Widget = new Class({

		initialize: function(){
			this.elements = {};
		},

		addElement: function(name, obj){
			this.elements[name] = obj;
		},

		addEventToElement: function(name, eventName, event){
			this.elements[name].addEvent(eventName, event.bind(this));
		},

		addEventsToElement: function(name, events){
			for (var eventName in events){
				this.addEventToElement(name, eventName, events[eventName]);
			}
		},

		attach: function(){
			for (var element in this.elements){
				this.elements[element].attach();
			}
		},

		detach: function(){
			for (var element in this.elements){
				this.elements[element].detach();
			}
		},

		destroy: function(){
			for (var element in this.elements){
				this.elements[element] && this.elements[element].destroy();
			}
		}
	});

	Meio.Autocomplete = new Class({

		Extends: Meio.Widget,

		Implements: [Options, Events],

		options: {

			delay: 200,
			minChars: 0,
			cacheLength: 20,
			selectOnTab: true,
			maxVisibleItems: 10,
			cacheType: 'shared', // 'shared' or 'own'

			filter: {
				/*
					its posible to pass the filters directly or by passing a type and optionaly a path.

					filter: function(text, data){}
					formatMatch: function(text, data, i){}
					formatItem: function(text, data){}

					or

					type: 'startswith' or 'contains' // can be any defined on the Meio.Autocomplete.Filter object
					path: 'a.b.c' // path to the text value on each object thats contained on the data array
				*/
			},

			/*
			onNoItemToList: function(elements){},
			onSelect: function(elements, value){},
			onDeselect: function(elements){},
			*/

			fieldOptions: {}, // see Element options
			listOptions: {}, // see List options
			requestOptions: {}, // see DataRequest options
			urlOptions: {} // see URL options

		},

		initialize: function(input, data, options, listInstance){
			this.parent();
			this.setOptions(options);
			this.active = 0;

			this.filters = Meio.Autocomplete.Filter.get(this.options.filter);

			this.addElement('list', listInstance || new Meio.Element.List(this.options.listOptions));
			this.addListEvents();

			this.addElement('field', new Meio.Element.Field(input, this.options.fieldOptions));
			this.addFieldEvents();

			this.addSelectEvents();

			this.attach();
			this.initCache();
			this.initData(data);
		},

		addFieldEvents: function(){
			this.addEventsToElement('field', {
				'beforeKeyrepeat': function(e){
					this.active = 1;
					var e_key = e.key, list = this.elements.list;
					if (e_key == 'up' || e_key == 'down' || (e_key == 'enter' && list.showing)) e.preventDefault();
				},
				'delayedKeyrepeat': function(e){
					var e_key = e.key, field = this.elements.field;
					field.keyPressControl[e_key] = true;
					switch (e_key){
					case 'up': case 'down':
						this.focusItem(e_key);
						break;
					case 'enter':
						this.setInputValue();
						break;
					case 'tab':
						if (this.options.selectOnTab) this.setInputValue();
						field.keyPressControl[e_key] = false; // tab blurs the input so the keyup event wont happen at the same input you made a keydown
						break;
					case 'esc':
						this.elements.list.hide();
						break;
					default:
						this.setupList();
					}
					this.oldInputedText = field.node.get('value');
				},
				'keyup': function(e){
					var field = this.elements.field;
					if (!keysThatDontChangeValueOnKeyUp[e.code]){
						if (!field.keyPressControl[e.key]) this.setupList();
						field.keyPressControl[e.key] = false;
					}
				},
				'focus': function(){
					this.active = 1;
					var list = this.elements.list;
					list.focusedItem = null;
					list.positionNextTo(this.elements.field.node);
				},
				'click': function(){
					if (++this.active > 2 && !this.elements.list.showing){
						this.forceSetupList();
					}
				},
				'blur': function(e){
					this.active = 0;
					var list = this.elements.list;
					if (list.shouldNotBlur){
						this.elements.field.node.setCaretPosition('end');
						list.shouldNotBlur = false;
						if (list.focusedItem) list.hide();
					} else {
						list.hide();
					}
				},
				'paste': function(){
					return this.setupList();
				}
			});
		},

		addListEvents: function(){
			this.addEventsToElement('list', {
				'mousedown': function(e){
					if (this.active && !e.dontHide) this.setInputValue();
				}
			});
		},

		update: function(){
			var data = this.data, list = this.elements.list;
			var cacheKey = data.getKey(), cached = this.cache.get(cacheKey), html;
			if (cached){
				html = cached.html;
				this.itemsData = cached.data;
			} else {
				data = data.get();
				var itemsHtml = [], itemsData = [], classes = list.options.classes, text = this.inputedText;
				var filter = this.filters.filter, formatMatch = this.filters.formatMatch, formatItem = this.filters.formatItem;
				for (var row, i = 0, n = 0; row = data[i++];) if (filter.call(this, text, row)){
					itemsHtml.push(
						'<li title="', encode(formatMatch.call(this, text, row)),
						'" data-index="', n,
						'" class="', (n%2 ? classes.even : classes.odd), '">',
						formatItem.call(this, text, row, n),
						'</li>'
					);
					itemsData.push(row);
					n++;
				}
				html = itemsHtml.join('');
				this.cache.set(cacheKey, {html: html, data: itemsData});
				this.itemsData = itemsData;
			}
			list.focusedItem = null;
			this.fireEvent('deselect', [this.elements]);
			list.list.set('html', html);
			if (this.options.maxVisibleItems) list.applyMaxHeight(this.options.maxVisibleItems);
		},

		setupList: function(){
			this.inputedText = this.elements.field.node.get('value');
			if (this.inputedText !== this.oldInputedText){
				this.forceSetupList(this.inputedText);
			} else {
				this.elements.list.hide();
			}
			return true;
		},

		forceSetupList: function(inputedText){
			inputedText = inputedText || this.elements.field.node.get('value');
			if (inputedText.length >= this.options.minChars){
				clearInterval(this.prepareTimer);
				this.prepareTimer = this.data.prepare.delay(this.options.delay, this.data, this.inputedText);
			}
		},

		dataReady: function(){
			this.update();
			if (this.onUpdate){
				this.onUpdate();
				this.onUpdate = null;
			}
			var list = this.elements.list;
			if (list.list.get('html')){
				if (this.active) list.show();
			} else {
				this.fireEvent('noItemToList', [this.elements]);
				list.hide();
			}
		},

		setInputValue: function(){
			var list = this.elements.list;
			if (list.focusedItem){
				var text = list.focusedItem.get('title');
				this.elements.field.node.set('value', text);
				var index = list.focusedItem.get('data-index');
				this.fireEvent('select', [this.elements, this.itemsData[index], text, index]);
			}
			list.hide();
		},

		focusItem: function(direction){
			var list = this.elements.list;
			if (list.showing){
				list.focusItem(direction);
			} else {
				this.forceSetupList();
				this.onUpdate = function(){ list.focusItem(direction); };
			}
		},

		addSelectEvents: function(){
			this.addEvents({
				select: function(elements){
					elements.field.addClass('selected');
				},
				deselect: function(elements){
					elements.field.removeClass('selected');
				}
			});
		},

		initData: function(data){
			this.data = (typeOf(data) == 'string') ?
				new Meio.Autocomplete.Data.Request(data, this.cache, this.elements.field, this.options.requestOptions, this.options.urlOptions) :
				new Meio.Autocomplete.Data(data, this.cache);
			this.data.addEvent('ready', this.dataReady.bind(this));
		},

		initCache: function(){
			var cacheLength = this.options.cacheLength;
			if (this.options.cacheType == 'shared'){
				this.cache = globalCache;
				this.cache.setMaxLength(cacheLength);
			} else { // 'own'
				this.cache = new Meio.Autocomplete.Cache(cacheLength);
			}
		},

		refreshCache: function(cacheLength){
			this.cache.refresh();
			this.cache.setMaxLength(cacheLength || this.options.cacheLength);
		},

		refreshAll: function(cacheLength, urlOptions){
			// TODO, do you really need to refresh the url? see a better way of doing this
			this.refreshCache(cacheLength);
			this.data.refreshKey(urlOptions);
		}

	});

	// This is the same autocomplete class but it acts like a normal select element.
	// When you select an option from the autocomplete it will set the value of a given element (valueField)
	// with the return of the valueFilter.
	// if the syncAtInit option is set to true, it will synchonize the value of the autocomplete with the corresponding data
	// from the valueField's value.
	// to understand better see the user specs.

	Meio.Autocomplete.Select = new Class({

		Extends: Meio.Autocomplete,

		options: {
			syncName: 'id', // if falsy it wont sync at start
			valueField: null,
			valueFilter: function(data){
				return data.id;
			}
		},

		// overwritten
		initialize: function(input, data, options, listInstance){
			this.parent(input, data, options, listInstance);
			this.valueField = $(this.options.valueField);

			if (!this.valueField) return;

			this.syncWithValueField(data);
		},

		syncWithValueField: function(data){
			var value = this.getValueFromValueField();

			if (value && this.options.syncName){
				this.addParameter(data);
				this.addDataReadyEvent(value);
				this.data.prepare(this.elements.field.node.get('value'));
			} else {
				this.addValueFieldEvents();
			}
		},

		addValueFieldEvents: function(){
			this.addEvents({
				'select': function(elements, data){
					this.valueField.set('value', this.options.valueFilter.call(this, data));
				},
				'deselect': function(elements){
					this.valueField.set('value', '');
				}
			});
		},

		addParameter: function(data){
			this.parameter = {
				name: this.options.syncName,
				value: function(){
					return this.valueField.value;
				}.bind(this)
			};
			if (this.data.url) this.data.url.addParameter(this.parameter);
		},

		addDataReadyEvent: function(value){
			var self = this;
			var runOnce = function(){
				self.addValueFieldEvents();
				var values = this.get();
				for (var i = values.length; i--;){
					if (self.options.valueFilter.call(self, values[i]) == value){
						var text = self.filters.formatMatch.call(self, '', values[i], 0);
						self.elements.field.node.set('value', text);
						self.fireEvent('select', [self.elements, values[i], text, i]);
						break;
					}
				}
				if (this.url) this.url.removeParameter(self.parameter);
				this.removeEvent('ready', runOnce);
			};
			this.data.addEvent('ready', runOnce);
		},

		getValueFromValueField: function(){
			return this.valueField.get('value');
		}

	});

	// Transforms a select on an autocomplete field

	Meio.Autocomplete.Select.One = new Class({

		Extends: Meio.Autocomplete.Select,

		options: {
			filter: {
				path: 'text' // path to the text value on each object thats contained on the data array
			}
		},

		//overwritten
		initialize: function(select, options, listInstance){
			this.select = $(select);
			this.replaceSelect();
			this.parent(this.field, this.createDataArray(), Object.merge(options || {}, {
				valueField: this.select,
				valueFilter: function(data){ return data.value; }
			}), listInstance);
		},

		replaceSelect: function(){
			var selectedOption = this.select.getSelected()[0];
			this.field = new Element('input', {type: 'text'});
			var optionValue = selectedOption.get('value');
			if (optionValue || optionValue === 0) this.field.set('value', selectedOption.get('html'));
			this.select.setStyle('display', 'none');
			this.field.inject(this.select, 'after');
		},

		createDataArray: function(){
			var selectOptions = this.select.options, data = [];
			for(var i = 0, selectOption, optionValue; selectOption = selectOptions[i++];){
				optionValue = selectOption.value;
				if (optionValue || optionValue === 0) data.push({value: optionValue, text: selectOption.innerHTML});
			}
			return data;
		},

		addValueFieldEvents: function(){
			this.addEvents({
				'select': function(elements, data, text, index){
					var option = this.valueField.getElement('option[value="' + this.options.valueFilter.call(this, data) + '"]');
					if (option) option.selected = true;
				},
				'deselect': function(elements){
					var option = this.valueField.getSelected()[0];
					if (option) option.selected = false;
				}
			});
		},

		getValueFromValueField: function(){
			return this.valueField.getSelected()[0].get('value');
		}

	});

	Meio.Element = new Class({

		Implements: [Events],

		initialize: function(node){
			this.setNode(node);
			this.createBoundEvents();
			this.attach();
		},

		setNode: function(node){
			this.node = node ? $(node) || $$(node)[0] : this.render();
		},

		createBoundEvents: function(){
			this.bound = {};
			this.boundEvents.each(function(evt){
				this.bound[evt] = function(e){
					this.fireEvent('before' + evt.capitalize(), e);
					this[evt] && this[evt](e);
					this.fireEvent(evt, e);
					return true;
				}.bind(this);
			}, this);
		},

		attach: function(){
			for (var e in this.bound){
				this.node.addEvent(e, this.bound[e]);
			}
		},

		detach: function(){
			for (var e in this.bound){
				this.node.removeEvent(e, this.bound[e]);
			}
		},

		addClass: function(type){
			this.node.addClass(this.options.classes[type]);
		},

		removeClass: function(type){
			this.node.removeClass(this.options.classes[type]);
		},

		toElement: function(){
			this.node;
		},

		render: function(){}

	});

	Meio.Element.Field = new Class({

		Extends: Meio.Element,

		Implements: [Options],

		options: {
			classes: {
				loading: 'ma-loading',
				selected: 'ma-selected'
			}
		},

		initialize: function(field, options){
			this.keyPressControl = {};
			this.boundEvents = ['paste', 'focus', 'blur', 'click', 'keyup', 'keyrepeat'];
			if (browser.ie6) this.boundEvents.push('keypress'); // yeah super ugly, but what can be awesome with ie?
			this.setOptions(options);
			this.parent(field);

			$(global).addEvent('unload', function(){
				if (this.node) this.node.set('autocomplete', 'on'); // if autocomplete is off when you reload the page the input value gets erased
			}.bind(this));
		},

		setNode: function(element){
			this.parent(element);
			this.node.set('autocomplete', 'off');
		},

		// this let me get the value of the input on keydown and keypress
		keyrepeat: function(e){
			clearInterval(this.keyrepeatTimer);
			this.keyrepeatTimer = this._keyrepeat.delay(1, this, e);
		},

		_keyrepeat: function(e){
			this.fireEvent('delayedKeyrepeat', e);
		},

		destroy: function(){
			this.detach();
			this.node.removeAttribute('autocomplete');
		},

		// ie6 only, uglyness
		// this fix the form being submited on the press of the enter key
		keypress: function(e){
			if (e.key == 'enter') this.bound.keyrepeat(e);
		}

	});

	Meio.Element.List = new Class({

		Extends: Meio.Element,

		Implements: [Options],

		options: {
			width: 'field', // you can pass any other value settable by set('width') to the list container
			classes: {
				container: 'ma-container',
				hover: 'ma-hover',
				odd: 'ma-odd',
				even: 'ma-even'
			}
		},

		initialize: function(options){
			this.boundEvents = ['mousedown', 'mouseover'];
			this.setOptions(options);
			this.parent();
			this.focusedItem = null;
		},

		/*applyMaxHeight: function(maxVisibleItems){
			var listChildren = this.list.childNodes;
			var node = listChildren[maxVisibleItems - 1] || (listChildren.length ? listChildren[listChildren.length - 1] : null);
			if (!node) return;
			node = $(node);
			// uggly hack to fix the height of the autocomplete list
			for (var i = 2; i--;) this.node.setStyle('height', node.getCoordinates(this.list).bottom);
		},*/

		applyMaxHeight: function(maxVisibleItems){
			this.list.getChildren().each(function(item, index)
			{
				if (index > maxVisibleItems) item.dispose();
			});
		},

		mouseover: function(e){
			var item = this.getItemFromEvent(e), hoverClass = this.options.classes.hover;
			if (!item) return true;
			if (this.focusedItem) this.focusedItem.removeClass(hoverClass);
			item.addClass(hoverClass);
			this.focusedItem = item;
			this.fireEvent('focusItem', [this.focusedItem]);
		},

		mousedown: function(e){
			e.preventDefault();
			this.shouldNotBlur = true;
			if (!(this.focusedItem = this.getItemFromEvent(e))){
				e.dontHide = true;
				return true;
			}
			this.focusedItem.removeClass(this.options.classes.hover);
		},

		focusItem: function(direction){
			var hoverClass = this.options.classes.hover, newFocusedItem;
			if (this.focusedItem){
				if ((newFocusedItem = this.focusedItem[direction == 'up' ? 'getPrevious' : 'getNext']())){
					this.focusedItem.removeClass(hoverClass);
					newFocusedItem.addClass(hoverClass);
					this.focusedItem = newFocusedItem;
					this.scrollFocusedItem(direction);
				}
			} else {
				if ((newFocusedItem = this.list.getFirst())){
					newFocusedItem.addClass(hoverClass);
					this.focusedItem = newFocusedItem;
				}
			}
		},

		scrollFocusedItem: function(direction){
			var focusedItemCoordinates = this.focusedItem.getCoordinates(this.list),
				scrollTop = this.node.scrollTop;
			if (direction == 'down'){
				var delta = focusedItemCoordinates.bottom - this.node.getStyle('height').toInt();
				if ((delta - scrollTop) > 0){
					this.node.scrollTop = delta;
				}
			} else {
				var top = focusedItemCoordinates.top;
				if (scrollTop && scrollTop > top){
					this.node.scrollTop = top;
				}
			}
		},

		getItemFromEvent: function(e){
			var target = e.target;
			while (target && target.tagName.toLowerCase() != 'li'){
				if (target === this.node) return null;
				target = target.parentNode;
			}
			return $(target);
		},

		render: function(){
			var node = new Element('div', {'class': this.options.classes.container});
			if (node.bgiframe) node.bgiframe({top: 0, left: 0});
			this.list = new Element('ul').inject(node);
			$(document.body).grab(node);
			return node;
		},

		positionNextTo: function(fieldNode){
			var width = this.options.width, listNode = this.node;
			var elPosition = fieldNode.getCoordinates();
			listNode.setStyle('width', width == 'field' ? fieldNode.getWidth().toInt() - listNode.getStyle('border-left-width').toInt() - listNode.getStyle('border-right-width').toInt() : width);
			listNode.setPosition({x: elPosition.left, y: elPosition.bottom});
		},

		show: function(){
			this.node.scrollTop = 0;
			// this.node.setStyle('visibility', 'visible');
			this.node.setStyle('display', 'block');
			this.showing = true;
		},

		hide: function(){
			this.showing = false;
			// this.node.setStyle('visibility', 'hidden');
			this.node.setStyle('display', 'none');
		}

	});

	Meio.Autocomplete.Filter = {

		filters: {},

		get: function(options){
			var type = options.type, keys = (options.path || '').split('.');
			var filters = (type && this.filters[type]) ? this.filters[type](this, keys) : options;
			return Object.merge(this.defaults(keys), filters);
		},

		define: function(name, options){
			this.filters[name] = options;
		},

		defaults: function(keys){
			var self = this;
			return {
				filter: function(text, data){
					return text ? self._getValueFromKeys(data, keys).test(new RegExp(text.escapeRegExp(), 'i')) : true;
				},
				formatMatch: function(text, data){
					return self._getValueFromKeys(data, keys);
				},
				formatItem: function(text, data, i){
					return text ? self._getValueFromKeys(data, keys).replace(new RegExp('(' + text.escapeRegExp() + ')', 'gi'), '<strong>$1</strong>') : self._getValueFromKeys(data, keys);
				}
			};
		},

		_getValueFromKeys: function(obj, keys){
			var key, value = obj;
			for (var i = 0; key = keys[i++];) value = value[key];
			return value;
		}

	};

	Meio.Autocomplete.Filter.define('contains', function(self, keys){return {};});
	Meio.Autocomplete.Filter.define('startswith', function(self, keys){
		return {
			filter: function(text, data){
				return text ? self._getValueFromKeys(data, keys).test(new RegExp('^' + text.escapeRegExp(), 'i')) : true;
			}
		};
	});

	Meio.Autocomplete.Data = new Class({

		Implements: [Options, Events],

		initialize: function(data, cache){
			this._cache = cache;
			this.data = data;
			this.dataString = JSON.encode(this.data);
		},

		get: function(){
			return this.data;
		},

		getKey: function(){
			return this.cachedKey;
		},

		prepare: function(text){
			this.cachedKey = this.dataString + (text || '');
			this.fireEvent('ready');
		},

		cache: function(key, data){
			this._cache.set(key, data);
		},

		refreshKey: function(){}

	});

	Meio.Autocomplete.Data.Request = new Class({

		Extends: Meio.Autocomplete.Data,

		options: {
			noCache: true,
			formatResponse: function(jsonResponse){
				return jsonResponse;
			}
		},

		initialize: function(url, cache, element, options, urlOptions){
			this.setOptions(options);
			this.rawUrl = url;
			this._cache = cache;
			this.element = element;
			this.urlOptions = urlOptions;
			this.refreshKey();
			this.createRequest();
		},

		prepare: function(text){
			this.cachedKey = this.url.evaluate(text);
			if (this._cache.has(this.cachedKey)){
				this.fireEvent('ready');
			} else {
				this.request.send({url: this.cachedKey});
			}
		},

		createRequest: function(){
			var self = this;
			this.request = new Request.JSON(this.options);
			this.request.addEvents({
				request: function(){
					self.element.addClass('loading');
				},
				complete: function(){
					self.element.removeClass('loading');
				},
				success: function(jsonResponse){
					self.data = self.options.formatResponse(jsonResponse);
					self.fireEvent('ready');
				}
			});
		},

		refreshKey: function(urlOptions){
			urlOptions = Object.merge(this.urlOptions, {url: this.rawUrl}, urlOptions || {});
			this.url = new Meio.Autocomplete.Data.Request.URL(urlOptions.url, urlOptions);
		}

	});

	Meio.Autocomplete.Data.Request.URL = new Class({

		Implements: [Options],

		options: {
			queryVarName: 'q',
			extraParams: null,
			max: 20
		},

		initialize: function(url, options){
			this.setOptions(options);
			this.rawUrl = url;
			this.url = url;
			this.url += this.url.contains('?') ? '&' : '?';
			this.dynamicExtraParams = [];
			var params = Array.from(this.options.extraParams);
			for (var i = params.length; i--;){
				this.addParameter(params[i]);
			}
			if (this.options.max) this.addParameter('limit=' + this.options.max);
		},

		evaluate: function(text){
			text = text || '';
			var params = this.dynamicExtraParams, url = [];
			url.push(this.options.queryVarName + '=' + encodeURIComponent(text));
			for (var i = params.length; i--;){
				url.push(encodeURIComponent(params[i].name) + '=' + encodeURIComponent(Function.from(params[i].value)()));
			}
			return this.url + url.join('&');
		},

		addParameter: function(param){
			if (param.nodeType == 1 || typeOf(param.value) == 'function'){
				this.dynamicExtraParams.push(param);
			} else {
				this.url += ((typeOf(param) == 'string') ? param : encodeURIComponent(param.name) + '=' + encodeURIComponent(param.value)) + '&';
			}
		},

		// TODO remove non dynamic parameters
		removeParameter: function(param){
			this.dynamicExtraParams.erase(param);
		}

	});

	Meio.Autocomplete.Cache = new Class({

		initialize: function(maxLength){
			this.refresh();
			this.setMaxLength(maxLength);
		},

		set: function(key, value){
			if (!this.cache[key]){
				if (this.getLength() >= this.maxLength){
					var keyToRemove = this.pos.shift();
					this.cache[keyToRemove] = null;
					delete this.cache[keyToRemove];
				}
				this.cache[key] = value;
				this.pos.push(key);
			}
			return this;
		},

		get: function(key){
			return this.cache[key || ''] || null;
		},

		has: function(key){
			return !!this.get(key);
		},

		getLength: function(){
			return this.pos.length;
		},

		refresh: function(){
			this.cache = {};
			this.pos = [];
		},

		setMaxLength: function(maxLength){
			this.maxLength = Math.max(maxLength, 1);
		}

	});

	globalCache = new Meio.Autocomplete.Cache();

	global.Meio = Meio;

})(this, document.id || $);

