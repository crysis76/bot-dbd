const fs = require('fs');
const path = require('path');

function loadAll(folderPath) {
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const data = require(path.join(folderPath, file));
    return {
      id: data.id,
      name: data.name,
      data
    };
  });
}

function loadOne(folderPath, id) {
  const file = path.join(folderPath, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = { loadAll, loadOne };
