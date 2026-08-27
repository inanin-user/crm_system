// scripts/run-schema.js
//
// Executes sql/schema.sql against the database defined in .env.local (or .env).
// Usage: node scripts/run-schema.js
//        node scripts/run-schema.js --file sql/migrations/003_create_staff.sql

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

// Load .env.local first (falls back to .env if not present)
require("dotenv").config({
  path: fs.existsSync(path.resolve(__dirname, "../.env.local"))
    ? path.resolve(__dirname, "../.env.local")
    : path.resolve(__dirname, "../.env"),
});

async function main() {
  // Allow overriding the target file via --file, default to sql/schema.sql
  const fileArgIndex = process.argv.indexOf("--file");
  const relativeFilePath =
    fileArgIndex !== -1 && process.argv[fileArgIndex + 1]
      ? process.argv[fileArgIndex + 1]
      : "sql/schema.sql";

  const filePath = path.resolve(__dirname, "..", relativeFilePath);

  if (!fs.existsSync(filePath)) {
    console.error(`SQL file not found: ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, "utf8");

  // Split into individual statements on semicolons.
  // Strips comments and blank lines; naive split, fine for schema files
  // without semicolons inside string literals/triggers.
  const statements = sql
    .split(/;\s*(?:\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  if (statements.length === 0) {
    console.log("No statements found in file, nothing to run.");
    return;
  }

  const requiredEnvVars = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`Connecting to ${process.env.MYSQL_HOST}/${process.env.MYSQL_DATABASE} ...`);

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: false, // executing one at a time on purpose, see below
  });

  console.log(`Running ${statements.length} statement(s) from ${relativeFilePath} ...\n`);

  try {
    for (const [index, statement] of statements.entries()) {
      const preview = statement.replace(/\s+/g, " ").slice(0, 80);
      process.stdout.write(`[${index + 1}/${statements.length}] ${preview}...`);
      try {
        await connection.query(statement);
        console.log(" OK");
      } catch (err) {
        console.log(" FAILED");
        console.error(`  → ${err.code || ""} ${err.sqlMessage || err.message}`);
        throw err; // stop on first failure — don't run subsequent statements blindly
      }
    }
    console.log("\nAll statements executed successfully.");
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("\nSchema execution aborted.");
  process.exit(1);
});