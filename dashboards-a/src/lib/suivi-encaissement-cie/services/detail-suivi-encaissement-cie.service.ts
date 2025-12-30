import { State } from '@progress/kendo-data-query';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EPEGA_REPORTING_API_BASE_URL, ISuiviEncaissementCieFilters } from '@portals/client-reporting';
import { ListingFetchService } from '@portals/base/core/shared-services';
import { GridDataResult } from '@progress/kendo-angular-grid';

@Injectable()
export class DetailSuiviEncaissementService extends ListingFetchService {
  constructor(@Inject(EPEGA_REPORTING_API_BASE_URL) private baseUrl: string) {
    super();
  }

  private data: GridDataResult = { total: 0, data: [] };

  refresh(filter: ISuiviEncaissementCieFilters) {
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

  public read(filter: ISuiviEncaissementCieFilters) {
    this.fetchGrid(filter)
      .pipe(
        tap((data) => {
          this.data = data;
        })
      )
      .subscribe((data) => {
        super.next(data);
      });
  }

  public fetchGrid(filter: ISuiviEncaissementCieFilters): Observable<any> {
    this.isLoading = true;
    return this.fetchPOST(
      false,
      'api/1.0/Dashboard/SuiviEncaissementCie/GetSuiviEncaissementCie',
      this.baseUrl,
      filter,
      this.state,
      1000
    ).pipe(tap(() => (this.isLoading = false)));
  }

  reset() {
    this.data = { total: 0, data: [] };
    super.next(this.data);
  }
}
