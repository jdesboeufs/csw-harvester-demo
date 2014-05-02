$(function() {
    var socket = io();
    var $records = $('tbody');
    var $progressBar = $('.progress-bar');
    var $returned = $('#returned');
    var $matched = $('#matched');
    var matched;
    var returned = 0;
    var started;

    function updateProgression() {
        var percent = Math.round(returned / matched * 100);
        $progressBar.css('width', percent + '%').text(percent + '%');
        $matched.text(matched);
        $returned.text(returned);
    }

    $('form').submit(function(e) {
        e.preventDefault();
        socket.emit('harvest', { url: $('#cswServiceUrl').val() });
    });

    socket.on('harvest:error', function(error) {
        if (!started) $('.alert-danger').removeClass('hidden');
    });

    socket.on('harvest:start', function(stats) {
        started = true;
        matched = stats.matched;
        $('button').prop('disabled', true);
        $('#progression').removeClass('hidden');
        $('#records').removeClass('hidden');
        updateProgression();
    });

    socket.on('harvest:end', function(stats) {
        console.log(stats);
    });

    socket.on('harvest:page', function(infos) {
        console.log(infos);
    });

    socket.on('harvest:record', function(record) {
        returned++;
        updateProgression();

        if (returned == 1000) {
            $('.alert.hidden').removeClass('hidden');
            return;
        }

        if (returned > 1000) return;

        var $tr = $(document.createElement('tr')).prependTo($records);
        $(document.createElement('td')).text(record.title).appendTo($tr);
        $(document.createElement('td')).text(record.type).appendTo($tr);
    });

});
