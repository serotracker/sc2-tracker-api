import express from 'express';
import cors from 'cors';
import { MongoClient } from "mongodb";
import { generateRouter } from './router.js';

const mongoUrl = process.env.MONGODB_URI;

if (!mongoUrl) {
  console.log("Unable to find value for MONGODB_URI. Please make sure you have run generate-env-files.sh and have specified one in the appropriate environment file.");
  console.log("Exiting early.");
  process.exit(1);
}

const mongoClient = new MongoClient(mongoUrl);
await mongoClient.connect();

const app = express();
const { router } = generateRouter({ mongoClient });

app.use(cors());
app.use('/', router);

export default app;