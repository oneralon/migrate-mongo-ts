const fs = require("fs-extra");
const path = require("path");
const date = require("../utils/date");
const migrationsDir = require("../env/migrationsDir");

module.exports = async description => {
  if (!description) {
    throw new Error("Missing parameter: description");
  }
  await migrationsDir.shouldExist();
  const source = path.join(__dirname, "../../samples/migration.ts");
  const filename = `${date.nowAsString()}-${description
    .split(" ")
    .join("_")}.ts`;
  const destination = path.join(await migrationsDir.resolve(), filename);
  await fs.copy(source, destination);
  return filename;
};
