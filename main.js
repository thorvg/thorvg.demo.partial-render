var myApp;

//initialize
(function () {
	//window.onload = initialize;

	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'thorvg-wasm.js';
	document.head.appendChild(script);
	script.onload = _ => {
		Module.onRuntimeInitialized = _ => {
			myApp = new MyApp();
			myApp.ready();
		};
	};

	document.addEventListener("DOMContentLoaded", function() {
		const toggle = document.getElementById("toggle-partial");
		toggle.addEventListener("change", function() {
			myApp.partial(toggle.checked);
		});
	});
})();

//for playing animations
function animLoop() {
	if (!myApp) return;
	myApp.render();
	window.requestAnimationFrame(animLoop);
}

function onStatsMode() {
	// Create and inject script element for stats.js
	const statsScript = document.createElement('script');
	statsScript.src = 'https://mrdoob.github.io/stats.js/build/stats.min.js';
	statsScript.onload = () => {
		// Initialize FPS panel
		const statsFPS = new Stats();
		statsFPS.showPanel(0);
		statsFPS.dom.classList.add("stats");
		statsFPS.dom.style.cssText = "position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";
		document.body.appendChild(statsFPS.dom);

		// Initialize MS panel
		const statsMS = new Stats();
		statsMS.showPanel(1);
		statsMS.dom.classList.add("stats");
		statsMS.dom.style.cssText = "position:fixed;top:0;left:80px;cursor:pointer;opacity:0.9;z-index:10000";
		document.body.appendChild(statsMS.dom);

		// Initialize MB panel if supported
		let statsMB;
		if (self.performance && self.performance.memory) {
			statsMB = new Stats();
			statsMB.showPanel(2);
			statsMB.dom.classList.add("stats");
			statsMB.dom.style.cssText = "position:fixed;top:0;left:160px;cursor:pointer;opacity:0.9;z-index:10000";
			document.body.appendChild(statsMB.dom);
		}

		// Start animation loop
		function animate() {
			statsFPS.begin();
			statsMS.begin();
			if (statsMB) statsMB.begin();

			statsFPS.end();
			statsMS.end();
			if (statsMB) statsMB.end();

			requestAnimationFrame(animate);
		}

		requestAnimationFrame(animate);
	};
	document.head.appendChild(statsScript);
}

class MyApp {
	launched = false;

	flush() {
		var context = this.canvas.getContext('2d');
		//draw the content image first
		context.putImageData(this.imageData, 0, 0);
	}

	render() {
		this.tvg.resize(this.canvas.width, this.canvas.height);
		this.tvg.update();
		var buffer = this.tvg.render();
		var clampedBuffer = Uint8ClampedArray.from(buffer);
		if (clampedBuffer.length == 0) return;
		this.imageData = new ImageData(clampedBuffer, this.canvas.width, this.canvas.height);
		this.flush();
	}

	loadData(data, filename) {
		var ext = filename.split('.').pop().toLowerCase();
		this.tvg.load(new Uint8Array(data), "jpg", this.canvas.width, this.canvas.height);
		this.render();
		if (!this.launched) {
			window.requestAnimationFrame(animLoop);
			this.launched = true;
		}		
	}

	partial(on) {
		this.tvg.partial(on);
	}

	ready() {
		let url = "https://raw.githubusercontent.com/hermet/partial-test/main/particle.jpg";
		let request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';

		request.onloadend = () => {
			if (request.status !== 200) return;
			let name = url.split('/').pop();
			this.loadData(request.response, name);
		};
		request.send();

		onStatsMode();
	}

	constructor() {
		this.tvg = new Module.TvgTestApp();
		this.canvas = document.getElementById("content-area");
	}
}
