const http = require("http");
const { parse } = require("querystring");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
var ObjectId = require("mongodb").ObjectID;

const RESULT_CREATE_ORDER = {
  SUCCESS: 0x1,
  ERROR: 0x0,
};

const RESULT_CHANGE_STATE_ORDER = {
  SUCCESS: 0x1,
  ERROR: 0x0,
}

const STATE_ORDER = {
  IN_PROCCESSING: 0x0,
};

const requestListener = function (req, res) {
  const uri =
    "mongodb+srv://admin:f83LRZNRZLlTc0QB@cluster0.230et.mongodb.net/shoppingapp?retryWrites=true&w=majority";
  const dbName = "shoppingapp";
  let body = "",
    data = {};

  switch (req.method) {
    case "POST": {
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        data = JSON.parse(body);

        // console.log(data);

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
                .findOne({
                  $and: [{ login: login }, { password_hash: password_hash }],
                })
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
                  res.write(JSON.stringify(data), "utf8", (e) => {
                    console.log("finish");
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

          case "add_item": {
            let items = data.data.items_obj.items,
              items_id_arr = [],
              itemsProccess = 0;

            for (let i = 0; i < items.length; i++) {
              let doc = {
                title: items[i].title,
                desc: items[i].desc,
                URL_item: items[i].URL,
                URL_img: items[i].imgURL,
                price_per_pice: 0,
                currency: "",
                count: items[i].count,
                size: items[i].size,
                ID_domain_name_shop: "",
                ID_physical_address_delivery_point: "",
              };

              const client = new MongoClient(uri, { useNewUrlParser: true });

              client.connect((err) => {
                const collection = client.db("shoppingapp").collection("items");

                const options = {};

                collection.insertOne(doc).then((response) => {
                  items_id_arr.push(response.insertedId);

                  itemsProccess++;

                  if (items.length == itemsProccess) {
                    let doc = {
                      QR_code: "",
                      state: STATE_ORDER.IN_PROCCESSING,
                      waight: 100,
                      size: {
                        x: 10,
                        y: 10,
                        z: 10,
                      },
                      ID_items: items_id_arr,
                      type_delivery: "",
                      delivery_to_door_adrress: "",
                      ID_postmate: 0,
                      ID_cell: 10,
                      ID_user: data.data.user_id,
                    };

                    const collection = client
                      .db("shoppingapp")
                      .collection("orders");

                    collection.insertOne(doc).then((response) => {
                      res.writeHead(200);
                      res.write(
                        JSON.stringify({
                          result: RESULT_CREATE_ORDER.SUCCESS,
                        })
                      );
                      res.end();
                    });
                  }

                  client.close();
                });
              });
            }

            break;
          }

          case "get_orders": {
            const client = new MongoClient(uri, { useNewUrlParser: true });

            client.connect((err) => {
              const collection = client.db("shoppingapp").collection("orders");
              collection
                .find({ ID_user: data.data.user_id })
                .toArray((err, items) => {
                  res.writeHead(200);
                  res.write(JSON.stringify(items));
                  res.end();
                  client.close();
                });
            });
            break;
          }

          case "save_user_info": {
            const client = new MongoClient(uri, { useNewUrlParser: true });

            client.connect((err) => {
              const collection = client
                .db("shoppingapp")
                .collection("users_client_app");
              collection
                .updateOne(
                  { _id: ObjectId(data.data.user_id) },
                  {
                    $set: {
                      first_name: data.data.first_name,
                      last_name: data.data.last_name,
                      phone: data.data.phone,
                      email: data.data.email,
                    },
                  }
                )
                .then((err, items) => {
                  res.writeHead(200);
                  res.end();
                  client.close();
                });
            });
            break;
          }

          case "change_order_state": {
            const client = new MongoClient(uri, { useNewUrlParser: true });

            client.connect((err) => {
              const collection = client.db("shoppingapp").collection("orders");
              collection
                .updateOne(
                  { _id: ObjectId(data.data.order_id) },
                  {
                    $set: {
                      state: data.data.order_state,
                    },
                  }
                )
                .then((err, items) => {

                  let data = {
                    result: RESULT_CHANGE_STATE_ORDER.SUCCESS,
                  }

                  res.writeHead(200);
                  res.write(JSON.stringify(data));
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
