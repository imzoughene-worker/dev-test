import { Component, OnInit, TemplateRef } from '@angular/core';
import {
  AffiliationFilter,
  IAffiliationFilter,
  MetricDto,
  MultiGraphDto,
  PieChartDto,
  PopulationClientClient,
} from '@portals/client-reporting';
import { finalize, tap } from 'rxjs/operators';
import { BehaviorSubject, take } from 'rxjs';
import { PopulationClientService } from '../../services/population-client.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';

import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';
import { PieChartComponent } from '../../../charts/pie-chart/pie-chart.component';
import { MultigraphChartComponent } from '../../../charts/multigraph-chart/multigraph-chart.component';

interface IFilterRequest {
  filters: IAffiliationFilter;
}

@Component({
    selector: 'portals-first-tab',
    templateUrl: './first-tab.component.html',
    styleUrls: ['./first-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, MetricChartComponent, PieChartComponent, MultigraphChartComponent]
})
export class FirstTabComponent implements OnInit {
  constructor(
    private popClient: PopulationClientClient,
    public populationClientService: PopulationClientService,
    private windowService: WindowService
  ) {}

  editMode = false;
  hide: BehaviorSubject<boolean>[] = [
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
  ];

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
    this.populationClientService.affiliationFilters$.subscribe((queryObject: IAffiliationFilter | null) => {
      if (queryObject == null) return;
      const query = {
        filters: queryObject,
      };
      this.updateEffectifAdherentMetric(query);
      this.updateEffectifConjointMetric(query);
      this.updateEffectifEnfantMetric(query);
      this.updateTotalEffectifMetric(query);
      this.updateRepartitionParLien(query);
      this.updateLienParTrancheDage(query);
    });
  }

  //effectifAdherent
  effectifAdherentIsLoading = false;
  effectifAdherentMetric: MetricDto | null = null;

  updateEffectifAdherentMetric(query: IFilterRequest): void {
    this.popClient
      .getEffectifAdherent('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        take(1),
        tap(() => (this.effectifAdherentIsLoading = true)),
        finalize(() => (this.effectifAdherentIsLoading = false))
      )
      .subscribe((s) => {
        this.effectifAdherentMetric = s;
      });
  }

  //effectifConjoint
  effectifConjointIsLoading = false;
  effectifConjointMetric: MetricDto | null = null;

  updateEffectifConjointMetric(query: IFilterRequest): void {
    this.popClient
      .getEffectifConjoint('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        take(1),
        tap(() => (this.effectifConjointIsLoading = true)),
        finalize(() => (this.effectifConjointIsLoading = false))
      )
      .subscribe((s) => {
        this.effectifConjointMetric = s;
      });
  }

  //effectifEnfant
  effectifEnfantIsLoading = false;
  effectifEnfantMetric: MetricDto | null = null;

  updateEffectifEnfantMetric(query: IFilterRequest): void {
    this.popClient
      .getEffectifEnfant('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        take(1),
        tap(() => (this.effectifEnfantIsLoading = true)),
        finalize(() => (this.effectifEnfantIsLoading = false))
      )
      .subscribe((s) => {
        this.effectifEnfantMetric = s;
      });
  }

  //totalEffectif
  totalEffectifIsLoading = false;
  totalEffectifMetric: MetricDto | null = null;

  updateTotalEffectifMetric(query: IFilterRequest): void {
    this.popClient
      .getTotalEffectif('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        take(1),
        tap(() => (this.totalEffectifIsLoading = true)),
        finalize(() => (this.totalEffectifIsLoading = false))
      )
      .subscribe((s) => {
        this.totalEffectifMetric = s;
      });
  }

  //repartition par lien
  repartitionParLienIsLoading = false;
  repartitionParLienPieChart: PieChartDto | null = null;

  updateRepartitionParLien(query: IFilterRequest): void {
    this.popClient
      .getRepartitionParLien('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        take(1),
        tap(() => (this.repartitionParLienIsLoading = true)),
        finalize(() => (this.repartitionParLienIsLoading = false))
      )
      .subscribe((s) => {
        this.repartitionParLienPieChart = s;
      });
  }

  lienParTrancheAgeIsLoading = false;
  lienParTrancheAgeMultiGraph: MultiGraphDto | null = null;

  updateLienParTrancheDage(query: IFilterRequest): void {
    this.popClient
      .getLienParTrancheAge('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        take(1),
        tap(() => (this.lienParTrancheAgeIsLoading = true)),
        finalize(() => (this.lienParTrancheAgeIsLoading = false))
      )
      .subscribe((s) => {
        this.lienParTrancheAgeMultiGraph = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
