const express = require('express')
const app = express()
const cors = require('cors')
const stripe = require("stripe")('sk_test_51OFgVsGS2QyCO746J8JGApwKlLofRtrW68Rr1a04mrFxcOC1JVRS9PROgukVdl75VKtNB8LrHyQ3y0HiZexIF9el00YhPvWWWg');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = "mongodb+srv://<username>:<password>@cluster0.tqyfr7x.mongodb.net/?retryWrites=true&w=majority";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tqyfr7x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const userCollection = client.db("EvaluationDb").collection("user");
    const questionCollection = client.db("EvaluationDb").collection("SurveyQuestion");
    const AdminCollection = client.db("EvaluationDb").collection("surveyorRequest");
    const responseCollection = client.db("EvaluationDb").collection("totalResponse");
    const paymentCollection = client.db("EvaluationDb").collection("payment");
    const commentCollection = client.db("EvaluationDb").collection("comment");
    const reviewsCollection = client.db("EvaluationDb").collection("reviews");



    // users related api

    // step2

    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });



    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    app.get('/users/surveyor/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let Surveyor = false;
      if (user) {
        Surveyor = user?.role === 'Surveyor';
      }

      res.send({ Surveyor });
    })



    // step1
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/role/:id', async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;

      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: role,
        },
      };

      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })

    app.post('/surveyorRequest', async (req, res) => {
      const question = req.body;
      const result = await AdminCollection.insertOne(question);
      res.send(result);
    });

    // update data 
    app.get('/surveyorRequest', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await AdminCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/surveyorRequest/:id', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await questionCollection.find(query).toArray();
      res.send(result);
    })


    app.get('/surveyorRequest/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await AdminCollection.findOne(query)
      res.send(result);
    })

    app.patch('/surveyQuestion/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const item = req.body;
        const filter = { _id: new ObjectId(id) };
        console.log(filter)
        const updatedDoc = {
          $set: {
            title: item.title,
            description: item.description,
            Category: item.Category
          }
        };
        const result = await AdminCollection.updateOne(filter, updatedDoc);
        res.send(result);
        console.log(result);
      } catch (error) {
        console.error('Error updating survey question:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });



    // request admin

    app.post('/surveyQuestion', async (req, res) => {
      const question = req.body;
      console.log(question)
      try {
        // Assuming 'status' is included in the question object to determine the action (publish)
        if (question.status === 'published') {
          // Insert the question
          const result = await questionCollection.insertOne(question);

          // Automatically delete the question after publishing
          res.send(result)
        } else {
          res.status(400).send({ error: 'Invalid status' });
        }
      } catch (error) {
        console.error('Error processing survey question:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });


    // update code 


    app.post('/surveyQuestion/unpublish', async (req, res) => {
      const question = req.body;
      const result = await questionCollection.insertOne(question);
      res.send(result);
    });


    app.get('/surveyQuestion', async (req, res) => {

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await questionCollection.find(query).toArray();
      res.send(result);

    })

    app.get('/StatusRequest', async (req, res) => {
      const id = req.query.surveyId;
      let query = {};
      if (id) {
        query = { _id: new ObjectId(id) }
      }
      const result = await questionCollection.findOne(query);
      res.send(result);

    })

    app.get('/surveyorData/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await AdminCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error('Error fetching surveyor data:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });

    app.delete('/surveyQuestion/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await questionCollection.deleteOne(query);

        if (result.deletedCount > 0) {
          res.status(200).send({ message: 'Document deleted successfully' });
        } else {
          res.status(404).send({ message: 'Document not found' });
        }
      } catch (error) {
        console.error('Error deleting survey question:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });
    // show all data in servey in user

    app.get('/UserShowSurvey', async (req, res) => {
      const result = await questionCollection.find().toArray();
      res.send(result);

    })

    app.get('/UserShowSurvey/:id', async (req, res) => {
      const id = req.params.id;

      try {
        const query = { _id: new ObjectId(id) };
        const result = await questionCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error('Error fetching surveyor data:', error);
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });



    // response survey Response

    app.post('/submitSurveyResponse', async (req, res) => {
      try {
        const response = req.body;
        // Check if the user has already submitted for this survey and category
        const existingSubmission = await responseCollection.findOne({
          email: response.email,
          surveyId: response.surveyId,
          Category: response.Category,
        });

        if (existingSubmission) {
          return res.status(400).json({ error: 'User has already submitted for this survey and category.' });
        }

        const result = await responseCollection.insertOne(response);
        res.json(result);
      } catch (error) {
        console.error('Error submitting survey response:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });



    app.get('/submitSurveyResponse', async (req, res) => {
      let query = {};
      if (req.query?.surveyorEmail) {
        query = { surveyorEmail: req.query.surveyorEmail }
      }
      const result = await responseCollection.find(query).toArray();
      res.send(result);
    })

    // admin can see survey response in this page 
    app.get('/CheckAdminResponse', async (req, res) => {
      const result = await responseCollection.find().toArray();
      res.send(result);
    })
    // check user result
    app.get('/CheckUserResponse', async (req, res) => {
      const result = await responseCollection.find().toArray();
      res.send(result);
    })

    // Payment information

    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);

      // Update user role in userCollection
      try {
        // Update user role in userCollection
        if (paymentResult?.insertedId && payment.role === 'proUser') {
          const roleUpdateResult = await userCollection.updateOne(
            { email: payment.email },
            { $set: { role: payment.role } }
          );

          if (roleUpdateResult.modifiedCount === 1) {
            console.log('User role updated to proUser');
          } else {
            console.error('Error updating user role:', roleUpdateResult);
            // Handle the error appropriately
          }
        }
      } catch (error) {
        console.error('Exception during user role update:', error);
        // Handle the exception appropriately
      }

      res.send(paymentResult);
    });

    app.get('/adminPaymentInfo', async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });


    // Only pro user get comment>>>>>>>>>>..................

    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let proUser = false;
      if (user) {
        proUser = user?.role === 'proUser';
      }

      res.send({ proUser });
    });

    app.post('/submitComment', async (req, res) => {
      try {
        const response = req.body;
        // Check if the user has already submitted for this survey and category
        const existingSubmission = await commentCollection.findOne({
          email: response.email,
          Category: response.Category,

        });

        if (existingSubmission) {
          return res.status(400).json({ error: 'User has already submitted for this survey and category.' });
        }

        const result = await commentCollection.insertOne(response);
        res.json(result);
      } catch (error) {
        console.error('Error submitting survey response:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    app.get('/submitComment', async (req, res) => {
      try {
        const { category } = req.query;
        const query = category ? { Category: category } : {};
        const result = await commentCollection.find(query).toArray();
        res.json(result);
      } catch (error) {
        console.error('Error retrieving comments:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // most voted survey show in page ...................

    app.get('/mostVoted', async (req, res) => {
      try {
        let query = {};
        if (req.query?.surveyorEmail) {
          query = { surveyorEmail: req.query.surveyorEmail };
        }

        const result = await responseCollection.find(query).toArray();

        // Aggregate the total number of responses for each category
        const categoryResponseCount = result.reduce((acc, survey) => {
          const { Category } = survey;
          acc[Category] = (acc[Category] || 0) + 1;
          return acc;
        }, {});

        // Create an array of categories with the total number of responses
        const categoriesWithResponses = Object.keys(categoryResponseCount).map((category) => ({
          category,
          totalResponses: categoryResponseCount[category],
        }));

        // Sort the categories based on the total number of responses
        const sortedCategories = categoriesWithResponses.sort(
          (a, b) => b.totalResponses - a.totalResponses
        );
        // Create an array of surveys for each category with the total number of responses
        const sortedSurveys = sortedCategories.reduce((acc, { category, totalResponses }) => {
          const surveysInCategory = result.find((survey) => survey.Category === category);
          if (surveysInCategory) {
            acc.push({ ...surveysInCategory, totalResponses });
          }
          return acc;
        }, []);

        res.json(sortedSurveys);
      } catch (error) {
        console.error('Error fetching most voted surveys:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // recent created data can show 

    app.get('/recentSurveys', async (req, res) => {
      try {
        const result = await questionCollection.find().sort({ timestamp: -1 }).toArray();
        res.json(result);
      } catch (error) {
        console.error('Error fetching recent surveys:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });


    // review collection show in 

    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });



    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('server is running')
})

app.listen(port, () => {
  console.log(`teacher-evaluation running on port ${port}`)
})