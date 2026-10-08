const PAGE_SIZE = 1000;
const CONCURRENCY = 3;
export async function fetchAllPaginated(buildQuery) {
  const first = await buildQuery().range(0, PAGE_SIZE - 1);
  if (first.error) throw first.error;
  const rows = first.data || [];
  if (rows.length < PAGE_SIZE) return rows;
  const countResult = await buildQuery().select('id', {
    count: 'exact',
    head: true
  });
  if (!countResult.error && Number.isFinite(countResult.count)) {
    for (let start = PAGE_SIZE; start < countResult.count; start += PAGE_SIZE * CONCURRENCY) {
      const requests = [];
      for (let offset = start; offset < Math.min(countResult.count, start + PAGE_SIZE * CONCURRENCY); offset += PAGE_SIZE) {
        requests.push(buildQuery().range(offset, offset + PAGE_SIZE - 1));
      }
      const pages = await Promise.all(requests);
      for (const page of pages) {
        if (page.error) throw page.error;
        rows.push(...(page.data || []));
      }
    }
    return rows;
  }
  for (let offset = PAGE_SIZE;; offset += PAGE_SIZE) {
    const page = await buildQuery().range(offset, offset + PAGE_SIZE - 1);
    if (page.error) throw page.error;
    rows.push(...(page.data || []));
    if (!page.data || page.data.length < PAGE_SIZE) return rows;
  }
}
