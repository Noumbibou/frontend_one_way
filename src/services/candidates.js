import api from "./api";

export async function fetchCandidates(params = {}) {
  const all = [];
  let url = "candidates/";
  let first = true;
  let next = null;

  do {
    let res;
    if (first) {
      res = await api.get(url, { params });
      first = false;
    } else {
      // follow absolute next URL
      res = await api.get(next.replace(/^.*\/api\//, ""));
    }
    const data = res.data;
    if (Array.isArray(data)) {
      all.push(...data);
      next = null;
    } else if (data && Array.isArray(data.results)) {
      all.push(...data.results);
      next = data.next || null;
    } else {
      next = null;
    }
  } while (next);

  return all;
}
