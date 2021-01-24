const http = require("http");
const { parse } = require("querystring");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const requestListener = function (req, res) {
  const uri =
    "mongodb+srv://admin:f83LRZNRZLlTc0QB@cluster0.230et.mongodb.net/shoppingapp?retryWrites=true&w=majority";
  const dbName = "shoppingapp";
  let body = "",
    data = {};

  switch (req.method) {
    case "POST": {
      console.log(1234);

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        data = JSON.parse(body);

        switch (data.action) {
          case "sign_in": {
            let password_hash = data.data.password_hash,
              login = data.data.login;

            const client = new MongoClient(uri, { useNewUrlParser: true });

            client.connect((err) => {
              const collection = client
                .db("shoppingapp")
                .collection("users_client_app");

              const options = {};

              collection
                .findOne({ login: login }, { password_hash: password_hash })
                .then((response) => {
                  res.writeHead(200);
                  res.write(JSON.stringify(response));
                  res.end();
                  client.close();
                });
            });

            break;
          }

          case "sign_up": {
            let password_hash = data.data.password_hash,
              login = data.data.login;

            const client = new MongoClient(uri, { useNewUrlParser: true });

            client.connect((err) => {
              const collection = client
                .db("shoppingapp")
                .collection("users_client_app");

              const options = {};

              collection.findOne({ login: login }).then((response) => {
                // console.log(response);
                if (response == null) {
                  let date = new Date(),
                    curTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`,
                    curDate = `${date.getDate()}:${date.getMonth()}:${date.getFullYear()}`,
                    ipAddrArray = [];

                  ipAddrArray.push(data.data.ip_address);

                  const doc = {
                    login: data.data.login,
                    password_hash: data.data.password_hash,
                    first_name: "",
                    last_name: "",
                    email: data.data.login,
                    phone_number: "",
                    register_info: {
                      time: curTime,
                      date: curDate,
                    },
                    order_id: [],
                    ip_address: ipAddrArray,
                    type_addres_by_default: "",
                    ids_to_door_addreses: [],
                    ids_to_door_addreses: "",
                    id_postmate_addres_by_default: "",
                  };

                  collection.insertOne(doc).then((response) => {
                    res.writeHead(200);
                    res.write(
                      JSON.stringify({
                        status: true,
                        ...doc,
                      })
                    );
                    res.end();
                    client.close();
                  });
                } else {
                  res.writeHead(200);
                  res.write(
                    JSON.stringify({
                      status: false,
                    })
                  );
                  res.end();
                  client.close();
                }
              });
            });

            break;
          }

          case "get_shops": {
            const client = new MongoClient(uri, { useNewUrlParser: true });

            client.connect((err) => {
              const collection = client.db("shoppingapp").collection("shops");

              collection
                .find({})
                .limit(10)
                .toArray((err, items) => {

                  let data = {
                    shops: items,
                  };

                  res.writeHead(200);
                  res.write(JSON.stringify(data), 'utf8', (e) => {
                    console.log("finish")
                    res.end();
                    client.close();
                  });                  

                  return;
                });              
            });
          }
          case "get_shop_info": {
            const client = new MongoClient(uri, { useNewUrlParser: true });

            client.connect((err) => {
              const collection = client.db("shoppingapp").collection("shops");

              let url = "";

              if (data == undefined || data == null) return;

              if (data.data == undefined || data.data == null) return;

              if (data.data.url == undefined || data.data.url.length < 3)
                return;

              url = data.data.url;

              if (url.indexOf("https://") != -1) {
                url = url.replace("https://", "");
              }

              if (url.indexOf("http://") != -1) {
                url = url.replace("http://", "");
              }

              if (url.indexOf("?") != -1) {
                url = url.substr(0, url.indexOf("?") - 1);
              }

              if (url.indexOf("m.") != -1) {
                url = url.replace("m.", "");
              }

              if (url.indexOf("www.") != -1) {
                url = url.replace("www.", "");
              }

              if (url.indexOf("/") != -1) {
                url = url.substr(0, url.indexOf("/"));
              }

              console.log(`url: ${url}`);

              collection.findOne({ domain: url }).then((response) => {
                console.log(response);
                res.writeHead(200);
                res.write(JSON.stringify(response));
                res.end();
                client.close();
              });
            });

            break;
          }
        }
      });

      break;
    }
    case "GET": {
      break;
    }
    default: {
    }
  }
};

const server = http.createServer(requestListener);
server.listen(8080);
