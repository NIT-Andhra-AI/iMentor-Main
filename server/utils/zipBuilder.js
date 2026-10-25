'use strict';

const zlib = require('zlib');

// Precomputed IEEE 802.3 CRC-32 lookup table
const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
    }
    return table;
})();

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function dosDateTime(date = new Date()) {
    const year = Math.max(1980, date.getUTCFullYear());
    const dosTime = ((date.getUTCHours() & 0x1F) << 11) |
                    ((date.getUTCMinutes() & 0x3F) << 5) |
                    ((date.getUTCSeconds() >> 1) & 0x1F);
    const dosDate = (((year - 1980) & 0x7F) << 9) |
                    (((date.getUTCMonth() + 1) & 0x0F) << 5) |
                    (date.getUTCDate() & 0x1F);
    return { dosTime, dosDate };
}

/**
 * Builds an in-memory standard PKZIP (.zip) archive from an array of { name, content } entries.
 * Compatible with Windows Expand-Archive / Explorer, Linux unzip, and macOS Archive Utility.
 */
function buildZipBuffer(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const { dosTime, dosDate } = dosDateTime();

    for (const entry of entries) {
        const nameBuf = Buffer.from(String(entry.name).replace(/^\/+/, ''), 'utf8');
        const rawBuf = Buffer.isBuffer(entry.content)
            ? entry.content
            : Buffer.from(String(entry.content ?? ''), 'utf8');
        const compressedBuf = zlib.deflateRawSync(rawBuf, { level: 6 });
        const sum = crc32(rawBuf);

        // Local file header (30 bytes + filename)
        const localHeader = Buffer.alloc(30);
        localHeader.writeUInt32LE(0x04034B50, 0); // PK\x03\x04
        localHeader.writeUInt16LE(20, 4);         // version needed (2.0)
        localHeader.writeUInt16LE(0x0800, 6);     // UTF-8 filename flag
        localHeader.writeUInt16LE(8, 8);          // method 8 = deflate
        localHeader.writeUInt16LE(dosTime, 10);
        localHeader.writeUInt16LE(dosDate, 12);
        localHeader.writeUInt32LE(sum, 14);
        localHeader.writeUInt32LE(compressedBuf.length, 18);
        localHeader.writeUInt32LE(rawBuf.length, 22);
        localHeader.writeUInt16LE(nameBuf.length, 26);
        localHeader.writeUInt16LE(0, 28);         // extra len

        localParts.push(localHeader, nameBuf, compressedBuf);

        // Central directory header (46 bytes + filename)
        const centralHeader = Buffer.alloc(46);
        centralHeader.writeUInt32LE(0x02014B50, 0); // PK\x01\x02
        centralHeader.writeUInt16LE(20, 4);         // version made by
        centralHeader.writeUInt16LE(20, 6);         // version needed
        centralHeader.writeUInt16LE(0x0800, 8);     // UTF-8 flag
        centralHeader.writeUInt16LE(8, 10);         // deflate
        centralHeader.writeUInt16LE(dosTime, 12);
        centralHeader.writeUInt16LE(dosDate, 14);
        centralHeader.writeUInt32LE(sum, 16);
        centralHeader.writeUInt32LE(compressedBuf.length, 20);
        centralHeader.writeUInt32LE(rawBuf.length, 24);
        centralHeader.writeUInt16LE(nameBuf.length, 28);
        centralHeader.writeUInt16LE(0, 30);         // extra len
        centralHeader.writeUInt16LE(0, 32);         // comment len
        centralHeader.writeUInt16LE(0, 34);         // disk number
        centralHeader.writeUInt16LE(0, 36);         // internal attrs
        centralHeader.writeUInt32LE(0, 38);         // external attrs
        centralHeader.writeUInt32LE(offset, 42);    // local header offset

        centralParts.push(centralHeader, nameBuf);
        offset += localHeader.length + nameBuf.length + compressedBuf.length;
    }

    const centralDirBuf = Buffer.concat(centralParts);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054B50, 0);              // PK\x05\x06
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralDirBuf.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralDirBuf, eocd]);
}

module.exports = { buildZipBuffer, crc32 };
