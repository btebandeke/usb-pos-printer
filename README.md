# PosPrinter

PosPrinter is a custom NodeJs project that supports printing of receipts via USB on POS printers. Single transaction and multiple item receipts are supported. This project was inspired by two npm packages; [node-thermal-printer](https://github.com/Klemen1337/node-thermal-printer) and [node-escpos](https://github.com/song940/node-escpos) and equally borrows a lot of their code to allow seamless print jobs from HTTP requests

## Installation

- Ensure you have NodeJs and NPM installed on the computer. You can visit the [official website](https://nodejs.org/en/) and follow the installation procedure.

- For Linux and Windows computers, extra drivers need to be installed to support the USB adapter.

1. On Ubuntu/Debian: `sudo apt-get install build-essential libudev-dev`
2. On windows install the [Zadig](https://zadig.akeo.ie) utility

- Clone the repository to a location on the computer
```
git clone https://github.com/btebandeke/usb-pos-printer.git
```
- Navigate to the folder where the project has been downloaded and install the dependencies
```
cd usb-pos-printer
npm install
```
- Start the server and if all goes well, the service should run on port `8081`

## Testing
For sample printing tests, connect the printer via USB and enter the following links in the browser for the different scenarios;

1. For single transaction printing; `http://localhost:8081/sample-print?printType=single`

2. For multiple items receipt printing; `http://localhost:8081/sample-print?printType=multiple`