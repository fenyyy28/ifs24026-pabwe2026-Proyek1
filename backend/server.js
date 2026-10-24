const app = require('./app');
const { seed } = require('./db');

function start(port = process.env.PORT || 3000) {
  seed();
  return app.listen(port, () => console.log(`LaundryTrack API berjalan di http://localhost:${port}`));
}

if (require.main === module) start();

module.exports = { start };
