import axios from "axios";
import { AYMURAI_API_URL } from "utils/config";

export const fetcher = axios.create({
  baseURL: AYMURAI_API_URL,
});
