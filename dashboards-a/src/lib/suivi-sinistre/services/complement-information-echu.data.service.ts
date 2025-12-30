import { State } from '@progress/kendo-data-query';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EPEGA_REPORTING_API_BASE_URL, ISuiviLotFilters } from '@portals/client-reporting';
import { ListingFetchService } from '@portals/base/core/shared-services';

@Injectable()
export class ComplementInformationEchuService extends ListingFetchService {
  constructor(@Inject(EPEGA_REPORTING_API_BASE_URL) private baseUrl: string) {
    super();
  }

  refresh(filter: ISuiviLotFilters) {
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

  public read(filter: ISuiviLotFilters) {
    this.fetchGrid(filter).subscribe((data) => {
      super.next(data);
    });
  }

  public fetchGrid(filter: ISuiviLotFilters): Observable<any> {
    this.isLoading = true;
    return this.fetchPOST(
      false,
      'api/1.0/Dashboard/SuiviSinistre/GetDepotComplementInformationEchu',
      this.baseUrl,
      { ...filter, etatClients: [] },
      this.state,
      1000
    ).pipe(tap(() => (this.isLoading = false)));
  }

  reset() {
    super.next({ total: 0, data: [] });
  }
}
