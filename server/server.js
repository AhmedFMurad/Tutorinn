const express = require('express');
const path = require('path');
app = express();

const www = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;

app.use(express.static(www));


app.listen(port, () => {
    console.log(`Server is up at ${port}`)
});