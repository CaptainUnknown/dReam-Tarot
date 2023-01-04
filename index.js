import fs from 'fs';
import colors from 'colors/safe.js';
import { create } from 'ipfs-http-client';
import createCsvParser from 'csv-parser';

let rows = [];
const formattedRows = [];

// Define a function to parse the CSV file and store the rows in an array
const parseCsv = () => {
  // Create a readable stream from the CSV file
  const fileStream = fs.createReadStream('data.csv');
  console.log(colors.cyan('CSV file read'));

  const csvParser = createCsvParser();
  console.log(colors.cyan('CSV parser created'));

  fileStream.pipe(csvParser);
  console.log(colors.yellow('Parsing the CSV File...'));

  // Listens for data events to get the rows
  csvParser.on('data', (row) => {
    rows.push(row);
  });

  // Listens for end event to know when the parsing is done
  csvParser.on('end', () => {
    console.log(colors.green('Parsing completed!'));
  });
};

parseCsv();

//format meta to standard schema
const formatMeta = () => {
  console.log(colors.yellow('Formatting metadata...'));

  rows.forEach(row => {
    const formattedRow = {
      name: row.name,
      description: row.description,
      attributes: [
        {
          name: "Alchemical Power",
          value: row.AlchemicalPower
        },
        {
          name: "Rarity",
          value: row.Rarity
        },
        {
          name: "Arcanum",
          value: row.Arcanum
        },
        {
          name: "Number",
          value: row.Number
        },
        {
          name: "Suit",
          value: row.Suit
        }
      ]
    }
    formattedRows.push(formattedRow);
  });

  console.log(colors.green('Formatting completed!'));
  console.log(colors.bgBlue(colors.grey('Sample Meta: ')));
  console.log(colors.grey(JSON.stringify(formattedRows[0])));
  console.log(colors.bgBlue(colors.grey('Total Metas Found: ' + formattedRows.length)));

  setTimeout(() => {
    main();
  }, 5000);
}

setTimeout(() => {
  formatMeta();
}, 3000);

async function main() {
  const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
  console.log(colors.brightGreen('Connected to IPFS'));
  
  const metadataArray = { name: "test" }//formattedRows;
  const metadataCIDs = [];

  console.log(colors.yellow('Starting IPFS upload...'));
  for (let i = 0; i < metadataArray.length; i++) {
    const metadata = metadataArray[i];

    // Read the image from the "images" directory and name it "image${i}.jpg"
    const imageBuffer = fs.readFileSync(`images/image${i}.jpg`);
    console.log(colors.grey(`Image ${i} read`));

    // Add the image to IPFS and update the metadata object with the CID
    const imageCID = await ipfs.add(imageBuffer);
    console.log(colors.grey(`Image ${i} added to IPFS`));
    metadata.imageCID = imageCID[0].content;

    // Add the metadata object to IPFS
    const metadataBuffer = Buffer.from(JSON.stringify(metadata));
    const metaCID = await ipfs.add(metadataBuffer);
    console.log(colors.green(`Metadata ${i} added to IPFS`));
    const metadataCID = metaCID[0].content;
    console.log(colors.white(metadataCID));
    metadataCIDs.push(metadataCID);

    // Write the metadata object to a file in the "metadata" directory
    fs.writeFileSync(`metadata/metadata${i}.json`, JSON.stringify(metadata));
    console.log(colors.brightGreen(`Final Metadata ${i} written to local disk`));
  }

  fs.writeFileSync(`meta/metadataCIDs.json`, JSON.stringify(metadataCIDs));
  console.log(colors.green(`Metadata CID Count: ${metadataCIDs.length}`));
  console.log(colors.white('Stored Metadata in "metadataCIDs.json"'));
}