var Scroller = require("./Scroller.js");
var $ = require("jbone");

var EasyScroller = function(content, options) {

	this.content = content;
	this.container = content.parentNode;
	this.options = options || {};

	// create Scroller instance
	var that = this;
	this.scroller = new Scroller(function(left, top, zoom) {
		that.render(left, top, zoom);
	}, options);

	// bind events
	this.bindEvents();

	// the content element needs a correct transform origin for zooming
	this.content.style[EasyScroller.vendorPrefix + 'TransformOrigin'] = "left top";

	// reflow for the first time
	this.reflow();

};

EasyScroller.prototype.render = (function() {

	var docStyle = document.documentElement.style;

	var engine;
	if (window.opera && Object.prototype.toString.call(opera) === '[object Opera]') {
		engine = 'presto';
	} else if ('MozAppearance' in docStyle) {
		engine = 'gecko';
	} else if ('WebkitAppearance' in docStyle) {
		engine = 'webkit';
	} else if (typeof navigator.cpuClass === 'string') {
		engine = 'trident';
	}

	var vendorPrefix = EasyScroller.vendorPrefix = {
		trident: 'ms',
		gecko: 'Moz',
		webkit: 'Webkit',
		presto: 'O'
	}[engine];

	var helperElem = document.createElement("div");
	var undef;

	var perspectiveProperty = vendorPrefix + "Perspective";
	var transformProperty = vendorPrefix + "Transform";

	if (helperElem.style[perspectiveProperty] !== undef) {

		return function(left, top, zoom) {
			this.content.style[transformProperty] = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
		};

	} else if (helperElem.style[transformProperty] !== undef) {

		return function(left, top, zoom) {
			this.content.style[transformProperty] = 'translate(' + (-left) + 'px,' + (-top) + 'px) scale(' + zoom + ')';
		};

	} else {

		return function(left, top, zoom) {
			this.content.style.marginLeft = left ? (-left/zoom) + 'px' : '';
			this.content.style.marginTop = top ? (-top/zoom) + 'px' : '';
			this.content.style.zoom = zoom || '';
		};

	}
})();

EasyScroller.prototype.reflow = function() {

	// set the right scroller dimensions
	this.scroller.setDimensions(this.container.clientWidth, this.container.clientHeight, this.content.offsetWidth, this.content.offsetHeight);

	// refresh the position for zooming purposes
	var rect = this.container.getBoundingClientRect();
	this.scroller.setPosition(rect.left + this.container.clientLeft, rect.top + this.container.clientTop);

};

EasyScroller.prototype.bindEvents = function() {

	var that = this;

	// reflow handling
	$(window).on("resize", function() {
		that.reflow();
	});

  // added this here, not ideal, but it makes sure that the logo will
  // scroll correctly when the model tab is revealed.
  $('#modelTab').on('click', function() {
		that.reflow();
  });


	// touch devices bind touch events
	if ('ontouchstart' in window) {

		this.container.addEventListener("touchstart", function(e) {

			// Don't react if initial down happens on a form element
			if (e.touches[0] && e.touches[0].target && e.touches[0].target.tagName.match(/input|textarea|select/i)) {
				return;
			}

			that.scroller.doTouchStart(e.touches, new Date().getTime());
			e.preventDefault();

		}, false);

		document.addEventListener("touchmove", function(e) {
			that.scroller.doTouchMove(e.touches, new Date().getTime(), e.scale);
		}, false);

		document.addEventListener("touchend", function(e) {
			that.scroller.doTouchEnd(new Date().getTime());
		}, false);

		document.addEventListener("touchcancel", function(e) {
			that.scroller.doTouchEnd(new Date().getTime());
		}, false);

	// non-touch bind mouse events
	} else {

		var mousedown = false;

		$(this.container).on("mousedown", function(e) {

			if (e.target.tagName.match(/input|textarea|select/i)) {
				return;
			}


			that.scroller.doTouchStart([{
				pageX: e.pageX,
				pageY: e.pageY
			}], new Date().getTime());

			mousedown = true;
			e.preventDefault();

		});

		$(document).on("mousemove", function(e) {

			if (!mousedown) {
				return;
			}

			that.scroller.doTouchMove([{
				pageX: e.pageX,
				pageY: e.pageY
			}], new Date().getTime());

			mousedown = true;

		});

		$(document).on("mouseup", function(e) {

			if (!mousedown) {
				return;
			}

      that.scroller.doTouchEnd(new Date().getTime());

			mousedown = false;

		});

		$(this.container).on("mousewheel", function(e) {
			if(that.options.zooming) {
				that.scroller.doMouseZoom(e.wheelDelta, new Date().getTime(), e.pageX, e.pageY);
				e.preventDefault();
			}
		});

	}

};


module.exports = EasyScroller;
