import axios from "axios";

import { PREDICT_PORT } from "utils/config";

export const fetcher = axios.create({
  // baseURL: `http://localhost:${PREDICT_PORT}`,
  baseURL: `http://192.168.100.99:${PREDICT_PORT}`,
});
