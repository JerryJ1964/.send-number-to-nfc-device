"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    writeData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.reader) {
                throw new Error('No reader connected');
            }
            try {
                yield this.reader.write(4, data); // Write data to block 4
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
        });
    }
}
exports.NfcService = NfcService;
