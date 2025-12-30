import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import {
  GraphDto,
  ISuiviSinistreFilters,
  MetricDto,
  SuiviLotFilters,
  SuiviSinistreClient,
  SuiviSinistreFilters,
} from '@portals/client-reporting';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { SuiviSinistreService } from '../../services/suivi-sinistre.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { EnvironmentService, MyUserService } from '@portals/base/core/core-component';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';

import { GraphChartComponent } from '../../../charts/graph-chart/graph-chart.component';
import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';
import { GaugeChartComponent } from '../../../charts/gauge-chart/gauge-chart.component';

interface IFilterRequest {
  filters: ISuiviSinistreFilters;
}

@Component({
    selector: 'portals-tenth-tab',
    templateUrl: './tenth-tab.component.html',
    styleUrls: ['./tenth-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, GraphChartComponent, MetricChartComponent, GaugeChartComponent]
})
export class TenthTabComponent implements OnInit {
  constructor(
    private suiviSinistreClient: SuiviSinistreClient,
    public suiviSinistreService: SuiviSinistreService,
    private windowService: WindowService
  ) {}

  editMode = false;
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 5 }).map((x) => new BehaviorSubject<boolean>(false));

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
      this.updateMontantTotalEngageDesDossierRembourser(query);
      this.updateMontantTotalRembourse(query);
      this.updateTauxRemboursementMoyen(query);
      this.updateTauxRemboursementMoyenSansComplementConjoint(query);
      this.updateDelaiMoyenDeTraitement(query);
      this.updateDelaiTraitementMoyenParTypeDeDossier(query);
    });
  }

  //MontantTotalRembourse
  montantTotalRembourseIsLoading = false;
  montantTotalRembourseMetric: MetricDto | null = null;

  updateMontantTotalRembourse(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getMontantTotalRembourse('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.montantTotalRembourseIsLoading = true)),
        finalize(() => (this.montantTotalRembourseIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.montantTotalRembourseMetric = s;
      });
  }

  //MontantTotalEngageDesDossierRembourser
  montantTotalEngageDesDossierRembourserIsLoading = false;
  montantTotalEngageDesDossierRembourserMetric: MetricDto | null = null;

  updateMontantTotalEngageDesDossierRembourser(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getMontantTotalEngageDesDossierRembourser(
        '1.0',
        SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] })
      )
      .pipe(
        tap(() => (this.montantTotalEngageDesDossierRembourserIsLoading = true)),
        finalize(() => (this.montantTotalEngageDesDossierRembourserIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.montantTotalEngageDesDossierRembourserMetric = s;
      });
  }

  //TauxRemboursementMoyen
  tauxRemboursementMoyenIsLoading = false;
  tauxRemboursementMoyenMetric: MetricDto | null = null;

  updateTauxRemboursementMoyen(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTauxRemboursementMoyen(
        '1.0',
        SuiviLotFilters.fromJS({
          ...query.filters,
          typeRetours: [],
          etatClients: [],
          thirdTags: [],
        })
      )
      .pipe(
        tap(() => (this.tauxRemboursementMoyenIsLoading = true)),
        finalize(() => (this.tauxRemboursementMoyenIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.tauxRemboursementMoyenMetric = s;
      });
  }

  //TauxRemboursementMoyenSansComplementConjoint
  tauxRemboursementMoyenSansComplementConjointIsLoading = false;
  tauxRemboursementMoyenSansComplementConjointMetric: MetricDto | null = null;

  updateTauxRemboursementMoyenSansComplementConjoint(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTauxRemboursementMoyenSansComplementConjoint(
        '1.0',
        SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] })
      )
      .pipe(
        tap(() => (this.tauxRemboursementMoyenSansComplementConjointIsLoading = true)),
        finalize(() => (this.tauxRemboursementMoyenSansComplementConjointIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.tauxRemboursementMoyenSansComplementConjointMetric = s;
      });
  }

  //DelaiMoyenDeTraitement
  delaiMoyenDeTraitementIsLoading = false;
  delaiMoyenDeTraitementMetric: MetricDto | null = null;

  updateDelaiMoyenDeTraitement(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getDelaiMoyenDeTraitement('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.delaiMoyenDeTraitementIsLoading = true)),
        finalize(() => (this.delaiMoyenDeTraitementIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.delaiMoyenDeTraitementMetric = s;
      });
  }

  //DelaiMoyenDeTraitement
  delaiTraitementMoyenParTypeDeDossierIsLoading = false;
  delaiTraitementMoyenParTypeDeDossierMetric: GraphDto | null = null;

  updateDelaiTraitementMoyenParTypeDeDossier(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getDelaiTraitementMoyenParTypeDeDossier(
        '1.0',
        SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] })
      )
      .pipe(
        tap(() => (this.delaiTraitementMoyenParTypeDeDossierIsLoading = true)),
        finalize(() => (this.delaiTraitementMoyenParTypeDeDossierIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.delaiTraitementMoyenParTypeDeDossierMetric = s;
      });
  }

  userService = inject(MyUserService);
  isSouscripteur = inject(EnvironmentService).isSouscripteurClient;

  checkAccess() {
    return this.userService.hasLevel('PSD', 2);
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
