import { Component, OnInit, TemplateRef } from '@angular/core';
import {
  ISuiviArrivageLotFilters,
  LineChartDto,
  MetricDto,
  SuiviArrivageLotClient,
  SuiviArrivageLotFilters,
} from '@portals/client-reporting';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { SuiviArrivageService } from '../../services/suivi-arrivage-lot.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';

import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';
import { KENDO_PROGRESSBAR } from '@progress/kendo-angular-progressbar';
import { KENDO_CHART } from '@progress/kendo-angular-charts';

interface IFilterRequest {
  filters: ISuiviArrivageLotFilters;
}

@Component({
    selector: 'portals-fifth-tab',
    templateUrl: './fifth-tab.component.html',
    styleUrls: ['./fifth-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, MetricChartComponent, KENDO_PROGRESSBAR, KENDO_CHART]
})
export class FifthTabComponent implements OnInit {
  constructor(
    private suiviArrivageLotClient: SuiviArrivageLotClient,
    public suiviArrivageService: SuiviArrivageService,
    private windowService: WindowService
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

  ngOnInit(): void {
    this.suiviArrivageService.suiviArrivageFilters$.subscribe((queryObject: ISuiviArrivageLotFilters | null) => {
      if (queryObject == null) return;
      const query = {
        filters: queryObject,
      };
      this.updateTotalDossierRecu(query);
      this.updateTotalPECRecu(query);
      this.updateNombreDossierParJour(query);
    });
  }

  hide: BehaviorSubject<boolean>[] = Array.from({ length: 5 }).map((x) => new BehaviorSubject<boolean>(false));

  //TotalDossierRecu
  totalDossierRecuIsLoading = false;
  totalDossierRecuMetric: MetricDto | null = null;

  updateTotalDossierRecu(query: IFilterRequest): void {
    this.suiviArrivageLotClient
      .getTotalDossierRecu('1.0', SuiviArrivageLotFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.totalDossierRecuIsLoading = true)),
        finalize(() => (this.totalDossierRecuIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalDossierRecuMetric = s;
      });
  }

  //TotalPECRecu
  totalPECRecuIsLoading = false;
  totalPECRecuMetric: MetricDto | null = null;

  updateTotalPECRecu(query: IFilterRequest): void {
    this.suiviArrivageLotClient
      .getTotalPECRecu('1.0', SuiviArrivageLotFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.totalPECRecuIsLoading = true)),
        finalize(() => (this.totalPECRecuIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalPECRecuMetric = s;
      });
  }

  //NOMBRE DOSSIER RECU PAR JOUR
  nombreDossierParJourIsLoading = false;
  nombreDossierParJourLine: LineChartDto | null = null;

  updateNombreDossierParJour(query: IFilterRequest): void {
    this.suiviArrivageLotClient
      .getNombreDossierParJour('1.0', SuiviArrivageLotFilters.fromJS(query.filters))
      .pipe(
        tap(() => (this.nombreDossierParJourIsLoading = true)),
        finalize(() => (this.nombreDossierParJourIsLoading = false)),
        take(1)
      )
      .subscribe((result: LineChartDto) => {
        result.title = 'Nombre de dossiers reçus par jour';
        this.nombreDossierParJourLine = result;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
