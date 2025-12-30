import { Component, OnInit, TemplateRef } from '@angular/core';
import {
  ISuiviSinistreFilters,
  MetricDto,
  SuiviArrivageLotFilters,
  SuiviSinistreClient,
  SuiviSinistreFilters,
} from '@portals/client-reporting';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { SuiviSinistreService } from '../../services/suivi-sinistre.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';

import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';

interface IFilterRequest {
  filters: ISuiviSinistreFilters;
}

@Component({
    selector: 'portals-ninth-tab',
    templateUrl: './ninth-tab.component.html',
    styleUrls: ['./ninth-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, MetricChartComponent]
})
export class NinthTabComponent implements OnInit {
  constructor(
    private suiviSinistreClient: SuiviSinistreClient,
    public suiviSinistreService: SuiviSinistreService,
    private windowService: WindowService
  ) {}

  editMode = false;
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 4 }).map((x) => new BehaviorSubject<boolean>(false));

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
    this.suiviSinistreService.suiviSinistreFilters$.subscribe((queryObject: ISuiviSinistreFilters | null) => {
      if (queryObject == null) return;
      const query = {
        filters: queryObject,
      };
      this.updateNombreLotArrivage(query);
      this.updateTotalDossierRecu(query);
      this.updateMontantTotalEngageDesDossierAvecRetour(query);
      this.updateMontantTotalEngageMoyen(query);
    });
  }

  //NombreLotArrivage
  nombreLotArrivageIsLoading = false;
  nombreLotArrivageMetric: MetricDto | null = null;

  updateNombreLotArrivage(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getNombreLotArrivage('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.nombreLotArrivageIsLoading = true)),
        finalize(() => (this.nombreLotArrivageIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.nombreLotArrivageMetric = s;
      });
  }

  //TotalDossierRecu
  totalDossierRecuIsLoading = false;
  totalDossierRecuMetric: MetricDto | null = null;

  updateTotalDossierRecu(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTotalDossierRecu(
        '1.0',
        SuiviArrivageLotFilters.fromJS({
          ...query.filters,
          ecarts: [],
          totalSaisies: [],
          etatLots: [],
        })
      )
      .pipe(
        tap(() => (this.totalDossierRecuIsLoading = true)),
        finalize(() => (this.totalDossierRecuIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalDossierRecuMetric = s;
      });
  }

  //MontantTotalEngageDesDossierAvecRetour
  montantTotalEngageDesDossierAvecRetourIsLoading = false;
  montantTotalEngageDesDossierAvecRetourMetric: MetricDto | null = null;

  updateMontantTotalEngageDesDossierAvecRetour(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getMontantTotalEngageDesDossierAvecRetour(
        '1.0',
        SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] })
      )
      .pipe(
        tap(() => (this.montantTotalEngageDesDossierAvecRetourIsLoading = true)),
        finalize(() => (this.montantTotalEngageDesDossierAvecRetourIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.montantTotalEngageDesDossierAvecRetourMetric = s;
      });
  }

  //MontantTotalEngageDesDossierMoyen
  montantTotalEngageMoyenIsLoading = false;
  montantTotalEngageMoyenMetric: MetricDto | null = null;

  updateMontantTotalEngageMoyen(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getMontantTotalEngageMoyen('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.montantTotalEngageMoyenIsLoading = true)),
        finalize(() => (this.montantTotalEngageMoyenIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.montantTotalEngageMoyenMetric = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
