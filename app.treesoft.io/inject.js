//var script = document.createElement("script");
//script.src = "http://localhost:8080/inject.js";
//script.src = "https://ko.js.org/app.treesoft.io/inject.js";
//document.head.appendChild(script);

var script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js";
document.head.appendChild(script);

document.injectInitial = function() {
	// Begin Inject Observer Section

	if (!document.getElementXTag) document.getElementXTag = function(element) {
		if (element && element.nodeType === Node.ELEMENT_NODE) {
			var tagName = element.localName;
			var tagId = element.id ? "#" + element.id.trim() : "";
			var tagClass = element.className ? "." + element.className.trim().split(" ").join(".") : "";

			return tagName + tagId + tagClass;
		} else {
			return "";
		}
	};

	if (!document.getElementXPath) document.getElementXPath = function(element) {
		var xPath = "";

		for (; element; element = element.parentNode) {
			var xTag = document.getElementXTag(element);

			if (xTag) {
				xPath = xTag + ">" + xPath;
			}
		}

		return xPath.endsWith(">") ? xPath.slice(0, -1) : xPath;
	};

	if (!document.connectObserver) document.connectObserver = function(target, options) {
		document.disconnectObserver();

		document.mutationObserver = new MutationObserver(function(records, observer) {
			for (var record of records) {
				switch (record.type) {
					case "attributes":
						document.Android.runOnAndroid(record.type, record.attributeName, record.target, record.oldValue);
						break;
					case "childList":
						if (record.addedNodes.length > 0) {
							record.addedNodes.forEach(function(node) {
								document.Android.runOnAndroid(record.type, "addedNodes", record.target, node);
							});
						}

						if (record.removedNodes.length > 0) {
							record.removedNodes.forEach(function(node) {
								document.Android.runOnAndroid(record.type, "removedNodes", record.target, node);
							});
						}
						break;
				}
			}
		});

		document.mutationObserver.observe(target, options);

		/*
		document.intersectionObserver = new IntersectionObserver(function(entries, observer) {
			for (var entry of entries) {
				console.log(entry);
			}
		}, {root: null, rootMargin: "0px", threshold: 1.0});

		document.intersectionObserver.observe(target);

		document.resizeObserver = new ResizeObserver(function(entries, observer) {
			for (var entry of entries) {
				console.log(entry);
			}
		});

		document.resizeObserver.observe(target, { box : "border-box" });
		*/

		return {mutationObserver: document.mutationObserver, intersectionObserver: document.intersectionObserver, resizeObserver: document.resizeObserver};
	};

	if (!document.disconnectObserver) document.disconnectObserver = function() {
		if (typeof document.mutationObserver !== "undefined") {
			document.mutationObserver.disconnect();
			document.mutationObserver = undefined;
			delete document.mutationObserver;
		}

		/*
		if (typeof document.intersectionObserver !== "undefined") {
			document.intersectionObserver.disconnect();
			document.intersectionObserver = undefined;
			delete document.intersectionObserver;
		}

		if (typeof document.resizeObserver !== "undefined") {
			document.resizeObserver.disconnect();
			document.resizeObserver = undefined;
			delete document.resizeObserver;
		}
		*/
	};

	// End Inject Observer Section


	// Begin Inject Print Section

	if (!document.injectPrintDocument) {
		document.injectPrintDocument = function(injectDocument) {
			if (!injectDocument.execCommandOld) {
				injectDocument.execCommandOld = injectDocument.execCommand;

				injectDocument.execCommand = function(aCommandName, aShowDefaultUI, aValueArgument) {
					if (aCommandName === "print" && document.injectPrint) {
						if (document.injectPrint(injectDocument)) {
							return;
						}
					}

					injectDocument.execCommandOld(aCommandName, aShowDefaultUI, aValueArgument);
				}
			};

			if (!injectDocument.printOld) {
				injectDocument.printOld = injectDocument.print;

				injectDocument.print = function() {
					if (document.injectPrint) {
						if (document.injectPrint(injectDocument)) {
							return;
						}
					}

					injectDocument.printOld();
				}
			};
		};

		document.injectPrintDocument(document);
	}

	if (!document.queryCommandSupportedOld) {
		document.queryCommandSupportedOld = document.queryCommandSupported;

		document.queryCommandSupported = function(command) {
			if (command === "print") {
				var printIframe = document.querySelector("iframe[id^=printThis-]");

				if (printIframe) {
					document.injectPrintDocument(printIframe.contentWindow.document);
				}
			}

			return document.queryCommandSupportedOld(command);
		}
	};

	if (!document.injectPrint) document.injectPrint = function(injectDocument) {
		//alert("Print iframe detected.");

		var printIframe = document.querySelector("iframe[id^=printThis-]");

		if (printIframe) {
			var printDocument = printIframe.contentWindow.document;

			var printContent = document.createElement("div");
			printContent.style.cssText = "width: 100%; padding: 20px; text-align: center; vertical-align: top; background: #fff; font-family: 'TH Sarabun New';";

			var printHeader = document.createElement("div");
			printHeader.innerHTML = document.printHeaderHTML;
			printHeader.style.cssText = "width: 100%;";
			printContent.appendChild(printHeader);

			var printBody = document.createElement("div");
			printBody.style.cssText = "width: 100%;";
			printContent.appendChild(printBody);

			var printFooter = document.createElement("div");
			printFooter.innerHTML = document.printFooterHTML;
			printFooter.style.cssText = "width: 100%;";
			printContent.appendChild(printFooter);

			var product = "";
			var price = "";
			var amount = "";
			var total = "";
			var numberTotal = "";
			var numberItems = "";
			var numberPieces = 0;
			var numberPay = "";
			var numberChange = "";

			var listAllProduct = printDocument.body.querySelectorAll("div.receipt-template>div>ul>li");

			if (listAllProduct) {
				numberItems = listAllProduct.length;

				listAllProduct.forEach(function(listItem) {
					var listData = listItem.textContent.split("\n").map(function(item) { return item.trim(); }).filter(function(item) { return item; });
					product = listData[0];
					price = listData[1];
					amount = listData[2].split(" ")[0].slice(1);
					total = listData[3];
					numberPieces += parseInt(amount);

					var printData = document.createElement("div");
					printData.style.cssText = "width: 100%;";
					printData.innerHTML = "<div style='width: 100%; text-align: center; font-size: 1.0rem; display: inline-flex;'>" +
						"<div style='width: 15%; text-align: center; font-size: 2.0rem;'>" + amount + "</div>" +
						"<div style='width: 50%; text-align: left; font-size: 2.0rem;'>" + product + "</div>" +
						"<div style='width: 15%; text-align: center; font-size: 2.0rem;'>" + price + "</div>" +
						"<div style='width: 20%; text-align: right; font-size: 2.0rem;'>" + total + "</div>" +
						"</div>";
					printBody.appendChild(printData);
				});
			}

			var listAllSummary = printDocument.body.querySelectorAll("div.receipt-template>div>div");

			if (listAllSummary && listAllSummary.length > 2) {
				numberTotal = listAllSummary[0].textContent.split(" ").map(function(item) { return item.trim(); }).filter(function(item){return item})[1];
				numberPay = listAllSummary[1].textContent.split(" ").map(function(item) { return item.trim(); }).filter(function(item){return item})[1];
				numberChange = listAllSummary[2].textContent.split(" ").map(function(item) { return item.trim(); }).filter(function(item){return item})[1];
			}

			printHeader.querySelector("div#receiptDate").innerText = new Date().toLocaleString("th-TH");
			printFooter.querySelector("div#numberItems").innerText = numberItems;
			printFooter.querySelector("div#numberPieces").innerText = numberPieces;
			printFooter.querySelector("div#numberTotal").innerText = numberTotal;
			printFooter.querySelector("div#numberPay").innerText = numberPay;
			printFooter.querySelector("div#numberChange").innerText = numberChange;

			printDocument.querySelector("html").style.fontSize = "20px";

			printDocument.body.innerHTML = "";
			printDocument.body.appendChild(printContent);
			document.body.appendChild(printDocument.body.firstChild.cloneNode(true));
			printDocument.body.firstChild.style.height = document.body.lastChild.clientHeight + "px";
			document.body.removeChild(document.body.lastChild);
		}

		return false;
	};

	if (!document.Android) document.Android = {};

	if (!document.Android.runOnAndroid) document.Android.runOnAndroid = function(type, name, target, node) {
		if (type === "childList" && name === "addedNodes") {
			if (node.localName === "div" && node.id === "dataTable_wrapper") {
				var selectElement = target.querySelector("div.row>div>div#dataTable_length>label>select[name=dataTable_length]");

				if (selectElement) {
					document.disconnectObserver();

					document.checkPrintBarcode();
				}
			}
		}
	};

	if (!document.checkPrintBarcode) document.checkPrintBarcode = function() {
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
										document.printHTML(document.getBarcodeHTML, {args: [allPrintHTML, numberBarcode]});
										//this.previousSibling.previousSibling.click();
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

	if (!document.printHTML) document.printHTML = function(callback, options) {
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
		  if (!framedocument.execCommand("print", false, null)) {
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
	};

	// End Print Section


	// Begin Barcode Section

	if (!document.getBarcodeHTML) document.getBarcodeHTML = function(frameDocument, options) {
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
					height: 30,
					displayValue: false
				});
			}
		}
	};

	// End Barcode Section


	// Begin XMLHttpRequest Section

	if (!document.httpRequest) document.httpRequest = function(url, callback) {
		var xmlHttp = new XMLHttpRequest();

		xmlHttp.onreadystatechange = function() {
			if (xmlHttp.readyState === XMLHttpRequest.DONE && xmlHttp.status === 200) {
				if (typeof(callback) === "function") {
					callback(xmlHttp.responseText);
				}
			}
		};

		xmlHttp.open("GET", url, true);
		xmlHttp.send(null);
	};

	// End XMLHttpRequest Section
};

document.injectInitial();

/*
if (document.disconnectObserver) document.disconnectObserver();

if (document.location.href === document.location.origin + "/#/desktop/items/product/all") {
	var observeElement = document.querySelector("html>body>div#app>div#content");
	if (observeElement) {
		document.connectObserver(observeElement, {attributes: true, childList: true, subtree: true});
	}
}
*/

document.addEventListener("click", function(event) {
	setTimeout(function() {
		console.log("Click: " + event.target.innerText);
		//alert("Click: " + event.target.innerText);

		if (document.location.href === document.location.origin + "/#/desktop/items/product/all") {
			if (event.target.localName === "span" && event.target.className === "name") {
				document.checkPrintBarcode();
			}
		} else if (document.location.href === document.location.origin + "/#/desktop/pos") {
			console.log("OK");
			alert("OK");
		}
	}, 100);
}, true);

document.httpRequest("https://ko.js.org/app.treesoft.io/printHeader.html", function(responseText) {
	document.printHeaderHTML = responseText;
});

document.httpRequest("https://ko.js.org/app.treesoft.io/printFooter.html", function(responseText) {
	document.printFooterHTML = responseText;
});
