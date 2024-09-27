import axios from "axios";

const apiMLSuggest = axios.create({
  baseURL: "https://http2.mlstatic.com/",
});

const apiML = axios.create({
  baseURL: "https://api.mercadolibre.com/",
});

export { apiML, apiMLSuggest };

