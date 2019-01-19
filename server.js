const express = require('express');
const fs = require('fs');
const app = express();
const port = 8080;

app.all('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

// Set 'public' folder as root
app.use(express.static('public'));
// Provide access to node_modules folder from the client-side
app.use('/scripts', express.static(`${__dirname}/node_modules/`));
// Redirect all traffic to index.html
app.use((req, res) => res.sendFile(`${__dirname}/public/index.html`));
app.post('/num',function(req,res){
    console.log(req);
    return res.end('done');
})
app.listen(port, () => {
    console.log('listening on ' + port);
});