/**
 * LBS Eraser
 * Date: 2015-12-8
 * ===================================================
 * opts.canvas canvas元素 (一个字符串的CSS3选择器或者元素对象) 
 * opts.color 蒙版颜色(要擦掉的颜色) 默认: '#bbb'
 * opts.size 笔触大小(半径) 默认: 16
 * opts.ratio 完成比率(擦除多少算完成  范围：0 - 1 ) 默认 0.5
 * opts.complate 擦除完成后执行方法
 * ===================================================
 * this.start() 开始方法
 * this.reset() 重置方法
 * ===================================================
 **/
(function(window, document) {
	'use strict';

	var utils = {
		on: function(el, types, handler) {
			if (typeof types === 'string') return el.addEventListener(types, handler, false);
			for (var i = 0, l = types.length; i < l; i++) el.addEventListener(types[i], handler, false);
		},
		off: function(el, types, handler) {
			if (typeof types === 'string') return el.removeEventListener(types, handler, false);
			for (var i = 0, l = types.length; i < l; i++) el.removeEventListener(types[i], handler, false);
		}
	};

	var Eraser = function(opts) {
		opts = opts || {};
		if (typeof opts.canvas === 'undefined') {
			throw 'canvas元素未正确定义！';
		}
		this.canvas = typeof opts.canvas === 'string' ? document.querySelector(opts.canvas) : opts.canvas;
		this.context = this.canvas.getContext('2d');
		this.color = opts.color || '#bbb';
		this.size = opts.size || 16;
		this.ratio = opts.ratio || 0.5;
		this.complate = opts.complate || function() {};
	};
	Eraser.prototype = {
		_init: function() {
			this._rect()._size()._mask()._bind();
		},
		_rect: function() {
			this.rect = this.canvas.getBoundingClientRect();
			return this;
		},
		_size: function() {
			this.canvas.width = this.rect.width;
			this.canvas.height = this.rect.height;
			return this;
		},
		_bind: function() {
			var _this = this;
			utils.on(this.canvas, ['touchstart', 'mousedown'], this.startEvent = function() {
				_this._start();
			});
			utils.on(this.canvas, ['touchmove', 'mousemove'], this.moveEvent = function(e) {
				_this._move(e);
			});
			utils.on(this.canvas, ['touchend', 'mouseup'], this.endEvent = function() {
				_this._end();
			});
			utils.on(window, ['scroll', 'resize', 'orientationchange'], this.updateEvent = function(e) {
				_this._update(e);
			});
		},
		_unbind: function() {
			// console.log('解除事件绑定~');
			utils.off(this.canvas, ['touchstart', 'mousedown'], this.startEvent);
			utils.off(this.canvas, ['touchmove', 'mousemove'], this.moveEvent);
			utils.off(this.canvas, ['touchend', 'mouseup'], this.endEvent);
			utils.off(window, ['scroll', 'resize', 'orientationchange'], this.updateEvent);
		},
		_start: function() {
			this.moving = true;
		},
		_move: function(e) {
			if (!this.moving) return;
			e.preventDefault();
			var evt = e.touches ? e.touches[0] : e,
				pointX = evt.clientX - this.rect.left,
				pointY = evt.clientY - this.rect.top;
			this._draw(pointX, pointY);
		},
		_end: function() {
			this.moving = false;
			this._check();
		},
		_check: function() {
			var data = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data,
				len = data.length,
				total = len / 4,
				count = 0,
				i = 3;
			for (; i < len; i += 4) {
				if (data[i] == 0) count++;
			}
			if (count >= Math.floor(total * this.ratio)) {
				this._clear()._unbind();
				this.complate && this.complate(this.canvas);
			}
		},
		_update: function(e) {
			var _this = this;
			this.timer && clearTimeout(this.timer);
			this.timer = setTimeout(function() {
				_this._rect();
				if (e.type == 'scroll') return;
				// 如果改变方向... 
				_this._copy()._size()._paste();
			}, 100);
		},
		_copy: function() {
			this._imgData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
			this._canvas = this.canvas.cloneNode();
			this._context = this._canvas.getContext('2d');
			this._context.putImageData(this._imgData, 0, 0);
			return this;
		},
		_paste: function() {
			this.context.drawImage(this._canvas, 0, 0, this.canvas.width, this.canvas.height);
			return this;
		},
		_mask: function() {
			this.context.fillStyle = this.color;
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
			return this;
		},
		_draw: function(x, y) {
			this.context.save();
			this.context.globalCompositeOperation = 'destination-out';
			this.context.beginPath();
			this.context.arc(x, y, this.size, 0, 2 * Math.PI);
			this.context.fill();
			this.context.restore();
		},
		_clear: function() {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			return this;
		},
		start: function() {
			this._init();
		},
		reset: function() {
			this.start();
		}
	};
	if (typeof define === 'function' && (define.amd || define.cmd)) {
		define('Eraser', [], function() {
			return Eraser;
		});
	} else {
		window.Eraser = Eraser;
	}
}(window, document));