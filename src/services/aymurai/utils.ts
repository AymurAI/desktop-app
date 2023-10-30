import axios from "axios";

import { PREDICT_PORT } from "utils/config";

export const fetcher = axios.create({
  baseURL: `http://localhost:${PREDICT_PORT}`,
});
