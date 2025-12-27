const express = require('express');
const bodyParser = require('body-parser'); // Убедитесь, что этот пакет установлен
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// илиeeeeeeeeeeeee
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('./settings/routes')(app);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});