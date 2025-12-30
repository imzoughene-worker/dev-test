import { Component, DestroyRef, OnInit, TemplateRef } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  GraphDto,
  ISuiviEncaissementCieFilters,
  ISuiviLotFilters,
  MetricDto,
  SuiviEncaissementCieClient,
  SuiviEncaissementCieFilters,
} from '@portals/client-reporting';
import { BehaviorSubject, finalize, take, tap } from 'rxjs';
import { SuiviEncaissementCieService } from '../services/suivi-encaissement-cie.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';

import { GraphChartComponent } from '../../charts/graph-chart/graph-chart.component';
import { DisplayChartComponent } from '../../charts/display-chart/display-chart/display-chart.component';
import { GaugeChartComponent } from '../../charts/gauge-chart/gauge-chart.component';
import { MetricChartComponent } from '../../charts/metric-chart/metric-chart.component';

interface IFilterRequest {
  filters: ISuiviEncaissementCieFilters;
}

@Component({
    selector: 'portals-twentyth-tab',
    templateUrl: './twentyth-tab.component.html',
    styleUrls: ['./twentyth-tab.component.scss'],
    imports: [
        KENDO_TILELAYOUT,
        KENDO_BUTTON,
        GraphChartComponent,
        DisplayChartComponent,
        GaugeChartComponent,
        MetricChartComponent
    ]
})
export class TwentythTabComponent implements OnInit {
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 4 }).map((x) => new BehaviorSubject<boolean>(false));

  constructor(
    private suiviEncaissementCieClient: SuiviEncaissementCieClient,
    public suiviEncaissementCieService: SuiviEncaissementCieService,
    private windowService: WindowService,
    private destroyRef: DestroyRef
  ) {}

  editMode = false;

  expandCard(container: TemplateRef<any>, text: string) {
    this.windowService.open({
      height: 600,
      width: 1000,
      title: text,
      state: 'maximized',
      resizable: false,
      content: container,
    });
  }

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.suiviEncaissementCieService.formFilter.get(name);
  }

  ngOnInit(): void {
    this.suiviEncaissementCieService.suiviEncaissementCieFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviLotFilters | null) => {
        if (queryObject == null) return;
        const query = {
          filters: queryObject,
        };
        this.updateCompaniesEncaissement(query);
        this.updateTotalRetourRecu(query);
        this.updateTauxClotureEncaissementCie(query);
        this.updateSuiviEtatEncaissementCie(query);
      });
  }

  //Companies
  companiesIsLoading = false;
  companiesText: string[] | null = null;

  updateCompaniesEncaissement(query: IFilterRequest): void {
    this.suiviEncaissementCieClient
      .getCompaniesEncaissement('1.0', SuiviEncaissementCieFilters.fromJS(query.filters))
      .pipe(
        tap(() => (this.companiesIsLoading = true)),
        finalize(() => (this.companiesIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.companiesText = s;
      });
  }

  //TotalDossierRecu
  totalRetourRecuIsLoading = false;
  totalRetourRecuMetric: MetricDto | null = null;

  updateTotalRetourRecu(query: IFilterRequest): void {
    this.suiviEncaissementCieClient
      .getTotalRetourRecu('1.0', SuiviEncaissementCieFilters.fromJS(query.filters))
      .pipe(
        tap(() => (this.totalRetourRecuIsLoading = true)),
        finalize(() => (this.totalRetourRecuIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalRetourRecuMetric = s;
      });
  }

  //TauxClotureLotSinistre
  tauxClotureEncaissementCieIsLoading = false;
  tauxClotureEncaissementCieMetric: MetricDto | null = null;

  updateTauxClotureEncaissementCie(query: IFilterRequest): void {
    this.suiviEncaissementCieClient
      .getTauxClotureEncaissementCie('1.0', SuiviEncaissementCieFilters.fromJS(query.filters))
      .pipe(
        tap(() => (this.tauxClotureEncaissementCieIsLoading = true)),
        finalize(() => (this.tauxClotureEncaissementCieIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.tauxClotureEncaissementCieMetric = s;
      });
  }

  //SuiviEtatDossier
  suiviEtatEncaissementCieIsLoading = false;
  suiviEtatEncaissementCieGraph: GraphDto | null = null;

  updateSuiviEtatEncaissementCie(query: IFilterRequest): void {
    this.suiviEncaissementCieClient
      .getSuiviEtatEncaissementCie('1.0', SuiviEncaissementCieFilters.fromJS(query.filters))
      .pipe(
        tap(() => (this.suiviEtatEncaissementCieIsLoading = true)),
        finalize(() => (this.suiviEtatEncaissementCieIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.suiviEtatEncaissementCieGraph = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
