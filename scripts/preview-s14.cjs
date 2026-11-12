// Vista local del build con proxy al backend; no expone credenciales ni modifica archivos.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../dist/pharma-frontend/browser');
const api=new URL(process.env.API_URL||'http://localhost:8090');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 if(req.url.startsWith('/api/')||req.url.startsWith('/actuator/')){
  const proxy=http.request({hostname:api.hostname,port:api.port,path:req.url,method:req.method,headers:{...req.headers,host:api.host}},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res);});
  proxy.on('error',()=>{res.writeHead(502);res.end('Backend no disponible');});req.pipe(proxy);return;
 }
 let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){file=path.join(root,'index.html');}
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'index.html');
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT||8081),'127.0.0.1',()=>console.log('Semana 14: http://localhost:'+(process.env.PORT||8081)));
