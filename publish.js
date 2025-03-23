const fs = require('fs');
const archiver = require('archiver');
const path = require('path');
const steamID = "76561197985360378"

// Function to zip files
function zipFiles(files, outputZipPath) {
    // Create a file to stream archive data to.
    const output = fs.createWriteStream(outputZipPath);
    const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level.
    });

    // Listen for all archive data to be written
    output.on('close', function() {
        console.log(`Archive created successfully! Total bytes: ${archive.pointer()}`);
    });

    // Catch any warnings (e.g., stat failures) and errors
    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            console.warn('Warning:', err.message);
        } else {
            throw err;
        }
    });

    archive.on('error', function(err) {
        throw err;
    });

    // Pipe the archive data to the file
    archive.pipe(output);

    // Append files
    files.forEach(file => {
        const filePath = path.resolve(file);
        archive.file(filePath, { name: path.basename(file) });
    });

    // Finalize the archive (this is the point where the archiving actually starts)
    archive.finalize();
}

// Example usage
const filesToZip = [
    'content/info.txt',   // Specify the path to your files
    'content/main.js'
];

const outputZipFile = `E:\\SteamWorkshopUploader\\WorkshopContent\\CookieAssistant2\\CookieAssistant20_${steamID}.zip`; // The name of the output zip file

zipFiles(filesToZip, outputZipFile);
require('child_process').exec(`explorer.exe /select,"${outputZipFile.replace(/\//g, '\\')}"`);