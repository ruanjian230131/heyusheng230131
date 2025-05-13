//导入express模块
const express = require('express');

//创建Web服务器实例对象
const app = express();

//监听客户端请求方式为GET，请求地址为'/'的请求
app.get('/',(req,res) => {
    res.send('<h1>你好，Hello World!</h1>');
});

//监听客户端请求方式为POST，请求地址为'/'的请求
app.post('/',(req,res) => {
    res.send('<h1>你好，Hello World!</h1>');
});

//监听3000端口
app.listen(3000,() => {
    console.log('服务器已启动...');
});
//OVO
