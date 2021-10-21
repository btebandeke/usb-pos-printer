const customErrors = require('../utils/errors');
const ThermalPrinter = require('../utils/printer-core').printer;
const Types = require('../utils/printer-core').types;

const escpos = require('escpos');

const express = require('express');
const router = express.Router();

router.get('/print-to-pos', function(req, res, next) {

    escpos.USB = require('escpos-usb');
    const device  = new escpos.USB();

    const posPrinter = new escpos.Printer(device);

    const products = [
        {qty: 2, name: 'BELL LARGER (CRATE)', price: 67000, total: 134000},
        {qty: 6, name: 'BOND 7 750ml', price: 87000, total: 522000},
        {qty: 5, name: 'NILE SPECIAL (CRATE)', price: 58000, total: 290000},
        {qty: 5, name: 'JACK DANIELS (CARTON)', price: 510000, total: 2550000}
    ];
    let summation = 0;

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

    printer.setTypeFontB();
    printer.setTextNormal();
    printer.alignCenter();
    printer.bold(true);
    printer.println("PRAISE DISTRIBUTORS LIMITED");
    printer.println("8KM from the City Centre - Zana");
    printer.println("Tel: 0704308489/0782308489");
    printer.println("TIN: 1002397931");
    printer.newLine();
    printer.alignLeft();
    printer.bold(false);
    printer.println("Customer: BERNARD FRED TEBANDEKE");
    printer.println("Receipt No: 202110182173812");
    printer.println("DateTime: 18-10-2021 05:10 PM");
    printer.newLine();

    printer.tableCustom([
        { text:"Qty", align:"LEFT", cols:5, bold:true },
        { text:"Item", align:"LEFT", cols:22, bold:true },
        { text:"Unit Price", align:"RIGHT", cols:10, bold:true },
        { text:"Amount", align:"RIGHT", cols:11, bold:true }
    ]);

    products.forEach((product) => {
        summation += product.total;
        printer.tableCustom(
            [
                { text: product.qty, align:"LEFT", cols:5 },
                { text: product.name, align:"LEFT", cols:22 },
                { text: formatCurrency(product.price), align:"RIGHT", cols:10 },
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

    printer.println("Served By: HERBERT DAVIS MUWAYIRE");
    printer.alignCenter();
    printer.bold(true);
    printer.println("Thank you for your business!");

    printer.cut();

    device.open(function () {
        posPrinter.raw(printer.getBuffer()).close();
    });

    //console.log(printer.getPrintBuffer());

    res.status(200).json({});
});

router.post('/print-to-pos', function(req, res, next) {

    escpos.USB = require('escpos-usb');
    const device  = new escpos.USB();

    const posPrinter = new escpos.Printer(device);
    const printData = req.body;
    let transactionDetails = null;
    let saleItems = null;
    if (printData.hasOwnProperty('transaction_details') && printData["transaction_details"].length > 0) {
        transactionDetails = printData["transaction_details"][0];
    }

    if (printData.hasOwnProperty('sale_items') && printData["sale_items"].length > 0) {
        saleItems = printData["sale_items"];
    }

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

    if (transactionDetails && saleItems) {
        const amountPaid = Number(transactionDetails["amount_paid"] || transactionDetails["amount_inclusive"]);
        const totalSum = Number(transactionDetails["amount_inclusive"]);
        const change = totalSum - amountPaid;

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
        printer.println("Receipt No: " + transactionDetails["reference"]);
        printer.println("DateTime: " + transactionDetails["trans_date"]);
        printer.newLine();

        printer.tableCustom([
            { text:"Qty", align:"LEFT", cols:5, bold:true },
            { text:"Item", align:"LEFT", cols:22, bold:true },
            { text:"Unit Price", align:"RIGHT", cols:10, bold:true },
            { text:"Amount", align:"RIGHT", cols:11, bold:true }
        ]);

        saleItems.forEach((product) => {
            printer.tableCustom(
                [
                    { text: product["quantity"], align:"LEFT", cols:5 },
                    { text: product["item_name"], align:"LEFT", cols:22 },
                    { text: formatCurrency(product["unit_price"]), align:"RIGHT", cols:10 },
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

        // printer.tableCustom([
        //     { text:"CASH", align:"RIGHT", cols:18, bold:true },
        //     { text: formatCurrency(amountPaid), align:"RIGHT", cols:30, bold:true }
        // ]);
        // printer.tableCustom([
        //     { text:"CHANGE", align:"RIGHT", cols:18, bold:true },
        //     { text: formatCurrency(change), align:"RIGHT", cols:30, bold:true }
        // ]);
        // printer.newLine();

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