const express = require('express');
const cors = require("cors");
const app = express();

//test setver 
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

module.exports = app;