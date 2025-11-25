import { RequestHandler } from "express"
import { MongoClient, ObjectId } from 'mongodb';
import { SarsCov2EstimateDocument } from "../../storage/types.js";

interface GenerateDataProviderRecordDetailsRequestHandlerInput {
  mongoClient: MongoClient;
}

interface GenerateDataProviderRecordDetailsRequestHandlerOutput {
  dataProviderRecordDetailsRequestHandler: RequestHandler;
}

interface RecordDetails {
  academic_primary_estimate: true;
  adj_prev_ci_lower: 0;
  adj_prev_ci_upper: 0;
  adj_prevalence: 0;
  age: string;
  antibody_target: Array<string>;
  cases_per_hundred: number;
  city: Array<string> | string | null;
  country: string;
  dashboard_primary_estimate: true,
  deaths_per_hundred: number;
  denominator_value: number;
  estimate_grade: string;
  first_author: '';
  full_vaccinations_per_hundred: number;
  geo_exact_match: true;
  in_disputed_area: false;
  included: true;
  is_unity_aligned: boolean;
  isotype_comb: null;
  isotype_iga: boolean;
  isotype_igg: boolean;
  isotype_igm: boolean;
  isotypes: Array<string>;
  lead_organization: '';
  manufacturer_sensitivity: null;
  manufacturer_specificity: null;
  numerator_definition: '';
  overall_risk_of_bias: string;
  pin_latitude: number;
  pin_longitude: number;
  pop_adj: null;
  population_group: string;
  publication_date: string;
  sampling_end_date: string;
  sampling_method: '';
  sampling_start_date: string;
  sensitivity: null;
  serum_pos_prevalence: number;
  sex: string;
  source_name: '';
  source_publisher: '';
  source_type: string;
  specificity: 0;
  specimen_type: '';
  state: Array<string> | string | null;
  study_name: string;
  study_type: '';
  subgroup_var: '';
  summary: '';
  test_adj: null;
  test_manufacturer: '';
  test_type: string;
  tests_per_hundred: 0;
  url: string;
  vaccination_policy: '';
  vaccinations_per_hundred: 0;
}

export const generateDataProviderRecordDetailsRequestHandler = (
  input: GenerateDataProviderRecordDetailsRequestHandlerInput
): GenerateDataProviderRecordDetailsRequestHandlerOutput => {
  const { mongoClient } = input;
  const databaseName = process.env.DATABASE_NAME;

  const dataProviderRecordDetailsRequestHandler: RequestHandler = async(request, response) => {
    const _id = new ObjectId(request.params.uid);

    const estimatesCollection = mongoClient.db(databaseName).collection<SarsCov2EstimateDocument>('sarsCov2Estimates');
    const estimate = await estimatesCollection.findOne({ _id });

    const responseBody: RecordDetails = {
      academic_primary_estimate: true,
      adj_prev_ci_lower: 0,
      adj_prev_ci_upper: 0,
      adj_prevalence: 0,
      age: estimate.ageGroup,
      antibody_target: estimate.antibodies,
      cases_per_hundred: estimate.countryPositiveCasesPerMillionPeople * 10_000,
      city: estimate.city,
      country: estimate.country,
      dashboard_primary_estimate: true,
      deaths_per_hundred: 0,
      denominator_value: estimate.denominatorValue,
      estimate_grade: estimate.scope,
      first_author: '',
      full_vaccinations_per_hundred: estimate.countryPeopleFullyVaccinatedPerHundred * 10_000,
      geo_exact_match: true,
      in_disputed_area: false,
      included: true,
      is_unity_aligned: estimate.isWHOUnityAligned,
      isotype_comb: null,
      isotype_iga: estimate.isotypes.includes('IgA'),
      isotype_igg: estimate.isotypes.includes('IgG'),
      isotype_igm: estimate.isotypes.includes('IgM'),
      isotypes: estimate.isotypes,
      lead_organization: '',
      manufacturer_sensitivity: null,
      manufacturer_specificity: null,
      numerator_definition: '',
      overall_risk_of_bias: estimate.riskOfBias,
      pin_latitude: estimate.latitude,
      pin_longitude: estimate.longitude,
      pop_adj: null,
      population_group: estimate.populationGroup,
      publication_date: estimate.publicationDate.toISOString(),
      sampling_end_date: estimate.samplingEndDate.toISOString(),
      sampling_method: '',
      sampling_start_date: estimate.samplingStartDate.toISOString(),
      sensitivity: null,
      serum_pos_prevalence: estimate.seroprevalence,
      sex: estimate.sex,
      source_name: '',
      source_publisher: '',
      source_type: estimate.sourceType,
      specificity: 0,
      specimen_type: '',
      state: estimate.state,
      study_name: estimate.studyName,
      study_type: '',
      subgroup_var: '',
      summary: '',
      test_adj: null,
      test_manufacturer: '',
      test_type: estimate.testType.join(', '),
      tests_per_hundred: 0,
      url: estimate.url,
      vaccination_policy: '',
      vaccinations_per_hundred: 0,
    }

    return response.status(200).json(responseBody);
  }
  
  return {
    dataProviderRecordDetailsRequestHandler
  }
}