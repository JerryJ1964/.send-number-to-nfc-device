"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NfcService = void 0;
const nfc_pcsc_1 = require("nfc-pcsc");
class NfcService {
    constructor() {
        this.reader = null;
        this.nfc = new nfc_pcsc_1.NFC();
        this.nfc.on('reader', (reader) => {
            console.log(`Reader detected: ${reader.name}`);
            this.reader = reader;
            reader.on('card', (card) => {
                console.log(`Card detected: ${card.standard}`);
            });
            reader.on('error', (err) => {
                console.error(`Reader error: ${err.message}`);
            });
        });
        this.nfc.on('error', (err) => {
            console.error(`NFC error: ${err.message}`);
        });
    }
    async writeData(data) {
        if (!this.reader) {
            throw new Error('No reader connected');
        }
        try {
            await this.reader.write(4, data); // Write data to block 4
            console.log('Data written successfully');
        }
        catch (err) {
            if (err instanceof Error) {
                console.error(`Error writing data: ${err.message}`);
            }
            else {
                console.error('Error writing data: Unknown error');
            }
        }
    }
}
exports.NfcService = NfcService;
