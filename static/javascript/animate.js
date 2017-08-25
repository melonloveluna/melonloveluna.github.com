var distanceX = 0;
var $boy = $('#boy');
var boyWidth = $boy.width();
var boyHeight = $boy.height();
var $container = $('#content');
var visualWidth = $container.width();
var visualHeight = $container.height();

var config = {
	dura: {
		walkInA: 6000,
		walkToB: 6500,
		walkToC: 6500,
		birdFly: 15000,
		walkToShop: 1500,
		walkOutShop: 1500,
		walkToBridge: 2000,
		walkInBridge: 2000,
		openDoor: 800,
		closeDoor: 500,
		waitRotate: 850,
		waitFlower: 800,
		floatFlower: 20000,
		createFlower: 200
	},
	flowers: function() {
		var flowers = ['a', 'b', 'c', 'd', 'e', 'f'];
		for(var i = 0, i_length = flowers.length; i < i_length; i++) {
			flowers[i] = './static/img/flower-' + flowers[i] + '.png';
		}
		return flowers;
	}()
}
var animationEnd = function() {
	var explorer = navigator.userAgent;
	if(explorer.indexOf('WebKit') > -1) {
		return 'webkitAnimationEnd';
	}
	return 'animationend';
}();

/*鸟动画*/
var bird = {
	ele: $('.bird'),
	fly: function() {
		this.ele.addClass('bird-fly');
		this.ele.transition({
			right: '100%'
		}, config.dura.birdFly, 'linear');
	}
}
/*logo动画*/
var logo = {
	ele: $('.logo'),
	run: function() {
		this.ele.addClass('logo-enter')
		.on(animationEnd, function() {
			$(this).addClass('logo-shake').off();
		});
	}
}
/*飘花动画*/
var flower = function() {
	setInterval(function() {
		var startOpacity = 1;
		var startLeft = Math.random() * visualWidth;
		var endTop = visualHeight - 40;
		var randomOpacity = Math.random();
		randomOpacity = randomOpacity < 0.5 ? startOpacity : randomOpacity;
		var fIndex = Math.floor(Math.random() * 6)
		var $flower = $('<div class="flower"></div>').css({
			'backgroundImage': 'url("' + config.flowers[fIndex] + '")',
			'left': startLeft,
			'opacity': randomOpacity
		});
		$('.flower-box').append($flower);
		$flower.transition({
			top: endTop,
			opacity: 0.7
		}, config.dura.floatFlower, 'ease-out', function() {
			$(this).remove();
		});
	}, config.dura.createFlower);
}
/*小女孩*/
var girl = {
	ele: $('.girl'),
	initial: function() {
		var ele = this.ele;
		var bridgeY = $('.c_bg_middle').position().top;
		ele.css({
			top: bridgeY - ele.height(),
			left: visualWidth / 2
		});
	},
	position: function() {
		return this.ele.position();
	},
	width: function() {
		return this.ele.width();
	},
	height: function() {
		return this.ele.height();
	},
	rotate: function() {
		this.ele.addClass('girl-rotate');
	}
}
/*小男孩在商店的一系列动作*/
var boyToShop = function(boyObj) {
	var defer = $.Deferred();
	var $door = $('.door');
	var $left = $('.left-door');
	var $right = $('.right-door');
	/*开门*/
	function openDoor() {
		return doorAction('-50%', '100%', config.dura.openDoor);
	}
	/*关门*/
	function closeDoor() {
		return doorAction('0%', '50%', config.dura.closeDoor);
	}
	/*控制左右两扇门的动画*/
	function doorAction(left, right, duration) {
		var count = 2;//控制动画是否完成	
		var defer = $.Deferred();
		var complete = function() {
			if(count === 1) {
				defer.resolve();
				return false;
			}
			count--;
		}
		$left.animate({
			'left': left
		}, duration, complete);
		$right.animate({
			'left': right
		}, duration, complete);
		return defer;
	}
	/*小男孩取花*/
	function takeFlower() {
		var defer = $.Deferred();
		setTimeout(function() {
			$boy.removeClass('slow-walk');
			$boy.addClass('boy-flower');
			defer.resolve();
		}, config.dura.waitFlower);
		return defer;
	}
	/*灯动画*/
	var lamp = {
		ele: $('.lamp'),
		dark: function() {
			this.ele.removeClass('lamp-bright');
		},
		bright: function() {
			this.ele.addClass('lamp-bright');
		}
	}
	openDoor()
	.then(function() {
		lamp.bright();
		return boyObj.walkInShop(config.dura.walkToShop);
	})
	.then(function() {
		return takeFlower();
	})
	.then(function() {
		return boyObj.walkOutShop(config.dura.walkOutShop);
	})
	.then(function() {
		closeDoor();
		lamp.dark();
		defer.resolve();
	});
	return defer;
}
/*小男孩动作方法*/
function boyAction() {
	//初始化小男孩在首页的位置
	var road = $('.a_bg_middle');
	var roadHeight = road.height() / 2;
	var roadTop = road.position().top;
	//小男孩的top = 路段的top + 路段的高度/2 - 小男孩的高度
	$boy.css({
		top: roadTop + roadHeight - boyHeight
	});

	function pauseWalk() {
		$boy.addClass('pause-walk');
	}
	function restoreWalk() {
		$boy.removeClass('pause-walk');
	}
	function startWalk() {
		$boy.addClass('slow-walk');
	}

	/*计算某个方向上的百分比距离*/
	function caclDist(direct, percent) {
		return (direct === 'x' ? visualWidth : visualHeight) * percent;
	}
	/*小男孩走路的异步实现*/
	function walkAsync(options, duration) {
		restoreWalk();
		var dfdPlay = $.Deferred();
		$boy.transition(options, duration, 'linear', function() {
			dfdPlay.resolve();
		});
		return dfdPlay;
	}
	/*小男孩走到哪里*/
	function walkPosition(position, duration) {
		startWalk();
		duration = duration || 3000
		var pos = {};
		if(!isNaN(position.x)) {
			pos.left = position.x + 'px';
		}
		if(!isNaN(position.y)) {
			pos.top = position.y + 'px';
		}
		return walkAsync(pos, duration);
	}
	/*小男孩走进商店*/
	function walkInShop(duration) {
		//小男孩需要走进门中间的位置：门中间的位置 - 小男孩中间的位置
		var defer = $.Deferred();
		var $door = $('.door');
		var doorOffset = $door.offset();
		var boyOffset = $boy.offset();
		distanceX = (doorOffset.left + $door.width() / 2) - (boyOffset.left + $boy.width() / 2);
		var options = {
			'transform': 'translateX(' + distanceX + 'px),scale(0.3,0.3)',
			'opacity': 0.1
		}
		var walkPlay = walkAsync(options, duration);
		walkPlay.done(function() {
			$boy.css({
				'opacity': 0
			});
			defer.resolve();
		});
		return defer;
	}
	/*小男孩走出商店*/
	function walkOutShop(duration) {
		var defer = $.Deferred();
		var options = {
			'transform': 'translateX(' + distanceX + 'px),scale(1,1)',
			'opacity': 1
		}
		var walkPlay = walkAsync(options, duration);
		walkPlay.done(function() {
			defer.resolve();
		});
		return defer;
	}
	return {
		walkTo: function(duration, x, y) {
			return walkPosition({
				x: caclDist('x', x),
				y: caclDist('y', y)
			}, duration);
		},
		pauseWalk: pauseWalk,
		walkInShop: function() {
			return walkInShop.apply(null, arguments);
		},
		walkOutShop: function() {
			return walkOutShop.apply(null, arguments);
		},
		reset: function() {
			pauseWalk();
			$boy.removeClass('boy-flower').removeClass('slow-walk').addClass('boy-origin');
		},
		rotate: function(cb) {
			restoreWalk();
			$boy.addClass('boy-rotate');
			if(!cb) {
				return false
			}
			$boy.on(animationEnd, function() {
				cb();
				$(this).off();
			})
		}
	}
}
/*初始化所有场景，定义swiper*/
function slide($container) {
	var swiper = {};
	var $wrap = $container.children().first();
	var width = $container.width();
	var height = $container.height();
	var $slides = $wrap.find('>');

	$wrap.css({
		width: width * $slides.length + 'px',
		height: height
	});
	$.each($slides, function(index) {
		$slides.eq(index).css({
			width: width,
			height: height
		});
	});
	
	//移动外层场景
	swiper.moveTo = function(speed, times) {
		$wrap.css({
			'transition-timing-function': 'linear',
			'transition-duration': speed + 'ms',
			'transform': 'translateX(-' + (width * times) + 'px)'
		});
		return this;
	}
	return swiper;
}

