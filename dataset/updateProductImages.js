/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Product Image URL Updater
 *
 * Updates product image URLs in MongoDB by matching exact product names
 * from a CSV file. Only updates products with matching names; leaves
 * others unchanged.
 *
 * Usage:
 *   node updateProductImages.js [path/to/final.csv]
 * Defaults to ./final.csv
 *
 * Expected CSV headers:
 *   name, mainCategory, subCategory, image, link, ratings,
 *   noOfRatings, discountPrice, actualPrice, category
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { parse } = require('csv-parse');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/amazon-instant-engine';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'amazon-instant-engine';

const csvPath = process.argv[2] || path.join(__dirname, 'final.csv');

// Mongoose model matching the backend Product schema
const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    mainCategory: { type: String, default: '' },
    subCategory: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    image: { type: String, default: '' },
    link: { type: String, default: '' },
    ratings: { type: Number, default: 0 },
    noOfRatings: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    actualPrice: { type: Number, default: 0, min: 0 },
    availability: { type: String, enum: ['in-stock', 'out-of-stock'], default: 'in-stock' },
  },
  { timestamps: true, versionKey: false },
);

const ProductModel = mongoose.model('Product', ProductSchema);

/**
 * Reads CSV file and returns parsed rows
 */
async function readRows(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .on('error', reject)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          relax_quotes: true,
          relax_column_count: true,
          trim: true,
          bom: true,
        }),
      )
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

/**
 * Creates a map of product name -> image URL from CSV
 */
function createImageMap(rows) {
  const imageMap = new Map();
  
  for (const row of rows) {
    const name = row.name || row.Name;
    const image = row.image || row.Image;
    
    if (name && image) {
      // Store with both exact case and lowercase for matching
      imageMap.set(name.trim(), image.trim());
    }
  }
  
  return imageMap;
}

async function main() {
  console.log('=== Product Image URL Updater ===\n');

  // Check if CSV file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    console.error('Usage: node updateProductImages.js [path/to/final.csv]');
    process.exit(1);
  }

  console.log(`📄 Reading CSV: ${csvPath}`);
  const rawRows = await readRows(csvPath);
  console.log(`✓ Parsed ${rawRows.length} rows from CSV.\n`);

  // Create image map from CSV
  const imageMap = createImageMap(rawRows);
  console.log(`✓ Created image map with ${imageMap.size} unique products.\n`);

  // Connect to MongoDB
  console.log(`🔌 Connecting to MongoDB (${MONGODB_DB_NAME})...`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log(`✓ Connected to MongoDB.\n`);

  // Fetch all products from database
  console.log('📊 Fetching products from database...');
  const allProducts = await ProductModel.find({}).select('_id name image').lean();
  console.log(`✓ Found ${allProducts.length} products in database.\n`);

  // Match and update products
  console.log('🔄 Matching and updating product images...\n');
  
  let matchedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let notFoundCount = 0;

  const updates = [];

  for (const product of allProducts) {
    const dbName = product.name.trim();
    
    // Try exact match first
    let newImageUrl = imageMap.get(dbName);
    
    // If no exact match, try case-insensitive match
    if (!newImageUrl) {
      const lowerDbName = dbName.toLowerCase();
      for (const [csvName, csvImage] of imageMap.entries()) {
        if (csvName.toLowerCase() === lowerDbName) {
          newImageUrl = csvImage;
          break;
        }
      }
    }

    if (newImageUrl) {
      matchedCount++;
      
      // Check if image URL is different
      if (product.image !== newImageUrl) {
        updates.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $set: { image: newImageUrl } }
          }
        });
        updatedCount++;
        console.log(`  ✓ Will update: "${dbName}"`);
        console.log(`    Old: ${product.image.substring(0, 80)}${product.image.length > 80 ? '...' : ''}`);
        console.log(`    New: ${newImageUrl.substring(0, 80)}${newImageUrl.length > 80 ? '...' : ''}`);
      } else {
        unchangedCount++;
      }
    } else {
      notFoundCount++;
      // console.log(`  ⚠ Not found in CSV: "${dbName}" (keeping existing image)`);
    }
  }

  console.log(`\n📈 Summary:`);
  console.log(`  • Total products in DB: ${allProducts.length}`);
  console.log(`  • Matched in CSV: ${matchedCount}`);
  console.log(`  • Will be updated: ${updatedCount}`);
  console.log(`  • Already up-to-date: ${unchangedCount}`);
  console.log(`  • Not found in CSV (keeping existing): ${notFoundCount}\n`);

  if (updates.length > 0) {
    console.log(`💾 Updating ${updates.length} products in database...`);
    const result = await ProductModel.bulkWrite(updates);
    console.log(`✓ Updated ${result.modifiedCount} products successfully.\n`);
  } else {
    console.log(`✓ No updates needed. All matched products already have correct images.\n`);
  }

  await mongoose.disconnect();
  console.log('✓ Disconnected from MongoDB.');
  console.log('\n=== Update Complete ===');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Update failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
