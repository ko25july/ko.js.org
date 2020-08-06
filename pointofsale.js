//var script = document.createElement("script");
//script.src = "https://ko.js.org/pointofsale.js";
//document.head.appendChild(script);

// Begin Inject Observer Section

window.getElementXTag = function(element) {
	if (element && element.nodeType === Node.ELEMENT_NODE) {
		var tagName = element.localName;
		var tagId = element.id ? "#" + element.id.trim() : "";
		var tagClass = element.className ? "." + element.className.trim().split(" ").join(".") : "";

		return tagName + tagId + tagClass;
	} else {
		return "";
	}
}

window.getElementXPath = function(element) {
	var xPath = "";
	for (; element; element = element.parentNode) {
		var xTag = window.getElementXTag(element);
		if (xTag) {
			xPath = xTag + ">" + xPath;
		}
	}

	return xPath.endsWith(">") ? xPath.slice(0, -1) : xPath;
}

window.connectObserver = function(target, options) {
	window.disconnectObserver();

	window.mutationObserver = new MutationObserver(function(records, observer) {
		for (var record of records) {
			switch (record.type) {
				case "attributes":
					Android.runOnAndroid(record.type, record.attributeName, record.target, record.oldValue);
					break;
				case "childList":
					if (record.addedNodes.length > 0) {
						record.addedNodes.forEach(function(node) {
							Android.runOnAndroid(record.type, "addedNodes", record.target, node);
						});
					}

					if (record.removedNodes.length > 0) {
						record.removedNodes.forEach(function(node) {
							Android.runOnAndroid(record.type, "removedNodes", record.target, node);
						});
					}
					break;
			}
		}
	});

    window.mutationObserver.observe(target, options);

	/*
	window.intersectionObserver = new IntersectionObserver(function(entries, observer) {
		for (var entry of entries) {
			console.log(entry);
		}
	}, {root: null, rootMargin: "0px", threshold: 1.0});

    window.intersectionObserver.observe(target);

	window.resizeObserver = new ResizeObserver(function(entries, observer) {
		for (var entry of entries) {
			console.log(entry);
		}
	});

    window.resizeObserver.observe(target, { box : "border-box" });
    */

	return {mutationObserver: window.mutationObserver, intersectionObserver: window.intersectionObserver, resizeObserver: window.resizeObserver};
}

window.disconnectObserver = function() {
	if (typeof window.mutationObserver !== "undefined") {
		window.mutationObserver.disconnect();
		window.mutationObserver = undefined;
		delete window.mutationObserver;
	}

	/*
	if (typeof window.intersectionObserver !== "undefined") {
		window.intersectionObserver.disconnect();
		window.intersectionObserver = undefined;
		delete window.intersectionObserver;
	}

	if (typeof window.resizeObserver !== "undefined") {
		window.resizeObserver.disconnect();
		window.resizeObserver = undefined;
		delete window.resizeObserver;
	}
	*/
}

// End Inject Observer Section


// Begin Inject Print Section

window.disconnectObserver();

/*
if (document.location.href === document.location.origin + "/#/desktop/items/product/all") {
	var observeElement = document.querySelector("html>body>div#app>div#content");
	if (observeElement) {
	    window.connectObserver(observeElement, {attributes: true, childList: true, subtree: true});
	}
}
*/

window.document.queryCommandSupportedOld = window.document.queryCommandSupported;

window.document.queryCommandSupported = function(command) {
	if (command === "print") {
		var printIframe = document.querySelector("iframe[id^=printThis-]");

		if (printIframe) {
			var execCommandOld = printIframe.contentWindow.document.execCommand;

			printIframe.contentWindow.document.execCommand = function(aCommandName, aShowDefaultUI, aValueArgument) {
				if (aCommandName === "print") {
					window.injectPrint(printIframe);
					execCommandOld(aCommandName, aShowDefaultUI, aValueArgument);
				}
			}

			var printOld = printIframe.contentWindow.print;

			printIframe.contentWindow.print = function() {
				window.injectPrint(printIframe);
				printOld();
			}
		}
	}

	window.document.queryCommandSupportedOld(command);
}

window.injectPrint = function(printIframe) {
	//alert("Print iframe detected.");

	printIframe.contentWindow.document.body.style.fontSize = "300%";
}

window.Android = {};

window.Android.runOnAndroid = function(type, name, target, node) {
	if (type === "childList" && name === "addedNodes") {
		if (node.localName === "div" && node.id === "dataTable_wrapper") {
			var selectElement = target.querySelector("div.row>div>div#dataTable_length>label>select[name=dataTable_length]");
			if (selectElement) {
				window.disconnectObserver();

				window.checkPrintBarcode();
			}
		}
	}
};

document.body.addEventListener("click", function(event) {
	setTimeout(function() {
		if (document.location.href === document.location.origin + "/#/desktop/items/product/all") {
			console.log("Click: " + event.target.innerText);
			if (event.target.localName === "span" && event.target.className === "name") {
				window.checkPrintBarcode();
			}
		}
	}, 100);
});

window.checkPrintBarcode = function() {
	console.log("checkPrintBarcode");

	var contentElement = document.querySelector("html>body>div#app>div#content");
	var selectElement = contentElement.querySelector("div.content>div>div#dataTable_wrapper>div.row>div>div#dataTable_length>label>select");
	if (selectElement && selectElement.options[selectElement.options.length - 1].value !== "1000") {
		selectElement.options[selectElement.options.length] = new Option("1000", 1000);
		selectElement.value = selectElement.options[selectElement.options.length - 1].value;
		selectElement.dispatchEvent(new Event("change"));

		var selectListElement = contentElement.querySelector("div>div>div>div.action>div#dropdownOptions>div.dropdown-menu>a.dropdown-item");
		if (selectListElement) {
			selectListElement.addEventListener("click", function() {
				var cancelButtonElement = contentElement.querySelector("div.content>div>div>div:nth-child(2)>button:nth-child(2)");
				if (cancelButtonElement) {
					var numberInput = document.createElement("input");
					numberInput.type = "number";
					numberInput.min = 1;
					numberInput.max = 100;
					numberInput.value = numberInput.min;
					numberInput.placeholder = "1";
					numberInput.style.marginLeft = "50px";
					numberInput.style.textAlign = "center";
					cancelButtonElement.parentElement.appendChild(numberInput);

					var selectButton = document.createElement("button");
					selectButton.type = "button";
					selectButton.className = "btn btn-web";
					selectButton.innerText = "พิมพ์บาร์โค้ด";
					selectButton.style.marginLeft = "10px";
					cancelButtonElement.parentElement.appendChild(selectButton);
					selectButton.addEventListener("click", function() {
						var numberBarcode = isNaN(numberInput.valueAsNumber) ? Number(numberInput.placeholder) : Number(numberInput.valueAsNumber);
						if (numberBarcode <= 0) {
							return;
						}

						var productTable = document.querySelector("html>body>div#app>div#content>div>div>div#dataTable_wrapper>div.row>div>table#dataTable>tbody");
						if (productTable) {
							var allCheckBox = productTable.querySelectorAll("input.vs-checkbox--input");
							if (allCheckBox) {
								var allPrintHTML = [];
								for (var i = 0, j = allCheckBox.length; i < j; i++) {
									var checkBox = allCheckBox.item(i);
									if (checkBox.checked) {
										var dataTable = checkBox.parentNode.parentNode.parentNode.children;
										var barcode = dataTable.item(3).innerText;
										var product = dataTable.item(4).innerText;
										var price = dataTable.item(5).innerText;
										allPrintHTML[allPrintHTML.length] = [barcode, product, price];
									}
								}

								if (allPrintHTML.length > 0) {
									window.printHTML(window.getBarcodeHTML, {args: [allPrintHTML, numberBarcode]});
									this.previousSibling.previousSibling.click();
								}
							}
						}
					});
				}
			});
		}
	}
};

// End Inject Print Section


// Begin Print Section

window.printHTML = function(callback, options) {
	var printIFrame = document.createElement("iframe");
	printIFrame.style.position = "absolute";
	printIFrame.style.top = -999;
	printIFrame.style.left = -999;
	document.body.appendChild(printIFrame);

	var frameWindow = printIFrame.contentWindow || printIFrame.contentDocument || printIFrame;
	var frameDocument = frameWindow.document || frameWindow.contentDocument || frameWindow;

	callback(frameDocument, options);

	frameDocument.close();

	// Fix for IE : Allow it to render the iframe
	frameWindow.focus();

	try {
	  // Fix for IE11 - printng the whole page instead of the iframe content
	  if (!frameWindow.document.execCommand("print", false, null)) {
	    // document.execCommand returns false if it failed -http://stackoverflow.com/a/21336448/937891
	    frameWindow.print();
	  }

	  // focus body as it is losing focus in iPad and content not getting printed
	  document.body.focus();
	} catch (e) {
	  frameWindow.print();
	}

	frameWindow.close();

	setTimeout(function() {
	  printIFrame.parentElement.removeChild(printIFrame);
	}, 100);
}

// End Print Section


// Begin Barcode Section

window.getBarcodeHTML = function(frameDocument, options) {
	var numberColumn = 5;
	var numberRow = 100 / numberColumn;
	var leftPage = 0;
	var topPage = 0;

	var barcodeHTML = document.createElement("div");
	barcodeHTML.style.top = -999;
	barcodeHTML.style.left = -999;
	frameDocument.body.appendChild(barcodeHTML);

	var table = document.createElement("table");
	table.style.cssText = "border = 0px; left: " + leftPage + "px; top: " + topPage + "px;";
	barcodeHTML.insertBefore(table, barcodeHTML.firstChild);

	var tableBody = document.createElement("tbody");
	table.appendChild(tableBody);

	var countBarcode = 0;
	var barcode = "";
	var product = "";
	var price = "";

	for (var i = 0; i < numberRow && (options.args[0].length > 0 || countBarcode > 0); i++) {
		var tableRow = document.createElement("tr");
		tableBody.appendChild(tableRow);

		for (var j = 0; j < numberColumn && (options.args[0].length > 0 || countBarcode > 0); j++) {
			if (countBarcode === 0) {
				if (options.args[0].length > 0) {
					countBarcode = options.args[1];

					var printRow = options.args[0].shift();
					barcode = printRow.shift();
					product = printRow.shift();
					price = printRow.shift();
				} else {
					break;
				}
			}

			countBarcode--;

			var tableData = document.createElement("td");
			tableData.style.cssText = "padding: 0px; text-align: center; vertical-align: bottom; width: 178px;";
			tableRow.appendChild(tableData);

			var barcodeContent = document.createElement("div");
			barcodeContent.style.cssText = "padding: 10px; text-align: center; vertical-align: middle; background: #fff; font-family: 'TH Sarabun New';";
			tableData.appendChild(barcodeContent);

			var barcodeHeader = document.createElement("div");
			barcodeHeader.style.cssText = "padding: 0px; text-align: center; font-weight: bold; font-size: 1.0em;";
			barcodeHeader.innerText = product;
			barcodeContent.appendChild(barcodeHeader);

			var barcodeBody = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			barcodeBody.style.cssText = "padding: 0px; text-align: center;";
			barcodeContent.appendChild(barcodeBody);

			var barcodeFooter = document.createElement("div");
			barcodeFooter.style.cssText = "padding: 0px; text-align: center; font-weight: bold; font-size: 1.2em;";
			barcodeFooter.innerText = Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " บาท";
			barcodeContent.appendChild(barcodeFooter);

			JsBarcode(barcodeBody, barcode, {
				format: "CODE128",
				font: "TH Sarabun New",
				fontOptions: "bold",
				fontSize: 18,
				margin: 0,
				textMargin: 0,
				width: 2,
				height: 40
			});
		}
	}
}

// End Barcode Section
