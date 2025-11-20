import { RequestHandler } from "express"
import { MongoClient } from 'mongodb';
import { SarsCov2EstimateDocument } from "../../storage/types.js";

interface GenerateDataProviderFilterOptionsRequestHandlerInput {
  mongoClient: MongoClient;
}

interface GenerateDataProviderFilterOptionsRequestHandlerOutput {
  dataProviderFilterOptionsRequestHandler: RequestHandler;
}

const filterUndefinedValuesFromArray = <T>(array: (T | undefined)[]): T[] => array.filter((element): element is T => !!element);

interface FilterOptions {
  age: string[];
  antibody_target: string[];
  city: string[];
  country: string[];
  estimate_grade: string[];
  genpop: [];
  max_publication_end_date: string;
  max_sampling_end_date: string;
  min_publication_end_date: string;
  min_sampling_end_date: string;
  most_recent_publication_date: string;
  overall_risk_of_bias: string[];
  population_group: string[];
}

export const generateDataProviderFilterOptionsRequestHandler = (
  input: GenerateDataProviderFilterOptionsRequestHandlerInput
): GenerateDataProviderFilterOptionsRequestHandlerOutput => {
  const { mongoClient } = input;
  const databaseName = process.env.DATABASE_NAME;

  const dataProviderFilterOptionsRequestHandler: RequestHandler = async(request, response) => {
    const estimatesCollection = mongoClient.db(databaseName).collection<SarsCov2EstimateDocument>('sarsCov2Estimates');

    const [
      age,
      antibody_target,
      city,
      country,
      estimate_grade,
      genpop,
      max_publication_end_date,
      max_sampling_end_date,
      min_publication_end_date,
      min_sampling_end_date,
      most_recent_publication_date,
      overall_risk_of_bias,
      population_group,
    ] = await Promise.all([
      estimatesCollection.distinct('ageGroup').then((elements) => filterUndefinedValuesFromArray(elements)),
      estimatesCollection.distinct('antibodies').then((elements) => filterUndefinedValuesFromArray(elements)),
      estimatesCollection.distinct('city').then((elements) => filterUndefinedValuesFromArray(elements)),
      estimatesCollection.distinct('country').then((elements) => filterUndefinedValuesFromArray(elements)),
      estimatesCollection.distinct('scope').then((elements) => filterUndefinedValuesFromArray(elements)),
      ((): [] => [])(),
      estimatesCollection.aggregate([{
        $group: {
          _id: null,
          maxDate: { $max: "$publicationDate" }
        }
      }]).toArray().then((array): string => array.at(0).maxDate.toISOString()),
      estimatesCollection.aggregate([{
        $group: {
          _id: null,
          maxDate: { $max: "$samplingEndDate" }
        }
      }]).toArray().then((array): string => array.at(0).maxDate.toISOString()),
      estimatesCollection.aggregate([{
        $group: {
          _id: null,
          minDate: { $min: "$publicationDate" }
        }
      }]).toArray().then((array): string => array.at(0).minDate.toISOString()),
      estimatesCollection.aggregate([{
        $group: {
          _id: null,
          minDate: { $min: "$samplingEndDate" }
        }
      }]).toArray().then((array): string => array.at(0).minDate.toISOString()),
      estimatesCollection.aggregate([{
        $group: {
          _id: null,
          maxDate: { $max: "$publicationDate" }
        }
      }]).toArray().then((array): string => array.at(0).maxDate.toISOString()),
      estimatesCollection.distinct('scope').then((elements) => filterUndefinedValuesFromArray(elements)),
      estimatesCollection.distinct('populationGroup').then((elements) => filterUndefinedValuesFromArray(elements)),
    ]);

    const responseBody: FilterOptions = {
      age,
      antibody_target,
      city,
      country,
      estimate_grade,
      genpop,
      max_publication_end_date,
      max_sampling_end_date,
      min_publication_end_date,
      min_sampling_end_date,
      most_recent_publication_date,
      overall_risk_of_bias,
      population_group,
    };

    return response.status(200).json(responseBody);
  }
  
  return {
    dataProviderFilterOptionsRequestHandler
  }
}