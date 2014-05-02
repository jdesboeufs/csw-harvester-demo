var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var csw = require('csw');
var validator = require('validator');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendfile(__dirname + '/public/index.html');
});

io.on('connection', function(socket) {
    var client, harvester;

    socket.on('harvest', function(service) {
        var validatorOptions = { protocols: ['http','https'], require_tld: true, require_protocol: true }
        if (harvester || !validator.isURL(service.url, validatorOptions)) return;

        client = csw(service.url, { maxSockets: 2 });
        harvester = client.harvest({ elementSetName: 'full' });

        harvester.on('error', function(err) {
            console.log(err);
            socket.emit('harvest:error', { message: 'An error has occurred!' });
        });

        harvester.on('start', function(stats) {
            socket.emit('harvest:start', stats);
        });

        harvester.on('page', function(infos) {
            socket.emit('harvest:page', infos);
        });

        harvester.on('end', function(err, stats) {
            if (err) {
                console.log(err);
                socket.emit('harvest:error', { message: 'An error has occurred!' });
            }

            socket.emit('harvest:end', stats);
        });

        harvester.on('record', function(record, stats) {
            var titleNode = record.get('.//dc:title', { dc: 'http://purl.org/dc/elements/1.1/' });
            var titleFound = titleNode ? titleNode.text() : null;

            var typeNode = record.get('.//dc:type', { dc: 'http://purl.org/dc/elements/1.1/' });
            var typeFound = typeNode ? typeNode.text() : null;

            socket.emit('harvest:record', {
                title: titleFound || 'No title found in the csw:Record',
                type: typeFound
            });
        });
    });

});

server.listen(process.env.PORT || 3000);
