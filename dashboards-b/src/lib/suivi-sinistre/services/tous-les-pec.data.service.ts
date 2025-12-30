import { State } from '@progress/kendo-data-query';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EPEGA_REPORTING_API_BASE_URL, ISuiviLotFilters } from '@portals/client-reporting';
import { ListingFetchService } from '@portals/base/core/shared-services';

@Injectable()
export class TousLesPecService extends ListingFetchService {

  constructor( @Inject(EPEGA_REPORTING_API_BASE_URL) private baseUrl: string) {
    super();
  }

  refresh(filter: ISuiviLotFilters) {
    this.state.skip = 0;
    this.read(filter);
  }

  public state: State = {
    skip: 0,
    take: 50,
    filter: { filters: [], logic: "or" },
    group: [],
    sort: []
  };

  public read(filter: ISuiviLotFilters) {
    this.fetchGrid(filter)
      .subscribe((data) => {
        super.next(data);
      });
  }

  public fetchGrid(filter: ISuiviLotFilters): Observable<any> {
    let manualFilter = { ...filter, etatClients: [] };
    return super.fetchPOST(false, "api/1.0/Dashboard/SuiviSinistre/GetSuiviToutesLesPEC", this.baseUrl, manualFilter, this.state)
      .pipe(
        tap((result) => {
          this.isLoading = false;
        })
      );
  }

  reset() {
    super.next({ total: 0, data: [] });
  }
}
