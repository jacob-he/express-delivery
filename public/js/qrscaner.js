/*global $, qrcode*/

$(function () {

    'use strict';

    var n = navigator,
        is_webkit = false,
        is_moz = false;

    function onSuccess(localMediaStream) {
        var video = document.querySelector('video'),
            canvas = document.querySelector('canvas'),
            ctx = canvas.getContext('2d'),
            source;

        function snapshot() {
            if (localMediaStream) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                $('#qr-text').text(qrcode.decode());
            }
        }

        video.addEventListener('click', snapshot, false);

        if (is_webkit) {
            source = window.webkitURL.createObjectURL(localMediaStream);
        } else {
            source = localMediaStream;
        }

        video.src = source;

    }

    function onFailSoHard() {
        //console.log('Reeeejected!', e);
    }

    if (n.getUserMedia) {
        // Not showing vendor prefixes.
        n.getUserMedia({ video: true }, onSuccess, onFailSoHard);
    } else if (n.webkitGetUserMedia) {
        is_webkit = true;
        n.webkitGetUserMedia({ video: true }, onSuccess, onFailSoHard);
    } else if (n.mozGetUserMedia) {
        is_moz = true;
        n.mozGetUserMedia({ video: true }, onSuccess, onFailSoHard);
    } else if (n.msGetUserMedia) {
        n.msGetUserMedia({ video: true }, onSuccess, onFailSoHard);
    } else {
        alert('getUserMedia is not support in your browser!');
    }
});
