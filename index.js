require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kisu1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const movieCollection = client.db("movieDB").collection("movie");
    // const favoritesCollection = client.db("movieDB").collection("favorites");

    app.get("/movie", async (req, res) => {
      const cursor = movieCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/movie", async (req, res) => {
      const newMovie = req.body;
      const result = await movieCollection.insertOne(newMovie);
      res.send(result);
    });

    app.put("/movie/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateMovie = req.body;
      const movie = {
        $set: {
          moviePoster:updateMovie.moviePoster,
          movieTitle:updateMovie.movieTitle,
          genre:updateMovie.genre,
          duration:updateMovie.duration,
          releaseYear: updateMovie.releaseYear,

          rating:updateMovie.rating,
          summary:updateMovie.summary
        },
      }
      const result = await movieCollection.updateOne(filter, movie, options);
      res.send(result);
    });

    app.delete("/movie/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/movie/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await movieCollection.findOne(query);
      console.log(result);
      res.send(result);

    });


    // favourite 

    app.post("/favorites", async (req, res) => {
      const { email,...movie } = req.body;
      // console.log(email,movie);
    
      try {
        const existingFavorite = await client
          .db("movieDB")
          .collection("favorites")
          .findOne({ email, "movie._id": movie._id });
    
        if (existingFavorite) {
          return res.status(200).send({ error: "Movie already in favorites" });
        }
        
        const result = await client
          .db("movieDB")
          .collection("favorites")
          
          .insertOne({ email,movie });
    
        res.status(201).send(result);
      } catch (error) {
        res.status(500).json({ error: "Movie already in favorites" });
      }
    });

    app.get("/favorites", async (req, res) => {
      const email = req.query.email;
    
      try {
        const favorites = await client
          .db("movieDB")
          .collection("favorites")
          .find({ email })
          .toArray();
    
        res.json(favorites);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch favorites" });
      }
    });

    app.delete("/favorites/:id", async (req, res) => {
      const id = req.params.id;
    
      try {
        const result = await client
          .db("movieDB")
          .collection("favorites")
          .deleteOne({ _id: new ObjectId(id) });
    
        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Favorite deleted successfully" });
        } else {
          res.status(404).json({ error: "Favorite not found" });
        }
      } catch (error) {
        res.status(500).json({ error: "Failed to delete favorite" });
      }
    });
    
    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("move portal server is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
