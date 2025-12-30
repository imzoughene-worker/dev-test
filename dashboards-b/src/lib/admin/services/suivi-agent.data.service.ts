import { Inject, Injectable } from '@angular/core';
import { EPEGA_REPORTING_API_BASE_URL, IAdminFilter } from '@portals/client-reporting';
import { State } from '@progress/kendo-data-query';
import { Observable, tap } from 'rxjs';
import { ListingFetchService } from '@portals/base/core/shared-services';

@Injectable()
export class SuiviAgentService extends ListingFetchService {

  constructor(@Inject(EPEGA_REPORTING_API_BASE_URL) private baseUrl: string) {
    super();
  }


  refresh(filter: IAdminFilter) {
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

  public read(filter: IAdminFilter) {
    this.fetchGrid(filter)
      .subscribe((data) => {
        super.next(data);
      });
  }

  public fetchGrid(filter: IAdminFilter): Observable<any> {
    this.isLoading = true;
    return this.fetchPOST(false, "api/1.0/Dashboard/Admin/GetDetailsDossierSaisiParAgent", this.baseUrl, filter, this.state, 1000)
      .pipe(
        tap(() => (this.isLoading = false))
      );

  }

  reset() {
    super.next({ total: 0, data: [] });
  }
}
