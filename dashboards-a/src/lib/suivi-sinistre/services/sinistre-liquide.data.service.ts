import { State } from '@progress/kendo-data-query';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { EPEGA_REPORTING_API_BASE_URL, ISuiviLotFilters } from '@portals/client-reporting';
import { GridDataResult } from '@progress/kendo-angular-grid';
import { ListingFetchService } from '@portals/base/core/shared-services';

@Injectable()
export class SinistreLiquideService extends ListingFetchService {
  constructor(@Inject(EPEGA_REPORTING_API_BASE_URL) private baseUrl: string) {
    super();
  }

  private aggregates: Record<string, string> = {};

  public getAggregate(key: string, defaultValue: string): string {
    if (this.aggregates[key]) return this.aggregates[key];
    return defaultValue;
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
    this.fetchGrid(filter)
      .pipe(
        tap((data) => {
          this.aggregates = data.aggregates;
        })
      )
      .subscribe((data) => {
        super.next(data);
      });
  }

  public fetchGrid(filter: ISuiviLotFilters): Observable<any> {
    return super
      .fetchPOST(
        false,
        'api/1.0/Dashboard/SuiviSinistre/GetSuiviSinistreLiquide',
        this.baseUrl,
        {
          ...filter,
          etatClients: [],
        },
        this.state,
        1000
      )
      .pipe(
        map((result: GridDataResult) => {
          const aggregates: Record<string, string> = {
            sumMontantRembourse: result.data?.reduce((acc, o) => acc + o.montantRembourse, 0) ?? '0 DHS',
            sumMontantEngage: result.data?.reduce((acc, o) => acc + o.fraisEngage, 0) ?? '0 DHS',
          };

          return {
            data: result.data,
            total: result.total,
            aggregates: aggregates,
          };
        }),
        tap((result) => {
          this.isLoading = false;
        })
      );
  }

  reset() {
    super.next({ total: 0, data: [] });
  }
}
