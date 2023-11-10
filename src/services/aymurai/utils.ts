import axios from "axios";

import { PREDICT_PORT } from "utils/config";

export const fetcher = axios.create({
  baseURL: `http://192.168.0.7:${PREDICT_PORT}`,
});
