import { Router } from 'express';
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';
import { generateDataProviderFilterOptionsRequestHandler } from './data_provider/filter_options/index.js';
import { generateDataProviderRecordDetailsRequestHandler } from './data_provider/record_details/index.js';
import { generateDataProviderRecordsRequestHandler } from './data_provider/records/index.js';

interface GenerateRouterInput {
  mongoClient: MongoClient;
}

interface GenerateRouterOutput {
  router: Router;
}

const generateRouter = (input: GenerateRouterInput): GenerateRouterOutput => {
  const { mongoClient } = input;

  const jsonParser = bodyParser.json();

  const router = Router();

  const { dataProviderFilterOptionsRequestHandler } = generateDataProviderFilterOptionsRequestHandler({ mongoClient });
  const { dataProviderRecordDetailsRequestHandler } = generateDataProviderRecordDetailsRequestHandler({ mongoClient });
  const { dataProviderRecordsRequestHandler } = generateDataProviderRecordsRequestHandler({ mongoClient });

  router.get('/data_provider/filter_options', dataProviderFilterOptionsRequestHandler);
  router.get('/data_provider/record_details/:uid', dataProviderRecordDetailsRequestHandler);
  router.post('/data_provider/records', jsonParser, dataProviderRecordsRequestHandler);

  return {
    router
  }
}

export {
  generateRouter
};