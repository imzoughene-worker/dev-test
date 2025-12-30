import { State } from '@progress/kendo-data-query';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EPEGA_REPORTING_API_BASE_URL, IAffiliationFilter } from '@portals/client-reporting';
import { ListingFetchService } from '@portals/base/core/shared-services';

@Injectable()
export class AdhesionSortanteService extends ListingFetchService {
  constructor(@Inject(EPEGA_REPORTING_API_BASE_URL) private baseUrl: string) {
    super();
  }

  refresh(filter: IAffiliationFilter) {
    this.state.skip = 0;
    this.read(filter);
  }

  public state: State = {
    skip: 0,
    take: 50,
    filter: { filters: [], logic: 'or' },
    group: [],
    sort: [],
  };

  public read(filter: IAffiliationFilter) {
    this.fetchGrid(filter).subscribe((data) => {
      super.next(data);
    });
  }

  public fetchGrid(filter: IAffiliationFilter): Observable<any> {
    this.isLoading = true;

    return this.fetchPOST(
      false,
      'api/1.0/Dashboard/PopulationClient/GetDetailsAdhesionSortantes',
      this.baseUrl,
      filter,
      this.state,
      1000
    ).pipe(tap(() => (this.isLoading = false)));
  }

  reset() {
    super.next({ total: 0, data: [] });
  }
}
