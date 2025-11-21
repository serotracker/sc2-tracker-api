import { RequestHandler } from "express"
import * as z from 'zod';
import min from "lodash/min.js";
import max from "lodash/max.js";
import { MongoClient } from 'mongodb';
import { SarsCov2EstimateDocument } from "../../storage/types.js";

interface GenerateDataProviderRecordsRequestHandlerInput {
  mongoClient: MongoClient;
}

interface GenerateDataProviderRecordsRequestHandlerOutput {
  dataProviderRecordsRequestHandler: RequestHandler;
}

interface DataProviderRecordsRequestResponseBody {
  country_seroprev_summary: Array<{
    country: string;
    country_iso3: string;
    n_estimates: number;
    n_tests_administered: number;
    seroprevalence_estimate_summary: {
      Hyperlocal: {
        max_estimate: number | null;
        min_estimate: number | null;
        n_estimates: number | null;
      },
      Local: {
        max_estimate: number | null;
        min_estimate: number | null;
        n_estimates: number | null;
      },
      National: {
        max_estimate: number | null;
        min_estimate: number | null;
        n_estimates: number | null;
      },
      Regional: {
        max_estimate: number | null;
        min_estimate: number | null;
        n_estimates: number | null;
      },
      Sublocal: {
        max_estimate: number | null;
        min_estimate: number | null;
        n_estimates: number | null;
      }
    }
  }>;
  records: Array<Partial<{
    estimate_grade: string;
    pin_latitude: number;
    pin_longitude: number;
    source_id: string;
  }>>;
};

const dataProviderRecordsRequestBodySchema = z.object({
  columns: z.array(z.literal(['source_id', 'estimate_grade', 'pin_latitude', 'pin_longitude'])),
  estimates_subgroup: z.literal('primary_estimates'),
  filters: z.object({
    age: z.array(z.string()),
    antibody_target: z.array(z.string()),
    country: z.array(z.string()),
    estimate_grade: z.array(z.string()),
    isotypes_reported: z.array(z.string()),
    overall_risk_of_bias: z.array(z.string()),
    population_group: z.array(z.string()),
    sex: z.array(z.string()),
    source_type: z.array(z.string()),
    test_type: z.array(z.string()),
  }),
  sampling_end_date: z.string(),
  sampling_start_date: z.string(),
  unity_aligned_only: z.boolean(),
})

export const generateDataProviderRecordsRequestHandler = (
  input: GenerateDataProviderRecordsRequestHandlerInput
): GenerateDataProviderRecordsRequestHandlerOutput => {
  const { mongoClient } = input;
  const databaseName = process.env.DATABASE_NAME;

  const dataProviderRecordsRequestHandler: RequestHandler = async(request, response) => {
    const parsedBody = dataProviderRecordsRequestBodySchema.parse(request.body);

    const estimatesCollection = mongoClient.db(databaseName).collection<SarsCov2EstimateDocument>('sarsCov2Estimates');
    const estimates = await estimatesCollection.find({}).toArray();
    const allCountryAlphaThreeCodesWithData = await estimatesCollection.distinct('countryAlphaThreeCode');

    const hyperlocalEstimates = estimates.filter((estimate) => estimate.scope === 'Hyperlocal');
    const localEstimates = estimates.filter((estimate) => estimate.scope === 'Local');
    const nationalEstimates = estimates.filter((estimate) => estimate.scope === 'National');
    const regionalEstimates = estimates.filter((estimate) => estimate.scope === 'Regional');
    const sublocalEstimates = estimates.filter((estimate) => estimate.scope === 'Sublocal');

    const responseBody: DataProviderRecordsRequestResponseBody = {
      country_seroprev_summary: allCountryAlphaThreeCodesWithData
        .map((countryAlphaThreeCode) => {
          const allEstimatesForCountry = estimates.filter((estimate) => estimate.countryAlphaThreeCode === countryAlphaThreeCode);

          if(allEstimatesForCountry.length === 0) {
            return undefined;
          }

          const firstEstimateForCountry = allEstimatesForCountry[0];

          const hyperlocalEstimatesForCountry = hyperlocalEstimates
            .filter((estimate) => estimate.countryAlphaThreeCode === countryAlphaThreeCode)
            .map((estimate) => estimate.seroprevalence);
          const localEstimatesForCountry = localEstimates
            .filter((estimate) => estimate.countryAlphaThreeCode === countryAlphaThreeCode)
            .map((estimate) => estimate.seroprevalence);
          const nationalEstimatesForCountry = nationalEstimates
            .filter((estimate) => estimate.countryAlphaThreeCode === countryAlphaThreeCode)
            .map((estimate) => estimate.seroprevalence);
          const regionalEstimatesForCountry = regionalEstimates
            .filter((estimate) => estimate.countryAlphaThreeCode === countryAlphaThreeCode)
            .map((estimate) => estimate.seroprevalence);
          const sublocalEstimatesForCountry = sublocalEstimates
            .filter((estimate) => estimate.countryAlphaThreeCode === countryAlphaThreeCode)
            .map((estimate) => estimate.seroprevalence);

          return {
            country: firstEstimateForCountry[0],
            country_iso3: countryAlphaThreeCode,
            n_estimates: allEstimatesForCountry.length,
            n_tests_administered: allEstimatesForCountry
              .reduce((accumulator, currentValue) => accumulator + currentValue.denominatorValue, 0),
            seroprevalence_estimate_summary: {
              Hyperlocal: {
                max_estimate: max(hyperlocalEstimatesForCountry),
                min_estimate: min(hyperlocalEstimatesForCountry),
                n_estimates: hyperlocalEstimatesForCountry.length,
              },
              Local: {
                max_estimate: max(localEstimatesForCountry),
                min_estimate: min(localEstimatesForCountry),
                n_estimates: localEstimatesForCountry.length,
              },
              National: {
                max_estimate: max(nationalEstimatesForCountry),
                min_estimate: min(nationalEstimatesForCountry),
                n_estimates: nationalEstimatesForCountry.length,
              },
              Regional: {
                max_estimate: max(regionalEstimatesForCountry),
                min_estimate: min(regionalEstimatesForCountry),
                n_estimates: regionalEstimatesForCountry.length,
              },
              Sublocal: {
                max_estimate: max(sublocalEstimatesForCountry),
                min_estimate: min(sublocalEstimatesForCountry),
                n_estimates: sublocalEstimatesForCountry.length,
              }
            }
          }
        })
        .filter((summary): summary is NonNullable<typeof summary> => !!summary),
      records: estimates.map((estimate) => ({
        ...(parsedBody.columns.includes('source_id') ? { source_id: estimate._id.toHexString() } : {}),
        ...(parsedBody.columns.includes('estimate_grade') ? { estimate_grade: estimate.scope } : {}),
        ...(parsedBody.columns.includes('pin_latitude') ? { pin_latitude: estimate.latitude } : {}),
        ...(parsedBody.columns.includes('pin_longitude') ? { pin_longitude: estimate.longitude } : {}),
      })),
    }

    return response.status(200).json(responseBody);
  }
  
  return {
    dataProviderRecordsRequestHandler
  }
}