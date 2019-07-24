// http://127.0.0.1:9001
// http://localhost:9001

var server = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
    //http://url/path/1.html과 같이 url을 받아오는것


function serverHandler(request, response) {
    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);
        //위의 url에서 받은 path명을 이용해서 파일 load

    fs.exists(filename, function(exists) {
        if (!exists) {//파일이 존재하지 않는다면 404 error
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + filename + '\n');
            response.end();
            return;
        }
                //favicon.ico 라는 icon 불러오기
        if (filename.indexOf('favicon.ico') !== -1) {
            return;
        }
//js가 돌아가는 OS가 window인지 체크해서 isWin 변수에 저장
        var isWin = !!process.platform.match(/^win/);
//해당경로가 폴더 이면서 window 환경이면 index.html을 path에 붙여준다.
        if (fs.statSync(filename).isDirectory() && !isWin) {
            filename += '/index.html';
            //다른 OS라면 다른 방식으로 path를 수정한다.
        } else if (fs.statSync(filename).isDirectory() && !!isWin) {
            filename += '\\index.html';
        }
//해당 file을 읽어들인다.
        fs.readFile(filename, 'binary', function(err, file) {
            if (err) {// error handling
                response.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                response.write(err + '\n');
                response.end();
                return;
            }

            var contentType;
                //요청한 파일이 html형식
            if (filename.indexOf('.html') !== -1) {
                contentType = 'text/html';
            }
                //요청한 파일이 js형식
            if (filename.indexOf('.js') !== -1) {
                contentType = 'application/javascript';
            }
                //요청한파일이 다른 형식
            if (contentType) {
                response.writeHead(200, {
                    'Content-Type': contentType
                });
            } else response.writeHead(200);
                //해당 파일이 binary로 써준다.
            response.write(file, 'binary');
            response.end();
        });
    });
}

var config = {
  "socketURL": "/",
  "dirPath": "",
  "homePage": "/",
  "socketMessageEvent": "RTCMultiConnection-Message",
  "socketCustomEvent": "RTCMultiConnection-Custom-Message",
  "port": 9001,
  "enableLogs": false,
  "isUseHTTPs": false,
  "enableAdmin": false
};
//rtcmulticonnectionserver에 해당 id를 요청하고 변수에 저장한다.
var RTCMultiConnectionServer = require('rtcmulticonnection-server');
var ioServer = require('socket.io');
//socket.io에 요청을하고 id를 받아서 변수에 저장한다.

//server 만들기
var app = server.createServer(serverHandler);
RTCMultiConnectionServer.beforeHttpListen(app, config);
app = app.listen(process.env.PORT || 9001, process.env.IP || "192.168.43.98", function() {
    RTCMultiConnectionServer.afterHttpListen(app, config);
});

// --------------------------
// socket.io codes goes below
//socket.io code들 시작

ioServer(app).on('connection', function(socket) {
    RTCMultiConnectionServer.addSocket(socket, config);
    //socket 추가!

    // ----------------------
    // below code is optional

    const params = socket.handshake.query;

    if (!params.socketCustomEvent) {
        params.socketCustomEvent = 'custom-message';
    }

    socket.on(params.socketCustomEvent, function(message) {
        socket.broadcast.emit(params.socketCustomEvent, message);
    });
});
