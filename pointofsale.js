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
	alert("Print iframe detected.");

	printIframe.contentWindow.document.body.style.fontSize = "300%";
}
