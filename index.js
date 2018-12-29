const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const uuid = require('node-uuid');
const ses = require('./ses');


const dynamoDb = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE;
const PRODUCT_TABLE = process.env.PRODUCT_TABLE;
const PRODRESERV_TABLE = process.env.PRODRESERV_TABLE;



app.use(bodyParser.json({ strict: false }));
app.get('/', function (req, res) {
  res.send('Hello World!')
});

// Get User 
app.get('/users/:userId', function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get user' });
    }
    if (result.Item) {
      const {userId, name} = result.Item;
      res.json({ userId, name });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
});

// Create User 
app.post('/users', function (req, res) {
  const { email, name, } = req.body;
  if (typeof email !== 'string') {
    res.status(400).json({ error: '"email" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: uuid.v4(),
      email: email,
      name: name,
    }
  };

  dynamoDb.put(params, (error, data) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create user' });
    }
    res.json(data.Item);
  });
});

//get lista de produtos
app.get('/products', function (req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  const params = {
    TableName: PRODUCT_TABLE,
  }     

  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get product' });
    }
    if (result.Items) {
      var products = [];
      result.Items.forEach((product) => { 
        var newProduct = {
          img: product.img,
          name: product.name,
          productId: product.productId
        }
        products.push(newProduct);
      });
      res.json(products);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  });
});


// criando Endpoint da reserva
app.post('/reserve', function (req, res) {

  

  //Pegando os dados que vem da interface e colocando em uma variavel
  const { userId, productId } = req.body;

  //Verificando se a variavel é uma string
  if (typeof userId !== 'string') {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof productId !== 'string') {
    res.status(400).json({ error: '"productId" must be a string' });
  }

   // cria a reserva
   const date = new Date();
   const params = {
    TableName: PRODRESERV_TABLE,
    Item: {
      reservId: userId + productId,
      userId: userId,
      productId: productId,
      date: date
    }
  };
  // item ja reservado nao esta retornando msg.
  dynamoDb.put(params, (error, data) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not reserve' });
    }

    var day = date.getDate();
    var month = date.getMonth(); 
    var year = date.getFullYear();
    var monthDateYear  = day + "/" + (month+1) + "/" + year;

    var reserv = {
      userName: userId,
      productName: productId,
      date: monthDateYear
    };
    //enviando email
    var promise = ses.sendEmail(reserv);
    promise.then((data) => {
        res.json(reserv);
      }
    ).catch((error) => {
      console.log(error);
      res.status(400).json({ error: error });    
    });
  });
});

module.exports.handler = serverless(app)