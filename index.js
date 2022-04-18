const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
// const https = require("https");
const { init: initDB, Counter } = require("./db");
// const fs = require('fs');
const request = require('request');
const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
  if (req.headers["x-wx-source"]) {
    res.send(req.headers["x-wx-openid"]);
  }
});

// 获取后台授权token
app.post("/api/token", async (req, res) => {

  console.info(req.query.get("appid"));
  console.info(req.query.get("secret"));

  /**
   * 文件缓存判断
   */

  let data = new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: 'http://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+req.query.get("appid")+'&secret='+req.query.get("secret"),
      /*
      body: JSON.stringify({
        openid: req.headers['x-wx-openid'], // 可以从请求的header中直接获取 req.headers['x-wx-openid']
        version: 2,
        scene: 2,
        content: '安全检测文本'
      })
      */
    },function (error, response) {
      console.log('接口返回内容', response.body)
      resolve(JSON.parse(response.body))
    })
  });

  // 返回调用
  res.send(data);

  // const { action } = req.body;
  // https.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+this.appid+'&secret='+this.appsecret, (resToken) => {
  //   console.info('statusCode:', resToken.statusCode);
  //   console.info('headers:', resToken.headers);
  //   resToken.on('data', (d) => {
  //       process.stdout.write(d);
  //       let data = JSON.parse(d);
  //       if (res.statusCode == 200 && data && data.expires_in && (!data.errcode || data.errcode == 0)) {
  //           console.log(data.access_token);
  //           // this.setToken(data.access_token);
  //         res.send(data);
  //       }
  //   });
  // }).on('error', (e) => {
  //     console.error(e);
  // })
  
});

// 测试文字检查
app.post("/api/msg_sec_check", async (req, res) => {
  let data = new Promise((resolve, reject) => {
    request({
      method: 'POST',
      // url: 'http://api.weixin.qq.com/wxa/msg_sec_check?access_token=TOKEN',
      url: 'http://api.weixin.qq.com/wxa/msg_sec_check', // 这里就是少了一个token
      body: JSON.stringify({
        openid: req.headers['x-wx-openid'], // 可以从请求的header中直接获取 req.headers['x-wx-openid']
        version: 2,
        scene: 2,
        content: '安全检测文本'
      })
    },function (error, response) {
      console.log('接口返回内容', response.body)
      resolve(JSON.parse(response.body))
    })
  });
  // 返回调用
  res.send(data);
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
