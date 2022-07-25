const customErrors = require('../utils/errors');
const ThermalPrinter = require('../utils/printer-core').printer;
const Types = require('../utils/printer-core').types;

const escpos = require('escpos');

const express = require('express');
const router = express.Router();

const getDateString = (date) => {
    let day = date.getDate();
    if (day < 10) day = `0${day}`;

    let month = date.getMonth()+1;
    if (month < 10) month = `0${month}`;

    const year = date.getFullYear();
    let hrs = date.getHours();
    if (hrs < 10) hrs = `0${hrs}`;

    let minutes = date.getMinutes();
    if (minutes < 10) minutes = `0${minutes}`;

    let seconds = date.getSeconds();
    if (seconds < 10) seconds = `0${seconds}`;

    const localeDate = date.toLocaleString().substr(-2);

    return `${day}-${month}-${year} ${hrs}:${minutes}:${seconds} ${localeDate}`;
};

router.get('/sample-print', function(req, res, next) {

    const printType = req.query["printType"] || "multiple";

    escpos.USB = require('escpos-usb');
    const device  = new escpos.USB();

    const posPrinter = new escpos.Printer(device);

    let printer = new ThermalPrinter({
        type: Types.EPSON,  // 'star' or 'epson'
        options: {
            timeout: 1000
        },
        width: 48,                         // Number of characters in one line - default: 48
        characterSet: 'PC437_USA',          // Character set - default: SLOVENIA
        removeSpecialCharacters: false,    // Removes special characters - default: false
        lineCharacter: "=",                // Use custom character for drawing lines - default: -
    });

    if (printType === "single") {

        printer.setTypeFontA();
        printer.alignCenter();
        printer.bold(true);
        printer.println("***** CUSTOMER COPY *****");
        printer.drawLine();
        printer.newLine();
        printer.println("DEMO COMPANY NAME");
        printer.println("Demo Company Address & Location");
        printer.newLine();
        printer.alignLeft();
        printer.bold(false);
        printer.println("DateTime: 18-10-2021 05:10 PM");
        printer.println("Terminal ID: AGB00101");
        printer.println("Customer No: 202110182173812");
        printer.println("Customer Name: DEMO CUSTOMER");
        printer.drawLine();

        printer.newLine();
        printer.alignCenter();
        printer.bold(true);
        printer.println("CASH DEPOSIT");
        printer.println("CASH DEPOSIT SUCCESSFUL");
        printer.drawLine();

        printer.alignLeft();
        printer.bold(false);
        printer.leftRight("Txn Amount:", "1,000,000 UGX");
        printer.leftRight("Txn Fee:", "1,500 UGX");
        printer.leftRight("Excise Duty:", "1,000 UGX");
        printer.leftRight("Total Amount:", "1,002,500 UGX");
        printer.newLine();
        printer.drawLine();
        printer.println("You were served by: DEMO STAFF");

    }
    else {

        const products = [
            {qty: 2, name: 'CPTN GOLD 250', unit: 'BOX OF 12', price: 67000, total: 134000},
            {qty: 6, name: 'BOND 750ML', unit: 'BOTTLES', price: 87000, total: 522000},
            {qty: 5, name: 'BELL', unit: 'CRATE', price: 58000, total: 290000},
            {qty: 5, name: 'TUSKER LITE', unit: 'CRATE', price: 510000, total: 2550000}
        ];
        let summation = 0;

        printer.setTypeFontB();
        printer.setTextNormal();
        printer.alignCenter();
        printer.bold(true);
        printer.println("DEMO COMPANY NAME");
        printer.println("Demo Company Address & Location");
        printer.println("Tel: PHONE NUMBER");
        printer.println("TIN: TAX PAYER ID");
        printer.newLine();
        printer.alignLeft();
        printer.bold(false);
        printer.println("Customer: DEMO CUSTOMER");
        printer.println("Receipt No: 202110182173812");
        printer.println("DateTime: 18-10-2021 05:10 PM");
        printer.newLine();

        printer.tableCustom([
            { text:"Qty", align:"LEFT", cols:4, bold:true },
            { text:"Item", align:"LEFT", cols:14, bold:true },
            { text:"Unit Name", align:"LEFT", cols:10, bold:true },
            { text:"Price", align:"RIGHT", cols:9, bold:true },
            { text:"Amount", align:"RIGHT", cols:11, bold:true }
        ]);
        printer.drawLine();

        products.forEach((product) => {
            summation += product.total;
            printer.tableCustom(
                [
                    { text: product.qty, align:"LEFT", cols:4 },
                    { text: product.name, align:"LEFT", cols:14 },
                    { text: product.unit, align:"LEFT", cols:10 },
                    { text: formatCurrency(product.price), align:"RIGHT", cols:9 },
                    { text: formatCurrency(product.total), align:"RIGHT", cols:11 }
                ]
            );
        });

        printer.drawLine();
        printer.newLine();
        printer.tableCustom([
            { text:"TOTAL", align:"LEFT", cols:18, bold:true },
            { text: formatCurrency(summation), align:"RIGHT", cols:30, bold:true }
        ]);
        printer.drawLine();
        printer.newLine();

        printer.tableCustom([
            { text:"CASH", align:"RIGHT", cols:18, bold:true },
            { text: formatCurrency(3000000), align:"RIGHT", cols:30, bold:true }
        ]);
        printer.tableCustom([
            { text:"CHANGE", align:"RIGHT", cols:18, bold:true },
            { text: formatCurrency(496000), align:"RIGHT", cols:30, bold:true }
        ]);
        printer.newLine();

        printer.println("Served By: DEMO STAFF MEMBER");
        printer.alignCenter();
        printer.bold(true);
        printer.newLine();
        printer.println("Thank you for your business!");
    }

    printer.cut();

    device.open(function () {
        posPrinter.raw(printer.getBuffer()).close();
    });

    //console.log(printer.getPrintBuffer());

    res.status(200).json({});
});

router.post('/print-to-pos/:printType?', function(req, res, next) {

    const printType = req.params["printType"] || "multiple";
    escpos.USB = require('escpos-usb');
    const device  = new escpos.USB();

    const posPrinter = new escpos.Printer(device);
    const printData = req.body;

    let printer = new ThermalPrinter({
        type: Types.EPSON,  // 'star' or 'epson'
        options: {
            timeout: 1000
        },
        width: 48,                         // Number of characters in one line - default: 48
        characterSet: 'PC437_USA',          // Character set - default: SLOVENIA
        removeSpecialCharacters: false,    // Removes special characters - default: false
        lineCharacter: "=",                // Use custom character for drawing lines - default: -
    });

    if (printType === "single") {

        let transactionDetails = null;
        let lineItems = null;
        if (printData.hasOwnProperty('transaction_details') && printData["transaction_details"].length > 0) {
            transactionDetails = printData["transaction_details"][0];
        }

        if (printData.hasOwnProperty('line_items') && printData["line_items"].length > 0) {
            lineItems = printData["line_items"];
        }

        if (transactionDetails && lineItems) {
            const transactionDate = new Date(Date.parse(transactionDetails["trans_date"]));
            printer.setTypeFontA();
            printer.alignCenter();
            printer.bold(true);
            printer.println("***** CUSTOMER COPY *****");
            printer.drawLine();

            if (transactionDetails["company_name"] || transactionDetails["location"]) {
                printer.newLine();
            }

            if (transactionDetails["company_name"]) {
                printer.println(transactionDetails["company_name"]);
            }

            if (transactionDetails["location"]) {
                printer.println(transactionDetails["location"]);
            }

            if (transactionDetails["company_name"] || transactionDetails["location"]) {
                printer.newLine();
            }
            printer.alignLeft();
            printer.bold(false);
            printer.println("DateTime: " + getDateString(transactionDate));
            printer.println("Receipt No: " + transactionDetails["reference"]);
            printer.println("Customer Ref: " + transactionDetails["customer_no"]);
            printer.println("Customer Name: " + transactionDetails["customer_name"]);
            printer.drawLine();

            printer.newLine();
            printer.alignCenter();
            printer.bold(true);
            printer.println(transactionDetails["receipt_header"]);
            printer.println(transactionDetails["receipt_sub_header"]);
            printer.drawLine();

            printer.alignLeft();
            printer.bold(false);

            lineItems.forEach((row) => {
                printer.leftRight(row["label"] +":", row["value"]);
            });

            printer.newLine();
            printer.drawLine();
            printer.println("You were served by: " + transactionDetails["staff"]);
        }
        else {
            printer.setTypeFontB();
            printer.setTextNormal();
            printer.alignCenter();
            printer.bold(true);
            printer.println("RECEIPT DATA IS NOT IN THE EXPECTED FORMAT");
        }

    }
    else {
        let transactionDetails = null;
        let saleItems = null;
        let fiscalData = null;

        if (printData.hasOwnProperty('transaction_details') && printData["transaction_details"].length > 0) {
            transactionDetails = printData["transaction_details"][0];
        }

        if (printData.hasOwnProperty('sale_items') && printData["sale_items"].length > 0) {
            saleItems = printData["sale_items"];
        }

        if (printData.hasOwnProperty('fiscal_data')) {
            fiscalData = printData["fiscal_data"];
        }

        if (transactionDetails && saleItems) {
            const amountPaid = Number(transactionDetails["amount_paid"] || transactionDetails["amount_inclusive"]);
            const totalSum = Number(transactionDetails["amount_inclusive"]);
            const tax = Number(transactionDetails["tax"] || 0);
            const amountExclusive = Number(transactionDetails["amount_exclusive"] || 0);
            const change = totalSum - amountPaid;
            const transactionDate = new Date(Date.parse(transactionDetails["trans_date"]));

            printer.setTypeFontB();
            printer.setTextNormal();
            printer.alignCenter();
            printer.bold(true);
            printer.println(transactionDetails["company_name"]);
            printer.println(transactionDetails["branch_name"]);
            printer.println("Tel: " + transactionDetails["telephone"]);
            printer.println("TIN: " + transactionDetails["tin"]);
            printer.newLine();
            printer.alignLeft();
            printer.bold(false);
            printer.println("Customer: " + transactionDetails["customer_name"]);
            printer.println("TIN: " + transactionDetails["customer_tin"] || "");
            printer.println("Invoice No: " + transactionDetails["reference"]);
            printer.println("DateTime: " + getDateString(transactionDate));
            printer.newLine();

            printer.tableCustom([
                { text:"Qty", align:"LEFT", cols:4, bold:true },
                { text:"Item", align:"LEFT", cols:14, bold:true },
                { text:"Unit Name", align:"LEFT", cols:10, bold:true },
                { text:"Price", align:"RIGHT", cols:9, bold:true },
                { text:"Amount", align:"RIGHT", cols:11, bold:true }
            ]);
            printer.drawLine();

            saleItems.forEach((product) => {
                printer.tableCustom(
                    [
                        { text: product["quantity"], align:"LEFT", cols:4 },
                        { text: product["item_name"], align:"LEFT", cols:14 },
                        { text: product["unit_name"] || "DEFAULT", align:"LEFT", cols:10 },
                        { text: formatCurrency(product["unit_price"]), align:"RIGHT", cols:9 },
                        { text: formatCurrency(product["amount"]), align:"RIGHT", cols:11 }
                    ]
                );
            });

            printer.drawLine();
            printer.newLine();
            printer.tableCustom([
                { text:"TOTAL", align:"LEFT", cols:18, bold:true },
                { text: formatCurrency(totalSum), align:"RIGHT", cols:30, bold:true }
            ]);
            printer.drawLine();
            printer.newLine();

            printer.tableCustom([
                { text:"Tax", align:"RIGHT", cols:18, bold:true },
                { text: formatCurrency(tax), align:"RIGHT", cols:30, bold:true }
            ]);
            printer.tableCustom([
                { text:"Amount Exclusive", align:"RIGHT", cols:18, bold:true },
                { text: formatCurrency(amountExclusive), align:"RIGHT", cols:30, bold:true }
            ]);
            printer.tableCustom([
                { text:"Amount Inclusive", align:"RIGHT", cols:18, bold:true },
                { text: formatCurrency(amountPaid), align:"RIGHT", cols:30, bold:true }
            ]);
            // printer.tableCustom([
            //     { text:"CHANGE", align:"RIGHT", cols:18, bold:true },
            //     { text: formatCurrency(change), align:"RIGHT", cols:30, bold:true }
            // ]);
            printer.newLine();

            if (fiscalData) {
                try {
                    printer.alignCenter();
                    printer.println("Fiscal Data");
                    printer.drawLine();
                    printer.alignLeft();

                    //printer.println("Invoice No: " + fiscalData["invoice_no"]);
                    printer.println("FDN: " + fiscalData["fdn"]);
                    printer.println("Verification Code: " + fiscalData["verification_code"]);
                    printer.newLine();

                    printer.alignCenter();
                    printer.printQR(fiscalData["qrcode_data"]);

                    printer.newLine();
                    printer.alignLeft();
                }
                catch (error) {}
            }
            printer.println("Served By: " + transactionDetails["sales_person"]);
            printer.alignCenter();
            printer.bold(true);
            printer.newLine();
            printer.println("Thank you for your business!");
        }
        else {
            printer.setTypeFontB();
            printer.setTextNormal();
            printer.alignCenter();
            printer.bold(true);
            printer.println("RECEIPT DATA IS NOT IN THE EXPECTED FORMAT");
        }
    }

    printer.cut();

    device.open(function () {
        posPrinter.raw(printer.getBuffer()).close();
    });

    //console.log(printer.getPrintBuffer());

    res.status(200).json({});
});

function formatCurrency(amount) {
    let decimalPlaces = 0;
    if (amount.toString().indexOf(".") > 0) {
        amount = Number(amount.toFixed(2));
        decimalPlaces = 2;
    }

    const formatter = new Intl.NumberFormat('en-US', {minimumFractionDigits: decimalPlaces});

    return formatter.format(amount);
}

module.exports = router;