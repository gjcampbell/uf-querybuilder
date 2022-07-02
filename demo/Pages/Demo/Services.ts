import axios from "axios";

const serverUrl =
  window.location.host.indexOf("localhost") >= 0
    ? "http://localhost:19200/"
    : "http://localhost:19200/";

type EsSearch = Partial<{ size: number; query: any; from: number }>;
type EsResult<T> = Partial<{ hits: { total: number; hits: { _source: T }[] } }>;

export class EsService {
  private async call<T>(method: string, path: string, data?: any): Promise<T> {
    const response = await axios.request({
      url: `${serverUrl}${path}`,
      data: data,
      method
    });
    return (await response.data) as T;
  }
  public async search<T>(
    index: string,
    searchBody: EsSearch
  ): Promise<{ total: number; items: T[] }> {
    const rawResults = await this.call<EsResult<T>>(
      "post",
      `resources-aws-cloudsaverdemo-*/_search`,
      searchBody
    );
    let items: T[] = [],
      total = 0;
    if (rawResults.hits && rawResults.hits.hits) {
      total = rawResults.hits.total;
      items = rawResults.hits.hits.map((h) => h._source);
    }

    return { total, items };
  }
}
