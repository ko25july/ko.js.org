/*
(function () {
    //const injectBase = "http://localhost:8080/app.treesoft.io";
    const injectBase = "https://ko.js.org/app.treesoft.io";

    let injectScript = document.createElement("script");
    injectScript.src = injectBase + "/inject.js";
    document.head.appendChild(injectScript);
})();
*/

(function () {
    //const injectBase = "http://localhost:8080/app.treesoft.io";
    const injectBase = "https://ko.js.org/app.treesoft.io";

    let JsBarcodeScript = document.createElement("script");
    JsBarcodeScript.src = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js";
    document.head.appendChild(JsBarcodeScript);

    document.injectInitial = function () {
        // Begin XMLHttpRequest Section

        if (typeof document.httpRequest !== "function") {
            document.httpRequest = function (url, callback) {
                let xmlHttp = new XMLHttpRequest();

                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState === XMLHttpRequest.DONE && xmlHttp.status === 200) {
                        if (typeof callback === "function") {
                            callback(xmlHttp.responseText);
                        }
                    }
                };

                xmlHttp.open("GET", url, true);
                xmlHttp.send(null);
            };
        }

        // End XMLHttpRequest Section

        // Begin Inject Observer Section

        if (typeof document.getElementXTag !== "function") {
            document.getElementXTag = function (element) {
                if (element && element.nodeType === Node.ELEMENT_NODE) {
                    let tagName = element.localName;
                    let tagId = element.id ? "#" + element.id.trim() : "";
                    let tagClass = element.className ? "." + element.className.trim().split(" ").join(".") : "";

                    return tagName + tagId + tagClass;
                } else {
                    return "";
                }
            };
        }

        if (typeof document.getElementXPath !== "function") {
            document.getElementXPath = function (element) {
                let xPath = "";

                for (; element; element = element.parentNode) {
                    let xTag = document.getElementXTag(element);

                    if (xTag) {
                        xPath = xTag + ">" + xPath;
                    }
                }

                return xPath.endsWith(">") ? xPath.slice(0, -1) : xPath;
            };
        }

        if (typeof document.connectMutationObserver !== "function") {
            document.connectMutationObserver = function (target, options, callback) {
                if (typeof document.disconnectMutationObserver === "function") {
                    document.disconnectMutationObserver();
                }

                document.connectMutationObserver.mutationObserver = new MutationObserver(function (records) {
                    if (typeof callback === "function") {
                        for (let record of records) {
                            switch (record.type) {
                                case "attributes":
                                    callback(record.type, record.attributeName, record.target, record.oldValue);
                                    break;
                                case "childList":
                                    if (record.addedNodes.length > 0) {
                                        record.addedNodes.forEach(function (node) {
                                            callback(record.type, "addedNodes", record.target, node);
                                        });
                                    }

                                    if (record.removedNodes.length > 0) {
                                        record.removedNodes.forEach(function (
                                            node
                                        ) {
                                            callback(record.type, "removedNodes", record.target, node);
                                        });
                                    }
                                    break;
                            }
                        }
                    }
                });

                document.connectMutationObserver.mutationObserver.observe(target, options || {
                    attributes: true,
                    childList: true,
                    subtree: true
                });

                return document.connectMutationObserver.mutationObserver;
            };
        }

        if (typeof document.connectIntersectionObserver !== "function") {
            document.connectIntersectionObserver = function (target, options, callback) {
                if (typeof document.disconnectIntersectionObserver === "function") {
                    document.disconnectIntersectionObserver();
                }

                document.connectIntersectionObserver.intersectionObserver = new IntersectionObserver(function (entries, observer) {
                    if (typeof callback === "function") {
                        for (let entry of entries) {
                            callback(entry, observer, target);
                        }
                    }
                }, options || {root: null, rootMargin: "0px 0px 0px 0px", threshold: 0.0});

                document.connectIntersectionObserver.intersectionObserver.observe(target);

                return document.connectIntersectionObserver.intersectionObserver;
            };
        }

        if (typeof document.connectResizeObserver !== "function") {
            document.connectResizeObserver = function (target, options, callback) {
                if (typeof document.disconnectResizeObserver === "function") {
                    document.disconnectResizeObserver();
                }

                // noinspection JSUnresolvedFunction
                document.connectResizeObserver.resizeObserver = new ResizeObserver(function (entries, observer) {
                    if (typeof callback === "function") {
                        for (let entry of entries) {
                            callback(entry, observer, target);
                        }
                    }
                });

                document.connectResizeObserver.resizeObserver.observe(target, options || {box: "border-box"});

                return document.connectResizeObserver.resizeObserver;
            };
        }

        if (typeof document.disconnectMutationObserver !== "function") {
            document.disconnectMutationObserver = function () {
                if (document.connectMutationObserver.mutationObserver instanceof MutationObserver) {
                    document.connectMutationObserver.mutationObserver.disconnect();
                    document.connectMutationObserver.mutationObserver = undefined;
                    delete document.connectMutationObserver.mutationObserver;
                }
            };
        }

        if (typeof document.disconnectIntersectionObserver !== "function") {
            document.disconnectIntersectionObserver = function () {
                if (document.connectIntersectionObserver.intersectionObserver instanceof IntersectionObserver) {
                    document.connectIntersectionObserver.intersectionObserver.disconnect();
                    document.connectIntersectionObserver.intersectionObserver = undefined;
                    delete document.connectIntersectionObserver.intersectionObserver;
                }
            };
        }

        if (typeof document.disconnectResizeObserver !== "function") {
            document.disconnectResizeObserver = function () {
                // noinspection JSUnresolvedVariable
                if (document.connectResizeObserver.resizeObserver instanceof ResizeObserver) {
                    document.connectResizeObserver.resizeObserver.disconnect();
                    document.connectResizeObserver.resizeObserver = undefined;
                    delete document.connectResizeObserver.resizeObserver;
                }
            };
        }

        // End Inject Observer Section

        // Begin Inject Print Section

        if (typeof document.injectPrintDocument !== "function") {
            document.injectPrintDocument = function (injectDocument) {
                if (!injectDocument.execCommandOld) {
                    injectDocument.execCommandOld = injectDocument.execCommand;

                    injectDocument.execCommand = function (aCommandName, aShowDefaultUI, aValueArgument) {
                        if (aCommandName === "print" && document.injectPrint) {
                            if (document.injectPrint(injectDocument)) {
                                return;
                            }
                        }

                        setTimeout(function () {
                            injectDocument.execCommandOld(aCommandName, aShowDefaultUI, aValueArgument);
                        }, 1000);
                    };
                }

                if (!injectDocument.printOld) {
                    injectDocument.printOld = injectDocument.print;

                    injectDocument.print = function () {
                        if (document.injectPrint) {
                            if (document.injectPrint(injectDocument)) {
                                return;
                            }
                        }

                        setTimeout(function () {
                            injectDocument.printOld();
                        }, 1000);
                    };
                }
            };

            document.injectPrintDocument(document);
        }

        if (typeof document.queryCommandSupportedOld !== "function") {
            document.queryCommandSupportedOld = document.queryCommandSupported;

            document.queryCommandSupported = function (command) {
                if (command === "print") {
                    let printIframe = document.querySelector("iframe[id^=printThis-]");

                    if (printIframe) {
                        document.injectPrintDocument(printIframe.contentWindow.document);
                    }
                }

                return document.queryCommandSupportedOld(command);
            };
        }

        if (typeof document.injectPrint !== "function") {
            document.injectPrint = function (injectDocument) {
                //alert("Print iframe detected.");

                if (injectDocument) {
                    let printContent = document.createElement("div");
                    printContent.style.cssText = "width: 100%; padding: 20px; text-align: center; vertical-align: top; background: #fff; font-family: 'TH Sarabun New';";

                    let printHeader = document.createElement("div");
                    printHeader.innerHTML = document.printHeaderHTML;
                    printHeader.style.cssText = "width: 100%;";
                    printContent.appendChild(printHeader);

                    let printBody = document.createElement("div");
                    printBody.style.cssText = "width: 100%;";
                    printContent.appendChild(printBody);

                    let printFooter = document.createElement("div");
                    printFooter.innerHTML = document.printFooterHTML;
                    printFooter.style.cssText = "width: 100%;";
                    printContent.appendChild(printFooter);

                    let product = "";
                    let price = "";
                    let amount = "";
                    let total = "";
                    let numberTotal = "0";
                    let numberItems = 0;
                    let numberPieces = 0;
                    let numberPay = "0";
                    let numberChange = "0";

                    let listAllProduct = injectDocument.body.querySelectorAll("div.receipt-template>div>ul>li");

                    if (listAllProduct) {
                        numberItems = listAllProduct.length;

                        listAllProduct.forEach(function (listItem) {
                            let listData = listItem.textContent.split("\n").map(function (item) {
                                return item.trim();
                            }).filter(function (item) {
                                return item;
                            });

                            product = listData[0];
                            price = listData[1];
                            amount = listData[2].split(" ")[0].slice(1);
                            total = listData[3];
                            numberPieces += parseInt(amount);

                            let printData = document.createElement("div");
                            printData.style.cssText = "width: 100%;";
                            printData.innerHTML = "<div style='width: 100%; text-align: center; display: inline-flex;'>" +
                                "<div style='width: 15%; padding-right: 40px; text-align: right;'>" + parseFloat(amount).toLocaleString() + "</div>" + "<div style='width: 50%; text-align: left;'>" + product + "</div>" +
                                "<div style='width: 15%; padding-right: 20px; text-align: right;'>" + parseFloat(price).toLocaleString() + "</div>" +
                                "<div style='width: 20%; text-align: right;'>" + parseFloat(total).toLocaleString() + "</div>" +
                                "</div>";
                            printBody.appendChild(printData);
                        });
                    }

                    let listAllSummary = injectDocument.body.querySelectorAll("div.receipt-template>div>div:not([class=footer])");

                    if (listAllSummary && listAllSummary.length > 0) {
                        numberTotal = listAllSummary[0].textContent.split(" ").map(function (item) {
                            return item.trim();
                        }).filter(function (item) {
                            return item;
                        })[1];
                    }

                    if (listAllSummary && listAllSummary.length > 1) {
                        numberPay = listAllSummary[1].textContent.split(" ").map(function (item) {
                            return item.trim();
                        }).filter(function (item) {
                            return item;
                        })[1];
                    }

                    if (listAllSummary && listAllSummary.length > 2) {
                        numberChange = listAllSummary[2].textContent.split(" ").map(function (item) {
                            return item.trim();
                        }).filter(function (item) {
                            return item;
                        })[1];
                    }

                    printHeader.querySelector("div#receiptDate").innerHTML = new Date().toLocaleString("th-TH");
                    printFooter.querySelector("div#numberItems").innerHTML = "<strong>" + parseFloat("" + numberItems).toLocaleString() + "</strong>";
                    printFooter.querySelector("div#numberPieces").innerHTML = "<strong>" + parseFloat("" + numberPieces).toLocaleString() + "</strong>";
                    printFooter.querySelector("div#numberTotal").innerHTML = "<strong>" + parseFloat(numberTotal).toLocaleString(undefined, {maximumFractionDigits: 2,}) + "</strong>";
                    printFooter.querySelector("div#numberPay").innerHTML = "<strong>" + parseFloat(numberPay).toLocaleString(undefined, {maximumFractionDigits: 2,}) + "</strong>";
                    printFooter.querySelector("div#numberChange").innerHTML = "<strong>" + parseFloat(numberChange).toLocaleString(undefined, {maximumFractionDigits: 2,}) + "</strong>";

                    injectDocument.querySelector("html").style.cssText = "width: 300px; font-size: 60px;";

                    injectDocument.body.innerHTML = "";
                    injectDocument.body.appendChild(printContent);
                }

                return false;
            };
        }

        // End Inject Print Section

        // Begin Print Section

        if (typeof document.printContentDocument !== "function") {
            document.printContentDocument = function (callback) {
                let printIFrame = document.createElement("iframe");
                printIFrame.style.position = "absolute";
                printIFrame.style.top = "-999";
                printIFrame.style.left = "-999";
                document.body.appendChild(printIFrame);

                let frameWindow = printIFrame.contentWindow || printIFrame.contentDocument || printIFrame;
                let frameDocument = frameWindow.document || frameWindow.contentDocument || frameWindow;

                if (typeof callback === "function") {
                    callback(frameDocument);
                }

                frameDocument.close();

                // Fix for IE : Allow it to render the iframe
                frameWindow.focus();

                try {
                    // Fix for IE11 - printing the whole page instead of the iframe content
                    if (!frameDocument.execCommand("print", false, null)) {
                        // document.execCommand returns false if it failed -http://stackoverflow.com/a/21336448/937891
                        frameWindow.print();
                    }

                    // focus body as it is losing focus in iPad and content not getting printed
                    document.body.focus();
                } catch (e) {
                    frameWindow.print();
                }

                frameWindow.close();

                setTimeout(function () {
                    printIFrame.parentElement.removeChild(printIFrame);
                }, 100);
            };
        }

        // End Print Section

        // Begin Add Button Barcode Section

        if (typeof document.checkPrintBarcodeButton !== "function") {
            document.checkPrintBarcodeButton = function (element) {
                if (element.localName === "button" && element.innerText === "ยกเลิก") {
                    let printBarcodeContent = document.querySelector("html>body>div#app>div#content>div.header>div.header-inner>div.right>div.action>div#print-barcode-content");

                    if (printBarcodeContent) {
                        printBarcodeContent.parentNode.removeChild(printBarcodeContent);
                    }

                    return;
                } else if (element.localName === "input" && element.type === "checkbox" && element.className === "vs-checkbox--input") {
                    if (document.checkPrintBarcodeButton.printBarcodeList) {
                        if (element.value === "true") {
                            let listAllProduct = element.closest("thead").nextElementSibling.children;

                            if (listAllProduct) {
                                listAllProduct.forEach(function (listItem) {
                                    let dataRow = listItem.closest("tr");

                                    if (dataRow) {
                                        let checkBoxInput = dataRow.querySelector("td>div.vs-component>input.vs-checkbox--input");

                                        if (checkBoxInput) {
                                            let dataList = dataRow.children;

                                            if (checkBoxInput.checked) {
                                                document.checkPrintBarcodeButton.printBarcodeList[dataList.item(3).innerText] = [dataList.item(4).innerText, dataList.item(5).innerText];
                                            } else {
                                                delete document.checkPrintBarcodeButton.printBarcodeList[dataList.item(3).innerText];
                                            }
                                        }
                                    }
                                });
                            }
                        } else if (element.value === "false") {
                            document.checkPrintBarcodeButton.printBarcodeList = [];
                        } else {
                            let dataList = element.closest("tr").children;

                            if (element.checked) {
                                document.checkPrintBarcodeButton.printBarcodeList[dataList.item(3).innerText] = [dataList.item(4).innerText, dataList.item(5).innerText];
                            } else {
                                delete document.checkPrintBarcodeButton.printBarcodeList[dataList.item(3).innerText];
                            }
                        }
                    }

                    return;
                } else if (element.localName !== "span" || element.innerText !== "เลือกหลายรายการ") {
                    return;
                }

                let contentDiv = document.querySelector("html>body>div#app>div#content");

                if (!contentDiv) {
                    return;
                }

                let headerActionBar = contentDiv.querySelector("div.header>div.header-inner>div.right>div.action");

                if (!headerActionBar) {
                    return;
                }

                let cancelButton = contentDiv.querySelector("div.content>div>div.row>div:nth-child(2)>button:nth-child(2)");
                let printBarcodeContent = headerActionBar.querySelector("div#print-barcode-content");

                if (!cancelButton || printBarcodeContent) {
                    if (printBarcodeContent) {
                        headerActionBar.removeChild(printBarcodeContent);
                    }

                    return;
                }

                printBarcodeContent = document.createElement("div");
                printBarcodeContent.id = "print-barcode-content";
                printBarcodeContent.style.cssText = "display: inline-block; padding-bottom: 10px;";
                headerActionBar.appendChild(printBarcodeContent);

                let textCaption = document.createElement("div");
                textCaption.style.cssText = "display: inline-block; margin: 0px 10px;";
                textCaption.innerText = "จำนวนบาร์โค้ดต่อรายการสินค้า";
                printBarcodeContent.appendChild(textCaption);

                let numberInput = document.createElement("input");
                numberInput.type = "number";
                numberInput.min = "1";
                numberInput.max = "100";
                numberInput.value = numberInput.min;
                numberInput.placeholder = "1";
                numberInput.style.cssText = "display: inline-block; margin: 0px 10px; text-align: center;";
                printBarcodeContent.appendChild(numberInput);

                let selectButton = document.createElement("button");
                selectButton.type = "button";
                selectButton.className = "btn btn-web";
                selectButton.innerText = "พิมพ์บาร์โค้ด";
                selectButton.style.cssText = "display: inline-block; margin: 0px 10px;";
                printBarcodeContent.appendChild(selectButton);

                document.checkPrintBarcodeButton.printBarcodeList = [];

                selectButton.addEventListener("click", function (event) {
                    let element = event.target;
                    console.log("Click: " + element.innerText);
                    //alert("Click: " + element.innerText);

                    let numberBarcode = isNaN(numberInput.valueAsNumber) ? Number(numberInput.placeholder) : Number(numberInput.valueAsNumber);

                    if (numberBarcode > 0 && document.checkPrintBarcodeButton.printBarcodeList && document.checkPrintBarcodeButton.printBarcodeList.length > 0) {
                        document.printContentDocument(function (printDocument) {
                            let numberColumn = 5;
                            let numberRow = 1000 / numberColumn;
                            let leftPage = 0;
                            let topPage = 0;

                            let barcodeHTML = document.createElement("div");
                            barcodeHTML.style.position = "absolute";
                            barcodeHTML.style.top = "-999";
                            barcodeHTML.style.left = "-999";
                            printDocument.body.appendChild(barcodeHTML);

                            let table = document.createElement("table");
                            table.style.cssText = "border = 0px; left: " + leftPage + "px; top: " + topPage + "px;";
                            barcodeHTML.insertBefore(table, barcodeHTML.firstChild);

                            let tableBody = document.createElement("tbody");
                            table.appendChild(tableBody);

                            let countBarcode = 0;
                            let barcode = "";
                            let product = "";
                            let price = "";
                            let barcodeList = Object.keys(document.checkPrintBarcodeButton.printBarcodeList);

                            for (let i = 0; i < numberRow && (barcodeList.length > 0 || countBarcode > 0); i++) {
                                let tableRow = document.createElement("tr");
                                tableBody.appendChild(tableRow);

                                for (let j = 0; j < numberColumn && (barcodeList.length > 0 || countBarcode > 0); j++) {
                                    if (countBarcode === 0) {
                                        if (barcodeList.length > 0) {
                                            countBarcode = numberBarcode;

                                            barcode = barcodeList.shift();
                                            let productArray = document.checkPrintBarcodeButton.printBarcodeList[barcode];
                                            product = productArray[0];
                                            price = productArray[1];
                                        } else {
                                            break;
                                        }
                                    }

                                    countBarcode--;

                                    let tableData = document.createElement("td");
                                    tableData.style.cssText = "padding: 0px; text-align: center; vertical-align: bottom; width: 178px;";
                                    tableRow.appendChild(tableData);

                                    let barcodeContent = document.createElement("div");
                                    barcodeContent.style.cssText = "padding: 10px; text-align: center; vertical-align: middle; background: #fff; font-family: 'TH Sarabun New';";
                                    tableData.appendChild(barcodeContent);

                                    let barcodeHeader = document.createElement("div");
                                    barcodeHeader.style.cssText = "padding: 0px; text-align: center; font-weight: bold; font-size: 1.0em;";
                                    barcodeHeader.innerText = product;
                                    barcodeContent.appendChild(barcodeHeader);

                                    let barcodeBody = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                                    barcodeBody.style.cssText = "padding: 0px; text-align: center;";
                                    barcodeContent.appendChild(barcodeBody);

                                    let barcodeFooter = document.createElement("div");
                                    barcodeFooter.style.cssText = "padding: 0px; text-align: center; font-weight: bold; font-size: 1.2em;";
                                    barcodeFooter.innerText = Number(price).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }) + " บาท";
                                    barcodeContent.appendChild(barcodeFooter);

                                    // noinspection JSUnresolvedFunction
                                    JsBarcode(barcodeBody, barcode, {
                                        format: "CODE128",
                                        font: "TH Sarabun New",
                                        fontOptions: "bold",
                                        fontSize: 18,
                                        margin: 0,
                                        textMargin: 0,
                                        width: 2,
                                        height: 30,
                                        displayValue: false,
                                    });
                                }
                            }
                        });
                    }
                });

                if (typeof document.Vue === "undefined") {
                    document.Vue = document.getElementById("app");

                    if (typeof document.Vue !== "undefined") {
                        // noinspection JSUnresolvedVariable
                        document.Vue = document.Vue.__vue__;
                    }
                }

                if (typeof document.Vue !== "undefined" && typeof document.VueProductAll === "undefined") {
                    // noinspection JSUnresolvedVariable,JSUnresolvedFunction
                    document.VueProductAll = document.Vue.$vnode.child.$children.find(function (element) {
                        // noinspection JSUnresolvedVariable
                        return element.$vnode.tag && element.$vnode.tag.endsWith("-ProductAll");
                    });
                }

                if (typeof document.Vue !== "undefined" && typeof document.VueProductAll !== "undefined") {
                    // noinspection JSUnresolvedVariable
                    if (document.VueProductAll.$store.state.app.pagination.totalRows > document.Vue.$store.state.app.limitRowsPerpage) {
                        headerActionBar.parentElement.style.cssText = "flex: none; max-width: none;";

                        let allProductButton = document.createElement("button");
                        allProductButton.type = "button";
                        allProductButton.className = "btn btn-danger";
                        allProductButton.innerText = "แสดงสินค้าทั้งหมด";
                        allProductButton.style.cssText = "display: inline-block; margin: 0px 10px;";
                        printBarcodeContent.insertBefore(allProductButton, printBarcodeContent.firstChild);

                        allProductButton.addEventListener("click", function (event) {
                            let element = event.target;
                            console.log("Click: " + element.innerText);
                            //alert("Click: " + element.innerText);

                            (async function () {
                                try {
                                    if (typeof document.Vue !== "undefined" && typeof document.VueProductAll !== "undefined") {
                                        // noinspection JSUnresolvedVariable
                                        document.Vue.$store.state.app.limitRowsPerpage = Math.ceil(document.VueProductAll.$store.state.app.pagination.totalRows / 10) * 10;

                                        // noinspection JSUnresolvedVariable
                                        document.VueProductAll.query.page = 1;

                                        // noinspection JSUnresolvedVariable,JSUnresolvedFunction
                                        await document.VueProductAll.fetchData();

                                        // noinspection JSUnresolvedVariable
                                        document.Vue.$store.state.product.products.sort((a, b) => (a.product_name > b.product_name) ? 1 : ((b.product_name > a.product_name) ? -1 : 0));
                                    }
                                } catch (e) {
                                }
                            })();

                            allProductButton.parentElement.removeChild(allProductButton);
                        });
                    }
                }
            };
        }

        // End Add Button Barcode Section
    };

    document.injectInitial();

    document.httpRequest(injectBase + "/printHeader.html", function (responseText) {
        document.printHeaderHTML = responseText;
    });

    document.httpRequest(injectBase + "/printFooter.html", function (responseText) {
        document.printFooterHTML = responseText;
    });

    document.addEventListener("click", function (event) {
        setTimeout(function () {
            let element = event.target;
            console.log("Click: " + element.innerText);
            //alert("Click: " + element.innerText);

            switch (document.location.href.split("?")[0]) {
                case document.location.origin + "/#/desktop/items/product/all":
                    document.checkPrintBarcodeButton(element);
                    break;

                case document.location.origin + "/#/desktop/pos":
                    document.checkPrintBarcodeButton(element);
                    break;
            }
        }, 100);
    });

    /*
    // noinspection JSUnusedLocalSymbols
    document.connectMutationObserver(document.body, {childList: true}, function (type, added, target, node) {
        document.disconnectMutationObserver();

        if (type === "childList" && added === "addedNodes") {
        }
    });
    */
})();
