interface Params {
  job_id: string;
  topic: string;
  workflowName: string;
  [field: string]: string;
  id: string;
}

interface Body {
  [field: string]: string;
}

interface Query {
  [field: string]: string;
}

export { Params, Body, Query }
