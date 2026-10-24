const app = require('./app');
const { seed } = require('./db');

seed();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LaundryTrack API berjalan di http://localhost:${PORT}`));
