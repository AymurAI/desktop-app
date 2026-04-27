import { AYMURAI_API_URL } from "@/constants/config";
import axios from "axios";

export const fetcher = axios.create({
  baseURL: AYMURAI_API_URL,
});
