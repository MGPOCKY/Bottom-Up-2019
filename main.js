var http = require("http");
var fs = require("fs");
var url = require("url");
var qs = require("querystring");
var path = require('path');
var mysql = require('mysql');
var cookieParser = require('cookie-parser');
var template = require('./lib/template.js');
var isLogin = false;
var loginid = '';
var dbname = 'topic';

var db = mysql.createConnection({
  host: 'localhost',
  user: 'nodejs',
  password: '111111',
  database: 'bottomup'
});
db.connect();


var app = http.createServer(function(request, response) {

  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === '/') {
    if (queryData.id === undefined) {
      dbname = 'topic';
      db.query(`SELECT * FROM ${dbname} left join author on ${dbname}.author_id = author.authid ORDER BY ${dbname}.id ASC`, function(error, topics) {
        var id = 'index';
        var list = template.lists(topics);
        var content = template.content(topics);
        var loginCheck = template.loginCheck(isLogin);
        var html = template.HTML(id, list, content, loginCheck);
        response.writeHead(200);
        response.end(html);

      });
    }
  } else if (pathname === '/create_id') {
    var html = template.HTML('create_id',
      `<form action="/create_process" method="post">
                  <p>이름: <input type="text" name="name" placeholder="이름을 입력하세요"></p>
                  <p>아이디: <input type="text" name="id" placeholder="아이디를 입력하세요"></p>
                  <p>비밀번호: <input type="password" name="pw"></p>
                  <p>비밀번호 확인: <input type="password" name="pwch"></p>
                  <p>
                    내 소개: <textarea name="profile" placeholder="내 소개"></textarea>
                  </p>
                  <p>
                    <input type="submit" value="회원가입">
                  </p>
                </form>`);
    response.writeHead(200);
    response.end(html);
  } else if (pathname === '/create_process') {
    var body = '';
    request.on('data', function(data) {
      body = body + data;
    });
    request.on('end', function() {
      var post = qs.parse(body);
      if (post.pw == post.pwch) {
        db.query(`
          INSERT INTO author (name, login_id, login_pw, profile)
          VALUES(?,?,?,?)`,
          [post.name, post.id, post.pw, post.profile],
          function(error, result) {
            if (error) {
              throw error;
            }
            response.writeHead(302, {
              Location: `/`
            });
            response.end();
          });
      } else {
        response.writeHead(302, {
          Location: `/`
        });
        response.end();
      }
    });
  } else if (pathname === '/update_board') {
    if (isLogin == true) {
      db.query(`SELECT * FROM ${dbname}`, function(error, topics) {
        if (error) {
          console.log(error);
        }
        db.query(`SELECT * FROM ${dbname} WHERE id=?`, [queryData.id],
          function(error2, topic) {
            if (error2) {
              console.log(error2);
            }
		var check = template.loginCheck(isLogin);
            var html = template.HTML(topic[0].title,
              `
                  <form action="/update_process" method="post">
                    <input type="hidden" name="id" value="${topic[0].id}">
                    <input type="hidden" name="author" value="${loginid}"
                    <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
                    <p>
                    <textarea name="description" rows="20" cols="130">${topic[0].description}</textarea>
                    </p>
                    <p>
                      <input type="submit" value="수정하기">
                    </p>
                  </form>
                  `,
              `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`, check
            );
            response.writeHead(200);
            response.end(html);
          });
      });
    } else {
      console.log("로그인 후에 이용해 주세요");
      if (dbname == 'topic') {
        response.writeHead(302, {
          Location: `/`
        });
      } else if (dbname == 'Convergence') {
        response.writeHead(302, {
          Location: `/computerConvergence`
        });
      } else if (dbname == 'Engineering') {
        response.writeHead(302, {
          Location: `/computerEngineering`
        });
      }
      response.end();
    }

  } else if (pathname === '/update_process') {
    var body = '';
    request.on('data', function(data) {
      body = body + data;
    });
    request.on('end', function() {
      var post = qs.parse(body);
      db.query(`UPDATE ${dbname} SET title=?, description=?, author_id=?, created=NOW() WHERE id=?`, [post.title, post.description, post.author, post.id], function(error, result) {
        if (dbname == 'topic') {
          response.writeHead(302, {
            Location: `/`
          });
        } else if (dbname == 'Convergence') {
          response.writeHead(302, {
            Location: `/computerConvergence`
          });
        } else if (dbname == 'Engineering') {
          response.writeHead(302, {
            Location: `/computerEngineering`
          });
        }
        response.end();
      });
    });
  } else if (pathname === '/computerConvergence') {
    dbname = 'Convergence';
    db.query(`SELECT * FROM ${dbname} left join author on ${dbname}.author_id = author.authid ORDER BY ${dbname}.id ASC`, function(error, topics) {
      var id = 'computerConvergence';
      var list = template.lists(topics);
      var content = template.content(topics);
      var loginCheck = template.loginCheck(isLogin);
      var html = template.HTML(id, list, content, loginCheck);
      response.writeHead(200);
      response.end(html);

    });
  } else if (pathname === '/computerEngineering') {
    dbname = 'Engineering';
    db.query(`SELECT * FROM ${dbname} left join author on ${dbname}.author_id = author.authid ORDER BY ${dbname}.id ASC`, function(error, topics) {
      var id = 'computerEngineering';
      var list = template.lists(topics);
      var content = template.content(topics);
      var loginCheck = template.loginCheck(isLogin);
      var html = template.HTML(id, list, content, loginCheck);
      response.writeHead(200);
      response.end(html);

    });
  } else if (pathname === '/login') {
    var html = template.HTML('login', `<form action="/login_process" method="post">
                <p>ID: <input type="text" name="id" placeholder="아이디를 입력하세요"></p>
                <p>PW: <input type="password" name="pw"></p>
                <p>
                  <input type="submit">
                </p>
              </form>`);
    response.writeHead(200);
    response.end(html);
  } else if (pathname === '/login_process') {
    var body = '';
    request.on('data', function(data) {
      body = body + data;
    });
    request.on('end', function() {
      var post = qs.parse(body);
      db.query(`
        SELECT EXISTS (SELECT * FROM author WHERE login_id=? and login_pw=?) as success`,
        [post.id, post.pw],
        function(error, result) {
          if (error) {
            throw error;
          }
          if (result[0].success == '1') {
            isLogin = true;
            db.query(`
              SELECT * FROM author WHERE login_id=? and login_pw=?`,
              [post.id, post.pw],
              function(err, author) {
                loginid = author[0].authid;
              });
            console.log("login Success");
            response.writeHead(302, {
              Location: `/`
            });
            response.end(`<script>alert('
              환영합니다.
              ');</script>`);
          } else {
            console.log("login failed");
            response.writeHead(302, {
              Location: `/`
            });
            response.end(`<script>alert('
              로그인 실패.
              ');</script>`);
          }

        }
      );
    });
  } else if (pathname === '/logout') {
    isLogin = false;
    response.writeHead(302, {
      Location: '/'
    });
    response.end();
  } else if (pathname === '/assets/css/master.css') {
    var css = template.css();
    response.writeHead(200);
    response.end(css);
    // } else if (pathname === '/se2/js/service/HuskyEZCreator.js') {
    //   var js = template.js();
    //   response.writeHead(200);
    //   response.end(js);
    // } else if (pathname === '/se2/SmartEditor2Skin.html') {
    //   var skin = template.skin();
    //   response.writeHead(200);
    //   response.end(skin);
    // } else if (pathname === '/se2/css/ko_KR/smart_editor2.css') {
    //   var editorcss = template.editorcss();
    //   response.writeHead(200);
    //   response.end(editorcss);
  } else {
    response.writeHead(404);
    response.end('Not Found');

  }
});
app.listen(3000);
