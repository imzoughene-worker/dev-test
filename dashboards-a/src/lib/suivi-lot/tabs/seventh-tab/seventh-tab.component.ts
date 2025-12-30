import { Component, DestroyRef, OnInit, TemplateRef } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { EnvironmentService } from '@portals/base/core/core-component';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { SuiviLotService } from '../../services/suivi-lot.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import {
  GraphDto,
  ISuiviArrivageLotFilters,
  ISuiviLotFilters,
  MetricDto,
  SuiviArrivageLotFilters,
  SuiviLotClient,
  SuiviLotFilters,
} from '@portals/client-reporting';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';

import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';
import { GaugeChartComponent } from '../../../charts/gauge-chart/gauge-chart.component';
import { DisplayChartComponent } from '../../../charts/display-chart/display-chart/display-chart.component';
import { GraphChartComponent } from '../../../charts/graph-chart/graph-chart.component';
import { AppModeService } from '@portals/base/core/shared-services';

interface IFilterRequest {
  filters: ISuiviLotFilters | ISuiviArrivageLotFilters;
}

@Component({
    selector: 'portals-seventh-tab',
    templateUrl: './seventh-tab.component.html',
    styleUrls: ['./seventh-tab.component.scss'],
    imports: [
        KENDO_TILELAYOUT,
        KENDO_BUTTON,
        MetricChartComponent,
        GaugeChartComponent,
        DisplayChartComponent,
        GraphChartComponent
    ]
})
export class SeventhTabComponent implements OnInit {
  public isExterne: boolean | undefined;
  editMode = false;

  constructor(
    public suiviLotService: SuiviLotService,
    public suiviLotClient: SuiviLotClient,
    private env: EnvironmentService,
    private windowService: WindowService,
    private destroyRef: DestroyRef,
    private appModeService: AppModeService
  ) {
    this.isExterne = this.env.activePortalClient === 'portail-souscripteur' ? true : false;
  }

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.suiviLotService.formFilter.get(name);
  }

  appMode = this.appModeService.appMode;

  ngOnInit(): void {
    this.suiviLotService.suiviLotFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviLotFilters | null) => {
        if (queryObject == null) return;
        const query = {
          filters: queryObject,
        };
        this.updateCompanies(query);
        this.updateTotalDossierRecu(query);
        this.updateTotalDossierSaisi(query);
        this.updateTauxClotureLotSinistre(query);
        this.updateTauxRemboursementMoyen(query);
        this.updateSuiviEtatDossier(query);
        this.updateSuiviEtatClientDossier(query);
      });
  }

  hide: BehaviorSubject<boolean>[] = [
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
  ];

  expandCard(container: TemplateRef<any> | undefined, text: string) {
    this.windowService.open({
      height: 600,
      width: 1000,
      title: text,
      state: 'maximized',
      resizable: false,
      content: container,
    });
  }

  //Companies
  companiesIsLoading = false;
  companiesText: string[] | null = null;

  updateCompanies(query: IFilterRequest): void {
    this.suiviLotClient
      .getCompanies('1.0', SuiviLotFilters.fromJS({ ...query.filters, etatClients: [] }))
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
  totalDossierRecuIsLoading = false;
  totalDossierRecuMetric: MetricDto | null = null;

  updateTotalDossierRecu(query: IFilterRequest): void {
    this.suiviLotClient
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

  //TotalDossierRecu
  totalDossierSaisiIsLoading = false;
  totalDossierSaisiMetric: MetricDto | null = null;

  updateTotalDossierSaisi(query: IFilterRequest): void {
    this.suiviLotClient
      .getTotalDossierSaisi(
        '1.0',
        SuiviArrivageLotFilters.fromJS({
          ...query.filters,
          ecarts: [],
          totalSaisies: [],
          etatLots: [],
        })
      )
      .pipe(
        tap(() => (this.totalDossierSaisiIsLoading = true)),
        finalize(() => (this.totalDossierSaisiIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalDossierSaisiMetric = s;
      });
  }

  //TauxClotureLotSinistre
  tauxClotureLotSinistreIsLoading = false;
  tauxClotureLotSinistreMetric: MetricDto | null = null;

  updateTauxClotureLotSinistre(query: IFilterRequest): void {
    this.suiviLotClient
      .getTauxClotureLotSinistre('1.0', SuiviLotFilters.fromJS(query.filters))
      .pipe(
        tap(() => (this.tauxClotureLotSinistreIsLoading = true)),
        finalize(() => (this.tauxClotureLotSinistreIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.tauxClotureLotSinistreMetric = s;
      });
  }

  //TauxRemboursementMoyen
  tauxRemboursementMoyenIsLoading = false;
  tauxRemboursementMoyenMetric: MetricDto | null = null;

  updateTauxRemboursementMoyen(query: IFilterRequest): void {
    this.suiviLotClient
      .getTauxRemboursementMoyen('1.0', SuiviLotFilters.fromJS(query.filters))
      .pipe(
        tap(() => (this.tauxRemboursementMoyenIsLoading = true)),
        finalize(() => (this.tauxRemboursementMoyenIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.tauxRemboursementMoyenMetric = s;
      });
  }

  //SuiviEtatDossier
  suiviEtatDossierIsLoading = false;
  suiviEtatDossierGraph: GraphDto | null = null;

  updateSuiviEtatDossier(query: IFilterRequest): void {
    this.suiviLotClient
      .getSuiviEtatDossier('1.0', SuiviLotFilters.fromJS(query.filters))
      .pipe(
        tap(() => (this.suiviEtatDossierIsLoading = true)),
        finalize(() => (this.suiviEtatDossierIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.suiviEtatDossierGraph = s;
      });
  }

  //SuiviEtatDossier
  suiviEtatClientDossierIsLoading = false;
  suiviEtatClientDossierGraph: GraphDto | null = null;

  updateSuiviEtatClientDossier(query: IFilterRequest): void {
    this.suiviLotClient
      .getSuiviEtatClientDossier('1.0', SuiviLotFilters.fromJS(query.filters))
      .pipe(
        tap(() => (this.suiviEtatClientDossierIsLoading = true)),
        finalize(() => (this.suiviEtatClientDossierIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.suiviEtatClientDossierGraph = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
